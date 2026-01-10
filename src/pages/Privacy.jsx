import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Privacy() {
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
      title: "Politique de Confidentialité",
      updated: "Dernière mise à jour : 10 janvier 2026",
      sections: [
        {
          title: "1. Collecte des Données",
          content: "Nous collectons les données suivantes : email, prénom, date de naissance, ville, photo de profil, centres d'intérêt, informations professionnelles (mode Pro uniquement). Ces données sont nécessaires au fonctionnement du service."
        },
        {
          title: "2. Utilisation des Données",
          content: "Vos données sont utilisées pour : créer votre profil, générer des affinités compatibles, proposer des tirages de tarot personnalisés, améliorer le service. Nous ne vendons jamais vos données à des tiers."
        },
        {
          title: "3. Protection des Données",
          content: "Vos données sont stockées sur des serveurs sécurisés en Europe (conformité RGPD). Nous utilisons le chiffrement SSL/TLS. Votre email n'est JAMAIS exposé publiquement."
        },
        {
          title: "4. Cookies",
          content: "Nous utilisons des cookies essentiels pour le fonctionnement du service (authentification, préférences). Consultez notre politique cookies pour plus d'informations."
        },
        {
          title: "5. Partage avec des Tiers",
          content: "Nous partageons uniquement des données avec : Stripe (paiements sécurisés), nos fournisseurs d'IA pour les interprétations de tarot. Aucune donnée n'est vendue à des fins publicitaires."
        },
        {
          title: "6. Vos Droits (RGPD)",
          content: "Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez supprimer votre compte à tout moment depuis les paramètres."
        },
        {
          title: "7. Conservation des Données",
          content: "Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont effacées sous 30 jours, sauf obligations légales."
        },
        {
          title: "8. Mineurs",
          content: "GRANDTAROT est réservé aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de données de mineurs."
        },
        {
          title: "9. Contact",
          content: "Pour toute question relative à vos données, contactez-nous à : privacy@grandtarot.com"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      updated: "Last updated: January 10, 2026",
      sections: [
        {
          title: "1. Data Collection",
          content: "We collect the following data: email, first name, birth year, city, profile photo, interests, professional information (Pro mode only). This data is necessary for the service to function."
        },
        {
          title: "2. Data Usage",
          content: "Your data is used to: create your profile, generate compatible affinities, offer personalized tarot readings, improve the service. We never sell your data to third parties."
        },
        {
          title: "3. Data Protection",
          content: "Your data is stored on secure servers in Europe (GDPR compliant). We use SSL/TLS encryption. Your email is NEVER publicly exposed."
        },
        {
          title: "4. Cookies",
          content: "We use essential cookies for service operation (authentication, preferences). See our cookie policy for more information."
        },
        {
          title: "5. Third-Party Sharing",
          content: "We only share data with: Stripe (secure payments), our AI providers for tarot interpretations. No data is sold for advertising purposes."
        },
        {
          title: "6. Your Rights (GDPR)",
          content: "You have the right to access, rectify, delete and port your data. You can delete your account at any time from settings."
        },
        {
          title: "7. Data Retention",
          content: "Your data is kept as long as your account is active. In case of account deletion, your data is erased within 30 days, except legal obligations."
        },
        {
          title: "8. Minors",
          content: "GRANDTAROT is reserved for people 18 years and older. We do not knowingly collect data from minors."
        },
        {
          title: "9. Contact",
          content: "For any questions regarding your data, contact us at: privacy@grandtarot.com"
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