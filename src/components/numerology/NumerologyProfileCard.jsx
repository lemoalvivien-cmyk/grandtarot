import React from 'react';
import { Hash, User, Sparkles } from 'lucide-react';
import { getLifePathKeywords } from '@/components/helpers/numerologyEngine';

export default function NumerologyProfileCard({ lifePathNum, expressionNum, lang = 'fr' }) {
  if (!lifePathNum) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 text-center">
        <Hash className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">
          {lang === 'fr' ? 'Données insuffisantes pour calculer votre profil' : 'Insufficient data to calculate your profile'}
        </p>
      </div>
    );
  }

  const lifePathKeywords = getLifePathKeywords(lifePathNum);

  return (
    <div className="space-y-6">
      {/* Life Path */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
        <div className="relative bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-violet-200">
                  {lang === 'fr' ? 'Chemin de vie' : 'Life Path'}
                </h3>
              </div>
              <p className="text-2xl font-serif font-bold text-violet-100">
                {lifePathKeywords[lang === 'fr' ? 'theme_fr' : 'theme_en']}
              </p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{lifePathNum}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {lifePathKeywords[lang === 'fr' ? 'keywords_fr' : 'keywords_en'].map((keyword, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expression Number (if available) */}
      {expressionNum && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-amber-200">
                  {lang === 'fr' ? 'Nombre d\'Expression' : 'Expression Number'}
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'fr' ? 'Basé sur votre nom complet' : 'Based on your full name'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{expressionNum}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}