import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { callFunctionRaw } from '@/components/helpers/functionFetch';
import { Copy, Save, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSecuritySelftest() {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [results, setResults] = useState([]);

  const runSelftest = async () => {
    setRunning(true);
    setOutput('');
    const testResults = [];
    
    let rawOutput = `SECURITY SELF-TEST — RAW EVIDENCE\n`;
    rawOutput += `Started: ${new Date().toISOString()}\n`;
    rawOutput += `Origin: ${window.location.origin}\n\n`;
    rawOutput += `Test | Status | Details\n`;
    rawOutput += `${'─'.repeat(100)}\n`;

    // TEST 1: NO-AUTH (401)
    const noAuthRes = await callFunctionRaw('chat_send_message',
      { conversationId: 'test', body: 'test', clientMsgId: 'test' },
      { omitCredentials: true }
    );
    const noAuthPass = noAuthRes.status === 401;
    testResults.push({ name: 'NO-AUTH => 401', passed: noAuthPass, result: noAuthRes });
    rawOutput += `NO-AUTH (credentials:omit) | ${noAuthPass ? '✅ PASS' : '❌ FAIL'} | Status: ${noAuthRes.status}, Body: ${noAuthRes.json?.error || noAuthRes.text}\n`;

    // TEST 2: NON-PARTICIPANT (403)
    let nonParticipantPass = false;
    try {
      const fixtures = await base44.entities.AppSettings.filter({
        setting_key: 'security_fixture_conversation_id'
      }, null, 1);
      
      if (fixtures.length > 0 && fixtures[0].value_string) {
        const nonPartRes = await callFunctionRaw('chat_send_message', {
          conversationId: fixtures[0].value_string,
          body: 'spoof',
          clientMsgId: `test-${Date.now()}`
        });
        nonParticipantPass = nonPartRes.status === 403;
        testResults.push({ name: 'NON-PARTICIPANT => 403', passed: nonParticipantPass, result: nonPartRes });
        rawOutput += `NON-PARTICIPANT (fixture) | ${nonParticipantPass ? '✅ PASS' : '❌ FAIL'} | Status: ${nonPartRes.status}, Body: ${nonPartRes.json?.error || nonPartRes.text}\n`;
      } else {
        rawOutput += `NON-PARTICIPANT (fixture) | ⏭️ SKIP | No fixture configured\n`;
      }
    } catch (error) {
      rawOutput += `NON-PARTICIPANT (fixture) | ❌ ERROR | ${error.message}\n`;
    }

    // TEST 3: Message.create blocked (admin-only)
    try {
      const user = await base44.auth.me();
      await base44.entities.Message.create({
        from_user_id: user.email,
        participant_a_id: user.email,
        participant_b_id: 'other@test.com',
        body: 'spoof',
        conversation_id: 'fake'
      });
      testResults.push({ name: 'Message.create admin-only', passed: false });
      rawOutput += `Message.create blocked | ❌ FAIL | Non-admin was able to create\n`;
    } catch (error) {
      const blocked = error.message?.includes('403') || error.message?.includes('Forbidden');
      testResults.push({ name: 'Message.create admin-only', passed: blocked });
      rawOutput += `Message.create blocked | ${blocked ? '✅ PASS' : '❌ FAIL'} | ${error.message}\n`;
    }

    // TEST 4: Conversation.create blocked (admin-only)
    try {
      const user = await base44.auth.me();
      await base44.entities.Conversation.create({
        user_a_id: user.email,
        user_b_id: 'other@test.com',
        mode: 'love'
      });
      testResults.push({ name: 'Conversation.create admin-only', passed: false });
      rawOutput += `Conversation.create blocked | ❌ FAIL | Non-admin was able to create\n`;
    } catch (error) {
      const blocked = error.message?.includes('403') || error.message?.includes('Forbidden');
      testResults.push({ name: 'Conversation.create admin-only', passed: blocked });
      rawOutput += `Conversation.create blocked | ${blocked ? '✅ PASS' : '❌ FAIL'} | ${error.message}\n`;
    }

    rawOutput += `${'─'.repeat(100)}\n`;
    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;
    rawOutput += `\nSummary: ${passed} PASS | ${failed} FAIL\n`;
    rawOutput += `Completed: ${new Date().toISOString()}\n`;

    setOutput(rawOutput);
    setResults(testResults);
    setRunning(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(output);
    alert('Output copied to clipboard!');
  };

  const saveRun = async () => {
    try {
      await base44.entities.EvidenceRun.create({
        run_type: 'security_selftest',
        results_json: JSON.stringify(results),
        summary: `Security selftest: ${results.filter(r => r.passed).length}/${results.length} passed`,
        tests_passed: results.filter(r => r.passed).length,
        tests_failed: results.filter(r => !r.passed).length,
        raw_output: output
      });
      alert('Evidence saved!');
    } catch (error) {
      alert(`Error saving: ${error.message}`);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Security Self-Test</h1>
            <p className="text-slate-400">Verify 401, 403, access rules</p>
          </div>

          <div className="flex gap-2 mb-8">
            <Button onClick={runSelftest} disabled={running} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running...' : 'Run Tests'}
            </Button>
            {output && (
              <>
                <Button onClick={copyAll} variant="outline" className="border-slate-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                <Button onClick={saveRun} variant="outline" className="border-green-700 text-green-400">
                  <Save className="w-4 h-4 mr-2" />
                  Save Run
                </Button>
              </>
            )}
          </div>

          {output && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap max-h-96 overflow-x-auto">
              {output}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}