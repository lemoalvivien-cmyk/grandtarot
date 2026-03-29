/**
 * block_user — Backend function pour bloquer un utilisateur
 * Sécurité: vérifie les public_profile_id, crée Block, archive Conversations
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

    // Rate limit: 10 blocks/heure
    if (!checkRateLimit(`block_user:${currentUser.email}`, 10, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    const body = await req.json();
    const { blockedUserEmail, reason } = body;

    if (!blockedUserEmail || typeof blockedUserEmail !== 'string') {
      return Response.json({ error: 'blockedUserEmail requis' }, { status: 400 });
    }

    if (currentUser.email === blockedUserEmail) {
      return Response.json({ error: 'Cannot block self' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // Résoudre les public_profile_id via AccountPrivate
    const [currentAccount, blockedAccount] = await Promise.all([
      serviceRole.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1),
      serviceRole.entities.AccountPrivate.filter({ user_email: blockedUserEmail }, null, 1)
    ]);

    const blockerPublicId = currentAccount[0]?.public_profile_id;
    const blockedPublicId = blockedAccount[0]?.public_profile_id;

    if (!blockerPublicId || !blockedPublicId) {
      return Response.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    // Créer le Block via serviceRole
    await serviceRole.entities.Block.create({
      blocker_profile_id: blockerPublicId,
      blocked_profile_id: blockedPublicId,
      reason: reason || 'not_interested',
      created_at: new Date().toISOString()
    });

    // Archive les conversations entre les deux utilisateurs
    const [user_a, user_b] = [currentUser.email, blockedUserEmail].sort();

    const conversations = await serviceRole.entities.Conversation.filter({
      user_a_id: user_a,
      user_b_id: user_b
    }, null, 100);

    for (const conv of conversations) {
      await serviceRole.entities.Conversation.update(conv.id, {
        status: 'blocked'
      });
    }

    // Audit log
    serviceRole.entities.AuditLog.create({
      actor_user_id: currentUser.email,
      actor_role: 'user',
      action: 'block_created',
      entity_name: 'Block',
      target_user_id: blockedUserEmail,
      payload_summary: `Utilisateur bloqué: ${blockedUserEmail}`,
      status: 'success'
    }).catch(e => console.error('[block_user] AuditLog error:', e));

    return Response.json({ success: true });

  } catch (error) {
    console.error('[block_user] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});