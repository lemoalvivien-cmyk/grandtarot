import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Shield, Users, AlertTriangle, Settings, FileText, 
  BarChart3, MessageSquare, Ban, Eye, ChevronRight, CreditCard, CheckCircle, Clock, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingReports: 0,
    totalMessages: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadStats();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [profiles, reports] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.Report.filter({ status: 'pending' })
      ]);

      setStats({
        totalUsers: profiles.length,
        activeSubscriptions: profiles.filter(p => p.is_subscribed).length,
        pendingReports: reports.length,
        totalMessages: 0 // Would need to count messages
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const adminSections = [
    { 
      title: "Utilisateurs", 
      icon: Users, 
      count: stats.totalUsers, 
      page: "AdminUsers",
      color: "bg-blue-500/20 text-blue-400"
    },
    { 
      title: "Signalements", 
      icon: AlertTriangle, 
      count: stats.pendingReports, 
      page: "AdminReports",
      color: "bg-red-500/20 text-red-400",
      urgent: stats.pendingReports > 0
    },
    { 
      title: "Contenu", 
      icon: FileText, 
      subtitle: "Cartes, Blog, Prompts", 
      page: "AdminContent",
      color: "bg-purple-500/20 text-purple-400"
    },
    { 
      title: "Abonnements", 
      icon: Settings, 
      subtitle: "Gestion & Resync", 
      page: "AdminSubscriptionManager",
      color: "bg-green-500/20 text-green-400"
    },
    { 
      title: "Config Stripe", 
      icon: Settings, 
      subtitle: "Payment Link & URLs", 
      page: "AdminStripeConfig",
      color: "bg-blue-500/20 text-blue-400"
    },
    { 
      title: "Import Tarot", 
      icon: Settings, 
      subtitle: "CSV 78 cartes", 
      page: "AdminTarotImport",
      color: "bg-purple-500/20 text-purple-400"
    },
    { 
      title: "Backend Health", 
      icon: Settings, 
      subtitle: "Functions Deployment Check", 
      page: "AdminBackendHealth",
      color: "bg-green-500/20 text-green-400"
    },
    { 
      title: "Security Fixtures", 
      icon: Shield, 
      subtitle: "Test Data Setup", 
      page: "AdminSecurityFixtures",
      color: "bg-violet-500/20 text-violet-400"
    },
    { 
      title: "Release Candidate", 
      icon: CheckCircle, 
      subtitle: "Chat Module Verification", 
      page: "AdminReleaseCheckCandidate",
      color: "bg-green-500/20 text-green-400"
    },
    { 
      title: "Launch Checklist", 
      icon: CheckCircle, 
      subtitle: "V1 Pre-Launch Verification", 
      page: "AdminLaunchChecklist",
      color: "bg-amber-500/20 text-amber-400"
    },
    { 
      title: "Billing Requests", 
      icon: CreditCard, 
      subtitle: "Approve payment proofs", 
      page: "AdminBillingRequests",
      color: "bg-green-500/20 text-green-400"
    },
    { 
      title: "Evidence Runs", 
      icon: Shield, 
      subtitle: "Saved test proofs", 
      page: "AdminEvidenceRuns",
      color: "bg-violet-500/20 text-violet-400"
    },
    { 
      title: "Prompts IA", 
      icon: Settings, 
      subtitle: "Interprétations & Modération", 
      page: "AdminAiPromptsEditor",
      color: "bg-violet-500/20 text-violet-400"
    },
    { 
      title: "Paramètres", 
      icon: Settings, 
      subtitle: "Quotas, Prix, Config", 
      page: "AdminSettings",
      color: "bg-amber-500/20 text-amber-400"
    },
    { 
      title: "Audit Log", 
      icon: Eye, 
      subtitle: "Historique actions", 
      page: "AdminAuditLog",
      color: "bg-green-500/20 text-green-400"
    },
    { 
      title: "Registre Art. 30", 
      icon: FileText, 
      subtitle: "RGPD - Traitements", 
      page: "AdminRgpdRegister",
      color: "bg-amber-500/20 text-amber-400"
    },
    { 
      title: "Politique Rétention", 
      icon: Clock, 
      subtitle: "RGPD - Conservation", 
      page: "AdminRgpdRetention",
      color: "bg-amber-500/20 text-amber-400"
    },
    { 
      title: "Procédure DSAR", 
      icon: Mail, 
      subtitle: "RGPD - Droits personnes", 
      page: "AdminRgpdDsar",
      color: "bg-amber-500/20 text-amber-400"
    }
  ];

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <span className="font-semibold text-lg">Admin GRANDTAROT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-purple-300">{user?.email}</span>
            <Link to={createPageUrl('Dashboard')} className="text-sm text-purple-400 hover:text-white">
              Retour à l'app →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-purple-300/60 text-sm">Utilisateurs</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-purple-300/60 text-sm">Abonnés actifs</p>
              <p className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-purple-300/60 text-sm">Signalements</p>
              <p className={`text-2xl font-bold ${stats.pendingReports > 0 ? 'text-red-400' : ''}`}>
                {stats.pendingReports}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <p className="text-purple-300/60 text-sm">Taux conversion</p>
              <p className="text-2xl font-bold">
                {stats.totalUsers > 0 ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        <h2 className="text-xl font-semibold mb-4">Administration</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminSections.map((section) => (
            <Link key={section.page} to={createPageUrl(section.page)}>
              <Card className={`bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer ${section.urgent ? 'border-red-500/50' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${section.color}`}>
                        <section.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{section.title}</h3>
                        {section.count !== undefined && (
                          <p className="text-purple-300/60 text-sm">{section.count} éléments</p>
                        )}
                        {section.subtitle && (
                          <p className="text-purple-300/60 text-sm">{section.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}