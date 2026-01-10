/**
 * SAFE QUERY HELPER - NO MERCY MODE
 * Enforces limits on all queries to prevent mass data leaks
 */

const MAX_QUERY_LIMIT = 500; // Absolute maximum
const DEFAULT_LIMIT = 50;    // Default if not specified

/**
 * Safe filter wrapper - ENFORCES limit
 * @param {Object} entityAPI - base44.entities.EntityName
 * @param {Object} query - Filter query object
 * @param {String} orderBy - Sort order (e.g. '-created_date')
 * @param {Number} limit - Max results (required, max 500)
 * @returns {Promise<Array>} Filtered results
 */
export const safeFilter = async (entityAPI, query = {}, orderBy = null, limit = DEFAULT_LIMIT) => {
  // ENFORCE LIMIT
  if (!limit || limit <= 0) {
    throw new Error(`[SECURITY] safeFilter requires explicit limit (provided: ${limit})`);
  }
  
  if (limit > MAX_QUERY_LIMIT) {
    console.warn(`[SECURITY] safeFilter limit capped from ${limit} to ${MAX_QUERY_LIMIT}`);
    limit = MAX_QUERY_LIMIT;
  }
  
  // Execute query with enforced limit
  return await entityAPI.filter(query, orderBy, limit);
};

/**
 * BLOCKED: .list() is not allowed on sensitive entities
 * Use safeFilter instead
 */
export const blockList = () => {
  throw new Error('[SECURITY] .list() is disabled. Use safeFilter() with explicit limits.');
};

/**
 * Safe query for current user's own data
 * Automatically adds owner filter
 */
export const safeFilterOwn = async (entityAPI, ownerField, ownerValue, additionalQuery = {}, orderBy = null, limit = DEFAULT_LIMIT) => {
  const query = {
    [ownerField]: ownerValue,
    ...additionalQuery
  };
  
  return safeFilter(entityAPI, query, orderBy, limit);
};

/**
 * Safe pagination helper
 * Returns { data, hasMore, nextCursor }
 */
export const safePaginate = async (entityAPI, query = {}, orderBy = null, pageSize = 20, cursor = null) => {
  if (pageSize > 100) {
    throw new Error(`[SECURITY] Page size too large (max 100, requested ${pageSize})`);
  }
  
  let finalQuery = { ...query };
  if (cursor) {
    finalQuery = {
      ...query,
      created_date: { $lt: cursor }
    };
  }
  
  const results = await safeFilter(entityAPI, finalQuery, orderBy || '-created_date', pageSize + 1);
  
  const hasMore = results.length > pageSize;
  const data = hasMore ? results.slice(0, pageSize) : results;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].created_date : null;
  
  return { data, hasMore, nextCursor };
};