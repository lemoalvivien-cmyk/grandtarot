import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Clock, CheckCircle, Eye, FileText, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminGuard from '@/components/auth/AdminGuard';

const statusColors = {
  open: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  in_review: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  closed: 'bg-green-500/20 text-green-200 border-green-500/30'
};

const statusIcons = {
  open: Clock,
  in_review: Eye,
  closed: CheckCircle
};

export default function AdminDsarRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exportingUser, setExportingUser] = useState(false);
  const [exportedData, setExportedData] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const query = filter === 'all' ? {} : { status: filter };
      const data = await base44.entities.DsarRequest.filter(query, '-created_date', 50);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await base44.entities.DsarRequest.update(requestId, {
        status: newStatus,
        ...(newStatus === 'closed' && { closed_at: new Date().toISOString() })
      });

      // Audit log
      await base44.entities.AuditLog.create({
        actor_user_id: (await base44.auth.me()).email,
        actor_role: 'admin',
        action: 'admin_action',
        entity_name: 'DsarRequest',
        entity_id: requestId,
        payload_summary: `Updated DSAR request status to ${newStatus}`,
        severity: 'info',
        status: 'success'
      }).catch(() => {});

      loadRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating request');
    }
  };

  const handleAddNote = async () => {
    if (!selectedRequest || !note) return;

    setSubmitting(true);

    try {
      await base44.entities.DsarRequest.update(selectedRequest.id, {
        admin_note: note
      });

      loadRequests();
      setSelectedRequest(null);
      setNote('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportUserData = async (userEmail) => {
    setExportingUser(true);
    try {
      // RGPD EXPORT: Collect ALL user data (NEVER other users' data)
      const [profile, profilePublic, account, billingReqs, consent, messagesSent] = await Promise.all([
        base44.entities.UserProfile.filter({ user_id: userEmail }, null, 1),
        base44.entities.ProfilePublic.filter({ user_id: userEmail }, null, 1),
        base44.entities.AccountPrivate.filter({ user_email: userEmail }, null, 1),
        base44.entities.BillingRequest.filter({ requester_user_email: userEmail }, null, 50),
        base44.entities.ConsentPreference.filter({ user_id: userEmail }, null, 10),
        base44.entities.Message.filter({ from_user_id: userEmail }, '-created_date', 100)
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_email: userEmail,
        data: {
          user_profile: profile.length > 0 ? profile[0] : null,
          profile_public: profilePublic.length > 0 ? profilePublic[0] : null,
          account_private: account.length > 0 ? account[0] : null,
          billing_requests: billingReqs,
          consent_preferences: consent,
          messages_sent: messagesSent.slice(0, 50) // LIMIT 50 most recent
        },
        note: "Export RGPD — Uniquement vos données, sans contenu des autres utilisateurs."
      };

      setExportedData(exportData);
    } catch (error) {
      console.error('Error exporting user data:', error);
      alert('Error exporting data');
    } finally {
      setExportingUser(false);
    }
  };

  const downloadExport = () => {
    if (!exportedData) return;
    const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rgpd-export-${exportedData.user_email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyExport = () => {
    if (!exportedData) return;
    navigator.clipboard.writeText(JSON.stringify(exportedData, null, 2));
    alert('Export copié dans le presse-papiers');
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-purple-200">DSAR Requests (GDPR)</h1>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {['all', 'open', 'in_review', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {requests.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center text-slate-400">
                  No requests found
                </CardContent>
              </Card>
            ) : (
              requests.map((req) => {
                const StatusIcon = statusIcons[req.status];
                return (
                  <Card
                    key={req.id}
                    className="bg-white/5 border-white/10 hover:border-purple-500/30 cursor-pointer transition-all"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="w-4 h-4 text-purple-400" />
                            <span className="font-mono text-sm text-slate-300">{req.requester_user_id}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-400">Type:</span>
                            <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-200">
                              {req.type}
                            </span>
                          </div>
                          <p className="text-slate-300 line-clamp-2">{req.message}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            Created: {new Date(req.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusColors[req.status]}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            {req.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-purple-200">DSAR Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Requester Email</p>
                  <p className="font-mono text-amber-200">{selectedRequest.requester_user_id}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Type</p>
                  <p className="text-white">{selectedRequest.type}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Message</p>
                  <div className="bg-slate-800 rounded p-3 text-slate-200 text-sm whitespace-pre-wrap">
                    {selectedRequest.message}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Status</p>
                  <div className="flex gap-2">
                    {['open', 'in_review', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedRequest.id, status)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          selectedRequest.status === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Admin Note</p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add internal notes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm h-20"
                  />
                </div>

                {/* RGPD EXPORT USER DATA */}
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm text-slate-400 mb-3">Export RGPD (données utilisateur)</p>
                  {!exportedData ? (
                    <Button
                      onClick={() => handleExportUserData(selectedRequest.requester_user_id)}
                      disabled={exportingUser}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {exportingUser ? 'Export en cours...' : 'Exporter données utilisateur (JSON)'}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-slate-800 rounded p-3 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-slate-400 font-mono">
                          {JSON.stringify(exportedData, null, 2).slice(0, 500)}...
                        </pre>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={copyExport}
                          variant="outline"
                          className="flex-1 border-slate-600 text-sm"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copier
                        </Button>
                        <Button
                          onClick={downloadExport}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        ✅ Export RGPD — uniquement les données de {exportedData.user_email}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-4">
                  <Button
                    onClick={() => {
                      setSelectedRequest(null);
                      setNote('');
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleAddNote}
                    disabled={submitting || !note}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {submitting ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}