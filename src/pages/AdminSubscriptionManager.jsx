import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Shield, Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSubscriptionManager() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(null);

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

      await loadProfiles();
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await base44.entities.UserProfile.list('-created_date', 100);
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResyncSubscription = async (profileId, newStatus) => {
    if (!confirm(`Changer le statut d'abonnement vers "${newStatus}" ?`)) return;

    setSyncing(profileId);
    try {
      const updateData = {
        subscription_status: newStatus,
        is_subscribed: newStatus === 'active' || newStatus === 'trialing'
      };

      if (newStatus === 'active' && !profiles.find(p => p.id === profileId).subscription_start) {
        updateData.subscription_start = new Date().toISOString();
        updateData.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const profile = profiles.find(p => p.id === profileId);
      await base44.entities.UserProfile.update(profileId, updateData);
      
      // Audit log
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'subscription_resynced',
        entity_name: 'UserProfile',
        entity_id: profileId,
        target_user_id: profile.user_id,
        payload_summary: `Resynced subscription to ${newStatus}`,
        payload_data: {
          old_status: profile.subscription_status,
          new_status: newStatus
        }
      });
      
      await loadProfiles();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSyncing(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchSearch = p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
                       p.user_id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.subscription_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    none: { icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Aucun' },
    active: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Actif' },
    trialing: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Trial' },
    past_due: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'En retard' },
    canceled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Annulé' }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <span className="font-semibold text-lg">Gestion Abonnements</span>
          </div>
          <Button onClick={() => window.location.href = createPageUrl('AdminDashboard')} variant="outline" className="border-amber-500/20">
            Retour Admin
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = profiles.filter(p => p.subscription_status === status).length;
            return (
              <Card key={status} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center mb-2`}>
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <p className="text-xs text-slate-400">{config.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="pl-10 bg-slate-900/50 border-amber-500/10 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-slate-900/50 border-amber-500/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-amber-500/10 text-white">
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusConfig).map(([status, config]) => (
                <SelectItem key={status} value={status}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filteredProfiles.map((profile) => {
            const config = statusConfig[profile.subscription_status] || statusConfig.none;
            return (
              <Card key={profile.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-amber-100">{profile.display_name}</h3>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg}`}>
                          <config.icon className={`w-3 h-3 ${config.color}`} />
                          <span className={config.color}>{config.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{profile.user_id}</p>
                      {profile.subscription_start && (
                        <p className="text-xs text-slate-500">
                          Début: {new Date(profile.subscription_start).toLocaleDateString('fr-FR')}
                          {profile.subscription_end && ` • Fin: ${new Date(profile.subscription_end).toLocaleDateString('fr-FR')}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={profile.subscription_status}
                        onValueChange={(newStatus) => handleResyncSubscription(profile.id, newStatus)}
                        disabled={syncing === profile.id}
                      >
                        <SelectTrigger className="w-36 bg-slate-800/50 border-amber-500/10 text-white text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-amber-500/10 text-white">
                          {Object.entries(statusConfig).map(([status, cfg]) => (
                            <SelectItem key={status} value={status}>
                              <span className="flex items-center gap-2">
                                <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {syncing === profile.id && (
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredProfiles.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
}