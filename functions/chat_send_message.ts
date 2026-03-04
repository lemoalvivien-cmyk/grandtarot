/**
 * chat_send_message — Base44 V3
 * Envoie un message sécurisé dans une conversation.
 * Sécurité : auth serveur, vérification participant, rate-limit, idempotence.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // STEP 1: AUTH
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userEmail = currentUser.email;

    // STEP 2: VALIDATION INPUT
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const { conversationId, body: msgBody, clientMsgId } = body;
    if (!conversationId || typeof conversationId !== 'string') {
      return Response.json({ error: 'conversationId requis' }, { status: 400 });
    }
    if (!msgBody || typeof msgBody !== 'string') {
      return Response.json({ error: 'body requis' }, { status: 400 });
    }
    const trimmedBody = msgBody.trim();
    if (trimmedBody.length === 0) {
      return Response.json({ error: 'Message vide' }, { status: 400 });
    }
    if (trimmedBody.length > 2000) {
      return Response.json({ error: 'Message trop long (max 2000 chars)' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // STEP 3: CHARGER CONVERSATION
    const convs = await serviceRole.entities.Conversation.filter({ id: conversationId }, null, 1);
    if (!convs.length) {
      return Response.json({ error: 'Conversation introuvable' }, { status: 404 });
    }
    const conversation = convs[0];

    // STEP 4: VÉRIFIER QUE L'USER EST PARTICIPANT
    const isParticipant = conversation.user_a_id === userEmail || conversation.user_b_id === userEmail;
    if (!isParticipant) {
      serviceRole.entities.AuditLog.create({
        actor_user_id: userEmail,
        actor_role: 'user',
        action: 'message_sent',
        entity_name: 'Message',
        payload_summary: `SÉCURITÉ: tentative envoi dans conversation ${conversationId} (non-participant)`,
        severity: 'critical',
        status: 'failed'
      }).catch(() => {});
      return Response.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // STEP 5: IDEMPOTENCE via client_msg_id
    if (clientMsgId && typeof clientMsgId === 'string' && clientMsgId.trim().length > 0) {
      const existing = await serviceRole.entities.Message.filter({
        conversation_id: conversationId,
        from_user_id: userEmail,
        client_msg_id: clientMsgId
      }, null, 1);
      if (existing.length > 0) {
        return Response.json({ message: existing[0], duplicate: true });
      }
    }

    // STEP 6: RATE LIMIT (1 msg/sec)
    const recent = await serviceRole.entities.Message.filter({
      conversation_id: conversationId,
      from_user_id: userEmail
    }, '-created_date', 1);
    if (recent.length > 0) {
      const timeSince = Date.now() - new Date(recent[0].created_date).getTime();
      if (timeSince < 1000) {
        return Response.json({ error: 'Trop rapide — attendez 1 seconde' }, { status: 429 });
      }
    }

    // STEP 7: DÉTECTER LIENS/TÉLÉPHONES
    const containsUrl = /(https?:\/\/|www\.|\.com|\.fr|\.net|\.org)/i.test(trimmedBody);
    const containsPhone = /(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,})/.test(trimmedBody);
    const toUserId = conversation.user_a_id === userEmail
      ? conversation.user_b_id
      : conversation.user_a_id;

    // STEP 8: CRÉER MESSAGE
    const message = await serviceRole.entities.Message.create({
      conversation_id: conversationId,
      participant_a_id: conversation.user_a_id,
      participant_b_id: conversation.user_b_id,
      from_user_id: userEmail,
      to_user_id: toUserId,
      body: trimmedBody,
      client_msg_id: clientMsgId || null,
      contains_link: containsUrl,
      contains_phone: containsPhone,
      moderation_status: 'clean'
    });

    // STEP 9: METTRE À JOUR CONVERSATION (non-bloquant)
    serviceRole.entities.Conversation.update(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: trimmedBody.substring(0, 100),
      message_count: (conversation.message_count || 0) + 1
    }).catch(() => {});

    return Response.json({ message, duplicate: false });

  } catch (error) {
    return Response.json({ error: 'Erreur création message', details: error.message }, { status: 500 });
  }
});