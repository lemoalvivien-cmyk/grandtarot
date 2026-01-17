/**
 * BACKEND FUNCTION: stripe_create_checkout_session
 * Creates a Stripe Checkout Session for subscription payment
 * 
 * SECURITY:
 * - Uses STRIPE_SECRET_KEY from server secrets (NEVER exposed to client)
 * - Validates user authentication server-side
 * - Links session to user via metadata (user_email)
 * - Returns only session.id + url (NO secret data)
 * 
 * REQUIREMENTS:
 * - Secrets: STRIPE_SECRET_KEY (sk_live_... or sk_test_...)
 * - AppSettings: stripe_price_id (price_xxx from Stripe dashboard)
 */

export default async function handler(req, context) {
  const { successUrl, cancelUrl } = req.body;
  
  // STEP 1: AUTH - Get authenticated user (TRUSTED source)
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
  
  const userEmail = currentUser.email; // TRUSTED
  
  // STEP 2: VALIDATION INPUT
  if (!successUrl || !cancelUrl) {
    return {
      statusCode: 400,
      body: { error: 'successUrl and cancelUrl required' }
    };
  }
  
  // STEP 3: LOAD STRIPE CONFIG (server-side ONLY)
  const serviceClient = context.createServiceRoleClient();
  
  let stripeSecretKey;
  let stripePriceId;
  
  try {
    // Get secret key from server environment (SECURE)
    stripeSecretKey = context.secrets?.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return {
        statusCode: 500,
        body: { error: 'STRIPE_SECRET_KEY not configured on server' }
      };
    }
    
    // Get price ID from AppSettings
    const priceSettings = await serviceClient.entities.AppSettings.filter({
      setting_key: 'stripe_price_id'
    }, null, 1);
    
    if (!priceSettings.length || !priceSettings[0].value_string) {
      return {
        statusCode: 500,
        body: { error: 'stripe_price_id not configured in AppSettings' }
      };
    }
    
    stripePriceId = priceSettings[0].value_string;
    
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: 'Failed to load Stripe config', details: error.message }
    };
  }
  
  // STEP 4: CREATE CHECKOUT SESSION (Stripe API call)
  try {
    // Initialize Stripe with secret key (server-side ONLY)
    const stripe = require('stripe')(stripeSecretKey);
    
    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId, // e.g., 'price_1Abc...' from Stripe dashboard
          quantity: 1
        }
      ],
      customer_email: userEmail, // Pre-fill email
      metadata: {
        user_email: userEmail, // CRITICAL: link payment to user
        app_name: 'GRANDTAROT',
        created_at: new Date().toISOString()
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          user_email: userEmail // Also in subscription metadata
        }
      }
    });
    
    // STEP 5: AUDIT LOG (non-blocking)
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'stripe_checkout_created',
      entity_name: 'StripeCheckout',
      entity_id: session.id,
      payload_summary: `Checkout session created: ${session.id}`,
      payload_data: {
        session_id: session.id,
        amount: session.amount_total,
        currency: session.currency
      },
      severity: 'info',
      status: 'success'
    }).catch(() => {});
    
    return {
      statusCode: 200,
      body: {
        sessionId: session.id,
        url: session.url // Client redirects to this URL
      }
    };
    
  } catch (error) {
    console.error('[stripe_create_checkout_session] Error:', error);
    
    // Log error (non-blocking)
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'stripe_checkout_failed',
      entity_name: 'StripeCheckout',
      payload_summary: `Checkout creation failed: ${error.message}`,
      severity: 'critical',
      status: 'failed'
    }).catch(() => {});
    
    return {
      statusCode: 500,
      body: { error: 'Failed to create checkout session', details: error.message }
    };
  }
}