/**
 * generate_dsar_export — Base44 V3
 * Export RGPD Art. 15 — Droit d'accès.
 * Rate limit: 3 exports / heure par utilisateur.
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

    // STEP 2: AUTORISATION
    let body = {};
    try { body = await req.json(); } catch { /* body optionnel */ }
    const { target_user_email } = body;
    const targetEmail = target_user_email || currentUser.email;

    if (targetEmail !== currentUser.email && currentUser.role !== 'admin') {
      return Response.json({ error: 'Vous ne pouvez exporter que vos propres données' }, { status: 403 });
    }

    // STEP 2b: RATE LIMIT — max 3 exports/heure
    if (!checkRateLimit(`dsar:${currentUser.email}`, 3, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de demandes d\'export — réessayez dans 1 heure' }, { status: 429 });
    }

    const serviceRole = base44.asServiceRole;

    // STEP 3: COLLECTER DONNÉES
    const accountPrivate = await serviceRole.entities.AccountPrivate.filter({ user_email: targetEmail }, null, 1);
    const userProfile = await serviceRole.entities.UserProfile.filter({ user_id: targetEmail }, null, 1);

    let profilePublic = [];
    if (accountPrivate.length > 0 && accountPrivate[0].public_profile_id) {
      profilePublic = await serviceRole.entities.ProfilePublic.filter({
        public_id: accountPrivate[0].public_profile_id
      }, null, 1);
    }

    const publicId = profilePublic[0]?.public_id || '';

    const [
      guidanceAnswers,
      intentionsSent,
      intentionsReceived,
      messagesFromUser,
      messagesToUser,
      billingRequests,
      dsarRequests,
      consentPreferences
    ] = await Promise.all([
      serviceRole.entities.GuidanceAnswer.filter({ user_id: targetEmail }, null, 1000),
      serviceRole.entities.Intention.filter({ from_user_id: targetEmail }, null, 1000),
      serviceRole.entities.Intention.filter({ to_user_id: targetEmail }, null, 1000),
      serviceRole.entities.Message.filter({ from_user_id: targetEmail }, null, 1000),
      serviceRole.entities.Message.filter({ to_user_id: targetEmail }, null, 1000),
      serviceRole.entities.BillingRequest.filter({ requester_user_email: targetEmail }),
      serviceRole.entities.DsarRequest.filter({ requester_user_id: targetEmail }),
      serviceRole.entities.ConsentPreference.filter({ user_id: targetEmail })
    ]);

    const [convsA, convsB] = await Promise.all([
      serviceRole.entities.Conversation.filter({ user_a_id: targetEmail }, null, 500),
      serviceRole.entities.Conversation.filter({ user_b_id: targetEmail }, null, 500)
    ]);
    const conversations = [...convsA, ...convsB];

    let dailyDraws = [];
    if (publicId) {
      dailyDraws = await serviceRole.entities.DailyDraw.filter({ profile_id: publicId }, null, 1000);
    }

    let reports = [];
    if (publicId) {
      const [reportsBy, reportsAbout] = await Promise.all([
        serviceRole.entities.Report.filter({ reporter_profile_id: publicId }, null, 500),
        serviceRole.entities.Report.filter({ target_profile_id: publicId }, null, 500)
      ]);
      reports = [...reportsBy, ...reportsAbout];
    }

    // STEP 4: SANITIZE
    const sanitize = (obj) => {
      const s = { ...obj };
      if (s.user_a_id && s.user_a_id !== targetEmail) s.user_a_id = '[REDACTED]';
      if (s.user_b_id && s.user_b_id !== targetEmail) s.user_b_id = '[REDACTED]';
      if (s.to_user_id && s.to_user_id !== targetEmail) s.to_user_id = '[REDACTED]';
      if (s.from_user_id && s.from_user_id !== targetEmail) s.from_user_id = '[REDACTED]';
      return s;
    };

    const safeAccount = accountPrivate[0]
      ? { ...accountPrivate[0], stripe_customer_id: '[REDACTED]', stripe_subscription_id: '[REDACTED]' }
      : null;

    // STEP 5: CONSTRUIRE L'EXPORT
    const exportData = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        user_email: targetEmail,
        format_version: '1.1',
        rgpd_article: 'Article 15 - Droit d\'accès'
      },
      user_account: {
        account_private: safeAccount,
        user_profile: userProfile[0] || null,
        profile_public: profilePublic[0] || null
      },
      tarot_activity: {
        daily_draws: dailyDraws,
        guidance_answers: guidanceAnswers
      },
      social_data: {
        intentions_sent: intentionsSent.map(sanitize),
        intentions_received: intentionsReceived.map(sanitize),
        conversations: conversations.map(sanitize),
        messages_sent: messagesFromUser.map(sanitize),
        messages_received: messagesToUser.map(sanitize)
      },
      safety_compliance: {
        reports,
        billing_requests: billingRequests,
        dsar_requests: dsarRequests,
        consent_preferences: consentPreferences
      },
      summary: {
        total_daily_draws: dailyDraws.length,
        total_guidance: guidanceAnswers.length,
        total_intentions_sent: intentionsSent.length,
        total_intentions_received: intentionsReceived.length,
        total_conversations: conversations.length,
        total_messages_sent: messagesFromUser.length,
        total_messages_received: messagesToUser.length,
        total_reports: reports.length
      }
    };

    // STEP 6: AUDIT LOG
    serviceRole.entities.AuditLog.create({
      actor_user_id: currentUser.email,
      actor_role: currentUser.role || 'user',
      action: 'admin_action',
      entity_name: 'DsarRequest',
      target_user_id: targetEmail,
      payload_summary: `Export DSAR généré pour ${targetEmail}`,
      severity: 'info',
      status: 'success'
    }).catch((e) => console.error('[generate_dsar_export] AuditLog error:', e));

    return Response.json({
      success: true,
      export_data: exportData,
      download_filename: `grandtarot_export_${targetEmail.replace('@', '_at_')}_${Date.now()}.json`
    });

  } catch (error) {
    console.error('[generate_dsar_export] Error:', error.message);
    return Response.json({ error: 'Erreur génération export', details: error.message }, { status: 500 });
  }
});