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
      
      // Get URL params (Stripe session info if available)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const customerId = urlParams.get('customer_id');
      
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      const now = new Date().toISOString();
      const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days
      
      const updateData = {
        subscription_status: 'active',
        subscription_start: now,
        subscription_end: subscriptionEnd,
        is_subscribed: true
      };
      
      if (customerId) {
        updateData.stripe_customer_id = customerId;
      }
      
      if (profiles.length === 0) {
        // Create profile if doesn't exist
        await base44.entities.UserProfile.create({
          user_id: user.email,
          display_name: user.full_name || '',
          language_pref: 'fr',
          ...updateData
        });
      } else {
        // Update existing profile
        const profile = profiles[0];
        setLang(profile.language_pref || 'fr');
        
        // Check if already active (webhook already processed)
        if (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') {
          setProcessing(false);
          setTimeout(() => {
            window.location.href = profile.onboarding_completed 
              ? createPageUrl('App') 
              : createPageUrl('AppOnboarding');
          }, 1500);
          return;
        }

        // Activate subscription
        await base44.entities.UserProfile.update(profile.id, updateData);

        // Audit log
        await base44.entities.AuditLog.create({
          actor_user_id: user.email,
          actor_role: 'user',
          action: 'subscription_started',
          entity_name: 'UserProfile',
          entity_id: profile.id,
          payload_summary: `Subscription activated - Session: ${sessionId || 'N/A'}`,
          payload_data: { sessionId, customerId, activatedAt: now },
          severity: 'info',
          status: 'success'
        });
      }

      // Success - redirect
      const updatedProfiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      setProcessing(false);
      setTimeout(() => {
        window.location.href = updatedProfiles[0].onboarding_completed 
          ? createPageUrl('App') 
          : createPageUrl('AppOnboarding');
      }, 1500);
    } catch (error) {
      console.error('Error activating subscription:', error);
      setError(error.message);
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