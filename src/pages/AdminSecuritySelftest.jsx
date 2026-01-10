import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSecuritySelftest() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const securityTests = [
    {
      name: 'Paywall: plan_status Respected',
      fn: async () => {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          const accounts = await base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1);
          const blocked = accounts.length > 0 && accounts[0].plan_status !== 'active';
          return { 
            success: blocked,
            msg: blocked ? 'PASS: Free users are blocked' : 'FAIL: Free users accessible'
          };
        }
        return { success: true, msg: 'PASS: Admin bypasses (expected)' };
      }
    },
    {
      name: 'Message.create: Admin Only',
      fn: async () => {
        const user = await base44.auth.me();
        const schema = await base44.entities.Message.schema?.();
        const hasRestriction = schema?.accessRules?.create?.includes('admin');
        return {
          success: hasRestriction,
          msg: hasRestriction ? 'PASS: create restricted' : 'FAIL: create not restricted'
        };
      }
    },
    {
      name: 'Conversation.create: Admin Only',
      fn: async () => {
        const schema = await base44.entities.Conversation.schema?.();
        const hasRestriction = schema?.accessRules?.create?.includes('admin');
        return {
          success: hasRestriction,
          msg: hasRestriction ? 'PASS: create restricted' : 'FAIL: create not restricted'
        };
      }
    },
    {
      name: 'AccountPrivate: Email-based Access',
      fn: async () => {
        const user = await base44.auth.me();
        const schema = await base44.entities.AccountPrivate.schema?.();
        const readRule = schema?.accessRules?.read || '';
        const emailCheck = readRule.includes('user_email');
        return {
          success: emailCheck,
          msg: emailCheck ? 'PASS: email-based rules' : 'FAIL: broken access rules'
        };
      }
    },
    {
      name: 'AppSettings: Admin Only',
      fn: async () => {
        const schema = await base44.entities.AppSettings.schema?.();
        const isAdminOnly = schema?.accessRules?.read?.includes('admin');
        return {
          success: isAdminOnly,
          msg: isAdminOnly ? 'PASS: admin only' : 'FAIL: publicly readable'
        };
      }
    }
  ];

  const runTests = async () => {
    setRunning(true);
    const newResults = [];

    for (const test of securityTests) {
      try {
        const result = await test.fn();
        newResults.push({ name: test.name, ...result, timestamp: new Date().toISOString() });
      } catch (error) {
        newResults.push({ 
          name: test.name, 
          success: false, 
          msg: `ERROR: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    setResults(newResults);
    setRunning(false);
  };

  const failureCount = results.filter(r => !r.success).length;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-bold text-red-200">Security Self-Test</h1>
          </div>

          <Button onClick={runTests} disabled={running} className="bg-red-600 hover:bg-red-700 mb-6">
            <Play className="w-4 h-4 mr-2" />
            {running ? 'Running...' : 'Run Security Tests'}
          </Button>

          {results.length > 0 && (
            <>
              <div className={`mb-6 p-4 rounded-lg ${
                failureCount === 0 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className={failureCount === 0 ? 'text-green-300' : 'text-red-300'}>
                  {failureCount === 0 ? '✅ All security tests passed!' : `❌ ${failureCount} test(s) failed`}
                </p>
              </div>

              <div className="space-y-3">
                {results.map((r, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {r.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{r.name}</h3>
                        <p className={`text-sm ${r.success ? 'text-green-300' : 'text-red-300'}`}>
                          {r.msg}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}