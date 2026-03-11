import { base44 } from '@/api/base44Client';
import { lifePathNumber, compatibilitySignal } from './numerologyEngine';
import { getSunSign, compatibilityHeuristic } from './astrologyEngine';

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
      base44.entities.DailyDraw.filter({ profile_id: userId, draw_date: today }, null, 1),
      base44.entities.DailyDraw.filter({ profile_id: targetUserId, draw_date: today }, null, 1)
    ]);
    
    if (!userDraws || !targetDraws || !userDraws.length || !targetDraws.length) return 0;
    
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
 * Calculate numerology compatibility (0-10 points)
 * ONLY if both users have numerology enabled + scope = personal_and_matching
 */
const calculateNumerologyScore = async (userProfile, targetProfile) => {
  try {
    // Fetch AccountPrivate for both users
    const [userAccounts, targetAccounts] = await Promise.all([
      base44.entities.AccountPrivate.filter({ user_email: userProfile.user_id }, null, 1),
      base44.entities.AccountPrivate.filter({ user_email: targetProfile.user_id }, null, 1)
    ]);

    const userAccount = userAccounts && userAccounts.length > 0 ? userAccounts[0] : null;
    const targetAccount = targetAccounts && targetAccounts.length > 0 ? targetAccounts[0] : null;

    // STRICT CHECK: both must have numerology enabled + scope = personal_and_matching
    if (!userAccount || !userAccount.numerology_enabled || userAccount.numerology_scope !== 'personal_and_matching') {
      return 0;
    }
    if (!targetAccount || !targetAccount.numerology_enabled || targetAccount.numerology_scope !== 'personal_and_matching') {
      return 0;
    }

    // Calculate life path numbers
    const userBirthDate = {
      year: userProfile.birth_year,
      month: userProfile.birth_month,
      day: userProfile.birth_day
    };
    const targetBirthDate = {
      year: targetProfile.birth_year,
      month: targetProfile.birth_month,
      day: targetProfile.birth_day
    };

    if (!userBirthDate.year || !userBirthDate.month || !userBirthDate.day) return 0;
    if (!targetBirthDate.year || !targetBirthDate.month || !targetBirthDate.day) return 0;

    const userLifePath = lifePathNumber(userBirthDate);
    const targetLifePath = lifePathNumber(targetBirthDate);

    if (!userLifePath || !targetLifePath) return 0;

    // Get compatibility signal (scoreLite: 0-10)
    const compat = compatibilitySignal(userLifePath, targetLifePath, userProfile.language_pref || 'fr');
    return compat.scoreLite; // 0-10
  } catch (error) {
    return 0;
  }
};

/**
 * Calculate astrology compatibility (0-10 points)
 * ONLY if both users have astrology enabled + scope = personal_and_matching
 */
const calculateAstrologyScore = async (userProfile, targetProfile) => {
  try {
    // Fetch AccountPrivate for both users
    const [userAccounts, targetAccounts] = await Promise.all([
      base44.entities.AccountPrivate.filter({ user_email: userProfile.user_id }, null, 1),
      base44.entities.AccountPrivate.filter({ user_email: targetProfile.user_id }, null, 1)
    ]);

    const userAccount = userAccounts && userAccounts.length > 0 ? userAccounts[0] : null;
    const targetAccount = targetAccounts && targetAccounts.length > 0 ? targetAccounts[0] : null;

    // STRICT CHECK: both must have astrology enabled + scope = personal_and_matching
    if (!userAccount || !userAccount.astrology_enabled || userAccount.astrology_scope !== 'personal_and_matching') {
      return 0;
    }
    if (!targetAccount || !targetAccount.astrology_enabled || targetAccount.astrology_scope !== 'personal_and_matching') {
      return 0;
    }

    // Calculate sun signs
    const userBirthDate = {
      year: userProfile.birth_year,
      month: userProfile.birth_month,
      day: userProfile.birth_day
    };
    const targetBirthDate = {
      year: targetProfile.birth_year,
      month: targetProfile.birth_month,
      day: targetProfile.birth_day
    };

    if (!userBirthDate.month || !userBirthDate.day) return 0;
    if (!targetBirthDate.month || !targetBirthDate.day) return 0;

    const userSunSign = getSunSign(userBirthDate);
    const targetSunSign = getSunSign(targetBirthDate);

    if (!userSunSign || !targetSunSign) return 0;

    // Get compatibility heuristic (scoreLite: 0-10)
    const compat = compatibilityHeuristic(userSunSign, targetSunSign, userProfile.language_pref || 'fr');
    return compat.scoreLite; // 0-10
  } catch (error) {
    return 0;
  }
};

/**
 * Generate match reasons (max 3)
 * Priority: 1 geo/interests + 1 pro/mode + 1 guidance signal (numerology OR tarot)
 */
const generateReasons = async (userProfile, targetProfile, scoreBreakdown, lang) => {
  const reasons = [];
  
  // PRIORITY 1: Interests (most visible/concrete)
  if (scoreBreakdown.interests >= 15) {
    const userInterests = new Set(userProfile.interest_ids || []);
    const common = (targetProfile.interest_ids || []).filter(id => userInterests.has(id));
    if (common.length > 0) {
      reasons.push({
        reason_fr: `${common.length} centres d'intérêt en commun`,
        reason_en: `${common.length} shared interests`,
        weight: scoreBreakdown.interests,
        category: 'concrete'
      });
    }
  }
  
  // PRIORITY 2: Location (if no interests or equally important)
  if (scoreBreakdown.location >= 15 && reasons.length < 2) {
    if (userProfile.city === targetProfile.city) {
      reasons.push({
        reason_fr: `Même ville : ${userProfile.city}`,
        reason_en: `Same city: ${userProfile.city}`,
        weight: scoreBreakdown.location,
        category: 'concrete'
      });
    } else if (userProfile.country === targetProfile.country) {
      reasons.push({
        reason_fr: 'Proximité géographique',
        reason_en: 'Geographic proximity',
        weight: scoreBreakdown.location,
        category: 'concrete'
      });
    }
  }
  
  // PRIORITY 3: Pro specific (mode-based)
  if (userProfile.mode_active === 'professional' && scoreBreakdown.pro_bonus >= 5 && reasons.length < 2) {
    reasons.push({
      reason_fr: 'Profil professionnel compatible',
      reason_en: 'Compatible professional profile',
      weight: scoreBreakdown.pro_bonus,
      category: 'mode'
    });
  }
  
  // PRIORITY 4: Guidance signal (ASTROLOGY > NUMEROLOGY > TAROT)
  // ONLY add if we have room (max 3 reasons total)
  if (reasons.length < 3) {
    // Try astrology first (if available)
    if (scoreBreakdown.astrology >= 7) {
      reasons.push({
        reason_fr: 'Signal astrologique favorable',
        reason_en: 'Favorable astrological signal',
        weight: scoreBreakdown.astrology,
        category: 'guidance'
      });
    }
    // Fallback to numerology
    else if (scoreBreakdown.numerology >= 7) {
      reasons.push({
        reason_fr: 'Compatibilité numérologique',
        reason_en: 'Numerological compatibility',
        weight: scoreBreakdown.numerology,
        category: 'guidance'
      });
    }
    // Last fallback: tarot synergy
    else if (scoreBreakdown.tarot_synergy >= 6) {
      reasons.push({
        reason_fr: 'Énergies astrologiques compatibles',
        reason_en: 'Compatible astrological energies',
        weight: scoreBreakdown.tarot_synergy,
        category: 'guidance'
      });
    }
  }
  
  // PRIORITY 5: Activity (only if space left)
  if (scoreBreakdown.activity >= 7 && reasons.length < 3) {
    reasons.push({
      reason_fr: 'Membre actif',
      reason_en: 'Active member',
      weight: scoreBreakdown.activity,
      category: 'bonus'
    });
  }
  
  // STRICT: Sort by weight and take top 3 (never exceed)
  return reasons.sort((a, b) => b.weight - a.weight).slice(0, 3);
};

/**
 * Get eligible candidates for matching (SCALABLE - no list all)
 * Uses batched queries with limits
 */
const getEligibleCandidates = async (userProfile, radiusMultiplier = 1, limit = 50) => {
  try {
    // STEP 1: Get exclusion lists (SECURED with limits + error handling)
    const [blocks, blockedBy, intentions, personalOnlyAccounts] = await Promise.all([
    base44.entities.Block.filter({ blocker_profile_id: userProfile.public_id }, null, 100).catch(() => []),
    base44.entities.Block.filter({ blocked_profile_id: userProfile.public_id }, null, 100).catch(() => []),
    base44.entities.Intention.filter({ from_user_id: userProfile.user_id }, null, 100).catch(() => []),
    base44.entities.AccountPrivate.filter({ personal_use_only: true }, null, 100).catch(() => [])
    ]);
    
    const blockedIds = new Set(blocks.map(b => b.blocked_profile_id));
    const blockerIds = new Set(blockedBy.map(b => b.blocker_profile_id));
    // Intentions store to_user_id as email → map to public_profile_id for comparison against ProfilePublic.public_id
    const intentionEmailsSentTo = new Set(intentions.map(i => i.to_user_id));
    const personalOnlyPublicIds = new Set(personalOnlyAccounts.map(a => a.public_profile_id).filter(Boolean));
    // Build a set of public_ids we already sent intentions to (via AccountPrivate lookup)
    // Since we can't do a join, we collect all AccountPrivate public_profile_ids for those emails
    const intentionAccounts = intentions.length > 0
      ? await Promise.all(
          [...intentionEmailsSentTo].map(email =>
            base44.entities.AccountPrivate.filter({ user_email: email }, null, 1).then(r => r[0]?.public_profile_id).catch(() => null)
          )
        )
      : [];
    const intentionPublicIdsSentTo = new Set(intentionAccounts.filter(Boolean));
    
    // STEP 2: Fetch candidates with FILTERS (use ProfilePublic for matching)
    // Query only profiles that meet basic criteria
    const candidates = await base44.entities.ProfilePublic.filter({
      is_visible: true,
      photo_url: { $exists: true, $ne: null }
    }, '-last_active', limit * 2).catch(() => []); // Fetch 2x limit for filtering
    
    // STEP 3: Filter candidates in memory (already reduced set)
    const filtered = candidates.filter(p => {
      // Not self
      if (p.public_id === userProfile.public_id) return false;
      
      // EXCLUDE personal_use_only users (CRITICAL - privacy enforcement)
      if (personalOnlyPublicIds.has(p.public_id)) return false;
      
      // Must have same mode in looking_for
      if (!p.looking_for?.includes(userProfile.mode_active)) return false;
      
      // Not blocked
      if (blockedIds.has(p.public_id) || blockerIds.has(p.public_id)) return false;
      
      // Don't rematch if intention already sent (compare public_id correctly)
      if (intentionPublicIdsSentTo.has(p.public_id)) return false;
      
      // Location filter (with radius multiplier for fallback)
      const effectiveRadius = (userProfile.radius_km || 50) * radiusMultiplier;
      
      // Simple location filtering (same city = always match)
      if (userProfile.city && p.city) {
        const sameCity = userProfile.city.toLowerCase() === p.city.toLowerCase();
        const sameCountry = userProfile.country && p.country && 
                           userProfile.country.toLowerCase() === p.country.toLowerCase();
        
        // For radius > 100km, accept same country
        if (effectiveRadius >= 100 && sameCountry) return true;
        
        // For smaller radius, require same city or nearby
        if (sameCity) return true;
        if (effectiveRadius >= 50 && sameCountry) return true;
      }
      
      return true; // Accept if no location filtering possible
    });
    
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('[matchingEngine] Error getting candidates:', error);
    // Fail gracefully with empty candidates
    return [];
  }
};

/**
 * Main function: Generate daily matches for a user (SCALABLE)
 * Uses lazy loading with fallback for low-density areas
 */
export const generateDailyMatches = async (userProfile, targetCount = 20) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // STEP 1: Check if matches already exist for today + mode (ALWAYS check first)
    const existing = await base44.entities.DailyMatch.filter({
      profile_id: userProfile.public_id,
      match_date: today,
      mode: userProfile.mode_active
    }, '-compatibility_score', 20).catch(() => []); // Limit to 20
    
    if (existing.length >= targetCount) {
      return existing;
    }
    
    // STEP 2: Generate new matches with fallback mechanism
    let allMatches = [];
    let radiusMultiplier = 1;
    const maxMultiplier = 5; // Max 5x radius expansion
    
    // Fallback loop for low-density areas
    while (allMatches.length < targetCount && radiusMultiplier <= maxMultiplier) {
      // Get candidates (LIMIT to 50 per iteration)
      const candidates = await getEligibleCandidates(userProfile, radiusMultiplier, 50);
      
      if (candidates.length === 0) {
        // No more candidates even with expanded radius
        break;
      }
      
      // STEP 3: Score candidates (BATCH processing with error handling)
      const scoredCandidates = await Promise.all(
        candidates.map(async (candidate) => {
          try {
          const location = calculateDistanceScore(userProfile, candidate);
          const interests = calculateInterestsScore(userProfile, candidate);
          const tarot_synergy = await calculateTarotSynergy(userProfile.public_id, candidate.public_id);
          const astrology = await calculateAstrologyScore(userProfile, candidate);
          const numerology = await calculateNumerologyScore(userProfile, candidate);
          const pro_bonus = calculateProBonus(userProfile, candidate);
          const age = calculateAgeScore(userProfile, candidate);
          const activity = calculateActivityScore(candidate);
          
          const scoreBreakdown = { location, interests, tarot_synergy, astrology, numerology, pro_bonus, age, activity };
          const totalScore = location + interests + tarot_synergy + astrology + numerology + pro_bonus + age + activity;
          
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
          } catch (err) {
            console.error('[matchingEngine] Error scoring candidate:', candidate.public_id, err);
            // Return minimal score on error (fail gracefully)
            return {
              candidate,
              totalScore: 0,
              scoreBreakdown: {},
              reasons: [],
              sharedInterests: []
            };
          }
        })
      );
      
      // Add to matches (avoid duplicates)
      const existingUserIds = new Set(allMatches.map(m => m.candidate.public_id));
      const newMatches = scoredCandidates.filter(m => !existingUserIds.has(m.candidate.public_id));
      allMatches.push(...newMatches);
      
      // If we have enough matches, stop
      if (allMatches.length >= targetCount) break;
      
      // Otherwise, expand radius for next iteration
      radiusMultiplier++;
    }
    
    // STEP 4: Sort by score and take top N (MAX 20)
    const topMatches = allMatches
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, targetCount);
    
    // STEP 5: Store in DailyMatch (BATCH create with error handling)
    if (topMatches.length > 0) {
      const matchRecords = await Promise.all(
        topMatches.map(match => 
          base44.entities.DailyMatch.create({
            profile_id: userProfile.public_id,
            match_date: today,
            mode: userProfile.mode_active,
            matched_profile_id: match.candidate.public_id,
            compatibility_score: Math.round(match.totalScore),
            score_breakdown: match.scoreBreakdown,
            reasons: match.reasons,
            shared_interests: match.sharedInterests,
            is_viewed: false,
            intention_sent: false,
            is_expired: false
          }).catch(err => {
            console.error('[matchingEngine] Error creating match record:', err);
            return null;
          })
        )
      );
      
      // Filter out failed creations
      return matchRecords.filter(Boolean);
    }
    
    return [];
  } catch (error) {
    console.error('[matchingEngine] Error generating matches:', error);
    // Return empty array on error (no crash)
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
    console.error('[matchingEngine] Error marking match as viewed:', error);
    // Non-blocking: analytics only
  }
};