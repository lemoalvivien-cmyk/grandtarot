import React from 'react';
import { Sun, Sparkles, Wind } from 'lucide-react';
import { getSignKeywords, getElement } from '@/components/helpers/astrologyEngine';

export default function AstrologyProfileCard({ sunSign, lang = 'fr' }) {
  if (!sunSign) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 text-center">
        <Sun className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">
          {lang === 'fr' ? 'Données insuffisantes pour calculer votre profil' : 'Insufficient data to calculate your profile'}
        </p>
      </div>
    );
  }

  const keywords = getSignKeywords(sunSign);
  const element = getElement(sunSign);

  const elementColors = {
    fire: 'from-red-500 to-orange-600',
    earth: 'from-green-500 to-emerald-600',
    air: 'from-blue-500 to-cyan-600',
    water: 'from-indigo-500 to-purple-600'
  };

  const elementIcons = {
    fire: '🔥',
    earth: '🌿',
    air: '💨',
    water: '💧'
  };

  const elementLabels = {
    fire: { fr: 'Feu', en: 'Fire' },
    earth: { fr: 'Terre', en: 'Earth' },
    air: { fr: 'Air', en: 'Air' },
    water: { fr: 'Eau', en: 'Water' }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-amber-200">
                {lang === 'fr' ? 'Signe Solaire' : 'Sun Sign'}
              </h3>
            </div>
            <p className="text-2xl font-serif font-bold text-amber-100 capitalize">
              {keywords[lang === 'fr' ? 'theme_fr' : 'theme_en']}
            </p>
          </div>
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${elementColors[element] || 'from-amber-500 to-orange-600'} flex items-center justify-center`}>
            <span className="text-4xl">{elementIcons[element] || '☀️'}</span>
          </div>
        </div>

        {/* Element Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${elementColors[element]} bg-opacity-20 border border-amber-500/20 rounded-xl text-sm font-medium text-amber-100`}>
            <Wind className="w-4 h-4" />
            {lang === 'fr' ? 'Élément' : 'Element'}: {elementLabels[element]?.[lang] || element}
          </span>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-2">
          {keywords[lang === 'fr' ? 'keywords_fr' : 'keywords_en'].map((keyword, i) => (
            <span
              key={i}
              className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-200"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}