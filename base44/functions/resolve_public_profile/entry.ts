/**
 * resolve_public_profile — Backend function pour résoudre les public_profile_id
 * Sécurité: retourne UNIQUEMENT publicId, displayName, photoUrl — PAS email, PAS stripe_customer_id
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

    // Rate limit: 20/min per user
    if (!checkRateLimit(`resolve_profile:${currentUser.email}`, 20, 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 minute' }, { status: 429 });
    }

    const body = await req.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0 || emails.length > 20) {
      return Response.json({ error: 'Emails invalides (1-20)' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // Load AccountPrivate for all emails + corresponding ProfilePublic
    const accounts = await serviceRole.entities.AccountPrivate.filter(
      { user_email: { $in: emails } },
      null,
      20
    );

    if (!accounts.length) {
      return Response.json({ profiles: {} });
    }

    // Load all ProfilePublic via public_profile_id
    const publicIds = accounts.map(a => a.public_profile_id).filter(Boolean);
    const profiles = publicIds.length > 0
      ? await serviceRole.entities.ProfilePublic.filter(
          { public_id: { $in: publicIds } },
          null,
          20
        )
      : [];

    // Build map: email -> { publicId, displayName, photoUrl }
    const profileMap = accounts.reduce((acc, account) => {
      const profile = profiles.find(p => p.public_id === account.public_profile_id);
      if (profile) {
        acc[account.user_email] = {
          publicId: profile.public_id,
          displayName: profile.display_name || 'User',
          photoUrl: profile.photo_url || null
        };
      }
      return acc;
    }, {});

    return Response.json({
      profiles: profileMap
    });

  } catch (error) {
    console.error('[resolve_public_profile] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});