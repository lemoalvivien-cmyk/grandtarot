import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Cookies() {
  const [lang, setLang] = useState('fr');

  const content = {
    fr: {
      title: 'Politique de Cookies',
      lastUpdated: 'Dernière mise à jour : 10 janvier 2026',
      sections: [
        {
          title: '1. Qu\'est-ce qu\'un Cookie ?',
          text: 'Un cookie est un petit fichier texte stocké sur votre appareil pour améliorer votre expérience de navigation.'
        },
        {
          title: '2. Types de Cookies',
          text: 'GRANDTAROT utilise des cookies essentiels (authentification), analytiques (utilisation du service), et fonctionnels (préférences).'
        },
        {
          title: '3. Cookies Essentiels',
          text: 'Les cookies essentiels permettent à GRANDTAROT de fonctionner correctement et de sécuriser votre compte.'
        },
        {
          title: '4. Cookies Analytiques',
          text: 'Les cookies analytiques nous aident à comprendre comment vous utilisez GRANDTAROT pour améliorer le service.'
        },
        {
          title: '5. Cookies Tiers',
          text: 'GRANDTAROT peut utiliser des services tiers (Stripe pour les paiements) qui placent leurs propres cookies.'
        },
        {
          title: '6. Gestion des Cookies',
          text: 'Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur ou dans les paramètres de GRANDTAROT.'
        },
        {
          title: '7. Consentement',
          text: 'En utilisant GRANDTAROT, vous consentez à l\'utilisation de cookies selon cette politique.'
        }
      ]
    },
    en: {
      title: 'Cookie Policy',
      lastUpdated: 'Last updated: January 10, 2026',
      sections: [
        {
          title: '1. What is a Cookie?',
          text: 'A cookie is a small text file stored on your device to enhance your browsing experience.'
        },
        {
          title: '2. Types of Cookies',
          text: 'GRANDTAROT uses essential cookies (authentication), analytical cookies (service usage), and functional cookies (preferences).'
        },
        {
          title: '3. Essential Cookies',
          text: 'Essential cookies allow GRANDTAROT to function properly and secure your account.'
        },
        {
          title: '4. Analytical Cookies',
          text: 'Analytical cookies help us understand how you use GRANDTAROT to improve the service.'
        },
        {
          title: '5. Third-Party Cookies',
          text: 'GRANDTAROT may use third-party services (Stripe for payments) that place their own cookies.'
        },
        {
          title: '6. Cookie Management',
          text: 'You can manage your cookie preferences in your browser settings or in GRANDTAROT settings.'
        },
        {
          title: '7. Consent',
          text: 'By using GRANDTAROT, you consent to the use of cookies according to this policy.'
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('fr')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                lang === 'fr' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                lang === 'en' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <p className="text-slate-400 mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-amber-100 mb-3">{section.title}</h2>
              <p className="text-slate-300 leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <Link to="/">
            <Button className="bg-amber-500 hover:bg-amber-600">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}