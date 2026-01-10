import React from 'react';
import { AlertTriangle, Lock, Server, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSecurityWarning() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Critical Warning */}
          <div className="mb-8 bg-red-900/30 border-2 border-red-500/50 rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-12 h-12 text-red-400 flex-shrink-0" />
              <div>
                <h1 className="text-3xl font-bold text-red-300 mb-2">
                  🔴 CRITICAL: Message.create = ADMIN-ONLY
                </h1>
                <p className="text-lg text-red-200">
                  La fonctionnalité de chat est actuellement BLOQUÉE pour les utilisateurs normaux.
                </p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Pourquoi ce blocage ?
            </h2>
            <div className="space-y-3 text-slate-300">
              <p>
                <span className="font-semibold text-amber-200">Sécurité NO MERCY appliquée:</span> Pour empêcher 
                100% des attaques par injection/spoof de participants, nous avons mis Message.create en admin-only.
              </p>
              <p>
                <span className="font-semibold text-red-300">Problème:</span> Sans backend functions activées, 
                il n'existe AUCUN moyen de créer un "workflow serveur privilégié" qui pourrait créer des messages 
                au nom des users en mode sécurisé.
              </p>
              <p>
                <span className="font-semibold text-blue-300">Résultat:</span> Les users ne peuvent plus 
                appeler <code className="bg-slate-900 px-2 py-1 rounded">base44.entities.Message.create()</code> 
                (403 garanti), et le workflow UI <code className="bg-slate-900 px-2 py-1 rounded">sendMessageSecure()</code> 
                échoue également (car il appelle .create() en tant qu'user normal).
              </p>
            </div>
          </div>

          {/* Solution */}
          <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Solution: Activer Backend Functions
            </h2>
            <div className="space-y-4">
              <p className="text-slate-300">
                Pour débloquer le chat de manière 100% sécurisée, vous devez:
              </p>
              
              <ol className="list-decimal list-inside space-y-3 text-slate-300 ml-4">
                <li>
                  <span className="font-semibold text-green-200">Activer Backend Functions</span> dans 
                  Dashboard → Settings → Enable Backend Functions
                </li>
                <li>
                  <span className="font-semibold text-green-200">Créer une Cloud Function</span> 
                  <code className="bg-slate-900 px-2 py-1 rounded ml-2">functions/sendMessage.js</code>
                  qui tourne en mode <code className="bg-slate-900 px-2 py-1 rounded">serviceRole</code> (admin):
                  <pre className="bg-slate-900 p-4 rounded-lg mt-2 text-xs overflow-x-auto">
{`export default async function sendMessage(req, context) {
  const { conversationId, body } = req.body;
  const userId = context.user.email; // Trusted
  
  // Load conversation (as service role = admin)
  const conv = await context.base44
    .asServiceRole
    .entities.Conversation.filter({ id: conversationId }, null, 1);
  
  if (!conv[0]) return { error: 'Conversation not found' };
  
  // Auth check
  const isParticipant = 
    conv[0].user_a_id === userId || 
    conv[0].user_b_id === userId;
  
  if (!isParticipant) return { error: 'Not participant', status: 403 };
  
  // Create message as ADMIN (serviceRole)
  const message = await context.base44
    .asServiceRole
    .entities.Message.create({
      conversation_id: conversationId,
      participant_a_id: conv[0].user_a_id,
      participant_b_id: conv[0].user_b_id,
      from_user_id: userId,
      to_user_id: userId === conv[0].user_a_id 
        ? conv[0].user_b_id 
        : conv[0].user_a_id,
      body
    });
  
  return { success: true, message };
}`}
                  </pre>
                </li>
                <li>
                  <span className="font-semibold text-green-200">Mettre à jour le frontend</span> pour appeler 
                  la function au lieu de <code className="bg-slate-900 px-2 py-1 rounded">sendMessageSecure()</code>
                </li>
              </ol>
            </div>
          </div>

          {/* Alternative (NOT RECOMMENDED) */}
          <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Alternative (NON RECOMMANDÉE)
            </h2>
            <p className="text-slate-300 mb-4">
              Remettre <code className="bg-slate-900 px-2 py-1 rounded">Message.create = "from_user_id == {'{user.email}'"</code>
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <p>✅ PRO: Le chat fonctionne à nouveau</p>
              <p>❌ CON: Un attaquant peut bypass le workflow et créer des messages directement via console:</p>
              <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-red-300">
{`// Attaque possible:
await base44.entities.Message.create({
  conversation_id: "CONV_EXISTANTE",
  participant_a_id: "victim@test.com", // SPOOF
  participant_b_id: "attacker@me.com",
  from_user_id: "attacker@me.com",
  body: "message non autorisé"
})
// => Message créé dans une conversation où attacker n'est pas participant!`}
              </pre>
              <p className="text-red-300 font-semibold mt-3">
                ⚠️ Cette approche NE PROTÈGE PAS contre les attaques console. NON RECOMMANDÉ.
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => window.open('https://docs.base44.com/backend-functions', '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Server className="w-4 h-4 mr-2" />
              Documentation Backend Functions
            </Button>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}