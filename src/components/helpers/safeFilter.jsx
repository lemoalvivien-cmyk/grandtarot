/**
 * SAFE FILTER HELPER - ENFORCES LIMITS
 * Prevents unlimited queries on sensitive entities
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Safe filter with enforced limit
 * @param {Object} entityAPI - base44.entities.EntityName
 * @param {Object} query - Filter criteria
 * @param {String} orderBy - Sort order (e.g. '-created_date')
 * @param {Number} limit - Max results (default 50, max 200)
 * @returns {Promise<Array>}
 */
export const safeFilter = async (entityAPI, query = {}, orderBy = null, limit = DEFAULT_LIMIT) => {
  if (!limit || limit <= 0) {
    limit = DEFAULT_LIMIT;
  }
  
  if (limit > MAX_LIMIT) {
    console.warn(`[SECURITY] safeFilter limit capped from ${limit} to ${MAX_LIMIT}`);
    limit = MAX_LIMIT;
  }
  
  return await entityAPI.filter(query, orderBy, limit);
};