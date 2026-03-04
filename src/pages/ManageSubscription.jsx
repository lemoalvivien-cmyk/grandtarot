import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Crown, ExternalLink, Calendar, CheckCircle, XCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function ManageSubscription() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setLang(profiles[0].language_pref || 'fr');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  const openStripePortal = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    setPortalError('');
    try {
      const result = await base44.functions.invoke('stripe_create_portal_session', {
        returnUrl: window.location.origin + createPageUrl('ManageSubscription')
      });
      
      const url = result?.data?.url;
      if (!url) throw new Error(result?.data?.error || 'Impossible d\'ouvrir le portail');
      window.location.href = url;
    } catch (error) {
      setPortalError(lang === 'fr'
        ? 'Impossible d\'accéder au portail Stripe. Contactez support@grandtarot.com'
        : 'Unable to access Stripe portal. Contact support@grandtarot.com');
    } finally {
      setPortalLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Gérer mon abonnement",
      subtitle: "Informations et gestion de votre abonnement GRANDTAROT",
      status: "Statut",
      statusLabels: {
        active: "Actif",
        trialing: "Essai gratuit",
        past_due: "Paiement en retard",
        canceled: "Résilié",
        none: "Aucun abonnement"
      },
      started: "Début",
      ends: "Fin",
      price: "Tarif",
      manage: "Gérer via Stripe",
      cancel: "Résilier",
      renew: "Renouveler",
      contact: "Contacter le support",
      warning: "Votre abonnement nécessite une action",
      warningPastDue: "Votre paiement est en retard. Mettez à jour votre moyen de paiement pour continuer à utiliser GRANDTAROT.",
      warningCanceled: "Votre abonnement a été résilié. Vous pouvez vous réabonner à tout moment.",
      info: "Votre abonnement se renouvelle automatiquement chaque mois. Vous pouvez résilier à tout moment.",
      support: "Pour toute question : support@grandtarot.com"
    },
    en: {
      title: "Manage my subscription",
      subtitle: "Information and management of your GRANDTAROT subscription",
      status: "Status",
      statusLabels: {
        active: "Active",
        trialing: "Free trial",
        past_due: "Payment overdue",
        canceled: "Canceled",
        none: "No subscription"
      },
      started: "Started",
      ends: "Ends",
      price: "Price",
      manage: "Manage via Stripe",
      cancel: "Cancel",
      renew: "Renew",
      contact: "Contact support",
      warning: "Your subscription requires action",
      warningPastDue: "Your payment is overdue. Update your payment method to continue using GRANDTAROT.",
      warningCanceled: "Your subscription has been canceled. You can resubscribe anytime.",
      info: "Your subscription renews automatically every month. You can cancel anytime.",
      support: "For any question: support@grandtarot.com"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </SubscriptionGuard>
    );
  }

  const statusConfig = {
    active: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
    trialing: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: CheckCircle },
    past_due: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
    canceled: { color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
    none: { color: 'text-slate-400', bg: 'bg-slate-500/20', icon: XCircle }
  };

  const currentStatus = profile?.subscription_status || 'none';
  const StatusIcon = statusConfig[currentStatus]?.icon || XCircle;

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold">{t.title}</h1>
            </div>
            <p className="text-slate-400">{t.subtitle}</p>
          </div>

          {/* Warning Banners */}
          {currentStatus === 'past_due' && (
            <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-200 mb-2">{t.warning}</h3>
                  <p className="text-orange-300 text-sm">{t.warningPastDue}</p>
                </div>
              </div>
            </div>
          )}

          {currentStatus === 'canceled' && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-200 mb-2">{t.warning}</h3>
                  <p className="text-red-300 text-sm mb-4">{t.warningCanceled}</p>
                  <Button 
                    onClick={() => window.location.href = createPageUrl('Subscribe')}
                    className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
                  >
                    {t.renew}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-8 mb-6">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Status */}
              <div>
                <p className="text-slate-400 text-sm mb-2">{t.status}</p>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg ${statusConfig[currentStatus]?.bg} flex items-center gap-2`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig[currentStatus]?.color}`} />
                    <span className={`font-medium ${statusConfig[currentStatus]?.color}`}>
                      {t.statusLabels[currentStatus]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-slate-400 text-sm mb-2">{t.price}</p>
                <p className="text-2xl font-bold text-amber-100">6,90€ <span className="text-base text-slate-400">/mois</span></p>
              </div>

              {/* Started */}
              {profile?.subscription_start && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">{t.started}</p>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(profile.subscription_start).toLocaleDateString(lang)}</span>
                  </div>
                </div>
              )}

              {/* Ends */}
              {profile?.subscription_end && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">{t.ends}</p>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(profile.subscription_end).toLocaleDateString(lang)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {currentStatus === 'active' || currentStatus === 'trialing' ? (
              <div className="space-y-3">
                <Button
                  onClick={openStripePortal}
                  className="w-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {t.manage}
                  <ExternalLink className="w-4 h-4" />
                </Button>
                
                <p className="text-xs text-slate-500 text-center">{t.info}</p>
              </div>
            ) : null}
          </div>

          {/* Support */}
          <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm">{t.support}</p>
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}