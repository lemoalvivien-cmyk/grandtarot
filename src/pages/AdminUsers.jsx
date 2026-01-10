import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Search, Ban, Eye, MoreVertical, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');

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

      const [userList, profileList] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.UserProfile.list()
      ]);

      setUsers(userList);
      setProfiles(profileList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (profile) => {
    try {
      await base44.entities.UserProfile.update(profile.id, {
        is_banned: !profile.is_banned,
        ban_reason: !profile.is_banned ? 'Admin action' : null
      });

      // Log action
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: profile.is_banned ? 'user_unbanned' : 'user_banned',
        entity_name: 'UserProfile',
        entity_id: profile.id,
        target_user_id: profile.user_id,
        payload_summary: profile.is_banned ? 'User unbanned' : 'User banned',
        severity: 'warning'
      });

      // Refresh
      const updatedProfiles = await base44.entities.UserProfile.list();
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resyncSubscription = async (profile) => {
    try {
      // This would typically call a Stripe API to check subscription status
      // For now, just update based on stripe_subscription_id presence
      const hasStripeSubscription = !!profile.stripe_subscription_id;
      
      await base44.entities.UserProfile.update(profile.id, {
        subscription_status: hasStripeSubscription ? 'active' : 'none',
        is_subscribed: hasStripeSubscription
      });

      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'subscription_resynced',
        entity_name: 'UserProfile',
        entity_id: profile.id,
        target_user_id: profile.user_id,
        payload_summary: `Subscription resynced to ${hasStripeSubscription ? 'active' : 'none'}`
      });

      alert('Subscription resynchronisée');
      const updatedProfiles = await base44.entities.UserProfile.list();
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Error resyncing:', error);
    }
  };

  const getProfile = (email) => profiles.find(p => p.user_id === email);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')} className="text-purple-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Gestion des utilisateurs</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-purple-300">Email</TableHead>
                <TableHead className="text-purple-300">Nom</TableHead>
                <TableHead className="text-purple-300">Abonné</TableHead>
                <TableHead className="text-purple-300">Trust Score</TableHead>
                <TableHead className="text-purple-300">Statut</TableHead>
                <TableHead className="text-purple-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const profile = getProfile(user.email);
                return (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell>{profile?.display_name || user.full_name || '-'}</TableCell>
                    <TableCell>
                      {profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing' ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          {profile.subscription_status}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400">
                          {profile?.subscription_status || 'none'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{profile?.trust_score || 50}</span>
                    </TableCell>
                    <TableCell>
                      {profile?.is_banned ? (
                        <Badge className="bg-red-500/20 text-red-400">Banni</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-purple-300">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
                          {profile && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => resyncSubscription(profile)}
                                className="hover:bg-white/10"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Resync Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleBan(profile)}
                                className="hover:bg-white/10"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                {profile.is_banned ? 'Débannir' : 'Bannir'}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}