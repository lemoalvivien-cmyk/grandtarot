import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Check, Shield, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Subscribe() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        // Redirige vers le login Base44, puis retour sur Subscribe après connexion
        base44.auth.redirectToLogin(createPageUrl('Subscribe'));
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [profiles, accounts] = await Promise.all([
        base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1),
        base44.entities.AccountPrivate.filter({ user_email: currentUser.email }, null, 1)
      ]);

      if (!profiles || profiles.length === 0) {
        const newProfile = await base44.entities.UserProfile.create({
          user_id: currentUser.email,
          display_name: currentUser.full_name || '',
          is_subscribed: false,
          language_pref: 'fr'
        });
        profiles.push(newProfile);
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');

      // SOURCE DE VÉRITÉ: plan_status dans AccountPrivate (mis à jour par le webhook Stripe)
      const planStatus = accounts && accounts.length > 0 ? (accounts[0].plan_status || 'free') : 'free';
      if (planStatus === 'active') {
        window.location.href = createPageUrl('App');
        return;
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setLoading(false);
      alert('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleSubscribe = async () => {
    if (checkoutLoading) return; // Prevent double-click
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const result = await base44.functions.invoke('stripe_create_checkout_session', {
        successUrl: window.location.origin + createPageUrl('SubscribeSuccess'),
        cancelUrl: window.location.origin + createPageUrl('SubscribeCancel')
      });
      
      const url = result?.data?.url;
      if (!url) {
        throw new Error(result?.data?.error || 'Impossible de créer la session de paiement');
      }
      window.location.href = url;
    } catch (error) {
      setCheckoutError(lang === 'fr'
        ? 'Une erreur est survenue lors de la connexion au paiement. Réessayez ou contactez support@grandtarot.com'
        : 'An error occurred connecting to payment. Please retry or contact support@grandtarot.com');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Déverrouillez votre destin",
      subtitle: "Rejoignez GRANDTAROT et découvrez vos connexions guidées par les astres",
      price: "6,90€",
      period: "/mois",
      cta: "S'abonner maintenant",
      guarantee: "Sans engagement • Résiliation à tout moment",
      features: [
        "Tirage quotidien personnalisé IA",
        "20 affinités par jour",
        "3 modes : Amour, Amitié, Pro",
        "Chat sécurisé après acceptation",
        "Encyclopédie 78 cartes",
        "Support prioritaire"
      ],
      back: "Retour"
    },
    en: {
      title: "Unlock your destiny",
      subtitle: "Join GRANDTAROT and discover your star-guided connections",
      price: "€6.90",
      period: "/month",
      cta: "Subscribe now",
      guarantee: "No commitment • Cancel anytime",
      features: [
        "AI personalized daily reading",
        "20 daily affinities",
        "3 modes: Love, Friendship, Pro",
        "Secure chat after acceptance",
        "78 cards encyclopedia",
        "Priority support"
      ],
      back: "Back"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">Premium Access</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          
          <p className="text-lg text-slate-300">{t.subtitle}</p>
        </div>

        {/* Pricing Card */}
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

            {/* Erreur checkout */}
            {checkoutError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-300 text-center">{checkoutError}</p>
              </div>
            )}

            {/* CTA */}
            <Button 
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white py-6 text-lg rounded-xl shadow-2xl shadow-amber-500/20 mb-4 disabled:opacity-70"
            >
              {checkoutLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>{lang === 'fr' ? 'Connexion...' : 'Connecting...'}</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t.cta}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Security & Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Shield className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Paiement sécurisé par Stripe' : 'Secure payment by Stripe'}</span>
              </div>
              <p className="text-xs text-slate-500 text-center">
                {lang === 'fr' ? 'Résiliation à tout moment depuis vos paramètres' : 'Cancel anytime from your settings'}
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <button 
            onClick={() => window.location.href = createPageUrl('Landing')}
            className="text-sm text-slate-400 hover:text-amber-200 transition-colors"
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
}