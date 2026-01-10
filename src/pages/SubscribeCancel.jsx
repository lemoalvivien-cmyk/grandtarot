import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeCancel() {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    loadLang();
  }, []);

  const loadLang = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
        if (profiles.length > 0) {
          setLang(profiles[0].language_pref || 'fr');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const content = {
    fr: {
      title: 'Paiement annulé',
      subtitle: 'Votre abonnement n\'a pas été activé',
      message: 'Vous avez annulé le processus de paiement. Aucun montant n\'a été débité.',
      retry: 'Réessayer',
      back: 'Retour à l\'accueil'
    },
    en: {
      title: 'Payment cancelled',
      subtitle: 'Your subscription was not activated',
      message: 'You cancelled the payment process. No amount was charged.',
      retry: 'Try again',
      back: 'Back to home'
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-orange-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-orange-200 mb-2">{t.title}</h2>
            <p className="text-slate-300 mb-4">{t.subtitle}</p>
            <p className="text-sm text-slate-400 mb-8">{t.message}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = createPageUrl('Subscribe')}
                className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6"
              >
                {t.retry}
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
              
              <button 
                onClick={() => window.location.href = createPageUrl('Landing')}
                className="w-full text-sm text-slate-400 hover:text-amber-200 py-2"
              >
                {t.back}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}