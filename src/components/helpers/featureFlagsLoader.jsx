import { base44 } from '@/api/base44Client';

/**
 * Feature Flags Loader — Centralized helper
 * Loads global feature flags from AppSettings
 * Default to TRUE if flag missing (backward compatibility)
 */

let cachedFlags = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 min cache

export const loadFeatureFlags = async () => {
  // Return cached if fresh
  if (cachedFlags && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedFlags;
  }

  try {
    const [numFlag, astroFlag] = await Promise.all([
      base44.entities.AppSettings.filter({ setting_key: 'feature_numerology' }, null, 1),
      base44.entities.AppSettings.filter({ setting_key: 'feature_astrology' }, null, 1)
    ]);

    const flags = {
      numerology: numFlag.length > 0 ? numFlag[0].value_boolean : true,
      astrology: astroFlag.length > 0 ? astroFlag[0].value_boolean : true
    };

    // Cache result
    cachedFlags = flags;
    cacheTimestamp = Date.now();

    return flags;
  } catch (error) {
    console.error('Error loading feature flags:', error);
    // Default to TRUE on error (backward compatibility)
    return { numerology: true, astrology: true };
  }
};

/**
 * Clear cache (call after admin changes flags)
 */
export const clearFeatureFlagsCache = () => {
  cachedFlags = null;
  cacheTimestamp = null;
};