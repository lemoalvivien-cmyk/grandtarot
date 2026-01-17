import React from 'react';
import { Cloud, TrendingUp } from 'lucide-react';

export default function AstrologyDailyWeatherCard({ sunSign, lang = 'fr' }) {
  if (!sunSign) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 text-center">
        <Cloud className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">
          {lang === 'fr' ? 'Impossible de calculer la météo du jour' : 'Cannot calculate daily weather'}
        </p>
      </div>
    );
  }

  // Simple daily insights based on sun sign (deterministic, no AI)
  const dailyInsights = {
    aries: {
      fr: { insight: 'Énergie d\'initiative', action: 'Lancez ce projet qui vous tient à cœur' },
      en: { insight: 'Initiative energy', action: 'Launch that project close to your heart' }
    },
    taurus: {
      fr: { insight: 'Focus sur la stabilité', action: 'Consolidez vos acquis aujourd\'hui' },
      en: { insight: 'Focus on stability', action: 'Consolidate your gains today' }
    },
    gemini: {
      fr: { insight: 'Journée de communication', action: 'Exprimez vos idées clairement' },
      en: { insight: 'Communication day', action: 'Express your ideas clearly' }
    },
    cancer: {
      fr: { insight: 'Intuition accrue', action: 'Écoutez votre ressenti intérieur' },
      en: { insight: 'Heightened intuition', action: 'Listen to your inner feelings' }
    },
    leo: {
      fr: { insight: 'Rayonnement personnel', action: 'Montrez votre créativité' },
      en: { insight: 'Personal radiance', action: 'Show your creativity' }
    },
    virgo: {
      fr: { insight: 'Attention aux détails', action: 'Organisez et optimisez' },
      en: { insight: 'Attention to detail', action: 'Organize and optimize' }
    },
    libra: {
      fr: { insight: 'Harmonie relationnelle', action: 'Cherchez l\'équilibre dans vos échanges' },
      en: { insight: 'Relational harmony', action: 'Seek balance in your exchanges' }
    },
    scorpio: {
      fr: { insight: 'Intensité émotionnelle', action: 'Plongez en profondeur' },
      en: { insight: 'Emotional intensity', action: 'Dive deep' }
    },
    sagittarius: {
      fr: { insight: 'Soif d\'aventure', action: 'Explorez de nouveaux horizons' },
      en: { insight: 'Thirst for adventure', action: 'Explore new horizons' }
    },
    capricorn: {
      fr: { insight: 'Détermination au travail', action: 'Avancez méthodiquement' },
      en: { insight: 'Work determination', action: 'Move forward methodically' }
    },
    aquarius: {
      fr: { insight: 'Innovation et liberté', action: 'Pensez différemment' },
      en: { insight: 'Innovation and freedom', action: 'Think differently' }
    },
    pisces: {
      fr: { insight: 'Sensibilité créative', action: 'Laissez parler votre imagination' },
      en: { insight: 'Creative sensitivity', action: 'Let your imagination speak' }
    }
  };

  const daily = dailyInsights[sunSign]?.[lang] || { insight: '', action: '' };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-violet-200">
                {lang === 'fr' ? 'Météo du jour' : 'Daily Weather'}
              </h3>
            </div>
            <p className="text-slate-300">
              {daily.insight}
            </p>
          </div>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-violet-200 mb-1">
                {lang === 'fr' ? 'Action du jour' : 'Daily Action'}
              </h4>
              <p className="text-sm text-slate-300">{daily.action}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4 italic">
          {lang === 'fr' 
            ? "Signal d'aide à la décision, pas une certitude." 
            : "Decision-making signal, not a certainty."}
        </p>
      </div>
    </div>
  );
}