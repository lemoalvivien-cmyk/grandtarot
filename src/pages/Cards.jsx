import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { tarotDeck } from '@/components/helpers/tarotDeck';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function Cards() {
  const [lang, setLang] = useState('fr');
  const [selectedCard, setSelectedCard] = useState(null);
  const [filter, setFilter] = useState('all'); // all, major, minor

  const filteredCards = tarotDeck.filter(card => {
    if (filter === 'all') return true;
    return card.arcana === filter;
  });

  const content = {
    fr: {
      title: 'Encyclopédie du Tarot',
      subtitle: '78 cartes Rider-Waite',
      filterAll: 'Toutes',
      filterMajor: '22 Arcanes Majeurs',
      filterMinor: '56 Arcanes Mineurs',
      close: 'Fermer',
      back: 'Retour'
    },
    en: {
      title: 'Tarot Encyclopedia',
      subtitle: '78 Rider-Waite cards',
      filterAll: 'All',
      filterMajor: '22 Major Arcana',
      filterMinor: '56 Minor Arcana',
      close: 'Close',
      back: 'Back'
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">{t.subtitle}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>

          {/* Language Toggle */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <button
              onClick={() => setLang('fr')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                lang === 'fr' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                lang === 'en' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilter('major')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'major'
                  ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.filterMajor}
            </button>
            <button
              onClick={() => setFilter('minor')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'minor'
                  ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.filterMinor}
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCards.map((card) => (
            <Dialog key={card.id}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setSelectedCard(card)}
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-amber-500/10 hover:border-amber-500/30 transition-all hover:scale-105"
                >
                  <img
                    src={card.imagePath}
                    alt={lang === 'fr' ? card.name_fr : card.name_en}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-medium text-center">
                        {lang === 'fr' ? card.name_fr : card.name_en}
                      </p>
                    </div>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-900 border-amber-500/20">
                {selectedCard?.id === card.id && (
                  <div className="flex flex-col md:flex-row gap-6 p-6">
                    <div className="flex-shrink-0 md:w-64">
                      <img
                        src={selectedCard.imagePath}
                        alt={lang === 'fr' ? selectedCard.name_fr : selectedCard.name_en}
                        className="w-full rounded-xl border border-amber-500/20"
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-amber-100 mb-2">
                          {lang === 'fr' ? selectedCard.name_fr : selectedCard.name_en}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {selectedCard.arcana === 'major' 
                            ? (lang === 'fr' ? 'Arcane Majeur' : 'Major Arcana')
                            : (lang === 'fr' ? 'Arcane Mineur' : 'Minor Arcana')}
                          {selectedCard.suit && ` • ${selectedCard.suit}`}
                        </p>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {lang === 'fr' 
                          ? `Carte numéro ${selectedCard.number} du tarot. Méditez sur sa signification dans votre vie.`
                          : `Card number ${selectedCard.number} of the tarot. Meditate on its meaning in your life.`}
                      </p>
                      <Button
                        onClick={() => setSelectedCard(null)}
                        variant="outline"
                        className="w-full border-amber-500/30 hover:bg-amber-500/10"
                      >
                        {t.close}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Button
            onClick={() => window.location.href = createPageUrl('Landing')}
            variant="outline"
            className="border-amber-500/30 hover:bg-amber-500/10"
          >
            {t.back}
          </Button>
        </div>
      </div>
    </div>
  );
}