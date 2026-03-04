import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, Star, MessageCircle, ChevronRight } from 'lucide-react';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import ModeSwitch from '@/components/ModeSwitch';
import { loadFeatureFlags } from '@/components/helpers/featureFlagsLoader';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [currentMode, setCurrentMode] = useState('love');
  const [featureFlags, setFeatureFlags] = useState({
    numerology: true,
    astrology: true
  });

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

      // Load mode from localStorage or AccountPrivate
      const storedMode = localStorage.getItem('gt_mode');
      const accounts = await base44.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1);
      const preferredMode = accounts && accounts.length > 0 ? accounts[0].preferred_mode : null;
      
      const initialMode = storedMode || preferredMode || userProfile.mode_active || 'love';
      setCurrentMode(initialMode);
      localStorage.setItem('gt_mode', initialMode);

      // Check subscription status (admins bypass) — plan_status (AccountPrivate) est la source de vérité
      if (currentUser.role !== 'admin') {
        const planStatus = accounts && accounts.length > 0 ? accounts[0].plan_status : 'free';
        if (planStatus !== 'active') {
          window.location.href = createPageUrl('Subscribe');
          return;
        }
      }

      if (!userProfile.onboarding_completed || !userProfile.photo_url) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
      }

      // Load feature flags
      const flags = await loadFeatureFlags();
      setFeatureFlags(flags);
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

  const modeData = modes[currentMode] || modes.love;
  const ModeIcon = modeData.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
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

        {/* Mode Switch */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-amber-100 mb-2">
              {lang === 'fr' ? 'Votre mode' : 'Your mode'}
            </h2>
            <p className="text-sm text-slate-400">
              {lang === 'fr' 
                ? 'Changez de mode à tout moment (3 modes inclus dans votre abonnement)' 
                : 'Switch mode anytime (3 modes included in your subscription)'}
            </p>
          </div>
          <ModeSwitch 
            initialMode={currentMode} 
            onModeChange={setCurrentMode}
            lang={lang}
          />
        </div>

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

          {/* Guidance */}
          <Link to={createPageUrl('AppGuidance')}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-100 mb-1">
                        {lang === 'fr' ? 'Guidance IA' : 'AI Guidance'}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {lang === 'fr' ? '1 guidance/jour/mode' : '1 guidance/day/mode'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Numerology (conditional) */}
          {featureFlags.numerology && (
            <Link to={createPageUrl('AppNumerology')}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                        <span className="text-2xl">🔢</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-amber-100 mb-1">
                          {lang === 'fr' ? 'Numérologie' : 'Numerology'}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {lang === 'fr' ? 'Chemin de vie' : 'Life path'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Astrology (conditional) */}
          {featureFlags.astrology && (
            <Link to={createPageUrl('AppAstrology')}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <span className="text-2xl">🌙</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-amber-100 mb-1">
                          {lang === 'fr' ? 'Astrologie' : 'Astrology'}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {lang === 'fr' ? 'Signes & compatibilité' : 'Signs & compatibility'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
      </div>
    </SubscriptionGuard>
  );
}