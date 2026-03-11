/**
 * Astrology Engine V1 LITE - GRANDTAROT
 * Zero external API dependency (deterministic calculations only)
 * 
 * V1: Sun sign + basic compatibility
 * V2 (future): Moon, Ascendant, Houses, Transits (requires birth time + place)
 */

/**
 * SUN SIGN BOUNDARIES (Tropical Zodiac)
 * Based on month + day
 */
const SUN_SIGN_DATES = [
  { sign: 'capricorn', start: [12, 22], end: [1, 19] },
  { sign: 'aquarius', start: [1, 20], end: [2, 18] },
  { sign: 'pisces', start: [2, 19], end: [3, 20] },
  { sign: 'aries', start: [3, 21], end: [4, 19] },
  { sign: 'taurus', start: [4, 20], end: [5, 20] },
  { sign: 'gemini', start: [5, 21], end: [6, 20] },
  { sign: 'cancer', start: [6, 21], end: [7, 22] },
  { sign: 'leo', start: [7, 23], end: [8, 22] },
  { sign: 'virgo', start: [8, 23], end: [9, 22] },
  { sign: 'libra', start: [9, 23], end: [10, 22] },
  { sign: 'scorpio', start: [10, 23], end: [11, 21] },
  { sign: 'sagittarius', start: [11, 22], end: [12, 21] }
];

/**
 * Calculate sun sign from birth date (DETERMINISTIC)
 * Returns: 'aries' | 'taurus' | ... | 'pisces'
 */
export const getSunSign = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'object') return null;
  
  const { month, day } = birthDate;
  
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  // Handle year-crossing signs (Capricorn: Dec 22 - Jan 19)
  if (month === 12 && day >= 22) return 'capricorn';
  if (month === 1 && day <= 19) return 'capricorn';
  
  for (const { sign, start, end } of SUN_SIGN_DATES) {
    const [startMonth, startDay] = start;
    const [endMonth, endDay] = end;
    
    // Same month range
    if (month === startMonth && month === endMonth) {
      if (day >= startDay && day <= endDay) return sign;
    }
    // Cross-month range
    else if (month === startMonth && day >= startDay) {
      return sign;
    }
    else if (month === endMonth && day <= endDay) {
      return sign;
    }
  }
  
  return null;
};

/**
 * Get element for a sign
 * Fire, Earth, Air, Water
 */
export const getElement = (sign) => {
  const elements = {
    fire: ['aries', 'leo', 'sagittarius'],
    earth: ['taurus', 'virgo', 'capricorn'],
    air: ['gemini', 'libra', 'aquarius'],
    water: ['cancer', 'scorpio', 'pisces']
  };
  
  for (const [element, signs] of Object.entries(elements)) {
    if (signs.includes(sign)) return element;
  }
  
  return null;
};

/**
 * Get quality (modality) for a sign
 * Cardinal, Fixed, Mutable
 */
export const getQuality = (sign) => {
  const qualities = {
    cardinal: ['aries', 'cancer', 'libra', 'capricorn'],
    fixed: ['taurus', 'leo', 'scorpio', 'aquarius'],
    mutable: ['gemini', 'virgo', 'sagittarius', 'pisces']
  };
  
  for (const [quality, signs] of Object.entries(qualities)) {
    if (signs.includes(sign)) return quality;
  }
  
  return null;
};

/**
 * Get sign keywords and theme
 */
export const getSignKeywords = (sign) => {
  const keywords = {
    aries: {
      keywords_fr: ['Initiative', 'Courage', 'Dynamisme'],
      keywords_en: ['Initiative', 'Courage', 'Dynamism'],
      theme_fr: 'Le Pionnier',
      theme_en: 'The Pioneer'
    },
    taurus: {
      keywords_fr: ['Stabilité', 'Sensualité', 'Persévérance'],
      keywords_en: ['Stability', 'Sensuality', 'Perseverance'],
      theme_fr: 'Le Bâtisseur',
      theme_en: 'The Builder'
    },
    gemini: {
      keywords_fr: ['Communication', 'Curiosité', 'Adaptabilité'],
      keywords_en: ['Communication', 'Curiosity', 'Adaptability'],
      theme_fr: 'Le Communicateur',
      theme_en: 'The Communicator'
    },
    cancer: {
      keywords_fr: ['Intuition', 'Protection', 'Émotion'],
      keywords_en: ['Intuition', 'Protection', 'Emotion'],
      theme_fr: 'Le Protecteur',
      theme_en: 'The Protector'
    },
    leo: {
      keywords_fr: ['Créativité', 'Générosité', 'Confiance'],
      keywords_en: ['Creativity', 'Generosity', 'Confidence'],
      theme_fr: 'Le Souverain',
      theme_en: 'The Sovereign'
    },
    virgo: {
      keywords_fr: ['Analyse', 'Service', 'Perfectionnisme'],
      keywords_en: ['Analysis', 'Service', 'Perfectionism'],
      theme_fr: "L'Analyste",
      theme_en: 'The Analyst'
    },
    libra: {
      keywords_fr: ['Harmonie', 'Justice', 'Diplomatie'],
      keywords_en: ['Harmony', 'Justice', 'Diplomacy'],
      theme_fr: 'Le Diplomate',
      theme_en: 'The Diplomat'
    },
    scorpio: {
      keywords_fr: ['Intensité', 'Transformation', 'Profondeur'],
      keywords_en: ['Intensity', 'Transformation', 'Depth'],
      theme_fr: 'Le Transformateur',
      theme_en: 'The Transformer'
    },
    sagittarius: {
      keywords_fr: ['Aventure', 'Philosophie', 'Optimisme'],
      keywords_en: ['Adventure', 'Philosophy', 'Optimism'],
      theme_fr: "L'Explorateur",
      theme_en: 'The Explorer'
    },
    capricorn: {
      keywords_fr: ['Ambition', 'Discipline', 'Responsabilité'],
      keywords_en: ['Ambition', 'Discipline', 'Responsibility'],
      theme_fr: 'Le Stratège',
      theme_en: 'The Strategist'
    },
    aquarius: {
      keywords_fr: ['Innovation', 'Indépendance', 'Humanité'],
      keywords_en: ['Innovation', 'Independence', 'Humanity'],
      theme_fr: "L'Innovateur",
      theme_en: 'The Innovator'
    },
    pisces: {
      keywords_fr: ['Compassion', 'Créativité', 'Spiritualité'],
      keywords_en: ['Compassion', 'Creativity', 'Spirituality'],
      theme_fr: 'Le Rêveur',
      theme_en: 'The Dreamer'
    }
  };
  
  return keywords[sign] || {
    keywords_fr: [],
    keywords_en: [],
    theme_fr: '',
    theme_en: ''
  };
};

/**
 * Simple compatibility heuristic
 * Based on elements + qualities
 * Returns: { scoreLite: 0-10, oneLine: string, strength: string, caution: string }
 */
export const compatibilityHeuristic = (signA, signB, lang = 'fr') => {
  if (!signA || !signB) {
    return {
      scoreLite: 0,
      oneLine: lang === 'fr' ? 'Données insuffisantes' : 'Insufficient data',
      strength: '',
      caution: ''
    };
  }
  
  const elementA = getElement(signA);
  const elementB = getElement(signB);
  const qualityA = getQuality(signA);
  const qualityB = getQuality(signB);
  
  // ELEMENT COMPATIBILITY
  // Same element = 10 (natural harmony)
  if (elementA === elementB) {
    return {
      scoreLite: 10,
      oneLine: lang === 'fr' ? 'Harmonie naturelle' : 'Natural harmony',
      strength: lang === 'fr' ? 'Même élément' : 'Same element',
      caution: lang === 'fr' ? 'Éviter la routine' : 'Avoid routine'
    };
  }
  
  // Compatible elements (trine aspect)
  const compatiblePairs = [
    ['fire', 'air'], ['air', 'fire'],
    ['earth', 'water'], ['water', 'earth']
  ];
  
  const isCompatible = compatiblePairs.some(([e1, e2]) => 
    (elementA === e1 && elementB === e2) || (elementA === e2 && elementB === e1)
  );
  
  if (isCompatible) {
    return {
      scoreLite: 8,
      oneLine: lang === 'fr' ? 'Complémentarité' : 'Complementarity',
      strength: lang === 'fr' ? 'Éléments compatibles' : 'Compatible elements',
      caution: ''
    };
  }
  
  // Challenging elements (square/opposition)
  const challengingPairs = [
    ['fire', 'water'], ['water', 'fire'],
    ['earth', 'air'], ['air', 'earth']
  ];
  
  const isChallenging = challengingPairs.some(([e1, e2]) => 
    (elementA === e1 && elementB === e2) || (elementA === e2 && elementB === e1)
  );
  
  if (isChallenging) {
    return {
      scoreLite: 5,
      oneLine: lang === 'fr' ? 'Demande des efforts' : 'Requires effort',
      strength: lang === 'fr' ? 'Croissance mutuelle' : 'Mutual growth',
      caution: lang === 'fr' ? 'Patience nécessaire' : 'Patience needed'
    };
  }
  
  // QUALITY COMPATIBILITY (if same element didn't match)
  // Same quality = moderate (can be stubborn)
  if (qualityA === qualityB) {
    return {
      scoreLite: 6,
      oneLine: lang === 'fr' ? 'Compréhension mutuelle' : 'Mutual understanding',
      strength: lang === 'fr' ? 'Même tempo' : 'Same tempo',
      caution: lang === 'fr' ? 'Flexibilité clé' : 'Flexibility is key'
    };
  }
  
  // Default: neutral
  return {
    scoreLite: 6,
    oneLine: lang === 'fr' ? 'Équilibre possible' : 'Balance possible',
    strength: lang === 'fr' ? 'Ouverture mutuelle' : 'Mutual openness',
    caution: ''
  };
};

/**
 * DISCLAIMER
 */
export const ASTRO_DISCLAIMER = {
  fr: "Signal d'aide à la décision, pas une certitude.",
  en: "Decision-making signal, not a certainty."
};

/**
 * ========================================
 * V2 PLACEHOLDERS (Not implemented yet)
 * ========================================
 */

/**
 * Calculate natal profile (V2 - requires birth time + place)
 * @param {Object} birthData - { date, time, place: { lat, lon } }
 * @returns {Object} { sun, moon, ascendant, houses, ... }
 * 
 * NOTE: This will require either:
 * - Swiss Ephemeris integration (complex)
 * - External API (e.g. astro-charts API, paid)
 * - Pre-calculated ephemeris tables (large data)
 * 
 * For now: V1 only uses sun sign (no time/place needed)
 */
export const getNatalProfile = (birthData) => {
  throw new Error('V2 feature not implemented yet. Use getSunSign() for V1.');
};

/**
 * Calculate daily transits (V2 - requires current date + natal profile)
 */
export const getDailyTransits = (currentDate, natalProfile) => {
  throw new Error('V2 feature not implemented yet.');
};

/**
 * Calculate synastry (V2 - requires two full natal profiles)
 */
export const calculateSynastry = (profileA, profileB) => {
  throw new Error('V2 feature not implemented yet. Use compatibilityHeuristic() for V1.');
};