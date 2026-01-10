import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBillingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approving, setApproving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const reqs = await base44.entities.BillingRequest.list('-created_date', 100);
      setRequests(reqs);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setApproving(true);
    try {
      // Update request status
      await base44.entities.BillingRequest.update(selectedRequest.id, {
        status: 'approved',
        action_taken: 'plan_activated',
        reviewed_by: (await base44.auth.me()).email,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes
      });

      // Activate plan for user
      const accounts = await base44.entities.AccountPrivate.filter({
        user_email: selectedRequest.user_email
      }, null, 1);

      if (accounts.length > 0) {
        await base44.entities.AccountPrivate.update(accounts[0].id, {
          plan_status: 'active',
          plan_activated_at: new Date().toISOString()
        });
      }

      setSelectedRequest(null);
      setNotes('');
      loadRequests();
      alert('Plan activated!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setApproving(true);
    try {
      await base44.entities.BillingRequest.update(selectedRequest.id, {
        status: 'rejected',
        reviewed_by: (await base44.auth.me()).email,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes
      });

      setSelectedRequest(null);
      setNotes('');
      loadRequests();
      alert('Request rejected.');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
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
            <h1 className="text-3xl font-bold mb-2">Billing Requests</h1>
            <p className="text-slate-400">Review and approve payment proofs</p>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No billing requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(req.status)}
                        <div>
                          <p className="font-semibold">{req.user_email}</p>
                          <p className="text-sm text-slate-400">{req.request_type}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{req.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        req.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {req.status}
                      </span>
                      <p className="text-slate-400 mt-2">
                        {new Date(req.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail Modal */}
          {selectedRequest && (
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-amber-100">
                    Billing Request — {selectedRequest.user_email}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Type</label>
                    <p className="text-white">{selectedRequest.request_type}</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Description</label>
                    <p className="text-white bg-slate-800/50 p-3 rounded-lg">{selectedRequest.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Admin Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes for your decision..."
                      className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-3 py-2 h-20"
                    />
                  </div>

                  {selectedRequest.status === 'pending' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleReject}
                        disabled={approving}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={approving}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Activate'}
                      </Button>
                    </div>
                  )}

                  {selectedRequest.status !== 'pending' && (
                    <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-400">
                      Reviewed by: {selectedRequest.reviewed_by}
                      <br />
                      {selectedRequest.reviewed_at && new Date(selectedRequest.reviewed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}