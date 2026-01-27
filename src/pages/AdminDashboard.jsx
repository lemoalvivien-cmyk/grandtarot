import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Shield, Users, MessageSquare, CreditCard, Settings, 
  FileText, AlertTriangle, Activity, BarChart3, Zap,
  Star, Hash, CheckCircle, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        users,
        profiles,
        messages,
        conversations,
        intentions,
        billingPending,
        dsarPending,
        reportsPending,
        accounts
      ] = await Promise.all([
        base44.entities.User.filter({}, null, 1000),
        base44.entities.UserProfile.filter({}, null, 1000),
        base44.entities.Message.filter({}, null, 1000),
        base44.entities.Conversation.filter({}, null, 1000),
        base44.entities.Intention.filter({}, null, 1000),
        base44.entities.BillingRequest.filter({ status: 'pending' }, null, 100),
        base44.entities.DsarRequest.filter({ status: 'open' }, null, 100),
        base44.entities.Report.filter({ status: 'pending' }, null, 100),
        base44.entities.AccountPrivate.filter({}, null, 1000)
      ]);

      const activeSubscriptions = accounts.filter(a => a.plan_status === 'active').length;
      const pendingAge = accounts.filter(a => !a.age_confirmed_at).length;

      setStats({
        total_users: users.length,
        total_profiles: profiles.length,
        active_subscriptions: activeSubscriptions,
        total_messages: messages.length,
        total_conversations: conversations.length,
        total_intentions: intentions.length,
        billing_pending: billingPending.length,
        dsar_pending: dsarPending.length,
        reports_pending: reportsPending.length,
        pending_age_gate: pendingAge
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { 
      title: 'Production Readiness', 
      desc: 'V1 launch checklist', 
      icon: Rocket, 
      url: 'AdminProductionReadiness',
      color: 'from-green-500 to-emerald-600',
      critical: true
    },
    { 
      title: 'Go-Live Panel', 
      desc: 'Paywall, Stripe, SLA config', 
      icon: Zap, 
      url: 'AdminGoLive',
      color: 'from-violet-500 to-purple-600' 
    },
    { 
      title: 'Payment Smoke Check', 
      desc: 'Test Stripe config & webhook', 
      icon: CreditCard, 
      url: 'AdminPaymentSmokeCheck',
      color: 'from-green-500 to-emerald-600',
      critical: true
    },
    { 
      title: 'Backend Health', 
      desc: '5 tests backend functions', 
      icon: Activity, 
      url: 'AdminBackendHealth',
      color: 'from-blue-500 to-cyan-600' 
    },
    { 
      title: 'Release Check', 
      desc: '9 tests (Chat/Paywall/RGPD)', 
      icon: CheckCircle, 
      url: 'AdminReleaseCheck',
      color: 'from-amber-500 to-orange-600' 
    },
    { 
      title: 'Security Selftest', 
      desc: '6 tests AccessRules', 
      icon: Shield, 
      url: 'AdminSecuritySelftest',
      color: 'from-red-500 to-pink-600' 
    },
    { 
      title: 'Astro/Numero Audit', 
      desc: '7 tests scopes privacy', 
      icon: Star, 
      url: 'AdminAstroNumerologyCheck',
      color: 'from-violet-500 to-fuchsia-600' 
    },
    { 
      title: 'Users Management', 
      desc: 'View/ban users', 
      icon: Users, 
      url: 'AdminUsers',
      color: 'from-slate-500 to-slate-600' 
    },
    { 
      title: 'Billing Requests', 
      desc: `${stats?.billing_pending || 0} pending`, 
      icon: CreditCard, 
      url: 'AdminBillingRequests',
      color: 'from-green-500 to-emerald-600',
      badge: stats?.billing_pending || 0
    },
    { 
      title: 'DSAR Requests', 
      desc: `${stats?.dsar_pending || 0} open`, 
      icon: FileText, 
      url: 'AdminDsarRequests',
      color: 'from-blue-500 to-cyan-600',
      badge: stats?.dsar_pending || 0
    },
    { 
      title: 'Reports & Moderation', 
      desc: `${stats?.reports_pending || 0} pending`, 
      icon: AlertTriangle, 
      url: 'AdminReports',
      color: 'from-orange-500 to-red-600',
      badge: stats?.reports_pending || 0
    },
    { 
      title: 'Settings & Prompts', 
      desc: 'Configure app parameters', 
      icon: Settings, 
      url: 'AdminSettings',
      color: 'from-slate-500 to-slate-600' 
    },
    { 
      title: 'Guidance Usage', 
      desc: 'LLM costs & stats', 
      icon: BarChart3, 
      url: 'AdminGuidanceUsage',
      color: 'from-purple-500 to-pink-600' 
    }
  ];

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-200 to-purple-200 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-400">GRANDTAROT V1 Control Panel</p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-amber-100">{stats.total_users}</p>
            </div>
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-green-300">{stats.active_subscriptions}</p>
            </div>
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Messages</p>
              <p className="text-3xl font-bold text-blue-300">{stats.total_messages}</p>
            </div>
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Pending Actions</p>
              <p className="text-3xl font-bold text-orange-300">
                {stats.billing_pending + stats.dsar_pending + stats.reports_pending}
              </p>
            </div>
          </div>

          {/* Critical Alerts */}
          {(stats.billing_pending > 0 || stats.dsar_pending > 0 || stats.pending_age_gate > 0) && (
            <div className="mb-8 space-y-3">
              {stats.billing_pending > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  <span className="text-amber-200">
                    {stats.billing_pending} billing request(s) pending (SLA: 48h)
                  </span>
                  <Link to={createPageUrl('AdminBillingRequests')} className="ml-auto">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Review →
                    </Button>
                  </Link>
                </div>
              )}
              
              {stats.dsar_pending > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <span className="text-red-200">
                    {stats.dsar_pending} DSAR request(s) open (SLA: 30 days)
                  </span>
                  <Link to={createPageUrl('AdminDsarRequests')} className="ml-auto">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Review →
                    </Button>
                  </Link>
                </div>
              )}

              {stats.pending_age_gate > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  <span className="text-orange-200">
                    {stats.pending_age_gate} user(s) without age confirmation
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Menu Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={createPageUrl(item.url)}>
                  <div className="group relative h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-all`} />
                    <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <Icon className="w-8 h-8 text-amber-400" />
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                        {item.critical && (
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs font-bold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-amber-100">{item.title}</h3>
                      <p className="text-sm text-slate-400 flex-1">{item.desc}</p>
                      <div className="mt-4 text-amber-400 text-sm group-hover:translate-x-1 transition-transform">
                        Open →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}