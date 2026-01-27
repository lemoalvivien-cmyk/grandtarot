/**
 * BACKEND FUNCTION: validate_age_gate
 * Server-side age verification (RGPD/COPPA compliance)
 * 
 * CRITICAL: Prevents minors (<18) from accessing platform
 * Called during onboarding completion
 * 
 * SECURITY:
 * - Validates age >= 18 from birth_year
 * - Records age_confirmed_at timestamp
 * - Prevents admin bypass (constraint enforced)
 * - Audit logs all confirmations
 */

export default async function handler(req, context) {
  const { birth_year, birth_month, birth_day } = req.body;
  
  // STEP 1: AUTH
  const client = context.createClientFromRequest(req);
  let currentUser;
  try {
    currentUser = await client.auth.me();
  } catch (error) {
    return {
      statusCode: 401,
      body: { error: 'Non authentifié' }
    };
  }
  
  const userEmail = currentUser.email;
  
  // STEP 2: VALIDATION INPUT
  if (!birth_year || birth_year < 1900 || birth_year > new Date().getFullYear()) {
    return {
      statusCode: 400,
      body: { error: 'Invalid birth_year' }
    };
  }
  
  // STEP 3: AGE CALCULATION (server-side ONLY - no trust client)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();
  
  let age = currentYear - birth_year;
  
  // Adjust if birthday not yet passed this year
  if (birth_month && birth_day) {
    if (currentMonth < birth_month || (currentMonth === birth_month && currentDay < birth_day)) {
      age -= 1;
    }
  }
  
  // STEP 4: STRICT CHECK (>= 18)
  if (age < 18) {
    const serviceClient = context.createServiceRoleClient();
    
    // LOG ATTEMPT (security)
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'age_gate_rejected',
      entity_name: 'AccountPrivate',
      payload_summary: `Underage attempt: age=${age}`,
      payload_data: { age, birth_year },
      severity: 'warning',
      status: 'failed'
    }).catch(() => {});
    
    return {
      statusCode: 403,
      body: { 
        error: 'Age verification failed',
        reason: 'underage',
        minimum_age: 18,
        calculated_age: age
      }
    };
  }
  
  // STEP 5: RECORD AGE CONFIRMATION (AccountPrivate)
  const serviceClient = context.createServiceRoleClient();
  
  try {
    const accounts = await serviceClient.entities.AccountPrivate.filter({
      user_email: userEmail
    }, null, 1);
    
    if (accounts.length === 0) {
      // Create AccountPrivate if missing
      await serviceClient.entities.AccountPrivate.create({
        user_email: userEmail,
        age_confirmed_at: new Date().toISOString(),
        plan_status: 'free' // Default
      });
    } else {
      // Update existing
      await serviceClient.entities.AccountPrivate.update(accounts[0].id, {
        age_confirmed_at: new Date().toISOString()
      });
    }
    
    // STEP 6: AUDIT LOG (success)
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'age_gate_confirmed',
      entity_name: 'AccountPrivate',
      payload_summary: `Age verified: ${age} years old`,
      payload_data: { age, birth_year },
      severity: 'info',
      status: 'success'
    }).catch(() => {});
    
    return {
      statusCode: 200,
      body: {
        success: true,
        age_confirmed: true,
        calculated_age: age
      }
    };
    
  } catch (error) {
    console.error('[validate_age_gate] Error:', error);
    
    return {
      statusCode: 500,
      body: { error: 'Failed to record age confirmation', details: error.message }
    };
  }
}