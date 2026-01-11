import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, Star, Shield, Crown, ArrowRight, CheckCircle, Lock, Eye, MessageCircle, Zap, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getDailyCardFallback } from '@/components/helpers/fallbackTarotDeck';
import TarotCardImage from '@/components/tarot/TarotCardImage';

export default function Landing() {
  const [lang, setLang] = useState('fr');
  const [dailyCard, setDailyCard] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  
  useEffect(() => {
    loadDailyCard();
    addSEOMeta();
    addStructuredData();
  }, []);
  
  const addSEOMeta = () => {
    // OpenGraph meta tags
    const ogTags = [
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://grandtarot.com' },
      { property: 'og:title', content: 'GRANDTAROT - Connexions Guidées par les Astres' },
      { property: 'og:description', content: 'Rencontres basées sur le tarot et l\'astrologie. Tirage quotidien IA personnalisé, 20 affinités cosmiques par jour. 3 modes : Amour, Amitié, Pro.' },
      { property: 'og:image', content: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&h=630&fit=crop' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'GRANDTAROT - Connexions Guidées par les Astres' },
      { name: 'twitter:description', content: 'Rencontres basées sur le tarot et l\'astrologie. Tirage quotidien IA personnalisé, 20 affinités cosmiques par jour.' },
      { name: 'twitter:image', content: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&h=630&fit=crop' }
    ];
    
    ogTags.forEach(tag => {
      const meta = document.createElement('meta');
      if (tag.property) meta.setAttribute('property', tag.property);
      if (tag.name) meta.setAttribute('name', tag.name);
      meta.content = tag.content;
      document.head.appendChild(meta);
    });
    
    // JSON-LD Structured Data for FAQ
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Comment fonctionne le tirage quotidien ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Chaque matin, notre IA analyse votre profil et tire 3 cartes de tarot personnalisées. L'interprétation est adaptée à votre mode actif (Amour, Amitié, Pro) et à vos intentions du moment."
          }
        },
        {
          "@type": "Question",
          "name": "Comment sont calculées les 20 affinités ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Notre algorithme cosmique croise compatibilité astrale (signes), centres d'intérêt communs, synergies tarot et proximité géographique pour vous proposer 20 profils ultra-compatibles chaque jour."
          }
        },
        {
          "@type": "Question",
          "name": "Puis-je changer de mode en cours d'abonnement ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolument ! Vous pouvez basculer entre Amour, Amitié et Pro à tout moment depuis vos paramètres. Vos affinités s'adapteront automatiquement."
          }
        }
      ]
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    };

    const addStructuredData = () => {
    // Organization Schema
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "GRANDTAROT",
      "url": "https://grandtarot.com",
      "logo": "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=512&h=512&fit=crop",
      "description": "Application de rencontres basée sur le tarot et l'astrologie",
      "sameAs": [
        "https://www.instagram.com/grandtarot",
        "https://www.facebook.com/grandtarot"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@grandtarot.com"
      }
    };

    // WebApplication Schema
    const appSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "GRANDTAROT",
      "applicationCategory": "LifestyleApplication",
      "offers": {
        "@type": "Offer",
        "price": "6.90",
        "priceCurrency": "EUR"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1247"
      }
    };

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(orgSchema);
    document.head.appendChild(orgScript);

    const appScript = document.createElement('script');
    appScript.type = 'application/ld+json';
    appScript.text = JSON.stringify(appSchema);
    document.head.appendChild(appScript);
    };

  const loadDailyCard = async () => {
    // Timeout guard: 6 seconds max
    const timeoutId = setTimeout(() => {
      if (cardLoading) {
        setCardError(true);
        setUsingFallback(true);
        loadFallbackCard();
      }
    }, 6000);

    try {
      const today = new Date().toISOString().split('T')[0];
      const cards = await base44.entities.AdminDailyCard.filter({ 
        publish_date: today,
        is_published: true 
      }, null, 1);
      
      if (cards.length > 0) {
        const tarotCard = await base44.entities.TarotCard.filter({ id: cards[0].tarot_card_id }, null, 1);
        if (tarotCard.length > 0) {
          setDailyCard(cards[0]);
          setCardData(tarotCard[0]);
          setCardLoading(false);
          clearTimeout(timeoutId);
          return;
        }
      }
      
      // No card found in backend -> use fallback
      setUsingFallback(true);
      loadFallbackCard();
      clearTimeout(timeoutId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading daily card:', error);
      }
      setCardError(true);
      setUsingFallback(true);
      loadFallbackCard();
      clearTimeout(timeoutId);
    }
  };

  const loadFallbackCard = () => {
    const fallbackCard = getDailyCardFallback();
    setCardData(fallbackCard);
    
    // Create a minimal daily card structure for display
    setDailyCard({
      interpretation_fr: fallbackCard.meaning_upright_fr,
      interpretation_en: fallbackCard.meaning_upright_en
    });
    
    setCardLoading(false);
  };
  
  const content = {
    fr: {
      hero: {
        title: "Le Tarot révèle votre destinée",
        subtitle: "Rejoignez le cercle des âmes éveillées",
        desc: "Tirage quotidien IA personnalisé • 20 affinités cosmiques • Connexions authentiques",
        cta: "Entrer dans le Cercle"
      },
      proof: {
        title: "La Carte du Jour",
        subtitle: "Découvrez le message des astres aujourd'hui",
        cta: "Voir ma carte personnelle"
      },
      mechanism: {
        title: "Comment ça marche",
        subtitle: "Votre voyage mystique en 3 étapes",
        steps: [
          { icon: Sparkles, title: "Votre Rituel Quotidien", desc: "Tirage personnalisé avec interprétation IA basée sur votre mode actif (Amour, Amitié ou Pro)" },
          { icon: Heart, title: "20 Affinités par Jour", desc: "L'algorithme cosmique analyse compatibilité astrale, centres d'intérêt et synergies tarot" },
          { icon: MessageCircle, title: "Connexion Sécurisée", desc: "Envoyez une Intention → Acceptation mutuelle → Chat privé déverrouillé" }
        ]
      },
      modes: {
        title: "Trois modes, une destinée",
        items: [
          { icon: Heart, title: "Mode Amour", desc: "Trouvez votre âme sœur guidée par les astres", color: "from-rose-500 to-pink-600" },
          { icon: Users, title: "Mode Amitié", desc: "Rencontrez des esprits connectés et authentiques", color: "from-blue-500 to-cyan-600" },
          { icon: Briefcase, title: "Mode Pro", desc: "Réseautage premium pour dirigeants visionnaires", color: "from-amber-500 to-orange-600" }
        ]
      },
      security: {
        title: "Votre sécurité, notre priorité",
        subtitle: "Zéro harcèlement, zéro spam",
        features: [
          { icon: Lock, title: "Intention validée", desc: "Pas de chat sans acceptation mutuelle des deux côtés" },
          { icon: Eye, title: "Modération IA", desc: "Messages scannés en temps réel pour détecter contenu inapproprié" },
          { icon: Shield, title: "Blocage instantané", desc: "Un clic pour bloquer et signaler tout comportement suspect" }
        ]
      },
      pricing: {
        title: "Rejoignez le Cercle Premium",
        subtitle: "Accès illimité à toutes les fonctionnalités",
        price: "6,90€",
        period: "/mois",
        features: [
          "Tirage quotidien IA personnalisé",
          "20 affinités cosmiques par jour",
          "3 modes : Amour, Amitié, Pro",
          "Chat sécurisé après acceptation",
          "Encyclopédie 78 cartes complète",
          "Support prioritaire 7j/7"
        ],
        guarantee: "Résiliation facile à tout moment",
        cta: "Commencer maintenant"
      },
      faq: {
        title: "Questions fréquentes",
        items: [
          {
            q: "Comment fonctionne le tirage quotidien ?",
            a: "Chaque matin, notre IA analyse votre profil et tire 3 cartes de tarot personnalisées. L'interprétation est adaptée à votre mode actif (Amour, Amitié, Pro) et à vos intentions du moment."
          },
          {
            q: "Comment sont calculées les 20 affinités ?",
            a: "Notre algorithme cosmique croise compatibilité astrale (signes), centres d'intérêt communs, synergies tarot et proximité géographique pour vous proposer 20 profils ultra-compatibles chaque jour."
          },
          {
            q: "Puis-je changer de mode en cours d'abonnement ?",
            a: "Absolument ! Vous pouvez basculer entre Amour, Amitié et Pro à tout moment depuis vos paramètres. Vos affinités s'adapteront automatiquement."
          },
          {
            q: "Comment fonctionne le système d'Intention ?",
            a: "Vous envoyez une Intention (message de 20-500 caractères) à un profil qui vous attire. Si la personne accepte, un chat privé s'ouvre. Sinon, rien ne se passe. Zéro harcèlement possible."
          },
          {
            q: "Puis-je annuler mon abonnement facilement ?",
            a: "Oui, résiliation en 1 clic depuis vos paramètres. Aucun engagement, aucune question posée. Votre abonnement reste actif jusqu'à la fin de la période payée."
          },
          {
            q: "Mes données sont-elles sécurisées ?",
            a: "100%. Nous utilisons le chiffrement SSL, les serveurs sécurisés européens (RGPD), et aucune donnée n'est revendue. Votre email n'est JAMAIS exposé publiquement."
          },
          {
            q: "Y a-t-il des profils fake ou bots ?",
            a: "Non. Chaque profil nécessite une photo vérifiée, un score de confiance, et la modération IA détecte automatiquement les comportements suspects."
          },
          {
            q: "Combien d'Intentions puis-je envoyer par jour ?",
            a: "5 Intentions par jour maximum pour favoriser la qualité sur la quantité. Si vous recevez 3 refus consécutifs, un cooldown de 24h s'active pour protéger la communauté."
          },
          {
            q: "Puis-je utiliser GRANDTAROT sur mobile ?",
            a: "Oui ! Le site est 100% responsive et optimisé pour mobile. Une version app iOS/Android est prévue en 2026."
          },
          {
            q: "Quelle est la différence avec Tinder/Bumble ?",
            a: "GRANDTAROT ne se limite pas à l'amour : 3 modes (Amour/Amitié/Pro). Les affinités sont calculées via astrologie et tarot, pas juste des photos. Et le système d'Intention élimine le ghosting et le harcèlement."
          }
        ]
      },
      final: {
        title: "Prêt à découvrir votre destinée ?",
        subtitle: "Rejoignez des milliers d'âmes éveillées",
        cta: "Entrer dans le Cercle"
      }
    },
    en: {
      hero: {
        title: "Tarot reveals your destiny",
        subtitle: "Join the circle of awakened souls",
        desc: "AI personalized daily reading • 20 cosmic affinities • Authentic connections",
        cta: "Enter the Circle"
      },
      proof: {
        title: "Card of the Day",
        subtitle: "Discover today's message from the stars",
        cta: "See my personalized card"
      },
      mechanism: {
        title: "How it works",
        subtitle: "Your mystical journey in 3 steps",
        steps: [
          { icon: Sparkles, title: "Your Daily Ritual", desc: "Personalized reading with AI interpretation based on your active mode (Love, Friendship or Pro)" },
          { icon: Heart, title: "20 Affinities per Day", desc: "The cosmic algorithm analyzes astral compatibility, common interests and tarot synergies" },
          { icon: MessageCircle, title: "Secure Connection", desc: "Send an Intention → Mutual acceptance → Private chat unlocked" }
        ]
      },
      modes: {
        title: "Three modes, one destiny",
        items: [
          { icon: Heart, title: "Love Mode", desc: "Find your star-guided soulmate", color: "from-rose-500 to-pink-600" },
          { icon: Users, title: "Friendship Mode", desc: "Meet connected and authentic spirits", color: "from-blue-500 to-cyan-600" },
          { icon: Briefcase, title: "Pro Mode", desc: "Premium networking for visionary leaders", color: "from-amber-500 to-orange-600" }
        ]
      },
      security: {
        title: "Your safety, our priority",
        subtitle: "Zero harassment, zero spam",
        features: [
          { icon: Lock, title: "Validated intention", desc: "No chat without mutual acceptance from both sides" },
          { icon: Eye, title: "AI moderation", desc: "Messages scanned in real-time to detect inappropriate content" },
          { icon: Shield, title: "Instant blocking", desc: "One click to block and report any suspicious behavior" }
        ]
      },
      pricing: {
        title: "Join the Premium Circle",
        subtitle: "Unlimited access to all features",
        price: "€6.90",
        period: "/month",
        features: [
          "AI personalized daily reading",
          "20 cosmic affinities per day",
          "3 modes: Love, Friendship, Pro",
          "Secure chat after acceptance",
          "Complete 78 cards encyclopedia",
          "Priority support 7/7"
        ],
        guarantee: "Easy cancellation anytime",
        cta: "Start now"
      },
      faq: {
        title: "Frequently asked questions",
        items: [
          {
            q: "How does the daily reading work?",
            a: "Every morning, our AI analyzes your profile and draws 3 personalized tarot cards. The interpretation is adapted to your active mode (Love, Friendship, Pro) and your current intentions."
          },
          {
            q: "How are the 20 affinities calculated?",
            a: "Our cosmic algorithm crosses astral compatibility (signs), common interests, tarot synergies and geographical proximity to offer you 20 ultra-compatible profiles every day."
          },
          {
            q: "Can I change mode during my subscription?",
            a: "Absolutely! You can switch between Love, Friendship and Pro anytime from your settings. Your affinities will adapt automatically."
          },
          {
            q: "How does the Intention system work?",
            a: "You send an Intention (20-500 characters message) to a profile that attracts you. If the person accepts, a private chat opens. Otherwise, nothing happens. Zero harassment possible."
          },
          {
            q: "Can I cancel my subscription easily?",
            a: "Yes, 1-click cancellation from your settings. No commitment, no questions asked. Your subscription remains active until the end of the paid period."
          },
          {
            q: "Is my data secure?",
            a: "100%. We use SSL encryption, secure European servers (GDPR), and no data is resold. Your email is NEVER exposed publicly."
          },
          {
            q: "Are there fake profiles or bots?",
            a: "No. Each profile requires a verified photo, a trust score, and AI moderation automatically detects suspicious behavior."
          },
          {
            q: "How many Intentions can I send per day?",
            a: "5 Intentions per day maximum to favor quality over quantity. If you receive 3 consecutive refusals, a 24h cooldown activates to protect the community."
          },
          {
            q: "Can I use GRANDTAROT on mobile?",
            a: "Yes! The site is 100% responsive and optimized for mobile. An iOS/Android app version is planned for 2026."
          },
          {
            q: "What's the difference with Tinder/Bumble?",
            a: "GRANDTAROT is not limited to love: 3 modes (Love/Friendship/Pro). Affinities are calculated via astrology and tarot, not just photos. And the Intention system eliminates ghosting and harassment."
          }
        ]
      },
      final: {
        title: "Ready to discover your destiny?",
        subtitle: "Join thousands of awakened souls",
        cta: "Enter the Circle"
      }
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen">
      {/* 1. HERO */}
      <div className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=1920')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-950" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">GRANDTAROT</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent leading-tight">
            {lang === 'fr' ? 'Rencontres Tarot & Astrologie - Trouvez Votre Âme Sœur' : 'Tarot & Astrology Dating - Find Your Soulmate'}
          </h1>
          
          <p className="text-2xl md:text-3xl font-serif text-violet-200 mb-4">
            {t.hero.subtitle}
          </p>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            {t.hero.desc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button 
              onClick={() => window.location.href = createPageUrl('Subscribe')}
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white px-12 py-7 text-xl rounded-full shadow-2xl shadow-amber-500/30 border-0"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              {t.hero.cta}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            <Link to={createPageUrl('Demo')}>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-200 px-8 py-7 text-xl rounded-full"
              >
                <Eye className="w-6 h-6 mr-3" />
                {lang === 'fr' ? 'Voir la démo' : 'View demo'}
              </Button>
            </Link>
          </div>
          
          <p className="text-amber-300 font-medium">
            <Crown className="w-4 h-4 inline mr-2" />
            {t.pricing.price}{t.pricing.period}
          </p>
        </div>
      </div>

      {/* 2. PREUVE - CARTE DU JOUR */}
      <div className="max-w-5xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.proof.title}
          </h2>
          <p className="text-lg text-slate-400">{t.proof.subtitle}</p>
        </div>

        {cardLoading ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-400">{lang === 'fr' ? 'Chargement de la carte du jour...' : 'Loading today\'s card...'}</p>
          </div>
        ) : cardData ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 md:p-12">
              {usingFallback && (
                <div className="mb-4 flex items-center justify-center gap-2 text-xs text-amber-300/60">
                  <AlertCircle className="w-3 h-3" />
                  <span>{lang === 'fr' ? 'Mode hors ligne' : 'Offline mode'}</span>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Card Image */}
                <div className="mx-auto">
                  <div className="relative w-64 h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-amber-500/30 overflow-hidden flex items-center justify-center">
                    <TarotCardImage
                      src={cardData.imagePath || cardData.image_url}
                      alt={lang === 'fr' ? cardData.name_fr : cardData.name_en}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Interpretation */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif font-bold text-amber-100">
                    {lang === 'fr' ? cardData.name_fr : cardData.name_en}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {lang === 'fr' ? dailyCard.interpretation_fr : dailyCard.interpretation_en}
                  </p>
                  <Button 
                    onClick={() => window.location.href = createPageUrl('Subscribe')}
                    className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 w-full md:w-auto"
                  >
                    {t.proof.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. MÉCANISME */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.mechanism.title}
          </h2>
          <p className="text-lg text-slate-400">{t.mechanism.subtitle}</p>
        </div>

        <div className="space-y-8">
          {t.mechanism.steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-violet-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 md:p-8 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-xl flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-semibold mb-2 text-amber-100">{step.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MODES */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.modes.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.modes.items.map((mode, i) => (
            <div key={i} className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-20 rounded-3xl blur-2xl group-hover:opacity-30 transition-all`} />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-8 hover:border-amber-500/30 transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-6`}>
                  <mode.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-serif font-semibold mb-3 text-amber-100">{mode.title}</h3>
                <p className="text-slate-400 leading-relaxed">{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SÉCURITÉ */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.security.title}
          </h2>
          <p className="text-lg text-slate-400">{t.security.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.security.features.map((feat, i) => (
            <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <feat.icon className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-amber-100">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. PRIX */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-slate-400">{t.pricing.subtitle}</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-10 md:p-14">
            {/* Price */}
            <div className="text-center mb-10">
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                  {t.pricing.price}
                </span>
                <span className="text-2xl text-slate-400">{t.pricing.period}</span>
              </div>
              <p className="text-sm text-slate-500">{t.pricing.guarantee}</p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-10">
              {t.pricing.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-200">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button 
              onClick={() => window.location.href = createPageUrl('Subscribe')}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-7 text-xl rounded-xl shadow-2xl shadow-amber-500/20"
            >
              <Zap className="w-6 h-6 mr-3" />
              {t.pricing.cta}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* 7. FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.faq.title}
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {t.faq.items.map((item, i) => (
            <AccordionItem 
              key={i} 
              value={`item-${i}`}
              className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl px-6 hover:border-amber-500/30 transition-all"
            >
              <AccordionTrigger className="text-left text-lg font-medium text-amber-100 hover:text-amber-200">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* 8. CTA FINAL */}
      <div className="max-w-5xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.final.title}
            </h2>
            <p className="text-xl text-slate-300 mb-10">{t.final.subtitle}</p>
            <Button 
              onClick={() => window.location.href = createPageUrl('Subscribe')}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-12 py-7 text-xl rounded-full shadow-2xl shadow-amber-500/30"
            >
              <Crown className="w-6 h-6 mr-3" />
              {t.final.cta}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}