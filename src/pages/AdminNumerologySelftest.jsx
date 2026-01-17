import React, { useState } from 'react';
import { Check, X, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';
import {
  normalizeName,
  reduceNumber,
  lifePathNumber,
  personalDayNumber,
  nameExpressionNumber,
  compatibilitySignal,
  getLifePathKeywords,
  getDailyNumberKeywords
} from '@/components/helpers/numerologyEngine';

export default function AdminNumerologySelftest() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const testCases = [
    {
      name: 'DOB Only - Case 1',
      birthDate: { year: 1990, month: 5, day: 15 },
      fullName: null,
      today: { year: 2026, month: 1, day: 17 }
    },
    {
      name: 'DOB Only - Case 2',
      birthDate: { year: 1985, month: 11, day: 23 },
      fullName: null,
      today: { year: 2026, month: 1, day: 17 }
    },
    {
      name: 'DOB + Name - Case 1',
      birthDate: { year: 1992, month: 7, day: 8 },
      fullName: 'Marie Dupont',
      today: { year: 2026, month: 1, day: 17 }
    },
    {
      name: 'DOB + Name - Case 2',
      birthDate: { year: 1988, month: 3, day: 21 },
      fullName: 'Jean Martin',
      today: { year: 2026, month: 1, day: 17 }
    },
    {
      name: 'Master Number 11',
      birthDate: { year: 1991, month: 11, day: 2 },
      fullName: 'Sophie Laurent',
      today: { year: 2026, month: 1, day: 17 }
    }
  ];

  const runTests = () => {
    setRunning(true);
    
    const testResults = testCases.map(testCase => {
      try {
        const lifePath = lifePathNumber(testCase.birthDate);
        const personalDay = personalDayNumber(testCase.birthDate, testCase.today);
        const expressionNum = testCase.fullName ? nameExpressionNumber(testCase.fullName) : null;
        const normalizedName = testCase.fullName ? normalizeName(testCase.fullName) : null;
        const lifePathKeywords = getLifePathKeywords(lifePath);
        const dailyKeywords = getDailyNumberKeywords(personalDay, 'fr');
        
        return {
          ...testCase,
          success: true,
          outputs: {
            lifePath,
            personalDay,
            expressionNum,
            normalizedName,
            lifePathKeywords,
            dailyKeywords
          }
        };
      } catch (error) {
        return {
          ...testCase,
          success: false,
          error: error.message
        };
      }
    });
    
    setResults(testResults);
    setRunning(false);
  };

  const testCompatibility = () => {
    const compat1 = compatibilitySignal(1, 5, 'fr');
    const compat2 = compatibilitySignal(2, 6, 'fr');
    const compat3 = compatibilitySignal(4, 5, 'fr');
    
    alert(`Compatibility Tests:\n\n` +
      `1 + 5: ${compat1.scoreLite}/10 - ${compat1.oneLine}\n` +
      `2 + 6: ${compat2.scoreLite}/10 - ${compat2.oneLine}\n` +
      `4 + 5: ${compat3.scoreLite}/10 - ${compat3.oneLine}`
    );
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              Numerology Engine Selftest
            </h1>
            <p className="text-slate-400">
              Verification of deterministic calculations (zero AI)
            </p>
          </div>

          <div className="flex gap-4 mb-8">
            <Button
              onClick={runTests}
              disabled={running}
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
            >
              <Hash className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
            <Button
              onClick={testCompatibility}
              variant="outline"
              className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
            >
              Test Compatibility
            </Button>
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-6">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-amber-100">
                      {result.name}
                    </h3>
                    {result.success ? (
                      <Check className="w-6 h-6 text-green-400" />
                    ) : (
                      <X className="w-6 h-6 text-red-400" />
                    )}
                  </div>

                  {result.success ? (
                    <div className="space-y-4">
                      {/* Inputs */}
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-200 mb-2">Inputs</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Birth Date:</span>
                            <span className="ml-2 text-white">
                              {result.birthDate.year}-{result.birthDate.month.toString().padStart(2, '0')}-{result.birthDate.day.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Full Name:</span>
                            <span className="ml-2 text-white">
                              {result.fullName || '(none)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Test Date:</span>
                            <span className="ml-2 text-white">
                              {result.today.year}-{result.today.month.toString().padStart(2, '0')}-{result.today.day.toString().padStart(2, '0')}
                            </span>
                          </div>
                          {result.outputs.normalizedName && (
                            <div>
                              <span className="text-slate-400">Normalized:</span>
                              <span className="ml-2 text-white">
                                {result.outputs.normalizedName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Outputs */}
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-200 mb-2">Outputs</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                            <div className="text-xs text-violet-300 mb-1">Life Path Number</div>
                            <div className="text-2xl font-bold text-violet-200">
                              {result.outputs.lifePath}
                            </div>
                            <div className="text-xs text-slate-400 mt-2">
                              {result.outputs.lifePathKeywords.theme_fr}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.outputs.lifePathKeywords.keywords_fr.map((kw, j) => (
                                <span key={j} className="text-xs px-2 py-0.5 bg-violet-500/20 rounded">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <div className="text-xs text-amber-300 mb-1">Personal Day Number</div>
                            <div className="text-2xl font-bold text-amber-200">
                              {result.outputs.personalDay}
                            </div>
                            <div className="text-xs text-slate-400 mt-2">
                              {result.outputs.dailyKeywords}
                            </div>
                          </div>

                          {result.outputs.expressionNum && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <div className="text-xs text-green-300 mb-1">Expression Number</div>
                              <div className="text-2xl font-bold text-green-200">
                                {result.outputs.expressionNum}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                from name: {result.fullName}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-300 text-sm">Error: {result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-amber-100 mb-4">Engine Info</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Pythagorean system (A=1, B=2, ..., I=9, J=1, ...)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Master numbers preserved: 11, 22, 33</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>DOB-only fallback supported (if name missing)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Accent normalization (é → E, ç → C)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Zero AI cost for calculations (AI only for daily interpretation)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}