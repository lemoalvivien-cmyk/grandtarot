import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeCancel() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      if (profiles.length > 0) {
        setLang(profiles[0].language_pref || 'fr');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Paiement annulé",
      subtitle: "Vous avez annulé le processus de paiement",
      message: "Aucun montant n'a été débité de votre compte.",
      question: "Un problème ?",
      reasons: [
        "Besoin d'aide avec le paiement ?",
        "Des questions sur l'abonnement ?",
        "Préférez un autre moyen de paiement ?"
      ],
      support: "Contactez le support",
      tryAgain: "Réessayer",
      goBack: "Retour à l'accueil"
    },
    en: {
      title: "Payment canceled",
      subtitle: "You have canceled the payment process",
      message: "No amount has been charged to your account.",
      question: "Any problem?",
      reasons: [
        "Need help with payment?",
        "Questions about subscription?",
        "Prefer another payment method?"
      ],
      support: "Contact support",
      tryAgain: "Try again",
      goBack: "Back to home"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Cancel Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/30 to-slate-700/30 rounded-full blur-3xl" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-12 h-12 text-slate-300" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3 text-amber-100">
          {t.title}
        </h1>
        
        <p className="text-lg text-slate-400 mb-2">
          {t.subtitle}
        </p>
        
        <p className="text-sm text-slate-500 mb-8">
          {t.message}
        </p>

        {/* Help Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-100">{t.question}</h3>
          </div>
          <ul className="space-y-2 text-left text-sm text-slate-400">
            {t.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = createPageUrl('Subscribe')}
            className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl shadow-xl shadow-amber-500/20"
          >
            {t.tryAgain}
          </Button>

          <Button 
            onClick={() => window.location.href = createPageUrl('Landing')}
            variant="outline"
            className="w-full border-amber-500/20 text-slate-300 hover:bg-slate-800/50 py-6 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t.goBack}
          </Button>
        </div>

        {/* Support Link */}
        <p className="text-xs text-slate-500 mt-6">
          {t.support}: <a href="mailto:support@grandtarot.com" className="text-amber-400 hover:text-amber-300">support@grandtarot.com</a>
        </p>
      </div>
    </div>
  );
}