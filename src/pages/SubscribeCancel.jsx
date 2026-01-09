import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeCancel() {
  const [lang, setLang] = React.useState('fr');

  const content = {
    fr: {
      title: "Paiement annulé",
      message: "Votre paiement n'a pas été effectué. Vous pouvez réessayer à tout moment.",
      back: "Retour à l'accueil",
      retry: "Réessayer"
    },
    en: {
      title: "Payment cancelled",
      message: "Your payment was not processed. You can try again anytime.",
      back: "Back to home",
      retry: "Try again"
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="inline-flex p-6 bg-slate-800/50 border border-slate-700 rounded-full mb-8">
          <XCircle className="w-16 h-16 text-slate-400" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-slate-200">
          {t.title}
        </h1>
        
        <p className="text-slate-400 mb-12">{t.message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl('Landing')}>
            <Button variant="outline" className="border-amber-500/30 text-slate-300 hover:bg-amber-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          </Link>
          <Link to={createPageUrl('Subscribe')}>
            <Button className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500">
              {t.retry}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}