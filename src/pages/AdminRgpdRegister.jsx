import React from 'react';
import { Shield, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminRgpdRegister() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = `REGISTRE DES TRAITEMENTS (Article 30 RGPD)
GRANDTAROT - 2026

ORGANISATION
- Responsable de traitement: GRANDTAROT SARL
- Adresse: [À COMPLÉTER]
- Responsable légal: [À COMPLÉTER]
- DPO (Délégué à la Protection des Données): support@grandtarot.com
- Date création registre: 2026-01-10

======================================

TRAITEMENT 1: GESTION COMPTES & AUTHENTIFICATION

Finalité:
- Permettre création/authentification utilisateurs
- Gestion souscription et plan actif
- Conformité légale (facturation, lutte fraude)

Base légale:
- Art. 6(1)(a) RGPD: Consentement explicite
- Art. 6(1)(b) RGPD: Exécution contrat (abonnement)
- Art. 6(1)(c) RGPD: Obligation légale (fiscale/comptable)

Catégories de données:
- Email (identifiant unique)
- Hash mot de passe (sécurisé, jamais en clair)
- Plan status (free/active)
- Subscription dates (start/end)
- Stripe customer ID (opacifié, jamais exposé)

Durée conservation:
- Compte actif: Tant que actif
- Après suppression: 30 jours avant anonymisation
- Données comptables: 10 ans (obligation fiscale)

Destinataires:
- Équipe admin interne
- Stripe (paiements, chiffré)
- Systèmes logs (audit)

Mesures sécurité:
- Chiffrement SSL/TLS en transit
- Hachage bcrypt pour mots de passe
- 2FA optionnel
- Audit logs (qui a accédé, quand)

Droits des personnes:
✅ Accès: Export JSON via /account/export
✅ Rectification: Paramètres utilisateur
✅ Suppression: "Delete Account" après 30j
✅ Portabilité: Download données JSON
✅ Opposition: Contact support
✅ Limitation: Ne pas applicable

Transferts tiers:
- 🇺🇸 Stripe: Données paiement chiffré (Privacy Shield OK)
- 🇪🇺 Serveurs EU: Données core (GDPR full)

======================================

TRAITEMENT 2: PROFILS UTILISATEUR & MATCHING

Finalité:
- Créer profils publics/privés
- Calcul affinités (matching algorithme)
- Personalization (suggestions)

Base légale:
- Art. 6(1)(a) RGPD: Consentement
- Art. 6(1)(b) RGPD: Exécution service

Catégories de données:
- Nom d'affichage (pseudonyme OK)
- Photo (vérifiée, non ID)
- Année naissance (calcul âge minimum 18)
- Genre/orientation
- Localisation (ville, coordonnées GPS si radius)
- Intérêts (tags)
- Bio/description
- Secteur professionnel (mode pro)
- Préférences (recherche rayon km)
- Scores confiance/affinité (calculés)

Durée conservation:
- Profil actif: Tant que utilisateur
- Après suppression: 30 jours avant suppression totale
- Données matching: Conservé 6 mois (analytics)

Destinataires:
- Profils publics: Visible autres utilisateurs (API)
- Admin: Accès modération
- Matching engine (interne)
- Analytics (anonymisé)

Mesures sécurité:
- Photos vérifiées par admin
- Trust score automatique (détecte bots/fakes)
- Modération IA messages
- Blocage utilisateur = masquage réciproque

Transferts tiers:
- 🇪🇺 Stockage EU uniquement

======================================

TRAITEMENT 3: MESSAGERIE & CONVERSATIONS

Finalité:
- Permettre communication sécurisée
- Modération (lutte harcèlement/escroquerie)
- Archivage (preuves litiges)

Base légale:
- Art. 6(1)(a) RGPD: Consentement
- Art. 6(1)(b) RGPD: Exécution service
- Art. 6(1)(f) RGPD: Intérêt légitime (sécurité)

Catégories de données:
- Contenu messages (texte brut, chiffré en transit)
- Métadonnées (sender/recipient, timestamps)
- Flags modération (scam, harcèlement, inappropriate)
- Lien conversation

Durée conservation:
- Messages actifs: Tant que conversation active
- Après blocage/suppression: 6 mois archive (preuves)
- Purge: Suppression définitive après 6 mois

Destinataires:
- Utilisateurs concernés (sender/recipient)
- Admin (modération)
- Moderation team (review)

Mesures sécurité:
- ✅ Chiffrement TLS transit
- ✅ Modération IA (détecte patterns malveillants)
- ✅ Logs d'accès admin
- ✅ 2 personnes pour unblock après ban

Transferts tiers:
- 🇪🇺 Stockage EU uniquement
- API LLM (anonymisé pour moderation)

======================================

TRAITEMENT 4: BLOCAGE & SIGNALEMENTS

Finalité:
- Sécurité communauté
- Prévention harcèlement/escroquerie
- Audit conformité

Base légale:
- Art. 6(1)(f) RGPD: Intérêt légitime (sécurité)
- Art. 6(1)(c): Obligation légale (lutte fraude)

Catégories de données:
- ID blocker/blocked (ProfilePublic.public_id)
- Raison blocage
- Date création
- Admin notes (interne)
- Reports liés

Durée conservation:
- Blocage permanent: Tant que actif
- Blocage temporaire: Selon durée spécifiée
- Archive: 3 ans (audit)

Destinataires:
- Admin/moderation team

Mesures sécurité:
- ✅ Masquage réciproque immédiat
- ✅ Logs admin complets
- ✅ Procédure appel (contact support)

======================================

TRAITEMENT 5: FACTURATION & PAIEMENTS

Finalité:
- Gestion souscriptions (paiement, renouvellement)
- Comptabilité (obligation légale)
- Lutte fraude

Base légale:
- Art. 6(1)(b) RGPD: Exécution contrat
- Art. 6(1)(c) RGPD: Obligation légale (comptabilité)

Catégories de données:
- Email, prénom, nom (si fourni)
- Montant, date paiement
- Plan acheté
- Stripe payment intent ID (chiffré)
- Factures électroniques

Durée conservation:
- Données comptables: 10 ans (fiscalité)
- Après fin contrat: 10 ans (archives)

Destinataires:
- Stripe (paiement)
- Comptable/expert-comptable (preuves)
- Autorités fiscales (si demande légale)

Mesures sécurité:
- ✅ PCI-DSS via Stripe (jamais données brutes)
- ✅ Chiffrement données sensibles
- ✅ Factures horodatées

Transferts tiers:
- 🇺🇸 Stripe: Standard contractuels OK

======================================

TRAITEMENT 6: SUPPORT CLIENT & ASSISTANCE

Finalité:
- Répondre demandes utilisateurs
- Résoudre problèmes techniques/billing
- Amélioration service

Base légale:
- Art. 6(1)(a) RGPD: Consentement (contact volontaire)
- Art. 6(1)(b) RGPD: Exécution service

Catégories de données:
- Email utilisateur
- Contenu demande support
- Screenshots/preuves fournies
- Historique conversations
- Notes internes (diagnostic)

Durée conservation:
- Dossier résolu: 3 ans (historique)
- Après suppression compte: 6 mois

Destinataires:
- Support team
- Admin (escalade)

Mesures sécurité:
- ✅ Ticket system sécurisé
- ✅ Accès restreint à assigned users
- ✅ Données sensibles masquées en présentation

======================================

TRAITEMENT 7: AUDIT LOGS & SÉCURITÉ

Finalité:
- Traçabilité actions admin
- Détection anomalies/intrusions
- Conformité audit externe

Base légale:
- Art. 6(1)(f) RGPD: Intérêt légitime (sécurité)
- Art. 6(1)(c): Obligation légale

Catégories de données:
- Admin ID, email, rôle
- Action effectuée (login, update, delete)
- Entity modifiée, valeurs avant/après
- Timestamp, IP address
- User agent

Durée conservation:
- Logs actifs: 30 jours
- Archive: 1 an (conformité)
- Purge: Suppression après 1 an

Destinataires:
- Admin team (monitoring)
- Autorités (si demande légale)

Mesures sécurité:
- ✅ Logs immuables (append-only)
- ✅ Chiffrement en repos
- ✅ Accès restreint admin

======================================

TRANSFERTS INTERNATIONAUX

Tiers non-EU:
1. Stripe (USA) → Privacy Shield + contrats standard
2. Google Analytics (USA) → Anonymisation IP
3. Hotjar (USA) → Analytics, consentement explicite

Tous les transferts incluent:
- ✅ Contrats de traitement de données (DPA)
- ✅ Clauses de sécurité renforcées
- ✅ Droit de retrait consentement

======================================

DROIT DES PERSONNES

Procédures:
- Accès: support@grandtarot.com (14 jours réponse)
- Rectification: Paramètres utilisateur (immédiat)
- Suppression: "Delete account" (30j traitement)
- Portabilité: Export JSON (7 jours)
- Opposition: Contact support (14 jours)

CNIL contact: https://www.cnil.fr/

======================================

DOCUMENT SIGNÉ
Responsable: [Nom]
Date: 2026-01-10
Révision annuelle: Obligatoire

Audit externe: Annuel (recommandé)
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RGPD-Register-Art30-2026.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-amber-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                Registre Art. 30 RGPD
              </h1>
            </div>
            <p className="text-slate-400">Registre des traitements de données personnelles (conformité CNIL)</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Télécharger TXT
            </Button>
          </div>

          {/* Content */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-amber-100 mb-4">📋 REGISTRE DES TRAITEMENTS</h2>
              <p className="mb-4">
                <strong>Organisation:</strong> GRANDTAROT SARL<br/>
                <strong>DPO:</strong> support@grandtarot.com<br/>
                <strong>Date création registre:</strong> 2026-01-10<br/>
                <strong>Dernière révision:</strong> 2026-01-10
              </p>
            </section>

            {/* Traitement 1 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">🔐 TRAITEMENT 1: Gestion Comptes & Authentification</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Création/authentification utilisateurs, gestion plans</p>
                <p><strong>Base légale:</strong> Art. 6(1)(a)-(c) RGPD (consentement + contrat + obligation légale)</p>
                <p><strong>Données:</strong> Email, hash mot de passe, plan_status, subscription_dates, stripe_customer_id</p>
                <p><strong>Conservation:</strong> Compte actif = actif; après suppression = 30j avant anonymisation; comptables = 10 ans</p>
                <p><strong>Destinataires:</strong> Équipe admin, Stripe (paiements), logs audit</p>
                <p><strong>Sécurité:</strong> SSL/TLS, bcrypt, 2FA optionnel, audit logs</p>
              </div>
            </section>

            {/* Traitement 2 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">👤 TRAITEMENT 2: Profils Utilisateur & Matching</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Profils publics, calcul affinités, matching</p>
                <p><strong>Base légale:</strong> Art. 6(1)(a)-(b) RGPD</p>
                <p><strong>Données:</strong> Nom d'affichage, photo, année naissance, genre, localisation, intérêts, bio, score_confiance</p>
                <p><strong>Conservation:</strong> Profil actif = actif; après suppression = 30j; matching analytics = 6 mois</p>
                <p><strong>Destinataires:</strong> Utilisateurs (profils publics), admin, matching engine, analytics</p>
                <p><strong>Sécurité:</strong> Photos vérifiées, trust score auto, modération IA, blocage réciproque</p>
              </div>
            </section>

            {/* Traitement 3 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">💬 TRAITEMENT 3: Messagerie & Conversations</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Communication sécurisée, modération, archivage preuves</p>
                <p><strong>Base légale:</strong> Art. 6(1)(a)-(b)-(f) RGPD (consentement + contrat + intérêt légitime sécurité)</p>
                <p><strong>Données:</strong> Contenu messages, métadonnées (sender/recipient, timestamps), flags modération</p>
                <p><strong>Conservation:</strong> Messages actifs = actifs; blocage/suppression = 6 mois archive; purge = suppression définitive</p>
                <p><strong>Destinataires:</strong> Utilisateurs, admin/moderation, logs</p>
                <p><strong>Sécurité:</strong> TLS, modération IA, logs accès, 2 personnes pour unblock</p>
              </div>
            </section>

            {/* Traitement 4 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">🚫 TRAITEMENT 4: Blocage & Signalements</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Sécurité communauté, prévention harcèlement</p>
                <p><strong>Base légale:</strong> Art. 6(1)(f)-(c) RGPD (intérêt légitime + obligation légale)</p>
                <p><strong>Données:</strong> ID blocker/blocked, raison, admin notes</p>
                <p><strong>Conservation:</strong> Permanent ou selon durée; archive 3 ans</p>
                <p><strong>Destinataires:</strong> Admin/moderation team</p>
                <p><strong>Sécurité:</strong> Masquage réciproque immédiat, logs admin, procédure appel</p>
              </div>
            </section>

            {/* Traitement 5 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">💳 TRAITEMENT 5: Facturation & Paiements</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Gestion abonnements, comptabilité, lutte fraude</p>
                <p><strong>Base légale:</strong> Art. 6(1)(b)-(c) RGPD (contrat + obligation légale)</p>
                <p><strong>Données:</strong> Email, nom, montant, date, plan, Stripe intent ID</p>
                <p><strong>Conservation:</strong> Comptables 10 ans (fiscalité)</p>
                <p><strong>Destinataires:</strong> Stripe, comptable, autorités fiscales (si demande)</p>
                <p><strong>Sécurité:</strong> PCI-DSS via Stripe, chiffrement, factures horodatées</p>
              </div>
            </section>

            {/* Traitement 6 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">🆘 TRAITEMENT 6: Support Client & Assistance</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Répondre demandes, résoudre problèmes</p>
                <p><strong>Base légale:</strong> Art. 6(1)(a)-(b) RGPD</p>
                <p><strong>Données:</strong> Email, contenu demande, screenshots, notes internes</p>
                <p><strong>Conservation:</strong> 3 ans (historique); après suppression compte = 6 mois</p>
                <p><strong>Destinataires:</strong> Support team, admin</p>
                <p><strong>Sécurité:</strong> Ticket system sécurisé, accès restreint, masquage données sensibles</p>
              </div>
            </section>

            {/* Traitement 7 */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">📊 TRAITEMENT 7: Audit Logs & Sécurité</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Finalité:</strong> Traçabilité actions, détection anomalies</p>
                <p><strong>Base légale:</strong> Art. 6(1)(f)-(c) RGPD</p>
                <p><strong>Données:</strong> Admin ID, action, entity, timestamp, IP, user agent</p>
                <p><strong>Conservation:</strong> Logs actifs = 30j; archive = 1 an; purge = suppression</p>
                <p><strong>Destinataires:</strong> Admin team, autorités (si demande légale)</p>
                <p><strong>Sécurité:</strong> Logs immuables (append-only), chiffrement, accès restreint</p>
              </div>
            </section>

            {/* Transferts internationaux */}
            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-200 mb-3">🌍 Transferts Internationaux</h3>
              <div className="space-y-3 text-sm">
                <p><strong>Stripe (USA):</strong> Privacy Shield + DPA + contrats standards</p>
                <p><strong>Google Analytics (USA):</strong> Anonymisation IP + consentement</p>
                <p><strong>Hotjar (USA):</strong> Analytics, consentement explicite</p>
                <p>Tous les transferts incluent DPA, clauses sécurité renforcées, droit de retrait.</p>
              </div>
            </section>

            {/* Droits des personnes */}
            <section className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-200 mb-3">✅ Droits des Personnes Concernées</h3>
              <div className="space-y-2 text-sm">
                <p>🔍 <strong>Accès:</strong> support@grandtarot.com (14 jours réponse)</p>
                <p>✏️ <strong>Rectification:</strong> Paramètres utilisateur (immédiat)</p>
                <p>❌ <strong>Suppression:</strong> "Delete account" (30 jours traitement)</p>
                <p>📦 <strong>Portabilité:</strong> Export JSON (7 jours)</p>
                <p>🚫 <strong>Opposition:</strong> Contact support (14 jours)</p>
                <p className="mt-4 text-amber-300"><strong>CNIL:</strong> https://www.cnil.fr/</p>
              </div>
            </section>

            <section className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-xs">
              <p className="text-slate-400">
                <strong>Document à jour:</strong> 2026-01-10<br/>
                <strong>Révision annuelle:</strong> Obligatoire<br/>
                <strong>Audit externe:</strong> Recommandé annuellement
              </p>
            </section>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}