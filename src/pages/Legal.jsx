import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function Legal() {
  const [supportEmail, setSupportEmail] = useState('[support@grandtarot.com]');

  useEffect(() => {
    loadSupportEmail();
  }, []);

  const loadSupportEmail = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter(
        { setting_key: 'support_email' },
        null,
        1
      );
      if (settings.length > 0 && settings[0].value_string) {
        setSupportEmail(settings[0].value_string);
      }
    } catch (error) {
      console.error('Error loading support email:', error);
    }
  };

  const toc = [
    { id: 'editeur', label_fr: 'Éditeur du site', label_en: 'Website Publisher' },
    { id: 'hebergeur', label_fr: 'Hébergeur', label_en: 'Web Hosting' },
    { id: 'contact', label_fr: 'Coordonnées', label_en: 'Contact Information' },
    { id: 'proprieté', label_fr: 'Propriété intellectuelle', label_en: 'Intellectual Property' },
    { id: 'contenu', label_fr: 'Responsabilité contenu', label_en: 'Content Liability' },
    { id: 'liens', label_fr: 'Liens externes', label_en: 'External Links' },
    { id: 'droit-image', label_fr: 'Droit à l\'image', label_en: 'Image Rights' }
  ];

  const content = {
    fr: (
      <div className="space-y-8">
        <section id="editeur">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Éditeur du site</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
            <p><strong>Raison sociale :</strong> GRANDTAROT</p>
            <p><strong>Dirigeant :</strong> Vivien LE MOAL</p>
            <p><strong>SIRET :</strong> 83512508900028</p>
            <p><strong>SIREN :</strong> 835125089</p>
            <p><strong>Forme juridique :</strong> Micro-entreprise / EIRL</p>
            <p><strong>Email :</strong> {supportEmail}</p>
            <p><strong>Adresse :</strong> [adresse professionnelle à renseigner]</p>
          </div>
        </section>

        <section id="hebergeur">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Hébergeur du site</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
            <p><strong>Nom :</strong> [Hébergeur à renseigner]</p>
            <p><strong>Localisation :</strong> [Localisation géographique]</p>
            <p><strong>Contact :</strong> [Email/téléphone hébergeur]</p>
            <p className="text-sm text-slate-400 mt-4">À compléter avec le prestataire d'hébergement retenu.</p>
          </div>
        </section>

        <section id="contact">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Coordonnées</h2>
          <div className="space-y-4">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <p className="font-semibold text-amber-200 mb-2">📧 Support utilisateur</p>
              <p className="text-slate-300">{supportEmail}</p>
              <p className="text-sm text-slate-400 mt-2">Délai de réponse : 48h en jours ouvrables</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="font-semibold text-blue-200 mb-2">⚖️ Réclamations légales</p>
              <p className="text-slate-300">{supportEmail}</p>
              <p className="text-sm text-slate-400 mt-2">Incluez : sujet, date, détails du litige</p>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="font-semibold text-green-200 mb-2">🔐 Signalement sécurité</p>
              <p className="text-slate-300">{supportEmail}</p>
              <p className="text-sm text-slate-400 mt-2">Vulnerability disclosure : suite asap</p>
            </div>
          </div>
        </section>

        <section id="proprieté">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Propriété intellectuelle</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              <strong>© GRANDTAROT - Tous droits réservés.</strong> Le contenu du site (textes, images, logos, algorithmes, interprétations tarot) est protégé par le droit d'auteur français et international.
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-200">Droits autorisés</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2 text-sm">
                <li>Affichage personnel (non-commercial)</li>
                <li>Navigation et consultation du site</li>
                <li>Impression pour usage privé</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-200">Droits interdits</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2 text-sm">
                <li>❌ Reproduction / modification sans autorisation</li>
                <li>❌ Extraction de données (scraping)</li>
                <li>❌ Utilisation commerciale</li>
                <li>❌ Reverse engineering du code</li>
                <li>❌ Vente ou licencing sans accord</li>
              </ul>
            </div>

            <p className="font-semibold text-amber-200">
              Violation détectée = action légale (mise en demeure, dommages-intérêts, signalement CNIL si données perso).
            </p>
          </div>
        </section>

        <section id="contenu">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Responsabilité du contenu</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              <strong>Contenus produits par GRANDTAROT :</strong> Exactitude au mieux de nos efforts, mais sans garantie de perfection. Les interprétations tarot sont à titre informatif / divertissement.
            </p>

            <p>
              <strong>Contenus utilisateurs :</strong> CHAQUE utilisateur est responsable de son contenu (profil, messages, photos). GRANDTAROT n'est PAS responsable du contenu généré par tiers, mais s'engage à modérer conformément aux CGU.
            </p>

            <p>
              <strong>Signalement :</strong> Contenus illégaux/violant droits ? Signalez à {supportEmail}. Suppression dans 48h si avéré.
            </p>
          </div>
        </section>

        <section id="liens">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Liens externes</h2>
          <p className="text-slate-300">
            GRANDTAROT n'est pas responsable des sites tiers liés. Consultation à votre seul risque. Les liens externes ne constituent pas une endorsement.
          </p>
        </section>

        <section id="droit-image">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Droit à l'image</h2>
          <p className="text-slate-300 mb-4">
            <strong>Photos utilisateurs :</strong> Vous acceptez que votre photo soit visible aux autres utilisateurs selon vos paramètres. GRANDTAROT se réserve le droit d'utiliser des screenshots anonymisés pour modération ou amélioration IA.
          </p>
          <p className="text-slate-300">
            <strong>Droit d'effacement :</strong> Vous pouvez demander suppression de vos photos à tout moment (droits RGPD).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Mise à jour</h2>
          <p className="text-slate-300">
            Ces mentions légales sont mises à jour régulièrement. Version actuelle : 2026-01-10. Consultation régulière recommandée.
          </p>
        </section>
      </div>
    ),
    en: (
      <div className="space-y-8">
        <section id="editeur">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Website Publisher</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
            <p><strong>Company Name:</strong> GRANDTAROT</p>
            <p><strong>Director:</strong> Vivien LE MOAL</p>
            <p><strong>SIRET:</strong> 83512508900028</p>
            <p><strong>SIREN:</strong> 835125089</p>
            <p><strong>Legal Form:</strong> Micro-enterprise / EIRL</p>
            <p><strong>Email:</strong> {supportEmail}</p>
            <p><strong>Address:</strong> [professional address to be provided]</p>
          </div>
        </section>

        <section id="hebergeur">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Web Hosting Provider</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
            <p><strong>Name:</strong> [Hosting provider to be specified]</p>
            <p><strong>Location:</strong> [Geographic location]</p>
            <p><strong>Contact:</strong> [Provider email/phone]</p>
            <p className="text-sm text-slate-400 mt-4">To be completed with the selected hosting provider.</p>
          </div>
        </section>

        <section id="contact">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <p className="font-semibold text-amber-200 mb-2">📧 User Support</p>
              <p className="text-slate-300">{supportEmail}</p>
              <p className="text-sm text-slate-400 mt-2">Response time: 48h business days</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="font-semibold text-blue-200 mb-2">⚖️ Legal Complaints</p>
              <p className="text-slate-300">{supportEmail}</p>
              <p className="text-sm text-slate-400 mt-2">Include: subject, date, dispute details</p>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="font-semibold text-green-200 mb-2">🔐 Security Reporting</p>
              <p className="text-slate-300">{supportEmail}</p>
              <p className="text-sm text-slate-400 mt-2">Vulnerability disclosure: immediate follow-up</p>
            </div>
          </div>
        </section>

        <section id="proprieté">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Intellectual Property</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              <strong>© GRANDTAROT - All Rights Reserved.</strong> Site content (text, images, logos, algorithms, tarot interpretations) is protected by French and international copyright law.
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-200">Authorized Rights</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2 text-sm">
                <li>Personal display (non-commercial)</li>
                <li>Website navigation and consultation</li>
                <li>Printing for private use</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-200">Prohibited Rights</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2 text-sm">
                <li>❌ Reproduction/modification without permission</li>
                <li>❌ Data extraction (scraping)</li>
                <li>❌ Commercial use</li>
                <li>❌ Code reverse engineering</li>
                <li>❌ Sale or licensing without consent</li>
              </ul>
            </div>

            <p className="font-semibold text-amber-200">
              Violation detected = legal action (cease & desist, damages, CNIL report if personal data involved).
            </p>
          </div>
        </section>

        <section id="contenu">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Content Liability</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              <strong>GRANDTAROT-produced content:</strong> Best-effort accuracy, but no guarantee of perfection. Tarot interpretations are for informational/entertainment purposes.
            </p>

            <p>
              <strong>User-generated content:</strong> EACH user is responsible for their content (profile, messages, photos). GRANDTAROT is NOT responsible for third-party content, but commits to moderate per Terms.
            </p>

            <p>
              <strong>Reporting:</strong> Illegal/rights-violating content? Report to {supportEmail}. Removal within 48h if verified.
            </p>
          </div>
        </section>

        <section id="liens">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">External Links</h2>
          <p className="text-slate-300">
            GRANDTAROT is not responsible for third-party linked sites. Consultation at your sole risk. External links do not constitute endorsement.
          </p>
        </section>

        <section id="droit-image">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Image Rights</h2>
          <p className="text-slate-300 mb-4">
            <strong>User photos:</strong> You accept that your photo is visible to other users per your settings. GRANDTAROT reserves the right to use anonymized screenshots for moderation or AI improvement.
          </p>
          <p className="text-slate-300">
            <strong>Right to erasure:</strong> You can request photo removal anytime (GDPR rights).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Updates</h2>
          <p className="text-slate-300">
            These legal notices are updated regularly. Current version: 2026-01-10. Regular consultation recommended.
          </p>
        </section>
      </div>
    )
  };

  return (
    <LegalPageLayout
      title_fr="Mentions Légales"
      title_en="Legal Notice"
      lastUpdated="2026-01-10"
      toc={toc}
    >
      {(lang) => content[lang]}
    </LegalPageLayout>
  );
}