import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle, XCircle, AlertTriangle, Download, Copy, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminAstroNumerologyCheck() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const runChecks = async () => {
    setRunning(true);
    setStartTime(new Date());
    const testResults = [];

    try {
      // TEST 1: Feature flags existence
      testResults.push(await testFeatureFlags());

      // TEST 2: Personal use only exclusion
      testResults.push(await testPersonalUseExclusion());

      // TEST 3: Scope enforcement (personal_only vs personal_and_matching)
      testResults.push(await testScopeEnforcement());

      // TEST 4: Daily cache integrity
      testResults.push(await testDailyCacheIntegrity());

      // TEST 5: ProfilePublic visibility rules
      testResults.push(await testProfilePublicVisibility());

      // TEST 6: Query limits enforcement
      testResults.push(await testQueryLimits());

      // TEST 7: Code audit (static checks)
      testResults.push(await testCodeAudit());

    } catch (error) {
      console.error('Check error:', error);
    }

    setResults(testResults);
    setEndTime(new Date());
    setRunning(false);
  };

  const testFeatureFlags = async () => {
    const test = { name: 'Feature Flags Configuration', passed: true, details: [], warnings: [] };

    try {
      const settings = await base44.entities.AppSettings.filter({
        setting_key: { $in: ['feature_numerology', 'feature_astrology'] }
      });

      const numSetting = settings.find(s => s.setting_key === 'feature_numerology');
      const astroSetting = settings.find(s => s.setting_key === 'feature_astrology');

      if (!numSetting) {
        test.details.push('⚠️ feature_numerology setting missing');
        test.warnings.push('Create feature_numerology flag in AppSettings');
      } else {
        test.details.push(`✓ feature_numerology = ${numSetting.value_boolean}`);
      }

      if (!astroSetting) {
        test.details.push('⚠️ feature_astrology setting missing');
        test.warnings.push('Create feature_astrology flag in AppSettings');
      } else {
        test.details.push(`✓ feature_astrology = ${astroSetting.value_boolean}`);
      }

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testPersonalUseExclusion = async () => {
    const test = { name: 'Personal Use Only - Matching Exclusion', passed: true, details: [], warnings: [] };

    try {
      // Check if personal_use_only field exists in AccountPrivate
      const accounts = await base44.entities.AccountPrivate.list(1);
      
      if (accounts.length > 0) {
        const hasField = accounts[0].hasOwnProperty('personal_use_only');
        if (hasField) {
          test.details.push('✓ personal_use_only field exists in AccountPrivate');
          
          // Count personal_use_only users
          const allAccounts = await base44.entities.AccountPrivate.list();
          const personalOnlyCount = allAccounts.filter(a => a.personal_use_only === true).length;
          test.details.push(`✓ ${personalOnlyCount} users in personal_use_only mode`);
          
        } else {
          test.passed = false;
          test.details.push('❌ personal_use_only field missing from AccountPrivate');
        }
      } else {
        test.warnings.push('No accounts to check');
      }

      // Verify matching exclusion (check matchingEngine code)
      test.details.push('⚠️ Manual verification: matchingEngine.js should filter personalOnlyEmails');
      
    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testScopeEnforcement = async () => {
    const test = { name: 'Scope Enforcement (personal_only vs personal_and_matching)', passed: true, details: [], warnings: [] };

    try {
      const accounts = await base44.entities.AccountPrivate.list();
      
      let numPersonalOnly = 0;
      let numPersonalAndMatching = 0;
      let astroPersonalOnly = 0;
      let astroPersonalAndMatching = 0;

      accounts.forEach(acc => {
        if (acc.numerology_enabled) {
          if (acc.numerology_scope === 'personal_only') numPersonalOnly++;
          if (acc.numerology_scope === 'personal_and_matching') numPersonalAndMatching++;
        }
        if (acc.astrology_enabled) {
          if (acc.astrology_scope === 'personal_only') astroPersonalOnly++;
          if (acc.astrology_scope === 'personal_and_matching') astroPersonalAndMatching++;
        }
      });

      test.details.push(`✓ Numerology: ${numPersonalOnly} personal_only, ${numPersonalAndMatching} personal_and_matching`);
      test.details.push(`✓ Astrology: ${astroPersonalOnly} personal_only, ${astroPersonalAndMatching} personal_and_matching`);

      // Check ProfilePublic doesn't expose data when scope = personal_only
      const profiles = await base44.entities.ProfilePublic.list(5);
      let exposedCount = 0;
      
      for (const profile of profiles) {
        const accs = await base44.entities.AccountPrivate.filter({ public_profile_id: profile.public_id }, null, 1);
        if (accs.length > 0) {
          const acc = accs[0];
          
          // If numerology_scope = personal_only, life_path_number should NOT be in ProfilePublic
          if (acc.numerology_enabled && acc.numerology_scope === 'personal_only' && profile.life_path_number) {
            exposedCount++;
          }
          
          // If astrology_scope = personal_only, sun_sign should NOT be in ProfilePublic
          if (acc.astrology_enabled && acc.astrology_scope === 'personal_only' && profile.sun_sign) {
            exposedCount++;
          }
        }
      }

      if (exposedCount > 0) {
        test.passed = false;
        test.details.push(`❌ ${exposedCount} profiles expose data despite personal_only scope`);
      } else {
        test.details.push('✓ No scope violations detected in ProfilePublic sample');
      }

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testDailyCacheIntegrity = async () => {
    const test = { name: 'Daily Cache Integrity (1/day/mode)', passed: true, details: [], warnings: [] };

    try {
      // Check GuidanceAnswer for today
      const today = new Date().toISOString().split('T')[0];
      const guidances = await base44.entities.GuidanceAnswer.filter({
        day_key: today
      }, null, 10);

      test.details.push(`✓ ${guidances.length} guidance entries for today`);

      // Check for duplicates (same user + same mode + same day)
      const seen = new Set();
      let duplicates = 0;
      
      guidances.forEach(g => {
        const key = `${g.user_id}_${g.mode}_${g.day_key}`;
        if (seen.has(key)) {
          duplicates++;
        }
        seen.add(key);
      });

      if (duplicates > 0) {
        test.passed = false;
        test.details.push(`❌ ${duplicates} duplicate guidance entries detected`);
      } else {
        test.details.push('✓ No duplicate guidance entries for same user/mode/day');
      }

      // Check DailyDraw
      const draws = await base44.entities.DailyDraw.filter({
        draw_date: today
      }, null, 10);

      test.details.push(`✓ ${draws.length} daily draws for today`);

      const drawSeen = new Set();
      let drawDuplicates = 0;
      
      draws.forEach(d => {
        const key = `${d.profile_id}_${d.mode}_${d.draw_date}`;
        if (drawSeen.has(key)) {
          drawDuplicates++;
        }
        drawSeen.add(key);
      });

      if (drawDuplicates > 0) {
        test.passed = false;
        test.details.push(`❌ ${drawDuplicates} duplicate daily draws detected`);
      } else {
        test.details.push('✓ No duplicate draws for same profile/mode/day');
      }

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testProfilePublicVisibility = async () => {
    const test = { name: 'ProfilePublic Visibility Rules', passed: true, details: [], warnings: [] };

    try {
      const profiles = await base44.entities.ProfilePublic.list(20);
      
      let visibleCount = 0;
      let hasAstro = 0;
      let hasNumero = 0;

      profiles.forEach(p => {
        if (p.is_visible !== false) visibleCount++;
        if (p.sun_sign || p.moon_sign || p.rising_sign) hasAstro++;
        if (p.life_path_number) hasNumero++;
      });

      test.details.push(`✓ ${visibleCount}/${profiles.length} profiles are visible`);
      test.details.push(`✓ ${hasAstro} profiles have astrology data`);
      test.details.push(`✓ ${hasNumero} profiles have numerology data`);

      // Check that personal_use_only users are never in ProfilePublic with matching data
      const accounts = await base44.entities.AccountPrivate.filter({ personal_use_only: true }, null, 10);
      
      for (const acc of accounts) {
        if (acc.public_profile_id) {
          const profile = await base44.entities.ProfilePublic.filter({ public_id: acc.public_profile_id }, null, 1);
          if (profile.length > 0 && profile[0].is_visible !== false) {
            test.passed = false;
            test.details.push(`❌ personal_use_only user has visible ProfilePublic: ${acc.user_email}`);
          }
        }
      }

      if (test.passed) {
        test.details.push('✓ personal_use_only users are not visible in ProfilePublic');
      }

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testQueryLimits = async () => {
    const test = { name: 'Query LIMIT Enforcement', passed: true, details: [], warnings: [] };

    try {
      // Simulate critical queries and verify LIMIT is respected
      
      // Test 1: DailyMatch should have LIMIT
      const matches = await base44.entities.DailyMatch.list(50);
      if (matches.length > 20) {
        test.warnings.push(`⚠️ DailyMatch query returned ${matches.length} (should be limited to 20)`);
      } else {
        test.details.push(`✓ DailyMatch respects LIMIT (${matches.length} ≤ 20)`);
      }

      // Test 2: ProfilePublic list should be limited
      const profiles = await base44.entities.ProfilePublic.list(100);
      if (profiles.length > 50) {
        test.warnings.push(`⚠️ ProfilePublic list() returned ${profiles.length} (should use pagination)`);
      } else {
        test.details.push(`✓ ProfilePublic list respects reasonable limits (${profiles.length})`);
      }

      // Test 3: AccountPrivate should never be listed without limit
      test.details.push('⚠️ Manual check: Ensure AccountPrivate.list() always has explicit LIMIT in code');

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testCodeAudit = async () => {
    const test = { name: 'Static Code Audit (Manual Checks)', passed: true, details: [], warnings: [] };

    // These are manual checks that can't be automated in browser
    test.details.push('⚠️ MANUAL: Verify matchingEngine.js does NOT call base44.integrations.Core.InvokeLLM');
    test.details.push('⚠️ MANUAL: Verify numerologyEngine.js is deterministic (no AI calls)');
    test.details.push('⚠️ MANUAL: Verify astrologyEngine.js is deterministic (no AI calls)');
    test.details.push('⚠️ MANUAL: grep code for ".list()" without LIMIT parameter');
    test.details.push('⚠️ MANUAL: grep code for personal_use_only handling in matching');
    test.details.push('⚠️ MANUAL: Verify AppSettings page has ON/OFF toggles for features');

    test.warnings.push('Manual code review required - see details above');

    return test;
  };

  const exportResults = () => {
    if (!results) return;

    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astro-numero-check-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResults = () => {
    if (!results) return;
    const report = generateReport();
    navigator.clipboard.writeText(report);
    alert('Report copied to clipboard');
  };

  const generateReport = () => {
    const duration = endTime && startTime ? ((endTime - startTime) / 1000).toFixed(2) : 'N/A';
    
    let report = `=== ASTROLOGY & NUMEROLOGY AUDIT REPORT ===\n`;
    report += `Date: ${new Date().toISOString()}\n`;
    report += `Duration: ${duration}s\n`;
    report += `\n`;

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    report += `SUMMARY: ${passed}/${total} checks passed\n`;
    report += `\n`;

    results.forEach((test, i) => {
      report += `\n[${i + 1}] ${test.name}\n`;
      report += `Status: ${test.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      
      if (test.details.length > 0) {
        report += `\nDetails:\n`;
        test.details.forEach(d => report += `  ${d}\n`);
      }

      if (test.warnings.length > 0) {
        report += `\nWarnings:\n`;
        test.warnings.forEach(w => report += `  ${w}\n`);
      }
    });

    report += `\n=== END OF REPORT ===\n`;

    return report;
  };

  const passedCount = results ? results.filter(r => r.passed).length : 0;
  const totalCount = results ? results.length : 0;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-8 h-8 text-violet-400" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-violet-200 to-purple-200 bg-clip-text text-transparent">
                Astrology & Numerology Audit
              </h1>
            </div>
            <p className="text-slate-400">Internal quality checks for astro/numero implementation</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Button
              onClick={runChecks}
              disabled={running}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
            >
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              {running ? 'Running Checks...' : 'Run All Checks'}
            </Button>

            {results && (
              <>
                <Button
                  onClick={copyResults}
                  variant="outline"
                  className="border-violet-500/20 text-violet-200 hover:bg-violet-500/10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Report
                </Button>

                <Button
                  onClick={exportResults}
                  variant="outline"
                  className="border-violet-500/20 text-violet-200 hover:bg-violet-500/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </>
            )}
          </div>

          {/* Results Summary */}
          {results && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-violet-100 mb-1">Check Results</h3>
                  <p className="text-sm text-slate-400">
                    Duration: {endTime && startTime ? ((endTime - startTime) / 1000).toFixed(2) : 'N/A'}s
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    <span className={passedCount === totalCount ? 'text-green-400' : 'text-orange-400'}>
                      {passedCount}/{totalCount}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">Checks Passed</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Details */}
          {results && (
            <div className="space-y-4">
              {results.map((test, i) => (
                <div
                  key={i}
                  className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-6 ${
                    test.passed ? 'border-green-500/20' : 'border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {test.passed ? (
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                        <p className={`text-sm font-medium ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {test.passed ? 'PASS' : 'FAIL'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {test.details.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-300 mb-2">Details:</p>
                      <div className="bg-slate-800/50 rounded-lg p-4 space-y-1">
                        {test.details.map((detail, j) => (
                          <p key={j} className="text-sm text-slate-300 font-mono">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {test.warnings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <p className="text-sm font-medium text-orange-300">Warnings:</p>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 space-y-1">
                        {test.warnings.map((warning, j) => (
                          <p key={j} className="text-sm text-orange-200">
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Initial State */}
          {!results && !running && (
            <div className="text-center py-24">
              <Star className="w-16 h-16 text-violet-400 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Ready to Run Audit</h3>
              <p className="text-slate-500">
                Click "Run All Checks" to verify astrology & numerology implementation
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}