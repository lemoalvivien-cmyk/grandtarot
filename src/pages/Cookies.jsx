import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Cookies() {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    checkLang();
  }, []);

  const checkLang = async () => {
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
      // Not logged in, use default
    }
  };

  const content = {
    fr: {
      title: "Politique Cookies",
      updated: "Dernière mise à jour : 10 janvier 2026",
      sections: [
        {
          title: "1. Qu'est-ce qu'un Cookie ?",
          content: "Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur GRANDTAROT. Les cookies permettent au site de mémoriser vos préférences et améliorer votre expérience."
        },
        {
          title: "2. Cookies Essentiels",
          content: "Ces cookies sont nécessaires au fonctionnement du site. Ils permettent l'authentification, la navigation sécurisée et la mémorisation de vos préférences (langue). Vous ne pouvez pas les refuser."
        },
        {
          title: "3. Durée de Conservation",
          content: "Les cookies d'authentification sont conservés jusqu'à votre déconnexion. Les cookies de préférences sont conservés 12 mois maximum."
        },
        {
          title: "4. Gestion des Cookies",
          content: "Vous pouvez gérer vos préférences cookies via le bandeau affiché lors de votre première visite. Vous pouvez également paramétrer votre navigateur pour bloquer les cookies, mais cela peut affecter le fonctionnement du site."
        },
        {
          title: "5. Cookies Tiers",
          content: "Nous utilisons Stripe pour les paiements, qui peut déposer des cookies sécurisés. Nous n'utilisons pas de cookies publicitaires ou de tracking."
        }
      ]
    },
    en: {
      title: "Cookie Policy",
      updated: "Last updated: January 10, 2026",
      sections: [
        {
          title: "1. What is a Cookie?",
          content: "A cookie is a small text file stored on your device when you visit GRANDTAROT. Cookies allow the site to remember your preferences and improve your experience."
        },
        {
          title: "2. Essential Cookies",
          content: "These cookies are necessary for the site to function. They enable authentication, secure browsing and storing your preferences (language). You cannot refuse them."
        },
        {
          title: "3. Retention Period",
          content: "Authentication cookies are kept until you log out. Preference cookies are kept for a maximum of 12 months."
        },
        {
          title: "4. Cookie Management",
          content: "You can manage your cookie preferences via the banner displayed on your first visit. You can also configure your browser to block cookies, but this may affect site functionality."
        },
        {
          title: "5. Third-Party Cookies",
          content: "We use Stripe for payments, which may set secure cookies. We do not use advertising or tracking cookies."
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="text-sm text-slate-400 mb-12">{t.updated}</p>

        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold text-amber-100 mb-3">{section.title}</h2>
              <p className="text-slate-300 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}