import React, { useState, useEffect } from 'react';
import { Download, X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.navigator.standalone === true) {
      return; // App is already installed
    }

    // Get stored dismissal
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissal = dismissedDate
      ? Math.floor((new Date() - dismissedDate) / (1000 * 60 * 60 * 24))
      : null;

    // Show banner if not dismissed or 7+ days have passed
    if (!dismissed || daysSinceDismissal >= 7) {
      if (isIOSDevice) {
        setShowBanner(true);
      }
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show banner if not dismissed or 7+ days have passed
      if (!dismissed || daysSinceDismissal >= 7) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    setDeferredPrompt(null);
    setShowBanner(false);
    setInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900/80 border-t border-amber-500/20 backdrop-blur-xl z-40 p-4">
      <div className="max-w-sm mx-auto">
        {isIOS ? (
          // iOS Installation Guide
          <div className="space-y-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-amber-100 mb-1">
                  Installer GRANDTAROT
                </h3>
                <p className="text-xs text-slate-400">
                  Accédez facilement à l'application depuis votre écran d'accueil
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Appuyez sur le bouton Partager</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Sélectionnez "Sur l'écran d'accueil"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Confirmez l'installation</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Plus tard
              </Button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Safari will handle share action
                  navigator.share?.({
                    title: 'GRANDTAROT',
                    text: 'Connexions guidées par les astres',
                    url: window.location.href
                  });
                }}
                className="flex-1"
              >
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Partager
                </Button>
              </a>
            </div>
          </div>
        ) : (
          // Android/Chrome Installation Prompt
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-amber-100 mb-1">
                Installer GRANDTAROT
              </h3>
              <p className="text-xs text-slate-400">
                Accédez à l'application directement depuis votre appareil
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {deferredPrompt && !isIOS && (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              onClick={handleInstall}
              disabled={installing}
              size="sm"
              className="flex-1 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
            >
              <Download className="w-3 h-3 mr-1" />
              {installing ? 'Installation...' : 'Installer'}
            </Button>
          </div>
        )}
      </div>

      {/* Spacing for fixed banner */}
      <div className="h-20 md:h-24" />
    </div>
  );
}