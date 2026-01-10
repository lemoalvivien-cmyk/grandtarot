import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Activity, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBackendHealth() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults = [];

    const addResult = (name, status, response, timestamp) => {
      testResults.push({ name, status, response, timestamp });
      setResults([...testResults]);
    };

    // TEST 1: chat_open_conversation (should fail with 400/403 - no otherUserEmail or not authorized)
    try {
      const res = await base44.functions.chat_open_conversation({});
      addResult('chat_open_conversation(empty)', 'UNEXPECTED', JSON.stringify(res, null, 2), new Date().toISOString());
    } catch (error) {
      const status = error.message?.includes('400') || error.message?.includes('requis') ? 'PASS' : 'FAIL';
      addResult('chat_open_conversation(empty)', status, error.message, new Date().toISOString());
    }

    // TEST 2: chat_send_message (should fail with 400 - no body)
    try {
      const res = await base44.functions.chat_send_message({ conversationId: 'test' });
      addResult('chat_send_message(no-body)', 'UNEXPECTED', JSON.stringify(res, null, 2), new Date().toISOString());
    } catch (error) {
      const status = error.message?.includes('400') || error.message?.includes('requis') ? 'PASS' : 'FAIL';
      addResult('chat_send_message(no-body)', status, error.message, new Date().toISOString());
    }

    // TEST 3: chat_send_message (should fail with 400 - empty body)
    try {
      const res = await base44.functions.chat_send_message({ conversationId: 'test', body: '' });
      addResult('chat_send_message(empty-body)', 'UNEXPECTED', JSON.stringify(res, null, 2), new Date().toISOString());
    } catch (error) {
      const status = error.message?.includes('400') || error.message?.includes('vide') ? 'PASS' : 'FAIL';
      addResult('chat_send_message(empty-body)', status, error.message, new Date().toISOString());
    }

    setTesting(false);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold">Backend Functions Health Check</h1>
            </div>
            <p className="text-slate-400">
              Vérification que les Backend Functions sont déployées et répondent correctement
            </p>
          </div>

          <div className="mb-8">
            <Button
              onClick={runTests}
              disabled={testing}
              className="bg-green-600 hover:bg-green-700"
            >
              {testing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Tests en cours...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Lancer tests
                </>
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {result.status === 'PASS' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <h3 className="font-mono text-sm font-semibold text-amber-100">{result.name}</h3>
                        <p className="text-xs text-slate-500">{result.timestamp}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.status === 'PASS' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <pre className="bg-slate-900/50 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                    {result.response}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Résumé</h3>
              <p className="text-slate-400">
                {results.filter(r => r.status === 'PASS').length}/{results.length} tests passés
              </p>
              {results.every(r => r.status === 'PASS') && (
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Backend Functions déployées et fonctionnelles</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}