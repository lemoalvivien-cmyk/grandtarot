import { base44 } from '@/api/base44Client';

/**
 * Matching Engine for GRANDTAROT
 * Generates daily matches and stores them in DailyMatch entity
 */

/**
 * Calculate distance score (0-25 points)
 * Based on city/geo_zone proximity and radius_km
 */
const calculateDistanceScore = (userProfile, targetProfile) => {
  // Same city = max score
  if (userProfile.city && targetProfile.city && 
      userProfile.city.toLowerCase() === targetProfile.city.toLowerCase()) {
    return 25;
  }
  
  // Same country/zone = good score
  if (userProfile.country && targetProfile.country &&
      userProfile.country.toLowerCase() === targetProfile.country.toLowerCase()) {
    return 15;
  }
  
  // Within radius (simplified - real geo would need lat/lng)
  if (userProfile.geo_zone && targetProfile.geo_zone &&
      userProfile.geo_zone === targetProfile.geo_zone) {
    return 20;
  }
  
  // Default fallback
  return 5;
};

/**
 * Calculate interests score (0-30 points)
 */
const calculateInterestsScore = (userProfile, targetProfile) => {
  if (!userProfile.interest_ids?.length || !targetProfile.interest_ids?.length) {
    return 0;
  }
  
  const userInterests = new Set(userProfile.interest_ids);
  const commonInterests = targetProfile.interest_ids.filter(id => userInterests.has(id));
  
  return Math.min(commonInterests.length * 5, 30);
};

/**
 * Calculate tarot themes synergy (0-15 points)
 */
const calculateTarotSynergy = async (userId, targetUserId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [userDraws, targetDraws] = await Promise.all([
      base44.entities.DailyDraw.filter({ user_id: userId, draw_date: today }),
      base44.entities.DailyDraw.filter({ user_id: targetUserId, draw_date: today })
    ]);
    
    if (!userDraws.length || !targetDraws.length) return 0;
    
    const userThemes = new Set(userDraws[0].themes || []);
    const targetThemes = targetDraws[0].themes || [];
    const commonThemes = targetThemes.filter(t => userThemes.has(t));
    
    return Math.min(commonThemes.length * 3, 15);
  } catch (error) {
    return 0;
  }
};

/**
 * Calculate professional compatibility (0-10 points)
 */
const calculateProBonus = (userProfile, targetProfile) => {
  if (userProfile.mode_active !== 'professional') return 0;
  
  let score = 0;
  
  // Same sector
  if (userProfile.pro_sector && targetProfile.pro_sector &&
      userProfile.pro_sector === targetProfile.pro_sector) {
    score += 5;
  }
  
  // Complementary challenges (simplified)
  if (userProfile.pro_current_challenge && targetProfile.pro_current_challenge) {
    score += 5;
  }
  
  return Math.min(score, 10);
};

/**
 * Calculate age proximity (0-5 points)
 */
const calculateAgeScore = (userProfile, targetProfile) => {
  if (!userProfile.birth_year || !targetProfile.birth_year) return 0;
  
  const ageDiff = Math.abs(userProfile.birth_year - targetProfile.birth_year);
  
  if (ageDiff <= 5) return 5;
  if (ageDiff <= 10) return 3;
  if (ageDiff <= 15) return 1;
  return 0;
};

/**
 * Calculate activity bonus (0-10 points)
 */
const calculateActivityScore = (targetProfile) => {
  if (!targetProfile.last_active) return 0;
  
  const lastActive = new Date(targetProfile.last_active);
  const now = new Date();
  const daysSince = (now - lastActive) / (1000 * 60 * 60 * 24);
  
  if (daysSince <= 1) return 10;
  if (daysSince <= 3) return 7;
  if (daysSince <= 7) return 4;
  return 0;
};

/**
 * Generate match reasons (max 3)
 */
const generateReasons = async (userProfile, targetProfile, scoreBreakdown, lang) => {
  const reasons = [];
  
  // Interests
  if (scoreBreakdown.interests >= 15) {
    const userInterests = new Set(userProfile.interest_ids || []);
    const common = (targetProfile.interest_ids || []).filter(id => userInterests.has(id));
    if (common.length > 0) {
      reasons.push({
        reason_fr: `${common.length} centres d'intérêt en commun`,
        reason_en: `${common.length} shared interests`,
        weight: scoreBreakdown.interests
      });
    }
  }
  
  // Location
  if (scoreBreakdown.location >= 15) {
    if (userProfile.city === targetProfile.city) {
      reasons.push({
        reason_fr: `Même ville : ${userProfile.city}`,
        reason_en: `Same city: ${userProfile.city}`,
        weight: scoreBreakdown.location
      });
    } else if (userProfile.country === targetProfile.country) {
      reasons.push({
        reason_fr: 'Proximité géographique',
        reason_en: 'Geographic proximity',
        weight: scoreBreakdown.location
      });
    }
  }
  
  // Tarot synergy
  if (scoreBreakdown.tarot_synergy >= 6) {
    reasons.push({
      reason_fr: 'Énergies astrologiques compatibles',
      reason_en: 'Compatible astrological energies',
      weight: scoreBreakdown.tarot_synergy
    });
  }
  
  // Activity
  if (scoreBreakdown.activity >= 7) {
    reasons.push({
      reason_fr: 'Membre actif',
      reason_en: 'Active member',
      weight: scoreBreakdown.activity
    });
  }
  
  // Pro specific
  if (userProfile.mode_active === 'professional' && scoreBreakdown.pro_bonus >= 5) {
    reasons.push({
      reason_fr: 'Profil professionnel compatible',
      reason_en: 'Compatible professional profile',
      weight: scoreBreakdown.pro_bonus
    });
  }
  
  // Sort by weight and take top 3
  return reasons.sort((a, b) => b.weight - a.weight).slice(0, 3);
};

/**
 * Get eligible candidates for matching
 */
const getEligibleCandidates = async (userProfile) => {
  try {
    // Get all profiles
    const allProfiles = await base44.entities.UserProfile.list();
    
    // Get user's blocks
    const blocks = await base44.entities.Block.filter({ blocker_user_id: userProfile.user_id });
    const blockedIds = new Set(blocks.map(b => b.blocked_user_id));
    
    // Get blocks where user is blocked
    const blockedBy = await base44.entities.Block.filter({ blocked_user_id: userProfile.user_id });
    const blockerIds = new Set(blockedBy.map(b => b.blocker_user_id));
    
    // Get existing intentions sent
    const intentions = await base44.entities.Intention.filter({ from_user_id: userProfile.user_id });
    const intentionSentTo = new Set(intentions.map(i => i.to_user_id));
    
    // Filter candidates
    const candidates = allProfiles.filter(p => {
      // Not self
      if (p.user_id === userProfile.user_id) return false;
      
      // Must be visible and have same mode in looking_for
      if (!p.is_visible) return false;
      if (!p.looking_for?.includes(userProfile.mode_active)) return false;
      
      // Must have photo
      if (!p.photo_url) return false;
      
      // Not blocked
      if (blockedIds.has(p.user_id) || blockerIds.has(p.user_id)) return false;
      
      // Not banned
      if (p.is_banned) return false;
      
      // Don't rematch if intention already sent
      if (intentionSentTo.has(p.user_id)) return false;
      
      return true;
    });
    
    return candidates;
  } catch (error) {
    console.error('Error getting candidates:', error);
    return [];
  }
};

/**
 * Main function: Generate daily matches for a user
 */
export const generateDailyMatches = async (userProfile, targetCount = 20) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if matches already exist for today
    const existing = await base44.entities.DailyMatch.filter({
      user_id: userProfile.user_id,
      match_date: today,
      mode: userProfile.mode_active
    });
    
    if (existing.length > 0) {
      return existing;
    }
    
    // Get candidates
    let candidates = await getEligibleCandidates(userProfile);
    
    if (candidates.length === 0) {
      return [];
    }
    
    // Score each candidate
    const scoredCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const location = calculateDistanceScore(userProfile, candidate);
        const interests = calculateInterestsScore(userProfile, candidate);
        const tarot_synergy = await calculateTarotSynergy(userProfile.user_id, candidate.user_id);
        const pro_bonus = calculateProBonus(userProfile, candidate);
        const age = calculateAgeScore(userProfile, candidate);
        const activity = calculateActivityScore(candidate);
        
        const scoreBreakdown = { location, interests, tarot_synergy, pro_bonus, age, activity };
        const totalScore = location + interests + tarot_synergy + pro_bonus + age + activity;
        
        const reasons = await generateReasons(userProfile, candidate, scoreBreakdown, userProfile.language_pref || 'fr');
        
        // Get shared interests IDs
        const userInterests = new Set(userProfile.interest_ids || []);
        const sharedInterests = (candidate.interest_ids || []).filter(id => userInterests.has(id));
        
        return {
          candidate,
          totalScore,
          scoreBreakdown,
          reasons,
          sharedInterests
        };
      })
    );
    
    // Sort by score and take top N
    const topMatches = scoredCandidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, targetCount);
    
    // Store in DailyMatch
    const matchRecords = await Promise.all(
      topMatches.map(match => 
        base44.entities.DailyMatch.create({
          user_id: userProfile.user_id,
          match_date: today,
          mode: userProfile.mode_active,
          matched_user_id: match.candidate.user_id,
          compatibility_score: Math.round(match.totalScore),
          score_breakdown: match.scoreBreakdown,
          reasons: match.reasons,
          shared_interests: match.sharedInterests,
          is_viewed: false,
          intention_sent: false,
          is_expired: false
        })
      )
    );
    
    return matchRecords;
  } catch (error) {
    console.error('Error generating matches:', error);
    return [];
  }
};

/**
 * Mark a match as viewed
 */
export const markMatchViewed = async (matchId) => {
  try {
    await base44.entities.DailyMatch.update(matchId, {
      is_viewed: true,
      viewed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking match as viewed:', error);
  }
};