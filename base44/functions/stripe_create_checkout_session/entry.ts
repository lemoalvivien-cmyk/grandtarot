/**
 * stripe_create_checkout_session — Base44 V3
 * Crée une session Stripe Checkout pour l'abonnement.
 * Sécurité : auth serveur, rate limit, clé Stripe via Deno.env, jamais exposée client.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17';

// In-memory rate limiter: max 3 checkout attempts per user per 10 minutes
const _rlStore = new Map();
function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = _rlStore.get(key) || { calls: [] };
  entry.calls = entry.calls.filter(t => now - t < windowMs);
  if (entry.calls.length >= max) {
    _rlStore.set(key, entry);
    return false;
  }
  entry.calls.push(now);
  _rlStore.set(key, entry);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // STEP 1: AUTH
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userEmail = currentUser.email;

    // STEP 1b: RATE LIMIT — max 3 checkout/10min par utilisateur
    if (!checkRateLimit(`checkout:${userEmail}`, 3, 10 * 60 * 1000)) {
      return Response.json({ error: 'Trop de tentatives de paiement — réessayez dans 10 minutes' }, { status: 429 });
    }

    // STEP 2: VALIDATION INPUT
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }
    const { successUrl, cancelUrl } = body;
    if (!successUrl || !cancelUrl) {
      return Response.json({ error: 'successUrl et cancelUrl requis' }, { status: 400 });
    }
    // Validate URLs are actual URLs (prevent injection)
    try {
      new URL(successUrl);
      new URL(cancelUrl);
    } catch {
      return Response.json({ error: 'URLs invalides' }, { status: 400 });
    }

    // STEP 3: SECRETS (Deno.env uniquement — jamais client)
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'STRIPE_SECRET_KEY non configuré' }, { status: 500 });
    }

    // STEP 4: PRICE ID depuis AppSettings
    const serviceRole = base44.asServiceRole;
    const priceSettings = await serviceRole.entities.AppSettings.filter({
      setting_key: 'stripe_price_id'
    }, null, 1);

    if (!priceSettings.length || !priceSettings[0].value_string) {
      return Response.json({ error: 'stripe_price_id non configuré dans AppSettings' }, { status: 500 });
    }
    const stripePriceId = priceSettings[0].value_string;

    // STEP 5: CRÉATION SESSION CHECKOUT
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: {
        user_email: userEmail,
        app_name: 'GRANDTAROT',
        created_at: new Date().toISOString()
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: { user_email: userEmail }
      }
    });

    // STEP 6: AUDIT LOG (non-bloquant)
    serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'subscription_started',
      entity_name: 'StripeCheckout',
      entity_id: session.id,
      payload_summary: `Checkout session créée: ${session.id}`,
      severity: 'info',
      status: 'success'
    }).catch((e) => console.error('[stripe_create_checkout_session] AuditLog error:', e));

    return Response.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('[stripe_create_checkout_session] Error:', error.message);
    return Response.json({ error: 'Erreur création session', details: error.message }, { status: 500 });
  }
});