/**
 * stripe_webhook — Base44 V3
 * Webhook Stripe avec vérification de signature async (Deno).
 * Active/désactive plan_status dans AccountPrivate via serviceRole.
 * Idempotence : AuditLog avec entity_id = event.id.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17';

Deno.serve(async (req) => {
  // STEP 1: LIRE LE BODY RAW (requis pour signature Stripe)
  const rawBodyBuffer = await req.arrayBuffer();
  const rawBody = new TextDecoder().decode(rawBodyBuffer);

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return Response.json({ error: 'Signature Stripe manquante' }, { status: 400 });
  }

  // STEP 2: SECRETS
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!webhookSecret || !stripeSecretKey) {
    return Response.json({ error: 'Secrets Stripe non configurés' }, { status: 500 });
  }

  // STEP 3: VÉRIFICATION SIGNATURE (async requis sur Deno)
  const stripe = new Stripe(stripeSecretKey);
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    return Response.json({ error: `Signature invalide: ${err.message}` }, { status: 400 });
  }

  // STEP 4: SERVICE ROLE (bypass accessRules)
  // NB: pas d'auth user ici — c'est un appel venant de Stripe, pas d'un utilisateur
  const base44 = createClientFromRequest(req);
  const serviceRole = base44.asServiceRole;

  // STEP 5: IDEMPOTENCE — vérifier si event déjà traité (via AuditLog)
  const existingLogs = await serviceRole.entities.AuditLog.filter({
    entity_id: event.id,
    entity_name: 'StripeWebhook'
  }, null, 1);

  if (existingLogs.length > 0) {
    return Response.json({ received: true, processed: false, reason: 'already_processed' });
  }

  // STEP 6: TRAITEMENT PAR TYPE D'ÉVÉNEMENT
  let processed = false;
  let userEmail = null;

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        userEmail = session.metadata?.user_email || session.customer_email;
        if (!userEmail) {
          return Response.json({ error: 'user_email absent des métadonnées session' }, { status: 400 });
        }

        const accounts = await serviceRole.entities.AccountPrivate.filter({ user_email: userEmail }, null, 1);
        const now = new Date().toISOString();
        const updateData = {
          plan_status: 'active',
          plan_activated_at: now,
          stripe_customer_id: session.customer || null,
          stripe_subscription_id: session.subscription || null,
          subscription_status: 'active',
          subscription_start: now
        };

        if (accounts.length === 0) {
          await serviceRole.entities.AccountPrivate.create({ user_email: userEmail, ...updateData });
        } else {
          await serviceRole.entities.AccountPrivate.update(accounts[0].id, updateData);
        }
        processed = true;
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const accounts = await serviceRole.entities.AccountPrivate.filter({
          stripe_customer_id: invoice.customer
        }, null, 1);
        if (accounts.length > 0) {
          userEmail = accounts[0].user_email;
          const subscriptionEnd = new Date();
          subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
          await serviceRole.entities.AccountPrivate.update(accounts[0].id, {
            plan_status: 'active',
            subscription_status: 'active',
            subscription_end: subscriptionEnd.toISOString()
          });
          processed = true;
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const accounts = await serviceRole.entities.AccountPrivate.filter({
          stripe_customer_id: sub.customer
        }, null, 1);
        if (accounts.length > 0) {
          userEmail = accounts[0].user_email;
          // cancel_at_period_end = true → garder actif jusqu'à fin de période
          const planStatus = (sub.status === 'active' || sub.status === 'trialing') ? 'active' : 'free';
          await serviceRole.entities.AccountPrivate.update(accounts[0].id, {
            plan_status: planStatus,
            subscription_status: sub.status,
            subscription_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null
          });
          processed = true;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const accounts = await serviceRole.entities.AccountPrivate.filter({
          stripe_customer_id: sub.customer
        }, null, 1);
        if (accounts.length > 0) {
          userEmail = accounts[0].user_email;
          await serviceRole.entities.AccountPrivate.update(accounts[0].id, {
            plan_status: 'free',
            subscription_status: 'canceled'
          });
          processed = true;
        }
        break;
      }

      default:
        break;
    }

  } catch (error) {
    console.error('[stripe_webhook] Processing error:', error);
    await serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail || 'stripe_webhook',
      actor_role: 'system',
      action: 'admin_action',
      entity_name: 'StripeWebhook',
      entity_id: event.id,
      payload_summary: `Erreur webhook: ${event.type} — ${error.message}`,
      severity: 'critical',
      status: 'failed'
    }).catch((logErr) => console.error('[stripe_webhook] Audit log failed:', logErr));

    return Response.json({ error: 'Erreur traitement webhook', details: error.message }, { status: 500 });
  }

  // STEP 7: MARQUER COMME TRAITÉ (via AuditLog — pas d'enum contraignant)
  if (processed && userEmail) {
    await serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'system',
      action: 'subscription_started',
      entity_name: 'StripeWebhook',
      entity_id: event.id,
      payload_summary: `Stripe event ${event.type} traité pour ${userEmail}`,
      severity: 'info',
      status: 'success'
    }).catch(() => {});
  }

  return Response.json({ received: true, processed, event_type: event.type });
});