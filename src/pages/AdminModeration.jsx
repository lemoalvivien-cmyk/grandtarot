import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Shield, AlertTriangle, Eye, Ban, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminModeration() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('App');
        return;
      }

      await loadReports();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const [allReports, allProfiles] = await Promise.all([
        base44.entities.Report.list(),
        base44.entities.UserProfile.list()
      ]);

      // Sort by severity then date
      allReports.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.created_date) - new Date(a.created_date);
      });

      setReports(allReports);

      const profileMap = {};
      allProfiles.forEach(p => {
        profileMap[p.user_id] = p;
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;

    setProcessing(true);
    try {
      const admin = await base44.auth.me();
      const targetProfile = profiles[selectedReport.target_user_id];

      // Apply action
      let actionTaken = 'none';
      
      if (actionType === 'warn') {
        actionTaken = 'warning';
        // No profile change for warning
      } else if (actionType === 'cooldown') {
        actionTaken = 'temporary_ban';
        const cooldownEnd = new Date();
        cooldownEnd.setDate(cooldownEnd.getDate() + 3);
        await base44.entities.UserProfile.update(targetProfile.id, {
          cooldown_until: cooldownEnd.toISOString()
        });
      } else if (actionType === 'suspend') {
        actionTaken = 'temporary_ban';
        const suspendEnd = new Date();
        suspendEnd.setDate(suspendEnd.getDate() + 7);
        await base44.entities.UserProfile.update(targetProfile.id, {
          cooldown_until: suspendEnd.toISOString()
        });
      } else if (actionType === 'ban') {
        actionTaken = 'permanent_ban';
        await base44.entities.UserProfile.update(targetProfile.id, {
          is_banned: true,
          ban_reason: selectedReport.reason
        });
      }

      // Update report
      await base44.entities.Report.update(selectedReport.id, {
        status: 'resolved',
        action_taken: actionTaken,
        reviewed_by: admin.email,
        reviewed_at: new Date().toISOString(),
        admin_notes: actionNotes,
        resolution_notes: actionNotes
      });

      // Audit log
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'report_resolved',
        entity_name: 'Report',
        entity_id: selectedReport.id,
        target_user_id: selectedReport.target_user_id,
        payload_summary: `Resolved report with action: ${actionTaken}`
      });

      setActionModal(false);
      setSelectedReport(null);
      setActionType('');
      setActionNotes('');
      await loadReports();
    } catch (error) {
      console.error('Error applying action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const dismissReport = async (report) => {
    try {
      const admin = await base44.auth.me();
      await base44.entities.Report.update(report.id, {
        status: 'dismissed',
        reviewed_by: admin.email,
        reviewed_at: new Date().toISOString()
      });

      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'report_dismissed',
        entity_name: 'Report',
        entity_id: report.id
      });

      await loadReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-300';
      case 'in_review': return 'bg-blue-500/20 text-blue-300';
      case 'resolved': return 'bg-green-500/20 text-green-300';
      case 'dismissed': return 'bg-slate-500/20 text-slate-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminDashboard')} className="text-amber-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-semibold">Modération</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">En attente</p>
              <p className="text-2xl font-bold text-amber-300">
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">Critiques</p>
              <p className="text-2xl font-bold text-red-400">
                {reports.filter(r => r.severity === 'critical' && r.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">Résolus</p>
              <p className="text-2xl font-bold text-green-400">
                {reports.filter(r => r.status === 'resolved').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">Rejetés</p>
              <p className="text-2xl font-bold text-slate-400">
                {reports.filter(r => r.status === 'dismissed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reports */}
        <div className="space-y-4">
          {reports.map((report) => {
            const targetProfile = profiles[report.target_user_id];
            const reporterProfile = profiles[report.reporter_user_id];

            return (
              <Card key={report.id} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-1 ${
                        report.severity === 'critical' ? 'text-red-400' :
                        report.severity === 'high' ? 'text-orange-400' :
                        report.severity === 'medium' ? 'text-yellow-400' : 'text-slate-400'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          {report.auto_flagged && (
                            <Badge variant="outline" className="border-violet-500/30 text-violet-300">
                              Auto-flagged
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-amber-100 mb-1">
                          {report.reason.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-slate-400 text-sm mb-2">
                          <span className="font-medium">Cible:</span> {targetProfile?.display_name || 'Unknown'} ({report.target_user_id})
                        </p>
                        <p className="text-slate-400 text-sm mb-3">
                          <span className="font-medium">Reporter:</span> {reporterProfile?.display_name || 'Unknown'}
                        </p>
                        <p className="text-slate-300">{report.description}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(report.created_date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => dismissReport(report)}
                          variant="outline"
                          size="sm"
                          className="border-slate-700"
                        >
                          Rejeter
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedReport(report);
                            setActionModal(true);
                          }}
                          size="sm"
                          className="bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Examiner
                        </Button>
                      </div>
                    )}

                    {report.status === 'resolved' && (
                      <div className="text-right">
                        <p className="text-xs text-green-400 mb-1">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Résolu
                        </p>
                        <p className="text-xs text-slate-500">
                          Action: {report.action_taken}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Modal */}
      <Dialog open={actionModal} onOpenChange={setActionModal}>
        <DialogContent className="bg-slate-900 border-amber-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Action de modération</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-300 mb-2">
                  <span className="font-medium">Utilisateur ciblé:</span> {profiles[selectedReport.target_user_id]?.display_name}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-medium">Raison:</span> {selectedReport.reason}
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Action à prendre</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-800/50 border border-amber-500/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">-- Choisir --</option>
                  <option value="warn">Avertissement (pas de restriction)</option>
                  <option value="cooldown">Cooldown 3 jours</option>
                  <option value="suspend">Suspension 7 jours</option>
                  <option value="ban">Ban permanent</option>
                </select>
              </div>

              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Notes internes sur la décision..."
                className="bg-slate-800/50 border-amber-500/10 text-white"
                rows={4}
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => setActionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={processing || !actionType}
                  className="flex-1 bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                >
                  {processing ? 'Traitement...' : 'Appliquer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}