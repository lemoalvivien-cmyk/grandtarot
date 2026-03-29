/**
 * create_intention — Backend function sécurisée
 * Crée une Intention avec validation serveur complète.
 * Remplace Intention.create() côté client.
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

    // 1. AUTH SERVEUR
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userEmail = currentUser.email;

    // 2. RATE LIMIT — max 10 intentions/heure
    if (!checkRateLimit(`intention:${userEmail}`, 10, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    // 3. VALIDATION INPUT
    let body;
    try { body = await req.json(); } catch {
      return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const { targetPublicProfileId, message, mode } = body;
    if (!targetPublicProfileId || typeof targetPublicProfileId !== 'string') {
      return Response.json({ error: 'targetPublicProfileId requis' }, { status: 400 });
    }
    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message requis' }, { status: 400 });
    }
    const trimmedMessage = message.trim().replace(/<[^>]*>/g, '').replace(/\0/g, '');
    if (trimmedMessage.length < 20 || trimmedMessage.length > 500) {
      return Response.json({ error: 'Message : 20 à 500 caractères requis' }, { status: 400 });
    }
    if (!mode || !['love', 'friendship', 'professional'].includes(mode)) {
      return Response.json({ error: 'Mode invalide' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // 4. VÉRIFIER ABONNEMENT ACTIF (plan_status = 'active')
    const senderAccounts = await serviceRole.entities.AccountPrivate.filter({ user_email: userEmail }, null, 1);
    if (!senderAccounts.length || senderAccounts[0].plan_status !== 'active') {
      return Response.json({ error: 'Abonnement requis' }, { status: 403 });
    }

    // 5. VÉRIFIER QUOTA QUOTIDIEN (max 5/jour) CÔTÉ SERVEUR
    const senderProfiles = await serviceRole.entities.UserProfile.filter({ user_id: userEmail }, null, 1);
    if (!senderProfiles.length) {
      return Response.json({ error: 'Profil utilisateur introuvable' }, { status: 404 });
    }
    const senderProfile = senderProfiles[0];
    const today = new Date().toISOString().split('T')[0];

    // Reset du compteur si nouveau jour
    let intentionsToday = senderProfile.intentions_sent_today || 0;
    if (senderProfile.last_intention_reset !== today) {
      intentionsToday = 0;
    }
    if (intentionsToday >= 5) {
      return Response.json({ error: 'Quota atteint : 5 intentions maximum par jour' }, { status: 429 });
    }

    // 6. VÉRIFIER COOLDOWN CÔTÉ SERVEUR
    if (senderProfile.cooldown_until) {
      const cooldownEnd = new Date(senderProfile.cooldown_until);
      if (cooldownEnd > new Date()) {
        const hoursLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60));
        return Response.json({ error: `Cooldown actif — ${hoursLeft}h restantes` }, { status: 429 });
      }
    }

    // 7. RÉSOUDRE targetPublicProfileId → email via serviceRole
    const targetAccounts = await serviceRole.entities.AccountPrivate.filter({
      public_profile_id: targetPublicProfileId
    }, null, 1);
    if (!targetAccounts.length) {
      return Response.json({ error: 'Profil cible introuvable' }, { status: 404 });
    }
    const targetEmail = targetAccounts[0].user_email;

    if (targetEmail === userEmail) {
      return Response.json({ error: 'Impossible de s\'envoyer une intention à soi-même' }, { status: 400 });
    }

    // 8. VÉRIFIER BLOCK
    const senderPublicId = senderAccounts[0].public_profile_id;
    if (senderPublicId) {
      const [blocksAB, blocksBA] = await Promise.all([
        serviceRole.entities.Block.filter({ blocker_profile_id: senderPublicId, blocked_profile_id: targetPublicProfileId }, null, 1),
        serviceRole.entities.Block.filter({ blocker_profile_id: targetPublicProfileId, blocked_profile_id: senderPublicId }, null, 1)
      ]);
      if (blocksAB.length > 0 || blocksBA.length > 0) {
        return Response.json({ error: 'Interaction bloquée' }, { status: 403 });
      }
    }

    // 9. VÉRIFIER PAS DE DOUBLON (même expéditeur → même destinataire en pending)
    const existingPending = await serviceRole.entities.Intention.filter({
      from_user_id: userEmail,
      to_user_id: targetEmail,
      status: 'pending'
    }, null, 1);
    if (existingPending.length > 0) {
      return Response.json({ error: 'Une intention est déjà en attente vers cet utilisateur' }, { status: 409 });
    }

    // 10. CRÉER L'INTENTION via serviceRole
    const intention = await serviceRole.entities.Intention.create({
      from_user_id: userEmail,
      to_user_id: targetEmail,
      mode: mode,
      message: trimmedMessage,
      status: 'pending',
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    });

    // 11. INCRÉMENTER COMPTEUR via serviceRole
    await serviceRole.entities.UserProfile.update(senderProfile.id, {
      intentions_sent_today: intentionsToday + 1,
      last_intention_reset: today
    });

    // 12. AUDIT LOG
    serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'intention_sent',
      entity_name: 'Intention',
      entity_id: intention.id,
      payload_summary: `Intention envoyée vers ${targetPublicProfileId}`,
      severity: 'info',
      status: 'success'
    }).catch(() => {});

    return Response.json({ success: true, intentionId: intention.id });

  } catch (error) {
    console.error('[create_intention] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});