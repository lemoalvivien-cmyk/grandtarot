import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DailyReading() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [reading, setReading] = useState(null);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    checkAndLoad();
  }, []);

  const checkAndLoad = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      
      if (profiles.length === 0 || !profiles[0].is_subscribed) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language || 'fr');

      // Load today's reading if exists
      const today = new Date().toISOString().split('T')[0];
      const readings = await base44.entities.DailyReading.filter({ 
        user_id: user.email, 
        reading_date: today 
      });

      if (readings.length > 0) {
        setReading(readings[0]);
        // Load card details
        const allCards = await base44.entities.TarotCard.list();
        const readingCards = readings[0].card_positions?.map(pos => {
          const card = allCards.find(c => c.id === pos.card_id);
          return { ...card, ...pos };
        }) || [];
        setCards(readingCards);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReading = async () => {
    setGenerating(true);
    try {
      const user = await base44.auth.me();
      const allCards = await base44.entities.TarotCard.list();
      
      // Random draw of 3 cards
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      const drawnCards = shuffled.slice(0, 3);
      
      const positions = ['past', 'present', 'future'];
      const cardPositions = drawnCards.map((card, i) => ({
        card_id: card.id,
        position: positions[i],
        is_reversed: Math.random() > 0.7
      }));

      // Generate interpretation with AI
      const cardNames = drawnCards.map((c, i) => 
        `${positions[i]}: ${lang === 'fr' ? c.name_fr : c.name_en} (${cardPositions[i].is_reversed ? 'reversed' : 'upright'})`
      ).join(', ');

      const modeLabel = profile?.mode === 'amour' ? 'love/romance' : 
                       profile?.mode === 'amitie' ? 'friendship' : 'career/business';

      const interpretation = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert tarot reader. Interpret this 3-card spread for someone focused on ${modeLabel}:
${cardNames}

Create a meaningful, personalized interpretation connecting past, present, and future. 
Be mystical but practical. Give actionable insights.
Respond in ${lang === 'fr' ? 'French' : 'English'}.
Keep it under 300 words.`
      });

      const today = new Date().toISOString().split('T')[0];
      const newReading = await base44.entities.DailyReading.create({
        user_id: user.email,
        card_ids: drawnCards.map(c => c.id),
        card_positions: cardPositions,
        [lang === 'fr' ? 'interpretation_fr' : 'interpretation_en']: interpretation,
        mode: profile?.mode || 'amour',
        reading_date: today,
        spread_type: 'three_card'
      });

      setReading(newReading);
      setCards(drawnCards.map((card, i) => ({
        ...card,
        position: positions[i],
        is_reversed: cardPositions[i].is_reversed
      })));
    } catch (error) {
      console.error('Error generating reading:', error);
    } finally {
      setGenerating(false);
    }
  };

  const content = {
    fr: {
      title: "Tirage du jour",
      subtitle: "Votre guidance personnalisée",
      generate: "Tirer les cartes",
      past: "Passé",
      present: "Présent",
      future: "Futur",
      interpretation: "Interprétation",
      reversed: "Renversée",
      back: "Retour"
    },
    en: {
      title: "Daily Reading",
      subtitle: "Your personalized guidance",
      generate: "Draw cards",
      past: "Past",
      present: "Present",
      future: "Future",
      interpretation: "Interpretation",
      reversed: "Reversed",
      back: "Back"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-xs ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">{t.title}</h1>
          <p className="text-purple-200/60">{t.subtitle}</p>
        </div>

        {!reading ? (
          <div className="text-center py-12">
            <div className="inline-flex p-6 bg-purple-500/20 rounded-full mb-6">
              <Sparkles className="w-12 h-12 text-purple-400" />
            </div>
            <p className="text-purple-200/60 mb-8">
              {lang === 'fr' 
                ? 'Concentrez-vous sur votre question et tirez vos cartes'
                : 'Focus on your question and draw your cards'}
            </p>
            <Button 
              onClick={generateReading}
              disabled={generating}
              className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 px-8 py-6 rounded-xl text-lg"
            >
              {generating ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {t.generate}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cards */}
            <div className="grid grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-purple-300/60 mb-2 uppercase tracking-wider">
                    {t[card.position]}
                  </p>
                  <div className={`aspect-[2/3] bg-gradient-to-br from-purple-900 to-slate-900 rounded-xl border border-purple-500/30 flex items-center justify-center p-2 ${card.is_reversed ? 'rotate-180' : ''}`}>
                    {card.image_url ? (
                      <img src={card.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium mt-2">{lang === 'fr' ? card.name_fr : card.name_en}</p>
                  {card.is_reversed && (
                    <span className="text-xs text-red-400">{t.reversed}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Interpretation */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm uppercase tracking-wider text-purple-400 mb-4">{t.interpretation}</h3>
              <p className="text-purple-200/80 leading-relaxed whitespace-pre-wrap">
                {lang === 'fr' ? reading.interpretation_fr : reading.interpretation_en}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}