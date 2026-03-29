/**
 * block_user — Backend function pour bloquer un utilisateur
 * Sécurité: résout public_profile_id via serviceRole, crée Block, archive conversations
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

    // Rate limit: 10/heure per user
    if (!checkRateLimit(`block_user:${currentUser.email}`, 10, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    const body = await req.json();
    const { blockedUserEmail, reason } = body;

    if (!blockedUserEmail || typeof blockedUserEmail !== 'string') {
      return Response.json({ error: 'Email invalide' }, { status: 400 });
    }

    if (currentUser.email === blockedUserEmail) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // Load AccountPrivate for both users
    const [blockerAccts, blockedAccts] = await Promise.all([
      serviceRole.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1),
      serviceRole.entities.AccountPrivate.filter({ user_email: blockedUserEmail }, null, 1)
    ]);

    const blockerPublicId = blockerAccts[0]?.public_profile_id;
    const blockedPublicId = blockedAccts[0]?.public_profile_id;

    if (!blockerPublicId) {
      return Response.json({ error: 'Blocker profile not complete' }, { status: 400 });
    }

    if (!blockedPublicId) {
      return Response.json({ error: 'Blocked user profile not complete' }, { status: 400 });
    }

    // Create Block
    await serviceRole.entities.Block.create({
      blocker_profile_id: blockerPublicId,
      blocked_profile_id: blockedPublicId,
      reason: reason || 'not_interested',
      is_mutual: false,
      is_admin_enforced: false
    });

    // Archive conversations
    const [convsA, convsB] = await Promise.all([
      serviceRole.entities.Conversation.filter({
        user_a_id: currentUser.email,
        user_b_id: blockedUserEmail
      }, null, 5),
      serviceRole.entities.Conversation.filter({
        user_a_id: blockedUserEmail,
        user_b_id: currentUser.email
      }, null, 5)
    ]);

    const allConvs = [...convsA, ...convsB];

    await Promise.all(
      allConvs.map(conv =>
        serviceRole.entities.Conversation.update(conv.id, {
          status: 'blocked',
          blocked_by: currentUser.email,
          blocked_at: new Date().toISOString()
        })
      )
    );

    return Response.json({ success: true });

  } catch (error) {
    console.error('[block_user] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});