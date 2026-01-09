import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Heart, Users, Briefcase, Star, Shield, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const [lang, setLang] = React.useState('fr');
  
  const content = {
    fr: {
      hero: "Découvrez votre destin avec le Tarot",
      subtitle: "Tirage quotidien personnalisé • 20 affinités par jour • Rencontres guidées par les astres",
      cta: "Commencer mon voyage",
      price: "6,90€/mois",
      modes: [
        { icon: Heart, title: "Mode Amour", desc: "Trouvez votre âme sœur" },
        { icon: Users, title: "Mode Amitié", desc: "Rencontrez des esprits connectés" },
        { icon: Briefcase, title: "Mode Pro", desc: "Réseautage pour dirigeants" }
      ],
      features: [
        { icon: Sparkles, title: "Tirage quotidien IA", desc: "Interprétation personnalisée chaque jour" },
        { icon: Star, title: "78 lames complètes", desc: "Base encyclopédique bilingue" },
        { icon: Shield, title: "Contact sécurisé", desc: "Intention → Acceptation → Chat" }
      ],
      cardOfDay: "Carte du jour",
      blog: "Blog & Guides",
      encyclopedia: "Encyclopédie Tarot"
    },
    en: {
      hero: "Discover your destiny with Tarot",
      subtitle: "Daily personalized reading • 20 affinities per day • Star-guided connections",
      cta: "Start my journey",
      price: "€6.90/month",
      modes: [
        { icon: Heart, title: "Love Mode", desc: "Find your soulmate" },
        { icon: Users, title: "Friendship Mode", desc: "Meet connected spirits" },
        { icon: Briefcase, title: "Pro Mode", desc: "Networking for leaders" }
      ],
      features: [
        { icon: Sparkles, title: "AI Daily Reading", desc: "Personalized interpretation every day" },
        { icon: Star, title: "78 complete cards", desc: "Bilingual encyclopedia" },
        { icon: Shield, title: "Secure contact", desc: "Intention → Acceptance → Chat" }
      ],
      cardOfDay: "Card of the Day",
      blog: "Blog & Guides",
      encyclopedia: "Tarot Encyclopedia"
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=1920')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-950" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">GRANDTAROT V1</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent leading-tight">
            {t.hero}
          </h1>
          
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            {t.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button 
              onClick={() => window.location.href = createPageUrl('Subscribe')}
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-amber-500/30 border-0"
            >
              {t.cta}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <span className="text-amber-300 font-medium flex items-center gap-2">
              <Crown className="w-4 h-4" />
              {t.price}
            </span>
          </div>
        </div>
      </div>

      {/* Modes Section */}
      <div className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-16 text-amber-100">
          {lang === 'fr' ? 'Trois modes, une destinée' : 'Three modes, one destiny'}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {t.modes.map((mode, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-violet-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-8 hover:border-amber-500/30 transition-all">
                <mode.icon className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-2xl font-serif font-semibold mb-2 text-amber-100">{mode.title}</h3>
                <p className="text-slate-400">{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-amber-500/10">
        <div className="grid md:grid-cols-3 gap-12">
          {t.features.map((feat, i) => (
            <div key={i} className="text-center group">
              <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 group-hover:border-amber-500/40 transition-all">
                <feat.icon className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-amber-100">{feat.title}</h3>
              <p className="text-slate-400">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}