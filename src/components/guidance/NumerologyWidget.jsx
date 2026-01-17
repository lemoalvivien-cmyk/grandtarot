import React from 'react';
import { Hash } from 'lucide-react';
import { getDailyNumberKeywords } from '@/components/helpers/numerologyEngine';

export default function NumerologyWidget({ dailyNumber, lang = 'fr' }) {
  if (!dailyNumber) return null;

  const keywords = getDailyNumberKeywords(dailyNumber, lang);

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-purple-400" />
        <h4 className="text-sm uppercase tracking-wider text-purple-300">
          {lang === 'fr' ? 'Signal Numérologique' : 'Numerological Signal'}
        </h4>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-purple-300">{dailyNumber}</span>
        </div>
        <p className="text-slate-300 text-sm flex-1">{keywords.message}</p>
      </div>
    </div>
  );
}