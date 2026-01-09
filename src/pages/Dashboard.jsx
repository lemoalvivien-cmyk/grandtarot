import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Login');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check subscription
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      if (profiles.length === 0) {
        // Create profile and redirect to paywall
        await base44.entities.UserProfile.create({
          user_id: currentUser.email,
          display_name: currentUser.full_name || '',
          is_subscribed: false
        });
        window.location.href = createPageUrl('Paywall');
        return;
      }

      const userProfile = profiles[0];
      setProfile(userProfile);
      setLang(userProfile.language || 'fr');

      // Check subscription
      if (!userProfile.is_subscribed) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      // Check onboarding
      if (!userProfile.onboarding_completed) {
        window.location.href = createPageUrl('Onboarding');
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
      daily: "Tirage du jour",
      dailyDesc: "Découvrez votre guidance quotidienne",
      affinities: "Vos affinités",
      affinitiesDesc: "20 profils compatibles aujourd'hui",
      messages: "Messages",
      messagesDesc: "Vos conversations en cours",
      modes: {
        amour: { icon: Heart, label: "Amour", color: "from-pink-500 to-rose-500" },
        amitie: { icon: Users, label: "Amitié", color: "from-blue-500 to-cyan-500" },
        pro: { icon: Briefcase, label: "Pro", color: "from-amber-500 to-orange-500" }
      }
    },
    en: {
      welcome: "Welcome",
      daily: "Daily Reading",
      dailyDesc: "Discover your daily guidance",
      affinities: "Your Affinities",
      affinitiesDesc: "20 compatible profiles today",
      messages: "Messages",
      messagesDesc: "Your ongoing conversations",
      modes: {
        amour: { icon: Heart, label: "Love", color: "from-pink-500 to-rose-500" },
        amitie: { icon: Users, label: "Friendship", color: "from-blue-500 to-cyan-500" },
        pro: { icon: Briefcase, label: "Pro", color: "from-amber-500 to-orange-500" }
      }
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentMode = t.modes[profile?.mode || 'amour'];
  const ModeIcon = currentMode.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="font-semibold">GRANDTAROT</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-xs ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold mb-1">
            {t.welcome}, {profile?.display_name || user?.full_name || 'Guest'}
          </h1>
          <p className="text-purple-200/60 text-sm">
            {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Current Mode */}
        <div className={`bg-gradient-to-r ${currentMode.color} rounded-2xl p-4 mb-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <ModeIcon className="w-6 h-6" />
            <div>
              <p className="text-xs text-white/70">{lang === 'fr' ? 'Mode actif' : 'Active mode'}</p>
              <p className="font-semibold">{currentMode.label}</p>
            </div>
          </div>
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              {lang === 'fr' ? 'Changer' : 'Change'}
            </Button>
          </Link>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Daily Reading */}
          <Link to={createPageUrl('DailyReading')} className="block">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Star className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t.daily}</h3>
                    <p className="text-purple-200/60 text-sm">{t.dailyDesc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Affinities */}
          <Link to={createPageUrl('Affinities')} className="block">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t.affinities}</h3>
                    <p className="text-purple-200/60 text-sm">{t.affinitiesDesc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Messages */}
          <Link to={createPageUrl('Messages')} className="block">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t.messages}</h3>
                    <p className="text-purple-200/60 text-sm">{t.messagesDesc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Nav placeholder - will be in Layout */}
    </div>
  );
}