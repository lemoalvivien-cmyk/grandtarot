import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Heart, Users, Briefcase, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CardDetail() {
  const [lang, setLang] = useState('fr');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      const cards = await base44.entities.TarotCard.filter({ slug });
      if (cards.length > 0) {
        setCard(cards[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      back: "Encyclopédie",
      upright: "À l'endroit",
      reversed: "Renversée",
      love: "Amour",
      career: "Carrière",
      friendship: "Amitié",
      keywords: "Mots-clés"
    },
    en: {
      back: "Encyclopedia",
      upright: "Upright",
      reversed: "Reversed",
      love: "Love",
      career: "Career",
      friendship: "Friendship",
      keywords: "Keywords"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white p-8">
        <Skeleton className="h-96 w-72 mx-auto rounded-3xl bg-white/10" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200/60">{lang === 'fr' ? 'Carte non trouvée' : 'Card not found'}</p>
          <Link to={createPageUrl('Encyclopedia')} className="text-purple-400 hover:text-white mt-4 inline-block">
            ← {t.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Encyclopedia')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-sm ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-sm ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Card Image */}
          <div className="relative mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-amber-500/30 rounded-3xl blur-2xl" />
            <div className="relative w-72 h-[420px] bg-gradient-to-br from-purple-900 to-slate-900 rounded-3xl border border-purple-500/30 flex items-center justify-center overflow-hidden">
              {card.image_url ? (
                <img src={card.image_url} alt={lang === 'fr' ? card.name_fr : card.name_en} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                  <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif">{lang === 'fr' ? card.name_fr : card.name_en}</h3>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2">{lang === 'fr' ? card.name_fr : card.name_en}</h1>
              <p className="text-purple-300/60 capitalize">
                {card.arcana === 'major' ? (lang === 'fr' ? 'Arcane Majeur' : 'Major Arcana') : `${lang === 'fr' ? 'Arcane Mineur' : 'Minor Arcana'} • ${card.suit}`}
              </p>
            </div>

            {/* Keywords */}
            {((lang === 'fr' && card.keywords_fr?.length) || (lang === 'en' && card.keywords_en?.length)) && (
              <div>
                <h4 className="text-sm uppercase tracking-wider text-purple-400 mb-2">{t.keywords}</h4>
                <div className="flex flex-wrap gap-2">
                  {(lang === 'fr' ? card.keywords_fr : card.keywords_en).map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Meanings */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-sm uppercase tracking-wider text-green-400 mb-3">{t.upright}</h4>
              <p className="text-purple-200/80">{lang === 'fr' ? card.meaning_upright_fr : card.meaning_upright_en}</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-sm uppercase tracking-wider text-red-400 mb-3">{t.reversed}</h4>
              <p className="text-purple-200/80">{lang === 'fr' ? card.meaning_reversed_fr : card.meaning_reversed_en}</p>
            </div>

            {/* Mode-specific meanings */}
            <Tabs defaultValue="love" className="mt-8">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="love" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Heart className="w-4 h-4 mr-2" />{t.love}
                </TabsTrigger>
                <TabsTrigger value="career" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Briefcase className="w-4 h-4 mr-2" />{t.career}
                </TabsTrigger>
                <TabsTrigger value="friendship" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />{t.friendship}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="love" className="mt-4 p-4 bg-white/5 rounded-xl">
                <p className="text-purple-200/80">{lang === 'fr' ? card.love_meaning_fr : card.love_meaning_en}</p>
              </TabsContent>
              <TabsContent value="career" className="mt-4 p-4 bg-white/5 rounded-xl">
                <p className="text-purple-200/80">{lang === 'fr' ? card.career_meaning_fr : card.career_meaning_en}</p>
              </TabsContent>
              <TabsContent value="friendship" className="mt-4 p-4 bg-white/5 rounded-xl">
                <p className="text-purple-200/80">{lang === 'fr' ? card.friendship_meaning_fr : card.friendship_meaning_en}</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}