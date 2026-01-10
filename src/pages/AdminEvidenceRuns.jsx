import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Download, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminEvidenceRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const evidenceRuns = await base44.entities.EvidenceRun.filter({}, '-created_date', 50);
      setRuns(evidenceRuns);
    } catch (error) {
      console.error('Error loading evidence runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadRun = (run) => {
    const json = JSON.stringify(run, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-run-${run.id}-${Date.now()}.json`;
    a.click();
  };

  const copyResults = (run) => {
    navigator.clipboard.writeText(run.results_json);
    alert('Results copied!');
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-purple-200">Evidence Runs</h1>
            <Button onClick={loadRuns} variant="outline" className="border-purple-500">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {runs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No evidence runs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <div key={run.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {run.tests_passed > 0 && run.tests_failed === 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        {run.run_type}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(run.created_date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {run.run_duration_ms && (
                        <span className="text-xs text-slate-400">
                          {run.run_duration_ms}ms
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 mb-3">{run.summary}</p>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                      <p className="text-green-300">✅ {run.tests_passed} passed</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                      <p className="text-red-300">❌ {run.tests_failed} failed</p>
                    </div>
                    {run.tests_skipped > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2">
                        <p className="text-amber-300">⏭ {run.tests_skipped} skipped</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 rounded p-3 mb-4 max-h-64 overflow-auto">
                    <pre className="text-xs text-slate-400">
                      {run.results_json}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => copyResults(run)} 
                      variant="outline" 
                      size="sm"
                      className="border-slate-600"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      onClick={() => downloadRun(run)} 
                      variant="outline" 
                      size="sm"
                      className="border-slate-600"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
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