import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, Shield, Check, Eye, MessageCircle, Target, Zap, Crown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const profiles = await base44.entities.UserProfile.filter({ user_id: (await base44.auth.me()).email }, null, 1);
        if (profiles.length > 0) {
          setLang(profiles[0].language_pref || 'fr');
        }
      }
    } catch (error) {
      // Silent fail - use default FR
    }
  };

  const content = {
    fr: {
      hero: {
        badge: "1 abonnement = Amour + Amitié + Pro",
        title: "À propos de GrandTarot",
        subtitle: "Une plateforme de rencontre + guidance, pensée pour réduire le hasard et augmenter la qualité des connexions.",
        cta1: "Voir la démo",
        cta2: "S'abonner"
      },
      problem: {
        title: "Ce qui fatigue vraiment",
        punchline: "Moins de bruit. Plus de sens.",
        points: [
          "Volume écrasant : 100+ profils par jour, aucun tri intelligent",
          "Perte de temps : 80% des matchs ne mènent nulle part",
          "Échanges vides : « Salut ça va » répété à l'infini",
          "Déceptions : promesses non tenues, ghosting permanent"
        ]
      },
      approach: {
        title: "Notre approche",
        matching: {
          title: "Matching intelligent",
          desc: "Affinités réelles (astrologie, centres d'intérêt), proximité géographique, intentions claires.",
          bullets: ["Compatibilité astrale", "Synergies tarot", "Intentions validées"]
        },
        guidance: {
          title: "Guidance quotidienne",
          desc: "Carte du jour + message clair + impulsion d'action pour avancer dans vos connexions.",
          bullets: ["Rituel simple", "Message personnalisé", "Clarté instantanée"]
        },
        reassurance: "La guidance n'est pas là pour prédire. Elle sert à clarifier et décider."
      },
      modes: {
        title: "3 modes inclus",
        subtitle: "Un seul abonnement, trois façons de se connecter",
        love: {
          title: "Mode Amour",
          what: ["Compatibilité astrale renforcée", "Messages de guidance romantique", "20 profils quotidiens ultra-ciblés"],
          result: "Trouvez votre âme sœur guidée par les astres"
        },
        friendship: {
          title: "Mode Amitié",
          what: ["Centres d'intérêt communs", "Synergies énergétiques", "Rencontres authentiques"],
          result: "Rencontrez des esprits connectés et authentiques"
        },
        professional: {
          title: "Mode Professionnel",
          what: ["Networking premium", "Synergies professionnelles", "Opportunités ciblées"],
          result: "Réseautage premium pour leaders visionnaires"
        }
      },
      benefits: {
        title: "Ce que la guidance change",
        items: [
          { icon: "🎯", title: "Clarté instantanée", desc: "Comprenez où vous en êtes, aujourd'hui" },
          { icon: "💬", title: "Communication facilitée", desc: "Savoir quoi dire, quand le dire" },
          { icon: "🧭", title: "Décisions éclairées", desc: "Moins de doute, plus d'action" },
          { icon: "⚡", title: "Impulsion quotidienne", desc: "Un rituel simple qui donne du sens" },
          { icon: "🌟", title: "Confiance renforcée", desc: "Avancer sans second-guessing permanent" }
        ]
      },
      tarot: {
        title: "Construite avec des tarologues professionnels",
        tagline: "Quand la clarté rencontre le destin.",
        subtitle: "Guidance conçue avec des tarologues professionnels.",
        guarantees: [
          "Rituel simple et compréhensible",
          "Approche respectueuse (pas de promesses irréalistes)",
          "Guidance orientée action (clarté, communication, choix)"
        ]
      },
      security: {
        title: "Sécurité & Confiance",
        subtitle: "Votre tranquillité d'esprit est notre priorité",
        points: [
          { icon: Shield, title: "Chat sécurisé", desc: "Messages privés après acceptation mutuelle uniquement" },
          { icon: Eye, title: "Blocage & signalement", desc: "Outils simples pour bloquer et signaler tout comportement suspect" },
          { icon: Target, title: "Parcours clair", desc: "Intentions validées, profils vérifiés, zéro harcèlement" },
          { icon: Check, title: "RGPD & droits", desc: "Vos données sont protégées, exportables et supprimables à tout moment" }
        ]
      },
      pricing: {
        title: "Tout inclus",
        price: "6,90€",
        period: "TTC/mois",
        desc: "Accès aux 3 modes + guidance quotidienne + support prioritaire",
        cta: "Je commence maintenant",
        note: "Activation après validation (SLA affiché sur la page Billing)."
      },
      faq: {
        title: "Questions fréquentes",
        items: [
          {
            q: "Est-ce que c'est du mystique ?",
            a: "Non. Le tarot est utilisé comme outil de réflexion et de clarification, pas de prédiction. C'est un support pour mieux comprendre vos émotions et prendre des décisions conscientes."
          },
          {
            q: "Est-ce que je dois croire au Tarot ?",
            a: "Pas du tout. Beaucoup d'utilisateurs voient ça comme un rituel de morning routine, une façon structurée de réfléchir à leur journée. Croyance optionnelle."
          },
          {
            q: "Je veux juste des rencontres simples, ça marche ?",
            a: "Absolument. La guidance est optionnelle. Si vous voulez juste 20 profils par jour + chat sécurisé, c'est déjà inclus. La carte du jour est un bonus, pas une obligation."
          },
          {
            q: "Pourquoi 3 modes dans un seul abonnement ?",
            a: "Parce que votre vie n'est pas monolithique. Vous pouvez chercher l'amour ET vouloir développer votre réseau pro. Un seul abonnement, zéro limite."
          },
          {
            q: "Puis-je supprimer/exporter mes données ?",
            a: "Oui. Vous avez un droit RGPD complet : accès, rectification, suppression, portabilité. Tout est expliqué dans la section Confidentialité."
          }
        ]
      },
      final: {
        title: "GrandTarot : la rencontre entre la technologie et la guidance",
        subtitle: "Pour transformer le hasard en choix conscients.",
        cta1: "Voir la démo",
        cta2: "S'abonner maintenant"
      }
    },
    en: {
      hero: {
        badge: "1 subscription = Love + Friendship + Pro",
        title: "About GrandTarot",
        subtitle: "A dating + guidance platform designed to reduce randomness and increase connection quality.",
        cta1: "View demo",
        cta2: "Subscribe"
      },
      problem: {
        title: "What really exhausts people",
        punchline: "Less noise. More meaning.",
        points: [
          "Overwhelming volume: 100+ profiles per day, no smart filtering",
          "Time waste: 80% of matches lead nowhere",
          "Empty exchanges: 'Hey what's up' repeated endlessly",
          "Disappointments: broken promises, permanent ghosting"
        ]
      },
      approach: {
        title: "Our approach",
        matching: {
          title: "Smart matching",
          desc: "Real affinities (astrology, interests), geographical proximity, clear intentions.",
          bullets: ["Astral compatibility", "Tarot synergies", "Validated intentions"]
        },
        guidance: {
          title: "Daily guidance",
          desc: "Card of the day + clear message + action impulse to move forward in your connections.",
          bullets: ["Simple ritual", "Personalized message", "Instant clarity"]
        },
        reassurance: "Guidance is not about predicting. It's about clarifying and deciding."
      },
      modes: {
        title: "3 included modes",
        subtitle: "One subscription, three ways to connect",
        love: {
          title: "Love Mode",
          what: ["Enhanced astral compatibility", "Romantic guidance messages", "20 ultra-targeted daily profiles"],
          result: "Find your star-guided soulmate"
        },
        friendship: {
          title: "Friendship Mode",
          what: ["Common interests", "Energetic synergies", "Authentic encounters"],
          result: "Meet connected and authentic spirits"
        },
        professional: {
          title: "Professional Mode",
          what: ["Premium networking", "Professional synergies", "Targeted opportunities"],
          result: "Premium networking for visionary leaders"
        }
      },
      benefits: {
        title: "What guidance changes",
        items: [
          { icon: "🎯", title: "Instant clarity", desc: "Understand where you are, today" },
          { icon: "💬", title: "Facilitated communication", desc: "Know what to say, when to say it" },
          { icon: "🧭", title: "Informed decisions", desc: "Less doubt, more action" },
          { icon: "⚡", title: "Daily impulse", desc: "A simple ritual that gives meaning" },
          { icon: "🌟", title: "Reinforced confidence", desc: "Move forward without constant second-guessing" }
        ]
      },
      tarot: {
        title: "Built with professional tarot readers",
        tagline: "When clarity meets destiny.",
        subtitle: "Guidance designed with professional tarot readers.",
        guarantees: [
          "Simple and understandable ritual",
          "Respectful approach (no unrealistic promises)",
          "Action-oriented guidance (clarity, communication, choices)"
        ]
      },
      security: {
        title: "Security & Trust",
        subtitle: "Your peace of mind is our priority",
        points: [
          { icon: Shield, title: "Secure chat", desc: "Private messages after mutual acceptance only" },
          { icon: Eye, title: "Block & report", desc: "Simple tools to block and report any suspicious behavior" },
          { icon: Target, title: "Clear path", desc: "Validated intentions, verified profiles, zero harassment" },
          { icon: Check, title: "GDPR & rights", desc: "Your data is protected, exportable and deletable at any time" }
        ]
      },
      pricing: {
        title: "All inclusive",
        price: "€6.90",
        period: "per month",
        desc: "Access to 3 modes + daily guidance + priority support",
        cta: "Start now",
        note: "Activation after validation (SLA displayed on Billing page)."
      },
      faq: {
        title: "Frequently asked questions",
        items: [
          {
            q: "Is this mystical?",
            a: "No. Tarot is used as a tool for reflection and clarification, not prediction. It's a support to better understand your emotions and make conscious decisions."
          },
          {
            q: "Do I need to believe in Tarot?",
            a: "Not at all. Many users see it as a morning routine ritual, a structured way to reflect on their day. Belief optional."
          },
          {
            q: "I just want simple encounters, does it work?",
            a: "Absolutely. Guidance is optional. If you just want 20 profiles per day + secure chat, that's already included. The card of the day is a bonus, not an obligation."
          },
          {
            q: "Why 3 modes in one subscription?",
            a: "Because your life isn't monolithic. You can be looking for love AND want to develop your pro network. One subscription, zero limits."
          },
          {
            q: "Can I delete/export my data?",
            a: "Yes. You have full GDPR rights: access, rectification, deletion, portability. Everything is explained in the Privacy section."
          }
        ]
      },
      final: {
        title: "GrandTarot: where technology meets guidance",
        subtitle: "To transform chance into conscious choices.",
        cta1: "View demo",
        cta2: "Subscribe now"
      }
    }
  };

  const t = content[lang];

  const modes = [
    { id: 'love', icon: Heart, color: 'from-rose-500 to-pink-600', data: t.modes.love },
    { id: 'friendship', icon: Users, color: 'from-blue-500 to-cyan-600', data: t.modes.friendship },
    { id: 'professional', icon: Briefcase, color: 'from-amber-500 to-orange-600', data: t.modes.professional }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">{t.hero.badge}</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent">
            {t.hero.title}
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={createPageUrl('Demo')}>
              <Button size="lg" className="bg-black/30 backdrop-blur border-2 border-amber-300/40 hover:bg-black/40 hover:border-amber-300/60 text-white font-semibold px-8 py-7 text-lg rounded-full">
                <Eye className="w-5 h-5 mr-2" />
                {t.hero.cta1}
              </Button>
            </Link>
            <Link to={createPageUrl('Billing')}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white px-8 py-7 text-lg rounded-full shadow-2xl shadow-amber-500/20">
                <Sparkles className="w-5 h-5 mr-2" />
                {t.hero.cta2}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div className="max-w-5xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.problem.title}
        </h2>
        <p className="text-center text-2xl font-serif text-violet-200 mb-12">{t.problem.punchline}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {t.problem.points.map((point, i) => (
            <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
              <p className="text-slate-300 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* APPROACH */}
      <div className="max-w-5xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-16 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.approach.title}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8">
            <Target className="w-12 h-12 text-amber-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-amber-100">{t.approach.matching.title}</h3>
            <p className="text-slate-300 mb-4">{t.approach.matching.desc}</p>
            <ul className="space-y-2">
              {t.approach.matching.bullets.map((bullet, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-400">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8">
            <Sparkles className="w-12 h-12 text-violet-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-amber-100">{t.approach.guidance.title}</h3>
            <p className="text-slate-300 mb-4">{t.approach.guidance.desc}</p>
            <ul className="space-y-2">
              {t.approach.guidance.bullets.map((bullet, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-400">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-slate-400 italic">{t.approach.reassurance}</p>
      </div>

      {/* 3 MODES */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.modes.title}
        </h2>
        <p className="text-center text-lg text-slate-400 mb-12">{t.modes.subtitle}</p>

        <div className="grid md:grid-cols-3 gap-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div key={mode.id} className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-serif font-semibold mb-4 text-amber-100">{mode.data.title}</h3>
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">{lang === 'fr' ? 'Ce que tu as :' : 'What you get:'}</p>
                  <ul className="space-y-2">
                    {mode.data.what.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-violet-200 font-medium">{mode.data.result}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* BENEFITS */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-16 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.benefits.title}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {t.benefits.items.map((item, i) => (
            <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-amber-100">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TAROT SECTION */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-amber-500/20">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6961750fbed28bda279f7002/09bad3a26_Gemini_Generated_Image_axvsw7axvsw7axvs.png"
                alt="Professional Tarot Reader"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-amber-500/20 to-violet-500/20 flex items-center justify-center"><div class="text-center"><div class="text-6xl mb-4">🔮</div><p class="text-slate-400">Professional Guidance</p></div></div>';
                }}
              />
            </div>
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.tarot.title}
            </h2>
            <p className="text-2xl font-serif text-violet-200 mb-2">{t.tarot.tagline}</p>
            <p className="text-slate-400 mb-8">{t.tarot.subtitle}</p>

            <div className="space-y-4">
              {t.tarot.guarantees.map((guarantee, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <p className="text-slate-300">{guarantee}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECURITY */}
      <div className="max-w-5xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.security.title}
        </h2>
        <p className="text-center text-lg text-slate-400 mb-12">{t.security.subtitle}</p>

        <div className="grid md:grid-cols-2 gap-8">
          {t.security.points.map((point, i) => {
            const Icon = point.icon;
            return (
              <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
                <Icon className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-amber-100">{point.title}</h3>
                <p className="text-slate-400">{point.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRICING */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-serif font-bold mb-6 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.pricing.title}
            </h2>
            
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                {t.pricing.price}
              </span>
              <span className="text-xl text-slate-400">{t.pricing.period}</span>
            </div>
            
            <p className="text-slate-300 mb-8">{t.pricing.desc}</p>
            
            <Link to={createPageUrl('Billing')}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white px-12 py-7 text-xl rounded-full shadow-2xl shadow-amber-500/20 mb-4">
                <Zap className="w-6 h-6 mr-2" />
                {t.pricing.cta}
              </Button>
            </Link>
            
            <p className="text-xs text-slate-500">{t.pricing.note}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-16 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
          {t.faq.title}
        </h2>

        <div className="space-y-6">
          {t.faq.items.map((item, i) => (
            <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3 text-amber-100">{item.q}</h3>
              <p className="text-slate-300 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="max-w-5xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t.final.title}
            </h2>
            <p className="text-xl text-slate-300 mb-10">{t.final.subtitle}</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('Demo')}>
                <Button size="lg" className="bg-black/30 backdrop-blur border-2 border-amber-300/40 hover:bg-black/40 hover:border-amber-300/60 text-white font-semibold px-8 py-7 text-lg rounded-full">
                  <Eye className="w-5 h-5 mr-2" />
                  {t.final.cta1}
                </Button>
              </Link>
              <Link to={createPageUrl('Billing')}>
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white px-12 py-7 text-lg rounded-full shadow-2xl shadow-amber-500/20">
                  <Crown className="w-6 h-6 mr-2" />
                  {t.final.cta2}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}