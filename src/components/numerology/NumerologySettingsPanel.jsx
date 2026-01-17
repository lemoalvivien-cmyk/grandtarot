import React, { useState } from 'react';
import { Lock, Globe, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function NumerologySettingsPanel({ account, onUpdate, lang = 'fr' }) {
  const [enabled, setEnabled] = useState(account?.numerology_enabled || false);
  const [scope, setScope] = useState(account?.numerology_scope || 'personal_only');
  const [name, setName] = useState(account?.numerology_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.AccountPrivate.update(account.id, {
        numerology_enabled: enabled,
        numerology_scope: scope,
        numerology_name: name || null
      });
      
      if (onUpdate) onUpdate({ ...account, numerology_enabled: enabled, numerology_scope: scope, numerology_name: name });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const content = {
    fr: {
      title: 'Paramètres Numérologie',
      enable: 'Activer la numérologie',
      enableDesc: 'Calculer votre profil et guidance quotidienne',
      scope: 'Portée de la numérologie',
      personalOnly: 'Personnel uniquement',
      personalOnlyDesc: 'Guidance pour vous, invisible aux autres',
      personalAndMatching: 'Personnel + Matching',
      personalAndMatchingDesc: 'Visible dans votre profil, utilisé pour la compatibilité',
      name: 'Nom complet (optionnel)',
      nameDesc: 'Pour calculer le Nombre d\'Expression. Si vide, seul le chemin de vie sera calculé.',
      save: 'Enregistrer',
      privacy: 'Votre vie privée est respectée : vos données numérologie ne sont jamais exposées sans votre consentement.'
    },
    en: {
      title: 'Numerology Settings',
      enable: 'Enable numerology',
      enableDesc: 'Calculate your profile and daily guidance',
      scope: 'Numerology scope',
      personalOnly: 'Personal only',
      personalOnlyDesc: 'Guidance for you, invisible to others',
      personalAndMatching: 'Personal + Matching',
      personalAndMatchingDesc: 'Visible in your profile, used for compatibility',
      name: 'Full name (optional)',
      nameDesc: 'To calculate Expression Number. If empty, only life path will be calculated.',
      save: 'Save',
      privacy: 'Your privacy is respected: your numerology data is never exposed without your consent.'
    }
  };

  const t = content[lang];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 space-y-6">
      <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
        {t.title}
      </h3>

      {/* Enable Toggle */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-amber-500/30 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
          />
          <div>
            <p className="text-white font-medium">{t.enable}</p>
            <p className="text-sm text-slate-400">{t.enableDesc}</p>
          </div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Scope Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-amber-200">{t.scope}</label>
            
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all hover:bg-slate-800/30 bg-slate-800/20 border-slate-700">
              <input
                type="radio"
                name="scope"
                value="personal_only"
                checked={scope === 'personal_only'}
                onChange={(e) => setScope(e.target.value)}
                className="mt-1 w-4 h-4 text-amber-500 focus:ring-amber-500/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">{t.personalOnly}</p>
                </div>
                <p className="text-sm text-slate-400">{t.personalOnlyDesc}</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all hover:bg-slate-800/30 bg-slate-800/20 border-slate-700">
              <input
                type="radio"
                name="scope"
                value="personal_and_matching"
                checked={scope === 'personal_and_matching'}
                onChange={(e) => setScope(e.target.value)}
                className="mt-1 w-4 h-4 text-amber-500 focus:ring-amber-500/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <p className="text-white font-medium">{t.personalAndMatching}</p>
                </div>
                <p className="text-sm text-slate-400">{t.personalAndMatchingDesc}</p>
              </div>
            </label>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-amber-200">{t.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marie Dupont"
              className="w-full px-4 py-3 bg-slate-800/50 border border-amber-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <p className="text-xs text-slate-500">{t.nameDesc}</p>
          </div>
        </>
      )}

      {/* Privacy Notice */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-300">{t.privacy}</p>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
      >
        <Save className="w-5 h-5 mr-2" />
        {saving ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : t.save}
      </Button>
    </div>
  );
}