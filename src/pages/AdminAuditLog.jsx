import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Eye, Shield, Ban, AlertTriangle, Settings, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminAuditLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      const logList = await base44.entities.AuditLog.list('-created_date', 100);
      setLogs(logList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionConfig = {
    user_banned: { icon: Ban, label: 'Utilisateur banni', color: 'bg-red-500/20 text-red-400' },
    user_warned: { icon: AlertTriangle, label: 'Avertissement', color: 'bg-amber-500/20 text-amber-400' },
    report_resolved: { icon: Shield, label: 'Signalement traité', color: 'bg-green-500/20 text-green-400' },
    report_dismissed: { icon: Eye, label: 'Signalement rejeté', color: 'bg-gray-500/20 text-gray-400' },
    content_edited: { icon: FileText, label: 'Contenu modifié', color: 'bg-blue-500/20 text-blue-400' },
    settings_changed: { icon: Settings, label: 'Paramètres modifiés', color: 'bg-purple-500/20 text-purple-400' },
    subscription_updated: { icon: Shield, label: 'Abonnement modifié', color: 'bg-green-500/20 text-green-400' },
    user_deleted: { icon: Ban, label: 'Utilisateur supprimé', color: 'bg-red-500/20 text-red-400' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')} className="text-purple-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Audit Log</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-purple-200/60">Aucune action enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const config = actionConfig[log.action] || { icon: Eye, label: log.action, color: 'bg-gray-500/20 text-gray-400' };
              const Icon = config.icon;

              return (
                <div 
                  key={log.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={config.color}>{config.label}</Badge>
                      {log.target_user_id && (
                        <span className="text-sm text-purple-200/60">→ {log.target_user_id}</span>
                      )}
                    </div>
                    <p className="text-sm text-purple-300/60">
                      Par <span className="text-white">{log.admin_id}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-300/60">
                      {new Date(log.created_date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-purple-300/40">
                      {new Date(log.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}