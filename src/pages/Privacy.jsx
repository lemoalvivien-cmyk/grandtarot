import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Privacy() {
  const [lang, setLang] = useState('fr');

  const content = {
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : 10 janvier 2026',
      sections: [
        {
          title: '1. Collecte de Données',
          text: 'GRANDTAROT collecte des données personnelles comme votre email, nom d\'affichage, et préférences de profil pour fournir le service.'
        },
        {
          title: '2. Utilisation des Données',
          text: 'Vos données sont utilisées pour personnaliser votre expérience, améliorer le service, et communiquer avec vous.'
        },
        {
          title: '3. Partage des Données',
          text: 'Nous ne partageons pas vos données personnelles avec des tiers sans votre consentement, sauf si la loi l\'exige.'
        },
        {
          title: '4. Sécurité des Données',
          text: 'Nous utilisons le chiffrement SSL et des serveurs sécurisés pour protéger vos données personnelles.'
        },
        {
          title: '5. Vos Droits',
          text: 'Vous avez le droit d\'accéder, corriger ou supprimer vos données personnelles à tout moment.'
        },
        {
          title: '6. Cookies',
          text: 'GRANDTAROT utilise des cookies pour améliorer votre expérience. Consultez notre politique de cookies pour plus d\'informations.'
        },
        {
          title: '7. Modifications de la Politique',
          text: 'GRANDTAROT peut modifier cette politique à tout moment. Les modifications seront publiées sur cette page.'
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 10, 2026',
      sections: [
        {
          title: '1. Data Collection',
          text: 'GRANDTAROT collects personal data such as your email, display name, and profile preferences to provide the service.'
        },
        {
          title: '2. Data Usage',
          text: 'Your data is used to personalize your experience, improve the service, and communicate with you.'
        },
        {
          title: '3. Data Sharing',
          text: 'We do not share your personal data with third parties without your consent, except as required by law.'
        },
        {
          title: '4. Data Security',
          text: 'We use SSL encryption and secure servers to protect your personal data.'
        },
        {
          title: '5. Your Rights',
          text: 'You have the right to access, correct, or delete your personal data at any time.'
        },
        {
          title: '6. Cookies',
          text: 'GRANDTAROT uses cookies to enhance your experience. See our cookie policy for more information.'
        },
        {
          title: '7. Policy Changes',
          text: 'GRANDTAROT may modify this policy at any time. Changes will be posted on this page.'
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