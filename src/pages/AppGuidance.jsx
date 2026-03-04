import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Heart, Users, Briefcase, Sparkles, Send, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import { canRequestGuidance } from '@/components/helpers/guidanceQuotaManager';

export default function AppGuidance() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [lang, setLang] = useState('fr');
  const [activeMode, setActiveMode] = useState('amour');
  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [todayGuidance, setTodayGuidance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (user && activeMode) {
      loadTodayGuidance();
    }
  }, [user, activeMode]);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [accounts, profiles] = await Promise.all([
        base44.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1),
        base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1)
      ]);

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setLang(accounts[0].language_pref || 'fr');

        // Age gate check
        if (!accounts[0].age_confirmed_at) {
          window.location.href = createPageUrl('AppOnboarding');
          return;
        }
      }

      if (profiles && profiles.length > 0) {
        setLang(profiles[0].language_pref || 'fr');
      }

      // Load initial mode from localStorage or AccountPrivate
      const storedMode = localStorage.getItem('gt_mode') || accounts[0]?.preferred_mode || 'amour';
      setActiveMode(storedMode);
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayGuidance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const existingGuidance = await base44.entities.GuidanceAnswer.filter({
        user_id: user.email,
        mode: activeMode,
        day_key: today
      }, null, 1);

      if (existingGuidance && existingGuidance.length > 0) {
        setTodayGuidance(existingGuidance[0]);
        setQuestion(existingGuidance[0].question);
      } else {
        setTodayGuidance(null);
        setQuestion('');
      }
    } catch (error) {
      console.error('Error loading guidance:', error);
    }
  };

  const validateQuestion = (text) => {
    if (!text || text.trim().length < 10) {
      return lang === 'fr' ? 'Question trop courte (min 10 caractères)' : 'Question too short (min 10 chars)';
    }
    if (text.length > 240) {
      return lang === 'fr' ? 'Question trop longue (max 240 caractères)' : 'Question too long (max 240 chars)';
    }

    // Anti-sensitive data (simple patterns)
    const sensitivePatterns = [
      /\b\d{15}\b/i, // NIR format
      /\b\d{1,5}\s+(?:rue|avenue|boulevard|place)\b/i, // Address
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i, // Email
      /\b(?:\+33|0)[1-9]\d{8}\b/, // Phone FR
      /\b(?:mr|mme|m\.|mlle)\s+[a-z]+\s+[a-z]+\b/i // Full name patterns
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        return lang === 'fr' 
          ? 'Ne partage pas d\'infos personnelles (NIR, adresse, téléphone, email, nom complet)' 
          : 'Don\'t share personal info (SSN, address, phone, email, full name)';
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    setError(null);

    // Validation
    const validationError = validateQuestion(question);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if already generated today
    if (todayGuidance) {
      setError(lang === 'fr' 
        ? 'Ta guidance du jour est déjà générée pour ce mode.' 
        : 'Your daily guidance is already generated for this mode.');
      return;
    }

    // QUOTA CHECK (STRICT: 1 guidance/day ALL modes)
    const quotaCheck = await canRequestGuidance(user.email);
    if (!quotaCheck.allowed) {
      setError(lang === 'fr' 
        ? 'Limite quotidienne atteinte (1 guidance par jour, tous modes confondus). Revenez demain.' 
        : 'Daily limit reached (1 guidance per day, all modes). Come back tomorrow.');
      return;
    }

    setGenerating(true);

    try {
      // Check plan status if paywall enabled
      const paywallSettings = await base44.entities.AppSettings.filter({ setting_key: 'paywall_enabled' }, null, 1);
      const paywallEnabled = paywallSettings.length > 0 && paywallSettings[0].value_boolean === true;

      if (paywallEnabled && account?.plan_status !== 'active') {
        window.location.href = createPageUrl('Billing');
        return;
      }

      // Load today's card (if exists, zero extra cost)
      // DailyDraw uses profile_id (public_id), not user.email
      let cardContext = null;
      try {
        const today = new Date().toISOString().split('T')[0];
        const accounts = await base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1);
        const publicProfileId = accounts[0]?.public_profile_id;
        const dailyDraws = publicProfileId ? await base44.entities.DailyDraw.filter({
          profile_id: publicProfileId,
          draw_date: today,
          mode: activeMode
        }, null, 1) : [];

        if (dailyDraws && dailyDraws.length > 0) {
          const cards = await base44.entities.TarotCard.filter({ id: dailyDraws[0].tarot_card_id }, null, 1);
          if (cards && cards.length > 0) {
            cardContext = {
              slug: cards[0].slug,
              name_fr: cards[0].name_fr,
              name_en: cards[0].name_en
            };
          }
        }
      } catch (e) {
        // Card context is optional, continue without it
      }

      // Build AI prompt
      const modeLabels = {
        amour: { fr: 'amour/rencontres', en: 'love/dating' },
        amitie: { fr: 'amitié', en: 'friendship' },
        pro: { fr: 'professionnel/carrière', en: 'professional/career' }
      };

      const cardInfo = cardContext 
        ? lang === 'fr' ? `Carte du jour: ${cardContext.name_fr}. ` : `Today's card: ${cardContext.name_en}. `
        : '';

      const prompt = lang === 'fr' ? `Tu es un guide bienveillant spécialisé en ${modeLabels[activeMode].fr}. ${cardInfo}Question: "${question}"

Réponds en 6-10 lignes max, structure:
1) Lecture rapide (2 lignes)
2) Conseils d'action aujourd'hui (3 bullets)
3) À éviter (2 bullets)
4) Question de recentrage (1 ligne)

Ton: clair, concret, bienveillant. PAS de santé/juridique/diagnostic. Suggérer, ne pas affirmer "certitudes".` : 
`You are a caring guide specialized in ${modeLabels[activeMode].en}. ${cardInfo}Question: "${question}"

Answer in 6-10 lines max, structure:
1) Quick reading (2 lines)
2) Action tips for today (3 bullets)
3) Things to avoid (2 bullets)
4) Centering question (1 line)

Tone: clear, concrete, caring. NO health/legal/diagnosis. Suggest, don't claim "certainties".`;

      // Call AI
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      const answer = typeof aiResponse === 'string' ? aiResponse : aiResponse.response || aiResponse.text || '';

      if (!answer || answer.length < 50) {
        throw new Error('AI response too short');
      }

      // Save to database
      const today = new Date().toISOString().split('T')[0];
      const newGuidance = await base44.entities.GuidanceAnswer.create({
        user_id: user.email,
        mode: activeMode,
        day_key: today,
        question: question.trim(),
        answer: answer.substring(0, 1600),
        language: lang,
        card_context: cardContext
      });

      setTodayGuidance(newGuidance);
      setError(null);
    } catch (error) {
      console.error('Error generating guidance:', error);
      setError(lang === 'fr' 
        ? 'Erreur lors de la génération. Réessaie dans quelques instants.' 
        : 'Generation error. Try again in a few moments.');
    } finally {
      setGenerating(false);
    }
  };

  const suggestions = {
    amour: {
      fr: [
        'Comment aborder une rencontre aujourd\'hui ?',
        'Quel état d\'esprit adopter pour attirer l\'amour ?',
        'Comment gérer mes attentes dans ma vie amoureuse ?'
      ],
      en: [
        'How to approach a meeting today?',
        'What mindset to attract love?',
        'How to manage expectations in my love life?'
      ]
    },
    amitie: {
      fr: [
        'Comment renforcer une amitié existante ?',
        'Quelle initiative prendre pour créer du lien ?',
        'Comment équilibrer donner et recevoir ?'
      ],
      en: [
        'How to strengthen an existing friendship?',
        'What initiative to create connection?',
        'How to balance giving and receiving?'
      ]
    },
    pro: {
      fr: [
        'Quelle opportunité explorer cette semaine ?',
        'Comment gérer une situation tendue au travail ?',
        'Quelle compétence développer maintenant ?'
      ],
      en: [
        'What opportunity to explore this week?',
        'How to handle a tense work situation?',
        'What skill to develop now?'
      ]
    }
  };

  const content = {
    fr: {
      title: 'Guidance Quotidienne',
      subtitle: '1 guidance par jour (tous modes confondus)',
      questionLabel: 'Ta question du jour',
      questionPlaceholder: 'Pose ta question (10-240 caractères)...',
      generate: 'Obtenir ma guidance',
      generating: 'Génération en cours...',
      suggestions: 'Suggestions',
      yourGuidance: 'Ta guidance du jour',
      generatedAt: 'Générée',
      limitInfo: (count) => `${count}/1 guidance utilisée aujourd'hui`,
      modes: {
        amour: 'Amour',
        amitie: 'Amitié',
        pro: 'Pro'
      }
    },
    en: {
      title: 'Daily Guidance',
      subtitle: '1 guidance per day (all modes combined)',
      questionLabel: 'Your question of the day',
      questionPlaceholder: 'Ask your question (10-240 characters)...',
      generate: 'Get my guidance',
      generating: 'Generating...',
      suggestions: 'Suggestions',
      yourGuidance: 'Your daily guidance',
      generatedAt: 'Generated',
      limitInfo: (count) => `${count}/1 guidance used today`,
      modes: {
        amour: 'Love',
        amitie: 'Friendship',
        pro: 'Pro'
      }
    }
  };

  const t = content[lang];

  const modes = [
    { id: 'amour', icon: Heart, color: 'from-rose-500 to-pink-600' },
    { id: 'amitie', icon: Users, color: 'from-blue-500 to-cyan-600' },
    { id: 'pro', icon: Briefcase, color: 'from-amber-500 to-orange-600' }
  ];

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-200 text-sm">{t.subtitle}</span>
            </div>
            <h1 className="text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-3 justify-center mb-8 flex-wrap">
            {modes.map((mode) => {
              const ModeIcon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                    activeMode === mode.id
                      ? `bg-gradient-to-r ${mode.color} text-white shadow-lg`
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ModeIcon className="w-5 h-5" />
                  {t.modes[mode.id]}
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Today's Guidance (if exists) */}
            {todayGuidance && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-green-200">{t.yourGuidance}</h3>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-400 mb-2">
                      {t.questionLabel}: <span className="text-slate-200">"{todayGuidance.question}"</span>
                    </p>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                        {todayGuidance.answer}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.generatedAt} {new Date(todayGuidance.created_date).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Question Input */}
            {!todayGuidance && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-6">
                <label className="block text-lg font-semibold text-amber-100 mb-4">
                  {t.questionLabel}
                </label>

                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t.questionPlaceholder}
                  maxLength={240}
                  className="w-full bg-slate-800/50 border-slate-700 text-white rounded-xl p-4 h-32 mb-2"
                />

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span>{question.length}/240</span>
                </div>

                {/* Suggestions */}
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">{t.suggestions}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions[activeMode][lang].map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => setQuestion(sug)}
                        className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-300 hover:bg-violet-500/20 transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating || question.length < 10}
                  className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t.generate}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}