import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeSuccess() {
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);

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
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      
      if (profiles.length === 0) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      const profile = profiles[0];

      // Activate subscription
      if (profile.subscription_status !== 'active') {
        setActivating(true);
        await base44.entities.UserProfile.update(profile.id, {
          subscription_status: 'active',
          is_subscribed: true,
          subscription_start: new Date().toISOString(),
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        });
      }

      setLoading(false);

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        if (profile.onboarding_completed) {
          window.location.href = createPageUrl('App');
        } else {
          window.location.href = createPageUrl('AppOnboarding');
        }
      }, 3000);

    } catch (error) {
      console.error('Error:', error);
      setError('Activation error');
      setLoading(false);
    }
  };

  const handleContinue = () => {
    window.location.href = createPageUrl('AppOnboarding');
  };

  if (loading || activating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">
            {activating ? 'Activation en cours...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-amber-100 mb-2">Erreur</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.href = createPageUrl('Subscribe')}
            className="bg-gradient-to-r from-amber-500 to-violet-600"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-amber-500/30 rounded-full blur-3xl" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-amber-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          Bienvenue chez GRANDTAROT
        </h1>
        
        <p className="text-xl text-slate-300 mb-2">
          Votre abonnement est activé !
        </p>
        
        <p className="text-slate-400 mb-8">
          Accédez maintenant à votre tirage quotidien et découvrez vos affinités
        </p>

        {/* Features */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 mb-8">
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-slate-300">Tirage quotidien personnalisé par IA</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-slate-300">20 affinités compatibles par jour</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-slate-300">Chat sécurisé après connexion mutuelle</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button 
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl shadow-xl shadow-amber-500/20"
        >
          Commencer l'aventure
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-slate-500 mt-4">
          Redirection automatique dans 3 secondes...
        </p>
      </div>
    </div>
  );
}