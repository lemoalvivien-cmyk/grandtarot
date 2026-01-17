import React from 'react';
import { Sun, Cloud } from 'lucide-react';

export default function AstroWidget({ sunSign, lang = 'fr' }) {
  if (!sunSign) return null;

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
    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-5 h-5 text-orange-400" />
        <h4 className="text-sm uppercase tracking-wider text-orange-300">
          {lang === 'fr' ? 'Signal Astrologique' : 'Astrological Signal'}
        </h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Cloud className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-300 text-sm">{daily.insight}</p>
        </div>
      </div>
    </div>
  );
}