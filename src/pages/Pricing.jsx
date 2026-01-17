import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Check, Sparkles, Crown, Heart, Users, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Pricing() {
  const [lang, setLang] = useState('fr');

  const content = {
    fr: {
      title: "Un seul abonnement",
      subtitle: "Tout illimité",
      price: "6,90€",
      period: "/mois",
      cta: "Commencer maintenant",
      guarantee: "Sans engagement • Résiliation à tout moment",
      features: [
        "Tirage quotidien personnalisé par IA",
        "Astrologie & numérologie (optionnel, scope privé par défaut)",
        "20 affinités par jour",
        "3 modes : Amour, Amitié, Pro",
        "Chat sécurisé après acceptation",
        "Accès encyclopédie 78 cartes",
        "Support prioritaire"
      ],
      modes: [
        { icon: Heart, title: "Mode Amour", desc: "Trouvez votre âme sœur guidée par les astres" },
        { icon: Users, title: "Mode Amitié", desc: "Rencontrez des esprits profondément connectés" },
        { icon: Briefcase, title: "Mode Pro", desc: "Réseautage stratégique pour dirigeants" }
      ],
      testimonials: [
        { text: "Les tirages sont d'une justesse troublante", author: "Marie, Paris" },
        { text: "J'ai rencontré mon partenaire business grâce à l'app", author: "Thomas, Lyon" },
        { text: "Enfin une app de rencontre qui a du sens", author: "Sarah, Bordeaux" }
      ]
    },
    en: {
      title: "One subscription",
      subtitle: "Everything unlimited",
      price: "€6.90",
      period: "/month",
      cta: "Start now",
      guarantee: "No commitment • Cancel anytime",
      features: [
        "AI personalized daily reading",
        "Astrology & numerology (optional, private scope by default)",
        "20 daily affinities",
        "3 modes: Love, Friendship, Pro",
        "Secure chat after acceptance",
        "Access to 78 cards encyclopedia",
        "Priority support"
      ],
      modes: [
        { icon: Heart, title: "Love Mode", desc: "Find your star-guided soulmate" },
        { icon: Users, title: "Friendship Mode", desc: "Meet deeply connected spirits" },
        { icon: Briefcase, title: "Pro Mode", desc: "Strategic networking for leaders" }
      ],
      testimonials: [
        { text: "The readings are disturbingly accurate", author: "Marie, Paris" },
        { text: "I met my business partner through the app", author: "Thomas, Lyon" },
        { text: "Finally a dating app that makes sense", author: "Sarah, Bordeaux" }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="relative">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-amber-500/10">
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">Premium Access</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          
          <p className="text-xl text-slate-300 mb-12">{t.subtitle}</p>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 md:p-12">
            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                  {t.price}
                </span>
                <span className="text-xl text-slate-400">{t.period}</span>
              </div>
              <p className="text-sm text-slate-400">{t.guarantee}</p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {t.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-slate-200">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link to={createPageUrl('Subscribe')}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white py-6 text-lg rounded-xl shadow-2xl shadow-amber-500/20">
                <Sparkles className="w-5 h-5 mr-2" />
                {t.cta}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modes */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {t.modes.map((mode, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-violet-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all">
                <mode.icon className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-amber-100">{mode.title}</h3>
                <p className="text-slate-400">{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-6xl mx-auto px-4 py-20 border-t border-amber-500/10">
        <div className="grid md:grid-cols-3 gap-8">
          {t.testimonials.map((testimonial, i) => (
            <div key={i} className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-violet-500/5 rounded-2xl" />
              <div className="relative bg-slate-900/30 border border-amber-500/10 rounded-2xl p-6">
                <Star className="w-5 h-5 text-amber-400 mb-3" />
                <p className="text-slate-300 mb-3 italic">"{testimonial.text}"</p>
                <p className="text-sm text-slate-500">— {testimonial.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}