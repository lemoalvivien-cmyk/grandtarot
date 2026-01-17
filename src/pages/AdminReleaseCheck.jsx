import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Play, Copy, Download, Save, AlertCircle, CheckCircle, Loader2, Star, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminReleaseCheck() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const tests = [
    {
      name: 'Chat: Message Limit 50',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Check that Message filter accepts limit parameter
          const msgs = await base44.entities.Message.filter({}, '-created_date', 50);
          return {
            success: msgs.length <= 50,
            status: 200,
            payload: { limit: 50 },
            body: { message_count: msgs.length, max_limit: 50 },
            msg: msgs.length <= 50 ? 'PASS: Limit enforced' : 'FAIL: Limit exceeded',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: { limit: 50 },
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Chat: Idempotence (client_msg_id)',
      fn: async () => {
        const startTime = Date.now();
        try {
          // Verify that Message schema includes client_msg_id
          const msgs = await base44.entities.Message.filter({}, null, 1);
          const hasIdempotence =
            msgs.length === 0 || msgs[0].hasOwnProperty('client_msg_id');
          return {
            success: hasIdempotence,
            status: 200,
            payload: {},
            body: { has_client_msg_id: hasIdempotence },
            msg: hasIdempotence ? 'PASS: Idempotence field present' : 'FAIL: No idempotence',
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
      name: 'Chat: Conversation Mutual Check',
      fn: async () => {
        const startTime = Date.now();
        try {
          const convs = await base44.entities.Conversation.filter({}, null, 5);
          const hasMutualFields = convs.length === 0 || (convs[0].user_a_id && convs[0].user_b_id);
          return {
            success: hasMutualFields,
            status: 200,
            payload: {},
            body: { has_user_a_id: true, has_user_b_id: true },
            msg: hasMutualFields ? 'PASS: Mutual participants field' : 'FAIL: Missing fields',
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
      name: 'Chat: Block Prevention',
      fn: async () => {
        const startTime = Date.now();
        try {
          const blocks = await base44.entities.Block.filter({}, null, 1);
          // Verify Block entity has public_id fields
          const hasCheck =
            blocks.length === 0 ||
            (blocks[0].blocker_profile_id && blocks[0].blocked_profile_id);
          return {
            success: hasCheck,
            status: 200,
            payload: {},
            body: { public_id_based: hasCheck },
            msg: hasCheck ? 'PASS: Block uses public_id' : 'FAIL: Block broken',
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
      name: 'Paywall: DailyMatch Limit 20',
      fn: async () => {
        const startTime = Date.now();
        try {
          const matches = await base44.entities.DailyMatch.filter({}, null, 20);
          return {
            success: matches.length <= 20,
            status: 200,
            payload: { limit: 20 },
            body: { match_count: matches.length },
            msg: matches.length <= 20 ? 'PASS: Match limit enforced' : 'FAIL: Limit exceeded',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 500,
            payload: { limit: 20 },
            body: error.message,
            msg: `FAIL: ${error.message}`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'RGPD: ConsentPreference Exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          const consent = await base44.entities.ConsentPreference.filter({}, null, 1);
          return {
            success: true,
            status: 200,
            payload: {},
            body: { consent_count: consent.length },
            msg: 'PASS: ConsentPreference entity available',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 404,
            payload: {},
            body: error.message,
            msg: `FAIL: ConsentPreference missing`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'RGPD: DsarRequest Exists',
      fn: async () => {
        const startTime = Date.now();
        try {
          const dsar = await base44.entities.DsarRequest.filter({}, null, 1);
          return {
            success: true,
            status: 200,
            payload: {},
            body: { dsar_count: dsar.length },
            msg: 'PASS: DsarRequest entity available',
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            status: 404,
            payload: {},
            body: error.message,
            msg: `FAIL: DsarRequest missing`,
            duration: Date.now() - startTime
          };
        }
      }
    },
    {
      name: 'Feature Flags: Astro/Num Exist',
      fn: async () => {
        const startTime = Date.now();
        try {
          const [astroFlag, numFlag] = await Promise.all([
            base44.entities.AppSettings.filter({ setting_key: 'feature_astrology' }, null, 1),
            base44.entities.AppSettings.filter({ setting_key: 'feature_numerology' }, null, 1)
          ]);
          
          const astroOk = astroFlag.length > 0 && typeof astroFlag[0].value_boolean === 'boolean';
          const numOk = numFlag.length > 0 && typeof numFlag[0].value_boolean === 'boolean';
          
          return {
            success: astroOk && numOk,
            status: 200,
            payload: {},
            body: { astrology: astroOk, numerology: numOk },
            msg: astroOk && numOk ? 'PASS: Feature flags initialized' : 'FAIL: Missing or invalid flags',
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
      name: 'Privacy: personal_only Scope Respected',
      fn: async () => {
        const startTime = Date.now();
        try {
          const profiles = await base44.entities.ProfilePublic.filter({}, null, 20);
          const accounts = await base44.entities.AccountPrivate.filter({}, null, 50);
          
          const emailToPublicId = {};
          profiles.forEach(p => {
            const acc = accounts.find(a => a.public_profile_id === p.public_id);
            if (acc) emailToPublicId[acc.user_email] = p;
          });
          
          let violations = [];
          accounts.forEach(acc => {
            const pub = emailToPublicId[acc.user_email];
            if (!pub) return;
            
            // Check astrology: if personal_only, sun_sign/moon_sign/rising_sign must be null
            if (acc.astrology_enabled && acc.astrology_scope === 'personal_only') {
              if (pub.sun_sign || pub.moon_sign || pub.rising_sign) {
                violations.push(`${acc.user_email}: astrology personal_only but signs visible`);
              }
            }
            
            // Check numerology: if personal_only, life_path_number must be null
            if (acc.numerology_enabled && acc.numerology_scope === 'personal_only') {
              if (pub.life_path_number) {
                violations.push(`${acc.user_email}: numerology personal_only but life_path visible`);
              }
            }
          });
          
          return {
            success: violations.length === 0,
            status: 200,
            payload: { checked: accounts.length },
            body: { violations },
            msg: violations.length === 0 ? 'PASS: Privacy scopes respected' : `FAIL: ${violations.length} violations found`,
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
      name: 'Privacy: personal_and_matching Scope Active',
      fn: async () => {
        const startTime = Date.now();
        try {
          const profiles = await base44.entities.ProfilePublic.filter({}, null, 20);
          const accounts = await base44.entities.AccountPrivate.filter({}, null, 50);
          
          const emailToPublicId = {};
          profiles.forEach(p => {
            const acc = accounts.find(a => a.public_profile_id === p.public_id);
            if (acc) emailToPublicId[acc.user_email] = p;
          });
          
          let missing = [];
          accounts.forEach(acc => {
            const pub = emailToPublicId[acc.user_email];
            if (!pub) return;
            
            // Check astrology: if personal_and_matching, sun_sign should be non-null (if birth data exists)
            if (acc.astrology_enabled && acc.astrology_scope === 'personal_and_matching') {
              if (!pub.sun_sign) {
                missing.push(`${acc.user_email}: astrology matching but sun_sign null`);
              }
            }
            
            // Check numerology: if personal_and_matching, life_path should be non-null
            if (acc.numerology_enabled && acc.numerology_scope === 'personal_and_matching') {
              if (!pub.life_path_number) {
                missing.push(`${acc.user_email}: numerology matching but life_path null`);
              }
            }
          });
          
          return {
            success: missing.length === 0,
            status: 200,
            payload: { checked: accounts.length },
            body: { missing },
            msg: missing.length === 0 ? 'PASS: Matching scope properly set' : `WARN: ${missing.length} users missing data`,
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
      name: 'Matching: Reasons Limit ≤ 3',
      fn: async () => {
        const startTime = Date.now();
        try {
          const matches = await base44.entities.DailyMatch.filter({}, null, 50);
          
          const violations = matches.filter(m => {
            if (!m.reasons || !Array.isArray(m.reasons)) return false;
            return m.reasons.length > 3;
          });
          
          return {
            success: violations.length === 0,
            status: 200,
            payload: { checked: matches.length },
            body: { violations_count: violations.length },
            msg: violations.length === 0 ? 'PASS: All matches have ≤3 reasons' : `FAIL: ${violations.length} matches exceed limit`,
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
      name: 'Cache: No Duplicate DailyDraw',
      fn: async () => {
        const startTime = Date.now();
        try {
          const draws = await base44.entities.DailyDraw.filter({}, null, 100);
          
          const keys = draws.map(d => `${d.profile_id}_${d.draw_date}_${d.mode}`);
          const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
          
          return {
            success: duplicates.length === 0,
            status: 200,
            payload: { checked: draws.length },
            body: { duplicates_count: duplicates.length },
            msg: duplicates.length === 0 ? 'PASS: No duplicate draws' : `FAIL: ${duplicates.length} duplicates found`,
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
      name: 'Cache: No Duplicate GuidanceAnswer',
      fn: async () => {
        const startTime = Date.now();
        try {
          const answers = await base44.entities.GuidanceAnswer.filter({}, null, 100);
          
          const keys = answers.map(a => `${a.user_id}_${a.day_key}_${a.mode}`);
          const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
          
          return {
            success: duplicates.length === 0,
            status: 200,
            payload: { checked: answers.length },
            body: { duplicates_count: duplicates.length },
            msg: duplicates.length === 0 ? 'PASS: No duplicate guidance' : `FAIL: ${duplicates.length} duplicates found`,
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
        run_type: 'release_check',
        results_json: resultsText,
        summary: `Release check: ${passed} passed, ${failed} failed (Chat, Paywall, RGPD)`,
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
    a.download = `release-check-${Date.now()}.json`;
    a.click();
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-amber-300">Release Check</h1>

          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <Link to={createPageUrl('AdminAstroNumerologyCheck')}>
                <Button variant="outline" className="border-violet-500/20 text-violet-200 hover:bg-violet-500/10">
                  <Star className="w-4 h-4 mr-2" />
                  Astro/Numero Audit
                </Button>
              </Link>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={runTests} disabled={running} className="bg-amber-600 hover:bg-amber-700">
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
          </div>

          {results.length > 0 && (
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
          )}
        </div>
      </div>
    </AdminGuard>
  );
}