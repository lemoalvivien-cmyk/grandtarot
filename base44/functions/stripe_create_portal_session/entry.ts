/**
 * stripe_create_portal_session — Base44 V3
 * Crée une session Stripe Customer Portal pour la gestion d'abonnement.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // STEP 1: AUTH
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userEmail = currentUser.email;

    // STEP 2: VALIDATION
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }
    const { returnUrl } = body;
    if (!returnUrl) {
      return Response.json({ error: 'returnUrl requis' }, { status: 400 });
    }

    // STEP 3: SECRETS
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'STRIPE_SECRET_KEY non configuré' }, { status: 500 });
    }

    // STEP 4: STRIPE CUSTOMER ID depuis AccountPrivate
    const serviceRole = base44.asServiceRole;
    const accounts = await serviceRole.entities.AccountPrivate.filter({
      user_email: userEmail
    }, null, 1);

    if (!accounts.length || !accounts[0].stripe_customer_id) {
      return Response.json({ error: 'Aucun customer Stripe trouvé (abonnement inexistant)' }, { status: 404 });
    }
    const customerId = accounts[0].stripe_customer_id;

    // STEP 5: CRÉER SESSION PORTAL
    const stripe = new Stripe(stripeSecretKey);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    // STEP 6: AUDIT LOG
    serviceRole.entities.AuditLog.create({
      actor_user_id: userEmail,
      actor_role: 'user',
      action: 'admin_action',
      entity_name: 'StripePortal',
      entity_id: portalSession.id,
      payload_summary: 'Customer portal ouvert',
      severity: 'info',
      status: 'success'
    }).catch(() => {});

    return Response.json({ url: portalSession.url });

  } catch (error) {
    return Response.json({ error: 'Erreur création session portal', details: error.message }, { status: 500 });
  }
});