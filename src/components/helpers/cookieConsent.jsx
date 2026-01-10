/**
 * Cookie Consent Helper - CNIL/GDPR Compliant
 * Manages cookie preferences (localStorage + AccountPrivate)
 */

export const CONSENT_VERSION = "1.0";

const STORAGE_KEY = "grandtarot_cookie_consent";

/**
 * Default consent object structure
 */
const defaultConsent = {
  status: "unset", // unset | accepted | rejected | custom
  version: CONSENT_VERSION,
  timestamp: null,
  categories: {
    necessary: true, // Always true, non-toggleable
    preferences: false,
    analytics: false,
    marketing: false
  }
};

/**
 * Get stored consent from localStorage
 * @returns {object} Consent object
 */
export function getStoredConsent() {
  if (typeof window === "undefined") {
    return { ...defaultConsent };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Error reading cookie consent from localStorage:", error);
  }

  return { ...defaultConsent };
}

/**
 * Save consent to localStorage
 * @param {object} consentObj - Consent object with status, categories, timestamp, version
 */
export function saveConsent(consentObj) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const consent = {
      status: consentObj.status || "unset",
      version: consentObj.version || CONSENT_VERSION,
      timestamp: consentObj.timestamp || new Date().toISOString(),
      categories: {
        necessary: true,
        preferences: consentObj.categories?.preferences || false,
        analytics: consentObj.categories?.analytics || false,
        marketing: consentObj.categories?.marketing || false
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    console.warn("Error saving cookie consent to localStorage:", error);
  }
}

/**
 * Clear consent from localStorage
 */
export function clearConsent() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Error clearing cookie consent:", error);
  }
}

/**
 * Check if specific category is consented
 * @param {string} category - Category: preferences | analytics | marketing
 * @returns {boolean} True if consented
 */
export function hasConsent(category) {
  const consent = getStoredConsent();

  if (consent.status === "unset") {
    return false;
  }

  if (consent.status === "rejected") {
    return false;
  }

  if (consent.status === "accepted") {
    // "Tout accepter" = all optional categories accepted
    return category !== "necessary";
  }

  // Custom consent
  if (consent.status === "custom") {
    return consent.categories[category] === true;
  }

  return false;
}

/**
 * Check if analytics should be loaded
 * Convenience function for analytics providers
 * @returns {boolean} True if analytics consent given
 */
export function shouldLoadAnalytics() {
  return hasConsent("analytics");
}

/**
 * Check if banner should be displayed
 * @returns {boolean} True if consent status is "unset"
 */
export function shouldShowBanner() {
  const consent = getStoredConsent();
  return consent.status === "unset";
}

/**
 * Generate full consent object with timestamp
 * @param {string} status - unset | accepted | rejected | custom
 * @param {object} categories - {preferences, analytics, marketing}
 * @returns {object} Complete consent object
 */
export function generateConsentObject(status, categories = {}) {
  return {
    status,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: {
      necessary: true,
      preferences: categories.preferences || false,
      analytics: categories.analytics || false,
      marketing: categories.marketing || false
    }
  };
}

/**
 * Apply consent to user's AccountPrivate (if logged in)
 * Updates user's cookie consent record
 * @param {object} base44Client - Base44 SDK client
 * @param {object} consentObj - Consent object
 */
export async function applyConsentToAccountPrivate(base44Client, consentObj) {
  try {
    // Check if user is authenticated
    const isAuth = await base44Client.auth.isAuthenticated();

    if (!isAuth) {
      // Not logged in, only localStorage used
      return;
    }

    // Get current user
    const user = await base44Client.auth.me();

    // Try to fetch existing AccountPrivate
    const accounts = await base44Client.entities.AccountPrivate.filter({
      user_email: user.email
    }, null, 1);

    if (accounts.length > 0) {
      // Update existing
      await base44Client.entities.AccountPrivate.update(accounts[0].id, {
        cookie_consent_status: consentObj.status,
        cookie_consent_at: consentObj.timestamp,
        cookie_consent_version: consentObj.version,
        cookie_consent_categories: consentObj.categories
      });
    } else {
      // Create new (shouldn't happen, but handle it)
      await base44Client.entities.AccountPrivate.create({
        user_email: user.email,
        cookie_consent_status: consentObj.status,
        cookie_consent_at: consentObj.timestamp,
        cookie_consent_version: consentObj.version,
        cookie_consent_categories: consentObj.categories
      });
    }
  } catch (error) {
    console.warn("Error applying consent to AccountPrivate:", error);
    // Fail silently - localStorage is sufficient
  }
}

/**
 * Reset consent (clear all stored data)
 * Used when user clicks "Reset choice" or consent version changes
 * @param {object} base44Client - Base44 SDK client (optional)
 */
export async function resetConsent(base44Client = null) {
  // Clear localStorage
  clearConsent();

  // Clear AccountPrivate if logged in
  if (base44Client) {
    try {
      const isAuth = await base44Client.auth.isAuthenticated();

      if (isAuth) {
        const user = await base44Client.auth.me();
        const accounts = await base44Client.entities.AccountPrivate.filter({
          user_email: user.email
        }, null, 1);

        if (accounts.length > 0) {
          await base44Client.entities.AccountPrivate.update(accounts[0].id, {
            cookie_consent_status: "unset",
            cookie_consent_at: null,
            cookie_consent_version: null,
            cookie_consent_categories: null
          });
        }
      }
    } catch (error) {
      console.warn("Error resetting consent in AccountPrivate:", error);
    }
  }
}