/**
 * Numerology Engine - GRANDTAROT
 * Deterministic calculations (zero AI cost)
 * AI is ONLY used for daily guidance interpretation (cached)
 */

/**
 * LETTER-TO-NUMBER MAPPING
 * Standard Pythagorean system (most widely used)
 * A-I = 1-9, J-R = 1-9, S-Z = 1-8
 */
const DEFAULT_MAPPING = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
};

/**
 * Remove accents and normalize to uppercase letters only
 */
export const normalizeName = (name) => {
  if (!name) return '';
  
  // Remove accents
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  
  // Keep only A-Z
  return normalized.replace(/[^A-Z]/g, '');
};

/**
 * Reduce a number to single digit (1-9)
 * Master numbers 11, 22, 33 are preserved
 */
export const reduceNumber = (num) => {
  if (num === 11 || num === 22 || num === 33) return num;
  
  while (num > 9) {
    num = String(num)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    
    // Check master numbers again
    if (num === 11 || num === 22 || num === 33) return num;
  }
  
  return num;
};

/**
 * Calculate Life Path Number from birth date
 * Params: { year, month, day }
 * Returns: number (1-9, 11, 22, 33)
 */
export const lifePathNumber = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'object') return null;
  
  const { year, month, day } = birthDate;
  
  if (!year || !month || !day || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  // Reduce each component first
  const reducedYear = reduceNumber(year);
  const reducedMonth = reduceNumber(month);
  const reducedDay = reduceNumber(day);
  
  // Sum and reduce final
  const sum = reducedYear + reducedMonth + reducedDay;
  return reduceNumber(sum);
};

/**
 * Calculate Personal Day Number
 * Combines birth date with target date
 * Returns: number (1-9)
 */
export const personalDayNumber = (birthDate, targetDate) => {
  if (!birthDate || !targetDate || typeof birthDate !== 'object' || typeof targetDate !== 'object') return null;
  
  const { month: birthMonth, day: birthDay } = birthDate;
  const { year: targetYear, month: targetMonth, day: targetDay } = targetDate;
  
  if (!birthMonth || !birthDay || !targetYear || !targetMonth || !targetDay) return null;
  if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) return null;
  if (targetMonth < 1 || targetMonth > 12 || targetDay < 1 || targetDay > 31) return null;
  
  // Calculate personal year first
  const personalYear = reduceNumber(birthMonth + birthDay + targetYear);
  
  // Personal day = personal year + target month + target day
  const personalDay = personalYear + targetMonth + targetDay;
  return reduceNumber(personalDay);
};

/**
 * Calculate Expression Number from full name
 * Pythagorean system
 * Returns: number (1-9, 11, 22, 33) or null if no name
 */
export const nameExpressionNumber = (fullName) => {
  if (!fullName) return null;
  
  const normalized = normalizeName(fullName);
  if (!normalized) return null;
  
  const sum = normalized.split('').reduce((total, letter) => {
    return total + (DEFAULT_MAPPING[letter] || 0);
  }, 0);
  
  return reduceNumber(sum);
};

/**
 * Calculate compatibility between two life path numbers
 * Returns: { scoreLite: 0-10, oneLine: string, strength: string, caution: string }
 */
export const compatibilitySignal = (numA, numB, lang = 'fr') => {
  if (!numA || !numB) {
    return { 
      scoreLite: 0, 
      oneLine: lang === 'fr' ? 'Données insuffisantes' : 'Insufficient data',
      strength: '',
      caution: ''
    };
  }
  
  // Compatibility matrix (simplified)
  // Perfect matches: same number or complementary pairs
  const perfectMatches = [
    [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9],
    [1, 5], [5, 1], // Adventure seekers
    [2, 6], [6, 2], // Nurturers
    [3, 5], [5, 3], // Creative spirits
    [4, 8], [8, 4], // Builders
    [7, 9], [9, 7]  // Spiritual connection
  ];
  
  // Good matches
  const goodMatches = [
    [1, 3], [3, 1], [1, 9], [9, 1],
    [2, 4], [4, 2], [2, 8], [8, 2],
    [3, 6], [6, 3], [3, 9], [9, 3],
    [4, 6], [6, 4],
    [5, 7], [7, 5]
  ];
  
  // Challenging matches
  const challenges = [
    [1, 4], [4, 1], [1, 8], [8, 1],
    [2, 5], [5, 2], [2, 9], [9, 2],
    [4, 5], [5, 4],
    [7, 8], [8, 7]
  ];
  
  const isPerfect = perfectMatches.some(([a, b]) => (a === numA && b === numB));
  const isGood = goodMatches.some(([a, b]) => (a === numA && b === numB));
  const isChallenging = challenges.some(([a, b]) => (a === numA && b === numB));
  
  if (isPerfect) {
    return {
      scoreLite: 10,
      oneLine: lang === 'fr' ? 'Harmonie naturelle' : 'Natural harmony',
      strength: lang === 'fr' ? 'Vibrations alignées' : 'Aligned vibrations',
      caution: ''
    };
  }
  
  if (isGood) {
    return {
      scoreLite: 7,
      oneLine: lang === 'fr' ? 'Compatibilité prometteuse' : 'Promising compatibility',
      strength: lang === 'fr' ? 'Complémentarité' : 'Complementarity',
      caution: ''
    };
  }
  
  if (isChallenging) {
    return {
      scoreLite: 4,
      oneLine: lang === 'fr' ? 'Demande des efforts' : 'Requires effort',
      strength: lang === 'fr' ? 'Croissance possible' : 'Growth potential',
      caution: lang === 'fr' ? 'Communication clé' : 'Communication is key'
    };
  }
  
  // Neutral
  return {
    scoreLite: 6,
    oneLine: lang === 'fr' ? 'Équilibre possible' : 'Balance possible',
    strength: lang === 'fr' ? 'Ouverture mutuelle' : 'Mutual openness',
    caution: ''
  };
};

/**
 * Get Life Path interpretation (basic keywords)
 * Returns: { keywords_fr: string[], keywords_en: string[], theme_fr: string, theme_en: string }
 */
export const getLifePathKeywords = (lifePathNum) => {
  const interpretations = {
    1: {
      keywords_fr: ['Leadership', 'Indépendance', 'Innovation'],
      keywords_en: ['Leadership', 'Independence', 'Innovation'],
      theme_fr: 'Le Leader',
      theme_en: 'The Leader'
    },
    2: {
      keywords_fr: ['Diplomatie', 'Coopération', 'Sensibilité'],
      keywords_en: ['Diplomacy', 'Cooperation', 'Sensitivity'],
      theme_fr: 'Le Diplomate',
      theme_en: 'The Diplomat'
    },
    3: {
      keywords_fr: ['Créativité', 'Expression', 'Communication'],
      keywords_en: ['Creativity', 'Expression', 'Communication'],
      theme_fr: "L'Artiste",
      theme_en: 'The Artist'
    },
    4: {
      keywords_fr: ['Stabilité', 'Organisation', 'Pragmatisme'],
      keywords_en: ['Stability', 'Organization', 'Pragmatism'],
      theme_fr: 'Le Bâtisseur',
      theme_en: 'The Builder'
    },
    5: {
      keywords_fr: ['Liberté', 'Aventure', 'Changement'],
      keywords_en: ['Freedom', 'Adventure', 'Change'],
      theme_fr: "L'Explorateur",
      theme_en: 'The Explorer'
    },
    6: {
      keywords_fr: ['Responsabilité', 'Harmonie', 'Service'],
      keywords_en: ['Responsibility', 'Harmony', 'Service'],
      theme_fr: 'Le Protecteur',
      theme_en: 'The Protector'
    },
    7: {
      keywords_fr: ['Sagesse', 'Analyse', 'Spiritualité'],
      keywords_en: ['Wisdom', 'Analysis', 'Spirituality'],
      theme_fr: 'Le Sage',
      theme_en: 'The Sage'
    },
    8: {
      keywords_fr: ['Pouvoir', 'Ambition', 'Réussite'],
      keywords_en: ['Power', 'Ambition', 'Success'],
      theme_fr: 'Le Magnat',
      theme_en: 'The Mogul'
    },
    9: {
      keywords_fr: ['Humanité', 'Altruisme', 'Vision'],
      keywords_en: ['Humanity', 'Altruism', 'Vision'],
      theme_fr: "L'Humaniste",
      theme_en: 'The Humanitarian'
    },
    11: {
      keywords_fr: ['Intuition', 'Inspiration', 'Illumination'],
      keywords_en: ['Intuition', 'Inspiration', 'Illumination'],
      theme_fr: "L'Inspirateur",
      theme_en: 'The Inspirer'
    },
    22: {
      keywords_fr: ['Maîtrise', 'Vision', 'Réalisation'],
      keywords_en: ['Mastery', 'Vision', 'Realization'],
      theme_fr: 'Le Maître Bâtisseur',
      theme_en: 'The Master Builder'
    },
    33: {
      keywords_fr: ['Enseignement', 'Compassion', 'Guérison'],
      keywords_en: ['Teaching', 'Compassion', 'Healing'],
      theme_fr: 'Le Maître Enseignant',
      theme_en: 'The Master Teacher'
    }
  };
  
  return interpretations[lifePathNum] || {
    keywords_fr: [],
    keywords_en: [],
    theme_fr: '',
    theme_en: ''
  };
};

/**
 * Daily number interpretation (basic keywords)
 */
export const getDailyNumberKeywords = (dailyNum, lang = 'fr') => {
  const interpretations = {
    1: { fr: 'Nouveau départ, initiative', en: 'New beginning, initiative' },
    2: { fr: 'Coopération, patience', en: 'Cooperation, patience' },
    3: { fr: 'Créativité, expression', en: 'Creativity, expression' },
    4: { fr: 'Organisation, travail', en: 'Organization, work' },
    5: { fr: 'Changement, adaptabilité', en: 'Change, adaptability' },
    6: { fr: 'Responsabilité, famille', en: 'Responsibility, family' },
    7: { fr: 'Réflexion, introspection', en: 'Reflection, introspection' },
    8: { fr: 'Pouvoir, accomplissement', en: 'Power, accomplishment' },
    9: { fr: 'Achèvement, transition', en: 'Completion, transition' }
  };
  
  return interpretations[dailyNum]?.[lang] || '';
};