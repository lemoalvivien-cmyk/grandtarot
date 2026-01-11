import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

/**
 * DemoStart - Conversion bridge from /demo to actual product
 * Routes user to appropriate destination based on auth/paywall/age state
 * ALLOWED to make network calls (unlike /demo which is 100% static)
 */
export default function DemoStart() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    routeUser();
  }, []);

  const routeUser = async () => {
    try {
      // Get selected mode (from localStorage or query param)
      const urlParams = new URLSearchParams(window.location.search);
      const modeFromUrl = urlParams.get('mode');
      const modeFromStorage = typeof window !== 'undefined' 
        ? localStorage.getItem('demo_selected_mode') 
        : null;
      const selectedMode = modeFromUrl || modeFromStorage || 'love';

      // Check authentication
      const isAuth = await base44.auth.isAuthenticated();

      if (!isAuth) {
        // Not authenticated -> redirect to signup/onboarding with mode preserved
        window.location.href = createPageUrl('Subscribe') + '?from_demo=' + selectedMode;
        return;
      }

      // User is authenticated - check age gate and paywall
      const user = await base44.auth.me();

      // Load account to check age_confirmed_at and plan_status
      const accounts = await base44.entities.AccountPrivate.filter(
        { user_email: user.email },
        null,
        1
      );

      if (accounts.length === 0) {
        // No account yet -> redirect to onboarding
        window.location.href = createPageUrl('AppOnboarding') + '?from_demo=' + selectedMode;
        return;
      }

      const account = accounts[0];

      // Check age gate
      if (!account.age_confirmed_at) {
        window.location.href = createPageUrl('AppOnboarding') + '?from_demo=' + selectedMode;
        return;
      }

      // Check paywall
      const settings = await base44.entities.AppSettings.filter(
        { setting_key: 'paywall_enabled' },
        null,
        1
      );

      const paywallEnabled = settings.length > 0 && settings[0].value_boolean === true;

      if (paywallEnabled && account.plan_status !== 'active') {
        // Paywall active but user not subscribed -> redirect to billing
        window.location.href = createPageUrl('Billing') + '?from_demo=' + selectedMode;
        return;
      }

      // All checks passed -> redirect to app
      window.location.href = createPageUrl('App');
    } catch (error) {
      console.error('DemoStart routing error:', error);
      // Fallback: redirect to landing
      window.location.href = createPageUrl('Landing');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-300">Préparation de votre expérience...</p>
      </div>
    </div>
  );
}