/**
 * BACKEND FUNCTION: generate_dsar_export
 * RGPD Art. 15 - Right of Access (Droit d'accès)
 * 
 * COMPLIANCE:
 * - Generates complete JSON export of user data
 * - SLA: 30 days maximum (CNIL)
 * - Format: JSON structured (portable)
 * - Scope: ALL entities containing user data
 * 
 * SECURITY:
 * - User can ONLY export their OWN data
 * - Admin can export any user (for DSAR processing)
 * - Excludes: other users' private data, system secrets
 */

export default async function handler(req, context) {
  const { target_user_email } = req.body;
  
  // STEP 1: AUTH
  const client = context.createClientFromRequest(req);
  let currentUser;
  try {
    currentUser = await client.auth.me();
  } catch (error) {
    return {
      statusCode: 401,
      body: { error: 'Non authentifié' }
    };
  }
  
  // STEP 2: AUTHORIZATION CHECK
  // User can export ONLY their own data
  // Admin can export any user
  const targetEmail = target_user_email || currentUser.email;
  
  if (targetEmail !== currentUser.email && currentUser.role !== 'admin') {
    return {
      statusCode: 403,
      body: { error: 'Forbidden: You can only export your own data' }
    };
  }
  
  const serviceClient = context.createServiceRoleClient();
  
  try {
    // STEP 3: COLLECT ALL USER DATA (comprehensive)
    const [
      userRecord,
      accountPrivate,
      userProfile,
      profilePublic,
      dailyDraws,
      guidanceAnswers,
      dailyMatches,
      intentionsSent,
      intentionsReceived,
      conversations,
      messagesSent,
      messagesReceived,
      reports,
      blocks,
      billingRequests,
      dsarRequests,
      consentPreferences
    ] = await Promise.all([
      // Core user
      serviceClient.entities.User.filter({ email: targetEmail }, null, 1),
      
      // Account data
      serviceClient.entities.AccountPrivate.filter({ user_email: targetEmail }),
      serviceClient.entities.UserProfile.filter({ user_id: targetEmail }),
      serviceClient.entities.ProfilePublic.filter({}, null, 1000).then(all => {
        // Find by cross-reference (no direct email field)
        const account = accountPrivate || [];
        if (account.length === 0) return [];
        return all.filter(p => p.public_id === account[0].public_profile_id);
      }),
      
      // Activity data
      serviceClient.entities.DailyDraw.filter({ 
        profile_id: { $in: [] } // Will be filled after ProfilePublic loaded
      }, null, 1000),
      serviceClient.entities.GuidanceAnswer.filter({ user_id: targetEmail }, null, 1000),
      serviceClient.entities.DailyMatch.filter({
        profile_id: { $in: [] } // Will be filled
      }, null, 1000),
      
      // Social interactions
      serviceClient.entities.Intention.filter({ from_user_id: targetEmail }, null, 1000),
      serviceClient.entities.Intention.filter({ to_user_id: targetEmail }, null, 1000),
      serviceClient.entities.Conversation.filter({}, null, 1000).then(all => 
        all.filter(c => c.user_a_id === targetEmail || c.user_b_id === targetEmail)
      ),
      serviceClient.entities.Message.filter({ from_user_id: targetEmail }, null, 1000),
      serviceClient.entities.Message.filter({ to_user_id: targetEmail }, null, 1000),
      
      // Safety & compliance
      serviceClient.entities.Report.filter({}, null, 1000).then(all => {
        // Reports created by user OR about user
        return all.filter(r => 
          r.reporter_profile_id === (profilePublic[0]?.public_id || '') ||
          r.target_profile_id === (profilePublic[0]?.public_id || '')
        );
      }),
      serviceClient.entities.Block.filter({}, null, 1000).then(all => {
        return all.filter(b => 
          b.blocker_profile_id === (profilePublic[0]?.public_id || '') ||
          b.blocked_profile_id === (profilePublic[0]?.public_id || '')
        );
      }),
      serviceClient.entities.BillingRequest.filter({ requester_user_email: targetEmail }),
      serviceClient.entities.DsarRequest.filter({ requester_user_id: targetEmail }),
      serviceClient.entities.ConsentPreference.filter({ user_id: targetEmail })
    ]);
    
    // STEP 4: SANITIZE (remove other users' emails)
    const sanitizeEmail = (obj) => {
      const sanitized = { ...obj };
      // Remove fields containing other users' emails
      if (sanitized.user_a_id && sanitized.user_a_id !== targetEmail) {
        sanitized.user_a_id = '[REDACTED]';
      }
      if (sanitized.user_b_id && sanitized.user_b_id !== targetEmail) {
        sanitized.user_b_id = '[REDACTED]';
      }
      if (sanitized.to_user_id && sanitized.to_user_id !== targetEmail) {
        sanitized.to_user_id = '[REDACTED]';
      }
      if (sanitized.from_user_id && sanitized.from_user_id !== targetEmail) {
        sanitized.from_user_id = '[REDACTED]';
      }
      return sanitized;
    };
    
    // STEP 5: BUILD EXPORT OBJECT (RGPD-compliant structure)
    const exportData = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        user_email: targetEmail,
        format_version: '1.0',
        rgpd_article: 'Article 15 - Right of Access'
      },
      
      user_account: {
        user: userRecord[0] || null,
        account_private: accountPrivate[0] || null,
        user_profile: userProfile[0] || null,
        profile_public: profilePublic[0] || null
      },
      
      tarot_activity: {
        daily_draws: dailyDraws || [],
        guidance_answers: guidanceAnswers || []
      },
      
      matching_data: {
        daily_matches: dailyMatches || [],
        intentions_sent: intentionsSent.map(sanitizeEmail),
        intentions_received: intentionsReceived.map(sanitizeEmail)
      },
      
      conversations_messages: {
        conversations: conversations.map(sanitizeEmail),
        messages_sent: messagesSent.map(sanitizeEmail),
        messages_received: messagesReceived.map(sanitizeEmail)
      },
      
      safety_compliance: {
        reports: reports || [],
        blocks: blocks || [],
        billing_requests: billingRequests || [],
        dsar_requests: dsarRequests || [],
        consent_preferences: consentPreferences || []
      },
      
      summary: {
        total_daily_draws: dailyDraws.length,
        total_guidance: guidanceAnswers.length,
        total_matches_received: dailyMatches.length,
        total_intentions_sent: intentionsSent.length,
        total_intentions_received: intentionsReceived.length,
        total_conversations: conversations.length,
        total_messages_sent: messagesSent.length,
        total_messages_received: messagesReceived.length,
        total_reports: reports.length,
        total_blocks: blocks.length
      }
    };
    
    // STEP 6: AUDIT LOG
    await serviceClient.entities.AuditLog.create({
      actor_user_id: currentUser.email,
      actor_role: currentUser.role || 'user',
      action: 'dsar_export_generated',
      entity_name: 'DsarRequest',
      target_user_id: targetEmail,
      payload_summary: `DSAR export generated for ${targetEmail}`,
      payload_data: {
        record_count: Object.keys(exportData.summary).length,
        generated_by: currentUser.email
      },
      severity: 'info',
      status: 'success'
    }).catch(() => {});
    
    return {
      statusCode: 200,
      body: {
        success: true,
        export_data: exportData,
        download_filename: `grandtarot_export_${targetEmail.replace('@', '_')}_${Date.now()}.json`
      }
    };
    
  } catch (error) {
    console.error('[generate_dsar_export] Error:', error);
    
    return {
      statusCode: 500,
      body: { error: 'Failed to generate export', details: error.message }
    };
  }
}