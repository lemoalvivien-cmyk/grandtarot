import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminMobileReadiness() {
  const [checks, setChecks] = useState({
    manifestJson: null,
    serviceWorker: null,
    offlinePage: null,
    installBanner: null,
    viewportMeta: null,
    themeColorMeta: null,
    appleWebAppCapable: null,
    icons: {
      icon192: null,
      icon512: null,
      icon192Maskable: null,
      icon512Maskable: null
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPWAReadiness();
  }, []);

  const checkPWAReadiness = async () => {
    const newChecks = { ...checks };

    // Check manifest.json
    try {
      const manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) {
        const response = await fetch(manifest.href);
        newChecks.manifestJson = response.ok;
      } else {
        newChecks.manifestJson = false;
      }
    } catch (error) {
      newChecks.manifestJson = false;
    }

    // Check service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        newChecks.serviceWorker = !!registration;
      } catch {
        newChecks.serviceWorker = false;
      }
    } else {
      newChecks.serviceWorker = false;
    }

    // Check offline page
    try {
      const response = await fetch('/offline');
      newChecks.offlinePage = response.ok;
    } catch {
      newChecks.offlinePage = false;
    }

    // Check meta tags
    newChecks.viewportMeta = !!document.querySelector('meta[name="viewport"]');
    newChecks.themeColorMeta = !!document.querySelector('meta[name="theme-color"]');
    newChecks.appleWebAppCapable = !!document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]'
    );

    // Check install banner component (by checking if it's mounted)
    newChecks.installBanner = true; // Layout should import it

    // Check icons (basic existence check via fetch)
    const iconPaths = {
      icon192: '/icons/icon-192x192.png',
      icon512: '/icons/icon-512x512.png',
      icon192Maskable: '/icons/icon-192x192-maskable.png',
      icon512Maskable: '/icons/icon-512x512-maskable.png'
    };

    for (const [key, path] of Object.entries(iconPaths)) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        newChecks.icons[key] = response.ok;
      } catch {
        newChecks.icons[key] = false;
      }
    }

    setChecks(newChecks);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    if (status === null) return null;
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-400" />
    );
  };

  const passCount = Object.values(checks).filter((v) => v === true).length;
  const totalChecks =
    Object.keys(checks).length - 1 + Object.keys(checks.icons).length;
  const passPercentage = Math.round((passCount / totalChecks) * 100);

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  const isPWAReady = passPercentage === 100;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-purple-200">PWA & Mobile Readiness</h1>
          <p className="text-slate-400 mb-8">Vérifiez si GRANDTAROT est prête pour mobile</p>

          {/* Score Card */}
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-2">Readiness Score</p>
                  <p className="text-5xl font-bold text-amber-200">{passPercentage}%</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {passCount}/{totalChecks} checks passed
                  </p>
                </div>
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${
                    isPWAReady
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-amber-500/50 bg-amber-500/10'
                  }`}
                >
                  <div className="text-center">
                    <Eye
                      className={`w-8 h-8 mx-auto mb-2 ${
                        isPWAReady ? 'text-green-400' : 'text-amber-400'
                      }`}
                    />
                    <span className={isPWAReady ? 'text-green-200' : 'text-amber-200'}>
                      {isPWAReady ? 'READY' : 'REVIEW'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-6">Detailed Checklist</h2>

            {/* Core PWA */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-200">Core PWA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ChecklistItem
                  title="manifest.json"
                  status={checks.manifestJson}
                  path="/public/manifest.json"
                />
                <ChecklistItem
                  title="Service Worker"
                  status={checks.serviceWorker}
                  path="/public/sw.js"
                />
                <ChecklistItem
                  title="Offline Fallback"
                  status={checks.offlinePage}
                  path="/pages/Offline.jsx"
                />
                <ChecklistItem
                  title="Install Banner"
                  status={checks.installBanner}
                  path="/components/pwa/InstallBanner.jsx"
                />
              </CardContent>
            </Card>

            {/* Meta Tags */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-200">Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ChecklistItem
                  title="Viewport Meta"
                  status={checks.viewportMeta}
                  code='<meta name="viewport" content="width=device-width, initial-scale=1">'
                />
                <ChecklistItem
                  title="Theme Color"
                  status={checks.themeColorMeta}
                  code='<meta name="theme-color" content="#1e293b">'
                />
                <ChecklistItem
                  title="Apple Web App Capable"
                  status={checks.appleWebAppCapable}
                  code='<meta name="apple-mobile-web-app-capable" content="yes">'
                />
              </CardContent>
            </Card>

            {/* Icons */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-200">App Icons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ChecklistItem
                  title="192x192 Icon"
                  status={checks.icons.icon192}
                  path="/public/icons/icon-192x192.png"
                />
                <ChecklistItem
                  title="512x512 Icon"
                  status={checks.icons.icon512}
                  path="/public/icons/icon-512x512.png"
                />
                <ChecklistItem
                  title="192x192 Maskable"
                  status={checks.icons.icon192Maskable}
                  path="/public/icons/icon-192x192-maskable.png"
                />
                <ChecklistItem
                  title="512x512 Maskable"
                  status={checks.icons.icon512Maskable}
                  path="/public/icons/icon-512x512-maskable.png"
                />
              </CardContent>
            </Card>

            {/* Recommendations */}
            {!isPWAReady && (
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-amber-200">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-amber-100">
                    <li>
                      ✓ Generate missing icons using a PWA icon generator
                    </li>
                    <li>
                      ✓ Ensure all meta tags are present in public/index.html
                    </li>
                    <li>
                      ✓ Register service worker in your main app component
                    </li>
                    <li>
                      ✓ Test PWA with Lighthouse (DevTools → Audits)
                    </li>
                    <li>
                      ✓ Deploy to production (PWA requires HTTPS)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-xs text-slate-500 text-center">
            Last checked: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

function ChecklistItem({ title, status, path, code }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex-1">
        <p className="font-medium text-slate-200">{title}</p>
        {path && <p className="text-xs text-slate-500 font-mono mt-1">{path}</p>}
        {code && <p className="text-xs text-slate-500 font-mono mt-1">{code}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{getStatusIcon(status)}</div>
    </div>
  );
}

function getStatusIcon(status) {
  if (status === null) return null;
  return status ? (
    <CheckCircle className="w-5 h-5 text-green-400" />
  ) : (
    <AlertCircle className="w-5 h-5 text-red-400" />
  );
}