import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Copy, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

const callFunctionRaw = async (endpoint, method = 'GET', body = null) => {
  const url = `${window.location.origin}/api/${endpoint}`;
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    });
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }
    return {
      endpoint,
      method,
      status: response.status,
      statusText: response.statusText,
      body: jsonData,
      timestamp: new Date().toISOString(),
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };
  }
};

export default function AdminBackendHealth() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const tests = [
    { name: 'AppSettings Read', fn: async () => {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'paywall_enabled' }, null, 1);
      return { success: true, data: settings, msg: settings.length > 0 ? 'PASS' : 'FAIL' };
    }},
    { name: 'AccountPrivate Filter Limit', fn: async () => {
      const user = await base44.auth.me();
      const accounts = await base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1);
      return { success: accounts.length <= 1, data: accounts, msg: accounts.length <= 1 ? 'PASS' : 'FAIL (no limit)' };
    }},
    { name: 'Message Entity Exists', fn: async () => {
      try {
        const schema = await base44.entities.Message.schema?.();
        return { success: true, data: schema, msg: 'PASS' };
      } catch {
        return { success: false, msg: 'FAIL (entity not found)' };
      }
    }},
    { name: 'EvidenceRun Create Test', fn: async () => {
      try {
        const run = await base44.entities.EvidenceRun.create({
          run_type: 'backend_health',
          results_json: JSON.stringify({ test: 'health_check' }),
          summary: 'Health check test',
          tests_passed: 1,
          tests_failed: 0
        });
        return { success: !!run?.id, data: run, msg: run?.id ? 'PASS' : 'FAIL' };
      } catch (error) {
        return { success: false, msg: `FAIL: ${error.message}` };
      }
    }}
  ];

  const runTests = async () => {
    setRunning(true);
    const newResults = [];
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        newResults.push({ name: test.name, ...result });
      } catch (error) {
        newResults.push({ name: test.name, success: false, msg: `ERROR: ${error.message}` });
      }
    }
    
    setResults(newResults);
    setRunning(false);
  };

  const copyResults = () => {
    const text = results.map(r => `${r.name}: ${r.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Results copied!');
  };

  const downloadResults = () => {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-purple-200">Backend Health Check</h1>

          <div className="space-y-4 mb-6">
            <Button onClick={runTests} disabled={running} className="bg-purple-600 hover:bg-purple-700">
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running...' : 'Run Tests'}
            </Button>

            {results.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={copyResults} variant="outline" className="border-slate-600">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadResults} variant="outline" className="border-slate-600">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {r.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <h3 className="font-semibold">{r.name}</h3>
                  </div>
                  <p className={`text-sm ${r.success ? 'text-green-300' : 'text-red-300'}`}>
                    {r.msg}
                  </p>
                  {r.data && (
                    <pre className="bg-slate-900 p-2 rounded mt-2 text-xs text-slate-400 max-h-48 overflow-auto">
                      {JSON.stringify(r.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}