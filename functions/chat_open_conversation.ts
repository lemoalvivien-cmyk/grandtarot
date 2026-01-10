/**
 * BACKEND FUNCTION: chat_open_conversation
 * Crée ou retourne une conversation UNIQUEMENT si autorisation validée
 * 
 * INPUT: { otherUserEmail }
 * OUTPUT: { conversationId }
 * ERRORS: 401, 403, 400
 */

export default async function handler(req, context) {
  const { otherUserEmail } = req.body;
  
  // 1. AUTH - Récupérer user authentifié
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
  
  const userEmail = currentUser.email;
  
  // 2. VALIDATION INPUT
  if (!otherUserEmail || typeof otherUserEmail !== 'string') {
    return {
      statusCode: 400,
      body: { error: 'otherUserEmail requis' }
    };
  }
  
  if (otherUserEmail === userEmail) {
    return {
      statusCode: 400,
      body: { error: 'Impossible de converser avec soi-même' }
    };
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(otherUserEmail)) {
    return {
      statusCode: 400,
      body: { error: 'Format email invalide' }
    };
  }
  
  // 3. AUTORISATION - Vérifier Intention accepted mutual
  const serviceClient = context.createServiceRoleClient();
  
  try {
    // Chercher Intention A->B accepted
    const intentionsAtoB = await serviceClient.entities.Intention.filter({
      from_user_id: userEmail,
      to_user_id: otherUserEmail,
      status: 'accepted'
    }, null, 1);
    
    // Chercher Intention B->A accepted (mutuelle)
    const intentionsBtoA = await serviceClient.entities.Intention.filter({
      from_user_id: otherUserEmail,
      to_user_id: userEmail,
      status: 'accepted'
    }, null, 1);
    
    // Au moins UNE intention accepted requise
    const hasAuthorization = intentionsAtoB.length > 0 || intentionsBtoA.length > 0;
    
    if (!hasAuthorization) {
      return {
        statusCode: 403,
        body: { error: 'Aucune autorisation de conversation (Intention non acceptée)' }
      };
    }
    
    // 4. CHERCHER/CRÉER CONVERSATION (ordre canonique)
    const [user_a, user_b] = [userEmail, otherUserEmail].sort();
    
    // Chercher conversation existante
    const existingConvs = await serviceClient.entities.Conversation.filter({
      user_a_id: user_a,
      user_b_id: user_b
    }, null, 1);
    
    if (existingConvs.length > 0) {
      return {
        statusCode: 200,
        body: { conversationId: existingConvs[0].id }
      };
    }
    
    // Créer nouvelle conversation (admin-only via serviceRole)
    const intentionOrigin = intentionsAtoB[0] || intentionsBtoA[0];
    const newConv = await serviceClient.entities.Conversation.create({
      user_a_id: user_a,
      user_b_id: user_b,
      mode: intentionOrigin?.mode || 'love',
      origin_intention_id: intentionOrigin?.id || null,
      status: 'active'
    });
    
    // Log audit
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'conversation_started',
      entity_name: 'Conversation',
      entity_id: newConv.id,
      payload_summary: `Conversation started with ${otherUserEmail}`,
      severity: 'info',
      status: 'success'
    }).catch(() => {}); // Ignore si échec
    
    return {
      statusCode: 200,
      body: { conversationId: newConv.id }
    };
    
  } catch (error) {
    console.error('[chat_open_conversation] Error:', error);
    return {
      statusCode: 500,
      body: { error: 'Erreur serveur', details: error.message }
    };
  }
}