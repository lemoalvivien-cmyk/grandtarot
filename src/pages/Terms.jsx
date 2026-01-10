import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function Terms() {
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
    { id: 'acceptance', label_fr: 'Acceptation des CGU', label_en: 'Acceptance of Terms' },
    { id: 'service', label_fr: 'Description du service', label_en: 'Service Description' },
    { id: 'inscription', label_fr: 'Inscription & compte', label_en: 'Registration & Account' },
    { id: 'regles-utilisation', label_fr: 'Règles d\'utilisation', label_en: 'Usage Rules' },
    { id: 'interdictions', label_fr: 'Comportements interdits', label_en: 'Prohibited Conduct' },
    { id: 'moderation', label_fr: 'Modération & suspension', label_en: 'Moderation & Suspension' },
    { id: 'responsabilite', label_fr: 'Limitation responsabilité', label_en: 'Liability Limitation' },
    { id: 'resiliation', label_fr: 'Résiliation du compte', label_en: 'Account Termination' },
    { id: 'droits', label_fr: 'Propriété intellectuelle', label_en: 'Intellectual Property' },
    { id: 'droit-applicable', label_fr: 'Droit applicable', label_en: 'Governing Law' }
  ];

  const content = {
    fr: (
      <div className="space-y-8">
        <section id="acceptance">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Acceptation des Conditions Générales d'Utilisation</h2>
          <p className="text-slate-300">
            En accédant à GRANDTAROT, vous acceptez sans réserve ces Conditions Générales d'Utilisation (CGU). Si vous ne les acceptez pas, cessez d'utiliser le service immédiatement.
          </p>
        </section>

        <section id="service">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Description du service</h2>
          <p className="text-slate-300">
            GRANDTAROT est une plateforme de rencontres et networking basée sur :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 ml-2 mt-3">
            <li>Tirage quotidien de cartes tarot IA personnalisées</li>
            <li>Matching intelligent (astrologie, tarot, intérêts communs)</li>
            <li>3 modes : Amour, Amitié, Professionnel</li>
            <li>Messagerie sécurisée avec modération</li>
            <li>Encyclopédie tarot interactive</li>
          </ul>
        </section>

        <section id="inscription">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Inscription & compte utilisateur</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Conditions d'inscription</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Vous avez au moins 18 ans (obligatoire)</li>
                <li>✅ Vous acceptez les CGU et Politique de Confidentialité</li>
                <li>✅ Email valide et unique</li>
                <li>✅ Photo de profil authentique (à vérifier)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Votre responsabilité</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>⚠️ Vous êtes seul responsable de vos identifiants</li>
                <li>⚠️ Ne partagez PAS votre mot de passe</li>
                <li>⚠️ Signalez accès non-autorisé immédiatement</li>
                <li>⚠️ Les infos que vous fournissez doivent être exactes</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="regles-utilisation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Règles d'utilisation</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-200 mb-2">✅ Vous pouvez</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Créer un profil authentique</li>
                <li>Envoyer jusqu'à 5 intentions par jour</li>
                <li>Échanger messages avec personnes acceptant votre intention</li>
                <li>Bloquer/signaler profils suspects</li>
                <li>Télécharger vos données (droit RGPD)</li>
                <li>Demander suppression du compte</li>
              </ul>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">❌ Vous NE POUVEZ PAS</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Usurper l'identité d'une autre personne</li>
                <li>Utiliser photo/données d'un tiers sans consentement</li>
                <li>Partager images explicites (sauf accord)</li>
                <li>Spam, multi-comptes, bots</li>
                <li>Harceler, insulter, menacer</li>
                <li>Solliciter de l'argent, crypto</li>
                <li>Revendre données, scraper le site</li>
                <li>Contourner la modération</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="interdictions">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Comportements interdits</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3 text-slate-300">
            <div>
              <p className="font-semibold text-red-300">🚫 Escroquerie & arnaque</p>
              <p className="text-sm">Contrefaire identité, demander argent, crypto, données bancaires.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Harcèlement & menaces</p>
              <p className="text-sm">Messages répétés non-consentis, insultes, menaces physiques/légales.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Contenu illégal</p>
              <p className="text-sm">Contenu pédophile, violent, extrémiste, terrorisme.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Violation vie privée</p>
              <p className="text-sm">Doxxing (publicazione dati privés), enregistrement non-consentis, deepfakes.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Exploitation commerciale</p>
              <p className="text-sm">Vendre services/produits, faire pub, MLM, prostitution.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Sabotage technique</p>
              <p className="text-sm">Virus, malware, injection SQL, DDoS, hacking.</p>
            </div>
          </div>
        </section>

        <section id="moderation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Modération & suspension de compte</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Processus de modération</h3>
              <p className="text-sm mb-3">Messages & profils sont scannés par IA pour :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Contenu explicite non-consentis</li>
                <li>Arnaque (numéros crypto, payment)</li>
                <li>Harcèlement (mots-clés patterns)</li>
                <li>Liens externes suspects</li>
                <li>Violation CGU évidentes</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">Avertissement & restriction</h3>
              <p className="text-sm">1ère violation mineure = avertissement email (pas suspension)</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">Suspension temporaire</h3>
              <p className="text-sm">Violations répétées / graves = 7 à 30 jours suspension</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">Banissement permanent</h3>
              <p className="text-sm">Harcèlement massif, pédophilie, escroquerie = suppression immédiate + signalement police</p>
            </div>

            <p className="text-sm font-semibold mt-4">
              📧 Recours : Si vous désaccordez sanction, contactez {supportEmail} avec preuves.
            </p>
          </div>
        </section>

        <section id="responsabilite">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Limitation de responsabilité</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">GRANDTAROT n'est PAS responsable de :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>❌ Contenu utilisateur (messages, photos, profils)</li>
                <li>❌ Rencontres/relations entre utilisateurs</li>
                <li>❌ Arnaque entre users (responsabilité users)</li>
                <li>❌ Interprétations tarot (usage informatif seulementmassimo)</li>
                <li>❌ Interruptions de service / pertes données (sauf negligence)</li>
                <li>❌ Dommages indirects (perte emploi, dépression, etc.)</li>
              </ul>
            </div>

            <p className="text-sm italic bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
              <strong>⚠️ Garantie limitée :</strong> Le service est fourni "as-is" sans garantie d'exactitude. GRANDTAROT ne garantit pas rencontres de qualité, algorithmes PERFECTS, ou absence bugs.
            </p>
          </div>
        </section>

        <section id="resiliation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Résiliation du compte</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Par vous</h3>
              <p className="text-sm">Cliquez "Supprimer compte" dans Paramètres → Données. Suppression définitive sous 30j. Pas de remboursement.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Par GRANDTAROT</h3>
              <p className="text-sm">Si violation CGU grave ou suspension non-levée après 6 mois.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Après résiliation</h3>
              <p className="text-sm">Données anonymisées après 30j. Messages archivés 6 mois (obligation légale).</p>
            </div>
          </div>
        </section>

        <section id="droits">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Propriété intellectuelle</h2>
          <p className="text-slate-300">
            <strong>© GRANDTAROT.</strong> Tous logos, textes, design, IA (matching, tarot) sont protégés. Vous obtenez licence personnelle non-exclusive pour utiliser le service, mais NE POUVEZ PAS :
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2 mt-3 text-sm">
            <li>Copier / modifier / vendre</li>
            <li>Scraper / reverse engineer</li>
            <li>Créer produits dérivés</li>
            <li>Reproduire design / IA sans accord</li>
          </ul>
        </section>

        <section id="droit-applicable">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Droit applicable & juridiction</h2>
          <p className="text-slate-300">
            <strong>Loi applicable :</strong> Droit français<br/>
            <strong>Tribunal compétent :</strong> Tribunaux de Paris (France)<br/>
            <strong>Résolution litiges :</strong> En cas de différend, contactez {supportEmail} pour résolution amiable avant action légale.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Dernière mise à jour</h2>
          <p className="text-slate-300">
            Ces CGU sont mises à jour régulièrement. Version actuelle : 2026-01-10.
          </p>
        </section>
      </div>
    ),
    en: (
      <div className="space-y-8">
        <section id="acceptance">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Acceptance of Terms and Conditions</h2>
          <p className="text-slate-300">
            By accessing GRANDTAROT, you accept without reservation these Terms and Conditions. If you do not agree, cease using the service immediately.
          </p>
        </section>

        <section id="service">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Service Description</h2>
          <p className="text-slate-300">
            GRANDTAROT is a dating and networking platform based on:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 ml-2 mt-3">
            <li>Daily personalized AI tarot card reading</li>
            <li>Intelligent matching (astrology, tarot, shared interests)</li>
            <li>3 modes: Love, Friendship, Professional</li>
            <li>Secure messaging with moderation</li>
            <li>Interactive tarot encyclopedia</li>
          </ul>
        </section>

        <section id="inscription">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Registration & Account</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Registration Conditions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ You are at least 18 years old (mandatory)</li>
                <li>✅ You accept Terms and Privacy Policy</li>
                <li>✅ Valid, unique email</li>
                <li>✅ Authentic profile photo (to be verified)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Your Responsibility</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>⚠️ You are solely responsible for your credentials</li>
                <li>⚠️ DO NOT share your password</li>
                <li>⚠️ Report unauthorized access immediately</li>
                <li>⚠️ Information you provide must be accurate</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="regles-utilisation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Usage Rules</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-200 mb-2">✅ You CAN</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create an authentic profile</li>
                <li>Send up to 5 intentions per day</li>
                <li>Exchange messages with accepting users</li>
                <li>Block/report suspicious profiles</li>
                <li>Download your data (GDPR right)</li>
                <li>Request account deletion</li>
              </ul>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">❌ You CANNOT</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Impersonate someone else</li>
                <li>Use photo/data of third party without consent</li>
                <li>Share explicit images (except agreed)</li>
                <li>Spam, multi-account, bots</li>
                <li>Harass, insult, threaten</li>
                <li>Solicit money, crypto</li>
                <li>Resell data, scrape site</li>
                <li>Circumvent moderation</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="interdictions">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Prohibited Conduct</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3 text-slate-300">
            <div>
              <p className="font-semibold text-red-300">🚫 Fraud & Scam</p>
              <p className="text-sm">Impersonate identity, solicit money, crypto, banking data.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Harassment & Threats</p>
              <p className="text-sm">Repeated unwanted messages, insults, physical/legal threats.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Illegal Content</p>
              <p className="text-sm">Child exploitation, violence, extremism, terrorism.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Privacy Violation</p>
              <p className="text-sm">Doxxing (publishing private data), non-consensual recording, deepfakes.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Commercial Exploitation</p>
              <p className="text-sm">Sell services/products, advertising, MLM, prostitution.</p>
            </div>
            <div>
              <p className="font-semibold text-red-300">🚫 Technical Sabotage</p>
              <p className="text-sm">Virus, malware, SQL injection, DDoS, hacking.</p>
            </div>
          </div>
        </section>

        <section id="moderation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Moderation & Account Suspension</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">Moderation Process</h3>
              <p className="text-sm mb-3">Messages & profiles scanned by AI for:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Non-consensual explicit content</li>
                <li>Scam (crypto numbers, payment)</li>
                <li>Harassment (keyword patterns)</li>
                <li>Suspicious external links</li>
                <li>Obvious Terms violation</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">Warning & Restriction</h3>
              <p className="text-sm">1st minor violation = warning email (no suspension)</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">Temporary Suspension</h3>
              <p className="text-sm">Repeated/grave violations = 7-30 days suspension</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">Permanent Ban</h3>
              <p className="text-sm">Massive harassment, child exploitation, scam = immediate deletion + police report</p>
            </div>

            <p className="text-sm font-semibold mt-4">
              📧 Appeal: If you disagree with action, contact {supportEmail} with evidence.
            </p>
          </div>
        </section>

        <section id="responsabilite">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Limitation of Liability</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">GRANDTAROT is NOT responsible for:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>❌ User-generated content (messages, photos, profiles)</li>
                <li>❌ Dating/relationships between users</li>
                <li>❌ Scams between users (user responsibility)</li>
                <li>❌ Tarot interpretations (informational use only)</li>
                <li>❌ Service interruptions / data loss (except negligence)</li>
                <li>❌ Indirect damages (job loss, depression, etc.)</li>
              </ul>
            </div>

            <p className="text-sm italic bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
              <strong>⚠️ Limited Warranty:</strong> Service provided "as-is" without accuracy guarantee. GRANDTAROT does not guarantee quality matches, perfect algorithms, or bug-free operation.
            </p>
          </div>
        </section>

        <section id="resiliation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Account Termination</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">By You</h3>
              <p className="text-sm">Click "Delete Account" in Settings → Data. Permanent deletion within 30d. No refund.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">By GRANDTAROT</h3>
              <p className="text-sm">If grave Terms violation or suspension not lifted after 6 months.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">After Termination</h3>
              <p className="text-sm">Data anonymized after 30d. Messages archived 6 months (legal requirement).</p>
            </div>
          </div>
        </section>

        <section id="droits">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Intellectual Property</h2>
          <p className="text-slate-300">
            <strong>© GRANDTAROT.</strong> All logos, text, design, AI (matching, tarot) are protected. You get personal non-exclusive license to use service, but CANNOT:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2 mt-3 text-sm">
            <li>Copy / modify / sell</li>
            <li>Scrape / reverse engineer</li>
            <li>Create derivative products</li>
            <li>Reproduce design / AI without consent</li>
          </ul>
        </section>

        <section id="droit-applicable">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Governing Law & Jurisdiction</h2>
          <p className="text-slate-300">
            <strong>Applicable Law:</strong> French law<br/>
            <strong>Competent Court:</strong> Paris courts (France)<br/>
            <strong>Dispute Resolution:</strong> Contact {supportEmail} for amicable resolution before legal action.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Last Update</h2>
          <p className="text-slate-300">
            These Terms are updated regularly. Current version: 2026-01-10.
          </p>
        </section>
      </div>
    )
  };

  return (
    <LegalPageLayout
      title_fr="Conditions Générales d'Utilisation"
      title_en="Terms and Conditions"
      lastUpdated="2026-01-10"
      toc={toc}
    >
      {(lang) => content[lang]}
    </LegalPageLayout>
  );
}