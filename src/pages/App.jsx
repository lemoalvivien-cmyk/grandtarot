import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, Star, MessageCircle, ChevronRight } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      if (profiles.length === 0) {
        await base44.entities.UserProfile.create({
          user_id: currentUser.email,
          display_name: currentUser.full_name || '',
          is_subscribed: false
        });
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      const userProfile = profiles[0];
      setProfile(userProfile);
      setLang(userProfile.language_pref || 'fr');

      if (!userProfile.is_subscribed && currentUser.role !== 'admin') {
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      if (!userProfile.onboarding_completed) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      welcome: "Bienvenue",
      ritual: "Rituel Quotidien",
      ritualDesc: "Votre tirage du jour vous attend",
      synchros: "Vos Synchros",
      synchrosDesc: "20 affinités cosmiques",
      intentions: "Intentions",
      intentionsDesc: "Messages et connexions"
    },
    en: {
      welcome: "Welcome",
      ritual: "Daily Ritual",
      ritualDesc: "Your reading awaits",
      synchros: "Your Synchros",
      synchrosDesc: "20 cosmic affinities",
      intentions: "Intentions",
      intentionsDesc: "Messages and connections"
    }
  };

  const t = content[lang];

  const modes = {
    love: { icon: Heart, label: lang === 'fr' ? 'Amour' : 'Love', color: 'from-rose-500 to-pink-600' },
    friendship: { icon: Users, label: lang === 'fr' ? 'Amitié' : 'Friendship', color: 'from-blue-500 to-cyan-600' },
    professional: { icon: Briefcase, label: lang === 'fr' ? 'Pro' : 'Pro', color: 'from-amber-500 to-orange-600' }
  };

  const currentMode = modes[profile?.mode_active] || modes.love;
  const ModeIcon = currentMode.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.welcome}, {profile?.display_name || user?.full_name}
          </h1>
          <p className="text-slate-400">
            {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Current Mode */}
        <Link to={createPageUrl('AppSettings')}>
          <div className={`relative group mb-8 overflow-hidden rounded-2xl`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${currentMode.color} opacity-20 group-hover:opacity-30 transition-all`} />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 group-hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentMode.color} flex items-center justify-center`}>
                  <ModeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{lang === 'fr' ? 'Mode actif' : 'Active mode'}</p>
                  <p className="text-lg font-semibold text-amber-100">{currentMode.label}</p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Ritual */}
          <Link to={createPageUrl('AppRitual')}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-violet-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 flex items-center justify-center">
                      <Star className="w-7 h-7 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-100 mb-1">{t.ritual}</h3>
                      <p className="text-sm text-slate-400">{t.ritualDesc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Synchros */}
          <Link to={createPageUrl('AppSynchros')}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-100 mb-1">{t.synchros}</h3>
                      <p className="text-sm text-slate-400">{t.synchrosDesc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Intentions */}
          <Link to={createPageUrl('AppIntentions')}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <MessageCircle className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-100 mb-1">{t.intentions}</h3>
                      <p className="text-sm text-slate-400">{t.intentionsDesc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}