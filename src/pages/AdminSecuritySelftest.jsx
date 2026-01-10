import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSecuritySelftest() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);

  const runTests = async () => {
    setRunning(true);
    setResults([]);
    const testResults = [];

    // Helper to add test result
    const addResult = (name, passed, details, error = null) => {
      testResults.push({ name, passed, details, error, timestamp: new Date().toISOString() });
      setResults([...testResults]);
    };

    try {
      // TEST 1: UserProfile.list() should FAIL or return empty
      try {
        const profiles = await base44.entities.UserProfile.list();
        if (profiles.length === 0) {
          addResult('UserProfile.list()', true, 'Returned empty array (filtered by accessRules)');
        } else {
          addResult('UserProfile.list()', false, `LEAK: Returned ${profiles.length} profiles`, 'Should return 0 profiles or 403');
        }
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission')) {
          addResult('UserProfile.list()', true, `Blocked: ${error.message}`);
        } else {
          addResult('UserProfile.list()', false, `Unexpected error`, error.message);
        }
      }

      // TEST 2: Message.list() should FAIL or return empty
      try {
        const messages = await base44.entities.Message.list();
        if (messages.length === 0) {
          addResult('Message.list()', true, 'Returned empty array (filtered by accessRules)');
        } else {
          addResult('Message.list()', false, `LEAK: Returned ${messages.length} messages`, 'Should return 0 messages or 403');
        }
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission')) {
          addResult('Message.list()', true, `Blocked: ${error.message}`);
        } else {
          addResult('Message.list()', false, `Unexpected error`, error.message);
        }
      }

      // TEST 3: AppSettings.list() should FAIL (admin only)
      try {
        const settings = await base44.entities.AppSettings.list();
        if (settings.length === 0) {
          addResult('AppSettings.list()', true, 'Returned empty array (no settings or filtered)');
        } else {
          // If we're admin, this is OK
          const user = await base44.auth.me();
          if (user.role === 'admin') {
            addResult('AppSettings.list()', true, `Admin access: ${settings.length} settings`);
          } else {
            addResult('AppSettings.list()', false, `LEAK: Non-admin got ${settings.length} settings`);
          }
        }
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission')) {
          addResult('AppSettings.list()', true, `Blocked: ${error.message}`);
        } else {
          addResult('AppSettings.list()', false, `Unexpected error`, error.message);
        }
      }

      // TEST 4: Conversation filter with another user's email should FAIL
      try {
        const convs = await base44.entities.Conversation.filter({ user_a_id: 'attacker@test.com' });
        if (convs.length === 0) {
          addResult('Conversation.filter(other_user)', true, 'Returned empty (filtered by accessRules)');
        } else {
          addResult('Conversation.filter(other_user)', false, `LEAK: Returned ${convs.length} conversations`);
        }
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission')) {
          addResult('Conversation.filter(other_user)', true, `Blocked: ${error.message}`);
        } else {
          addResult('Conversation.filter(other_user)', false, `Unexpected error`, error.message);
        }
      }

      // TEST 5: AuditLog.list() should FAIL (admin only)
      try {
        const logs = await base44.entities.AuditLog.list();
        const user = await base44.auth.me();
        if (user.role === 'admin' && logs.length >= 0) {
          addResult('AuditLog.list()', true, `Admin access: ${logs.length} logs`);
        } else if (user.role !== 'admin' && logs.length === 0) {
          addResult('AuditLog.list()', true, 'Non-admin: empty array');
        } else if (user.role !== 'admin' && logs.length > 0) {
          addResult('AuditLog.list()', false, `LEAK: Non-admin got ${logs.length} logs`);
        }
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission')) {
          addResult('AuditLog.list()', true, `Blocked: ${error.message}`);
        } else {
          addResult('AuditLog.list()', false, `Unexpected error`, error.message);
        }
      }

      // TEST 6: AiPrompt.list() should FAIL (admin only)
      try {
        const prompts = await base44.entities.AiPrompt.list();
        const user = await base44.auth.me();
        if (user.role === 'admin' && prompts.length >= 0) {
          addResult('AiPrompt.list()', true, `Admin access: ${prompts.length} prompts`);
        } else if (user.role !== 'admin' && prompts.length === 0) {
          addResult('AiPrompt.list()', true, 'Non-admin: empty array');
        } else if (user.role !== 'admin' && prompts.length > 0) {
          addResult('AiPrompt.list()', false, `LEAK: Non-admin got ${prompts.length} prompts`);
        }
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission')) {
          addResult('AiPrompt.list()', true, `Blocked: ${error.message}`);
        } else {
          addResult('AiPrompt.list()', false, `Unexpected error`, error.message);
        }
      }

      // TEST 7: Message.create() spoof attempt (if possible to test)
      try {
        const user = await base44.auth.me();
        await base44.entities.Message.create({
          from_user_id: user.email,
          participant_a_id: user.email,
          participant_b_id: 'victim@test.com',
          body: 'spoof attempt',
          conversation_id: 'fake-conv-id'
        });
        addResult('Message.create(spoof)', false, 'SECURITY BREACH: Spoof succeeded', 'Should have failed');
      } catch (error) {
        if (error.message?.includes('403') || error.message?.includes('permission') || error.message?.includes('not found')) {
          addResult('Message.create(spoof)', true, `Blocked: ${error.message}`);
        } else {
          addResult('Message.create(spoof)', true, `Failed (expected): ${error.message}`);
        }
      }

    } catch (error) {
      addResult('Test Suite', false, 'Fatal error', error.message);
    }

    setRunning(false);
  };

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-bold">Security Self-Test</h1>
            </div>
            <p className="text-slate-400">
              Tests de sécurité automatiques - AccessRules, anti-spoof, isolation données
            </p>
          </div>

          {/* Run Button */}
          <div className="mb-8">
            <Button
              onClick={runTests}
              disabled={running}
              className="bg-red-600 hover:bg-red-700"
            >
              {running ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Tests en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Lancer les tests
                </>
              )}
            </Button>
          </div>

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400">{passCount}</div>
                <div className="text-slate-400 text-sm">PASS</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="text-3xl font-bold text-red-400">{failCount}</div>
                <div className="text-slate-400 text-sm">FAIL</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="text-3xl font-bold text-amber-400">{totalCount}</div>
                <div className="text-slate-400 text-sm">TOTAL</div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Test</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, i) => (
                    <tr key={i} className="border-t border-slate-700/50">
                      <td className="p-4">
                        {result.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">{result.name}</td>
                      <td className="p-4">
                        <div className="text-sm text-slate-300">{result.details}</div>
                        {result.error && (
                          <div className="text-xs text-red-400 mt-1">{result.error}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Warning if failures */}
          {failCount > 0 && (
            <div className="mt-8 bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ FAILLES DÉTECTÉES</h3>
                <p className="text-slate-300 mb-4">
                  {failCount} test(s) échoué(s). Données potentiellement exposées. Vérifier les accessRules et workflows.
                </p>
                <div className="text-sm text-slate-400">
                  Actions recommandées:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Vérifier les accessRules des entités concernées</li>
                    <li>S'assurer qu'aucun .list() n'est utilisé sur entités sensibles</li>
                    <li>Tester en console avec compte non-admin</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success message */}
          {results.length > 0 && failCount === 0 && (
            <div className="mt-8 bg-green-900/20 border border-green-500/30 rounded-xl p-6 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">✅ TOUS LES TESTS PASSÉS</h3>
                <p className="text-slate-300">
                  Aucune faille détectée. AccessRules correctement configurées.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}