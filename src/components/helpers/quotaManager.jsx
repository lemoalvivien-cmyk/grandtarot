import { base44 } from '@/api/base44Client';

/**
 * Quota Manager for GRANDTAROT
 * Handles daily intention quotas and cooldown management
 */

/**
 * Check and reset daily quotas if needed
 * Returns updated profile with reset counters
 */
export const checkAndResetDailyQuota = async (profile) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we need to reset daily counter
  if (profile.last_intention_reset !== today) {
    await base44.entities.UserProfile.update(profile.id, {
      intentions_sent_today: 0,
      last_intention_reset: today
    });
    
    return {
      ...profile,
      intentions_sent_today: 0,
      last_intention_reset: today
    };
  }
  
  return profile;
};

/**
 * Check if user is in cooldown
 * Returns { inCooldown: boolean, remainingTime: string, remainingMs: number }
 */
export const checkCooldown = (profile, lang = 'fr') => {
  if (!profile.cooldown_until) {
    return { inCooldown: false, remainingTime: '', remainingMs: 0 };
  }
  
  const cooldownEnd = new Date(profile.cooldown_until);
  const now = new Date();
  
  if (cooldownEnd <= now) {
    // Cooldown expired, clear it
    return { inCooldown: false, remainingTime: '', remainingMs: 0, shouldClear: true };
  }
  
  // Calculate remaining time
  const remainingMs = cooldownEnd - now;
  const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
  
  const remainingTime = lang === 'fr' 
    ? `${remainingHours}h restantes` 
    : `${remainingHours}h remaining`;
  
  return { inCooldown: true, remainingTime, remainingMs };
};

/**
 * Clear expired cooldown
 */
export const clearExpiredCooldown = async (profile) => {
  await base44.entities.UserProfile.update(profile.id, {
    cooldown_until: null
  });
  
  return {
    ...profile,
    cooldown_until: null
  };
};

/**
 * Apply cooldown after consecutive refusals
 */
export const applyCooldown = async (profile, hours = 24) => {
  const cooldownEnd = new Date();
  cooldownEnd.setHours(cooldownEnd.getHours() + hours);
  
  await base44.entities.UserProfile.update(profile.id, {
    cooldown_until: cooldownEnd.toISOString()
  });
  
  return {
    ...profile,
    cooldown_until: cooldownEnd.toISOString()
  };
};

/**
 * Check if user can send intention
 * Returns { canSend: boolean, reason: string, remainingQuota: number }
 */
export const canSendIntention = async (profile, lang = 'fr') => {
  // Check cooldown first
  const cooldownStatus = checkCooldown(profile, lang);
  
  if (cooldownStatus.inCooldown) {
    return {
      canSend: false,
      reason: lang === 'fr' 
        ? `Cooldown actif suite à plusieurs refus. ${cooldownStatus.remainingTime}` 
        : `Cooldown active after multiple refusals. ${cooldownStatus.remainingTime}`,
      remainingQuota: 0
    };
  }
  
  // If cooldown expired, clear it
  if (cooldownStatus.shouldClear) {
    profile = await clearExpiredCooldown(profile);
  }
  
  // Check and reset daily quota
  profile = await checkAndResetDailyQuota(profile);
  
  // Check quota (max 5 per day from AppSettings)
  const maxIntentions = 5;
  const remaining = maxIntentions - (profile.intentions_sent_today || 0);
  
  if (remaining <= 0) {
    return {
      canSend: false,
      reason: lang === 'fr' 
        ? 'Quota atteint : 5 intentions maximum par jour.' 
        : 'Quota reached: 5 intentions maximum per day.',
      remainingQuota: 0
    };
  }
  
  return {
    canSend: true,
    reason: '',
    remainingQuota: remaining
  };
};

/**
 * Track intention refusal and apply cooldown if needed
 * Returns { cooldownApplied: boolean, consecutiveRefusals: number }
 */
export const trackIntentionRefusal = async (refusedUserId) => {
  try {
    // Get refuser's profile
    const profiles = await base44.entities.UserProfile.filter({ user_id: refusedUserId });
    if (profiles.length === 0) return { cooldownApplied: false, consecutiveRefusals: 0 };
    
    const profile = profiles[0];
    
    // Get recent refused intentions (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recentRefusals = await base44.entities.Intention.filter({
      from_user_id: refusedUserId,
      status: 'refused',
      responded_at: { $gte: oneDayAgo.toISOString() }
    });
    
    const consecutiveRefusals = recentRefusals.length;
    
    // Apply cooldown if 3+ consecutive refusals
    if (consecutiveRefusals >= 3) {
      await applyCooldown(profile, 24);
      return { cooldownApplied: true, consecutiveRefusals };
    }
    
    return { cooldownApplied: false, consecutiveRefusals };
  } catch (error) {
    console.error('Error tracking refusal:', error);
    return { cooldownApplied: false, consecutiveRefusals: 0 };
  }
};