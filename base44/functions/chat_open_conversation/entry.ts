/**
 * chat_open_conversation — Base44 V3
 * Ouvre/récupère une conversation après acceptation d'Intention.
 * Sécurité : exige qu'une Intention A→B soit accepted (status=accepted),
 * vérifie l'absence de Block, crée la Conversation via serviceRole.
 * Rate limit: 10 ouvertures / 5 min par utilisateur.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const _rlStore = new Map();
function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = _rlStore.get(key) || { calls: [] };
  entry.calls = entry.calls.filter(t => now - t < windowMs);
  if (entry.calls.length >= max) {
    _rlStore.set(key, entry);
    return false;
  }
  entry.calls.push(now);
  _rlStore.set(key, entry);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // STEP 1: AUTH
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userEmail = currentUser.email;

    // STEP 1b: RATE LIMIT — max 10 ouvertures/5min
    if (!checkRateLimit(`openconv:${userEmail}`, 10, 5 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 5 minutes' }, { status: 429 });
    }

    // STEP 2: VALIDATION INPUT
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }
    const { otherUserEmail } = body;
    if (!otherUserEmail || typeof otherUserEmail !== 'string') {
      return Response.json({ error: 'otherUserEmail requis' }, { status: 400 });
    }
    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otherUserEmail)) {
      return Response.json({ error: 'Format email invalide' }, { status: 400 });
    }
    if (userEmail === otherUserEmail) {
      return Response.json({ error: 'Impossible de créer une conversation avec soi-même' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // STEP 3: VÉRIFIER QU'UNE INTENTION accepted existe (A→B ou B→A)
    const [intentionsAtoB, intentionsBtoA] = await Promise.all([
      serviceRole.entities.Intention.filter({
        from_user_id: userEmail,
        to_user_id: otherUserEmail,
        status: 'accepted'
      }, null, 1),
      serviceRole.entities.Intention.filter({
        from_user_id: otherUserEmail,
        to_user_id: userEmail,
        status: 'accepted'
      }, null, 1)
    ]);

    const hasAuthorization = intentionsAtoB.length > 0 || intentionsBtoA.length > 0;
    if (!hasAuthorization) {
      return Response.json({ error: 'Aucune intention acceptée entre ces utilisateurs' }, { status: 403 });
    }

    // STEP 4: VÉRIFICATION BLOCK via AccountPrivate.public_profile_id
    const [currentAccount, otherAccount] = await Promise.all([
      serviceRole.entities.AccountPrivate.filter({ user_email: userEmail }, null, 1),
      serviceRole.entities.AccountPrivate.filter({ user_email: otherUserEmail }, null, 1)
    ]);

    const currentPublicId = currentAccount[0]?.public_profile_id;
    const otherPublicId = otherAccount[0]?.public_profile_id;

    if (currentPublicId && otherPublicId) {
      const [blocksAB, blocksBA] = await Promise.all([
        serviceRole.entities.Block.filter({
          blocker_profile_id: currentPublicId,
          blocked_profile_id: otherPublicId
        }, null, 1),
        serviceRole.entities.Block.filter({
          blocker_profile_id: otherPublicId,
          blocked_profile_id: currentPublicId
        }, null, 1)
      ]);

      if (blocksAB.length > 0 || blocksBA.length > 0) {
        return Response.json({ error: 'Conversation bloquée entre ces utilisateurs' }, { status: 403 });
      }
    }

    // STEP 5: CHERCHER/CRÉER CONVERSATION (ordre canonique pour éviter doublons)
    const [user_a, user_b] = [userEmail, otherUserEmail].sort();
    const existing = await serviceRole.entities.Conversation.filter({
      user_a_id: user_a,
      user_b_id: user_b
    }, null, 1);

    let conversation;
    if (existing.length > 0) {
      conversation = existing[0];
    } else {
      const intentionRef = intentionsAtoB[0] || intentionsBtoA[0];
      conversation = await serviceRole.entities.Conversation.create({
        user_a_id: user_a,
        user_b_id: user_b,
        mode: intentionRef?.mode || 'love',
        origin_intention_id: intentionRef?.id || null,
        status: 'active',
        message_count: 0,
        unread_count_a: 0,
        unread_count_b: 0
      });
    }

    // STEP 6: AUDIT LOG
    serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'conversation_started',
      entity_name: 'Conversation',
      entity_id: conversation.id,
      payload_summary: `Conversation ouverte`,
      status: 'success'
    }).catch((e) => console.error('[chat_open_conversation] AuditLog error:', e));

    return Response.json({ conversationId: conversation.id });

  } catch (error) {
    console.error('[chat_open_conversation] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});