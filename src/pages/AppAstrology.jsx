import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sun, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import AstrologyProfileCard from '@/components/astrology/AstrologyProfileCard';
import AstrologyDailyWeatherCard from '@/components/astrology/AstrologyDailyWeatherCard';
import AstrologySettingsPanel from '@/components/astrology/AstrologySettingsPanel';
import { getSunSign } from '@/components/helpers/astrologyEngine';

export default function AppAstrology() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [lang, setLang] = useState('fr');
  const [sunSign, setSunSign] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [profiles, accounts] = await Promise.all([
        base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1),
        base44.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1)
      ]);

      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setLang(profiles[0].language_pref || 'fr');
        calculateAstrology(profiles[0]);
      }

      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAstrology = (userProfile) => {
    if (!userProfile) return;

    const birthDate = {
      year: userProfile.birth_year,
      month: userProfile.birth_month,
      day: userProfile.birth_day
    };

    const sign = getSunSign(birthDate);
    setSunSign(sign);
  };

  const handleSettingsUpdate = (updatedAccount) => {
    setAccount(updatedAccount);
  };

  const content = {
    fr: {
      title: 'Astrologie',
      subtitle: 'Découvrez votre profil astrologique',
      notEnabled: 'L\'astrologie n\'est pas encore activée',
      notEnabledDesc: 'Activez l\'astrologie pour découvrir votre signe solaire, votre météo du jour et recevoir une guidance personnalisée.',
      enableBtn: 'Activer l\'astrologie',
      missingData: 'Données incomplètes',
      missingDataDesc: 'Votre date de naissance complète (jour/mois/année) est nécessaire pour les calculs astrologie.',
      updateProfile: 'Compléter mon profil',
      profile: 'Votre Profil',
      daily: 'Aujourd\'hui',
      settings: 'Paramètres'
    },
    en: {
      title: 'Astrology',
      subtitle: 'Discover your astrological profile',
      notEnabled: 'Astrology is not yet enabled',
      notEnabledDesc: 'Enable astrology to discover your sun sign, your daily weather and receive personalized guidance.',
      enableBtn: 'Enable astrology',
      missingData: 'Incomplete data',
      missingDataDesc: 'Your complete birth date (day/month/year) is required for astrology calculations.',
      updateProfile: 'Complete my profile',
      profile: 'Your Profile',
      daily: 'Today',
      settings: 'Settings'
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sun className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                {t.title}
              </h1>
            </div>
            <p className="text-slate-400">{t.subtitle}</p>
          </div>

          {/* Not Enabled State */}
          {!account?.astrology_enabled && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-8 md:p-12 text-center">
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-6" />
              <h2 className="text-2xl font-serif font-bold mb-4 text-amber-100">
                {t.notEnabled}
              </h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                {t.notEnabledDesc}
              </p>
              <Button
                onClick={() => {
                  const settingsSection = document.getElementById('astrology-settings');
                  if (settingsSection) settingsSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-8 py-6 text-lg"
              >
                {t.enableBtn}
              </Button>
            </div>
          )}

          {/* Enabled State */}
          {account?.astrology_enabled && (
            <>
              {/* Missing Data Warning */}
              {(!profile?.birth_year || !profile?.birth_month || !profile?.birth_day) && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-orange-200 mb-2">{t.missingData}</h3>
                      <p className="text-orange-300 mb-4">{t.missingDataDesc}</p>
                      <Button
                        onClick={() => window.location.href = '/app-settings'}
                        variant="outline"
                        className="border-orange-500/30 text-orange-200 hover:bg-orange-500/10"
                      >
                        {t.updateProfile}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Grid */}
              {sunSign && (
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  {/* Profile Card */}
                  <div>
                    <h2 className="text-xl font-semibold text-amber-100 mb-4">{t.profile}</h2>
                    <AstrologyProfileCard sunSign={sunSign} lang={lang} />
                  </div>

                  {/* Daily Weather Card */}
                  <div>
                    <h2 className="text-xl font-semibold text-amber-100 mb-4">{t.daily}</h2>
                    <AstrologyDailyWeatherCard sunSign={sunSign} lang={lang} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Settings Panel */}
          <div id="astrology-settings">
            <h2 className="text-xl font-semibold text-amber-100 mb-4">{t.settings}</h2>
            <AstrologySettingsPanel
              account={account}
              onUpdate={handleSettingsUpdate}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}