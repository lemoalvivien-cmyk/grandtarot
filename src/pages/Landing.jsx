import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Heart, Users, Briefcase, Star, Shield, Globe } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Language Switch */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={() => setLang('fr')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            lang === 'fr' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          FR
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            lang === 'en' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          EN
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/50 to-slate-950" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">GRANDTAROT V1</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-200 via-white to-amber-200 bg-clip-text text-transparent">
            {t.hero}
          </h1>
          
          <p className="text-xl text-purple-200/80 max-w-2xl mx-auto mb-10">
            {t.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to={createPageUrl('Signup')}>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-purple-500/30">
                {t.cta}
              </Button>
            </Link>
            <span className="text-purple-300 font-medium">{t.price}</span>
          </div>

          {/* Public Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Link to={createPageUrl('CardOfDay')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
              {t.cardOfDay}
            </Link>
            <Link to={createPageUrl('Encyclopedia')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
              {t.encyclopedia}
            </Link>
            <Link to={createPageUrl('Blog')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
              {t.blog}
            </Link>
          </div>
        </div>
      </div>

      {/* Modes Section */}
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {t.modes.map((mode, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-amber-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-purple-500/50 transition-all">
                <mode.icon className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">{mode.title}</h3>
                <p className="text-purple-200/60">{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-24 border-t border-white/10">
        <div className="grid md:grid-cols-3 gap-12">
          {t.features.map((feat, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex p-4 bg-purple-500/20 rounded-2xl mb-4">
                <feat.icon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feat.title}</h3>
              <p className="text-purple-200/60">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">GRANDTAROT</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-purple-200/60">
            <Link to={createPageUrl('Login')} className="hover:text-white transition-colors">Login</Link>
            <Link to={createPageUrl('Signup')} className="hover:text-white transition-colors">Signup</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}