import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Settings, Heart, Users, Eye, EyeOff, Save, Star, Hash, Trash2, AlertTriangle, X } from 'lucide-react';
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
  const [showPersonalModeConfirm, setShowPersonalModeConfirm] = useState(false);
  
  // Astro/Num states
  const [astrologyEnabled, setAstrologyEnabled] = useState(false);
  const [astrologyScope, setAstrologyScope] = useState('personal_only');
  const [numerologyEnabled, setNumerologyEnabled] = useState(false);
  const [numerologyScope, setNumerologyScope] = useState('personal_only');

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
        setAstrologyEnabled(accounts[0].astrology_enabled || false);
        setAstrologyScope(accounts[0].astrology_scope || 'personal_only');
        setNumerologyEnabled(accounts[0].numerology_enabled || false);
        setNumerologyScope(accounts[0].numerology_scope || 'personal_only');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalModeToggle = (value) => {
    if (value && !personalUseOnly) {
      // User is trying to enable personal_use_only => show confirmation
      setShowPersonalModeConfirm(true);
    } else {
      // User is disabling => direct save
      setPersonalUseOnly(value);
    }
  };

  const confirmPersonalMode = () => {
    setPersonalUseOnly(true);
    setShowPersonalModeConfirm(false);
  };

  const handleSaveAstrology = async () => {
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        astrology_enabled: astrologyEnabled,
        astrology_scope: astrologyScope
      });
      alert(lang === 'fr' ? '✓ Paramètres astrologie sauvegardés' : '✓ Astrology settings saved');
    } catch (error) {
      alert(lang === 'fr' ? '❌ Erreur lors de la sauvegarde' : '❌ Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAstroData = async () => {
    if (!confirm(lang === 'fr' 
      ? 'Supprimer toutes vos données astrologiques ?' 
      : 'Delete all your astrology data?')) return;
    
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        astrology_enabled: false,
        birth_time: null,
        birth_place: null,
        birth_place_meta: null
      });
      setAstrologyEnabled(false);
      alert(lang === 'fr' ? '✓ Données astro supprimées' : '✓ Astro data deleted');
    } catch (error) {
      alert(lang === 'fr' ? '❌ Erreur' : '❌ Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNumerology = async () => {
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        numerology_enabled: numerologyEnabled,
        numerology_scope: numerologyScope
      });
      alert(lang === 'fr' ? '✓ Paramètres numérologie sauvegardés' : '✓ Numerology settings saved');
    } catch (error) {
      alert(lang === 'fr' ? '❌ Erreur lors de la sauvegarde' : '❌ Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNumData = async () => {
    if (!confirm(lang === 'fr' 
      ? 'Supprimer toutes vos données numérologie ?' 
      : 'Delete all your numerology data?')) return;
    
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        numerology_enabled: false,
        numerology_name: null
      });
      setNumerologyEnabled(false);
      alert(lang === 'fr' ? '✓ Données numérologie supprimées' : '✓ Numerology data deleted');
    } catch (error) {
      alert(lang === 'fr' ? '❌ Erreur' : '❌ Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonalMode = async () => {
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        personal_use_only: personalUseOnly
      });
      
      setAccount({ ...account, personal_use_only: personalUseOnly });
      alert(lang === 'fr' ? '✓ Mode enregistré' : '✓ Mode saved');
    } catch (error) {
      alert(lang === 'fr' ? '❌ Erreur lors de la sauvegarde' : '❌ Save error');
    } finally {
      setSaving(false);
    }
  };

  const content = {
    fr: {
      title: 'Paramètres',
      subtitle: 'Gérez votre expérience GrandTarot',
      astroTitle: 'Astrologie',
      astroDesc: 'Gérez vos paramètres astrologiques',
      numTitle: 'Numérologie',
      numDesc: 'Gérez vos paramètres numérologiques',
      enabled: 'Activé',
      disabled: 'Désactivé',
      scope: 'Portée',
      scopePersonalOnly: 'Pour moi uniquement',
      scopeMatching: 'Pour moi + compatibilité',
      deleteData: 'Supprimer mes données',
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
      confirmTitle: '⚠️ Activer le mode Guidance uniquement ?',
      confirmMsg: 'Vous ne verrez plus les Synchros ni le Matching. Vous garderez accès à toutes vos guidances personnelles (Tarot, Astrologie, Numérologie).',
      confirmBtn: 'Confirmer',
      cancelBtn: 'Annuler',
      save: 'Enregistrer',
      saving: 'Enregistrement...'
    },
    en: {
      title: 'Settings',
      subtitle: 'Manage your GrandTarot experience',
      astroTitle: 'Astrology',
      astroDesc: 'Manage your astrology settings',
      numTitle: 'Numerology',
      numDesc: 'Manage your numerology settings',
      enabled: 'Enabled',
      disabled: 'Disabled',
      scope: 'Scope',
      scopePersonalOnly: 'For me only',
      scopeMatching: 'For me + compatibility',
      deleteData: 'Delete my data',
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
      confirmTitle: '⚠️ Enable Guidance-only mode?',
      confirmMsg: 'You will no longer see Synchros or Matching. You will keep access to all your personal guidance (Tarot, Astrology, Numerology).',
      confirmBtn: 'Confirm',
      cancelBtn: 'Cancel',
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

          {/* Astrology Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-8 space-y-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-violet-400" />
              <div>
                <h2 className="text-2xl font-serif font-bold text-violet-100">{t.astroTitle}</h2>
                <p className="text-sm text-slate-400">{t.astroDesc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <span className="text-sm text-slate-300">{astrologyEnabled ? t.enabled : t.disabled}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={astrologyEnabled}
                  onChange={(e) => setAstrologyEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>

            {astrologyEnabled && (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-3">{t.scope}</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 cursor-pointer hover:border-violet-500/50 transition-all">
                      <input
                        type="radio"
                        name="astrology_scope"
                        checked={astrologyScope === 'personal_only'}
                        onChange={() => setAstrologyScope('personal_only')}
                        className="w-4 h-4 accent-violet-500"
                      />
                      <span className="text-sm text-slate-200">{t.scopePersonalOnly}</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 cursor-pointer hover:border-violet-500/50 transition-all">
                      <input
                        type="radio"
                        name="astrology_scope"
                        checked={astrologyScope === 'personal_and_matching'}
                        onChange={() => setAstrologyScope('personal_and_matching')}
                        className="w-4 h-4 accent-violet-500"
                      />
                      <span className="text-sm text-slate-200">{t.scopeMatching}</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAstrology}
                    disabled={saving}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? t.saving : t.save}
                  </Button>
                  <Button
                    onClick={handleDeleteAstroData}
                    disabled={saving}
                    variant="outline"
                    className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.deleteData}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Numerology Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 space-y-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Hash className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-2xl font-serif font-bold text-amber-100">{t.numTitle}</h2>
                <p className="text-sm text-slate-400">{t.numDesc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <span className="text-sm text-slate-300">{numerologyEnabled ? t.enabled : t.disabled}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={numerologyEnabled}
                  onChange={(e) => setNumerologyEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {numerologyEnabled && (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-3">{t.scope}</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 cursor-pointer hover:border-amber-500/50 transition-all">
                      <input
                        type="radio"
                        name="numerology_scope"
                        checked={numerologyScope === 'personal_only'}
                        onChange={() => setNumerologyScope('personal_only')}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-slate-200">{t.scopePersonalOnly}</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 cursor-pointer hover:border-amber-500/50 transition-all">
                      <input
                        type="radio"
                        name="numerology_scope"
                        checked={numerologyScope === 'personal_and_matching'}
                        onChange={() => setNumerologyScope('personal_and_matching')}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-slate-200">{t.scopeMatching}</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveNumerology}
                    disabled={saving}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? t.saving : t.save}
                  </Button>
                  <Button
                    onClick={handleDeleteNumData}
                    disabled={saving}
                    variant="outline"
                    className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.deleteData}
                  </Button>
                </div>
              </>
            )}
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
                onChange={() => handlePersonalModeToggle(true)}
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
              onClick={handleSavePersonalMode}
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? t.saving : t.save}
            </Button>
          </div>

          {/* Confirmation Modal for Personal Use Only */}
          {showPersonalModeConfirm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <h3 className="text-2xl font-serif font-bold text-amber-100">{t.confirmTitle}</h3>
                </div>
                
                <p className="text-slate-300 mb-8 leading-relaxed">{t.confirmMsg}</p>
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => setShowPersonalModeConfirm(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t.cancelBtn}
                  </Button>
                  <Button
                    onClick={confirmPersonalMode}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
                  >
                    {t.confirmBtn}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}