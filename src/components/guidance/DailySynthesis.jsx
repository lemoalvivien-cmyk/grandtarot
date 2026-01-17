import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';

export default function DailySynthesis({ tarot, astro, numerology, lang = 'fr' }) {
  const content = {
    fr: {
      title: 'Synthèse du jour',
      focus: 'Focus',
      actions: 'Actions',
      disclaimer: 'Signal d\'aide à la décision, pas une certitude.'
    },
    en: {
      title: 'Daily Synthesis',
      focus: 'Focus',
      actions: 'Actions',
      disclaimer: 'Decision-making signal, not a certainty.'
    }
  };

  const t = content[lang];

  // Build synthesis from available signals
  const focus = tarot?.interpretation_json?.todayFocus || 
                (lang === 'fr' ? 'Restez attentif aux signes aujourd\'hui' : 'Stay alert to signs today');

  const actions = [];
  
  // Max 2 actions from tarot
  if (tarot?.interpretation_json?.do?.length > 0) {
    actions.push(...tarot.interpretation_json.do.slice(0, 2));
  }

  // If less than 2 actions, add from astro or numerology
  if (actions.length < 2 && astro?.action) {
    actions.push(astro.action);
  }

  // Limit to max 2 actions
  const finalActions = actions.slice(0, 2);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-violet-400" />
          <h3 className="text-xl font-semibold text-violet-200">{t.title}</h3>
        </div>

        {/* Focus */}
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-6 mb-6">
          <h4 className="text-sm uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t.focus}
          </h4>
          <p className="text-lg text-violet-100 font-medium">{focus}</p>
        </div>

        {/* Actions */}
        {finalActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm uppercase tracking-wider text-amber-400 mb-3">{t.actions}</h4>
            {finalActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-slate-300">{action}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500 mt-6 italic text-center">{t.disclaimer}</p>
      </div>
    </div>
  );
}