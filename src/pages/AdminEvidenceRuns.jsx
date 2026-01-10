import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, Download, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminEvidenceRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const data = await base44.entities.EvidenceRun.list('-created_date', 50);
      setRuns(data);
    } catch (error) {
      console.error('Error loading runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyRaw = (run) => {
    navigator.clipboard.writeText(run.raw_output || '');
    alert('Raw output copied to clipboard!');
  };

  const downloadRaw = (run) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(run.raw_output || ''));
    element.setAttribute('download', `evidence-${run.run_type}-${new Date(run.created_date).toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDelete = async (run) => {
    if (!confirm('Delete this evidence run? This cannot be undone.')) return;
    
    setDeleting(true);
    try {
      await base44.entities.EvidenceRun.delete(run.id);
      loadRuns();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Evidence Runs</h1>
            <p className="text-slate-400">Proof exports from backend-health, security-selftest, release-check</p>
          </div>

          {runs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No evidence runs saved yet. Run tests in admin tools and click "Save Run".</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <p className="font-semibold capitalize">{run.run_type.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-slate-400">{run.summary}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {run.tests_passed > 0 && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                            ✅ {run.tests_passed} pass
                          </span>
                        )}
                        {run.tests_failed > 0 && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                            ❌ {run.tests_failed} fail
                          </span>
                        )}
                        {run.tests_skipped > 0 && (
                          <span className="px-2 py-1 bg-slate-500/20 text-slate-300 text-xs rounded">
                            ⏭️ {run.tests_skipped} skip
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <p className="text-slate-400">
                          {new Date(run.created_date).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => setSelectedRun(run)}
                        variant="ghost"
                        size="icon"
                        className="text-amber-400 hover:text-amber-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail Modal */}
          {selectedRun && (
            <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-amber-100">
                    {selectedRun.run_type} — {new Date(selectedRun.created_date).toLocaleString()}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Summary</label>
                    <p className="text-white">{selectedRun.summary}</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Raw Output</label>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-48">
                      {selectedRun.raw_output}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => copyRaw(selectedRun)}
                      variant="outline"
                      className="border-slate-700 flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Raw
                    </Button>
                    <Button
                      onClick={() => downloadRaw(selectedRun)}
                      variant="outline"
                      className="border-slate-700 flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => {
                        handleDelete(selectedRun);
                        setSelectedRun(null);
                      }}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700 flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}