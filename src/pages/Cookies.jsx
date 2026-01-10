import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function Cookies() {
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
    { id: 'definition', label_fr: 'Qu\'est-ce qu\'un cookie ?', label_en: 'What is a Cookie?' },
    { id: 'types', label_fr: 'Types de cookies', label_en: 'Cookie Types' },
    { id: 'necessaires', label_fr: 'Cookies nécessaires', label_en: 'Essential Cookies' },
    { id: 'non-essentiels', label_fr: 'Cookies non-essentiels', label_en: 'Non-Essential Cookies' },
    { id: 'gestion', label_fr: 'Gestion des cookies', label_en: 'Cookie Management' },
    { id: 'refuser', label_fr: 'Refuser cookies', label_en: 'Reject Cookies' },
    { id: 'tiers', label_fr: 'Cookies tiers', label_en: 'Third-Party Cookies' },
    { id: 'cnil', label_fr: 'Conformité CNIL', label_en: 'CNIL Compliance' }
  ];

  const content = {
    fr: (
      <div className="space-y-8">
        <section id="definition">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Qu'est-ce qu'un cookie ?</h2>
          <p className="text-slate-300">
            Un cookie est un petit fichier texte stocké sur votre ordinateur/téléphone quand vous visitez un site. Il permet au site de "vous reconnaître" lors de futures visites et de personnaliser votre expérience.
          </p>
          <p className="text-slate-300 mt-3">
            <strong>Durée :</strong> Peut varier de quelques minutes à plusieurs années selon le type.
          </p>
        </section>

        <section id="types">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Types de cookies</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🔐 Cookies de session</h3>
              <p className="text-sm">Supprimés quand vous fermez le navigateur. Contiennent votre token de login.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📅 Cookies persistants</h3>
              <p className="text-sm">Restent plusieurs mois/années. Ex: "rememberd me" (durée max 24 mois).</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🌐 Cookies tiers</h3>
              <p className="text-sm">De domaines externes (Stripe, analytics). Détaillés section "Cookies tiers".</p>
            </div>
          </div>
        </section>

        <section id="necessaires">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Cookies NÉCESSAIRES (toujours autorisés)</h2>
          <p className="text-slate-300 mb-4">
            Ces cookies sont OBLIGATOIRES pour le fonctionnement du site. Ils ne nécessitent PAS consentement (Art. 82 Directive ePrivacy).
          </p>

          <div className="space-y-3">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-green-200 mb-2">🔐 Session authentication</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Nom :</strong> auth_token</li>
                <li><strong>Finalité :</strong> Vous garder connecté(e)</li>
                <li><strong>Durée :</strong> 24 heures</li>
                <li><strong>Contient :</strong> ID session (anonyme)</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-green-200 mb-2">🌐 CSRF protection</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Nom :</strong> csrf_token</li>
                <li><strong>Finalité :</strong> Protéger contre attaques CSRF</li>
                <li><strong>Durée :</strong> 1 jour</li>
                <li><strong>Contient :</strong> Token sécurisé (anonyme)</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-green-200 mb-2">🎯 Préférences utilisateur</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Nom :</strong> user_lang, theme_pref</li>
                <li><strong>Finalité :</strong> Retenir votre langue/thème</li>
                <li><strong>Durée :</strong> 6 mois</li>
                <li><strong>Contient :</strong> "en" ou "fr", mode clair/sombre</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="non-essentiels">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Cookies NON-ESSENTIELS (consentement requis)</h2>
          <p className="text-slate-300 mb-4">
            Nécessitent VOTRE CONSENTEMENT explicite. Vous avez reçu un banneau de consentement au premier accès.
          </p>

          <div className="space-y-3">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-blue-200 mb-2">📊 Analytics (Google Analytics)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Noms :</strong> _ga, _gat, _gid</li>
                <li><strong>Finalité :</strong> Compter visiteurs, tracker navigation (anonyme)</li>
                <li><strong>Durée :</strong> 2 ans</li>
                <li><strong>Partage :</strong> Google LLC (serveurs USA)</li>
                <li><strong>Consentement :</strong> ✅ Vous avez dit OUI</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-blue-200 mb-2">💬 Hotjar (heatmaps/feedback)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Noms :</strong> hjid, hjViewportId</li>
                <li><strong>Finalité :</strong> Heatmaps, enregistrements sessions (opt-in seulement)</li>
                <li><strong>Durée :</strong> 1 an</li>
                <li><strong>Partage :</strong> Hotjar Ltd (serveurs EU/USA)</li>
                <li><strong>Consentement :</strong> ✅ Vous avez dit OUI</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-blue-200 mb-2">📧 Marketing (email tracking)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Noms :</strong> mailchimp_tracking</li>
                <li><strong>Finalité :</strong> Tracker clics emails, newsletters</li>
                <li><strong>Durée :</strong> 1 an</li>
                <li><strong>Partage :</strong> Mailchimp (serveurs USA)</li>
                <li><strong>Consentement :</strong> ✅ Vous avez dit OUI (si abonné newsletter)</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="gestion">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Comment gérer les cookies</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🍪 Banneau de consentement GRANDTAROT</h3>
              <p className="text-sm mb-3">En bas du site, cliquez :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ <strong>"Accepter tous"</strong> → Tous cookies non-essentiels autorisés</li>
                <li>❌ <strong>"Refuser"</strong> → Seulement cookies nécessaires</li>
                <li>⚙️ <strong>"Paramètres"</strong> → Choix granulaire (analytics, marketing, hotjar)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🔧 Paramètres du navigateur</h3>
              <p className="text-sm mb-2">Vous pouvez aussi refuser cookies via navigateur :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Chrome :</strong> Paramètres → Confidentialité → Cookies</li>
                <li><strong>Firefox :</strong> Préférences → Vie privée → Historique</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité</li>
                <li><strong>Edge :</strong> Paramètres → Confidentialité</li>
              </ul>
              <p className="text-sm mt-2 text-amber-300">⚠️ Attention : Refuser cookies nécessaires peut casser login!</p>
            </div>
          </div>
        </section>

        <section id="refuser">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Refuser ou supprimer les cookies</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">❌ Refuser au 1er accès</h3>
              <p className="text-sm">Cliquez "Refuser" dans le banneau de consentement → Seuls cookies obligatoires seront placés.</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">🗑️ Supprimer cookies existants</h3>
              <p className="text-sm mb-2">Utilisez l'outil "Effacer historique" du navigateur :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chrome: Ctrl+Shift+Supp → "Cookies"</li>
                <li>Firefox: Ctrl+Shift+Supp → "Cookies"</li>
                <li>Safari: Menu → "Effacer l'historique..."</li>
              </ul>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">🚫 Désabonnez-vous marketing</h3>
              <p className="text-sm">Cliquez lien "Unsubscribe" dans email → Arrête tracking marketing + email.</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">📞 Nous contacter</h3>
              <p className="text-sm">Pour demande suppression cookies, contactez {supportEmail}.</p>
            </div>
          </div>
        </section>

        <section id="tiers">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Cookies tiers (services externes)</h2>
          <p className="text-slate-300 mb-4">
            GRANDTAROT utilise services externes qui posent leurs propres cookies :
          </p>

          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💳 Stripe (paiements)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>URL: https://stripe.com</li>
                <li>Données: Email, montant, token paiement (chiffré)</li>
                <li>Consentement: ✅ Obligatoire (contrat paiement)</li>
                <li>Privacy: https://stripe.com/privacy</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Google Analytics</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>URL: https://analytics.google.com</li>
                <li>Données: Visites anonymisées, pages vues (IP anonymisée)</li>
                <li>Consentement: ✅ Vous avez accepté</li>
                <li>Privacy: https://policies.google.com/privacy</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🎯 Hotjar</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>URL: https://www.hotjar.com</li>
                <li>Données: Heatmaps, clics, scrolls (opt-in)</li>
                <li>Consentement: ✅ Vous avez accepté</li>
                <li>Privacy: https://www.hotjar.com/privacy</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="cnil">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Conformité CNIL & réglementation</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">📋 Directive ePrivacy (2002/58/CE)</h3>
              <p className="text-sm">Requiert consentement AVANT poser cookies non-essentiels. ✅ GRANDTAROT respecte (banneau de consentement).</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">🔒 RGPD (Art. 7 - consentement)</h3>
              <p className="text-sm">Consentement doit être libre, spécifique, explicite, informé. GRANDTAROT offre banneau clair + paramètres granulaires + droit de retrait. ✅ Conforme.</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">📢 Recommandation CNIL (2020)</h3>
              <p className="text-sm">Consentement par défaut = boutons "Refuser" et "Accepter" de taille égale. ✅ GRANDTAROT applique.</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">✅ Conformité GRANDTAROT</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Banneau de consentement au 1er accès</li>
                <li>✅ Refuser avant accepter</li>
                <li>✅ Détails cookies listés (nom, durée, finalité)</li>
                <li>✅ Droit de retrait (changer avis anytime)</li>
                <li>✅ Cookies tiers = consentement séparé</li>
                <li>✅ IP anonymisée après 30 jours</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Questions sur les cookies ?</h2>
          <p className="text-slate-300">
            Contactez {supportEmail} pour toute question sur notre utilisation des cookies.
          </p>
          <p className="text-slate-300 mt-3">
            <strong>Mise à jour :</strong> 2026-01-10
          </p>
        </section>
      </div>
    ),
    en: (
      <div className="space-y-8">
        <section id="definition">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">What is a Cookie?</h2>
          <p className="text-slate-300">
            A cookie is a small text file stored on your computer/phone when you visit a website. It allows the site to "recognize" you on future visits and personalize your experience.
          </p>
          <p className="text-slate-300 mt-3">
            <strong>Duration:</strong> Can vary from minutes to years depending on type.
          </p>
        </section>

        <section id="types">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Cookie Types</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🔐 Session Cookies</h3>
              <p className="text-sm">Deleted when you close browser. Contain your login token.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📅 Persistent Cookies</h3>
              <p className="text-sm">Remain for months/years. Ex: "remember me" (max 24 months).</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🌐 Third-Party Cookies</h3>
              <p className="text-sm">From external domains (Stripe, analytics). Detailed in "Third-Party Cookies" section.</p>
            </div>
          </div>
        </section>

        <section id="necessaires">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">ESSENTIAL Cookies (Always Allowed)</h2>
          <p className="text-slate-300 mb-4">
            These cookies are MANDATORY for site function. They do NOT require consent (Art. 82 ePrivacy Directive).
          </p>

          <div className="space-y-3">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-green-200 mb-2">🔐 Session Authentication</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Name:</strong> auth_token</li>
                <li><strong>Purpose:</strong> Keep you logged in</li>
                <li><strong>Duration:</strong> 24 hours</li>
                <li><strong>Contains:</strong> Session ID (anonymous)</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-green-200 mb-2">🌐 CSRF Protection</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Name:</strong> csrf_token</li>
                <li><strong>Purpose:</strong> Protect against CSRF attacks</li>
                <li><strong>Duration:</strong> 1 day</li>
                <li><strong>Contains:</strong> Secure token (anonymous)</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-green-200 mb-2">🎯 User Preferences</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Name:</strong> user_lang, theme_pref</li>
                <li><strong>Purpose:</strong> Remember your language/theme</li>
                <li><strong>Duration:</strong> 6 months</li>
                <li><strong>Contains:</strong> "en" or "fr", light/dark mode</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="non-essentiels">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">NON-ESSENTIAL Cookies (Consent Required)</h2>
          <p className="text-slate-300 mb-4">
            Require YOUR EXPLICIT CONSENT. You received a consent banner on first visit.
          </p>

          <div className="space-y-3">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-blue-200 mb-2">📊 Analytics (Google Analytics)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Names:</strong> _ga, _gat, _gid</li>
                <li><strong>Purpose:</strong> Count visitors, track navigation (anonymous)</li>
                <li><strong>Duration:</strong> 2 years</li>
                <li><strong>Shared with:</strong> Google LLC (USA servers)</li>
                <li><strong>Consent:</strong> ✅ You said YES</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-blue-200 mb-2">💬 Hotjar (heatmaps/feedback)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Names:</strong> hjid, hjViewportId</li>
                <li><strong>Purpose:</strong> Heatmaps, session recordings (opt-in only)</li>
                <li><strong>Duration:</strong> 1 year</li>
                <li><strong>Shared with:</strong> Hotjar Ltd (EU/USA servers)</li>
                <li><strong>Consent:</strong> ✅ You said YES</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-slate-300">
              <h3 className="font-semibold text-blue-200 mb-2">📧 Marketing (email tracking)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Names:</strong> mailchimp_tracking</li>
                <li><strong>Purpose:</strong> Track email clicks, newsletters</li>
                <li><strong>Duration:</strong> 1 year</li>
                <li><strong>Shared with:</strong> Mailchimp (USA servers)</li>
                <li><strong>Consent:</strong> ✅ You said YES (if subscribed)</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="gestion">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">How to Manage Cookies</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🍪 GRANDTAROT Consent Banner</h3>
              <p className="text-sm mb-3">At bottom of site, click:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ <strong>"Accept All"</strong> → All non-essential cookies allowed</li>
                <li>❌ <strong>"Reject"</strong> → Only essential cookies</li>
                <li>⚙️ <strong>"Settings"</strong> → Granular choices (analytics, marketing, hotjar)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🔧 Browser Settings</h3>
              <p className="text-sm mb-2">You can also reject cookies via browser:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Chrome:</strong> Settings → Privacy → Cookies</li>
                <li><strong>Firefox:</strong> Preferences → Privacy → History</li>
                <li><strong>Safari:</strong> Preferences → Privacy</li>
                <li><strong>Edge:</strong> Settings → Privacy</li>
              </ul>
              <p className="text-sm mt-2 text-amber-300">⚠️ Warning: Rejecting essential cookies may break login!</p>
            </div>
          </div>
        </section>

        <section id="refuser">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Reject or Delete Cookies</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">❌ Reject on First Visit</h3>
              <p className="text-sm">Click "Reject" in consent banner → Only mandatory cookies placed.</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">🗑️ Delete Existing Cookies</h3>
              <p className="text-sm mb-2">Use "Clear History" tool in browser:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chrome: Ctrl+Shift+Del → "Cookies"</li>
                <li>Firefox: Ctrl+Shift+Del → "Cookies"</li>
                <li>Safari: Menu → "Clear History..."</li>
              </ul>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">🚫 Unsubscribe from Marketing</h3>
              <p className="text-sm">Click "Unsubscribe" link in email → Stops marketing tracking + email.</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">📞 Contact Us</h3>
              <p className="text-sm">For cookie deletion requests, contact {supportEmail}.</p>
            </div>
          </div>
        </section>

        <section id="tiers">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Third-Party Cookies (External Services)</h2>
          <p className="text-slate-300 mb-4">
            GRANDTAROT uses external services that place their own cookies:
          </p>

          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💳 Stripe (Payments)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>URL: https://stripe.com</li>
                <li>Data: Email, amount, payment token (encrypted)</li>
                <li>Consent: ✅ Mandatory (payment contract)</li>
                <li>Privacy: https://stripe.com/privacy</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Google Analytics</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>URL: https://analytics.google.com</li>
                <li>Data: Anonymized visits, page views (anonymized IP)</li>
                <li>Consent: ✅ You accepted</li>
                <li>Privacy: https://policies.google.com/privacy</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🎯 Hotjar</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>URL: https://www.hotjar.com</li>
                <li>Data: Heatmaps, clicks, scrolls (opt-in)</li>
                <li>Consent: ✅ You accepted</li>
                <li>Privacy: https://www.hotjar.com/privacy</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="cnil">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">CNIL Compliance & Regulation</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">📋 ePrivacy Directive (2002/58/CE)</h3>
              <p className="text-sm">Requires consent BEFORE placing non-essential cookies. ✅ GRANDTAROT complies (consent banner).</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">🔒 GDPR (Art. 7 - Consent)</h3>
              <p className="text-sm">Consent must be free, specific, explicit, informed. GRANDTAROT offers clear banner + granular settings + right to withdraw. ✅ Compliant.</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">📢 CNIL Recommendation (2020)</h3>
              <p className="text-sm">Default consent = "Reject" and "Accept" buttons equal size. ✅ GRANDTAROT applies.</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2">✅ GRANDTAROT Compliance</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Consent banner on first visit</li>
                <li>✅ Reject before accept</li>
                <li>✅ Cookie details listed (name, duration, purpose)</li>
                <li>✅ Right to withdraw (change mind anytime)</li>
                <li>✅ Third-party cookies = separate consent</li>
                <li>✅ IP anonymized after 30 days</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Questions About Cookies?</h2>
          <p className="text-slate-300">
            Contact {supportEmail} for any questions about our cookie usage.
          </p>
          <p className="text-slate-300 mt-3">
            <strong>Updated:</strong> 2026-01-10
          </p>
        </section>
      </div>
    )
  };

  return (
    <LegalPageLayout
      title_fr="Politique Cookies"
      title_en="Cookie Policy"
      lastUpdated="2026-01-10"
      toc={toc}
    >
      {(lang) => content[lang]}
    </LegalPageLayout>
  );
}