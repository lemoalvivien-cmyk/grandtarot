import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SubscriptionGuard - Paywall MVP
 * Checks plan_status (primary) or subscription_status (legacy fallback)
 * Allows admins to bypass
 */
export default function SubscriptionGuard({ children, allowOnboarding = false }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [needsSubscription, setNeedsSubscription] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();

      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();

      // Admin bypass
      if (user.role === 'admin') {
        setAuthorized(true);
        setChecking(false);
        return;
      }

      // Check paywall status
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'paywall_enabled'
      }, null, 1);

      const paywallEnabled = settings.length > 0 && settings[0].value_boolean === true;

      if (paywallEnabled) {
        // Check plan_status in AccountPrivate (primary)
        const accounts = await base44.entities.AccountPrivate.filter({
          user_email: user.email
        }, null, 1);

        if (accounts.length > 0) {
          const planStatus = accounts[0].plan_status || 'free';

          if (planStatus !== 'active') {
            setNeedsSubscription(true);
            setChecking(false);
            return;
          }
        } else {
          setNeedsSubscription(true);
          setChecking(false);
          return;
        }
      } else {
        // Fallback: check UserProfile.subscription_status (legacy)
        const profiles = await base44.entities.UserProfile.filter({ 
          user_id: user.email 
        }, null, 1);

        if (profiles.length === 0) {
          window.location.href = createPageUrl('Subscribe');
          return;
        }

        const profile = profiles[0];
        const activeStatuses = ['active', 'trialing'];
        const hasActiveSubscription = activeStatuses.includes(profile.subscription_status);

        if (!hasActiveSubscription) {
          setNeedsSubscription(true);
          setChecking(false);
          return;
        }

        // Check onboarding
        if (!allowOnboarding && !profile.onboarding_completed) {
          window.location.href = createPageUrl('AppOnboarding');
          return;
        }
      }

      setAuthorized(true);
    } catch (error) {
      console.error('Subscription guard error:', error);
      window.location.href = createPageUrl('Landing');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Vérification de l'abonnement...</p>
        </div>
      </div>
    );
  }

  if (needsSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-100 mb-2">Abonnement Requis</h2>
              <p className="text-slate-300 mb-6">
                Votre abonnement est inactif ou expiré. Veuillez vous réabonner pour accéder à GRANDTAROT.
              </p>
              <Button 
                onClick={() => window.location.href = createPageUrl('Billing')}
                className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg mb-3"
              >
                <Crown className="w-5 h-5 mr-2" />
                S'abonner maintenant
              </Button>
              <button 
                onClick={() => window.location.href = createPageUrl('Landing')}
                className="text-sm text-slate-400 hover:text-amber-200"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  return null;
}