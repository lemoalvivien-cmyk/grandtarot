import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Terms() {
  const [lang, setLang] = useState('fr');

  const content = {
    fr: {
      title: 'Conditions Générales d\'Utilisation',
      lastUpdated: 'Dernière mise à jour : 10 janvier 2026',
      sections: [
        {
          title: '1. Acceptation des Conditions',
          text: 'En utilisant GRANDTAROT, vous acceptez ces conditions d\'utilisation. Si vous n\'êtes pas d\'accord, veuillez ne pas utiliser le service.'
        },
        {
          title: '2. Âge Minimum',
          text: 'Vous confirmez que vous avez au moins 18 ans et que vous êtes légalement capable de conclure des contrats.'
        },
        {
          title: '3. Utilisation du Service',
          text: 'Vous vous engagez à utiliser GRANDTAROT conformément aux lois applicables et à ne pas l\'utiliser à des fins illégales ou nuisibles.'
        },
        {
          title: '4. Contenu Utilisateur',
          text: 'Vous êtes responsable du contenu que vous générez ou partagez. Vous garantissez que votre contenu ne viole pas les droits d\'autrui.'
        },
        {
          title: '5. Propriété Intellectuelle',
          text: 'Tous les contenus, marques et designs de GRANDTAROT sont la propriété de GRANDTAROT ou de ses fournisseurs.'
        },
        {
          title: '6. Limitation de Responsabilité',
          text: 'GRANDTAROT n\'est pas responsable des dommages indirects, accessoires ou consécutifs résultant de votre utilisation du service.'
        },
        {
          title: '7. Modifications des Conditions',
          text: 'GRANDTAROT peut modifier ces conditions à tout moment. L\'utilisation continue du service implique l\'acceptation des modifications.'
        }
      ]
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: January 10, 2026',
      sections: [
        {
          title: '1. Acceptance of Terms',
          text: 'By using GRANDTAROT, you accept these terms of service. If you disagree, please do not use the service.'
        },
        {
          title: '2. Minimum Age',
          text: 'You confirm that you are at least 18 years old and legally capable of entering into contracts.'
        },
        {
          title: '3. Service Usage',
          text: 'You agree to use GRANDTAROT in compliance with applicable laws and not for illegal or harmful purposes.'
        },
        {
          title: '4. User Content',
          text: 'You are responsible for the content you generate or share. You guarantee that your content does not violate anyone\'s rights.'
        },
        {
          title: '5. Intellectual Property',
          text: 'All content, trademarks, and designs of GRANDTAROT are the property of GRANDTAROT or its suppliers.'
        },
        {
          title: '6. Limitation of Liability',
          text: 'GRANDTAROT is not responsible for indirect, incidental, or consequential damages arising from your use of the service.'
        },
        {
          title: '7. Changes to Terms',
          text: 'GRANDTAROT may modify these terms at any time. Continued use of the service implies acceptance of changes.'
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