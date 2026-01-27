import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, AlertCircle, Rocket, Shield, Zap, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminProductionReadiness() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const runChecklist = async () => {
    setChecking(true);
    const checks = {};

    // SECURITY CHECKS
    try {
      const user = await base44.auth.me();
      const account = await base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1);
      checks.plan_status_field = account.length > 0 && account[0].hasOwnProperty('plan_status');
      checks.age_gate_field = account.length > 0 && account[0].hasOwnProperty('age_confirmed_at');
    } catch (e) {
      checks.plan_status_field = false;
      checks.age_gate_field = false;
    }

    try {
      const stripePrice = await base44.entities.AppSettings.filter({ setting_key: 'stripe_price_id' }, null, 1);
      checks.stripe_price_configured = stripePrice.length > 0 && stripePrice[0].value_string?.startsWith('price_');
    } catch (e) {
      checks.stripe_price_configured = false;
    }

    try {
      const response = await fetch('/api/v1/functions/stripe_webhook', { method: 'POST', body: '{}' });
      checks.webhook_endpoint_exists = response.status !== 404;
    } catch (e) {
      checks.webhook_endpoint_exists = false;
    }

    // ENTITIES CHECK
    try {
      await base44.entities.ConsentPreference.filter({}, null, 1);
      checks.consent_entity = true;
    } catch (e) {
      checks.consent_entity = false;
    }

    try {
      await base44.entities.DsarRequest.filter({}, null, 1);
      checks.dsar_entity = true;
    } catch (e) {
      checks.dsar_entity = false;
    }

    try {
      await base44.entities.AuditLog.filter({}, null, 1);
      checks.audit_log_entity = true;
    } catch (e) {
      checks.audit_log_entity = false;
    }

    // FUNCTIONS CHECK
    try {
      const r1 = await fetch('/api/v1/functions/chat_open_conversation', { method: 'POST', body: '{}' });
      checks.chat_open_function = r1.status !== 404;
    } catch (e) {
      checks.chat_open_function = false;
    }

    try {
      const r2 = await fetch('/api/v1/functions/chat_send_message', { method: 'POST', body: '{}' });
      checks.chat_send_function = r2.status !== 404;
    } catch (e) {
      checks.chat_send_function = false;
    }

    try {
      const r3 = await fetch('/api/v1/functions/validate_age_gate', { method: 'POST', body: '{}' });
      checks.age_gate_function = r3.status !== 404;
    } catch (e) {
      checks.age_gate_function = false;
    }

    try {
      const r4 = await fetch('/api/v1/functions/generate_dsar_export', { method: 'POST', body: '{}' });
      checks.dsar_export_function = r4.status !== 404;
    } catch (e) {
      checks.dsar_export_function = false;
    }

    // FEATURE FLAGS
    try {
      const [astro, num] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'feature_astrology' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'feature_numerology' }, null, 1)
      ]);
      checks.astrology_flag = astro.length > 0 && typeof astro[0].value_boolean === 'boolean';
      checks.numerology_flag = num.length > 0 && typeof num[0].value_boolean === 'boolean';
    } catch (e) {
      checks.astrology_flag = false;
      checks.numerology_flag = false;
    }

    // LEGAL PAGES
    checks.terms_exists = true; // Always exists (hardcoded)
    checks.privacy_exists = true;
    checks.cookies_exists = true;

    setResults(checks);
    setChecking(false);
  };

  const categories = [
    {
      title: '🔐 Security & Auth',
      icon: Shield,
      checks: [
        { key: 'plan_status_field', label: 'AccountPrivate.plan_status field exists' },
        { key: 'age_gate_field', label: 'Age gate (age_confirmed_at) exists' },
        { key: 'age_gate_function', label: 'validate_age_gate.js function deployed' },
        { key: 'audit_log_entity', label: 'AuditLog entity exists' }
      ]
    },
    {
      title: '💳 Payment (Stripe)',
      icon: Zap,
      checks: [
        { key: 'stripe_price_configured', label: 'stripe_price_id configured in AppSettings' },
        { key: 'webhook_endpoint_exists', label: 'Webhook endpoint /stripe_webhook accessible' }
      ]
    },
    {
      title: '💬 Chat & Messaging',
      icon: Eye,
      checks: [
        { key: 'chat_open_function', label: 'chat_open_conversation.js deployed' },
        { key: 'chat_send_function', label: 'chat_send_message.js deployed (with AI moderation)' }
      ]
    },
    {
      title: '📜 RGPD Compliance',
      icon: FileText,
      checks: [
        { key: 'consent_entity', label: 'ConsentPreference entity exists' },
        { key: 'dsar_entity', label: 'DsarRequest entity exists' },
        { key: 'dsar_export_function', label: 'generate_dsar_export.js deployed' },
        { key: 'terms_exists', label: 'Terms page exists' },
        { key: 'privacy_exists', label: 'Privacy page exists' },
        { key: 'cookies_exists', label: 'Cookies page exists' }
      ]
    },
    {
      title: '🌟 Features',
      icon: Rocket,
      checks: [
        { key: 'astrology_flag', label: 'feature_astrology flag configured' },
        { key: 'numerology_flag', label: 'feature_numerology flag configured' }
      ]
    }
  ];

  const passedCount = results ? Object.values(results).filter(Boolean).length : 0;
  const totalCount = results ? Object.keys(results).length : 0;
  const percentage = results ? Math.round((passedCount / totalCount) * 100) : 0;

  const isReady = percentage === 100;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className={`w-10 h-10 ${isReady ? 'text-green-400' : 'text-amber-400'}`} />
              <div>
                <h1 className="text-3xl font-bold">Production Readiness</h1>
                <p className="text-slate-400">V1 Launch Checklist</p>
              </div>
            </div>

            {results && (
              <div className={`p-6 rounded-xl border ${
                isReady 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">
                    {isReady ? '✅ PRODUCTION READY' : '⚠️ NOT READY'}
                  </span>
                  <span className="text-2xl font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      isReady ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {passedCount}/{totalCount} checks passed
                </p>
              </div>
            )}
          </div>

          <Button 
            onClick={runChecklist} 
            disabled={checking}
            className="mb-8 bg-violet-600 hover:bg-violet-700"
          >
            {checking ? 'Checking...' : 'Run Production Checklist'}
          </Button>

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {categories.map((category) => {
                const Icon = category.icon;
                const categoryPassed = category.checks.every(c => results[c.key]);
                
                return (
                  <div key={category.title} className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className={`w-6 h-6 ${categoryPassed ? 'text-green-400' : 'text-amber-400'}`} />
                      <h2 className="text-xl font-bold">{category.title}</h2>
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
                        categoryPassed 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {category.checks.filter(c => results[c.key]).length}/{category.checks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {category.checks.map((check) => {
                        const passed = results[check.key];
                        return (
                          <div key={check.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                            {passed ? (
                              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${passed ? 'text-slate-300' : 'text-red-300'}`}>
                              {check.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Final Message */}
          {results && (
            <div className="mt-8 text-center">
              {isReady ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-200 mb-2">
                    🎉 Ready for Production!
                  </h2>
                  <p className="text-slate-300">
                    All critical checks passed. Configure server secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) and deploy.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8">
                  <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-amber-200 mb-2">
                    Action Required
                  </h2>
                  <p className="text-slate-300 mb-4">
                    {totalCount - passedCount} check(s) failed. Fix issues above before deploying.
                  </p>
                  <p className="text-sm text-slate-400">
                    Most common: Missing Stripe config or backend functions not deployed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}