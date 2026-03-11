import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import TarotCardImage from '@/components/tarot/TarotCardImage';
import DailySynthesis from '@/components/guidance/DailySynthesis';
import AstroWidget from '@/components/guidance/AstroWidget';
import NumerologyWidget from '@/components/guidance/NumerologyWidget';

import { getSunSign } from '@/components/helpers/astrologyEngine';
import { personalDayNumber } from '@/components/helpers/numerologyEngine';

export default function AppRitual() {
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [dailyDraw, setDailyDraw] = useState(null);
  const [card, setCard] = useState(null);
  const [lang, setLang] = useState('fr');
  const [showCard, setShowCard] = useState(false);
  const [astroData, setAstroData] = useState(null);
  const [numeroData, setNumeroData] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [profiles, accounts] = await Promise.all([
        base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1),
        base44.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1)
      ]);

      if (!profiles || profiles.length === 0) {
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      // plan_status (AccountPrivate) est la source de vérité — pas subscription_status (UserProfile)
      const planStatus = accounts && accounts.length > 0 ? accounts[0].plan_status : 'free';
      if (planStatus !== 'active' && currentUser.role !== 'admin') {
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      if (!profiles[0].onboarding_completed || !profiles[0].photo_url) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await loadGuidanceSignals(profiles[0], accounts[0]);
      }
      
      await loadDailyDraw(currentUser.email, profiles[0].mode_active);
      setLoading(false);
    } catch (error) {
      console.error('Error loading ritual:', error);
      setLoading(false);
      alert(lang === 'fr'
        ? 'Erreur de connexion. Veuillez réessayer.'
        : 'Connection error. Please try again.');
    }
  };

  const loadGuidanceSignals = async (userProfile, userAccount) => {
    try {
      // Astrology signal (if enabled)
      if (userAccount.astrology_enabled) {
        const birthDate = {
          year: userProfile.birth_year,
          month: userProfile.birth_month,
          day: userProfile.birth_day
        };
        
        if (birthDate.month && birthDate.day) {
          const sunSign = getSunSign(birthDate);
          if (sunSign) {
            setAstroData({ sunSign });
          }
        }
      }

      // Numerology signal (if enabled)
      if (userAccount.numerology_enabled) {
        const birthDate = {
          year: userProfile.birth_year,
          month: userProfile.birth_month,
          day: userProfile.birth_day
        };
        
        if (birthDate.year && birthDate.month && birthDate.day) {
          const today = new Date();
          const targetDate = {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
          };
          
          const dailyNum = personalDayNumber(birthDate, targetDate);
          if (dailyNum) {
            setNumeroData({ dailyNumber: dailyNum });
          }
        }
      }
    } catch (error) {
      console.error('[AppRitual] Error loading guidance signals:', error);
      // Non-blocking: guidance signals optional
    }
  };

  const loadDailyDraw = async (userId, mode) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if draw exists for today + mode (LIMIT 1 - one draw per day)
      // DailyDraw uses profile_id (AccountPrivate.public_profile_id), not user_id
      const accounts = await base44.entities.AccountPrivate.filter({ user_email: userId }, null, 1);
      const profileId = accounts[0]?.public_profile_id;
      if (!profileId) return; // pas encore de profil public

      const existingDraws = await base44.entities.DailyDraw.filter({
        profile_id: profileId,
        draw_date: today,
        mode: mode
      }, null, 1);

      if (existingDraws.length > 0) {
        // Load existing draw
        const draw = existingDraws[0];
        setDailyDraw(draw);
        
        // Load card details
        const cards = await base44.entities.TarotCard.filter({ id: draw.tarot_card_id }, null, 1);
        if (cards.length > 0) {
          setCard(cards[0]);
          setShowCard(true);
        }
      }
    } catch (error) {
      console.error('[AppRitual] Error loading draw:', error);
      // Non-blocking: draw can be empty
    }
  };

  const performDraw = async () => {
    if (drawing) return; // Prevent double-click
    setDrawing(true);
    try {
      // PERF: Use cached account (already loaded in checkAccess)
      const today = new Date().toISOString().split('T')[0];
      const profileId = account?.public_profile_id;
      if (!profileId) {
        setDrawing(false);
        return;
      }
      const existingDraws = await base44.entities.DailyDraw.filter({
        profile_id: profileId,
        draw_date: today,
        mode: profile.mode_active
      }, null, 1);
      
      if (existingDraws.length > 0) {
        // Already drawn today, reload
        await loadDailyDraw(user.email, profile.mode_active);
        setDrawing(false);
        return;
      }
      
      // Get random card (list is cached on first load)
      const allCards = await base44.entities.TarotCard.list();
      if (!allCards || allCards.length === 0) {
        throw new Error('No tarot cards available');
      }
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      
      // Animation delay while generating interpretation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate AI interpretation with timeout
      const { generateInterpretation } = await import('@/components/helpers/aiService');
      const interpretation = await Promise.race([
        generateInterpretation({
          card: randomCard,
          mode: profile.mode_active,
          lang: lang,
          userProfile: profile
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Interpretation timeout')), 35000)
        )
      ]);
      
      // Create daily draw using profile_id (correct field per schema)
      const newDraw = await base44.entities.DailyDraw.create({
        profile_id: profileId,
        draw_date: today,
        mode: profile.mode_active,
        tarot_card_id: randomCard.id,
        spread_type: 'single',
        interpretation_json: interpretation,
        themes: interpretation.themes
      });

      setDailyDraw(newDraw);
      setCard(randomCard);
      setShowCard(true);
    } catch (error) {
      // Afficher l'erreur à l'utilisateur
      const lang = account?.language_pref || 'fr';
      alert(lang === 'fr'
        ? 'Erreur lors du tirage. Vérifiez votre connexion et réessayez.'
        : 'Error during draw. Check your connection and try again.');
    } finally {
      setDrawing(false);
    }
  };

  const content = {
    fr: {
      title: "Rituel Quotidien",
      subtitle: "Votre guidance des astres",
      draw: "Tirer ma carte",
      drawing: "Consultation des astres...",
      viewSynchros: "Voir mes synchros du jour",
      modes: {
        love: "Amour",
        friendship: "Amitié",
        professional: "Pro"
      },
      interpretation: "Interprétation du jour"
    },
    en: {
      title: "Daily Ritual",
      subtitle: "Your guidance from the stars",
      draw: "Draw my card",
      drawing: "Consulting the stars...",
      viewSynchros: "View my daily synchros",
      modes: {
        love: "Love",
        friendship: "Friendship",
        professional: "Pro"
      },
      interpretation: "Today's interpretation"
    }
  };

  const t = content[lang];

  const modeIcons = {
    love: Heart,
    friendship: Users,
    professional: Briefcase
  };
  const ModeIcon = modeIcons[profile?.mode_active] || Heart;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <ModeIcon className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm">
              {t.modes[profile?.mode_active] || 'Mode'} • {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-slate-400">{t.subtitle}</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Drawing State */}
          {drawing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-32 h-32 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full border-4 border-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-amber-400 animate-pulse" />
                </div>
              </div>
              <p className="text-amber-200 mt-8 text-lg animate-pulse">{t.drawing}</p>
            </motion.div>
          )}

          {/* No Draw Yet */}
          {!dailyDraw && !drawing && (
            <div className="text-center py-16">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
                <div className="relative w-48 h-72 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-amber-400" />
                </div>
              </div>
              
              <Button 
                onClick={performDraw}
                disabled={drawing}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-12 py-6 text-lg rounded-xl shadow-2xl shadow-amber-500/20 disabled:opacity-70"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t.draw}
              </Button>
            </div>
          )}

          {/* Show Card */}
          <AnimatePresence>
            {showCard && card && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                  {/* Card Image */}
                  <motion.div 
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative mx-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-violet-500/30 rounded-3xl blur-2xl" />
                    <div className="relative w-56 h-80 md:w-72 md:h-[420px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-amber-500/20 overflow-hidden p-4">
                      <TarotCardImage
                        src={card.image_url}
                        alt={lang === 'fr' ? card.name_fr : card.name_en}
                        className="w-full h-full"
                      />
                    </div>
                  </motion.div>

                  {/* Card Details */}
                  <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-3xl font-serif font-bold mb-2 text-amber-100">
                        {lang === 'fr' ? card.name_fr : card.name_en}
                      </h2>
                      <p className="text-slate-400 capitalize">
                        {card.arcana_type === 'major' 
                          ? (lang === 'fr' ? 'Arcane Majeur' : 'Major Arcana') 
                          : `${lang === 'fr' ? 'Arcane Mineur' : 'Minor Arcana'} • ${card.suit}`}
                      </p>
                    </div>

                    {/* Keywords */}
                    {((lang === 'fr' && card.keywords_fr?.length) || (lang === 'en' && card.keywords_en?.length)) && (
                      <div className="flex flex-wrap gap-2">
                        {(lang === 'fr' ? card.keywords_fr : card.keywords_en)?.slice(0, 5).map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm text-amber-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Interpretation */}
                    {dailyDraw?.interpretation_json ? (
                      <div className="space-y-4">
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
                          <h4 className="text-sm uppercase tracking-wider text-amber-400 mb-3">{t.interpretation}</h4>
                          <p className="text-slate-300 leading-relaxed mb-4">
                            {dailyDraw.interpretation_json.summary}
                          </p>
                          <p className="text-amber-200 font-medium">
                            {dailyDraw.interpretation_json.todayFocus}
                          </p>
                        </div>

                        {dailyDraw.interpretation_json.do?.length > 0 && (
                          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                            <h4 className="text-sm uppercase tracking-wider text-green-400 mb-3">
                              {lang === 'fr' ? 'À faire' : 'Do'}
                            </h4>
                            <ul className="space-y-2">
                              {dailyDraw.interpretation_json.do.map((item, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                  <span className="text-green-400 mt-1">✓</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {dailyDraw.interpretation_json.avoid?.length > 0 && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <h4 className="text-sm uppercase tracking-wider text-red-400 mb-3">
                              {lang === 'fr' ? 'À éviter' : 'Avoid'}
                            </h4>
                            <ul className="space-y-2">
                              {dailyDraw.interpretation_json.avoid.map((item, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                  <span className="text-red-400 mt-1">⨯</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {dailyDraw.interpretation_json.reflectionQuestion && (
                          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-6">
                            <h4 className="text-sm uppercase tracking-wider text-violet-400 mb-3">
                              {lang === 'fr' ? 'Question du jour' : 'Reflection question'}
                            </h4>
                            <p className="text-slate-300 italic">
                              {dailyDraw.interpretation_json.reflectionQuestion}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 text-center italic">
                          {dailyDraw.interpretation_json.safetyNote}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
                        <h4 className="text-sm uppercase tracking-wider text-amber-400 mb-3">{t.interpretation}</h4>
                        <p className="text-slate-300 leading-relaxed">
                          {lang === 'fr' ? card.meaning_upright_fr : card.meaning_upright_en}
                        </p>
                      </div>
                    )}

                    {/* Mode-specific meaning */}
                    {profile?.mode_active === 'love' && (card.love_meaning_fr || card.love_meaning_en) && (
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                        <h4 className="text-sm uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          {t.modes.love}
                        </h4>
                        <p className="text-slate-300 leading-relaxed">
                          {lang === 'fr' ? card.love_meaning_fr : card.love_meaning_en}
                        </p>
                      </div>
                    )}

                    {profile?.mode_active === 'friendship' && (card.friendship_meaning_fr || card.friendship_meaning_en) && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                        <h4 className="text-sm uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t.modes.friendship}
                        </h4>
                        <p className="text-slate-300 leading-relaxed">
                          {lang === 'fr' ? card.friendship_meaning_fr : card.friendship_meaning_en}
                        </p>
                      </div>
                    )}

                    {profile?.mode_active === 'professional' && (card.career_meaning_fr || card.career_meaning_en) && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                        <h4 className="text-sm uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {t.modes.professional}
                        </h4>
                        <p className="text-slate-300 leading-relaxed">
                          {lang === 'fr' ? card.career_meaning_fr : card.career_meaning_en}
                        </p>
                      </div>
                    )}
                    </motion.div>
                    </div>

                    {/* Guidance Signals */}
                    {(astroData || numeroData) && (
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="grid md:grid-cols-2 gap-6 mt-8"
                    >
                    {astroData && <AstroWidget sunSign={astroData.sunSign} lang={lang} />}
                    {numeroData && <NumerologyWidget dailyNumber={numeroData.dailyNumber} lang={lang} />}
                    </motion.div>
                    )}

                    {/* Daily Synthesis */}
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-8"
                    >
                    <DailySynthesis
                    tarot={dailyDraw}
                    astro={astroData}
                    numerology={numeroData}
                    lang={lang}
                    />
                    </motion.div>

                    {/* CTA */}
                    <div className="text-center pt-8">
                    <Link to={createPageUrl('AppSynchros')}>
                    <Button className="bg-gradient-to-r from-violet-500 to-pink-600 hover:from-violet-400 hover:to-pink-500 px-8 py-6 text-lg rounded-xl shadow-xl shadow-violet-500/20">
                     {t.viewSynchros}
                     <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    </Link>
                    </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </SubscriptionGuard>
  );
}