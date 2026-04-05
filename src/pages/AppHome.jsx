import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, Shield, Lock, Eye, MessageCircle, Zap, ArrowRight, Crown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AppHome() {
  const [lang, setLang] = useState('fr');
  const [slaHours, setSlaHours] = useState(48);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email }, null, 1);
      if (profiles.length > 0) {
        setLang(profiles[0].language_pref || 'fr');
      }

      const slaSetting = await base44.entities.AppSettings.filter({ setting_key: 'billing_review_sla_hours' }, null, 1);
      if (slaSetting.length > 0) {
        setSlaHours(slaSetting[0].value_number || 48);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const content = {
    fr: {
      hero: {
        title: 'Rencontres Guidées par le Tarot',
        subtitle: 'Trouvez votre destinée',
        desc: 'Découvrez des connexions authentiques basées sur l\'astrologie, le tarot et vos intentions réelles.',
        cta: 'Commencer',
        tryFree: 'ou explorer les cartes gratuitement'
      },
      benefits: {
        title: '3 raisons pour GRANDTAROT',
        items: [
          {
            icon: Sparkles,
            title: 'Matching Cosmique',
            desc: 'Tirage quotidien IA + 20 affinités basées sur astrologie & tarot'
          },
          {
            icon: MessageCircle,
            title: 'Rencontres Sécurisées',
            desc: 'Intentions validées, chat privé, modération IA, blocage instant'
          },
          {
            icon: Heart,
            title: 'Confidentiel',
            desc: 'Zéro données revendues, pas de spam, RGPD, 18+ seulement'
          }
        ]
      },
      howItWorks: {
        title: 'Comment ça marche',
        steps: [
          {
            emoji: '🎴',
            title: 'Tirage du jour',
            desc: 'Chaque matin, 3 cartes personnalisées selon votre mode'
          },
          {
            emoji: '✨',
            title: '20 affinités/jour',
            desc: 'Matching intelligent: signes, intérêts, synergies tarot'
          },
          {
            emoji: '💬',
            title: 'Envoyez une Intention',
            desc: 'Message 20-500 caractères, modéré automatiquement'
          },
          {
            emoji: '🎯',
            title: 'Chat privé',
            desc: 'Acceptation mutuelle → conversation déverrouillée'
          }
        ]
      },
      security: {
        title: 'Sécurité & Respect',
        items: [
          { icon: Lock, title: '18+ Obligatoire', desc: 'Vérification d\'âge au premier accès' },
          { icon: Eye, title: 'Modération IA', desc: 'Scans temps réel des messages (spam, scam, harcèlement)' },
          { icon: Shield, title: 'Zéro contact forcé', desc: 'Chat uniquement si acceptation mutuelle' },
          { icon: Zap, title: 'Blocage instantané', desc: 'Un clic pour bloquer + signaler' }
        ]
      },
      pricing: {
        title: 'Commencer',
        price: '6,90€/mois',
        features: [
          'Tirage quotidien IA personnalisé',
          '20 affinités cosmiques/jour',
          '3 modes: Amour, Amitié, Pro',
          'Chat sécurisé illimité',
          'Encyclopédie 78 cartes',
          'Support prioritaire'
        ],
        cta: 'Commencer maintenant',
        guarantee: 'Annulation facile à tout moment'
      },
      faq: {
        title: 'Questions fréquentes',
        items: [
          {
            q: 'Comment fonctionne le paiement?',
            a: `Paiement sécurisé via Stripe (carte bancaire). Après le paiement, vous êtes automatiquement actif. Si problème, vous pouvez soumettre une preuve via le formulaire "J'ai déjà payé" (validation en ${slaHours}h max).`
          },
          {
            q: 'Puis-je annuler mon abonnement?',
            a: 'Oui, 1 clic depuis vos paramètres. Aucun engagement. Votre accès reste actif jusqu\'à la fin de la période.'
          },
          {
            q: 'Qui vérifie les demandes de paiement manuel?',
            a: `Notre équipe admin examine chaque demande sous ${slaHours} heures. Vous recevrez un email de confirmation.`
          },
          {
            q: 'Mes données sont-elles sécurisées?',
            a: 'SSL cryptage, serveurs européens (RGPD), aucune revente de données. Votre email n\'est jamais exposé publiquement.'
          },
          {
            q: 'Y a-t-il des faux profils ou bots?',
            a: 'Non. Photo vérifiée obligatoire, score de confiance, modération IA détecte comportements suspects.'
          },
          {
            q: 'Combien d\'intentions par jour?',
            a: '5 maximum pour favoriser qualité. 3 refus = cooldown 24h (protège la communauté).'
          }
        ]
      },
      final: {
        title: 'Prêt à découvrir votre destinée?',
        subtitle: 'Rejoignez des milliers d\'âmes qui cherchent une connexion authentique',
        cta: 'Commencer'
      }
    },
    en: {
      hero: {
        title: 'Tarot-Guided Dating',
        subtitle: 'Find Your Destiny',
        desc: 'Discover authentic connections based on astrology, tarot, and your true intentions.',
        cta: 'Get Started',
        tryFree: 'or explore cards for free'
      },
      benefits: {
        title: '3 Reasons for GRANDTAROT',
        items: [
          {
            icon: Sparkles,
            title: 'Cosmic Matching',
            desc: 'Daily AI reading + 20 affinities based on astrology & tarot'
          },
          {
            icon: MessageCircle,
            title: 'Safe Connections',
            desc: 'Validated intentions, private chat, AI moderation, instant block'
          },
          {
            icon: Heart,
            title: 'Confidential',
            desc: 'Zero data sold, no spam, GDPR, 18+ only'
          }
        ]
      },
      howItWorks: {
        title: 'How It Works',
        steps: [
          {
            emoji: '🎴',
            title: 'Daily Reading',
            desc: 'Every morning, 3 personalized cards based on your mode'
          },
          {
            emoji: '✨',
            title: '20 Affinities/Day',
            desc: 'Smart matching: signs, interests, tarot synergies'
          },
          {
            emoji: '💬',
            title: 'Send an Intention',
            desc: 'Message 20-500 characters, auto-moderated'
          },
          {
            emoji: '🎯',
            title: 'Private Chat',
            desc: 'Mutual acceptance → conversation unlocked'
          }
        ]
      },
      security: {
        title: 'Safety & Respect',
        items: [
          { icon: Lock, title: '18+ Required', desc: 'Age verification on first access' },
          { icon: Eye, title: 'AI Moderation', desc: 'Real-time scans (spam, scam, harassment)' },
          { icon: Shield, title: 'Zero forced contact', desc: 'Chat only with mutual acceptance' },
          { icon: Zap, title: 'Instant block', desc: 'One click to block + report' }
        ]
      },
      pricing: {
        title: 'Get Started',
        price: '€6.90/month',
        features: [
          'AI personalized daily reading',
          '20 cosmic affinities/day',
          '3 modes: Love, Friendship, Pro',
          'Unlimited secure chat',
          '78 cards encyclopedia',
          'Priority support'
        ],
        cta: 'Start Now',
        guarantee: 'Easy cancellation anytime'
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          {
            q: 'How does payment work?',
            a: `Secure payment via Stripe (credit card). After payment, you\'re automatically active. If issues, submit proof via "I already paid" form (verified in ${slaHours}h max).`
          },
          {
            q: 'Can I cancel my subscription?',
            a: 'Yes, 1 click from settings. No commitment. Your access remains active until end of period.'
          },
          {
            q: 'Who verifies manual payment requests?',
            a: `Our admin team reviews each request within ${slaHours} hours. You\'ll receive a confirmation email.`
          },
          {
            q: 'Is my data secure?',
            a: 'SSL encryption, EU servers (GDPR), no data resold. Your email never exposed publicly.'
          },
          {
            q: 'Are there fake profiles or bots?',
            a: 'No. Verified photo required, trust score, AI detects suspicious behavior.'
          },
          {
            q: 'How many intentions per day?',
            a: '5 max to favor quality. 3 refusals = 24h cooldown (protects community).'
          }
        ]
      },
      final: {
        title: 'Ready to Discover Your Destiny?',
        subtitle: 'Join thousands of souls seeking authentic connection',
        cta: 'Get Started'
      }
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-flex gap-1 bg-slate-800/50 rounded-full p-1">
            <button
              onClick={() => setLang('fr')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${lang === 'fr' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400'}`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${lang === 'en' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400'}`}
            >
              EN
            </button>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent leading-tight">
            {t.hero.title}
          </h1>
          <p className="text-2xl md:text-3xl font-serif text-violet-200 mb-6">{t.hero.subtitle}</p>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">{t.hero.desc}</p>

          <Button
            onClick={() => window.location.href = createPageUrl('Subscribe')}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-12 py-7 text-xl rounded-full mb-6 shadow-2xl shadow-amber-500/30"
          >
            <Crown className="w-6 h-6 mr-3" />
            {t.hero.cta}
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
          <p className="text-sm text-slate-400">{t.hero.tryFree}</p>
        </div>
      </div>

      {/* 3 Benefits */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-4xl font-serif font-bold text-center mb-16 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.benefits.title}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {t.benefits.items.map((item, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-amber-500/30 transition-all">
              <item.icon className="w-12 h-12 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-amber-100">{item.title}</h3>
              <p className="text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-4xl font-serif font-bold text-center mb-16 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.howItWorks.title}
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {t.howItWorks.steps.map((step, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="text-4xl mb-3">{step.emoji}</div>
              <h3 className="font-semibold mb-2 text-amber-100">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-4xl font-serif font-bold text-center mb-16 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.security.title}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {t.security.items.map((item, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex gap-4">
              <div className="flex-shrink-0">
                <item.icon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-slate-200">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-12">
            <h2 className="text-4xl font-serif font-bold text-center mb-8 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.pricing.title}
            </h2>
            <div className="text-center mb-10">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent mb-2">
                {t.pricing.price}
              </div>
              <p className="text-slate-400">{t.pricing.guarantee}</p>
            </div>
            <ul className="space-y-3 mb-10">
              {t.pricing.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-200">{feat}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => window.location.href = createPageUrl('Subscribe')}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              {t.pricing.cta}
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.faq.title}
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {t.faq.items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-slate-800/50 border border-slate-700 rounded-xl px-6 hover:border-amber-500/30 transition-all"
            >
              <AccordionTrigger className="text-left text-lg font-medium text-amber-100">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10 pb-32">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-serif font-bold mb-4 text-white">{t.final.title}</h2>
            <p className="text-lg text-slate-300 mb-8">{t.final.subtitle}</p>
            <Button
              onClick={() => window.location.href = createPageUrl('Subscribe')}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-12 py-6 text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t.final.cta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}