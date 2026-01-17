/**
 * BACKEND FUNCTION: stripe_webhook
 * Handles Stripe webhook events (auto-activation plan_status)
 * 
 * SECURITY:
 * - Verifies Stripe signature (STRIPE_WEBHOOK_SECRET)
 * - Idempotent (event_id stored to prevent double processing)
 * - Uses serviceRole to bypass AccessRules
 * - NO user authentication (webhook from Stripe servers)
 * 
 * REQUIREMENTS:
 * - Secrets: STRIPE_WEBHOOK_SECRET (whsec_...)
 * - Entity: AppSettings (to store processed event_ids)
 * 
 * EVENTS HANDLED:
 * - checkout.session.completed → activate plan_status
 * - invoice.payment_succeeded → renew subscription (future)
 * - customer.subscription.deleted → cancel subscription (future)
 */

export default async function handler(req, context) {
  // STEP 1: GET RAW BODY (required for signature verification)
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    return {
      statusCode: 400,
      body: { error: 'Missing Stripe signature' }
    };
  }
  
  // STEP 2: LOAD WEBHOOK SECRET (server-side ONLY)
  const webhookSecret = context.secrets?.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('[stripe_webhook] STRIPE_WEBHOOK_SECRET not configured');
    return {
      statusCode: 500,
      body: { error: 'Webhook secret not configured' }
    };
  }
  
  // STEP 3: VERIFY SIGNATURE (anti-spoofing)
  let event;
  try {
    const stripe = require('stripe')(context.secrets?.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe_webhook] Signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: { error: `Webhook signature verification failed: ${err.message}` }
    };
  }
  
  // STEP 4: IDEMPOTENCE CHECK (prevent double processing)
  const serviceClient = context.createServiceRoleClient();
  const eventId = event.id;
  
  try {
    const processedEvents = await serviceClient.entities.AppSettings.filter({
      setting_key: `stripe_event_${eventId}`
    }, null, 1);
    
    if (processedEvents.length > 0) {
      console.log(`[stripe_webhook] Event ${eventId} already processed (idempotent)`);
      return {
        statusCode: 200,
        body: { received: true, processed: false, reason: 'already_processed' }
      };
    }
  } catch (error) {
    console.error('[stripe_webhook] Idempotence check failed:', error);
    // Continue anyway (fail-open for critical payment events)
  }
  
  // STEP 5: HANDLE EVENT TYPE
  let processed = false;
  let userEmail = null;
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        userEmail = session.metadata?.user_email || session.customer_email;
        
        if (!userEmail) {
          console.error('[stripe_webhook] No user_email in session metadata');
          return {
            statusCode: 400,
            body: { error: 'Missing user_email in session metadata' }
          };
        }
        
        // ACTIVATE PLAN (primary authority)
        const accounts = await serviceClient.entities.AccountPrivate.filter({
          user_email: userEmail
        }, null, 1);
        
        if (accounts.length === 0) {
          // Create AccountPrivate if missing (new user)
          await serviceClient.entities.AccountPrivate.create({
            user_email: userEmail,
            plan_status: 'active',
            plan_activated_at: new Date().toISOString(),
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            subscription_status: 'active', // Legacy field (kept for backward compat)
            subscription_start: new Date().toISOString()
          });
        } else {
          // Update existing account
          await serviceClient.entities.AccountPrivate.update(accounts[0].id, {
            plan_status: 'active',
            plan_activated_at: new Date().toISOString(),
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            subscription_status: 'active', // Legacy
            subscription_start: new Date().toISOString()
          });
        }
        
        processed = true;
        console.log(`[stripe_webhook] Plan activated for ${userEmail}`);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // Subscription renewal (future enhancement)
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        // Find user by stripe_customer_id
        const accounts = await serviceClient.entities.AccountPrivate.filter({
          stripe_customer_id: customerId
        }, null, 1);
        
        if (accounts.length > 0) {
          userEmail = accounts[0].user_email;
          
          // Renew plan (update subscription_end)
          const subscriptionEnd = new Date();
          subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
          
          await serviceClient.entities.AccountPrivate.update(accounts[0].id, {
            plan_status: 'active',
            subscription_status: 'active',
            subscription_end: subscriptionEnd.toISOString()
          });
          
          processed = true;
          console.log(`[stripe_webhook] Subscription renewed for ${userEmail}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        // Subscription canceled (future enhancement)
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const accounts = await serviceClient.entities.AccountPrivate.filter({
          stripe_customer_id: customerId
        }, null, 1);
        
        if (accounts.length > 0) {
          userEmail = accounts[0].user_email;
          
          await serviceClient.entities.AccountPrivate.update(accounts[0].id, {
            plan_status: 'free',
            subscription_status: 'canceled'
          });
          
          processed = true;
          console.log(`[stripe_webhook] Subscription canceled for ${userEmail}`);
        }
        break;
      }
      
      default:
        console.log(`[stripe_webhook] Unhandled event type: ${event.type}`);
    }
    
  } catch (error) {
    console.error(`[stripe_webhook] Error processing ${event.type}:`, error);
    
    // Log error (non-blocking)
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail || 'stripe_webhook',
      actor_role: 'system',
      action: 'stripe_webhook_error',
      entity_name: 'StripeWebhook',
      entity_id: eventId,
      payload_summary: `Webhook processing failed: ${event.type}`,
      payload_data: {
        event_type: event.type,
        error_message: error.message
      },
      severity: 'critical',
      status: 'failed'
    }).catch(() => {});
    
    return {
      statusCode: 500,
      body: { error: 'Webhook processing failed', details: error.message }
    };
  }
  
  // STEP 6: MARK EVENT AS PROCESSED (idempotence)
  try {
    await serviceClient.entities.AppSettings.create({
      setting_key: `stripe_event_${eventId}`,
      value_string: event.type,
      value_boolean: true,
      category: 'system',
      description_en: `Stripe event processed at ${new Date().toISOString()}`,
      is_public: false
    });
  } catch (error) {
    console.error('[stripe_webhook] Failed to mark event as processed:', error);
    // Non-blocking (event was processed, just couldn't mark it)
  }
  
  // STEP 7: AUDIT LOG (success)
  if (processed && userEmail) {
    await serviceClient.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'system',
      action: 'stripe_webhook_processed',
      entity_name: 'StripeWebhook',
      entity_id: eventId,
      payload_summary: `Stripe event ${event.type} processed for ${userEmail}`,
      payload_data: {
        event_type: event.type,
        event_id: eventId
      },
      severity: 'info',
      status: 'success'
    }).catch(() => {});
  }
  
  return {
    statusCode: 200,
    body: { received: true, processed, event_type: event.type }
  };
}