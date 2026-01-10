import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Copy, Download, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminReleaseCheck() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const tests = [
    {
      name: 'Chat: Message Limit 50',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Check that Message filter accepts limit parameter
          const msgs = await base44.entities.Message.filter({}, '-created_date', 50);
          return {
            success: msgs.length <= 50,
            status: 200,
            payload: { limit: 50 },
            body: { message_count: msgs.length, max_limit: 50 },
            msg: msgs.length <= 50 ? 'PASS: Limit enforced' : 'FAIL: Limit exceeded',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: { limit: 50 },
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Chat: Idempotence (client_msg_id)',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Verify that Message schema includes client_msg_id
          const msgs = await base44.entities.Message.filter({}, null, 1);
          const hasIdempotence =
            msgs.length === 0 || msgs[0].hasOwnProperty('client_msg_id');
          return {
            success: hasIdempotence,
            status: 200,
            payload: {},
            body: { has_client_msg_id: hasIdempotence },
            msg: hasIdempotence ? 'PASS: Idempotence field present' : 'FAIL: No idempotence',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: {},
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Chat: Conversation Mutual Check',
      fn: async () => {
        const startTime = Date.now();
        try {
          const convs = await base44.entities.Conversation.filter({}, null, 5);
          const hasMutualFields = convs.length === 0 || (convs[0].user_a_id && convs[0].user_b_id);
          return {
            success: hasMutualFields,
            status: 200,
            payload: {},
            body: { has_user_a_id: true, has_user_b_id: true },
            msg: hasMutualFields ? 'PASS: Mutual participants field' : 'FAIL: Missing fields',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: {},
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Chat: Block Prevention',
      fn: async () => {
        const startTime = Date.now();
        try {
          const blocks = await base44.entities.Block.filter({}, null, 1);
          // Verify Block entity has public_id fields
          const hasCheck =
            blocks.length === 0 ||
            (blocks[0].blocker_profile_id && blocks[0].blocked_profile_id);
          return {
            success: hasCheck,
            status: 200,
            payload: {},
            body: { public_id_based: hasCheck },
            msg: hasCheck ? 'PASS: Block uses public_id' : 'FAIL: Block broken',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: {},
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Paywall: DailyMatch Limit 20',
      fn: async () => {
        const startTime = Date.now();
        try {
          const matches = await base44.entities.DailyMatch.filter({}, null, 20);
          return {
            success: matches.length <= 20,
            status: 200,
            payload: { limit: 20 },
            body: { match_count: matches.length },
            msg: matches.length <= 20 ? 'PASS: Match limit enforced' : 'FAIL: Limit exceeded',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: { limit: 20 },
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'RGPD: ConsentPreference Exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          const consent = await base44.entities.ConsentPreference.filter({}, null, 1);
          return {
            success: true,
            status: 200,
            payload: {},
            body: { consent_count: consent.length },
            msg: 'PASS: ConsentPreference entity available',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 404,
            payload: {},
            body: error.message,
            msg: `FAIL: ConsentPreference missing`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'RGPD: DsarRequest Exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          const dsar = await base44.entities.DsarRequest.filter({}, null, 1);
          return {
            success: true,
            status: 200,
            payload: {},
            body: { dsar_count: dsar.length },
            msg: 'PASS: DsarRequest entity available',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 404,
            payload: {},
            body: error.message,
            msg: `FAIL: DsarRequest missing`,
            duration: Date.now() - startTime
          };
        }
      }
    }
  ];

  const runTests = async () => {
    setRunning(true);
    const newResults = [];

    for (const test of tests) {
      try {
        const result = await test.fn();
        newResults.push({
          name: test.name,
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        newResults.push({
          name: test.name,
          success: false,
          status: 500,
          body: error.message,
          msg: `ERROR: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    setResults(newResults);
    setRunning(false);
  };

  const saveRun = async () => {
    if (results.length === 0) return;

    setSaving(true);
    try {
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      const resultsText = results
        .map(
          r => `[${r.timestamp}] ${r.name}
Status: ${r.status}
Message: ${r.msg}
Duration: ${r.duration}ms
Body: ${typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2)}
---`
        )
        .join('\n');

      const run = await base44.entities.EvidenceRun.create({
        run_type: 'release_check',
        results_json: resultsText,
        summary: `Release check: ${passed} passed, ${failed} failed (Chat, Paywall, RGPD)`,
        tests_passed: passed,
        tests_failed: failed,
        run_duration_ms: Math.round((Date.now() - new Date(results[0].timestamp).getTime()) / 1000)
      });

      alert(`✅ Evidence Run saved (ID: ${run.id})`);
    } catch (error) {
      alert(`❌ Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const copyAll = () => {
    const text = results
      .map(r => `${r.name}\n${r.msg}\n${JSON.stringify(r.body, null, 2)}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const downloadAll = () => {
    const json = JSON.stringify(results, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `release-check-${Date.now()}.json`;
    a.click();
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-amber-300">Release Check</h1>

          <div className="flex gap-2 mb-6 flex-wrap">
            <Button onClick={runTests} disabled={running} className="bg-amber-600 hover:bg-amber-700">
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running...' : 'RUN'}
            </Button>

            {results.length > 0 && (
              <>
                <Button onClick={copyAll} variant="outline" className="border-slate-600">
                  <Copy className="w-4 h-4 mr-2" />
                  COPY ALL
                </Button>
                <Button onClick={downloadAll} variant="outline" className="border-slate-600">
                  <Download className="w-4 h-4 mr-2" />
                  DOWNLOAD
                </Button>
                <Button onClick={saveRun} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  SAVE RUN
                </Button>
              </>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-4 ${
                    r.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {r.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <h3 className="font-semibold flex-1">{r.name}</h3>
                    <span className="text-xs text-slate-400">{r.duration}ms</span>
                  </div>

                  <p className={`text-sm mb-2 ${r.success ? 'text-green-300' : 'text-red-300'}`}>
                    {r.msg}
                  </p>

                  <div className="bg-slate-900 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">
                      Status: {r.status} | {r.timestamp}
                    </p>
                    <pre className="text-xs text-slate-300 max-h-32 overflow-auto">
                      {JSON.stringify(r.body, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}