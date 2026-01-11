import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import AdminGuard from '@/components/auth/AdminGuard';
import { tarotDeck } from '@/components/helpers/tarotDeck';
import { CheckCircle, XCircle, Download, Copy, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDeckCheck() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const runCheck = async () => {
    setRunning(true);
    const loadedCards = [];
    const failedCards = [];
    const invalidPaths = [];
    const sampleFetchResults = [];

    // VALIDATION 1: Path format check (all cards)
    for (const card of tarotDeck) {
      const pathValid = card.imagePath && 
        card.imagePath.startsWith('/tarot/') && 
        /\.(webp|png|jpg|jpeg)$/i.test(card.imagePath);
      
      if (!pathValid) {
        invalidPaths.push({
          slug: card.slug,
          name_fr: card.name_fr,
          path: card.imagePath || 'MISSING',
          reason: !card.imagePath ? 'Missing path' : 
                  !card.imagePath.startsWith('/tarot/') ? 'Wrong directory' : 
                  'Invalid extension'
        });
      }
    }

    // VALIDATION 2: Image loading test (all cards)
    for (const card of tarotDeck) {
      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          const timeout = setTimeout(() => reject('timeout'), 5000);
          img.onload = () => { clearTimeout(timeout); resolve(); };
          img.onerror = () => { clearTimeout(timeout); reject('load error'); };
          img.src = card.imagePath;
        });
        loadedCards.push(card);
      } catch (err) {
        failedCards.push({ ...card, loadError: err });
      }
    }

    // VALIDATION 3: Sample fetch test (10 random cards)
    const randomSample = [...tarotDeck].sort(() => Math.random() - 0.5).slice(0, 10);
    for (const card of randomSample) {
      try {
        const response = await fetch(card.imagePath, { method: 'HEAD' });
        sampleFetchResults.push({
          slug: card.slug,
          path: card.imagePath,
          status: response.status,
          ok: response.ok
        });
      } catch (err) {
        sampleFetchResults.push({
          slug: card.slug,
          path: card.imagePath,
          status: 0,
          ok: false,
          error: 'Network error'
        });
      }
    }

    setResults({
      timestamp: new Date().toISOString(),
      total: tarotDeck.length,
      loaded: loadedCards.length,
      failed: failedCards.length,
      failedCards: failedCards.map(c => ({ 
        slug: c.slug, 
        name: c.name_fr, 
        path: c.imagePath,
        error: c.loadError 
      })),
      invalidPaths,
      invalidPathCount: invalidPaths.length,
      sampleFetchResults,
      sampleLoaded: loadedCards.slice(0, 5).map(c => ({ slug: c.slug, name: c.name_fr }))
    });

    setRunning(false);
  };

  const copyReport = () => {
    if (!results) return;
    const report = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deck-check-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">🃏 Deck Check (78 cartes)</h1>

          <div className="mb-6 flex gap-3">
            <Button onClick={runCheck} disabled={running} className="bg-green-600 hover:bg-green-700">
              {running ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {running ? 'Vérification...' : 'RUN CHECK'}
            </Button>
            {results && (
              <>
                <Button onClick={copyReport} variant="outline" className="border-slate-700">
                  {copied ? <CheckCircle className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                  {copied ? 'Copied!' : 'COPY REPORT'}
                </Button>
                <Button onClick={downloadReport} variant="outline" className="border-slate-700">
                  <Download className="w-5 h-5 mr-2" />
                  DOWNLOAD JSON
                </Button>
              </>
            )}
          </div>

          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Total</p>
                  <p className="text-4xl font-bold text-amber-200">{results.total}</p>
                  <p className="text-xs text-slate-500 mt-1">Expected: 78</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Loaded</p>
                  <p className="text-4xl font-bold text-green-400">{results.loaded}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Failed</p>
                  <p className="text-4xl font-bold text-red-400">{results.failed}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Invalid Paths</p>
                  <p className="text-4xl font-bold text-amber-400">{results.invalidPathCount || 0}</p>
                </div>
              </div>

              {/* Invalid Paths */}
              {results.invalidPaths && results.invalidPaths.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                    <XCircle className="w-6 h-6" />
                    {results.invalidPathCount} Invalid Path(s)
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {results.invalidPaths.map((c, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                        <p className="font-mono text-amber-300">{c.slug}</p>
                        <p className="text-slate-400">{c.name_fr}</p>
                        <p className="text-xs text-amber-500 break-all mt-1">Path: {c.path}</p>
                        <p className="text-xs text-red-400 mt-1">⚠️ {c.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              {results.failed === 0 && results.invalidPathCount === 0 ? (
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 flex items-center gap-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <div>
                    <h3 className="text-xl font-semibold text-green-400">✅ Perfect: 78/78 cards loaded successfully</h3>
                    <p className="text-slate-300 mt-1">Deck is production-ready. All paths valid, all images load correctly.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <XCircle className="w-6 h-6" />
                    {results.failed} Card(s) Failed to Load
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {results.failedCards.map((c, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                        <p className="font-mono text-red-300">{c.slug}</p>
                        <p className="text-slate-400">{c.name}</p>
                        <p className="text-xs text-slate-500 break-all mt-1">Path: {c.path}</p>
                        {c.error && <p className="text-xs text-red-400 mt-1">Error: {c.error}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Fetch Results */}
              {results.sampleFetchResults && results.sampleFetchResults.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4">
                    Sample Fetch Test (10 random cards)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.sampleFetchResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 text-sm">
                        <span className="font-mono text-slate-300">{r.slug}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            r.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {r.status === 0 ? 'ERR' : r.status}
                          </span>
                          {r.ok ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Loaded */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-100 mb-4">Sample Loaded (first 5)</h3>
                <div className="space-y-2">
                  {results.sampleLoaded.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-mono">{c.slug}</span>
                      <span className="text-slate-500">— {c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-slate-500 text-center">
                Run at: {new Date(results.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}