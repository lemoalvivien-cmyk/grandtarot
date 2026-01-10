import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { callFunctionRaw, formatBatchResults } from '@/components/helpers/functionFetch';
import { Copy, Download, Save, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBackendHealth() {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);

  const runTests = async () => {
    setRunning(true);
    setOutput('');
    setTestResults([]);
    const results = [];
    let rawOutput = `BACKEND HEALTH CHECK — RAW EVIDENCE\n`;
    rawOutput += `Started: ${new Date().toISOString()}\n`;
    rawOutput += `Origin: ${window.location.origin}\n\n`;
    rawOutput += `${'='.repeat(80)}\n`;

    // TEST 1: NO-AUTH
    rawOutput += `TEST 1: NO-AUTH (credentials:omit)\n`;
    const noAuthRes = await callFunctionRaw('chat_send_message', 
      { conversationId: 'test', body: 'test', clientMsgId: 'test' },
      { omitCredentials: true }
    );
    results.push({ name: 'NO-AUTH (should be 401)', result: noAuthRes });
    rawOutput += `  URL: ${noAuthRes.url}\n`;
    rawOutput += `  Status: ${noAuthRes.status} ${noAuthRes.statusText}\n`;
    rawOutput += `  Body: ${noAuthRes.json ? JSON.stringify(noAuthRes.json, null, 2) : noAuthRes.text}\n`;
    rawOutput += `  Timestamp: ${noAuthRes.timestamp}\n`;
    rawOutput += `  Expected: 401 | Actual: ${noAuthRes.status}\n\n`;

    // TEST 2: NON-PARTICIPANT (fixture)
    rawOutput += `TEST 2: NON-PARTICIPANT FIXTURE\n`;
    try {
      const fixtures = await base44.entities.AppSettings.filter({
        setting_key: 'security_fixture_conversation_id'
      }, null, 1);
      
      if (fixtures.length > 0 && fixtures[0].value_string) {
        const fixtureConvId = fixtures[0].value_string;
        const nonParticipantRes = await callFunctionRaw('chat_send_message', {
          conversationId: fixtureConvId,
          body: 'spoof attempt',
          clientMsgId: `fixture-${Date.now()}`
        });
        
        results.push({ name: 'NON-PARTICIPANT (should be 403)', result: nonParticipantRes });
        rawOutput += `  Fixture ID: ${fixtureConvId}\n`;
        rawOutput += `  URL: ${nonParticipantRes.url}\n`;
        rawOutput += `  Status: ${nonParticipantRes.status} ${nonParticipantRes.statusText}\n`;
        rawOutput += `  Body: ${nonParticipantRes.json ? JSON.stringify(nonParticipantRes.json, null, 2) : nonParticipantRes.text}\n`;
        rawOutput += `  Timestamp: ${nonParticipantRes.timestamp}\n`;
        rawOutput += `  Expected: 403 | Actual: ${nonParticipantRes.status}\n\n`;
      } else {
        rawOutput += `  SKIP: No fixture conversation configured\n\n`;
        results.push({ name: 'NON-PARTICIPANT (fixture missing)', result: { status: 'SKIP', success: false } });
      }
    } catch (error) {
      rawOutput += `  ERROR: ${error.message}\n\n`;
    }

    // TEST 3: AUTHORIZED CONVERSATION (if exists)
    rawOutput += `TEST 3: AUTHORIZED CONVERSATION\n`;
    try {
      const user = await base44.auth.me();
      const convs = await base44.entities.Conversation.filter(
        { user_a_id: user.email },
        null,
        1
      );
      
      if (convs.length > 0) {
        const testMsgId = `health-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const authorizedRes = await callFunctionRaw('chat_send_message', {
          conversationId: convs[0].id,
          body: 'Health check message',
          clientMsgId: testMsgId
        });
        
        results.push({ name: 'AUTHORIZED SEND (should be 200)', result: authorizedRes });
        rawOutput += `  Conversation ID: ${convs[0].id}\n`;
        rawOutput += `  Participants: ${convs[0].user_a_id} <-> ${convs[0].user_b_id}\n`;
        rawOutput += `  URL: ${authorizedRes.url}\n`;
        rawOutput += `  Status: ${authorizedRes.status} ${authorizedRes.statusText}\n`;
        rawOutput += `  Message ID: ${authorizedRes.json?.message?.id || 'N/A'}\n`;
        rawOutput += `  Body: ${authorizedRes.json ? JSON.stringify(authorizedRes.json, null, 2) : authorizedRes.text}\n`;
        rawOutput += `  Timestamp: ${authorizedRes.timestamp}\n`;
        rawOutput += `  Expected: 200 | Actual: ${authorizedRes.status}\n\n`;
      } else {
        rawOutput += `  SKIP: No authorized conversation found\n\n`;
        results.push({ name: 'AUTHORIZED SEND (no conversation)', result: { status: 'SKIP', success: false } });
      }
    } catch (error) {
      rawOutput += `  ERROR: ${error.message}\n\n`;
    }

    // TEST 4: IDEMPOTENCE (same clientMsgId twice)
    rawOutput += `TEST 4: IDEMPOTENCE\n`;
    try {
      const user = await base44.auth.me();
      const convs = await base44.entities.Conversation.filter(
        { user_a_id: user.email },
        null,
        1
      );
      
      if (convs.length > 0) {
        const idempotentMsgId = `idempotent-${Date.now()}`;
        
        // First call
        const first = await callFunctionRaw('chat_send_message', {
          conversationId: convs[0].id,
          body: 'Idempotent test message',
          clientMsgId: idempotentMsgId
        });
        
        // Second call with SAME clientMsgId
        const second = await callFunctionRaw('chat_send_message', {
          conversationId: convs[0].id,
          body: 'Idempotent test message',
          clientMsgId: idempotentMsgId
        });
        
        const isDuplicate = second.json?.duplicate === true;
        const sameId = first.json?.message?.id === second.json?.message?.id;
        
        results.push({ 
          name: 'IDEMPOTENCE (2nd should have duplicate:true)', 
          result: { 
            status: isDuplicate && sameId ? 200 : 400,
            success: isDuplicate && sameId,
            json: { 
              first: first.json?.message?.id,
              second: second.json?.message?.id,
              duplicate: second.json?.duplicate,
              same_id: sameId
            }
          } 
        });
        
        rawOutput += `  ClientMsgId: ${idempotentMsgId}\n`;
        rawOutput += `  1st call:\n`;
        rawOutput += `    Status: ${first.status}\n`;
        rawOutput += `    Message ID: ${first.json?.message?.id}\n`;
        rawOutput += `    Duplicate: ${first.json?.duplicate}\n`;
        rawOutput += `  2nd call (same clientMsgId):\n`;
        rawOutput += `    Status: ${second.status}\n`;
        rawOutput += `    Message ID: ${second.json?.message?.id}\n`;
        rawOutput += `    Duplicate: ${second.json?.duplicate}\n`;
        rawOutput += `  Proof: Same ID=${sameId}, Duplicate flag=${isDuplicate}\n`;
        rawOutput += `  Timestamp: ${second.timestamp}\n\n`;
      } else {
        rawOutput += `  SKIP: No authorized conversation\n\n`;
      }
    } catch (error) {
      rawOutput += `  ERROR: ${error.message}\n\n`;
    }

    // TEST 5: RATE LIMIT (spam)
     rawOutput += `TEST 5: RATE LIMIT\n`;
     try {
       const user = await base44.auth.me();
       const convs = await base44.entities.Conversation.filter(
         { user_a_id: user.email },
         null,
         1
       );

       if (convs.length > 0) {
         // Send 2 messages in rapid succession
         const msg1 = await callFunctionRaw('chat_send_message', {
           conversationId: convs[0].id,
           body: 'Spam 1',
           clientMsgId: `spam-${Date.now()}-1`
         });

         const msg2 = await callFunctionRaw('chat_send_message', {
           conversationId: convs[0].id,
           body: 'Spam 2',
           clientMsgId: `spam-${Date.now()}-2`
         });

         const isRateLimited = msg2.status === 429;
         results.push({ 
           name: 'RATE LIMIT (should be 429)', 
           result: { 
             status: msg2.status,
             success: isRateLimited,
             json: msg2.json
           } 
         });

         rawOutput += `  1st message: ${msg1.status}\n`;
         rawOutput += `  2nd message (immediate): ${msg2.status}\n`;
         rawOutput += `  2nd body: ${msg2.json ? JSON.stringify(msg2.json, null, 2) : msg2.text}\n`;
         rawOutput += `  Expected: 429 | Actual: ${msg2.status}\n`;
         rawOutput += `  Timestamp: ${msg2.timestamp}\n\n`;
       } else {
         rawOutput += `  SKIP: No authorized conversation\n\n`;
       }
     } catch (error) {
       rawOutput += `  ERROR: ${error.message}\n\n`;
     }

    // TEST 6: BLOCK THEN OPEN_CONVERSATION (403 for blocked user)
    rawOutput += `TEST 6: BLOCK THEN OPEN_CONVERSATION\n`;
    try {
      const user = await base44.auth.me();

      // Try to open conversation with fixture user (should be blocked after TEST 2)
      const blockTestRes = await callFunctionRaw('chat_open_conversation', {
        otherUserEmail: 'fixture-blocked@test.com'
      });

      const isBlocked = blockTestRes.status === 403;
      results.push({
        name: 'BLOCK PREVENTS OPEN (should be 403)',
        result: {
          status: blockTestRes.status,
          success: isBlocked,
          json: blockTestRes.json
        }
      });

      rawOutput += `  Attempt to open with blocked user\n`;
      rawOutput += `  Status: ${blockTestRes.status} ${blockTestRes.statusText}\n`;
      rawOutput += `  Body: ${blockTestRes.json ? JSON.stringify(blockTestRes.json, null, 2) : blockTestRes.text}\n`;
      rawOutput += `  Expected: 403 | Actual: ${blockTestRes.status}\n`;
      rawOutput += `  Timestamp: ${blockTestRes.timestamp}\n\n`;
    } catch (error) {
      rawOutput += `  ERROR: ${error.message}\n\n`;
    }

    rawOutput += `${'='.repeat(80)}\n`;
    rawOutput += `SUMMARY\n`;
    rawOutput += `Passed: ${results.filter(r => r.result.success).length}\n`;
    rawOutput += `Failed: ${results.filter(r => !r.result.success && r.result.status !== 'SKIP').length}\n`;
    rawOutput += `Skipped: ${results.filter(r => r.result.status === 'SKIP').length}\n`;
    rawOutput += `Total: ${results.length}\n\n`;
    rawOutput += `Completed: ${new Date().toISOString()}\n`;

    setOutput(rawOutput);
    setTestResults(results);
    setRunning(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(output);
    alert('Output copied to clipboard!');
  };

  const saveRun = async () => {
    try {
      await base44.entities.EvidenceRun.create({
        run_type: 'backend_health',
        results_json: JSON.stringify(testResults),
        summary: `Health check: ${testResults.filter(r => r.result.success).length}/${testResults.length} passed`,
        tests_passed: testResults.filter(r => r.result.success).length,
        tests_failed: testResults.filter(r => !r.result.success && r.result.status !== 'SKIP').length,
        tests_skipped: testResults.filter(r => r.result.status === 'SKIP').length,
        run_duration_ms: 0,
        raw_output: output
      });
      alert('Evidence saved!');
    } catch (error) {
      alert(`Error saving: ${error.message}`);
    }
  };

  const downloadLog = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
    element.setAttribute('download', `backend-health-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Backend Health Check</h1>
            <p className="text-slate-400">Raw HTTP status + body evidence</p>
          </div>

          <div className="flex gap-2 mb-8">
            <Button onClick={runTests} disabled={running} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running...' : 'Run Tests'}
            </Button>
            {output && (
              <>
                <Button onClick={copyAll} variant="outline" className="border-slate-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                <Button onClick={downloadLog} variant="outline" className="border-slate-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={saveRun} variant="outline" className="border-green-700 text-green-400">
                  <Save className="w-4 h-4 mr-2" />
                  Save Run
                </Button>
              </>
            )}
          </div>

          {output && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-96">
              {output}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}