import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Settings, Heart, Users, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function AppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [personalUseOnly, setPersonalUseOnly] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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
      }

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setPersonalUseOnly(accounts[0].personal_use_only || false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        personal_use_only: personalUseOnly
      });
      
      setAccount({ ...account, personal_use_only: personalUseOnly });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const content = {
    fr: {
      title: 'Paramètres',
      subtitle: 'Gérez votre expérience GrandTarot',
      usageMode: 'Mode d\'utilisation',
      fullMode: 'Mode complet',
      fullModeDesc: 'Guidance personnelle + Rencontres et affinités',
      personalMode: 'Guidance personnelle uniquement',
      personalModeDesc: 'Vous utilisez GrandTarot pour la guidance (Tarot, Astro, Numéro) sans participer aux rencontres',
      personalModeNotice: 'En mode guidance personnelle :',
      personalModePoints: [
        'Vous n\'apparaissez pas dans les affinités des autres utilisateurs',
        'Vous ne recevez pas d\'intentions de connexion',
        'Vous gardez accès à toutes vos guidances quotidiennes',
        'Vous pouvez réactiver le mode rencontres à tout moment'
      ],
      save: 'Enregistrer',
      saving: 'Enregistrement...'
    },
    en: {
      title: 'Settings',
      subtitle: 'Manage your GrandTarot experience',
      usageMode: 'Usage mode',
      fullMode: 'Full mode',
      fullModeDesc: 'Personal guidance + Encounters and affinities',
      personalMode: 'Personal guidance only',
      personalModeDesc: 'You use GrandTarot for guidance (Tarot, Astro, Numerology) without participating in encounters',
      personalModeNotice: 'In personal guidance mode:',
      personalModePoints: [
        'You don\'t appear in other users\' affinities',
        'You don\'t receive connection intentions',
        'You keep access to all your daily guidance',
        'You can reactivate encounter mode anytime'
      ],
      save: 'Save',
      saving: 'Saving...'
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                {t.title}
              </h1>
            </div>
            <p className="text-slate-400">{t.subtitle}</p>
          </div>

          {/* Usage Mode Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-amber-100">{t.usageMode}</h2>

            {/* Full Mode Option */}
            <label className="flex items-start gap-4 cursor-pointer p-6 rounded-xl border-2 transition-all hover:bg-slate-800/30 bg-slate-800/20 border-slate-700">
              <input
                type="radio"
                name="usage_mode"
                checked={!personalUseOnly}
                onChange={() => setPersonalUseOnly(false)}
                className="mt-1 w-5 h-5 text-amber-500 focus:ring-amber-500/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">{t.fullMode}</h3>
                </div>
                <p className="text-sm text-slate-400">{t.fullModeDesc}</p>
              </div>
            </label>

            {/* Personal Mode Option */}
            <label className="flex items-start gap-4 cursor-pointer p-6 rounded-xl border-2 transition-all hover:bg-slate-800/30 bg-slate-800/20 border-slate-700">
              <input
                type="radio"
                name="usage_mode"
                checked={personalUseOnly}
                onChange={() => setPersonalUseOnly(true)}
                className="mt-1 w-5 h-5 text-amber-500 focus:ring-amber-500/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <EyeOff className="w-5 h-5 text-violet-400" />
                  <h3 className="text-lg font-semibold text-white">{t.personalMode}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">{t.personalModeDesc}</p>
                
                {personalUseOnly && (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-violet-200 mb-3">{t.personalModeNotice}</p>
                    <ul className="space-y-2">
                      {t.personalModePoints.map((point, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </label>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? t.saving : t.save}
            </Button>
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}