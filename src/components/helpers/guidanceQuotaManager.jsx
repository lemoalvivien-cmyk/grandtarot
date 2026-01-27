/**
 * Guidance Quota Manager - GRANDTAROT
 * Enforces global limit: 1 guidance per day (ALL modes combined)
 * Prevents LLM cost abuse
 */

import { base44 } from '@/api/base44Client';

/**
 * Check if user can request guidance today
 * Returns: { allowed: boolean, reason?: string, used_today?: number }
 */
export const canRequestGuidance = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Count ALL guidance requests today (across ALL modes)
    const todayGuidance = await base44.entities.GuidanceAnswer.filter({
      user_id: userId,
      day_key: today
    }, null, 10); // Max 10 to detect abuse
    
    const count = todayGuidance.length;
    
    // STRICT LIMIT: 1 guidance per day (all modes)
    if (count >= 1) {
      return {
        allowed: false,
        reason: 'daily_limit_reached',
        used_today: count
      };
    }
    
    return {
      allowed: true,
      used_today: count
    };
    
  } catch (error) {
    console.error('[guidanceQuotaManager] Error checking quota:', error);
    // Fail-closed (deny on error)
    return {
      allowed: false,
      reason: 'quota_check_failed'
    };
  }
};

/**
 * Get remaining guidance quota for today
 * Returns: number (0 or 1)
 */
export const getRemainingQuota = async (userId) => {
  const check = await canRequestGuidance(userId);
  return check.allowed ? 1 : 0;
};

/**
 * Get guidance usage stats (for user dashboard)
 * Returns: { today: number, this_week: number, this_month: number }
 */
export const getGuidanceStats = async (userId) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Last 7 days
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekKey = weekAgo.toISOString().split('T')[0];
    
    // Last 30 days
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthKey = monthAgo.toISOString().split('T')[0];
    
    const [todayData, weekData, monthData] = await Promise.all([
      base44.entities.GuidanceAnswer.filter({ user_id: userId, day_key: today }, null, 10),
      base44.entities.GuidanceAnswer.filter({ 
        user_id: userId,
        day_key: { $gte: weekKey }
      }, null, 100),
      base44.entities.GuidanceAnswer.filter({ 
        user_id: userId,
        day_key: { $gte: monthKey }
      }, null, 100)
    ]);
    
    return {
      today: todayData.length,
      this_week: weekData.length,
      this_month: monthData.length
    };
    
  } catch (error) {
    console.error('[guidanceQuotaManager] Error getting stats:', error);
    return { today: 0, this_week: 0, this_month: 0 };
  }
};