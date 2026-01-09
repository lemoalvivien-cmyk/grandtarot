import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscribeSuccess() {
  const [lang, setLang] = React.useState('fr');

  const content = {
    fr: {
      title: "Bienvenue dans GRANDTAROT !",
      subtitle: "Votre abonnement est activé",
      message: "Les astres vous souhaitent la bienvenue. Votre voyage commence maintenant.",
      cta: "Découvrir l'app"
    },
    en: {
      title: "Welcome to GRANDTAROT!",
      subtitle: "Your subscription is active",
      message: "The stars welcome you. Your journey begins now.",
      cta: "Discover the app"
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative text-center max-w-lg">
        <div className="inline-flex p-6 bg-green-500/10 border border-green-500/20 rounded-full mb-8">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.title}
        </h1>
        
        <p className="text-xl text-slate-400 mb-2">{t.subtitle}</p>
        <p className="text-slate-500 mb-12">{t.message}</p>

        <a href={createPageUrl('App')}>
          <Button className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-8 py-6 text-lg rounded-full">
            <Sparkles className="w-5 h-5 mr-2" />
            {t.cta}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </a>
      </div>
    </div>
  );
}