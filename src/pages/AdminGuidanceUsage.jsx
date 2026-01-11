import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Heart, Users, Briefcase, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminGuidanceUsage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysKey = sevenDaysAgo.toISOString().split('T')[0];

      // Load all guidance from last 7 days (limit 1000)
      const allGuidance = await base44.entities.GuidanceAnswer.list('-created_date', 1000);
      const recentGuidance = allGuidance.filter(g => g.day_key >= sevenDaysKey);

      // Group by day
      const byDay = {};
      const byMode = { amour: 0, amitie: 0, pro: 0 };
      
      recentGuidance.forEach(g => {
        if (!byDay[g.day_key]) byDay[g.day_key] = 0;
        byDay[g.day_key]++;
        byMode[g.mode] = (byMode[g.mode] || 0) + 1;
      });

      const dailyStats = Object.entries(byDay)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([day, count]) => ({ day, count }));

      setStats({
        totalWeek: recentGuidance.length,
        byMode,
        dailyStats,
        avgPerDay: (recentGuidance.length / 7).toFixed(1)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id: 'amour', label: 'Amour', icon: Heart, color: 'from-rose-500 to-pink-600' },
    { id: 'amitie', label: 'Amitié', icon: Users, color: 'from-blue-500 to-cyan-600' },
    { id: 'pro', label: 'Pro', icon: Briefcase, color: 'from-amber-500 to-orange-600' }
  ];

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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              Usage Guidance IA
            </h1>
            <p className="text-slate-400">Statistiques des 7 derniers jours (métadonnées uniquement)</p>
          </div>

          <div className="mb-6">
            <Button onClick={loadStats} variant="outline" className="border-slate-700">
              Rafraîchir
            </Button>
          </div>

          {stats && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Total 7 jours</p>
                  <p className="text-4xl font-bold text-amber-200">{stats.totalWeek}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Moyenne/jour</p>
                  <p className="text-4xl font-bold text-violet-200">{stats.avgPerDay}</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <p className="text-slate-400 text-sm">Amour</p>
                  </div>
                  <p className="text-3xl font-bold text-rose-300">{stats.byMode.amour}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <p className="text-slate-400 text-sm">Amitié</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-300">{stats.byMode.amitie}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <p className="text-slate-400 text-sm">Pro</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-300">{stats.byMode.pro}</p>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-100">Détail par jour</h3>
                </div>
                <div className="space-y-2">
                  {stats.dailyStats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                      <span className="text-slate-300">{stat.day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-violet-600 h-full"
                            style={{ width: `${(stat.count / Math.max(...stats.dailyStats.map(s => s.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-amber-300 font-semibold w-12 text-right">{stat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-200">
                  ℹ️ Par respect de la vie privée, seules les métadonnées (date, mode, compteur) sont affichées. 
                  Les questions et réponses ne sont pas consultables par les admins.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}