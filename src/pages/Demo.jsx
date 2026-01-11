import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart, Users, Briefcase, Sparkles, MessageCircle, CheckCircle, ArrowRight, Star, Eye, Crown, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoLove, demoFriend, demoPro } from '@/components/demo/demoFixtures';
import DemoTour from '@/components/demo/DemoTour';
import LockedFeatureCard from '@/components/demo/LockedFeatureCard';

export default function Demo() {
  const [activeTab, setActiveTab] = useState('love');
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    // Load language preference from localStorage (NO network calls)
    const savedLang = localStorage.getItem('demo_lang') || 'fr';
    setLang(savedLang);
  }, []);

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('demo_lang', newLang);
  };

  const handleUnlock = () => {
    // Store selected mode for conversion bridge (no network calls)
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_selected_mode', activeTab);
      localStorage.setItem('demo_source', 'demo');
      localStorage.setItem('demo_selected_at', new Date().toISOString());
    }
    // Redirect to conversion bridge
    window.location.href = createPageUrl('DemoStart') + '?mode=' + activeTab;
  };

  const tabs = [
    { id: 'love', label: { fr: 'Célibataires', en: 'Singles' }, icon: Heart, color: 'from-rose-500 to-pink-600', data: demoLove },
    { id: 'friend', label: { fr: 'Amitié', en: 'Friendship' }, icon: Users, color: 'from-blue-500 to-cyan-600', data: demoFriend },
    { id: 'pro', label: { fr: 'Professionnels', en: 'Professionals' }, icon: Briefcase, color: 'from-amber-500 to-orange-600', data: demoPro }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const currentData = currentTab.data[lang];
  const ModeIcon = currentTab.icon;

  // Locked features per mode (100% static)
  const lockedFeatures = {
    love: {
      fr: [
        { title: 'Voir + de profils compatibles', desc: 'Passez de 20 à 50 profils par jour' },
        { title: 'Historique guidance 30 jours', desc: 'Consultez vos tirages passés' }
      ],
      en: [
        { title: 'See more compatible profiles', desc: 'Go from 20 to 50 profiles per day' },
        { title: '30-day guidance history', desc: 'Check your past readings' }
      ]
    },
    friend: {
      fr: [
        { title: 'Groupes & sorties locales', desc: 'Rejoignez des événements de groupe' },
        { title: 'Suggestions d\'activités', desc: 'Recevez des idées personnalisées' }
      ],
      en: [
        { title: 'Groups & local outings', desc: 'Join group events' },
        { title: 'Activity suggestions', desc: 'Get personalized ideas' }
      ]
    },
    pro: {
      fr: [
        { title: 'Relances & pipeline', desc: 'Suivi automatique de vos contacts' },
        { title: 'Stats réseau', desc: 'Analysez vos opportunités' }
      ],
      en: [
        { title: 'Follow-ups & pipeline', desc: 'Auto-track your contacts' },
        { title: 'Network stats', desc: 'Analyze your opportunities' }
      ]
    }
  };

  const content = {
    fr: {
      demoBadge: 'MODE DÉMO — Données fictives',
      backHome: 'Retour à l\'accueil',
      guidance: 'Guidance du jour',
      matches: 'Vos affinités',
      messages: 'Messages récents',
      benefits: 'Ce que vous débloquez',
      compatibility: 'Compatibilité',
      unread: 'non lu',
      innovation: {
        title: 'Une innovation : la guidance au service de tes rencontres',
        bullets: [
          'Tu ne subis plus : tu avances avec clarté',
          'Moins de hasard, plus de cohérence',
          'Un rituel simple, des décisions meilleures'
        ]
      },
      pricing: {
        title: 'Accès Premium',
        desc: 'Débloque l\'app complète + guidance + chat + mises en relation',
        price: '6,90€/mois',
        cta: 'Créer mon compte'
      }
    },
    en: {
      demoBadge: 'DEMO MODE — Fictional data',
      backHome: 'Back to home',
      guidance: 'Today\'s Guidance',
      matches: 'Your Matches',
      messages: 'Recent Messages',
      benefits: 'What you unlock',
      compatibility: 'Compatibility',
      unread: 'unread',
      innovation: {
        title: 'An innovation: guidance in service of your connections',
        bullets: [
          'You\'re no longer passive: you move forward with clarity',
          'Less randomness, more coherence',
          'A simple ritual, better decisions'
        ]
      },
      pricing: {
        title: 'Premium Access',
        desc: 'Unlock complete app + guidance + chat + connections',
        price: '€6.90/month',
        cta: 'Create my account'
      }
    }
  };

  const t = content[lang];
  const currentLocked = lockedFeatures[activeTab][lang];

  return (
    <>
      {/* Demo Tour (only shows once) */}
      <DemoTour lang={lang} />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Demo Badge (always visible) */}
        <div className="sticky top-0 z-50 bg-amber-500/20 border-b border-amber-500/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-amber-200">{t.demoBadge}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Language toggle */}
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1">
                <button
                  onClick={() => changeLang('fr')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    lang === 'fr' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => changeLang('en')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    lang === 'en' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  EN
                </button>
              </div>
              <Link to={createPageUrl('Landing')} className="text-sm text-slate-400 hover:text-amber-200 transition-colors">
                {t.backHome}
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-amber-500/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-4">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <TabIcon className="w-5 h-5" />
                    {tab.label[lang]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT: Profile + Guidance */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={currentData.profile.photo}
                      alt={currentData.profile.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/30"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-amber-100">{currentData.profile.name}</h3>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${currentTab.color} bg-opacity-20 mt-2`}>
                        <ModeIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{currentData.mode}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300 mb-4">{currentData.profile.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentData.profile.interests.map((interest, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-300">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guidance Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-violet-200">{currentData.guidance.title}</h3>
                  </div>
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-4">
                    <p className="text-violet-200 font-serif text-lg mb-2">{currentData.guidance.card}</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{currentData.guidance.message}</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-200 text-sm">{currentData.guidance.action}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER: Matches + Locked Features */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-amber-100 mb-4">{t.matches}</h3>
                <div className="space-y-3">
                  {currentData.matches.map((match, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/50 border border-amber-500/10 rounded-xl p-4 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">
                            {match.name}{match.age && `, ${match.age}`}
                          </h4>
                          {match.title && <p className="text-xs text-slate-400">{match.title}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-bold text-amber-300">{match.compatibility}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <span>{match.distance}</span>
                        {match.status && (
                          <>
                            <span>•</span>
                            <span className="text-green-400">{match.status}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.interests.map((interest, j) => (
                          <span key={j} className="px-2 py-0.5 bg-amber-500/10 rounded text-xs text-amber-300">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked Features */}
              <div className="space-y-3">
                {currentLocked.map((feature, i) => (
                  <LockedFeatureCard
                    key={i}
                    title={feature.title}
                    description={feature.desc}
                    lang={lang}
                    onUnlock={handleUnlock}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT: Messages + Benefits + Innovation + Pricing */}
            <div className="lg:col-span-1 space-y-6">
              {/* Messages Preview */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-100">{t.messages}</h3>
                </div>
                <div className="space-y-3">
                  {currentData.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`bg-slate-800/50 border rounded-xl p-4 ${
                        msg.unread ? 'border-amber-500/30' : 'border-amber-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{msg.from}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{msg.time}</span>
                          {msg.unread && (
                            <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs text-amber-300">
                              {t.unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{msg.preview}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-green-200 mb-4">{t.benefits}</h3>
                  <ul className="space-y-3">
                    {currentData.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300 leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Innovation Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-violet-200">{t.innovation.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {t.innovation.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pricing Snippet */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-6">
                  <div className="text-center mb-4">
                    <Crown className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-amber-100 mb-2">{t.pricing.title}</h3>
                    <p className="text-sm text-slate-400 mb-3">{t.pricing.desc}</p>
                    <p className="text-2xl font-bold text-amber-300 mb-4">{t.pricing.price}</p>
                  </div>

                  <Button
                    onClick={handleUnlock}
                    className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    {t.pricing.cta}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}