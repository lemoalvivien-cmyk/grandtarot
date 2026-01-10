import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

export default function CookieBanner({ lang = 'fr' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already made a choice
    const choice = localStorage.getItem('grandtarot_cookies');
    if (!choice) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('grandtarot_cookies', 'accepted');
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem('grandtarot_cookies', 'refused');
    setVisible(false);
  };

  if (!visible) return null;

  const content = {
    fr: {
      message: "Nous utilisons des cookies essentiels pour assurer le bon fonctionnement du site (authentification, préférences). En continuant, vous acceptez notre utilisation des cookies.",
      more: "En savoir plus",
      accept: "Accepter",
      refuse: "Refuser"
    },
    en: {
      message: "We use essential cookies to ensure proper site functionality (authentication, preferences). By continuing, you accept our use of cookies.",
      more: "Learn more",
      accept: "Accept",
      refuse: "Refuse"
    }
  };

  const t = content[lang];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-amber-500/20 p-4 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {t.message}
            </p>
            <Link to={createPageUrl('Cookies')} className="text-xs text-amber-400 hover:text-amber-300 underline">
              {t.more}
            </Link>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRefuse}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {t.refuse}
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
          >
            {t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}