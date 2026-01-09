import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CardOfDay() {
  const [lang, setLang] = useState('fr');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCardOfDay();
  }, []);

  const loadCardOfDay = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try to load admin-defined card for today
      const adminCards = await base44.entities.AdminDailyCard.filter({ 
        publish_date: today,
        is_published: true 
      });
      
      if (adminCards.length > 0) {
        // Admin card exists for today
        const adminCard = adminCards[0];
        const tarotCards = await base44.entities.TarotCard.filter({ id: adminCard.tarot_card_id });
        
        if (tarotCards.length > 0) {
          setCard({ 
            ...tarotCards[0], 
            admin_interpretation_fr: adminCard.interpretation_fr,
            admin_interpretation_en: adminCard.interpretation_en 
          });
        }
      } else {
        // Fallback to pseudo-random
        const cards = await base44.entities.TarotCard.list();
        if (cards.length > 0) {
          const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
          const cardIndex = dayOfYear % cards.length;
          setCard(cards[cardIndex]);
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Carte du Jour",
      subtitle: "Votre guidance quotidienne gratuite",
      upright: "À l'endroit",
      reversed: "Renversée",
      keywords: "Mots-clés",
      back: "Retour",
      cta: "Tirage complet personnalisé",
      ctaDesc: "Découvrez une interprétation IA adaptée à votre situation"
    },
    en: {
      title: "Card of the Day",
      subtitle: "Your free daily guidance",
      upright: "Upright",
      reversed: "Reversed",
      keywords: "Keywords",
      back: "Back",
      cta: "Full personalized reading",
      ctaDesc: "Discover an AI interpretation tailored to your situation"
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen">{/* Header removed - now in Layout */}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm">{new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>

        {loading ? (
          <div className="max-w-md mx-auto">
            <Skeleton className="h-96 w-full rounded-3xl bg-slate-800/50" />
          </div>
        ) : card ? (
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Card Image */}
            <div className="relative group mx-auto md:mx-0">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-violet-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
              <div className="relative w-72 h-[420px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-amber-500/20 overflow-hidden flex items-center justify-center">
                {card.image_url ? (
                  <img src={card.image_url} alt={lang === 'fr' ? card.name_fr : card.name_en} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-8">
                    <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-serif text-amber-100">{lang === 'fr' ? card.name_fr : card.name_en}</h3>
                    <p className="text-slate-400 mt-2 capitalize">{card.arcana === 'major' ? 'Arcane Majeur' : card.suit}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-serif font-bold mb-2 text-amber-100">{lang === 'fr' ? card.name_fr : card.name_en}</h2>
                <p className="text-slate-400 capitalize">
                  {card.arcana === 'major' ? (lang === 'fr' ? 'Arcane Majeur' : 'Major Arcana') : (lang === 'fr' ? 'Arcane Mineur' : 'Minor Arcana')}
                  {card.suit !== 'none' && ` • ${card.suit}`}
                </p>
              </div>

              {/* Keywords */}
              {((lang === 'fr' && card.keywords_fr) || (lang === 'en' && card.keywords_en)) && (
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-amber-400 mb-2">{t.keywords}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(lang === 'fr' ? card.keywords_fr : card.keywords_en)?.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm text-amber-200">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Interpretation or Standard Meanings */}
              {card.admin_interpretation_fr || card.admin_interpretation_en ? (
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/10">
                  <h4 className="text-sm uppercase tracking-wider text-amber-400 mb-3">
                    {lang === 'fr' ? 'Interprétation du jour' : 'Today\'s interpretation'}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {lang === 'fr' ? card.admin_interpretation_fr : card.admin_interpretation_en}
                  </p>
                </div>
              ) : (
                <>
                  {/* Upright Meaning */}
                  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/10">
                    <h4 className="text-sm uppercase tracking-wider text-green-400 mb-3">{t.upright}</h4>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'fr' ? card.meaning_upright_fr : card.meaning_upright_en}
                    </p>
                  </div>

                  {/* Reversed Meaning */}
                  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/10">
                    <h4 className="text-sm uppercase tracking-wider text-red-400 mb-3">{t.reversed}</h4>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'fr' ? card.meaning_reversed_fr : card.meaning_reversed_en}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-purple-200/60">Aucune carte disponible pour le moment.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20">
              <h3 className="text-2xl font-serif font-semibold mb-2 text-amber-100">{t.cta}</h3>
              <p className="text-slate-400 mb-6">{t.ctaDesc}</p>
              <Link to={createPageUrl('Subscribe')}>
                <Button className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-8 py-6 rounded-full shadow-xl shadow-amber-500/20">
                  {lang === 'fr' ? 'Créer mon compte' : 'Create my account'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}