import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Search, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function Encyclopedia() {
  const [lang, setLang] = useState('fr');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, major, wands, cups, swords, pentacles

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await base44.entities.TarotCard.list('number', 100);
      setCards(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Encyclopédie du Tarot",
      subtitle: "Les 78 lames expliquées",
      search: "Rechercher une carte...",
      filters: {
        all: "Toutes",
        major: "Arcanes Majeurs",
        wands: "Bâtons",
        cups: "Coupes",
        swords: "Épées",
        pentacles: "Deniers"
      },
      back: "Retour"
    },
    en: {
      title: "Tarot Encyclopedia",
      subtitle: "All 78 cards explained",
      search: "Search a card...",
      filters: {
        all: "All",
        major: "Major Arcana",
        wands: "Wands",
        cups: "Cups",
        swords: "Swords",
        pentacles: "Pentacles"
      },
      back: "Back"
    }
  };

  const t = content[lang];

  const filteredCards = cards.filter(card => {
    const name = lang === 'fr' ? card.name_fr : card.name_en;
    const keywords = lang === 'fr' ? card.keywords_fr : card.keywords_en;
    const searchLower = search.toLowerCase();
    
    const matchSearch = name?.toLowerCase().includes(searchLower) || 
                        keywords?.some(kw => kw.toLowerCase().includes(searchLower));
    
    const matchFilter = filter === 'all' || 
      (filter === 'major' && card.arcana_type === 'major') ||
      (card.arcana_type === 'minor' && card.suit === filter);
    
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Title */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">{t.title}</h1>
        <p className="text-slate-400">{t.subtitle}</p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="pl-12 bg-slate-900/50 border-amber-500/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus:border-amber-500/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(t.filters).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  filter === key 
                    ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white' 
                    : 'bg-slate-900/50 border border-amber-500/10 text-slate-300 hover:border-amber-500/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(20).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-24">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200/60">
              {lang === 'fr' ? 'Aucune carte trouvée' : 'No cards found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredCards.map((card) => (
              <Link 
                key={card.id} 
                to={createPageUrl('CardDetail') + `?slug=${card.slug}`}
                className="group"
              >
                <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all">
                  <div className="aspect-[2/3] flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900/50">
                    {card.image_url ? (
                      <img src={card.image_url} alt={lang === 'fr' ? card.name_fr : card.name_en} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <span className="text-xs text-purple-300/60">{card.number}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-medium text-sm truncate">{lang === 'fr' ? card.name_fr : card.name_en}</h3>
                    <p className="text-xs text-purple-300/60 capitalize">
                      {card.arcana_type === 'major' 
                        ? (lang === 'fr' ? 'Majeur' : 'Major') 
                        : card.suit}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}