import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, CheckCircle, XCircle, Zap, Copy } from 'lucide-react';
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
    let logText = `BACKEND HEALTH CHECK\nTimestamp: ${new Date().toISOString()}\n\n`;

    const addResult = (name, status, statusCode, body, timestamp) => {
      const result = { name, status, statusCode, body, timestamp };
      testResults.push(result);
      setResults([...testResults]);
      
      logText += `[${status}] ${name}\n`;
      logText += `  Status: ${statusCode}\n`;
      logText += `  Body: ${typeof body === 'object' ? JSON.stringify(body, null, 2) : body}\n`;
      logText += `  Time: ${timestamp}\n\n`;
      setFullLog(logText);
    };

    // TEST 1: open_conversation(empty) - should fail 400
    try {
      const res = await base44.functions.chat_open_conversation({});
      addResult('1. open_conversation(empty)', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '400' || statusCode === 400 ? 'PASS' : 'FAIL';
      addResult('1. open_conversation(empty)', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 2: send_message(no-body) - should fail 400
    try {
      const res = await base44.functions.chat_send_message({ conversationId: 'test' });
      addResult('2. send_message(no-body)', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '400' || statusCode === 400 ? 'PASS' : 'FAIL';
      addResult('2. send_message(no-body)', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 3: send_message(empty-body) - should fail 400
    try {
      const res = await base44.functions.chat_send_message({ conversationId: 'test', body: '' });
      addResult('3. send_message(empty-body)', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '400' || statusCode === 400 ? 'PASS' : 'FAIL';
      addResult('3. send_message(empty-body)', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 4: open_conversation(no-auth stranger) - should fail 403
    try {
      const res = await base44.functions.chat_open_conversation({ 
        otherUserEmail: 'stranger-no-match@test.com' 
      });
      addResult('4. open_conversation(no-auth)', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = statusCode === '403' || statusCode === 403 ? 'PASS' : 'FAIL';
      addResult('4. open_conversation(no-auth)', status, statusCode, error.message, new Date().toISOString());
    }

    // TEST 5: send_message(non-participant) - should fail 403/404
    try {
      const res = await base44.functions.chat_send_message({ 
        conversationId: 'non-existent-conv-id-12345',
        body: 'test message',
        clientMsgId: 'test-client-msg-1'
      });
      addResult('5. send_message(non-participant)', 'FAIL', 200, res, new Date().toISOString());
    } catch (error) {
      const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
      const status = (statusCode === '403' || statusCode === 403 || statusCode === '404' || statusCode === 404) ? 'PASS' : 'FAIL';
      addResult('5. send_message(non-participant)', status, statusCode, error.message, new Date().toISOString());
    }

    // TESTS 6-8: Require actual conversation (200 paths)
    try {
      const user = await base44.auth.me();
      const convs = await base44.entities.Conversation.filter({ 
        user_a_id: user.email 
      }, null, 1);
      
      if (convs.length > 0) {
        const conv = convs[0];
        const otherUserEmail = conv.user_b_id;
        
        // TEST 6: open_conversation(authorized match) - should succeed 200
        try {
          const res = await base44.functions.chat_open_conversation({ 
            otherUserEmail 
          });
          const status = res.conversationId ? 'PASS' : 'FAIL';
          addResult('6. open_conversation(authorized)', status, 200, res, new Date().toISOString());
        } catch (error) {
          addResult('6. open_conversation(authorized)', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
        // TEST 7: send_message(participant valid) - should succeed 200
        await new Promise(resolve => setTimeout(resolve, 1200)); // Wait for rate limit
        
        try {
          const res = await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Health check test message',
            clientMsgId: `health-test-${Date.now()}`
          });
          const status = res.message?.id ? 'PASS' : 'FAIL';
          addResult('7. send_message(valid)', status, 200, res, new Date().toISOString());
        } catch (error) {
          addResult('7. send_message(valid)', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
        // TEST 8: idempotence(same clientMsgId) - should return same message
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
          
          const status = (res2.duplicate && res1.message?.id === res2.message?.id) ? 'PASS' : 'FAIL';
          addResult('8. idempotence(same-clientMsgId)', status, 200, 
            { first_id: res1.message?.id, second_id: res2.message?.id, duplicate: res2.duplicate },
            new Date().toISOString());
        } catch (error) {
          addResult('8. idempotence(same-clientMsgId)', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
        // TEST 9: rate_limit(spam <1sec) - should fail 429
        try {
          await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Rate limit test 1',
            clientMsgId: `rate-1-${Date.now()}`
          });
          
          // Immediate second send
          await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Rate limit test 2',
            clientMsgId: `rate-2-${Date.now()}`
          });
          
          addResult('9. rate_limit(spam)', 'FAIL', 200, 'Second message succeeded', new Date().toISOString());
        } catch (error) {
          const statusCode = error.statusCode || error.message?.match(/(\d{3})/)?.[1] || 'UNKNOWN';
          const status = statusCode === '429' || statusCode === 429 ? 'PASS' : 'FAIL';
          addResult('9. rate_limit(spam)', status, statusCode, error.message, new Date().toISOString());
        }
        
        // TEST 10: anti_spoof(inject fields) - should succeed but ignore injected fields
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        try {
          const res = await base44.functions.chat_send_message({
            conversationId: conv.id,
            body: 'Anti-spoof test',
            clientMsgId: `spoof-${Date.now()}`,
            // INJECTED (should be ignored):
            from_user_id: 'hacker@evil.com',
            to_user_id: 'victim@test.com',
            participant_a_id: 'fake_a',
            participant_b_id: 'fake_b'
          });
          
          const msg = res.message;
          const validFrom = msg.from_user_id === user.email;
          const validParticipantA = msg.participant_a_id === conv.user_a_id;
          const validParticipantB = msg.participant_b_id === conv.user_b_id;
          const validTo = msg.to_user_id === otherUserEmail;
          
          const allValid = validFrom && validParticipantA && validParticipantB && validTo;
          const status = allValid ? 'PASS' : 'FAIL';
          
          addResult('10. anti_spoof(inject)', status, 200,
            { from_valid: validFrom, to_valid: validTo, pA_valid: validParticipantA, pB_valid: validParticipantB, message: msg },
            new Date().toISOString());
        } catch (error) {
          addResult('10. anti_spoof(inject)', 'FAIL', error.statusCode || 'ERROR', error.message, new Date().toISOString());
        }
        
      } else {
        addResult('6-10. (200-path tests)', 'SKIP', 'N/A', 'No conversations found for current user', new Date().toISOString());
      }
    } catch (error) {
      addResult('6-10. (200-path tests)', 'ERROR', 'N/A', error.message, new Date().toISOString());
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
              Vérification que les Backend Functions sont déployées et répondent correctement
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
                      {result.status === 'PASS' || result.status === 'SKIP' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <h3 className="font-mono text-sm font-semibold text-amber-100">{result.name}</h3>
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
                    <div className="text-xs text-slate-500 font-semibold">RESPONSE BODY:</div>
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
                {results.filter(r => r.status === 'PASS').length}/{results.filter(r => r.status !== 'SKIP').length} tests passés
                {results.filter(r => r.status === 'SKIP').length > 0 && ` (${results.filter(r => r.status === 'SKIP').length} skipped)`}
              </p>
              {results.filter(r => r.status !== 'SKIP').every(r => r.status === 'PASS') && (
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