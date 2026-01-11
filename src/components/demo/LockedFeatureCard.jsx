import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LockedFeatureCard({ title, description, lang, onUnlock }) {
  const content = {
    fr: { unlock: 'Débloquer avec l\'abonnement' },
    en: { unlock: 'Unlock with subscription' }
  };

  const t = content[lang];

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-6 border border-amber-500/20">
        <Lock className="w-8 h-8 text-amber-400 mb-3" />
        <p className="text-sm text-slate-300 text-center mb-3">{title}</p>
        <Button
          onClick={onUnlock}
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
        >
          {t.unlock}
        </Button>
      </div>

      {/* Background blur content */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 filter blur-sm">
        <div className="h-20 bg-slate-700/30 rounded mb-3" />
        <div className="h-4 bg-slate-700/30 rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-700/30 rounded w-1/2" />
      </div>
    </div>
  );
}