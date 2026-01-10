import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBackfillMessages() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ total: 0, processed: 0, fixed: 0, errors: 0, quarantined: 0 });
  const [logs, setLogs] = useState([]);

  const addLog = (type, message) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  const runBackfill = async () => {
    setRunning(true);
    setProgress({ total: 0, processed: 0, fixed: 0, errors: 0, quarantined: 0 });
    setLogs([]);

    const BATCH_SIZE = 200;
    let skip = 0;
    let hasMore = true;

    try {
      addLog('info', '🔍 Démarrage backfill paginé (batch: 200)...');
      
      // First, count total (estimate)
      const sampleBatch = await base44.entities.Message.filter({}, '-created_date', 1);
      addLog('info', '📊 Traitement par batch de 200 messages...');

      while (hasMore) {
        // Load batch with pagination
        const batch = await base44.entities.Message.filter({}, '-created_date', BATCH_SIZE);
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        setProgress(prev => ({ ...prev, total: prev.total + batch.length }));
        addLog('info', `📦 Batch ${Math.floor(skip / BATCH_SIZE) + 1}: ${batch.length} messages`);

        let batchProcessed = 0;
        for (const message of batch) {
        try {
          // Check if already has participants
          if (message.participant_a_id && message.participant_b_id && message.to_user_id) {
            setProgress(prev => ({ ...prev, processed: prev.processed + 1 }));
            continue; // Already backfilled
          }

          // Load conversation
          const conversations = await base44.entities.Conversation.filter({ 
            id: message.conversation_id 
          }, null, 1);

          if (conversations.length === 0) {
            // Orphan message - quarantine
            await base44.entities.Message.update(message.id, {
              is_deleted: true,
              deleted_by: 'system',
              moderation_status: 'auto_blocked'
            });
            
            addLog('warning', `⚠️ Message ${message.id} orphelin (conversation absente) → quarantaine`);
            setProgress(prev => ({ 
              ...prev, 
              processed: prev.processed + 1, 
              quarantined: prev.quarantined + 1 
            }));
            continue;
          }

          const conversation = conversations[0];

          // Calculate fields
          const participant_a_id = conversation.user_a_id;
          const participant_b_id = conversation.user_b_id;
          const to_user_id = message.from_user_id === participant_a_id 
            ? participant_b_id 
            : participant_a_id;

          // Update message with denormalized fields
          await base44.entities.Message.update(message.id, {
            participant_a_id,
            participant_b_id,
            to_user_id
          });

          addLog('success', `✅ Message ${message.id} backfilled`);
          setProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + 1, 
            fixed: prev.fixed + 1 
          }));

        } catch (error) {
          addLog('error', `❌ Erreur message ${message.id}: ${error.message}`);
          setProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + 1, 
            errors: prev.errors + 1 
          }));
        }
        
        batchProcessed++;
      }

        // If batch was full, there might be more
        if (batch.length < BATCH_SIZE) {
          hasMore = false;
          addLog('info', '✅ Dernier batch traité, fin du backfill');
        }
        
        skip += BATCH_SIZE;
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addLog('info', '✅ BACKFILL TERMINÉ');
      
      // Log audit
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'admin_action',
        entity_name: 'Message',
        payload_summary: `Backfill completed: ${progress.fixed} fixed, ${progress.quarantined} quarantined, ${progress.errors} errors`,
        severity: 'info'
      });

    } catch (error) {
      addLog('error', `❌ ERREUR FATALE: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-8 h-8 text-amber-500" />
              <h1 className="text-3xl font-bold">Backfill Message Participants</h1>
            </div>
            <p className="text-slate-400">
              Remplit participant_a_id, participant_b_id, to_user_id pour tous les messages existants
            </p>
          </div>

          {/* Stats */}
          {progress.total > 0 && (
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-2xl font-bold text-slate-300">{progress.total}</div>
                <div className="text-slate-400 text-sm">Total</div>
              </div>
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{progress.processed}</div>
                <div className="text-slate-400 text-sm">Traités</div>
              </div>
              <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{progress.fixed}</div>
                <div className="text-slate-400 text-sm">Corrigés</div>
              </div>
              <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-400">{progress.quarantined}</div>
                <div className="text-slate-400 text-sm">Quarantaine</div>
              </div>
              <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">{progress.errors}</div>
                <div className="text-slate-400 text-sm">Erreurs</div>
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="mb-8">
            <Button
              onClick={runBackfill}
              disabled={running}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {running ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Backfill en cours... ({progress.processed}/{progress.total})
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Lancer le backfill
                </>
              )}
            </Button>
          </div>

          {/* Logs */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Logs</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucun log</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    {log.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />}
                    {log.type === 'error' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                    {log.type === 'info' && <div className="w-4 h-4 flex-shrink-0" />}
                    <span className={
                      log.type === 'success' ? 'text-green-300' :
                      log.type === 'error' ? 'text-red-300' :
                      log.type === 'warning' ? 'text-amber-300' :
                      'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="mt-8 bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-300 mb-2">⚠️ ATTENTION</h3>
                <p className="text-slate-300 text-sm">
                  Ce backfill met en quarantaine les messages orphelins (conversation supprimée).
                  Vérifiez les résultats avant de poursuivre.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}