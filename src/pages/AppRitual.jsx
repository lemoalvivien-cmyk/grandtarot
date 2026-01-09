import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AppRitual() {
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