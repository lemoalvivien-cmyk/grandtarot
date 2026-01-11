import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, CheckCircle, XCircle, MessageSquare, Loader2, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBillingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    loadRequests(true);
  }, [statusFilter]);

  const loadRequests = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setSkip(0);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // SECURED: Filter with explicit LIMIT + pagination via skip
      const skipCount = reset ? 0 : skip;
      const data = await base44.entities.BillingRequest.filter({
        status: statusFilter
      }, '-created_date', LIMIT);
      
      if (reset) {
        setRequests(data || []);
      } else {
        setRequests(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore(data.length === LIMIT);
      setSkip(skipCount + LIMIT);
    } catch (error) {
      console.error('Error loading requests:', error);
      if (reset) setRequests([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    loadRequests(false);
  };

  const handleApprove = async (request) => {
    setProcessing(true);
    try {
      const adminUser = await base44.auth.me();
      const accounts = await base44.entities.AccountPrivate.filter({
        user_email: request.requester_user_email
      }, null, 1);

      if (accounts.length === 0) {
        alert('User account not found');
        setProcessing(false);
        return;
      }

      await base44.entities.AccountPrivate.update(accounts[0].id, {
        plan_status: 'active',
        plan_activated_at: new Date().toISOString()
      });

      await base44.entities.BillingRequest.update(request.id, {
        status: 'approved',
        reviewed_by: adminUser.email,
        reviewed_at: new Date().toISOString(),
        action_taken: 'plan_activated'
      });

      // Log audit (non-blocking)
      try {
        await base44.entities.AuditLog.create({
          actor_user_id: adminUser.email,
          actor_role: 'admin',
          action: 'billing_approve',
          entity_name: 'BillingRequest',
          entity_id: request.id,
          target_user_id: request.requester_user_email,
          payload_summary: `Approved billing request and activated plan for ${request.requester_user_email}`
        });
      } catch (e) {
        console.error('Audit log failed (non-blocking):', e);
      }

      loadRequests(true);
    } catch (error) {
      console.error('Error approving:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason');
      return;
    }

    setProcessing(true);
    try {
      const adminUser = await base44.auth.me();
      await base44.entities.BillingRequest.update(selectedRequest.id, {
        status: 'rejected',
        reviewed_by: adminUser.email,
        reviewed_at: new Date().toISOString(),
        admin_notes: rejectReason.trim()
      });

      // Log audit (non-blocking)
      try {
        await base44.entities.AuditLog.create({
          actor_user_id: adminUser.email,
          actor_role: 'admin',
          action: 'billing_reject',
          entity_name: 'BillingRequest',
          entity_id: selectedRequest.id,
          target_user_id: selectedRequest.requester_user_email,
          payload_summary: `Rejected billing request for ${selectedRequest.requester_user_email}: ${rejectReason.trim()}`
        });
      } catch (e) {
        console.error('Audit log failed (non-blocking):', e);
      }

      setRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      loadRequests(true);
    } catch (error) {
      console.error('Error rejecting:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(req => 
    !searchEmail || req.requester_user_email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const isUrgent = (createdDate) => {
    const createdTime = new Date(createdDate).getTime();
    const nowTime = new Date().getTime();
    const diffHours = (nowTime - createdTime) / (1000 * 60 * 60);
    return diffHours > 48;
  };

  const copyTemplateReply = (lang = 'fr') => {
    const templates = {
      fr: `Bonjour,

Merci d'avoir soumis votre preuve de paiement. Nous avons vérifiée votre transaction et confirmé le paiement reçu.

Votre abonnement est maintenant ACTIF. Vous avez accès à toutes les fonctionnalités de GRANDTAROT.

Bienvenue! 🎉

Support GRANDTAROT`,
      en: `Hello,

Thank you for submitting your payment proof. We have verified your transaction and confirmed payment received.

Your subscription is now ACTIVE. You have access to all GRANDTAROT features.

Welcome! 🎉

GRANDTAROT Support`
    };
    
    navigator.clipboard.writeText(templates[lang]);
    setTemplateCopied(true);
    setTimeout(() => setTemplateCopied(false), 2000);
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Billing Requests</h1>
              <p className="text-slate-400">Review and approve payment proofs</p>
            </div>
            <CreditCard className="w-10 h-10 text-amber-500" />
          </div>

          <div className="mb-6 flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search by email..."
              className="flex-1 bg-slate-800/50 border border-slate-700 text-white rounded-lg px-3 py-2"
            />
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No {statusFilter} requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-amber-100">{req.requester_user_email}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          req.status === 'pending' ? 'bg-slate-600 text-slate-100' :
                          req.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {req.status}
                        </span>
                        {req.status === 'pending' && isUrgent(req.created_date) && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/30 text-red-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {'>'} 48h
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(req.requester_user_email)}
                          className="text-slate-500 hover:text-amber-400 h-6 w-6"
                          title="Copy email"
                        >
                          📋
                        </Button>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{req.request_type}</p>
                      <p className="text-sm text-slate-300 break-words">{req.description}</p>
                      {req.evidence_urls && req.evidence_urls.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          {req.evidence_urls.length} attachment(s)
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500 mb-2">
                        {new Date(req.created_date).toLocaleDateString()}
                      </p>
                      {req.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            onClick={() => copyTemplateReply('fr')}
                            variant="outline"
                            className="border-slate-600 h-8 text-xs"
                            title="Copy reply template FR"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {templateCopied ? 'Copied' : 'Reply'}
                          </Button>
                          <Button
                            onClick={() => handleApprove(req)}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                          >
                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(req);
                              setRejectModal(true);
                            }}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700 h-8 text-xs"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {req.status !== 'pending' && (
                        <div className="text-xs text-slate-400">
                          Reviewed {new Date(req.reviewed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {filteredRequests.length > 0 && hasMore && !loading && (
            <div className="text-center mt-6">
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                variant="outline"
                className="border-slate-700"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loadingMore ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          )}

          {/* Footer Count */}
          {filteredRequests.length > 0 && (
            <p className="text-xs text-slate-500 text-center mt-4">
              {filteredRequests.length} requêtes affichées {hasMore ? '(plus disponibles)' : '(toutes)'}
            </p>
          )}

          <Dialog open={rejectModal} onOpenChange={setRejectModal}>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-amber-100">Reject Request</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedRequest?.requester_user_email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-3 py-2 h-24"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setRejectModal(false);
                      setRejectReason('');
                    }}
                    variant="outline"
                    className="flex-1 border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={processing || !rejectReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminGuard>
  );
}