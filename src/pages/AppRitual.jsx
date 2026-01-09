import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';

export default function AppRitual() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      
      if (profiles.length === 0 || !profiles[0].is_subscribed) {
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      if (!profiles[0].onboarding_completed || !profiles[0].photo_url) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          Rituel Quotidien
        </h1>
        <p className="text-slate-400 mt-2">Coming soon...</p>
      </div>
    </div>
  );
}