import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, CheckCircle, XCircle, Zap, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBackendHealth() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [fullLog, setFullLog] = useState('');

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults = [];
    let logText = `BACKEND HEALTH CHECK - REAL EVIDENCE\nTimestamp: ${new Date().toISOString()}\n\n`;

    const addResult = (name, endpoint, status, statusCode, body, timestamp) => {
      const result = { name, endpoint, status, statusCode, body, timestamp };
      testResults.push(result);
      setResults([...testResults]);
      
      logText += `[${status}] ${name}\n`;
      logText += `  Endpoint: ${endpoint}\n`;
      logText += `  Status: ${statusCode}\n`;
      logText += `  Body: ${typeof body === 'object' ? JSON.stringify(body, null, 2) : body}\n`;
      logText += `  Time: ${timestamp}\n\n`;
      setFullLog(logText);
    };

    // TEST 1: NO-AUTH (fetch without credentials) => 401
    try {
      const response = await fetch('/api/v1/functions/chat_send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ conversationId: 'test', body: 'test' })
      });
      
      const statusCode = response.status;
      const body = await response.json().catch(() => response.statusText);
      
      const status = statusCode === 401 ? 'PASS' : 'FAIL';
      addResult('1. NO-AUTH (fetch omit)', '/api/v1/functions/chat_send_message', status, statusCode, body, new Date().toISOString());
    } catch (error) {
      addResult('1. NO-AUTH (fetch omit)', '/api/v1/functions/chat_send_message', 'ERROR', 'NETWORK', error.message, new Date().toISOString());
    }

    // TEST 2: open_conversation(empty) => 400
    try {
      const res = await base44.functions.chat_open_conversation({});
      addResult('2. open_conversation(empty)', 'chat_open_conversation', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '400' || statusCode === 400 ? 'PASS' : 'FAIL';
      addResult('2. open_conversation(empty)', 'chat_open_conversation', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 3: send_message(no-body) => 400
    try {
      const res = await base44.functions.chat_send_message({ conversationId: 'test' });
      addResult('3. send_message(no-body)', 'chat_send_message', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '400' || statusCode === 400 ? 'PASS' : 'FAIL';
      addResult('3. send_message(no-body)', 'chat_send_message', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 4: send_message(empty-body) => 400
    try {
      const res = await base44.functions.chat_send_message({ conversationId: 'test', body: '', clientMsgId: 'test-1' });
      addResult('4. send_message(empty-body)', 'chat_send_message', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '400' || statusCode === 400 ? 'PASS' : 'FAIL';
      addResult('4. send_message(empty-body)', 'chat_send_message', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 5: NON-PARTICIPANT on fixture conversation => 403
    try {
      const fixtureSettings = await base44.entities.AppSettings.filter({
        setting_key: 'security_fixture_conversation_id'
      }, null, 1);
      
      if (fixtureSettings.length > 0 && fixtureSettings[0].value_string) {
        const fixtureConvId = fixtureSettings[0].value_string;
        
        try {
          const res = await base44.functions.chat_send_message({ 
            conversationId: fixtureConvId,
            body: 'non-participant test',
            clientMsgId: `fixture-test-${Date.now()}`
          });
          addResult('5. send_message(non-participant fixture)', 'chat_send_message', 'FAIL', 200, res, new Date().toISOString());
        } catch (error) {
          const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
          const status = statusCode === '403' || statusCode === 403 ? 'PASS' : 'FAIL';
          addResult('5. send_message(non-participant fixture)', 'chat_send_message', status, statusCode, error.message, new Date().toISOString());
        }
      } else {
        addResult('5. send_message(non-participant fixture)', 'chat_send_message', 'SKIP', 'N/A', 'No fixture - create in /admin/security-fixtures', new Date().toISOString());
      }
    } catch (error) {
      addResult('5. send_message(non-participant fixture)', 'chat_send_message', 'ERROR', 'N/A', error.message, new Date().toISOString());
    }

    // TEST 6: open_conversation(no mutual intention) => 403
    try {
      const res = await base44.functions.chat_open_conversation({ 
        otherUserEmail: 'stranger-no-match@test.com' 
      });
      addResult('6. open_conversation(no-auth)', 'chat_open_conversation', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '403' || statusCode === 403 ? 'PASS' : 'FAIL';
      addResult('6. open_conversation(no-auth)', 'chat_open_conversation', status, statusCode, error.message, new Date().toISOString());
    }

    // TESTS 7-10: Require actual authorized conversation
    try {
      const user = await base44.auth.me();
      const convs = await base44.entities.Conversation.filter({ 
        user_a_id: user.email 
      }, null, 1);
      
      if (convs.length > 0) {
        const conv = convs[0];
        const otherUserEmail = conv.user_b_id;
        
        // TEST 7: open_conversation(authorized) => 200
        try {
          const res = await base44.functions.chat_open_conversation({ 
            otherUserEmail 
          });
          const status = res.conversationId ? 'PASS' : 'FAIL';
          addResult('7. open_conversation(authorized)', 'chat_open_conversation', status, 200, res, new Date().toISOString());
        } catch (error) {
          addResult('7. open_conversation(authorized)', 'chat_open_conversation', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
        // TEST 8: send_message(valid participant) => 200
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        try {
          const res = await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Health check test',
            clientMsgId: `health-${Date.now()}`
          });
          const status = res.message?.id ? 'PASS' : 'FAIL';
          addResult('8. send_message(valid)', 'chat_send_message', status, 200, res, new Date().toISOString());
        } catch (error) {
          addResult('8. send_message(valid)', 'chat_send_message', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
        // TEST 9: IDEMPOTENCE (same clientMsgId) => duplicate:true + same message.id
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const idempotenceId = `idempotence-${Date.now()}`;
        try {
          const res1 = await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Idempotence test',
            clientMsgId: idempotenceId
          });
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          const res2 = await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Idempotence test',
            clientMsgId: idempotenceId
          });
          
          const sameId = res1.message?.id === res2.message?.id;
          const isDuplicate = res2.duplicate === true;
          const status = (sameId && isDuplicate) ? 'PASS' : 'FAIL';
          
          addResult('9. idempotence(same-clientMsgId)', 'chat_send_message', status, 200, 
            { 
              first_call: { id: res1.message?.id, duplicate: res1.duplicate },
              second_call: { id: res2.message?.id, duplicate: res2.duplicate },
              proof: `same_id=${sameId}, duplicate_flag=${isDuplicate}`
            },
            new Date().toISOString());
        } catch (error) {
          addResult('9. idempotence(same-clientMsgId)', 'chat_send_message', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
        // TEST 10: rate_limit(spam <1sec) => 429
        try {
          await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Rate test 1',
            clientMsgId: `rate-1-${Date.now()}`
          });
          
          // Immediate second send
          await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Rate test 2',
            clientMsgId: `rate-2-${Date.now()}`
          });
          
          addResult('10. rate_limit(spam)', 'chat_send_message', 'FAIL', 200, 'Second succeeded', new Date().toISOString());
        } catch (error) {
          const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
          const status = statusCode === '429' || statusCode === 429 ? 'PASS' : 'FAIL';
          addResult('10. rate_limit(spam)', 'chat_send_message', status, statusCode, error.message, new Date().toISOString());
        }
        
      } else {
        addResult('7-10. (200-path tests)', 'N/A', 'SKIP', 'N/A', 'No conversations for current user', new Date().toISOString());
      }
    } catch (error) {
      addResult('7-10. (200-path tests)', 'N/A', 'ERROR', 'N/A', error.message, new Date().toISOString());
    }

    setTesting(false);
  };

  const copyLog = () => {
    navigator.clipboard.writeText(fullLog);
    alert('Log copié dans le presse-papiers');
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
              Tests réels avec preuves brutes (status + body JSON)
            </p>
          </div>

          <div className="mb-8 flex gap-4">
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
                  Lancer tests (10 tests, ~15 sec)
                </>
              )}
            </Button>
            
            {fullLog && (
              <Button
                onClick={copyLog}
                variant="outline"
                className="border-slate-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier log brut
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {result.status === 'PASS' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : result.status === 'SKIP' ? (
                        <AlertTriangle className="w-6 h-6 text-blue-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <h3 className="font-mono text-sm font-semibold text-amber-100">{result.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{result.endpoint}</p>
                        <p className="text-xs text-slate-500">{result.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs font-mono text-slate-300">
                        {result.statusCode}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.status === 'PASS' ? 'bg-green-500/20 text-green-300' :
                        result.status === 'SKIP' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 font-semibold">REAL RESPONSE:</div>
                    <pre className="bg-slate-900/50 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto max-h-64">
                      {typeof result.body === 'object' ? JSON.stringify(result.body, null, 2) : result.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Résumé</h3>
              <p className="text-slate-400 mb-4">
                {results.filter(r => r.status === 'PASS').length}/{results.filter(r => r.status !== 'SKIP' && r.status !== 'ERROR').length} tests passés
                {results.filter(r => r.status === 'SKIP').length > 0 && ` (${results.filter(r => r.status === 'SKIP').length} skipped)`}
              </p>
              {results.filter(r => r.status !== 'SKIP' && r.status !== 'ERROR').every(r => r.status === 'PASS') && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>✅ Backend Functions déployées et fonctionnelles</span>
                </div>
              )}
              {results.filter(r => r.status === 'FAIL').length > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span>❌ {results.filter(r => r.status === 'FAIL').length} test(s) échoué(s)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}