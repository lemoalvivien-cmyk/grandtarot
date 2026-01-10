import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Settings } from 'lucide-react';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function AppSettings() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          Paramètres
        </h1>
        <p className="text-slate-400 mt-2">Coming soon...</p>
      </div>
    </div>
    </SubscriptionGuard>
  );
}