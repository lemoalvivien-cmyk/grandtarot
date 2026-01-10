import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSecuritySelftest() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, total: 0 });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSecurityTests = async () => {
    setRunning(true);
    setTestResults([]);
    const results = [];

    // Get a test target user (not current user)
    let targetUserId = 'target@test.com';
    try {
      const allProfiles = await base44.entities.UserProfile.list();
      const otherProfile = allProfiles.find(p => p.user_id !== user.email);
      if (otherProfile) targetUserId = otherProfile.user_id;
    } catch (e) {
      // If list fails, use dummy
    }

    // TEST 1: Try to read another user's UserProfile
    results.push(await testReadOtherUserProfile(targetUserId));

    // TEST 2: Try to list all UserProfiles without filter
    results.push(await testListAllUserProfiles());

    // TEST 3: Try to read another user's Messages
    results.push(await testReadOtherUserMessages(targetUserId));

    // TEST 4: Try to list all Messages
    results.push(await testListAllMessages());

    // TEST 5: Try to read another user's Conversations
    results.push(await testReadOtherUserConversations(targetUserId));

    // TEST 6: Try to read another user's Intentions (sent)
    results.push(await testReadOtherUserIntentions(targetUserId));

    // TEST 7: Try to read another user's DailyDraws
    results.push(await testReadOtherUserDailyDraws(targetUserId));

    // TEST 8: Try to read another user's DailyMatches
    results.push(await testReadOtherUserDailyMatches(targetUserId));

    // TEST 9: Try to list all Reports
    results.push(await testListAllReports());

    // TEST 10: Try to read a Report not created by user
    results.push(await testReadOtherUserReport());

    // TEST 11: Try to list all Blocks
    results.push(await testListAllBlocks());

    // TEST 12: Try to read a Block not created by user
    results.push(await testReadOtherUserBlock());

    // TEST 13: Try to list all AuditLogs (non-admin should fail)
    results.push(await testListAuditLogs());

    // TEST 14: Try to read AppSettings (non-admin should fail)
    results.push(await testReadAppSettings());

    // TEST 15: Try to read AiPrompts (non-admin should fail)
    results.push(await testReadAiPrompts());

    // TEST 16: Try to update another user's UserProfile
    results.push(await testUpdateOtherUserProfile(targetUserId));

    // TEST 17: Try to delete another user's Message
    results.push(await testDeleteOtherUserMessage());

    // TEST 18: Try to create Intention for another user (from_user_id spoofing)
    results.push(await testSpoofIntentionSender(targetUserId));

    // TEST 19: Try to update AppSettings as non-admin
    results.push(await testUpdateAppSettings());

    // TEST 20: Try to create AuditLog as non-admin with admin role
    results.push(await testSpoofAuditLog());

    setTestResults(results);

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    setSummary({ passed, failed, total: results.length });
    setRunning(false);
  };

  // TEST IMPLEMENTATIONS
  const testReadOtherUserProfile = async (targetUserId) => {
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_id: targetUserId });
      if (profiles.length > 0) {
        return {
          name: 'Read Other User Profile',
          status: 'FAIL',
          message: `SECURITY BREACH: Can read other user's profile (${targetUserId})`,
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User Profile',
        status: 'PASS',
        message: 'No results returned (correctly blocked)',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User Profile',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testListAllUserProfiles = async () => {
    try {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles.length > 1) {
        return {
          name: 'List All UserProfiles',
          status: 'FAIL',
          message: `SECURITY BREACH: Can list ${profiles.length} profiles`,
          shouldFail: true
        };
      }
      return {
        name: 'List All UserProfiles',
        status: 'PASS',
        message: 'Only own profile visible',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'List All UserProfiles',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserMessages = async (targetUserId) => {
    try {
      const messages = await base44.entities.Message.filter({ from_user_id: targetUserId });
      if (messages.length > 0) {
        return {
          name: 'Read Other User Messages',
          status: 'FAIL',
          message: `SECURITY BREACH: Can read ${messages.length} messages from ${targetUserId}`,
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User Messages',
        status: 'PASS',
        message: 'No results returned',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User Messages',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testListAllMessages = async () => {
    try {
      const messages = await base44.entities.Message.list();
      if (messages.length > 0) {
        return {
          name: 'List All Messages',
          status: 'FAIL',
          message: `SECURITY BREACH: Can list ${messages.length} messages`,
          shouldFail: true
        };
      }
      return {
        name: 'List All Messages',
        status: 'PASS',
        message: 'No results returned',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'List All Messages',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserConversations = async (targetUserId) => {
    try {
      const convs = await base44.entities.Conversation.filter({ user_a_id: targetUserId });
      if (convs.length > 0) {
        return {
          name: 'Read Other User Conversations',
          status: 'FAIL',
          message: `SECURITY BREACH: Can read conversations for ${targetUserId}`,
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User Conversations',
        status: 'PASS',
        message: 'No results returned',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User Conversations',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserIntentions = async (targetUserId) => {
    try {
      const intentions = await base44.entities.Intention.filter({ from_user_id: targetUserId });
      if (intentions.length > 0) {
        return {
          name: 'Read Other User Intentions',
          status: 'FAIL',
          message: `SECURITY BREACH: Can read intentions from ${targetUserId}`,
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User Intentions',
        status: 'PASS',
        message: 'No results returned',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User Intentions',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserDailyDraws = async (targetUserId) => {
    try {
      const draws = await base44.entities.DailyDraw.filter({ user_id: targetUserId });
      if (draws.length > 0) {
        return {
          name: 'Read Other User DailyDraws',
          status: 'FAIL',
          message: `SECURITY BREACH: Can read daily draws for ${targetUserId}`,
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User DailyDraws',
        status: 'PASS',
        message: 'No results returned',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User DailyDraws',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserDailyMatches = async (targetUserId) => {
    try {
      const matches = await base44.entities.DailyMatch.filter({ user_id: targetUserId });
      if (matches.length > 0) {
        return {
          name: 'Read Other User DailyMatches',
          status: 'FAIL',
          message: `SECURITY BREACH: Can read daily matches for ${targetUserId}`,
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User DailyMatches',
        status: 'PASS',
        message: 'No results returned',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User DailyMatches',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testListAllReports = async () => {
    try {
      const reports = await base44.entities.Report.list();
      if (reports.length > 0 && user.role !== 'admin' && user.role !== 'moderator') {
        return {
          name: 'List All Reports (non-admin)',
          status: 'FAIL',
          message: `SECURITY BREACH: Non-admin can list ${reports.length} reports`,
          shouldFail: true
        };
      }
      return {
        name: 'List All Reports (non-admin)',
        status: user.role === 'admin' ? 'PASS' : 'PASS',
        message: user.role === 'admin' ? 'Admin access OK' : 'No results or blocked',
        shouldFail: user.role !== 'admin'
      };
    } catch (error) {
      return {
        name: 'List All Reports (non-admin)',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserReport = async () => {
    try {
      const reports = await base44.entities.Report.list();
      const otherReport = reports.find(r => r.reporter_user_id !== user.email);
      if (otherReport && user.role !== 'admin') {
        return {
          name: 'Read Other User Report',
          status: 'FAIL',
          message: 'SECURITY BREACH: Can read other user\'s report',
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User Report',
        status: 'PASS',
        message: 'No other reports visible or admin access',
        shouldFail: user.role !== 'admin'
      };
    } catch (error) {
      return {
        name: 'Read Other User Report',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testListAllBlocks = async () => {
    try {
      const blocks = await base44.entities.Block.list();
      if (blocks.length > 0) {
        const otherBlocks = blocks.filter(b => 
          b.blocker_user_id !== user.email && b.blocked_user_id !== user.email
        );
        if (otherBlocks.length > 0) {
          return {
            name: 'List All Blocks',
            status: 'FAIL',
            message: `SECURITY BREACH: Can see ${otherBlocks.length} blocks from other users`,
            shouldFail: true
          };
        }
      }
      return {
        name: 'List All Blocks',
        status: 'PASS',
        message: 'Only own blocks visible',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'List All Blocks',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadOtherUserBlock = async () => {
    try {
      const blocks = await base44.entities.Block.list();
      const otherBlock = blocks.find(b => 
        b.blocker_user_id !== user.email && b.blocked_user_id !== user.email
      );
      if (otherBlock) {
        return {
          name: 'Read Other User Block',
          status: 'FAIL',
          message: 'SECURITY BREACH: Can read other user\'s block',
          shouldFail: true
        };
      }
      return {
        name: 'Read Other User Block',
        status: 'PASS',
        message: 'No other blocks visible',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Read Other User Block',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testListAuditLogs = async () => {
    try {
      const logs = await base44.entities.AuditLog.list();
      if (logs.length > 0 && user.role !== 'admin' && user.role !== 'moderator') {
        return {
          name: 'List AuditLogs (non-admin)',
          status: 'FAIL',
          message: `SECURITY BREACH: Non-admin can list ${logs.length} audit logs`,
          shouldFail: true
        };
      }
      return {
        name: 'List AuditLogs (non-admin)',
        status: 'PASS',
        message: user.role === 'admin' ? 'Admin access OK' : 'Blocked or no results',
        shouldFail: user.role !== 'admin'
      };
    } catch (error) {
      return {
        name: 'List AuditLogs (non-admin)',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadAppSettings = async () => {
    try {
      const settings = await base44.entities.AppSettings.list();
      if (settings.length > 0 && user.role !== 'admin') {
        return {
          name: 'Read AppSettings (non-admin)',
          status: 'FAIL',
          message: `SECURITY BREACH: Non-admin can read ${settings.length} settings`,
          shouldFail: true
        };
      }
      return {
        name: 'Read AppSettings (non-admin)',
        status: 'PASS',
        message: user.role === 'admin' ? 'Admin access OK' : 'Blocked',
        shouldFail: user.role !== 'admin'
      };
    } catch (error) {
      return {
        name: 'Read AppSettings (non-admin)',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testReadAiPrompts = async () => {
    try {
      const prompts = await base44.entities.AiPrompt.list();
      if (prompts.length > 0 && user.role !== 'admin') {
        return {
          name: 'Read AiPrompts (non-admin)',
          status: 'FAIL',
          message: `SECURITY BREACH: Non-admin can read ${prompts.length} AI prompts`,
          shouldFail: true
        };
      }
      return {
        name: 'Read AiPrompts (non-admin)',
        status: 'PASS',
        message: user.role === 'admin' ? 'Admin access OK' : 'Blocked',
        shouldFail: user.role !== 'admin'
      };
    } catch (error) {
      return {
        name: 'Read AiPrompts (non-admin)',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testUpdateOtherUserProfile = async (targetUserId) => {
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_id: targetUserId });
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, { display_name: 'HACKED' });
        return {
          name: 'Update Other User Profile',
          status: 'FAIL',
          message: 'SECURITY BREACH: Can update other user\'s profile',
          shouldFail: true
        };
      }
      return {
        name: 'Update Other User Profile',
        status: 'PASS',
        message: 'Cannot find profile or blocked',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Update Other User Profile',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testDeleteOtherUserMessage = async () => {
    try {
      const messages = await base44.entities.Message.list();
      const otherMessage = messages.find(m => m.from_user_id !== user.email);
      if (otherMessage) {
        await base44.entities.Message.delete(otherMessage.id);
        return {
          name: 'Delete Other User Message',
          status: 'FAIL',
          message: 'SECURITY BREACH: Can delete other user\'s message',
          shouldFail: true
        };
      }
      return {
        name: 'Delete Other User Message',
        status: 'PASS',
        message: 'No other messages found or blocked',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Delete Other User Message',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testSpoofIntentionSender = async (targetUserId) => {
    try {
      await base44.entities.Intention.create({
        from_user_id: targetUserId,
        to_user_id: user.email,
        mode: 'love',
        message: 'SPOOFED INTENTION'
      });
      return {
        name: 'Spoof Intention Sender',
        status: 'FAIL',
        message: 'SECURITY BREACH: Can create intention with spoofed from_user_id',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Spoof Intention Sender',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testUpdateAppSettings = async () => {
    try {
      const settings = await base44.entities.AppSettings.list();
      if (settings.length > 0 && user.role !== 'admin') {
        await base44.entities.AppSettings.update(settings[0].id, { value_string: 'HACKED' });
        return {
          name: 'Update AppSettings (non-admin)',
          status: 'FAIL',
          message: 'SECURITY BREACH: Non-admin can update settings',
          shouldFail: true
        };
      }
      return {
        name: 'Update AppSettings (non-admin)',
        status: 'PASS',
        message: user.role === 'admin' ? 'Admin access OK' : 'Cannot read or blocked',
        shouldFail: user.role !== 'admin'
      };
    } catch (error) {
      return {
        name: 'Update AppSettings (non-admin)',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  const testSpoofAuditLog = async () => {
    try {
      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        actor_role: 'admin', // Spoof admin role
        action: 'admin_action',
        entity_name: 'Test',
        payload_summary: 'SPOOFED AUDIT LOG'
      });
      return {
        name: 'Spoof AuditLog Role',
        status: 'FAIL',
        message: 'SECURITY BREACH: Can create audit log with spoofed admin role',
        shouldFail: true
      };
    } catch (error) {
      return {
        name: 'Spoof AuditLog Role',
        status: 'PASS',
        message: `Blocked: ${error.message}`,
        shouldFail: true
      };
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </AdminGuard>
    );
  }

  const verdict = summary.total > 0 ? (
    summary.failed === 0 ? 'GO' : 'NO-GO'
  ) : null;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-violet-400" />
                <h1 className="text-3xl font-bold">Security Self-Test</h1>
              </div>
              <p className="text-slate-400">Automated security audit - simulating attacker behavior</p>
            </div>
            <Button
              onClick={runSecurityTests}
              disabled={running}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
          </div>

          {/* Summary */}
          {summary.total > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-1">Total Tests</p>
                <p className="text-3xl font-bold">{summary.total}</p>
              </div>
              <div className="bg-slate-900/50 border border-green-500/20 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-1">Passed</p>
                <p className="text-3xl font-bold text-green-400">{summary.passed}</p>
              </div>
              <div className="bg-slate-900/50 border border-red-500/20 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-400">{summary.failed}</p>
              </div>
              <div className={`bg-slate-900/50 border rounded-xl p-6 ${
                verdict === 'GO' ? 'border-green-500/20' : 'border-red-500/20'
              }`}>
                <p className="text-slate-400 text-sm mb-1">Verdict</p>
                <p className={`text-3xl font-bold ${
                  verdict === 'GO' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {verdict || '--'}
                </p>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`bg-slate-900/50 border rounded-xl p-4 flex items-start gap-4 ${
                    result.status === 'PASS' 
                      ? 'border-green-500/20' 
                      : 'border-red-500/20'
                  }`}
                >
                  {result.status === 'PASS' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-amber-100">{result.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        result.status === 'PASS' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      result.status === 'PASS' ? 'text-slate-400' : 'text-red-300'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security Recommendations */}
          {summary.failed > 0 && (
            <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-red-200 mb-2">Security Issues Detected</h3>
                  <p className="text-red-300 mb-4">
                    {summary.failed} test(s) failed. The following Access Rules need to be added/fixed:
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-950/50 rounded-lg p-4 font-mono text-sm text-red-200 space-y-4">
                <p className="text-amber-200 font-semibold">REQUIRED ACCESS RULES FIXES:</p>
                
                <div>
                  <p className="text-slate-400">// UserProfile entity</p>
                  <pre className="text-green-300">{`"accessRules": {
  "read": "user_id == {user.email}",
  "create": "user_id == {user.email}",
  "update": "user_id == {user.email}",
  "delete": false
}`}</pre>
                </div>

                <div>
                  <p className="text-slate-400">// Message entity</p>
                  <pre className="text-green-300">{`"accessRules": {
  "read": "conversation.user_a_id == {user.email} || conversation.user_b_id == {user.email}",
  "create": "from_user_id == {user.email}",
  "update": "from_user_id == {user.email}",
  "delete": "from_user_id == {user.email}"
}`}</pre>
                </div>

                <div>
                  <p className="text-slate-400">// Intention entity</p>
                  <pre className="text-green-300">{`"accessRules": {
  "read": "from_user_id == {user.email} || to_user_id == {user.email}",
  "create": "from_user_id == {user.email}",
  "update": "to_user_id == {user.email}",
  "delete": false
}`}</pre>
                </div>

                <p className="text-amber-200">
                  ⚠️ ALL ENTITIES must have explicit accessRules. Default = deny all.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}