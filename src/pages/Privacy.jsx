import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LegalPageLayout from '@/components/legal/LegalPageLayout.jsx';

export default function Privacy() {
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
    { id: 'intro', label_fr: 'Introduction', label_en: 'Introduction' },
    { id: 'responsable', label_fr: 'Responsable de traitement', label_en: 'Data Controller' },
    { id: 'finalites', label_fr: 'Finalités du traitement', label_en: 'Processing Purposes' },
    { id: 'bases-legales', label_fr: 'Bases légales', label_en: 'Legal Basis' },
    { id: 'categories-donnees', label_fr: 'Catégories de données', label_en: 'Data Categories' },
    { id: 'destinataires', label_fr: 'Destinataires', label_en: 'Recipients' },
    { id: 'transferts', label_fr: 'Transferts hors UE', label_en: 'International Transfers' },
    { id: 'conservation', label_fr: 'Durée de conservation', label_en: 'Retention' },
    { id: 'droits', label_fr: 'Vos droits', label_en: 'Your Rights' },
    { id: 'securite', label_fr: 'Sécurité', label_en: 'Security' }
  ];

  const content = {
    fr: (
      <div className="space-y-8">
        <section id="intro">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Introduction</h2>
          <p className="text-slate-300">
            GRANDTAROT respecte votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au RGPD (Règlement Général sur la Protection des Données).
          </p>
        </section>

        <section id="responsable">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Responsable de traitement</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
            <p><strong>Nom :</strong> Vivien LE MOAL</p>
            <p><strong>SIRET :</strong> 83512508900028</p>
            <p><strong>Email :</strong> {supportEmail}</p>
            <p className="text-sm text-slate-400 mt-2">Nous sommes responsables de tous les traitements de données effectués via GRANDTAROT.</p>
          </div>
        </section>

        <section id="finalites">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Finalités du traitement</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🔐 Authentification</h3>
              <p className="text-sm">Créer et gérer votre compte (login, mot de passe).</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💬 Messaging & matching</h3>
              <p className="text-sm">Permettre conversations, intentions, matching tarot.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💳 Paiement & facturation</h3>
              <p className="text-sm">Traiter abonnements via Stripe, gérer factures.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🛡️ Sécurité & modération</h3>
              <p className="text-sm">Détecter fraude, scam, harcèlement. Bloquer abus.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Amélioration service</h3>
              <p className="text-sm">Analytics, statistiques (anonymisées), améliorer IA matching.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📧 Notifications</h3>
              <p className="text-sm">Emails de confirmation, récupération compte, mises à jour.</p>
            </div>
          </div>
        </section>

        <section id="bases-legales">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Bases légales (Art. 6 RGPD)</h2>
          <div className="space-y-3 text-slate-300">
            <div className="border-l-4 border-amber-500 pl-4 py-2">
              <p><strong>Contrat (Art 6.1.b) :</strong> Données nécessaires au service (email, profil, messages).</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p><strong>Intérêt légitime (Art 6.1.f) :</strong> Sécurité, modération, détection fraude, amélioration service.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p><strong>Consentement (Art 6.1.a) :</strong> Marketing emails, cookies non-essentiels. Vous pouvez vous désabonner anytime.</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <p><strong>Obligation légale (Art 6.1.c) :</strong> Données comptables, logs de sécurité.</p>
            </div>
          </div>
        </section>

        <section id="categories-donnees">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Catégories de données collectées</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📝 Données de profil</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Email, prénom/nom, date de naissance, genre</li>
                <li>Localisation (ville, rayon recherche)</li>
                <li>Photo de profil</li>
                <li>Intérêts, secteur professionnel</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💬 Données de communication</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Messages, intentions (contenu chiffré)</li>
                <li>Métadonnées (timestamps, destinataires)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💳 Données de paiement</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Informations de facturation (traité par Stripe, PCI-DSS)</li>
                <li>Historique abonnement</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Données techniques</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Adresse IP (anonymisée après 30j)</li>
                <li>User agent, logs d'erreurs</li>
                <li>Cookies & analytics</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="destinataires">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Destinataires de vos données</h2>
          <div className="space-y-3 text-slate-300">
            <p>Vos données ne sont partagées que :</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Utilisateurs du service :</strong> Profil visible selon vos paramètres, messages au destinataire seulement.</li>
              <li><strong>Stripe (paiements) :</strong> Données facturées. Légal: DPA, Privacy Shield.</li>
              <li><strong>Hébergeur :</strong> Base44 / [hébergeur à préciser]. Données de support backups.</li>
              <li><strong>Autorités :</strong> Si obligé par loi (police, CNIL, tribunal).</li>
              <li><strong>Modérateurs internes :</strong> Pour sécurité/modération des contenus.</li>
            </ul>
          </div>
        </section>

        <section id="transferts">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Transferts hors UE</h2>
          <p className="text-slate-300">
            <strong>À préciser selon prestataires :</strong> Selon l'hébergeur et Stripe, certaines données peuvent être transférées hors UE. Nous mettons en place clauses contractuelles (Standard Contractual Clauses) pour sécuriser ces transferts conformément au RGPD.
          </p>
        </section>

        <section id="conservation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Durée de conservation</h2>
          <div className="space-y-2 text-slate-300 text-sm">
            <p><strong>Compte actif :</strong> Données conservées tant que compte actif.</p>
            <p><strong>Compte supprimé :</strong> Pseudonymisation immédiate, suppression définitive après 30j (retroactively cleanup).</p>
            <p><strong>Messages :</strong> Conservés 6 mois après suppression du compte pour archive légale.</p>
            <p><strong>Logs techniques :</strong> 30 jours (sauf obligation légale, 3 ans si fraude détectée).</p>
            <p><strong>Données comptables :</strong> 5 ans (obligation légale France).</p>
          </div>
        </section>

        <section id="droits">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Vos droits RGPD</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">📋 Droit d'accès (Art. 15)</h3>
              <p className="text-sm">Demandez copie de vos données. Réponse : 30 jours.</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">✏️ Droit de rectification (Art. 16)</h3>
              <p className="text-sm">Corrigez/mettez à jour vos données (nom, email, etc.).</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">🗑️ Droit à l'oubli (Art. 17)</h3>
              <p className="text-sm">Demandez suppression. Sauf si légalement obligé de conserver.</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">🔒 Droit à la portabilité (Art. 20)</h3>
              <p className="text-sm">Exportez vos données en format standard (CSV, JSON).</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">📞 S'opposer au traitement (Art. 21)</h3>
              <p className="text-sm">Optez hors de certains traitements (marketing, analytics).</p>
            </div>

            <p className="text-sm font-semibold mt-4 text-slate-200">
              ⚙️ <strong>Demandes :</strong> Contact {supportEmail} avec preuve d'identité. Gratuit, réponse 30 jours.
            </p>
          </div>
        </section>

        <section id="securite">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Sécurité (Art. 32 RGPD)</h2>
          <div className="space-y-3 text-slate-300">
            <p><strong>Mesures implémentées :</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ Chiffrage SSL/TLS en transit (HTTPS)</li>
              <li>✅ Hachage sécurisé des mots de passe (bcrypt)</li>
              <li>✅ Authentification (email + mot de passe)</li>
              <li>✅ Serveurs sécurisés (Europe, RGPD-compliant)</li>
              <li>✅ Audit sécurité réguliers</li>
              <li>✅ Modération IA des contenus (spam, scam)</li>
              <li>✅ Logs de sécurité (accès, modifications)</li>
            </ul>

            <p className="text-sm mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <strong>⚠️ Breach notification :</strong> En cas de fuite de données, nous notifierons CNIL & utilisateurs sous 72h per Art. 33 RGPD.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Contact CNIL & recours</h2>
          <div className="space-y-2 text-slate-300">
            <p>Pour toute réclamation relative à la protection de vos données :</p>
            <p className="font-semibold text-amber-200">Commission Nationale de l'Informatique et des Libertés (CNIL)</p>
            <p className="text-sm">3 Place de Fontenoy, 75007 Paris, France<br/>
            www.cnil.fr | Tel: 01 53 73 22 22</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Mise à jour de cette politique</h2>
          <p className="text-slate-300">
            Politique mise à jour : 2026-01-10. Vérifiez régulièrement pour changements majeurs (email de notification envoyé).
          </p>
        </section>
      </div>
    ),
    en: (
      <div className="space-y-8">
        <section id="intro">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Introduction</h2>
          <p className="text-slate-300">
            GRANDTAROT respects your privacy. This policy explains how we collect, use, and protect your personal data in compliance with GDPR (General Data Protection Regulation).
          </p>
        </section>

        <section id="responsable">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Data Controller</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-2">
            <p><strong>Name:</strong> Vivien LE MOAL</p>
            <p><strong>SIRET:</strong> 83512508900028</p>
            <p><strong>Email:</strong> {supportEmail}</p>
            <p className="text-sm text-slate-400 mt-2">We are responsible for all data processing via GRANDTAROT.</p>
          </div>
        </section>

        <section id="finalites">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Processing Purposes</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🔐 Authentication</h3>
              <p className="text-sm">Create and manage your account (login, password).</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💬 Messaging & Matching</h3>
              <p className="text-sm">Enable conversations, intentions, tarot matching.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💳 Payment & Billing</h3>
              <p className="text-sm">Process subscriptions via Stripe, manage invoices.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">🛡️ Security & Moderation</h3>
              <p className="text-sm">Detect fraud, scam, harassment. Block abuse.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Service Improvement</h3>
              <p className="text-sm">Analytics, statistics (anonymized), improve matching AI.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📧 Notifications</h3>
              <p className="text-sm">Confirmation emails, account recovery, updates.</p>
            </div>
          </div>
        </section>

        <section id="bases-legales">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Legal Basis (Art. 6 GDPR)</h2>
          <div className="space-y-3 text-slate-300">
            <div className="border-l-4 border-amber-500 pl-4 py-2">
              <p><strong>Contract (Art 6.1.b):</strong> Data necessary for service (email, profile, messages).</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p><strong>Legitimate Interest (Art 6.1.f):</strong> Security, moderation, fraud detection, service improvement.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p><strong>Consent (Art 6.1.a):</strong> Marketing emails, non-essential cookies. Unsubscribe anytime.</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <p><strong>Legal Obligation (Art 6.1.c):</strong> Accounting data, security logs.</p>
            </div>
          </div>
        </section>

        <section id="categories-donnees">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Data Categories Collected</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📝 Profile Data</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Email, first/last name, birth year, gender</li>
                <li>Location (city, search radius)</li>
                <li>Profile photo</li>
                <li>Interests, professional sector</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💬 Communication Data</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Messages, intentions (content encrypted)</li>
                <li>Metadata (timestamps, recipients)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">💳 Payment Data</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Billing information (processed by Stripe, PCI-DSS)</li>
                <li>Subscription history</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Technical Data</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>IP address (anonymized after 30d)</li>
                <li>User agent, error logs</li>
                <li>Cookies & analytics</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="destinataires">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Data Recipients</h2>
          <div className="space-y-3 text-slate-300">
            <p>Your data is only shared with:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Service Users:</strong> Profile visible per your settings, messages to recipient only.</li>
              <li><strong>Stripe (payments):</strong> Billing data. Legal: DPA, Privacy Shield.</li>
              <li><strong>Hosting Provider:</strong> Base44 / [to be specified]. Support & backup data.</li>
              <li><strong>Authorities:</strong> If legally required (police, CNIL, court).</li>
              <li><strong>Internal Moderators:</strong> For content security/moderation.</li>
            </ul>
          </div>
        </section>

        <section id="transferts">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">International Transfers</h2>
          <p className="text-slate-300">
            <strong>To be specified per providers:</strong> Depending on hosting and Stripe, some data may be transferred outside EU. We implement contractual clauses (Standard Contractual Clauses) to secure these transfers per GDPR.
          </p>
        </section>

        <section id="conservation">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Retention Period</h2>
          <div className="space-y-2 text-slate-300 text-sm">
            <p><strong>Active Account:</strong> Data retained while account is active.</p>
            <p><strong>Account Deleted:</strong> Immediate pseudonymization, permanent deletion after 30d (retroactive cleanup).</p>
            <p><strong>Messages:</strong> Retained 6 months after account deletion for legal archive.</p>
            <p><strong>Technical Logs:</strong> 30 days (except legal obligation, 3 years if fraud detected).</p>
            <p><strong>Accounting Data:</strong> 5 years (French legal requirement).</p>
          </div>
        </section>

        <section id="droits">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Your GDPR Rights</h2>
          <div className="space-y-3 text-slate-300">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">📋 Right of Access (Art. 15)</h3>
              <p className="text-sm">Request copy of your data. Response: 30 days.</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">✏️ Right to Rectification (Art. 16)</h3>
              <p className="text-sm">Correct/update your data (name, email, etc.).</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">🗑️ Right to Erasure (Art. 17)</h3>
              <p className="text-sm">Request deletion. Except if legally required to retain.</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">🔒 Right to Data Portability (Art. 20)</h3>
              <p className="text-sm">Export your data in standard format (CSV, JSON).</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200">📞 Right to Object (Art. 21)</h3>
              <p className="text-sm">Opt out of certain processing (marketing, analytics).</p>
            </div>

            <p className="text-sm font-semibold mt-4 text-slate-200">
              ⚙️ <strong>Requests:</strong> Contact {supportEmail} with ID proof. Free, 30-day response.
            </p>
          </div>
        </section>

        <section id="securite">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Security (Art. 32 GDPR)</h2>
          <div className="space-y-3 text-slate-300">
            <p><strong>Measures Implemented:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ SSL/TLS encryption in transit (HTTPS)</li>
              <li>✅ Secure password hashing (bcrypt)</li>
              <li>✅ Authentication (email + password)</li>
              <li>✅ Secure servers (Europe, GDPR-compliant)</li>
              <li>✅ Regular security audits</li>
              <li>✅ AI content moderation (spam, scam)</li>
              <li>✅ Security logs (access, changes)</li>
            </ul>

            <p className="text-sm mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <strong>⚠️ Breach Notification:</strong> In case of data breach, we will notify CNIL & users within 72h per Art. 33 GDPR.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">CNIL Contact & Recourse</h2>
          <div className="space-y-2 text-slate-300">
            <p>For any complaint regarding data protection:</p>
            <p className="font-semibold text-amber-200">Commission Nationale de l'Informatique et des Libertés (CNIL)</p>
            <p className="text-sm">3 Place de Fontenoy, 75007 Paris, France<br/>
            www.cnil.fr | Tel: 01 53 73 22 22</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Privacy Policy Updates</h2>
          <p className="text-slate-300">
            Policy updated: 2026-01-10. Check regularly for major changes (notification email sent).
          </p>
        </section>
      </div>
    )
  };

  return (
    <LegalPageLayout
      title_fr="Politique de Confidentialité"
      title_en="Privacy Policy"
      lastUpdated="2026-01-10"
      toc={toc}
    >
      {(lang) => content[lang]}
    </LegalPageLayout>
  );
}