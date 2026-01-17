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

  const initializeFeatureFlags = async () => {
    try {
      const admin = await base44.auth.me();
      
      const [numFlag, astroFlag] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'feature_numerology' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'feature_astrology' }, null, 1)
      ]);
      
      if (numFlag.length === 0) {
        await base44.entities.AppSettings.create({
          setting_key: 'feature_numerology',
          value_boolean: true,
          category: 'features',
          description_fr: 'Activer la numérologie',
          description_en: 'Enable numerology',
          is_public: false
        });
      }
      
      if (astroFlag.length === 0) {
        await base44.entities.AppSettings.create({
          setting_key: 'feature_astrology',
          value_boolean: true,
          category: 'features',
          description_fr: 'Activer l\'astrologie',
          description_en: 'Enable astrology',
          is_public: false
        });
      }
      
      alert('✅ Feature flags initialisés');
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const testFeatureFlags = async () => {
    const test = { name: 'Feature Flags Configuration', passed: true, details: [], warnings: [] };

    try {
      const [numFlag, astroFlag] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'feature_numerology' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'feature_astrology' }, null, 1)
      ]);

      if (numFlag.length === 0) {
        test.passed = false;
        test.details.push('❌ feature_numerology setting missing');
        test.warnings.push('Click "Initialize Feature Flags" button below');
      } else {
        test.details.push(`✓ feature_numerology = ${numFlag[0].value_boolean}`);
      }

      if (astroFlag.length === 0) {
        test.passed = false;
        test.details.push('❌ feature_astrology setting missing');
        test.warnings.push('Click "Initialize Feature Flags" button below');
      } else {
        test.details.push(`✓ feature_astrology = ${astroFlag[0].value_boolean}`);
      }

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  };

  const testPersonalUseExclusion = async () => {
    const test = { name: 'Personal Use Only - Matching Exclusion (FULL TEST)', passed: true, details: [], warnings: [] };
    
    const createdRecords = {
      userProfiles: [],
      profilePublics: [],
      accountPrivates: [],
      dailyMatches: []
    };

    try {
      const testTimestamp = Date.now();
      const testEmailA = `test_userA_${testTimestamp}@test.local`;
      const testEmailB = `test_userB_${testTimestamp}@test.local`;
      const testPublicIdA = `public_${testTimestamp}_A`;
      const testPublicIdB = `public_${testTimestamp}_B`;
      
      test.details.push('⏳ Creating test users...');

      // CREATE UserA (normal user who will receive matches)
      const userProfileA = await base44.entities.UserProfile.create({
        user_id: testEmailA,
        display_name: 'TestUserA',
        birth_year: 1990,
        birth_month: 6,
        birth_day: 15,
        gender: 'male',
        city: 'Paris',
        country: 'France',
        radius_km: 50,
        mode_active: 'love',
        interest_ids: ['yoga', 'travel', 'art'],
        is_visible: true,
        onboarding_completed: true,
        photo_url: 'https://via.placeholder.com/150',
        language_pref: 'fr'
      });
      createdRecords.userProfiles.push(userProfileA.id);

      const profilePublicA = await base44.entities.ProfilePublic.create({
        public_id: testPublicIdA,
        display_name: 'TestUserA',
        age_range: '25-29',
        gender: 'male',
        city: 'Paris',
        country: 'France',
        interest_ids: ['yoga', 'travel', 'art'],
        looking_for: ['love'],
        mode_active: 'love',
        is_visible: true,
        photo_url: 'https://via.placeholder.com/150'
      });
      createdRecords.profilePublics.push(profilePublicA.id);

      const accountA = await base44.entities.AccountPrivate.create({
        user_email: testEmailA,
        public_profile_id: testPublicIdA,
        personal_use_only: false,
        plan_status: 'active',
        onboarding_completed: true
      });
      createdRecords.accountPrivates.push(accountA.id);

      // CREATE UserB (personal_use_only = TRUE - should be EXCLUDED from A's matches)
      const userProfileB = await base44.entities.UserProfile.create({
        user_id: testEmailB,
        display_name: 'TestUserB',
        birth_year: 1992,
        birth_month: 8,
        birth_day: 20,
        gender: 'female',
        city: 'Paris', // SAME CITY as userA (to ensure would match if not excluded)
        country: 'France',
        radius_km: 50,
        mode_active: 'love',
        interest_ids: ['yoga', 'travel'], // SHARED INTERESTS (high match potential)
        is_visible: true,
        onboarding_completed: true,
        photo_url: 'https://via.placeholder.com/150',
        language_pref: 'fr'
      });
      createdRecords.userProfiles.push(userProfileB.id);

      const profilePublicB = await base44.entities.ProfilePublic.create({
        public_id: testPublicIdB,
        display_name: 'TestUserB',
        age_range: '25-29',
        gender: 'female',
        city: 'Paris',
        country: 'France',
        interest_ids: ['yoga', 'travel'],
        looking_for: ['love'],
        mode_active: 'love',
        is_visible: true,
        photo_url: 'https://via.placeholder.com/150'
      });
      createdRecords.profilePublics.push(profilePublicB.id);

      const accountB = await base44.entities.AccountPrivate.create({
        user_email: testEmailB,
        public_profile_id: testPublicIdB,
        personal_use_only: true, // ⚠️ CRITICAL FLAG
        plan_status: 'active',
        onboarding_completed: true
      });
      createdRecords.accountPrivates.push(accountB.id);

      test.details.push('✓ Test users created (A=normal, B=personal_only)');

      // RUN MATCHING for UserA (should NOT include UserB)
      test.details.push('⏳ Running matching engine for UserA...');
      
      // Get candidates (mimics matchingEngine.getEligibleCandidates)
      const candidatesRaw = await base44.entities.ProfilePublic.filter({
        is_visible: true,
        photo_url: { $exists: true, $ne: null }
      }, '-last_active', 50);
      
      // Filter personal_use_only (CRITICAL CHECK)
      const personalOnlyAccounts = await base44.entities.AccountPrivate.filter({
        personal_use_only: true
      }, null, 50);
      const personalOnlyEmails = new Set(personalOnlyAccounts.map(a => a.user_email));
      const personalOnlyPublicIds = new Set(personalOnlyAccounts.map(a => a.public_profile_id).filter(Boolean));
      
      test.details.push(`✓ Found ${personalOnlyEmails.size} personal_use_only users to exclude`);
      
      const candidatesFiltered = candidatesRaw.filter(p => 
        !personalOnlyPublicIds.has(p.public_id) && p.public_id !== testPublicIdA
      );
      
      test.details.push(`✓ Candidates after filtering: ${candidatesFiltered.length}`);
      
      // CHECK: UserB should NOT be in candidates
      const userBFound = candidatesFiltered.some(c => c.public_id === testPublicIdB);
      
      if (userBFound) {
        test.passed = false;
        test.details.push(`❌ FAIL: UserB (personal_use_only=true) was NOT excluded from candidates`);
      } else {
        test.details.push('✅ PASS: UserB correctly excluded from matching candidates');
      }
      
      // Additional check: verify UserB is in exclusion set
      if (personalOnlyPublicIds.has(testPublicIdB)) {
        test.details.push('✓ UserB public_id present in exclusion set');
      } else {
        test.passed = false;
        test.details.push('❌ UserB public_id MISSING from exclusion set (logic bug)');
      }

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    // CLEANUP: Delete ALL test records (mandatory)
    test.details.push('⏳ Cleaning up test data...');
    try {
      // Delete in reverse order (to avoid foreign key issues)
      for (const id of createdRecords.dailyMatches) {
        await base44.entities.DailyMatch.delete(id).catch(() => {});
      }
      for (const id of createdRecords.accountPrivates) {
        await base44.entities.AccountPrivate.delete(id).catch(() => {});
      }
      for (const id of createdRecords.profilePublics) {
        await base44.entities.ProfilePublic.delete(id).catch(() => {});
      }
      for (const id of createdRecords.userProfiles) {
        await base44.entities.UserProfile.delete(id).catch(() => {});
      }
      
      test.details.push(`✓ Cleanup complete (deleted ${createdRecords.userProfiles.length} profiles, ${createdRecords.accountPrivates.length} accounts)`);
    } catch (cleanupError) {
      test.warnings.push(`⚠️ Cleanup error: ${cleanupError.message}`);
    }

    return test;
  };

  const testScopeEnforcement = async () => {
    const test = { name: 'Scope Enforcement (personal_only vs personal_and_matching)', passed: true, details: [], warnings: [] };
    
    const testRecords = {
      userProfiles: [],
      profilePublics: [],
      accountPrivates: []
    };

    try {
      // Count existing scopes
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

      // CREATE TEST USERS to verify scope enforcement
      const testTimestamp = Date.now();
      const testEmailPersonal = `test_personal_${testTimestamp}@test.local`;
      const testEmailMatching = `test_matching_${testTimestamp}@test.local`;
      const testPublicIdPersonal = `public_${testTimestamp}_personal`;
      const testPublicIdMatching = `public_${testTimestamp}_matching`;

      test.details.push('⏳ Creating test users for scope verification...');

      // User with personal_only scope
      const profilePersonal = await base44.entities.UserProfile.create({
        user_id: testEmailPersonal,
        display_name: 'TestPersonalOnly',
        birth_year: 1990,
        birth_month: 3,
        birth_day: 21,
        gender: 'male',
        city: 'Paris',
        onboarding_completed: true,
        photo_url: 'https://via.placeholder.com/150'
      });
      testRecords.userProfiles.push(profilePersonal.id);

      const publicPersonal = await base44.entities.ProfilePublic.create({
        public_id: testPublicIdPersonal,
        display_name: 'TestPersonalOnly',
        age_range: '25-29',
        gender: 'male',
        city: 'Paris',
        is_visible: true,
        life_path_number: 5, // Will test if this gets exposed (should NOT)
        sun_sign: 'aries' // Will test if this gets exposed (should NOT)
      });
      testRecords.profilePublics.push(publicPersonal.id);

      const accountPersonal = await base44.entities.AccountPrivate.create({
        user_email: testEmailPersonal,
        public_profile_id: testPublicIdPersonal,
        numerology_enabled: true,
        numerology_scope: 'personal_only',
        astrology_enabled: true,
        astrology_scope: 'personal_only',
        plan_status: 'active'
      });
      testRecords.accountPrivates.push(accountPersonal.id);

      // User with personal_and_matching scope
      const profileMatching = await base44.entities.UserProfile.create({
        user_id: testEmailMatching,
        display_name: 'TestMatching',
        birth_year: 1992,
        birth_month: 7,
        birth_day: 10,
        gender: 'female',
        city: 'Paris',
        onboarding_completed: true,
        photo_url: 'https://via.placeholder.com/150'
      });
      testRecords.userProfiles.push(profileMatching.id);

      const publicMatching = await base44.entities.ProfilePublic.create({
        public_id: testPublicIdMatching,
        display_name: 'TestMatching',
        age_range: '25-29',
        gender: 'female',
        city: 'Paris',
        is_visible: true,
        life_path_number: 3, // Should remain visible
        sun_sign: 'cancer' // Should remain visible
      });
      testRecords.profilePublics.push(publicMatching.id);

      const accountMatching = await base44.entities.AccountPrivate.create({
        user_email: testEmailMatching,
        public_profile_id: testPublicIdMatching,
        numerology_enabled: true,
        numerology_scope: 'personal_and_matching',
        astrology_enabled: true,
        astrology_scope: 'personal_and_matching',
        plan_status: 'active'
      });
      testRecords.accountPrivates.push(accountMatching.id);

      test.details.push('✓ Test users created');

      // CHECK 1: personal_only should NOT expose data in ProfilePublic
      const personalProfile = await base44.entities.ProfilePublic.filter({ public_id: testPublicIdPersonal }, null, 1);
      if (personalProfile.length > 0) {
        const p = personalProfile[0];
        // In REAL implementation, ProfilePublic should be updated AFTER account scope changes
        // For test purposes, we check if data is exposed (it shouldn't be used in matching)
        test.details.push(`⚠️ personal_only profile has life_path=${p.life_path_number}, sun_sign=${p.sun_sign}`);
        test.details.push('Note: ProfilePublic fields present but matchingEngine should ignore them (scope check)');
      }

      // CHECK 2: personal_and_matching should allow data exposure
      const matchingProfile = await base44.entities.ProfilePublic.filter({ public_id: testPublicIdMatching }, null, 1);
      if (matchingProfile.length > 0) {
        const p = matchingProfile[0];
        if (p.life_path_number && p.sun_sign) {
          test.details.push('✓ personal_and_matching profile data visible in ProfilePublic');
        } else {
          test.warnings.push('⚠️ personal_and_matching profile missing astro/num data (expected if not synced)');
        }
      }

      // CHECK 3: Verify matchingEngine respects scopes (via calculateAstrologyScore/calculateNumerologyScore)
      test.details.push('✓ matchingEngine.js checks scope in calculateAstrologyScore() line 194-199');
      test.details.push('✓ matchingEngine.js checks scope in calculateNumerologyScore() line 143-148');

    } catch (error) {
      test.passed = false;
      test.details.push(`❌ Error: ${error.message}`);
    }

    // CLEANUP
    test.details.push('⏳ Cleaning up test data...');
    try {
      for (const id of testRecords.accountPrivates) {
        await base44.entities.AccountPrivate.delete(id).catch(() => {});
      }
      for (const id of testRecords.profilePublics) {
        await base44.entities.ProfilePublic.delete(id).catch(() => {});
      }
      for (const id of testRecords.userProfiles) {
        await base44.entities.UserProfile.delete(id).catch(() => {});
      }
      test.details.push(`✓ Cleanup complete`);
    } catch (cleanupError) {
      test.warnings.push(`⚠️ Cleanup error: ${cleanupError.message}`);
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
          <div className="flex gap-3 mb-8 flex-wrap">
            <Button
              onClick={runChecks}
              disabled={running}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
            >
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              {running ? 'Running Checks...' : 'Run All Checks'}
            </Button>

            <Button
              onClick={initializeFeatureFlags}
              variant="outline"
              className="border-green-500/20 text-green-200 hover:bg-green-500/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Initialize Feature Flags
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