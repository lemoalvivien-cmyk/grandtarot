import { base44 } from '@/api/base44Client';

/**
 * Rate Limiter - Simulates server-side rate limiting via database checks
 * NOTE: This is NOT true server-side rate limiting (requires backend functions)
 * A malicious user could bypass this by directly calling Base44 APIs
 * 
 * For production: Enable backend functions + implement actual rate limiting middleware
 */

/**
 * Check if user can create a report (max 10/day)
 */
export const canCreateReport = async (userEmail) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // SECURED: Use filter with limit
    const reports = await base44.entities.Report.filter({ 
      reporter_profile_id: userEmail 
    }, '-created_date', 50);
    
    const todayReports = reports.filter(r => {
      const reportDate = new Date(r.created_date).toISOString().split('T')[0];
      return reportDate === today;
    });
    
    if (todayReports.length >= 10) {
      return { 
        allowed: false, 
        reason: 'daily_limit_exceeded',
        limit: 10,
        current: todayReports.length
      };
    }
    
    return { 
      allowed: true, 
      remaining: 10 - todayReports.length 
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow on error to not block legitimate users
    return { allowed: true, error: error.message };
  }
};

/**
 * Check if user can send an intention (max 5/day, cooldown handling)
 * This is already implemented in quotaManager, but we add extra logging
 */
export const canSendIntention = async (userEmail) => {
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_id: userEmail }, null, 1);
    if (profiles.length === 0) {
      return { allowed: false, reason: 'no_profile' };
    }
    
    const profile = profiles[0];
    const today = new Date().toISOString().split('T')[0];
    const lastReset = profile.last_intention_reset?.split('T')[0];
    
    // Reset if new day
    let intentionsToday = profile.intentions_sent_today || 0;
    if (lastReset !== today) {
      intentionsToday = 0;
    }
    
    // Check daily limit
    const maxIntentions = 5;
    if (intentionsToday >= maxIntentions) {
      return { 
        allowed: false, 
        reason: 'daily_limit_exceeded',
        limit: maxIntentions,
        current: intentionsToday
      };
    }
    
    // Check cooldown
    if (profile.cooldown_until) {
      const cooldownEnd = new Date(profile.cooldown_until);
      if (cooldownEnd > new Date()) {
        const hoursLeft = Math.ceil((cooldownEnd - new Date()) / (1000 * 60 * 60));
        return { 
          allowed: false, 
          reason: 'cooldown_active',
          cooldownEnd: profile.cooldown_until,
          hoursLeft
        };
      }
    }
    
    return { 
      allowed: true, 
      remaining: maxIntentions - intentionsToday 
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, error: error.message };
  }
};

/**
 * Check if user can generate daily matches (1x per day per mode - IDEMPOTENT)
 */
export const canGenerateDailyMatches = async (userEmail, mode) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if matches already exist for today + mode (limit 20 since that's max)
    const existingMatches = await base44.entities.DailyMatch.filter({
      profile_id: userEmail,
      match_date: today,
      mode: mode
    }, null, 20);
    
    if (existingMatches.length > 0) {
      return { 
        allowed: false, 
        reason: 'already_generated_today',
        count: existingMatches.length
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, error: error.message };
  }
};

/**
 * Log rate limit violation for audit
 */
export const logRateLimitViolation = async (userEmail, action, details) => {
  try {
    await base44.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'admin_action',
      entity_name: 'RateLimit',
      payload_summary: `Rate limit exceeded: ${action}`,
      payload_data: { action, ...details },
      severity: 'warning',
      status: 'failed'
    });
  } catch (error) {
    console.error('Error logging rate limit violation:', error);
  }
};