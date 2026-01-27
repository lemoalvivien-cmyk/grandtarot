import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Hash, Loader2 } from 'lucide-react';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import NumerologyProfileCard from '@/components/numerology/NumerologyProfileCard';
import NumerologyDailyCard from '@/components/numerology/NumerologyDailyCard';
import NumerologySettingsPanel from '@/components/numerology/NumerologySettingsPanel';

export default function AppNumerology() {
  const [loading, setLoading] = useState(true);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    checkFeatureFlag();
  }, []);

  const checkFeatureFlag = async () => {
    try {
      // CHECK: Feature flag must be enabled
      const flags = await base44.entities.AppSettings.filter({
        setting_key: 'feature_numerology'
      }, null, 1);
      
      if (flags.length === 0 || flags[0].value_boolean !== true) {
        setFeatureEnabled(false);
        setLoading(false);
        return;
      }
      
      const currentUser = await base44.auth.me();
      const accounts = await base44.entities.AccountPrivate.filter({
        user_email: currentUser.email
      }, null, 1);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </SubscriptionGuard>
    );
  }

  if (!featureEnabled) {
    // GUARD: Feature disabled → redirect
    window.location.href = createPageUrl('App');
    return null;
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <Hash className="w-4 h-4 text-amber-400" />
              <span className="text-amber-200 text-sm">Numérologie</span>
            </div>
            <h1 className="text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
              Votre Chemin de Vie
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <NumerologyProfileCard account={account} />
            <NumerologyDailyCard account={account} />
          </div>

          <div className="mt-8">
            <NumerologySettingsPanel account={account} onUpdate={setAccount} />
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}