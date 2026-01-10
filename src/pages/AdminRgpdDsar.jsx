import React from 'react';
import { FileCheck, Download, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminRgpdDsar() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = `PROCÉDURE - DROITS DES PERSONNES (DSAR)
Data Subject Access Request - GRANDTAROT - 2026

======================================
ARTICLE 15 RGPD: DROIT D'ACCÈS
======================================

1️⃣ DEMANDE ENTRANTE

Canal:
- Email: support@grandtarot.com
- Objet: "Demande d'accès - Art. 15 RGPD"
- Contient: Identité + pièce d'identité (scan)

2️⃣ VÉRIFICATION IDENTITÉ

Délai: 5 jours après réception

Processus:
a) Vérifier email == account email
   OU présenter document ID valide

b) Si email différent:
   - Demander pièce ID signée
   - Raison: Éviter partage données tiers

c) Si incertitude:
   - Demander documents supplémentaires
   - Délai additionnel: +15 jours max

3️⃣ PRÉPARATION EXPORT

Délai total: 14 jours calendaires (Art. 15 RGPD)

Inclure:
✅ Données AccountPrivate (plan, subscription)
✅ UserProfile (tous champs)
✅ Conversations (messages, métadonnées)
✅ Profil public (data partagées)
✅ Blocages/rapports (si créateur)
✅ Tickets support (résolus + en cours)
✅ Logs de connexion (30 derniers jours)

Format:
- JSON (machine-readable) + PDF human-readable
- Fichiers séparés par catégorie
- Archive ZIP chiffrée

4️⃣ LIVRAISON

Méthode:
- Email avec lien de téléchargement sécurisé
- Lien valide: 7 jours seulement
- Mot de passe: Envoyé séparément (SMS ou appel)

Message type:
"Nous confirmez la réception de votre demande d'accès
en vertu de l'article 15 RGPD. Trouvez ci-joint vos données
personnelles en format JSON + PDF.
Lien sécurisé valide 7 jours.
Fin de confidentialité: [date]"

5️⃣ DOCUMENTATION

Conserver:
- Demande originale (email)
- Pièce ID fournie (scan sécurisé)
- Date export + contenu inclus
- Lien envoyé, date expiration
- Confirmation livraison (si possible)
- Durée: 3 ans (preuves)

======================================
ARTICLE 16: DROIT DE RECTIFICATION
======================================

Demande:
- Email: support@grandtarot.com
- Objet: "Demande de rectification - Art. 16 RGPD"
- Inclure: Données incorrectes + données corrigées

Délai: 10 jours

Processus:
1. Vérifier identité (email == account)
2. Localiser données en question
3. Appliquer correction dans UserProfile/AccountPrivate
4. Confirmer correction par email + nouvelle valeur

Données rectifiables:
✅ display_name (correction typo)
✅ birth_year (mauvaise année)
✅ city/country (relocalisation)
✅ interests (correction erreur)
✅ bio/description
❌ Email (ne pas modifier, sauf par process séparé)
❌ Dates historiques (pas modifiables)

======================================
ARTICLE 17: DROIT À L'OUBLI
======================================

Demande:
- Email: support@grandtarot.com
- Objet: "Demande de suppression - Art. 17 RGPD"
- Raison: Optionnel mais utile

Délai: 30 jours

Processus:
1. Vérifier identité (ID si incertitude)
2. Vérifier raison suppression:
   a) Données plus nécessaires ✅
   b) Consentement retiré ✅
   c) Opposition exercée ✅
   d) Données traitées illégalement ✅
   e) Obligation légale (rarement) ✅

3. Appliquer soft-delete (jour 0)
4. Anonymiser progressivement (30 jours)
5. Supprimer définitivement (jour 30+)

Exception (conservation):
❌ Pas de suppression si:
- Obligation légale (comptables 10 ans)
- Preuves litige en cours
- Ordonnance judiciaire

6. Notification suppression
   Email: "Demande de suppression traitée.
   Vos données seront anonymisées dans 30 jours.
   Vous recevrez confirmation finale.
   (Sauf si obligation légale: comptables conservés 10 ans)"

Document: 3 ans (preuves audit)

======================================
ARTICLE 20: DROIT À LA PORTABILITÉ
======================================

Demande:
- Email: support@grandtarot.com
- Objet: "Demande de portabilité - Art. 20 RGPD"

Délai: 14 jours

Processus:
1. Vérifier identité
2. Exporter données dans format structuré (JSON)
3. Inclure:
   ✅ AccountPrivate (plan, subscription)
   ✅ UserProfile (profil complet)
   ✅ Messages (si applicable)
   ✅ Interactions (blocages, rapports créés)
   ✅ Préférences (langue, rayon, etc.)

4. Format: JSON (machine-readable, interopérable)
   ❌ PAS de PDF (pas machine-readable)
   ❌ PAS de formats propriétaires

5. Livraison: Email + lien sécurisé (7 jours)

Note légale:
"Cette exportation permettra portabilité vers autre
plateforme. Format: JSON standard.
Attention: Données liées (conversations) incluent
données du co-participant."

======================================
ARTICLE 21: DROIT D'OPPOSITION
======================================

Demande:
- Email: support@grandtarot.com
- Objet: "Demande d'opposition - Art. 21 RGPD"

Délai: 10 jours

Contextes:
1️⃣ Opposition marketing (cookies, newsletters)
   → Unsubscribe immédiat
   → Remover consentement: marketing_consent = false
   → Confirmation: Email

2️⃣ Opposition traitement (matching, analytics)
   → Plus complexe (service core)
   → Répondre: "Opposition reçue. Votre profil
      continuera matching car service core.
      Contactez DPO si vous souhaitez plus d'infos."
   → Documenter (preuves)

3️⃣ Opposition profiling (trust score, AI moderation)
   → Possible si non nécessaire au service
   → Si nécessaire: Droit limité (Art. 21.4 RGPD)
   → Notification: Support + DPO

======================================
MODÈLE EMAIL - RÉPONSE DSAR
======================================

SUJET: Réponse à votre demande d'accès (Art. 15 RGPD)

CORPS:

Bonjour [Prénom],

Nous confirmez la réception de votre demande d'accès
aux données personnelles en vertu de l'article 15 du RGPD.

DONNÉES INCLUSES:
✅ Identifiant compte (email)
✅ Profil utilisateur (nom, âge, localisation, intérêts)
✅ Historique plan (subscription_status, dates)
✅ Conversations (messages et métadonnées)
✅ Préférences (langue, rayon recherche)
✅ Logs de connexion (30 derniers jours)
✅ Rapports/blocages créés par vous

FORMAT:
- Fichier JSON (machine-readable)
- Fichier PDF (lisible)
- Archive ZIP chiffrée

ACCÈS:
Lien sécurisé: [URL de téléchargement]
Validité: 7 jours
Mot de passe: [Password envoyé séparément]

PROCHAINES ÉTAPES:
- Télécharger avant [date d'expiration]
- Vos droits (Art. 15-22 RGPD):
  • Rectification: Erreur dans données?
  • Suppression: Demander oubli
  • Portabilité: Exporter vers autre plateforme
  • Opposition: Refuser traitement

CONTACT:
Toute question: support@grandtarot.com
DPO: dpo@grandtarot.com
CNIL: https://www.cnil.fr/ (plainte possible)

Cordialement,
GRANDTAROT Support Team
support@grandtarot.com

---
Référence demande: [DSAR-2026-XXXXX]
Date réponse: [Date]

======================================
MODÈLE EMAIL - REFUS DSAR
======================================

SUJET: Demande d'accès - Vérification d'identité requise

CORPS:

Bonjour,

Nous avons reçu votre demande d'accès aux données
personnelles (Art. 15 RGPD). Avant traitement, nous devons
vérifier votre identité conformément à la loi.

DOCUMENTS REQUIS:
1. Pièce d'identité valide (scan recto-verso)
2. Signature document de demande formelle

PROCÉDURE:
- Scannez/photographiez pièce d'identité
- Imprimez cette lettre
- Signez et écrivez "J'ai pris connaissance de
  mes droits RGPD et confirme cette demande"
- Renvoyez par email: support@grandtarot.com

Objet email: "DSAR - Vérification identité"

Délai: 10 jours après réception documents

PROTECTION DONNÉES:
- Pièce ID supprimée après vérification
- Données d'identité non conservées
- Processus sécurisé (chiffrement TLS)

Questions? Écrivez: support@grandtarot.com

Cordialement,
GRANDTAROT Support Team

---
Référence: [DSAR-REQUEST-XXXXX]

======================================
PROCÉDURE INTERNE - CHECKLIST ADMIN
======================================

☐ Demande reçue par email
☐ Date réception notée
☐ Vérifier adresse email == account email
   [OUI → Avancer] [NON → Demander ID]
☐ Demander pièce ID (si besoin)
☐ ID reçue et vérifiée
☐ Supprimer pièce ID (après vérification)

Préparation export (14 jours max):
☐ Exporter AccountPrivate (JSON)
☐ Exporter UserProfile (JSON)
☐ Exporter Messages (JSON, anonymiser co-participant)
☐ Exporter ProfilePublic (JSON)
☐ Exporter Conversations (métadonnées)
☐ Exporter Logs (30 derniers jours)
☐ Exporter Tickets support (résolus/en cours)

Format et sécurité:
☐ Créer fichiers JSON (une catégorie par fichier)
☐ Créer PDF résumé (liste données)
☐ Créer archive ZIP chiffrée (mot de passe fort)
☐ Générer URL de téléchargement (7 jours validité)
☐ Générer mot de passe sécurisé
☐ Envoyer URL par email
☐ Envoyer mot de passe par SMS ou call (si possible)

Documentation:
☐ Sauvegarder demande originale
☐ Sauvegarder pièce ID (3 ans)
☐ Noter date export + contenu
☐ Noter lien/validité
☐ Notation: "DSAR-2026-XXXXX"
☐ Conserver dossier 3 ans

Post-envoi:
☐ Envoyer email confirmation
☐ Confirmer délai 14 jours respecté
☐ Documenter dans logs (immuables)
☐ Archiver dossier

======================================
STATISTIQUES & MONITORING
======================================

KPI à tracker:
- Nombre DSAR reçues/mois
- Délai moyen réponse (objectif: < 7 jours)
- Nombre rejets (identité non vérifiée)
- Nombre suppressions via Art. 17
- Nombre oppositions (Art. 21)

Rapport trimestriel:
- Inclure dans audit internal
- Présenter à DPO
- Communiquer CNIL si demande

======================================
CONTACT & ESCALADE
======================================

Première ligne: support@grandtarot.com
DPO/Escalade: dpo@grandtarot.com
CNIL: https://www.cnil.fr/

Plainte possible auprès CNIL si:
- Délai > 30 jours
- Refus injustifié
- Données insuffisantes
- Coût demandé (gratuit selon Art. 12 RGPD)

======================================

Document mis à jour: 2026-01-10
Prochaine révision: 2027-01-10
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RGPD-DSAR-Procedure-2026.txt';
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
              <Mail className="w-8 h-8 text-amber-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                Procédure DSAR
              </h1>
            </div>
            <p className="text-slate-400">Droits des personnes & demandes d'accès (Art. 15-22 RGPD)</p>
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
            {/* Article 15 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-6">📄 Article 15: Droit d'Accès</h2>
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">1️⃣ Demande entrante</p>
                  <p className="text-sm">Email: support@grandtarot.com avec objet "Demande d'accès - Art. 15 RGPD"</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">2️⃣ Vérification identité (5 jours)</p>
                  <p className="text-sm">Vérifier email == account OU demander pièce ID valide + scan signé</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">3️⃣ Préparation export (14 jours)</p>
                  <p className="text-sm">JSON + PDF (AccountPrivate, UserProfile, Messages, Logs, Support)</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">4️⃣ Livraison sécurisée</p>
                  <p className="text-sm">Email + lien chiffré (7 jours validité), mot de passe séparé</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-amber-200 mb-2">5️⃣ Documentation (3 ans)</p>
                  <p className="text-sm">Conserver demande, pièce ID, export date, lien, confirmation</p>
                </div>
              </div>
            </div>

            {/* Autres droits */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-6">⚖️ Autres Droits (Art. 16-21)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-amber-200 mb-2">📝 Art. 16: Rectification</p>
                  <p className="text-sm mb-2">Corriger données incorrectes</p>
                  <p className="text-xs text-slate-400">Délai: 10 jours<br/>Données: display_name, birth_year, city, interests, bio</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-amber-200 mb-2">❌ Art. 17: Oubli</p>
                  <p className="text-sm mb-2">Suppression compte (30 jours)</p>
                  <p className="text-xs text-slate-400">Délai: 30 jours<br/>Exception: Comptables 10 ans, litiges en cours</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-amber-200 mb-2">📦 Art. 20: Portabilité</p>
                  <p className="text-sm mb-2">Exporter JSON (transfert autre plateforme)</p>
                  <p className="text-xs text-slate-400">Délai: 14 jours<br/>Format: JSON machine-readable</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-amber-200 mb-2">🚫 Art. 21: Opposition</p>
                  <p className="text-sm mb-2">Refuser traitement (marketing, analytics)</p>
                  <p className="text-xs text-slate-400">Délai: 10 jours<br/>Processus: Documenter + escalader si core service</p>
                </div>
              </div>
            </div>

            {/* Modèle email */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-6">📧 Modèle Email - Réponse DSAR</h2>
              <div className="bg-slate-900/50 rounded-lg p-6 font-mono text-xs space-y-3 leading-relaxed overflow-x-auto">
                <p><strong>SUJET:</strong> Réponse à votre demande d'accès (Art. 15 RGPD)</p>
                <p className="border-t border-slate-700 pt-3 mt-3">
                  Bonjour [Prénom],<br/><br/>
                  Nous confirmez la réception de votre demande d'accès
                  aux données personnelles (Art. 15 RGPD).<br/><br/>

                  <strong>DONNÉES INCLUSES:</strong><br/>
                  ✅ Identifiant compte (email)<br/>
                  ✅ Profil utilisateur (nom, âge, localisation)<br/>
                  ✅ Historique plan (subscription)<br/>
                  ✅ Conversations et messages<br/>
                  ✅ Préférences (langue, rayon)<br/>
                  ✅ Logs de connexion (30 derniers jours)<br/><br/>

                  <strong>ACCÈS SÉCURISÉ:</strong><br/>
                  Lien: [URL] (valide 7 jours)<br/>
                  Mot de passe: [Envoyé séparément]<br/><br/>

                  <strong>VOS DROITS RGPD:</strong><br/>
                  📝 Rectification | ❌ Suppression | 📦 Portabilité | 🚫 Opposition<br/><br/>

                  Cordialement,<br/>
                  GRANDTAROT Support<br/>
                  support@grandtarot.com
                </p>
              </div>
            </div>

            {/* Checklist admin */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-amber-100 mb-6">✅ Checklist Admin DSAR</h2>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-amber-200">📥 Réception & Vérification</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                  <li>Demande reçue, date notée</li>
                  <li>Email == account email? [Oui → Avancer] [Non → Demander ID]</li>
                  <li>ID reçue, vérifiée, supprimée après check</li>
                </ul>

                <p className="font-semibold text-amber-200 mt-4">📦 Préparation Export</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                  <li>Exporter AccountPrivate (JSON)</li>
                  <li>Exporter UserProfile (JSON)</li>
                  <li>Exporter Messages/Conversations</li>
                  <li>Exporter Logs (30 derniers jours)</li>
                  <li>Créer PDF résumé lisible</li>
                </ul>

                <p className="font-semibold text-amber-200 mt-4">🔐 Sécurité & Livraison</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                  <li>Archive ZIP chiffrée (mot de passe fort)</li>
                  <li>Lien téléchargement (7 jours validité)</li>
                  <li>Mot de passe envoyé par SMS/call (séparé)</li>
                  <li>Email confirmation avec tous détails</li>
                </ul>

                <p className="font-semibold text-amber-200 mt-4">📋 Documentation</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                  <li>Dossier: demande + ID + export date + lien</li>
                  <li>Notation: "DSAR-2026-XXXXX"</li>
                  <li>Conservation: 3 ans (preuves)</li>
                  <li>Logs immuables: QUI, QUAND, POURQUOI</li>
                </ul>
              </div>
            </div>

            {/* Escalade */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-blue-200 mb-4">📞 Escalade & Contact</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Première ligne:</strong> support@grandtarot.com</p>
                <p><strong>DPO/Escalade:</strong> dpo@grandtarot.com</p>
                <p><strong>CNIL (plainte):</strong> https://www.cnil.fr/</p>
                <p className="text-amber-300 mt-4">⚠️ Les délais: Art. 15 = 30 jours, Art. 17 = 30 jours, Art. 20 = 14 jours (sauf complexe)</p>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400 text-center">
              Procédure mise à jour: 2026-01-10 | Prochaine révision: 2027-01-10
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}