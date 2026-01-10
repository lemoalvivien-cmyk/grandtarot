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
  const [needsAgeGate, setNeedsAgeGate] = useState(false);
  const [lang, setLang] = useState('fr');

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

      // Age gate check (PRIORITAIRE)
      const accounts = await base44.entities.AccountPrivate.filter({
        user_email: user.email
      }, null, 1);

      if (accounts.length > 0) {
        setLang(accounts[0].language_pref || 'fr');
        if (!accounts[0].age_confirmed_at) {
          setNeedsAgeGate(true);
          setChecking(false);
          return;
        }
      }

      // Check paywall status (PLAN_STATUS is authoritative)
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'paywall_enabled'
      }, null, 1);

      const paywallEnabled = settings.length > 0 && settings[0].value_boolean === true;

      if (paywallEnabled) {
        // STRICT: Check plan_status in AccountPrivate (PRIMARY AUTHORITY)
        // NO fallback to subscription_status (prevents bypass)
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
      }

      // Onboarding check (after paywall + age gate)
      const profiles = await base44.entities.UserProfile.filter({ 
        user_id: user.email 
      }, null, 1);

      if (profiles.length === 0) {
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      const profile = profiles[0];

      if (!allowOnboarding && !profile.onboarding_completed) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
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

  if (needsAgeGate) {
    const ageContent = {
      fr: {
        title: 'Vérification d\'âge requise',
        desc: 'Veuillez confirmer que vous avez au moins 18 ans pour continuer.',
        btn: 'Aller à l\'onboarding'
      },
      en: {
        title: 'Age verification required',
        desc: 'Please confirm you are at least 18 years old to continue.',
        btn: 'Go to onboarding'
      }
    };
    const ac = ageContent[lang];
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-100 mb-2">{ac.title}</h2>
              <p className="text-slate-300 mb-6">{ac.desc}</p>
              <Button 
                onClick={() => window.location.href = createPageUrl('AppOnboarding')}
                className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
              >
                {ac.btn}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsSubscription) {
    const subContent = {
      fr: {
        title: 'Abonnement Requis',
        desc: 'Votre abonnement est inactif ou expiré. Veuillez vous réabonner pour accéder à GRANDTAROT.',
        btn: 'S\'abonner maintenant',
        back: 'Retour à l\'accueil'
      },
      en: {
        title: 'Subscription Required',
        desc: 'Your subscription is inactive or expired. Please subscribe to access GRANDTAROT.',
        btn: 'Subscribe now',
        back: 'Back to home'
      }
    };
    const sc = subContent[lang];
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-100 mb-2">{sc.title}</h2>
              <p className="text-slate-300 mb-6">{sc.desc}</p>
              <Button 
                onClick={() => window.location.href = createPageUrl('Billing')}
                className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg mb-3"
              >
                <Crown className="w-5 h-5 mr-2" />
                {sc.btn}
              </Button>
              <button 
                onClick={() => window.location.href = createPageUrl('Landing')}
                className="text-sm text-slate-400 hover:text-amber-200"
              >
                {sc.back}
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