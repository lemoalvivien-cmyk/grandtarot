/**
 * BACKEND FUNCTION: chat_send_message
 * Envoie un message sécurisé dans une conversation
 * 
 * SÉCURITÉ:
 * - Vérifie participant (403 sinon)
 * - Ignore TOUS les champs injectés (from_user_id, to_user_id, participant_*)
 * - Force les valeurs depuis auth.me() + conversation
 * - Rate limit 1 msg/sec (query limit=1)
 * - Idempotence clientMsgId (query limit=5)
 * - Utilise serviceRole pour bypass admin-only create
 */

export default async function handler(req, context) {
  const { conversationId, body, clientMsgId, ...injectedFields } = req.body;
  
  // STEP 1: AUTH - Récupérer user TRUSTED côté serveur (JAMAIS du client)
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
  
  // ANTI-SPOOF: Ignorer TOUS les champs injectés (from_user_id, to_user_id, participant_*)
  if (Object.keys(injectedFields).length > 0) {
    console.warn(`[SECURITY] Ignored injected fields:`, Object.keys(injectedFields));
  }
  
  // STEP 2: VALIDATION INPUT (strict)
  if (!conversationId || typeof conversationId !== 'string') {
    return {
      statusCode: 400,
      body: { error: 'conversationId requis' }
    };
  }
  
  if (!body || typeof body !== 'string') {
    return {
      statusCode: 400,
      body: { error: 'body requis' }
    };
  }
  
  const trimmedBody = body.trim();
  
  if (trimmedBody.length === 0) {
    return {
      statusCode: 400,
      body: { error: 'Message vide' }
    };
  }
  
  if (trimmedBody.length > 2000) {
    return {
      statusCode: 400,
      body: { error: 'Message trop long (max 2000 chars)' }
    };
  }
  
  // STEP 3: LOAD CONVERSATION (via serviceRole - bypass accessRules)
  const serviceClient = context.createServiceRoleClient();
  
  let conversation;
  try {
    const convs = await serviceClient.entities.Conversation.filter({ id: conversationId }, null, 1);
    if (convs.length === 0) {
      return {
        statusCode: 404,
        body: { error: 'Conversation introuvable' }
      };
    }
    conversation = convs[0];
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: 'Erreur chargement conversation', details: error.message }
    };
  }
  
  // STEP 4: AUTH CHECK - User MUST be participant (STRICT)
  const isParticipant = 
    conversation.user_a_id === userEmail || 
    conversation.user_b_id === userEmail;
  
  if (!isParticipant) {
    // Log security violation
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'message_sent',
      entity_name: 'Message',
      payload_summary: `SECURITY: User attempted to send message in conversation ${conversationId} (not participant)`,
      severity: 'critical',
      status: 'failed'
    }).catch(() => {});
    
    return {
      statusCode: 403,
      body: { error: 'Non autorisé - Vous n\'êtes pas participant de cette conversation' }
    };
  }
  
  // STEP 5: IDEMPOTENCE - Check clientMsgId (1min window)
  if (clientMsgId) {
    const existingMsgs = await serviceClient.entities.Message.filter({
      conversation_id: conversationId,
      from_user_id: userEmail
    }, '-created_date', 5);
    
    const duplicate = existingMsgs.find(m => 
      m.body === trimmedBody && 
      (Date.now() - new Date(m.created_date).getTime()) < 60000
    );
    
    if (duplicate) {
      return {
        statusCode: 200,
        body: { message: duplicate, duplicate: true }
      };
    }
  }
  
  // STEP 6: RATE LIMIT - 1 msg/sec (SCOPED query, limit=1)
  const recentMsgs = await serviceClient.entities.Message.filter({
    conversation_id: conversationId,
    from_user_id: userEmail
  }, '-created_date', 1);
  
  if (recentMsgs.length > 0) {
    const lastMsgTime = new Date(recentMsgs[0].created_date).getTime();
    const timeSinceLastMsg = Date.now() - lastMsgTime;
    
    if (timeSinceLastMsg < 1000) {
      return {
        statusCode: 429,
        body: { error: 'Trop rapide - Attendez 1 seconde entre chaque message' }
      };
    }
  }
  
  // STEP 7: DENORMALIZE PARTICIPANTS (FORCED from conversation, NEVER from client)
  const participantA = conversation.user_a_id;
  const participantB = conversation.user_b_id;
  const toUserId = participantA === userEmail ? participantB : participantA;
  
  // STEP 8: BASIC CONTENT CHECKS
  const containsUrl = /(https?:\/\/|www\.|\.com|\.fr|\.net|\.org)/i.test(trimmedBody);
  const containsPhone = /(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,})/.test(trimmedBody);
  
  // STEP 9: CREATE MESSAGE (admin-only via serviceRole - bypasses accessRules)
  try {
    const message = await serviceClient.entities.Message.create({
      conversation_id: conversationId,
      participant_a_id: participantA,    // FORCED from conversation
      participant_b_id: participantB,    // FORCED from conversation
      from_user_id: userEmail,           // FORCED from auth.me()
      to_user_id: toUserId,              // CALCULATED server-side
      body: trimmedBody,
      contains_link: containsUrl,
      contains_phone: containsPhone,
      moderation_status: 'clean'
    });
    
    // STEP 10: UPDATE CONVERSATION (via serviceRole - bypasses admin-only update)
    await serviceClient.entities.Conversation.update(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: trimmedBody.substring(0, 100),
      message_count: (conversation.message_count || 0) + 1
    }).catch(() => {}); // Non-blocking
    
    // STEP 11: AUDIT LOG
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'message_sent',
      entity_name: 'Message',
      entity_id: message.id,
      payload_summary: `Message sent in conversation ${conversationId}`,
      status: 'success'
    }).catch(() => {}); // Non-blocking
    
    return {
      statusCode: 200,
      body: { message, duplicate: false }
    };
    
  } catch (error) {
    console.error('[chat_send_message] Error:', error);
    return {
      statusCode: 500,
      body: { error: 'Erreur création message', details: error.message }
    };
  }
}