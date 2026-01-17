import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Copy, Download, Save, AlertCircle, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminPaymentSmokeCheck() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const tests = [
    {
      name: 'Secrets: STRIPE_SECRET_KEY configured',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Test if backend can access secret
          const response = await fetch('/api/v1/functions/stripe_create_checkout_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              successUrl: 'https://test.com/success',
              cancelUrl: 'https://test.com/cancel'
            })
          });
          
          const result = await response.json();
          
          // Check error message for secret diagnosis
          const hasSecret = !result.error?.includes('STRIPE_SECRET_KEY not configured');
          const hasPrice = !result.error?.includes('stripe_price_id not configured');
          
          return {
            success: hasSecret,
            status: response.status,
            payload: { test: 'secret_check' },
            body: { 
              has_secret: hasSecret,
              has_price: hasPrice,
              error: result.error || null
            },
            msg: hasSecret 
              ? (hasPrice ? 'PASS: Both secret + price configured' : 'PARTIAL: Secret OK, price_id missing')
              : 'FAIL: STRIPE_SECRET_KEY not configured',
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
      name: 'AppSettings: stripe_price_id exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          const settings = await base44.entities.AppSettings.filter({
            setting_key: 'stripe_price_id'
          }, null, 1);
          
          const exists = settings.length > 0 && settings[0].value_string?.startsWith('price_');
          
          return {
            success: exists,
            status: 200,
            payload: { setting_key: 'stripe_price_id' },
            body: { 
              exists,
              value: settings.length > 0 ? settings[0].value_string : null
            },
            msg: exists 
              ? `PASS: stripe_price_id = ${settings[0].value_string}` 
              : 'FAIL: stripe_price_id missing or invalid',
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
      name: 'Webhook: stripe_webhook.js exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Test webhook endpoint (will fail auth, but proves it exists)
          const response = await fetch('/api/v1/functions/stripe_webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          
          // Expected: 400 (missing signature) = endpoint exists
          // 404 = endpoint missing
          const exists = response.status !== 404;
          
          return {
            success: exists,
            status: response.status,
            payload: {},
            body: { endpoint_exists: exists },
            msg: exists 
              ? 'PASS: Webhook endpoint accessible' 
              : 'FAIL: Webhook endpoint missing (404)',
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
      name: 'AccountPrivate: plan_status field exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          const user = await base44.auth.me();
          const accounts = await base44.entities.AccountPrivate.filter({
            user_email: user.email
          }, null, 1);
          
          const hasField = accounts.length > 0 && accounts[0].hasOwnProperty('plan_status');
          
          return {
            success: hasField,
            status: 200,
            payload: { user_email: user.email },
            body: {
              has_plan_status: hasField,
              current_value: accounts[0]?.plan_status
            },
            msg: hasField 
              ? `PASS: plan_status = ${accounts[0].plan_status}` 
              : 'FAIL: plan_status field missing',
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
      name: 'Idempotence: Event marking system',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Test if we can create/read event markers
          const testEventId = `evt_test_${Date.now()}`;
          
          await base44.entities.AppSettings.create({
            setting_key: `stripe_event_${testEventId}`,
            value_string: 'test',
            value_boolean: true,
            category: 'system',
            is_public: false
          });
          
          const check = await base44.entities.AppSettings.filter({
            setting_key: `stripe_event_${testEventId}`
          }, null, 1);
          
          const works = check.length > 0;
          
          // Clean up
          if (works) {
            await base44.entities.AppSettings.delete(check[0].id);
          }
          
          return {
            success: works,
            status: 200,
            payload: { test_event_id: testEventId },
            body: { idempotence_system_works: works },
            msg: works 
              ? 'PASS: Idempotence system functional' 
              : 'FAIL: Cannot mark events',
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
      name: 'Integration: Stripe package installed',
      fn: async () => {
        const startTime = Date.now();
        try {
          // This runs in browser, but we can check if backend can load 'stripe'
          // by testing the checkout function
          const response = await fetch('/api/v1/functions/stripe_create_checkout_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              successUrl: 'https://test.com/success',
              cancelUrl: 'https://test.com/cancel'
            })
          });
          
          const result = await response.json();
          
          // If error is about 'stripe' module not found → package missing
          const packageInstalled = !result.error?.includes('Cannot find module');
          
          return {
            success: packageInstalled,
            status: response.status,
            payload: {},
            body: { stripe_package_installed: packageInstalled },
            msg: packageInstalled 
              ? 'PASS: Stripe package available' 
              : 'FAIL: Stripe npm package not installed',
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
        run_type: 'payment_smoke_check',
        results_json: resultsText,
        summary: `Payment smoke check: ${passed} passed, ${failed} failed`,
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
    a.download = `payment-smoke-${Date.now()}.json`;
    a.click();
  };

  const failCount = results.filter(r => !r.success).length;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold text-green-300">Payment Smoke Check</h1>
          </div>

          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              ℹ️ Tests Stripe configuration (secrets, webhook, price_id, idempotence).
            </p>
            <p className="text-xs text-blue-300 mt-2">
              Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (server env)
            </p>
          </div>

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
            <>
              {failCount === 0 ? (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300">✅ All payment checks passed</p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300">❌ {failCount} test(s) failed</p>
                  <p className="text-xs text-red-400 mt-2">
                    Fix: Configure STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in server secrets
                  </p>
                </div>
              )}

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
            </>
          )}

          {/* Setup Guide */}
          {results.length > 0 && failCount > 0 && (
            <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-amber-100 mb-4">Setup Guide</h3>
              <div className="space-y-3 text-sm text-amber-200">
                <div>
                  <p className="font-semibold">1. Configure server secrets:</p>
                  <code className="block bg-slate-900 rounded px-3 py-2 mt-1 text-xs text-slate-300">
                    STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx)<br/>
                    STRIPE_WEBHOOK_SECRET=whsec_xxx
                  </code>
                </div>
                <div>
                  <p className="font-semibold">2. Create Stripe Product + Price:</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Stripe Dashboard → Products → Create (GRANDTAROT Premium) → Add price (6.90 EUR/month recurring)
                  </p>
                </div>
                <div>
                  <p className="font-semibold">3. Add price_id to AppSettings:</p>
                  <code className="block bg-slate-900 rounded px-3 py-2 mt-1 text-xs text-slate-300">
                    setting_key: stripe_price_id<br/>
                    value_string: price_xxx (copy from Stripe dashboard)
                  </code>
                </div>
                <div>
                  <p className="font-semibold">4. Configure webhook in Stripe:</p>
                  <code className="block bg-slate-900 rounded px-3 py-2 mt-1 text-xs text-slate-300">
                    Endpoint URL: https://your-domain.com/api/v1/functions/stripe_webhook<br/>
                    Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted<br/>
                    Secret: copy whsec_xxx to STRIPE_WEBHOOK_SECRET
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}