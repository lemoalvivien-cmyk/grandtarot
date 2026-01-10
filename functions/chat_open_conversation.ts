/**
 * BACKEND FUNCTION: chat_open_conversation
 * Ouvre/récupère une conversation sécurisée entre 2 utilisateurs
 * 
 * SÉCURITÉ:
 * - Exige Intention MUTUELLE accepted (A->B ET B->A)
 * - Vérifie absence de Block
 * - Utilise serviceRole pour bypass admin-only create
 * - Canonise user_a/user_b pour éviter doublons
 */

export default async function handler(req, context) {
  const { otherUserEmail } = req.body;
  
  // STEP 1: AUTH - Récupérer user côté serveur (TRUSTED)
  const client = context.createClientFromRequest(req);
  let currentUser;
  try {
    currentUser = await client.auth.me();
  } catch (error) {
    return {
      statusCode: 401,
      body: { error: 'Non authentifié' }
    };
  }
  
  const userEmail = currentUser.email; // TRUSTED SOURCE
  
  // STEP 2: VALIDATION INPUT
  if (!otherUserEmail || typeof otherUserEmail !== 'string') {
    return {
      statusCode: 400,
      body: { error: 'otherUserEmail requis' }
    };
  }
  
  if (userEmail === otherUserEmail) {
    return {
      statusCode: 400,
      body: { error: 'Impossible de créer une conversation avec soi-même' }
    };
  }
  
  // STEP 3: AUTORISATION - Vérifier Intention accepted MUTUELLE
  const serviceClient = context.createServiceRoleClient();
  
  try {
    // Chercher Intention A->B accepted
    const intentionsAtoB = await serviceClient.entities.Intention.filter({
      from_user_id: userEmail,
      to_user_id: otherUserEmail,
      status: 'accepted'
    }, null, 1);
    
    // Chercher Intention B->A accepted
    const intentionsBtoA = await serviceClient.entities.Intention.filter({
      from_user_id: otherUserEmail,
      to_user_id: userEmail,
      status: 'accepted'
    }, null, 1);
    
    // EXIGENCE MUTUELLE: les DEUX intentions doivent être accepted
    const hasMutualAuthorization = intentionsAtoB.length > 0 && intentionsBtoA.length > 0;
    
    if (!hasMutualAuthorization) {
      return {
        statusCode: 403,
        body: { error: 'Autorisation mutuelle requise (les deux Intentions doivent être acceptées)' }
      };
    }
    
    // STEP 3.5: Vérifier qu'aucun Block n'existe
    const blocksAB = await serviceClient.entities.Block.filter({
      blocker_profile_id: userEmail,
      blocked_profile_id: otherUserEmail
    }, null, 1);
    
    const blocksBA = await serviceClient.entities.Block.filter({
      blocker_profile_id: otherUserEmail,
      blocked_profile_id: userEmail
    }, null, 1);
    
    if (blocksAB.length > 0 || blocksBA.length > 0) {
      return {
        statusCode: 403,
        body: { error: 'Conversation bloquée entre ces utilisateurs' }
      };
    }
    
    // STEP 4: CHERCHER/CRÉER CONVERSATION (ordre canonique pour éviter doublons)
    const [user_a, user_b] = [userEmail, otherUserEmail].sort(); // Tri lexical
    
    // Chercher conversation existante
    let conversations = await serviceClient.entities.Conversation.filter({
      user_a_id: user_a,
      user_b_id: user_b
    }, null, 1);
    
    let conversation;
    
    if (conversations.length > 0) {
      conversation = conversations[0];
    } else {
      // Créer conversation (admin-only via serviceRole)
      const intentionAtoB = intentionsAtoB[0];
      const mode = intentionAtoB?.mode || 'love';
      
      conversation = await serviceClient.entities.Conversation.create({
        user_a_id: user_a,
        user_b_id: user_b,
        mode: mode,
        origin_intention_id: intentionAtoB.id,
        status: 'active',
        message_count: 0,
        unread_count_a: 0,
        unread_count_b: 0
      });
    }
    
    // STEP 5: AUDIT LOG
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'conversation_started',
      entity_name: 'Conversation',
      entity_id: conversation.id,
      payload_summary: `Conversation opened with ${otherUserEmail}`,
      status: 'success'
    }).catch(() => {}); // Non-blocking
    
    return {
      statusCode: 200,
      body: { conversationId: conversation.id }
    };
    
  } catch (error) {
    console.error('[chat_open_conversation] Error:', error);
    return {
      statusCode: 500,
      body: { error: 'Erreur serveur', details: error.message }
    };
  }
}