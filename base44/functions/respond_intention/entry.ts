/**
 * respond_intention — Backend function pour répondre aux intentions
 * Sécurité: vérifie que to_user_id === currentUser.email, gère accept/refuse côté serveur
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 20 réponses/heure
    if (!checkRateLimit(`respond_intention:${currentUser.email}`, 20, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    const body = await req.json();
    const { intentionId, action } = body;

    if (!intentionId || !['accept', 'refuse'].includes(action)) {
      return Response.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // Charger l'intention
    const intentions = await serviceRole.entities.Intention.filter({ id: intentionId }, null, 1);

    if (!intentions.length) {
      return Response.json({ error: 'Intention introuvable' }, { status: 404 });
    }

    const intention = intentions[0];

    // Vérifier que currentUser est le destinataire
    if (intention.to_user_id !== currentUser.email) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que l'intention est pending
    if (intention.status !== 'pending') {
      return Response.json({ error: 'Intention non pending' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // ACCEPT: mettre à jour statut et créer la conversation
      await serviceRole.entities.Intention.update(intentionId, {
        status: 'accepted',
        responded_at: now
      });

      // Créer/récupérer la conversation
      const [user_a, user_b] = [intention.from_user_id, currentUser.email].sort();

      // Vérifier les blocks
      const [fromAccount, toAccount] = await Promise.all([
        serviceRole.entities.AccountPrivate.filter({ user_email: intention.from_user_id }, null, 1),
        serviceRole.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1)
      ]);

      const fromPublicId = fromAccount[0]?.public_profile_id;
      const toPublicId = toAccount[0]?.public_profile_id;

      if (fromPublicId && toPublicId) {
        const [blocksAB, blocksBA] = await Promise.all([
          serviceRole.entities.Block.filter({
            blocker_profile_id: fromPublicId,
            blocked_profile_id: toPublicId
          }, null, 1),
          serviceRole.entities.Block.filter({
            blocker_profile_id: toPublicId,
            blocked_profile_id: fromPublicId
          }, null, 1)
        ]);

        if (blocksAB.length > 0 || blocksBA.length > 0) {
          return Response.json({ error: 'Conversation bloquée' }, { status: 403 });
        }
      }

      const existing = await serviceRole.entities.Conversation.filter({
        user_a_id: user_a,
        user_b_id: user_b
      }, null, 1);

      let conversation;
      if (existing.length > 0) {
        conversation = existing[0];
      } else {
        conversation = await serviceRole.entities.Conversation.create({
          user_a_id: user_a,
          user_b_id: user_b,
          mode: intention.mode || 'love',
          origin_intention_id: intentionId,
          status: 'active',
          message_count: 0,
          unread_count_a: 0,
          unread_count_b: 0
        });
      }

      // Audit log
      serviceRole.entities.AuditLog.create({
        actor_user_id: currentUser.email,
        actor_role: 'user',
        action: 'intention_accepted',
        entity_name: 'Intention',
        entity_id: intentionId,
        payload_summary: `Intention acceptée`,
        status: 'success'
      }).catch(e => console.error('[respond_intention] AuditLog error:', e));

      return Response.json({
        success: true,
        conversationId: conversation.id
      });

    } else {
      // REFUSE: mettre à jour statut et appliquer cooldown si needed
      await serviceRole.entities.Intention.update(intentionId, {
        status: 'refused',
        responded_at: now
      });

      // Appliquer cooldown si 3+ refusals en 24h
      try {
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const recentRefusals = await serviceRole.entities.Intention.filter({
          from_user_id: intention.from_user_id,
          status: 'refused',
          responded_at: { $gte: oneDayAgo.toISOString() }
        }, '-responded_at', 10);

        if (recentRefusals.length >= 3) {
          // Apply 24h cooldown
          const cooldownUntil = new Date();
          cooldownUntil.setHours(cooldownUntil.getHours() + 24);

          await serviceRole.entities.AccountPrivate.filter({ user_email: intention.from_user_id }, null, 1).then(accts => {
            if (accts.length > 0) {
              serviceRole.entities.AccountPrivate.update(accts[0].id, {
                cooldown_until: cooldownUntil.toISOString()
              });
            }
          });
        }
      } catch (e) {
        console.error('[respond_intention] Cooldown error:', e);
        // Non-blocking: refusal recorded even if cooldown fails
      }

      // Audit log
      serviceRole.entities.AuditLog.create({
        actor_user_id: currentUser.email,
        actor_role: 'user',
        action: 'intention_refused',
        entity_name: 'Intention',
        entity_id: intentionId,
        payload_summary: `Intention refusée`,
        status: 'success'
      }).catch(e => console.error('[respond_intention] AuditLog error:', e));

      return Response.json({
        success: true
      });
    }

  } catch (error) {
    console.error('[respond_intention] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});