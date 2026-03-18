/**
 * validate_age_gate — Base44 V3
 * Vérification d'âge serveur (RGPD/COPPA). Exige 18+ ans.
 * Rate limit: 5 tentatives / 15 min par utilisateur.
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

    // STEP 1b: RATE LIMIT — max 5 tentatives / 15 min
    if (!checkRateLimit(`agegate:${userEmail}`, 5, 15 * 60 * 1000)) {
      return Response.json({ error: 'Trop de tentatives — réessayez dans 15 minutes' }, { status: 429 });
    }

    // STEP 2: LIRE birth_year/month/day DEPUIS LA DB (jamais faire confiance au client)
    const serviceRole = base44.asServiceRole;
    const profiles = await serviceRole.entities.UserProfile.filter({ user_id: userEmail }, null, 1);

    if (profiles.length === 0) {
      return Response.json({ error: 'Profil utilisateur introuvable' }, { status: 404 });
    }

    const profile = profiles[0];
    const birth_year = profile.birth_year;
    const birth_month = profile.birth_month || null;
    const birth_day = profile.birth_day || null;

    if (!birth_year || birth_year < 1900 || birth_year > new Date().getFullYear()) {
      return Response.json({ error: 'Année de naissance absente ou invalide dans votre profil' }, { status: 400 });
    }

    // STEP 3: CALCUL ÂGE SERVEUR
    const today = new Date();
    let age = today.getFullYear() - birth_year;
    if (birth_month && birth_day) {
      if (today.getMonth() + 1 < birth_month ||
          (today.getMonth() + 1 === birth_month && today.getDate() < birth_day)) {
        age -= 1;
      }
    }

    // STEP 4: REJET SI MINEUR
    if (age < 18) {
      serviceRole.entities.AuditLog.create({
        actor_user_id: userEmail,
        actor_role: 'user',
        action: 'admin_action',
        entity_name: 'AccountPrivate',
        payload_summary: `Tentative accès mineur: âge=${age}`,
        severity: 'warning',
        status: 'failed'
      }).catch((e) => console.error('[validate_age_gate] AuditLog error:', e));

      return Response.json({
        error: 'Âge insuffisant',
        reason: 'underage',
        minimum_age: 18,
        calculated_age: age
      }, { status: 403 });
    }

    // STEP 5: ENREGISTREMENT CONFIRMATION
    const accounts = await serviceRole.entities.AccountPrivate.filter({ user_email: userEmail }, null, 1);
    const now = new Date().toISOString();

    if (accounts.length === 0) {
      await serviceRole.entities.AccountPrivate.create({
        user_email: userEmail,
        age_confirmed_at: now,
        plan_status: 'free'
      });
    } else {
      await serviceRole.entities.AccountPrivate.update(accounts[0].id, {
        age_confirmed_at: now
      });
    }

    serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'user_updated',
      entity_name: 'AccountPrivate',
      payload_summary: `Âge vérifié: ${age} ans`,
      severity: 'info',
      status: 'success'
    }).catch((e) => console.error('[validate_age_gate] AuditLog error:', e));

    return Response.json({ success: true, age_confirmed: true, calculated_age: age });

  } catch (error) {
    console.error('[validate_age_gate] Error:', error.message);
    return Response.json({ error: 'Erreur vérification âge', details: error.message }, { status: 500 });
  }
});