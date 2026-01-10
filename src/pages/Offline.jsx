import React, { useState } from 'react';
import { Wifi, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Offline() {
  const [lang, setLang] = useState('fr');
  const [retrying, setRetrying] = useState(false);

  const content = {
    fr: {
      title: 'Hors ligne',
      subtitle: 'Vous n\'êtes actuellement pas connecté à internet',
      message:
        'Certaines fonctionnalités de GRANDTAROT nécessitent une connexion active. Les contenus statiques (Encyclopédie, Cartes) restent accessibles.',
      retry: 'Réessayer',
      home: 'Aller à l\'accueil',
      tips: [
        'Vérifiez votre connexion WiFi ou données mobiles',
        'Redémarrez votre appareil ou routeur',
        'Si le problème persiste, contactez le support'
      ]
    },
    en: {
      title: 'Offline',
      subtitle: 'You are currently not connected to the internet',
      message:
        'Some GRANDTAROT features require an active connection. Static content (Encyclopedia, Cards) remains accessible.',
      retry: 'Retry',
      home: 'Go to Home',
      tips: [
        'Check your WiFi or mobile data connection',
        'Restart your device or router',
        'If the issue persists, contact support'
      ]
    }
  };

  const t = content[lang];

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Try to fetch a simple endpoint to check connectivity
      const response = await fetch('/');
      if (response.ok) {
        window.location.href = '/';
      } else {
        setRetrying(false);
      }
    } catch (error) {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Language Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setLang('fr')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              lang === 'fr'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              lang === 'en'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700'
            }`}
          >
            EN
          </button>
        </div>

        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <Wifi className="w-12 h-12 text-amber-400 opacity-50" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-serif font-bold mb-2 text-amber-100">
          {t.title}
        </h1>
        <p className="text-lg text-amber-200 mb-6">{t.subtitle}</p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <p className="text-slate-300 mb-4">{t.message}</p>
          <div className="space-y-2">
            {t.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 text-left">
                <span className="text-amber-400 font-bold flex-shrink-0">•</span>
                <span className="text-sm text-slate-400">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? (lang === 'fr' ? 'Vérification...' : 'Checking...') : t.retry}
          </Button>

          <a href="/">
            <Button
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 py-6 text-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              {t.home}
            </Button>
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-500 mt-8">
          {lang === 'fr'
            ? 'GRANDTAROT PWA — Connectivité requise pour les fonctionnalités premium'
            : 'GRANDTAROT PWA — Internet connection required for premium features'}
        </p>
      </div>
    </div>
  );
}