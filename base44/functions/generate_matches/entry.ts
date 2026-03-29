/**
 * generate_matches — Backend function pour la génération des matches
 * Logique matching côté serveur : exécution sécurisée, aucune exposition de données privées
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

    // Rate limit: 3 appels/heure max
    if (!checkRateLimit(`matches:${currentUser.email}`, 3, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    const serviceRole = base44.asServiceRole;

    // Charger le profil et l'account du user courant
    const [userProfiles, userAccounts] = await Promise.all([
      serviceRole.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1),
      serviceRole.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1)
    ]);

    if (!userProfiles.length) {
      return Response.json({ error: 'Profil utilisateur introuvable' }, { status: 404 });
    }
    if (!userAccounts.length) {
      return Response.json({ error: 'Compte utilisateur introuvable' }, { status: 404 });
    }

    const userProfile = userProfiles[0];
    const userAccount = userAccounts[0];

    // Vérifier abonnement actif
    if (userAccount.plan_status !== 'active') {
      return Response.json({ error: 'Abonnement requis' }, { status: 403 });
    }

    // Vérifier si personal_use_only est actif
    if (userAccount.personal_use_only) {
      return Response.json({ error: 'Mode guidance personnelle — pas de matching' }, { status: 403 });
    }

    // Vérifier si des matches existent déjà pour aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const existingMatches = await serviceRole.entities.DailyMatch.filter({
      profile_id: userProfile.public_id,
      match_date: today,
      mode: userProfile.mode_active
    }, '-compatibility_score', 20);

    if (existingMatches.length > 0) {
      // Retourner les matches existants (sans données sensibles)
      return Response.json({
        success: true,
        matches: existingMatches.map(m => ({
          id: m.id,
          matched_profile_id: m.matched_profile_id,
          compatibility_score: m.compatibility_score,
          score_breakdown: m.score_breakdown,
          reasons: m.reasons,
          shared_interests: m.shared_interests,
          intention_sent: m.intention_sent
        }))
      });
    }

    // === CHARGER LES CANDIDATS ===

    // 1. Charger les ProfilePublic éligibles
    const mode = userProfile.mode_active;
    const candidates = await serviceRole.entities.ProfilePublic.filter({
      is_visible: true,
      looking_for: { $contains: mode }
    }, null, 100);

    if (!candidates.length) {
      return Response.json({ success: true, matches: [] });
    }

    // 2. Charger EN UNE SEULE REQUÊTE les AccountPrivate pour exclusions
    const candidateEmails = candidates.map(c => c.public_id);

    // Charger les comptes pour les exclusions (personal_use_only, bans)
    const candidateAccounts = await serviceRole.entities.AccountPrivate.filter({
      public_profile_id: { $in: candidateEmails }
    }, null, 100);

    const personalUseOnlyIds = new Set(
      candidateAccounts
        .filter(acc => acc.personal_use_only)
        .map(acc => acc.public_profile_id)
    );

    const bannedIds = new Set(
      candidateAccounts
        .filter(acc => acc.is_banned)
        .map(acc => acc.public_profile_id)
    );

    // Charger les blocks du user courant
    const [blocksOutgoing, blocksIncoming] = await Promise.all([
      serviceRole.entities.Block.filter({
        blocker_profile_id: userProfile.public_id
      }, null, 100),
      serviceRole.entities.Block.filter({
        blocked_profile_id: userProfile.public_id
      }, null, 100)
    ]);

    const blockedIds = new Set([
      ...blocksOutgoing.map(b => b.blocked_profile_id),
      ...blocksIncoming.map(b => b.blocker_profile_id)
    ]);

    // Charger les intentions déjà envoyées par le user courant
    const sentIntentions = await serviceRole.entities.Intention.filter({
      from_user_id: currentUser.email
    }, null, 100);

    const intentionTargets = new Set(
      sentIntentions.map(i => i.to_user_id)
    );

    // 3. FILTRER les candidats
    const validCandidates = candidates.filter(cand => {
      // Pas self
      if (cand.public_id === userProfile.public_id) return false;

      // Pas personal_use_only
      if (personalUseOnlyIds.has(cand.public_id)) return false;

      // Pas banned
      if (bannedIds.has(cand.public_id)) return false;

      // Pas blocked
      if (blockedIds.has(cand.public_id)) return false;

      return true;
    });

    if (!validCandidates.length) {
      return Response.json({ success: true, matches: [] });
    }

    // 4. SCORER les candidats
    const scoredCandidates = validCandidates
      .map(cand => {
        let score = 0;
        const breakdown = {};
        const reasons = [];

        // Distance
        let distScore = 0;
        if (cand.city && userProfile.city && cand.city.toLowerCase() === userProfile.city.toLowerCase()) {
          distScore = 25;
          reasons.push({ reason_fr: 'Même ville', reason_en: 'Same city' });
        } else if (cand.country && userProfile.country && cand.country.toLowerCase() === userProfile.country.toLowerCase()) {
          distScore = 15;
          reasons.push({ reason_fr: 'Même pays', reason_en: 'Same country' });
        } else if (cand.geo_zone && userProfile.geo_zone && cand.geo_zone === userProfile.geo_zone) {
          distScore = 20;
          reasons.push({ reason_fr: 'Même zone', reason_en: 'Same zone' });
        } else {
          distScore = 5;
        }
        score += distScore;
        breakdown.distance = distScore;

        // Intérêts communs
        const userInterests = new Set(userProfile.interest_ids || []);
        const candInterests = new Set(cand.interest_ids || []);
        const commonInterests = [...userInterests].filter(id => candInterests.has(id));
        const interestScore = Math.min(commonInterests.length * 5, 30);
        score += interestScore;
        breakdown.interests = interestScore;
        if (commonInterests.length > 0) {
          reasons.push({ reason_fr: `${commonInterests.length} intérêt(s) commun(s)`, reason_en: `${commonInterests.length} shared interest(s)` });
        }

        // Activité (last_active)
        if (cand.last_active) {
          const lastActiveDate = new Date(cand.last_active);
          const daysSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
          let activityScore = 0;
          if (daysSinceActive <= 1) {
            activityScore = 10;
            reasons.push({ reason_fr: 'Actif aujourd\'hui', reason_en: 'Active today' });
          } else if (daysSinceActive <= 3) {
            activityScore = 7;
            reasons.push({ reason_fr: 'Actif récemment', reason_en: 'Recently active' });
          } else if (daysSinceActive <= 7) {
            activityScore = 4;
            reasons.push({ reason_fr: 'Actif cette semaine', reason_en: 'Active this week' });
          }
          score += activityScore;
          breakdown.activity = activityScore;
        }

        // Trust score
        const trustScore = (cand.trust_score || 50);
        const trustBonus = Math.floor(trustScore / 20); // 0-5 points
        score += trustBonus;
        breakdown.trust = trustBonus;

        // Vérifier si intention déjà envoyée (via email de cand dans sentIntentions)
        const candAccount = candidateAccounts.find(acc => acc.public_profile_id === cand.public_id);
        const alreadyIntentioned = candAccount && intentionTargets.has(candAccount.user_email);

        return {
          public_id: cand.public_id,
          score,
          breakdown,
          reasons: reasons.slice(0, 3),
          shared_interests: commonInterests,
          already_intentioned: alreadyIntentioned
        };
      })
      // Filtrer ceux avec intention déjà envoyée
      .filter(c => !c.already_intentioned)
      // Trier par score desc
      .sort((a, b) => b.score - a.score)
      // Prendre top 20
      .slice(0, 20);

    if (!scoredCandidates.length) {
      return Response.json({ success: true, matches: [] });
    }

    // 5. CRÉER les DailyMatch via serviceRole
    const dailyMatches = await Promise.all(
      scoredCandidates.map(cand =>
        serviceRole.entities.DailyMatch.create({
          profile_id: userProfile.public_id,
          match_date: today,
          mode: mode,
          matched_profile_id: cand.public_id,
          compatibility_score: cand.score,
          score_breakdown: cand.breakdown,
          reasons: cand.reasons,
          shared_interests: cand.shared_interests,
          is_viewed: false,
          intention_sent: false
        })
      )
    );

    // 6. RETOURNER sans données sensibles
    return Response.json({
      success: true,
      matches: dailyMatches.map(m => ({
        id: m.id,
        matched_profile_id: m.matched_profile_id,
        compatibility_score: m.compatibility_score,
        score_breakdown: m.score_breakdown,
        reasons: m.reasons,
        shared_interests: m.shared_interests,
        intention_sent: m.intention_sent
      }))
    });

  } catch (error) {
    console.error('[generate_matches] Error:', error.message);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});