import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getStoredConsent,
  saveConsent,
  generateConsentObject
} from '@/components/helpers/cookieConsent';

export default function CookiePreferencesModal({ lang = 'fr', onClose, onSave }) {
  const consent = getStoredConsent();

  const [preferences, setPreferences] = useState(
    consent.categories?.preferences || false
  );
  const [analytics, setAnalytics] = useState(
    consent.categories?.analytics || false
  );
  const [marketing, setMarketing] = useState(
    consent.categories?.marketing || false
  );

  const content = {
    fr: {
      title: 'Gérer mes préférences de cookies',
      description: 'Vous pouvez modifier vos préférences à tout moment.',
      necessary: {
        title: 'Strictement nécessaires',
        desc: 'Essentiels pour le fonctionnement du site (auth, sécurité). Non désactivable.',
        badge: 'Toujours actif'
      },
      preferences: {
        title: 'Préférences',
        desc: 'Enregistre vos paramètres (langue, thème).'
      },
      analytics: {
        title: 'Mesure d\'audience',
        desc: 'Nous aide à comprendre comment vous utilisez le site.'
      },
      marketing: {
        title: 'Marketing',
        desc: 'Publicités personnalisées et newsletters ciblées.'
      },
      save: 'Enregistrer',
      cancel: 'Annuler',
      privacy: 'Consultez notre '
    },
    en: {
      title: 'Manage Cookie Preferences',
      description: 'You can change your preferences anytime.',
      necessary: {
        title: 'Strictly Necessary',
        desc: 'Essential for site function (auth, security). Cannot be disabled.',
        badge: 'Always active'
      },
      preferences: {
        title: 'Preferences',
        desc: 'Saves your settings (language, theme).'
      },
      analytics: {
        title: 'Audience Measurement',
        desc: 'Helps us understand how you use the site.'
      },
      marketing: {
        title: 'Marketing',
        desc: 'Personalized ads and targeted newsletters.'
      },
      save: 'Save',
      cancel: 'Cancel',
      privacy: 'See our '
    }
  };

  const t = content[lang];

  const handleSave = () => {
    const consentObj = generateConsentObject('custom', {
      preferences,
      analytics,
      marketing
    });

    saveConsent(consentObj);

    if (onSave) {
      onSave(consentObj);
    }

    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-100">{t.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{t.description}</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Necessary */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-200 mb-1">
                  {t.necessary.title}
                </h3>
                <p className="text-sm text-slate-300">{t.necessary.desc}</p>
              </div>
              <span className="ml-4 px-3 py-1 bg-green-500/20 text-green-200 text-xs rounded-full font-medium flex-shrink-0">
                {t.necessary.badge}
              </span>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-200 mb-1">
                  {t.preferences.title}
                </h3>
                <p className="text-sm text-slate-300">{t.preferences.desc}</p>
              </div>
              <button
                onClick={() => setPreferences(!preferences)}
                className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                  preferences
                    ? 'bg-green-600 border-green-600'
                    : 'bg-slate-700 border-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                    preferences ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-200 mb-1">
                  {t.analytics.title}
                </h3>
                <p className="text-sm text-slate-300">{t.analytics.desc}</p>
              </div>
              <button
                onClick={() => setAnalytics(!analytics)}
                className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                  analytics
                    ? 'bg-green-600 border-green-600'
                    : 'bg-slate-700 border-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                    analytics ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Marketing */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-200 mb-1">
                  {t.marketing.title}
                </h3>
                <p className="text-sm text-slate-300">{t.marketing.desc}</p>
              </div>
              <button
                onClick={() => setMarketing(!marketing)}
                className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                  marketing
                    ? 'bg-green-600 border-green-600'
                    : 'bg-slate-700 border-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                    marketing ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-8 py-4 flex justify-end gap-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
          >
            <Check className="w-4 h-4 mr-2" />
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}