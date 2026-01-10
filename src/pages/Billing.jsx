import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function Billing() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofDescription, setProofDescription] = useState('');
  const [recentRequest, setRecentRequest] = useState(null);
  const [slaHours, setSlaHours] = useState(48);
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [accounts, paySettings, stripeSettings, profiles, requests, slaSetting] = await Promise.all([
        base44.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'paywall_enabled' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'stripe_payment_link' }, null, 1),
        base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1),
        base44.entities.BillingRequest.filter({ requester_user_email: currentUser.email }, '-created_date', 1),
        base44.entities.AppSettings.filter({ setting_key: 'billing_review_sla_hours' }, null, 1)
      ]);

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }

      if (paySettings && paySettings.length > 0) {
        setPaywallEnabled(paySettings[0].value_boolean === true);
      }

      if (stripeSettings && stripeSettings.length > 0) {
        setPaymentLink(stripeSettings[0].value_string || '');
      }

      if (profiles && profiles.length > 0) {
        setLang(profiles[0].language_pref || 'fr');
      }

      if (slaSetting && slaSetting.length > 0) {
        setSlaHours(slaSetting[0].value_number || 48);
      }

      if (requests && requests.length > 0) {
        const createdTime = new Date(requests[0].created_date).getTime();
        const nowTime = new Date().getTime();
        const diffHours = (nowTime - createdTime) / (1000 * 60 * 60);
        if (diffHours < 24) {
          setRecentRequest(requests[0]);
        }
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (!paymentLink) {
      alert(lang === 'fr' ? 'Lien de paiement non disponible' : 'Payment link not available');
      return;
    }
    window.open(paymentLink, '_blank');
  };

  const handleSubmitProof = async () => {
    if (!proofDescription.trim() || proofDescription.length < 20) {
      alert(lang === 'fr' 
        ? 'Veuillez fournir au moins 20 caractères' 
        : 'Please provide at least 20 characters');
      return;
    }

    if (recentRequest && recentRequest.status === 'pending') {
      alert(lang === 'fr'
        ? 'Vous avez déjà envoyé une demande en attente. Veuillez attendre la vérification.'
        : 'You already have a pending request. Please wait for verification.');
      return;
    }

    // Anti-spam: check 3 requests in last 7 days
    try {
      const allRequests = await base44.entities.BillingRequest.filter(
        { requester_user_email: user.email },
        '-created_date',
        10
      );
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentCount = allRequests.filter(r => 
        new Date(r.created_date) > sevenDaysAgo
      ).length;
      
      if (recentCount >= 3) {
        alert(lang === 'fr'
          ? 'Limite: 3 demandes par 7 jours. Contactez le support.'
          : 'Limit: 3 requests per 7 days. Contact support.');
        return;
      }
    } catch (e) {
      // Continue anyway
    }

    setSubmittingProof(true);
    try {
      const newRequest = await base44.entities.BillingRequest.create({
        requester_user_email: user.email,
        request_type: 'payment_proof',
        description: proofDescription,
        status: 'pending'
      });

      // Log audit (non-blocking)
      try {
        await base44.entities.AuditLog.create({
          actor_user_id: user.email,
          actor_role: 'user',
          action: 'billing_request_created',
          entity_name: 'BillingRequest',
          entity_id: newRequest.id,
          payload_summary: `Payment proof submitted (${proofDescription.slice(0, 50)}...)`,
          severity: 'info',
          status: 'success'
        }).catch(() => {});
      } catch (e) {
        // Non-blocking
      }

      setShowProofModal(false);
      setProofDescription('');
      alert(lang === 'fr' 
        ? 'Demande envoyée. Un admin va examiner votre preuve.' 
        : 'Request sent. An admin will review your proof.');
      loadData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmittingProof(false);
    }
  };

  const content = {
    en: {
      title: 'Billing & Subscription',
      status: 'Subscription Status',
      free: 'Free',
      active: 'Active',
      description: 'Welcome to GRANDTAROT. A subscription is required to access all features.',
      cta: 'Subscribe now',
      price: '€6.90/month',
      features: [
        'AI personalized daily reading',
        '20 cosmic affinities per day',
        '3 modes: Love, Friendship, Pro',
        'Unlimited secure chat',
        '78 cards encyclopedia'
      ],
      noPaymentLink: 'Payment link not configured. Contact admin.',
      alreadySubscribed: 'You are subscribed ✅',
      paymentSubmitted: 'I already paid',
      proofTitle: 'Submit payment proof',
      proofDesc: 'Describe your transaction (order number, amount, date, etc.)',
      proofPlaceholder: 'Ex: Paid 6.90€ on 10/01 via Stripe order #...',
      proofSubmit: 'Send',
      proofCancel: 'Cancel',
      freeAccess: 'Free access (paywall disabled)',
      pendingReview: 'Your request is pending review...',
      manualPaymentTitle: 'Payment without webhook?',
      manualPaymentSteps: [
        '1️⃣ Click "Subscribe now" to pay via Stripe (€6.90)',
        '2️⃣ After payment, click the confirmation link',
        '3️⃣ Come back here and click "I already paid"',
        '4️⃣ Briefly describe your transaction (order number)'
      ],
      manualPaymentNote: (hours) => `Verification delay: ${hours}h max on business days`,
      alreadyPending: 'You already have a pending request. Please wait for verification.'
    },
    fr: {
      title: 'Facturation & Abonnement',
      status: 'Statut de l\'abonnement',
      free: 'Gratuit',
      active: 'Actif',
      description: 'Bienvenue sur GRANDTAROT. Pour accéder aux fonctionnalités complètes, un abonnement est requis.',
      cta: 'S\'abonner maintenant',
      price: '6,90€/mois',
      features: [
        'Tirage quotidien IA personnalisé',
        '20 affinités cosmiques par jour',
        '3 modes : Amour, Amitié, Pro',
        'Chat sécurisé illimité',
        'Encyclopédie 78 cartes'
      ],
      noPaymentLink: 'Lien de paiement non configuré. Contactez l\'admin.',
      alreadySubscribed: 'Vous êtes abonné(e) ✅',
      paymentSubmitted: 'J\'ai déjà payé',
      proofTitle: 'Soumettre une preuve de paiement',
      proofDesc: 'Décrivez votre transaction (numéro de commande, montant, date, etc.)',
      proofPlaceholder: 'Ex: Payé 6.90€ le 10/01 via Stripe order #...',
      proofSubmit: 'Envoyer',
      proofCancel: 'Annuler'
    },
    en: {
      title: 'Billing & Subscription',
      status: 'Subscription Status',
      free: 'Free',
      active: 'Active',
      description: 'Welcome to GRANDTAROT. A subscription is required to access all features.',
      cta: 'Subscribe now',
      price: '€6.90/month',
      features: [
        'AI personalized daily reading',
        '20 cosmic affinities per day',
        '3 modes: Love, Friendship, Pro',
        'Unlimited secure chat',
        '78 cards encyclopedia'
      ],
      noPaymentLink: 'Payment link not configured. Contact admin.',
      alreadySubscribed: 'You are subscribed ✅',
      paymentSubmitted: 'I already paid',
      proofTitle: 'Submit payment proof',
      proofDesc: 'Describe your transaction (order number, amount, date, etc.)',
      proofPlaceholder: 'Ex: Paid 6.90€ on 10/01 via Stripe order #...',
      proofSubmit: 'Send',
      proofCancel: 'Cancel',
      freeAccess: 'Free access (paywall disabled)',
      pendingReview: 'Your request is pending review...',
      manualPaymentTitle: 'Payment without webhook?',
      manualPaymentSteps: [
        '1️⃣ Click "Subscribe now" to pay via Stripe (€6.90)',
        '2️⃣ After payment, click the confirmation link',
        '3️⃣ Come back here and click "I already paid"',
        '4️⃣ Briefly describe your transaction (order number)'
      ],
      manualPaymentNote: 'Verification delay: 2-4 hours on business days',
      alreadyPending: 'You already have a pending request. Please wait for verification.',
      statusStates: 'Status: FREE • UNDER REVIEW • SUBSCRIBED'
    },
    fr: {
      title: 'Facturation & Abonnement',
      status: 'Statut de l\'abonnement',
      free: 'Gratuit',
      active: 'Actif',
      description: 'Bienvenue sur GRANDTAROT. Pour accéder aux fonctionnalités complètes, un abonnement est requis.',
      cta: 'S\'abonner maintenant',
      price: '6,90€/mois',
      features: [
        'Tirage quotidien IA personnalisé',
        '20 affinités cosmiques par jour',
        '3 modes : Amour, Amitié, Pro',
        'Chat sécurisé illimité',
        'Encyclopédie 78 cartes'
      ],
      noPaymentLink: 'Lien de paiement non configuré. Contactez l\'admin.',
      alreadySubscribed: 'Vous êtes abonné(e) ✅',
      paymentSubmitted: 'J\'ai déjà payé',
      proofTitle: 'Soumettre une preuve de paiement',
      proofDesc: 'Décrivez votre transaction (numéro de commande, montant, date, etc.)',
      proofPlaceholder: 'Ex: Payé 6.90€ le 10/01 via Stripe order #...',
      proofSubmit: 'Envoyer',
      proofCancel: 'Annuler',
      freeAccess: 'Accès libre (paywall désactivé)',
      pendingReview: 'Votre demande est en attente d\'examen...'
    }
  };

  const t = content[lang];
  const isActive = account?.plan_status === 'active';

  if (loading) {
    return (
      <SubscriptionGuard allowOnboarding>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard allowOnboarding>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-slate-400">{t.description}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-amber-100">{t.status}</h2>
              {isActive ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">{t.active}</span>
                </div>
              ) : !paywallEnabled ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-semibold">{t.freeAccess}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-500/20 border border-slate-500/30 rounded-full">
                  <AlertCircle className="w-5 h-5 text-slate-300" />
                  <span className="text-slate-300 font-semibold">{t.free}</span>
                </div>
              )}
            </div>

            {isActive && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  {t.alreadySubscribed}
                </p>
                {account?.plan_activated_at && (
                  <p className="text-slate-400 text-xs mt-2">
                    {lang === 'fr' ? 'Depuis' : 'Since'} {new Date(account.plan_activated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {!isActive && paywallEnabled && recentRequest && (
              <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-amber-300 text-sm">
                  {t.pendingReview}
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  {lang === 'fr' ? 'Demande du' : 'Request from'} {new Date(recentRequest.created_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {!isActive && paywallEnabled && (
           <>
             {/* Manuel Payment Guide */}
             <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-6 mb-8">
               <h3 className="text-lg font-semibold text-blue-200 mb-4">{t.manualPaymentTitle}</h3>
               <div className="space-y-2 mb-4">
                 {t.manualPaymentSteps.map((step, i) => (
                   <p key={i} className="text-sm text-blue-100">{step}</p>
                 ))}
               </div>
               <p className="text-xs text-blue-300 italic">{t.manualPaymentNote(slaHours)}</p>
             </div>

             {/* Pricing Card */}
             <div className="relative mb-8">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-2xl blur-2xl" />
               <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8">
               <div className="text-center mb-8">
                 <div className="text-5xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent mb-2">
                   {t.price}
                 </div>
                 <p className="text-slate-400">{lang === 'fr' ? 'Accès illimité' : 'Unlimited access'}</p>
               </div>

               <ul className="space-y-3 mb-8">
                 {t.features.map((feature, i) => (
                   <li key={i} className="flex items-center gap-3 text-slate-300">
                     <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                     {feature}
                   </li>
                 ))}
               </ul>

               {paymentLink ? (
                 <Button
                   onClick={handleSubscribe}
                   className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl"
                 >
                   <CreditCard className="w-5 h-5 mr-2" />
                   {t.cta}
                 </Button>
               ) : (
                 <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                   {t.noPaymentLink}
                 </div>
               )}
               </div>
               </div>
               </>
               )}

          {!isActive && paywallEnabled && (!recentRequest || recentRequest.status === 'rejected') && (
            <div className="text-center">
              <p className="text-slate-400 mb-4">
                {lang === 'fr' 
                  ? 'Vous avez déjà effectué un paiement?' 
                  : 'Already made a payment?'}
              </p>
              <Button
                onClick={() => setShowProofModal(true)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                {t.paymentSubmitted}
              </Button>
            </div>
          )}

          <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-amber-100">{t.proofTitle}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {t.proofDesc}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  placeholder={t.proofPlaceholder}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 h-24"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowProofModal(false)}
                    variant="outline"
                    className="flex-1 border-slate-700"
                  >
                    {t.proofCancel}
                  </Button>
                  <Button
                    onClick={handleSubmitProof}
                    disabled={submittingProof || proofDescription.length < 20}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {submittingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : t.proofSubmit}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SubscriptionGuard>
  );
}