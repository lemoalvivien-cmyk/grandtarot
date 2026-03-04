import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeSuccess() {
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    activateSubscription();
  }, []);

  const activateSubscription = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();

      // Polling du plan_status dans AccountPrivate (mis à jour par le webhook Stripe)
      // Le webhook est l'autorité — on attend jusqu'à 15s max
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkPlanStatus = async () => {
        const accounts = await base44.entities.AccountPrivate.filter({
          user_email: user.email
        }, null, 1);

        if (accounts.length > 0) {
          const account = accounts[0];
          setLang(account.language_pref || 'fr');

          if (account.plan_status === 'active') {
            // Plan activé par le webhook
            const profiles = await base44.entities.UserProfile.filter({ user_id: user.email }, null, 1);
            setProcessing(false);
            setTimeout(() => {
              const dest = profiles[0]?.onboarding_completed ? createPageUrl('App') : createPageUrl('AppOnboarding');
              window.location.href = dest;
            }, 1500);
            return true;
          }
        }
        return false;
      };

      // Tenter immédiatement, puis toutes les 1.5s
      const pollActivation = async () => {
        const done = await checkPlanStatus();
        if (done) return;
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollActivation, 1500);
        } else {
          // Timeout : plan pas encore activé (webhook peut être en retard)
          setProcessing(false);
          // Rediriger quand même — le guard affichera le bon état quand le webhook arrive
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.email }, null, 1);
          window.location.href = profiles[0]?.onboarding_completed ? createPageUrl('App') : createPageUrl('AppOnboarding');
        }
      };

      await pollActivation();

    } catch (error) {
      setError(lang === 'fr'
        ? 'Erreur lors de la vérification. Votre paiement a bien été reçu — actualisez la page dans quelques instants.'
        : 'Verification error. Your payment was received — refresh the page in a moment.');
      setProcessing(false);
    }
  };

  const content = {
    fr: {
      processing: 'Activation de votre abonnement...',
      success: 'Abonnement activé avec succès !',
      redirect: 'Redirection vers l\'app...',
      error: 'Erreur lors de l\'activation',
      retry: 'Réessayer',
      contact: 'Contacter le support'
    },
    en: {
      processing: 'Activating your subscription...',
      success: 'Subscription activated successfully!',
      redirect: 'Redirecting to app...',
      error: 'Activation error',
      retry: 'Retry',
      contact: 'Contact support'
    }
  };

  const t = content[lang];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-red-200 mb-2">{t.error}</h2>
            <p className="text-red-300 text-sm mb-6">{error}</p>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1 border-red-500/30"
              >
                {t.retry}
              </Button>
              <Button 
                onClick={() => window.location.href = createPageUrl('Landing')}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30"
              >
                {t.contact}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-3xl p-12 text-center">
            {processing ? (
              <>
                <Loader2 className="w-16 h-16 text-green-400 mx-auto mb-6 animate-spin" />
                <h2 className="text-2xl font-bold text-green-200 mb-2">{t.processing}</h2>
                <p className="text-slate-400 text-sm">{lang === 'fr' ? 'Veuillez patienter...' : 'Please wait...'}</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-green-200 mb-2">{t.success}</h2>
                <p className="text-slate-300 mb-6">{t.redirect}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full" />
                  <span>{lang === 'fr' ? 'Redirection...' : 'Redirecting...'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}