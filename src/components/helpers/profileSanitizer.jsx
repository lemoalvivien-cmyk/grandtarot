/**
 * Profile Sanitization Helper
 * Removes all sensitive fields (email, user_id) from profiles
 * Returns only public-safe data
 */

/**
 * Sanitize a single profile to remove sensitive data
 * @param {Object} profile - Raw profile from database
 * @returns {Object} - Safe public profile
 */
export function sanitizeProfile(profile) {
  if (!profile) return null;

  // ProfilePublic already has age_range (privacy-safe). UserProfile has birth_year.
  let ageRange = profile.age_range || null;
  if (!ageRange && profile.birth_year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - profile.birth_year;
    const lowerBound = Math.floor(age / 5) * 5;
    ageRange = `${lowerBound}-${lowerBound + 4}`;
  }

  return {
    // Safe identifiers (NO email, NO user_id)
    id: profile.id,
    public_id: profile.public_id || null,
    
    // Public display data
    display_name: profile.display_name || 'User',
    age_range: ageRange,
    gender: profile.gender,
    
    // Location (city only, no precise address)
    city: profile.city,
    geo_zone: profile.geo_zone,
    
    // Interests & Mode
    interest_ids: profile.interest_ids || [],
    mode_active: profile.mode_active || 'love',
    looking_for: profile.looking_for || [],
    
    // Professional (if applicable)
    pro_sector: profile.pro_sector,
    pro_company_size: profile.pro_company_size,
    
    // Photo
    photo_url: profile.photo_url,
    photo_verified: profile.photo_verified || false,
    
    // Trust & Verification
    trust_score: profile.trust_score || 50,
    verified_status: profile.verified_status || 'none',
    
    // Metadata (non-sensitive)
    profile_completion: profile.profile_completion || 0,
    language_pref: profile.language_pref || 'fr'
  };
}

/**
 * Sanitize multiple profiles
 * @param {Array} profiles - Array of raw profiles
 * @returns {Array} - Array of safe profiles
 */
export function sanitizeProfiles(profiles) {
  if (!profiles || !Array.isArray(profiles)) return [];
  return profiles.map(sanitizeProfile).filter(Boolean);
}

/**
 * Get sanitized profile by user_id (for internal use only)
 * DO NOT expose the mapping function to frontend
 * @param {Object} base44 - Base44 SDK instance
 * @param {string} userId - Internal user email (NEVER exposed)
 * @returns {Object} - Sanitized profile
 */
export async function getSanitizedProfileByUserId(base44, userId) {
  try {
    if (!base44 || !userId) return null;
    
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId }, null, 1);
    if (!profiles || profiles.length === 0) return null;
    return sanitizeProfile(profiles[0]);
  } catch (error) {
    console.error('[profileSanitizer] Error fetching profile:', error);
    return null;
  }
}

/**
 * Check if current user owns a profile (internal check)
 * @param {Object} currentUser - Current authenticated user
 * @param {string} profileUserId - Profile's user_id to check
 * @returns {boolean}
 */
export function isOwnProfile(currentUser, profileUserId) {
  if (!currentUser || !profileUserId) return false;
  return currentUser.email === profileUserId;
}