import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CookiePreferencesModal from './CookiePreferencesModal';
import {
  shouldShowBanner,
  generateConsentObject,
  saveConsent,
  applyConsentToAccountPrivate
} from '@/components/helpers/cookieConsent';

export default function CookieBanner({ lang = 'fr' }) {
  const [showBanner, setShowBanner] = useState(shouldShowBanner());
  const [showModal, setShowModal] = useState(false);

  const content = {
    fr: {
      title: 'Nous respectons votre vie privée',
      desc: 'Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences.',
      acceptAll: 'Tout accepter',
      rejectAll: 'Tout refuser',
      customize: 'Personnaliser',
      cookieLink: 'En savoir plus'
    },
    en: {
      title: 'We respect your privacy',
      desc: 'We use cookies to improve your experience. You can manage your preferences.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      customize: 'Customize',
      cookieLink: 'Learn more'
    }
  };

  const t = content[lang];

  const handleAcceptAll = async () => {
    const consentObj = generateConsentObject('accepted', {
      preferences: true,
      analytics: true,
      marketing: true
    });

    saveConsent(consentObj);
    await applyConsentToAccountPrivate(base44, consentObj);

    setShowBanner(false);
  };

  const handleRejectAll = async () => {
    const consentObj = generateConsentObject('rejected', {
      preferences: false,
      analytics: false,
      marketing: false
    });

    saveConsent(consentObj);
    await applyConsentToAccountPrivate(base44, consentObj);

    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowModal(true);
  };

  const handleModalSave = async (consentObj) => {
    await applyConsentToAccountPrivate(base44, consentObj);
    setShowModal(false);
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-amber-500/20 backdrop-blur-xl z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-end justify-between gap-6">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-100 mb-1">{t.title}</h3>
              <p className="text-xs text-slate-400 mb-3">{t.desc}</p>
              <Link
                to={createPageUrl('Cookies')}
                className="inline-block text-xs text-amber-200 hover:text-amber-100 underline transition-colors"
              >
                {t.cookieLink}
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleRejectAll}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 whitespace-nowrap"
              >
                {t.rejectAll}
              </Button>
              <Button
                onClick={handleCustomize}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 whitespace-nowrap px-2"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 whitespace-nowrap"
              >
                {t.acceptAll}
              </Button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <CookiePreferencesModal
          lang={lang}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}

      {/* Spacing for sticky banner */}
      {showBanner && <div className="h-24" />}
    </>
  );
}