import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, AlertTriangle, Check, X, Eye, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [action, setAction] = useState('none');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // SECURED: Use filter with limit instead of unbounded list
      const reportList = await base44.entities.Report.filter({}, '-created_date', 100);
      setReports(reportList);

      // Load profiles (scoped query)
      const userIds = new Set();
      reportList.forEach(r => {
        userIds.add(r.reporter_profile_id);
        userIds.add(r.target_profile_id);
      });

      // Fetch only needed profiles (efficient)
      const allProfiles = await base44.entities.ProfilePublic.filter({
        public_id: { $in: Array.from(userIds) }
      }, null, 200);
      
      const profileMap = {};
      allProfiles.forEach(p => {
        profileMap[p.public_id] = p;
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (dismiss = false) => {
    if (!selectedReport) return;

    try {
      const admin = await base44.auth.me();
      
      await base44.entities.Report.update(selectedReport.id, {
        status: dismiss ? 'dismissed' : 'resolved',
        admin_notes: adminNotes,
        action_taken: dismiss ? 'none' : action,
        reviewed_by: admin.email,
        reviewed_at: new Date().toISOString()
      });

      // If action involves ban, update profile
      if (!dismiss && (action === 'temporary_ban' || action === 'permanent_ban')) {
        const reportedProfile = profiles[selectedReport.reported_user_id];
        if (reportedProfile) {
          await base44.entities.UserProfile.update(reportedProfile.id, {
            is_banned: true
          });
        }
      }

      // Log action
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: dismiss ? 'report_dismissed' : 'report_resolved',
        entity_name: 'Report',
        entity_id: selectedReport.id,
        target_user_id: selectedReport.reported_user_id,
        payload_summary: dismiss ? 'Report dismissed' : `Report resolved with action: ${action}`,
        payload_data: { 
          report_id: selectedReport.id,
          action_taken: dismiss ? 'none' : action,
          notes: adminNotes
        },
        severity: !dismiss && (action === 'temporary_ban' || action === 'permanent_ban') ? 'critical' : 'info'
      });

      setSelectedReport(null);
      setAdminNotes('');
      setAction('none');

      // Refresh
      const updatedReports = await base44.entities.Report.filter({}, '-created_date', 100);
      setReports(updatedReports);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const reasonLabels = {
    harassment: 'Harcèlement',
    spam: 'Spam',
    inappropriate_content: 'Contenu inapproprié',
    fake_profile: 'Faux profil',
    other: 'Autre'
  };

  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400',
    reviewing: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    dismissed: 'bg-gray-500/20 text-gray-400'
  };

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'reviewing');

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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')} className="text-purple-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Signalements</h1>
          {pendingReports.length > 0 && (
            <Badge className="bg-red-500">{pendingReports.length} en attente</Badge>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-purple-200/60">Aucun signalement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id}
                className={`bg-white/5 border rounded-xl p-5 ${
                  report.status === 'pending' ? 'border-amber-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={statusColors[report.status]}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline" className="border-red-500/30 text-red-300">
                        {reasonLabels[report.reason]}
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-200/60">
                      {profiles[report.reporter_id]?.display_name || report.reporter_id} → {' '}
                      <span className="text-white font-medium">
                        {profiles[report.reported_user_id]?.display_name || report.reported_user_id}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-purple-300/60">
                    {new Date(report.created_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {report.details && (
                  <p className="text-sm text-purple-200/80 mb-4 p-3 bg-white/5 rounded-lg">
                    {report.details}
                  </p>
                )}

                {report.status === 'pending' && (
                  <Button
                    onClick={() => setSelectedReport(report)}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Traiter
                  </Button>
                )}

                {report.admin_notes && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-blue-400 mb-1">Notes admin ({report.reviewed_by})</p>
                    <p className="text-sm text-blue-200">{report.admin_notes}</p>
                    {report.action_taken && report.action_taken !== 'none' && (
                      <Badge className="mt-2 bg-red-500/20 text-red-400">
                        Action: {report.action_taken}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Traiter le signalement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-purple-300 mb-1">Utilisateur signalé</p>
              <p className="font-medium">
                {profiles[selectedReport?.reported_user_id]?.display_name || selectedReport?.reported_user_id}
              </p>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">Action à prendre</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="none">Aucune action</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="temporary_ban">Ban temporaire</SelectItem>
                  <SelectItem value="permanent_ban">Ban permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Notes internes..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => resolveReport(false)}
                className="flex-1 bg-green-600 hover:bg-green-500"
              >
                <Check className="w-4 h-4 mr-2" />
                Résoudre
              </Button>
              <Button
                onClick={() => resolveReport(true)}
                variant="outline"
                className="flex-1 border-white/10 hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminGuard>
  );
}