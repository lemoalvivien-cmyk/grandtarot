/**
 * BACKEND FUNCTION: stripe_create_portal_session
 * Creates a Stripe Customer Portal session for subscription management
 * 
 * SECURITY:
 * - Uses STRIPE_SECRET_KEY from server secrets
 * - Validates user authentication
 * - Only allows user to manage their OWN subscription
 * 
 * REQUIREMENTS:
 * - Secrets: STRIPE_SECRET_KEY
 * - AccountPrivate.stripe_customer_id must exist
 */

export default async function handler(req, context) {
  const { returnUrl } = req.body;
  
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
  
  // STEP 2: VALIDATION
  if (!returnUrl) {
    return {
      statusCode: 400,
      body: { error: 'returnUrl required' }
    };
  }
  
  // STEP 3: LOAD STRIPE CONFIG
  const stripeSecretKey = context.secrets?.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    return {
      statusCode: 500,
      body: { error: 'STRIPE_SECRET_KEY not configured' }
    };
  }
  
  // STEP 4: GET USER'S STRIPE CUSTOMER ID
  const serviceClient = context.createServiceRoleClient();
  
  try {
    const accounts = await serviceClient.entities.AccountPrivate.filter({
      user_email: userEmail
    }, null, 1);
    
    if (accounts.length === 0 || !accounts[0].stripe_customer_id) {
      return {
        statusCode: 404,
        body: { error: 'No Stripe customer found (subscription may not exist)' }
      };
    }
    
    const customerId = accounts[0].stripe_customer_id;
    
    // STEP 5: CREATE PORTAL SESSION
    const stripe = require('stripe')(stripeSecretKey);
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    
    // STEP 6: AUDIT LOG
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'stripe_portal_opened',
      entity_name: 'StripePortal',
      entity_id: portalSession.id,
      payload_summary: `Customer portal session created`,
      severity: 'info',
      status: 'success'
    }).catch(() => {});
    
    return {
      statusCode: 200,
      body: {
        url: portalSession.url
      }
    };
    
  } catch (error) {
    console.error('[stripe_create_portal_session] Error:', error);
    
    return {
      statusCode: 500,
      body: { error: 'Failed to create portal session', details: error.message }
    };
  }
}