/**
 * BACKEND FUNCTION: chat_send_message
 * Envoie un message dans une conversation UNIQUEMENT si participant
 * 
 * INPUT: { conversationId, body, clientMsgId? }
 * OUTPUT: { message }
 * ERRORS: 401, 403, 400, 429
 */

export default async function handler(req, context) {
  const { conversationId, body, clientMsgId } = req.body;
  
  // 1. AUTH
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
  
  // 3. LOAD CONVERSATION (serviceRole)
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
  
  // 4. AUTH CHECK - User MUST be participant
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
  
  // 5. IDEMPOTENCE - Check clientMsgId
  if (clientMsgId) {
    const existingMsgs = await serviceClient.entities.Message.filter({
      conversation_id: conversationId,
      from_user_id: userEmail
    }, '-created_date', 10);
    
    const duplicate = existingMsgs.find(m => m.body === trimmedBody);
    if (duplicate && (Date.now() - new Date(duplicate.created_date).getTime()) < 60000) {
      return {
        statusCode: 200,
        body: { message: duplicate, duplicate: true }
      };
    }
  }
  
  // 6. RATE LIMIT - 1 msg/sec
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
  
  // 7. DENORMALIZE PARTICIPANTS (FORCED from conversation)
  const participantA = conversation.user_a_id;
  const participantB = conversation.user_b_id;
  const toUserId = participantA === userEmail ? participantB : participantA;
  
  // 8. BASIC CONTENT CHECKS
  const containsUrl = /(https?:\/\/|www\.|\.com|\.fr|\.net|\.org)/i.test(trimmedBody);
  const containsPhone = /(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,})/.test(trimmedBody);
  
  // 9. CREATE MESSAGE (admin-only via serviceRole)
  try {
    const message = await serviceClient.entities.Message.create({
      conversation_id: conversationId,
      participant_a_id: participantA,
      participant_b_id: participantB,
      from_user_id: userEmail,
      to_user_id: toUserId,
      body: trimmedBody,
      contains_link: containsUrl,
      contains_phone: containsPhone,
      moderation_status: 'clean'
    });
    
    // 10. UPDATE CONVERSATION
    await serviceClient.entities.Conversation.update(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: trimmedBody.substring(0, 100),
      message_count: (conversation.message_count || 0) + 1
    }).catch(() => {}); // Non-blocking
    
    return {
      statusCode: 200,
      body: { message }
    };
    
  } catch (error) {
    console.error('[chat_send_message] Error creating message:', error);
    return {
      statusCode: 500,
      body: { error: 'Erreur envoi message', details: error.message }
    };
  }
}