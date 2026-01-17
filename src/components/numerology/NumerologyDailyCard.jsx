import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { getDailyNumberKeywords } from '@/components/helpers/numerologyEngine';

export default function NumerologyDailyCard({ personalDayNum, lang = 'fr' }) {
  if (!personalDayNum) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 text-center">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">
          {lang === 'fr' ? 'Impossible de calculer le chiffre du jour' : 'Cannot calculate daily number'}
        </p>
      </div>
    );
  }

  const dailyKeywords = getDailyNumberKeywords(personalDayNum, lang);
  
  const actions = {
    1: {
      fr: 'Initiez ce projet que vous repoussez',
      en: 'Start that project you\'ve been postponing'
    },
    2: {
      fr: 'Écoutez plutôt que parler aujourd\'hui',
      en: 'Listen rather than speak today'
    },
    3: {
      fr: 'Exprimez votre créativité',
      en: 'Express your creativity'
    },
    4: {
      fr: 'Organisez et planifiez votre semaine',
      en: 'Organize and plan your week'
    },
    5: {
      fr: 'Acceptez le changement qui se présente',
      en: 'Embrace the change that presents itself'
    },
    6: {
      fr: 'Prenez soin de vos proches',
      en: 'Take care of your loved ones'
    },
    7: {
      fr: 'Prenez du temps pour vous',
      en: 'Take time for yourself'
    },
    8: {
      fr: 'Focalisez sur vos objectifs',
      en: 'Focus on your goals'
    },
    9: {
      fr: 'Finalisez ce qui est en suspens',
      en: 'Finalize what\'s pending'
    }
  };

  const action = actions[personalDayNum]?.[lang] || '';

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-amber-200">
                {lang === 'fr' ? 'Chiffre du jour' : 'Daily Number'}
              </h3>
            </div>
            <p className="text-slate-300">
              {dailyKeywords}
            </p>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{personalDayNum}</span>
          </div>
        </div>

        {action && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-amber-200 mb-1">
                  {lang === 'fr' ? 'Action du jour' : 'Daily Action'}
                </h4>
                <p className="text-sm text-slate-300">{action}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}