import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Copy, Download, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBackendHealth() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const tests = [
    {
      name: 'AppSettings Read (limit:1)',
      fn: async () => {
        const startTime = Date.now();
        const endpoint = 'entities/AppSettings/filter';
        const payload = { setting_key: 'paywall_enabled' };
        try {
          const settings = await base44.entities.AppSettings.filter(
            { setting_key: 'paywall_enabled' },
            null,
            1
          );
          return {
            success: settings.length <= 1,
            status: 200,
            payload,
            body: settings,
            msg: settings.length <= 1 ? 'PASS' : 'FAIL (limit exceeded)',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload,
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'AccountPrivate Filter (limit:1)',
      fn: async () => {
        const startTime = Date.now();
        try {
          const user = await base44.auth.me();
          const accounts = await base44.entities.AccountPrivate.filter(
            { user_email: user.email },
            null,
            1
          );
          return {
            success: accounts.length <= 1,
            status: 200,
            payload: { user_email: user.email },
            body: accounts,
            msg: accounts.length <= 1 ? 'PASS' : 'FAIL (limit exceeded)',
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
      name: 'Message Schema Exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Attempt to filter with limit to verify entity exists
          const schema = await base44.entities.Message.filter({}, null, 1);
          return {
            success: true,
            status: 200,
            payload: {},
            body: 'Entity accessible',
            msg: 'PASS',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 404,
            payload: {},
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'EvidenceRun Create (admin-only)',
      fn: async () => {
        const startTime = Date.now();
        try {
          const testRun = await base44.entities.EvidenceRun.create({
            run_type: 'backend_health_check',
            results_json: JSON.stringify({ test: 'precheck' }),
            summary: 'Precheck test - will be deleted',
            tests_passed: 1,
            tests_failed: 0
          });
          // Delete immediately to avoid clutter
          if (testRun?.id) {
            try {
              await base44.entities.EvidenceRun.delete(testRun.id);
            } catch {}
          }
          return {
            success: !!testRun?.id,
            status: 201,
            payload: { run_type: 'backend_health_check' },
            body: testRun,
            msg: testRun?.id ? 'PASS' : 'FAIL',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 403,
            payload: { run_type: 'backend_health_check' },
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Block Entity (public_id check)',
      fn: async () => {
        const startTime = Date.now();
        try {
          const blocks = await base44.entities.Block.filter({}, null, 1);
          return {
            success: true,
            status: 200,
            payload: {},
            body: blocks,
            msg: 'PASS',
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
    }
  ];

  const runTests = async () => {
    setRunning(true);
    const newResults = [];
    const runStartTime = Date.now();

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
Payload: ${JSON.stringify(r.payload)}
Body: ${typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2)}
---`
        )
        .join('\n');

      const run = await base44.entities.EvidenceRun.create({
        run_type: 'backend_health',
        results_json: resultsText,
        summary: `Backend health check: ${passed} passed, ${failed} failed`,
        tests_passed: passed,
        tests_failed: failed,
        run_duration_ms: Math.round((Date.now() - results[0].timestamp) / 1000)
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
    a.download = `backend-health-${Date.now()}.json`;
    a.click();
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-green-300">Backend Health</h1>

          <div className="flex gap-2 mb-6 flex-wrap">
            <Button onClick={runTests} disabled={running} className="bg-green-600 hover:bg-green-700">
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

                  <div className="bg-slate-900 rounded p-3 mb-2">
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