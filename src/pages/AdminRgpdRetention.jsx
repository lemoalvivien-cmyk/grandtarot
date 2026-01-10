import React from 'react';
import { Trash2, Download, Printer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminRgpdRetention() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = `POLITIQUE DE CONSERVATION DES DONNÉES
GRANDTAROT - 2026

PRINCIPES GÉNÉRAUX

1. Minimisation: Garder uniquement données nécessaires
2. Limitation: Durées claires définies par finalité
3. Purge: Suppression/anonymisation automatique à échéance
4. Audit: Traçabilité des purges

======================================

RÈGLES PAR CATÉGORIE

1️⃣ COMPTES UTILISATEUR (AccountPrivate)

Données conservées:
- user_email (identifiant)
- plan_status, plan_activated_at
- subscription dates
- cooldown_until, intentions_sent_today
- is_banned, ban_reason, ban_until
- language_pref, radius_km
- consent fields (age_confirmed_at, etc.)

Durée conservation:
┌─────────────────────────────────────┐
│ Compte ACTIF                       │
│ Conservation: Tant que nécessaire   │
│ Suppression: À demande utilisateur  │
│                                     │
│ Compte SUPPRIMÉ                    │
│ Phase 1 (0-30j): Données brutes    │
│ Phase 2 (30-90j): Anonymisation    │
│ Phase 3 (90j+): Suppression totale │
│                                     │
│ Données COMPTABLES (10 ans)        │
│ stripe_customer_id, subscription   │
│ Raison: Obligation fiscale (code   │
│ monétaire et financier L. 123-22)  │
└─────────────────────────────────────┘

Anonymisation (phase 2):
- ❌ AVANT: user_email, plan_status, stripe_id
- ✅ APRÈS: "anonymized_[hash]", "deleted", null

Procédure de suppression:
1. User click "Delete Account" → soft-delete
2. 24h délai rétraction (email confirmation)
3. 30j anonymisation progressive
4. 60j suppression définitive (sauf comptables)
5. Logs: Audit trail complète

======================================

2️⃣ PROFILS UTILISATEUR (UserProfile)

Données conservées:
- user_id (email)
- display_name, birth_year, gender
- city, country, geo_zone
- interests, mode_active, language_pref
- photo_url, trust_score, verified_status
- subscription fields (legacy)
- profile_completion, last_active

Durée conservation:
┌─────────────────────────────────────┐
│ Profil ACTIF                       │
│ Conservation: Tant que actif        │
│ Suppression: À demande user         │
│                                     │
│ Profil SUPPRIMÉ                    │
│ Phase 1 (0-30j): Données brutes    │
│ Phase 2 (30-90j): Anonymisation    │
│ Phase 3 (90j+): Suppression         │
│                                     │
│ Photos supprimées IMMÉDIAT         │
│ (jamais conservées 30j)            │
│ Justification: RGPD Art. 17        │
│ (droit à l'oubli)                  │
└─────────────────────────────────────┘

Anonymisation:
- ❌ AVANT: display_name, birth_year, location
- ✅ APRÈS: "Utilisateur[hash]", null, null
- ❌ photo_url → Supprimée immédiatement

======================================

3️⃣ MESSAGES & CONVERSATIONS

Messages:
┌─────────────────────────────────────┐
│ Message ACTIF                       │
│ Conservation: Tant que conversation │
│ Suppression: Utilisateur peut       │
│ demander (Admin: soft-delete)       │
│                                     │
│ Conversation BLOQUÉE/ARCHIVÉE      │
│ Phase 1 (0-6 mois): Archive        │
│   - Raison: Preuves litiges        │
│   - Accès: Admin seulement         │
│                                     │
│ Phase 2 (6-12 mois): Anonymisation │
│   - body → "[Message supprimé]"    │
│   - from_user_id → null            │
│   - to_user_id → null              │
│                                     │
│ Phase 3 (12 mois+): Suppression    │
│   - Suppression définitive         │
│   - Logs conservés (flagged)       │
└─────────────────────────────────────┘

Détails:
- Soft-delete: is_deleted = true (pas physique)
- Hard-delete: Après 12 mois
- Flagged messages: Archive 18 mois minimum
- Scam/harassment: Archive 24 mois (preuves)

======================================

4️⃣ BLOCAGE & SIGNALEMENTS

Blocks:
┌─────────────────────────────────────┐
│ Bloc ACTIF                         │
│ Conservation: Permanent (ou durée   │
│ spécifiée si temporaire)           │
│                                     │
│ Bloc LEVÉ (user demande + admin)   │
│ Archive: 3 ans (audit)             │
│ Suppression: Après 3 ans           │
└─────────────────────────────────────┘

Reports:
┌─────────────────────────────────────┐
│ Report EN ATTENTE                  │
│ Conservation: Jusqu'à résolution    │
│ Durée max: 30 jours                │
│                                     │
│ Report RÉSOLU                      │
│ Archive: 2 ans (preuves)           │
│ Suppression: Après 2 ans           │
│                                     │
│ Report CLASSÉ SANS SUITE           │
│ Archive: 1 an                      │
│ Suppression: Après 1 an            │
└─────────────────────────────────────┘

======================================

5️⃣ DONNÉES COMPTABLES & FACTURES

Stripe:
- stripe_customer_id: 10 ans
- stripe_subscription_id: 10 ans
- Montants de paiement: 10 ans
- Dates transactions: 10 ans
- Justification: Code monétaire L. 123-22

Factures:
- Archivage: 10 ans (obligatoire)
- Format: PDF horodaté + signature numérique
- Accès: Autorités fiscales sur demande

BillingRequest:
- Conservation: 3 ans (preuves)
- Anonymisation: Après résolution
- Suppression: Après 3 ans

======================================

6️⃣ AUDIT LOGS & SÉCURITÉ

AuditLog:
┌─────────────────────────────────────┐
│ Logs ACTIFS                        │
│ Rétention: 30 jours                │
│ Raison: Monitoring sécurité temps  │
│ réel, détection intrusion          │
│                                     │
│ Logs ARCHIVE                       │
│ Rétention: 1 an (après 30j)        │
│ Raison: Conformité audit,          │
│ preuves incidents                  │
│                                     │
│ Logs SUPPRIMÉS                     │
│ Après 1 an: Purge définitive       │
│ Sauf incidents graves (2 ans)      │
└─────────────────────────────────────┘

Données sensibles dans logs:
- ❌ Mots de passe (jamais loggés)
- ❌ Tokens de session (anonymisés)
- ❌ Details carte crédit (jamais)
- ✅ IP addresses (anonymisées après 30j)
- ✅ Emails (loggés, anonymisés après 1 an)

======================================

7️⃣ SUPPORT TICKETS

SupportTicket/BillingRequest:
┌─────────────────────────────────────┐
│ Ticket OUVERT                      │
│ Conservation: Jusqu'à fermeture     │
│                                     │
│ Ticket RÉSOLU                      │
│ Archive: 3 ans (historique)        │
│ Raison: Preuves, résolution        │
│ litiges potentiels                 │
│                                     │
│ Suppression: Après 3 ans           │
└─────────────────────────────────────┘

Données sensibles:
- Anonymisation des données utilisateur
- Suppression emails personnelles
- Conservation contenu résolution technique

======================================

8️⃣ ANALYTICS & MATCHING

DailyMatch:
- Conservation: 6 mois (analytics)
- Anonymisation: Après 6 mois
- Suppression: Après 12 mois

Affinity/DailyReading:
- Conservation: 2 ans (historique user)
- Anonymisation: Après suppression account
- Données analytics: 6 mois

======================================

PROCÉDURE AUTOMATISÉE DE PURGE

Chaque nuit (UTC 02:00):
1. Identifier données expirées (scheduled job)
2. Anonymiser si nécessaire
3. Supprimer définitivement
4. Logguer la purge (pour audit)

Frequency:
- ✅ Daily: Messages supprimés (6 mois)
- ✅ Weekly: Profils anonymisés (90 jours)
- ✅ Monthly: Logs archivés/supprimés
- ✅ Quarterly: Audit complet rétention

Monitoring:
- Dashboard admin: Nombre records supprimés
- Alerts: Si purge échoue
- Audit trail: Quelle donnée, quand, pourquoi

======================================

EXCEPTIONS & CAS PARTICULIERS

Obligation légale (comptables):
✅ 10 ans: Données fiscales (L. 123-22)
✅ 6 ans: Données bancaires (Banque France)
✅ 3 ans: Preuves litiges contractuels

Ordonnance judiciaire:
✅ Conservation prolongée si demande légale
✅ Notification user (sauf obstacle légal)
✅ Purge après fin obligation

Droits des personnes:
✅ Suppression précoce: À demande user (sauf obligations légales)
✅ Pas de purge: Si demande accès en cours
✅ Notification: User averti avant anonymisation

======================================

SÉCURITÉ PENDANT CONSERVATION

Mesures:
- Chiffrement au repos (données sensibles)
- Contrôle accès: Admin seulement
- Logs immuables: Qui a accédé quand
- Backups: Chiffrés, rétention = données
- Purge sécurisée: Overwrite (3 passes) ou shred

Purge définitive:
- DELETE hard (physical removal)
- Overwrite 3 passes: [0x00, 0xFF, random]
- Vérification: SELECT count = 0

======================================

RÉVISION & AUDIT

Audit annuel:
- Vérification durées rétention
- Test procédures purge
- Nombre données supprimées/anonymisées
- Incidents rétention (oublis, bugs)

Documentation:
- Conservée 5 ans (preuves audit)
- Logs purges immuables
- Certificats destruction si externe

======================================

CONTACT & QUESTIONS

DPO: support@grandtarot.com
Sujet: "RGPD - Rétention données"

CNIL: https://www.cnil.fr/

Document mis à jour: 2026-01-10
Prochaine révision: 2027-01-10
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RGPD-Retention-Policy-2026.txt';
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
              <Clock className="w-8 h-8 text-amber-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                Politique de Conservation
              </h1>
            </div>
            <p className="text-slate-400">Règles de rétention et purge des données (RGPD Art. 5)</p>
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
          <div className="space-y-8 text-slate-300">
            {/* Tableau global */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-6">📊 TABLEAU RÉCAPITULATIF</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-700">
                      <th className="border border-slate-700 p-3 text-left text-amber-200">Données</th>
                      <th className="border border-slate-700 p-3 text-left text-amber-200">Actif</th>
                      <th className="border border-slate-700 p-3 text-left text-amber-200">Supprimé</th>
                      <th className="border border-slate-700 p-3 text-left text-amber-200">Purge Complète</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700 hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Compte</strong></td>
                      <td className="border border-slate-700 p-3">Illimité</td>
                      <td className="border border-slate-700 p-3">30 jours</td>
                      <td className="border border-slate-700 p-3">90 jours</td>
                    </tr>
                    <tr className="border-b border-slate-700 hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Profil</strong></td>
                      <td className="border border-slate-700 p-3">Illimité</td>
                      <td className="border border-slate-700 p-3">30 jours</td>
                      <td className="border border-slate-700 p-3">90 jours</td>
                    </tr>
                    <tr className="border-b border-slate-700 hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Messages</strong></td>
                      <td className="border border-slate-700 p-3">Illimité</td>
                      <td className="border border-slate-700 p-3">6 mois</td>
                      <td className="border border-slate-700 p-3">12 mois</td>
                    </tr>
                    <tr className="border-b border-slate-700 hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Blocage</strong></td>
                      <td className="border border-slate-700 p-3">Permanent</td>
                      <td className="border border-slate-700 p-3">Archive 3 ans</td>
                      <td className="border border-slate-700 p-3">3 ans</td>
                    </tr>
                    <tr className="border-b border-slate-700 hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Comptables</strong></td>
                      <td className="border border-slate-700 p-3">10 ans</td>
                      <td className="border border-slate-700 p-3">10 ans</td>
                      <td className="border border-slate-700 p-3">10 ans</td>
                    </tr>
                    <tr className="border-b border-slate-700 hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Audit logs</strong></td>
                      <td className="border border-slate-700 p-3">30 jours</td>
                      <td className="border border-slate-700 p-3">1 an archive</td>
                      <td className="border border-slate-700 p-3">1 an</td>
                    </tr>
                    <tr className="hover:bg-slate-900/30">
                      <td className="border border-slate-700 p-3"><strong>Support tickets</strong></td>
                      <td className="border border-slate-700 p-3">Illimité</td>
                      <td className="border border-slate-700 p-3">3 ans</td>
                      <td className="border border-slate-700 p-3">3 ans</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Principes généraux */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-4">🎯 Principes Généraux</h2>
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">1️⃣ Minimisation</p>
                  <p className="text-sm">Garder uniquement données nécessaires à la finalité</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">2️⃣ Limitation</p>
                  <p className="text-sm">Durées claires définies par finalité (pas indéfini)</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">3️⃣ Purge</p>
                  <p className="text-sm">Suppression/anonymisation automatique à échéance</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">4️⃣ Audit</p>
                  <p className="text-sm">Traçabilité complète des suppressions (logs immuables)</p>
                </div>
              </div>
            </div>

            {/* Processus de suppression */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-4">🔄 Processus de Suppression Compte</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4">
                  <span className="font-bold text-amber-200 flex-shrink-0">1.</span>
                  <span><strong>User click "Delete Account"</strong> → Soft-delete (flag is_deleted = true)</span>
                </div>
                <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4">
                  <span className="font-bold text-amber-200 flex-shrink-0">2.</span>
                  <span><strong>24h délai rétraction</strong> → Email confirmation avec lien "undo"</span>
                </div>
                <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4">
                  <span className="font-bold text-amber-200 flex-shrink-0">3.</span>
                  <span><strong>30 jours anonymisation</strong> → display_name, email → anonymisé, photo supprimée</span>
                </div>
                <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4">
                  <span className="font-bold text-amber-200 flex-shrink-0">4.</span>
                  <span><strong>60 jours suppression</strong> → DELETE hard (sauf données comptables 10 ans)</span>
                </div>
                <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4">
                  <span className="font-bold text-amber-200 flex-shrink-0">5.</span>
                  <span><strong>Audit trail complète</strong> → Logs immuables: QUI, QUAND, POURQUOI</span>
                </div>
              </div>
            </div>

            {/* Obligations légales */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-green-200 mb-4">⚖️ Obligations Légales (Exceptions)</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Comptabilité:</strong> 10 ans (Code monétaire et financier L. 123-22)</p>
                <p><strong>Données bancaires:</strong> 6 ans (Réglementation Banque France)</p>
                <p><strong>Preuves litiges:</strong> 3 ans (Code civil, délais contractuels)</p>
                <p><strong>Ordonnance judiciaire:</strong> Conservation prolongée si demande légale</p>
                <p className="text-amber-300">⚠️ PAS de suppression = Obligation légale établie</p>
              </div>
            </div>

            {/* Sécurité purge */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-4">🔐 Sécurité Pendant Purge</h2>
              <div className="space-y-2 text-sm">
                <p>✅ Chiffrement au repos (données sensibles)</p>
                <p>✅ Contrôle accès: Admin seulement</p>
                <p>✅ Logs immuables: Audit trail complet</p>
                <p>✅ Backups: Chiffrés, rétention = données originales</p>
                <p>✅ Purge sécurisée: Overwrite 3 passes (0x00, 0xFF, random)</p>
                <p>✅ Vérification: SELECT count = 0 après suppression</p>
              </div>
            </div>

            {/* Job automatisé */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-4">🤖 Job Automatisé Nightly</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Heure:</strong> Chaque nuit UTC 02:00</p>
                <p><strong>Tâches:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Daily: Messages supprimés (6 mois)</li>
                  <li>Weekly: Profils anonymisés (90 jours)</li>
                  <li>Monthly: Logs archivés/supprimés</li>
                  <li>Quarterly: Audit complet rétention</li>
                </ul>
                <p className="mt-3"><strong>Monitoring:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Dashboard admin: Nombre records supprimés</li>
                  <li>Alerts: Si purge échoue</li>
                  <li>Audit trail: Logs immuables de chaque purge</li>
                </ul>
              </div>
            </div>

            {/* Audit annuel */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-blue-200 mb-4">📋 Audit Annuel</h2>
              <div className="space-y-2 text-sm">
                <p>✅ Vérification durées rétention (conformité registre Art.30)</p>
                <p>✅ Test procédures purge (fonctionnalité)</p>
                <p>✅ Nombre données supprimées/anonymisées (volume)</p>
                <p>✅ Incidents rétention (oublis, bugs détectés)</p>
                <p>✅ Documentation conservée 5 ans (preuves audit)</p>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400 text-center">
              Politique mise à jour: 2026-01-10 | Prochaine révision: 2027-01-10
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}