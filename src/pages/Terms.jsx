import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Terms() {
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
      title: "Conditions Générales d'Utilisation",
      updated: "Dernière mise à jour : 10 janvier 2026",
      sections: [
        {
          title: "1. Objet",
          content: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme GRANDTAROT, un service de rencontres basé sur le tarot et l'astrologie."
        },
        {
          title: "2. Acceptation des CGU",
          content: "En accédant et en utilisant GRANDTAROT, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service."
        },
        {
          title: "3. Inscription et Compte",
          content: "L'inscription nécessite d'avoir au moins 18 ans. Vous êtes responsable de la confidentialité de votre compte et des activités qui s'y déroulent."
        },
        {
          title: "4. Abonnement et Paiement",
          content: "L'accès complet à GRANDTAROT nécessite un abonnement payant de 6,90€/mois. Le paiement est géré via Stripe. Vous pouvez annuler votre abonnement à tout moment."
        },
        {
          title: "5. Comportement et Contenus",
          content: "Vous vous engagez à utiliser le service de manière respectueuse. Tout contenu inapproprié, harcèlement, spam ou tentative d'arnaque entraînera la suspension immédiate du compte."
        },
        {
          title: "6. Modération",
          content: "Nous nous réservons le droit de modérer, supprimer tout contenu ou suspendre tout compte en cas de violation des présentes CGU."
        },
        {
          title: "7. Propriété Intellectuelle",
          content: "Tous les contenus de GRANDTAROT (textes, images, interprétations IA) sont protégés par le droit d'auteur. Toute reproduction est interdite sans autorisation."
        },
        {
          title: "8. Responsabilité",
          content: "GRANDTAROT est un service de divertissement. Les interprétations de tarot sont générées par IA à titre indicatif. Nous ne pouvons être tenus responsables des décisions prises suite à ces interprétations."
        },
        {
          title: "9. Résiliation",
          content: "Vous pouvez supprimer votre compte à tout moment. Nous pouvons également résilier votre accès en cas de violation des CGU."
        },
        {
          title: "10. Modification des CGU",
          content: "Nous nous réservons le droit de modifier ces CGU à tout moment. Les utilisateurs seront informés des changements majeurs."
        },
        {
          title: "11. Loi Applicable",
          content: "Les présentes CGU sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris."
        }
      ]
    },
    en: {
      title: "Terms of Service",
      updated: "Last updated: January 10, 2026",
      sections: [
        {
          title: "1. Purpose",
          content: "These Terms of Service (ToS) govern the use of the GRANDTAROT platform, a dating service based on tarot and astrology."
        },
        {
          title: "2. Acceptance of Terms",
          content: "By accessing and using GRANDTAROT, you unconditionally accept these ToS. If you do not accept these terms, please do not use the service."
        },
        {
          title: "3. Registration and Account",
          content: "Registration requires being at least 18 years old. You are responsible for the confidentiality of your account and activities that occur there."
        },
        {
          title: "4. Subscription and Payment",
          content: "Full access to GRANDTAROT requires a paid subscription of €6.90/month. Payment is handled via Stripe. You can cancel your subscription at any time."
        },
        {
          title: "5. Behavior and Content",
          content: "You agree to use the service respectfully. Any inappropriate content, harassment, spam or scam attempt will result in immediate account suspension."
        },
        {
          title: "6. Moderation",
          content: "We reserve the right to moderate, delete any content or suspend any account in case of violation of these ToS."
        },
        {
          title: "7. Intellectual Property",
          content: "All GRANDTAROT content (texts, images, AI interpretations) are protected by copyright. Any reproduction is prohibited without authorization."
        },
        {
          title: "8. Liability",
          content: "GRANDTAROT is an entertainment service. Tarot interpretations are generated by AI for informational purposes. We cannot be held responsible for decisions made following these interpretations."
        },
        {
          title: "9. Termination",
          content: "You can delete your account at any time. We can also terminate your access in case of ToS violation."
        },
        {
          title: "10. ToS Modification",
          content: "We reserve the right to modify these ToS at any time. Users will be informed of major changes."
        },
        {
          title: "11. Applicable Law",
          content: "These ToS are governed by French law. Any dispute will be submitted to the competent courts of Paris."
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