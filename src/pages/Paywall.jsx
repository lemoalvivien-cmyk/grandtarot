import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Check, Shield, Heart, Users, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Paywall() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Login');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user has profile and is subscribed
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        if (profiles[0].is_subscribed) {
          // User is subscribed, redirect to app
          window.location.href = createPageUrl('Dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Redirect to Stripe Payment Link
    window.location.href = 'https://buy.stripe.com/28E3cv4bZfue4Sh6YR28800';
  };

  const content = {
    fr: {
      title: "Débloquez GRANDTAROT",
      subtitle: "Accédez à toutes les fonctionnalités",
      price: "6,90€",
      period: "/mois",
      cta: "S'abonner maintenant",
      features: [
        "Tirage quotidien personnalisé par IA",
        "20 affinités par jour",
        "3 modes : Amour, Amitié, Pro",
        "Chat sécurisé après acceptation",
        "Accès encyclopédie complète",
        "Support prioritaire"
      ],
      guarantee: "Résiliation à tout moment",
      modes: [
        { icon: Heart, title: "Mode Amour", desc: "Trouvez votre âme sœur" },
        { icon: Users, title: "Mode Amitié", desc: "Rencontrez des esprits connectés" },
        { icon: Briefcase, title: "Mode Pro", desc: "Réseautage pour dirigeants" }
      ]
    },
    en: {
      title: "Unlock GRANDTAROT",
      subtitle: "Access all features",
      price: "€6.90",
      period: "/month",
      cta: "Subscribe now",
      features: [
        "AI personalized daily reading",
        "20 daily affinities",
        "3 modes: Love, Friendship, Pro",
        "Secure chat after acceptance",
        "Full encyclopedia access",
        "Priority support"
      ],
      guarantee: "Cancel anytime",
      modes: [
        { icon: Heart, title: "Love Mode", desc: "Find your soulmate" },
        { icon: Users, title: "Friendship Mode", desc: "Meet connected spirits" },
        { icon: Briefcase, title: "Pro Mode", desc: "Networking for leaders" }
      ]
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Language Switch */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-sm ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
        <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-sm ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-purple-500/20 rounded-2xl mb-6">
            <Sparkles className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{t.title}</h1>
          <p className="text-purple-200/60 text-lg">{t.subtitle}</p>
          {user && (
            <p className="text-purple-300/80 mt-2">
              {lang === 'fr' ? 'Connecté en tant que' : 'Logged in as'}: {user.email}
            </p>
          )}
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-amber-500/30 rounded-3xl blur-xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8">
              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">{t.price}</span>
                  <span className="text-purple-300/60">{t.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {t.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-purple-200/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 py-6 rounded-xl text-lg font-semibold"
              >
                {t.cta}
              </Button>

              {/* Guarantee */}
              <p className="text-center text-sm text-purple-300/60 mt-4 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                {t.guarantee}
              </p>
            </div>
          </div>
        </div>

        {/* Modes Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          {t.modes.map((mode, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <mode.icon className="w-10 h-10 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{mode.title}</h3>
              <p className="text-purple-200/60 text-sm">{mode.desc}</p>
            </div>
          ))}
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <button 
            onClick={() => base44.auth.logout(createPageUrl('Landing'))}
            className="text-purple-300/60 hover:text-white text-sm"
          >
            {lang === 'fr' ? 'Se déconnecter' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}