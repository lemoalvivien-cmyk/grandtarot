import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import AdminGuard from '@/components/auth/AdminGuard';
import { tarotDeck } from '@/components/helpers/tarotDeck';
import { CheckCircle, XCircle, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDeckCheck() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ loaded: 0, failed: 0, missing: [] });

  useEffect(() => {
    checkDeck();
  }, []);

  const checkDeck = async () => {
    setLoading(true);
    const missing = [];
    let loaded = 0;
    let failed = 0;

    for (const card of tarotDeck) {
      try {
        const img = new Image();
        const promise = new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = card.imagePath;
        });

        await promise;
        loaded++;
      } catch (error) {
        failed++;
        missing.push({
          id: card.id,
          name: `${card.name_fr} / ${card.name_en}`,
          path: card.imagePath
        });
      }
    }

    setResults({ loaded, failed, missing });
    setLoading(false);
  };

  const copyReport = () => {
    const report = `
GRANDTAROT - Deck Check Report
Generated: ${new Date().toISOString()}

Total Cards: ${tarotDeck.length}
Loaded: ${results.loaded}
Failed: ${results.failed}

${results.missing.length > 0 ? `
Missing Images:
${results.missing.map(m => `- ${m.name}: ${m.path}`).join('\n')}
` : 'All images loaded successfully ✅'}
    `.trim();

    navigator.clipboard.writeText(report);
    alert('Report copied to clipboard!');
  };

  return (
    <AdminGuard>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-amber-100 mb-2">Deck Check</h1>
            <p className="text-slate-400">Verify that all 78 tarot images load correctly</p>
          </div>

          {/* Stats Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8 mb-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400">Checking {tarotDeck.length} images...</p>
              </div>
            ) : (
              <div>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-300 mb-2">{tarotDeck.length}</div>
                    <div className="text-sm text-slate-500">Total Cards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">{results.loaded}</div>
                    <div className="text-sm text-slate-500">Loaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-400 mb-2">{results.failed}</div>
                    <div className="text-sm text-slate-500">Failed</div>
                  </div>
                </div>

                {/* Status */}
                <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
                  results.failed === 0 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  {results.failed === 0 ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-lg font-semibold text-green-200">
                        ✅ All {tarotDeck.length} images loaded successfully!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                      <span className="text-lg font-semibold text-red-200">
                        {results.failed} image(s) failed to load
                      </span>
                    </>
                  )}
                </div>

                {/* Copy Report Button */}
                <div className="mt-6 text-center">
                  <Button
                    onClick={copyReport}
                    className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Report
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Missing Images List */}
          {!loading && results.missing.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-red-200 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Missing Images ({results.missing.length})
              </h2>
              <ul className="space-y-2">
                {results.missing.map((item, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-slate-300 font-medium">{item.name}</span>
                    <div className="text-slate-500 text-xs font-mono mt-1 break-all">{item.path}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => window.location.href = createPageUrl('AdminDashboard')}
              variant="outline"
              className="border-amber-500/30 hover:bg-amber-500/10"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}