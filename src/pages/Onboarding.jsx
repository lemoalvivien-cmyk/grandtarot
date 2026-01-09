import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, ChevronRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Onboarding() {
  const [lang, setLang] = useState('fr');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    mode: 'amour',
    birth_date: '',
    bio_fr: '',
    bio_en: '',
    looking_for: []
  });

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

      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      
      if (profiles.length === 0 || !profiles[0].is_subscribed) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      if (profiles[0].onboarding_completed) {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      setProfile(profiles[0]);
      setFormData(prev => ({
        ...prev,
        display_name: profiles[0].display_name || user.full_name || ''
      }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Calculate zodiac sign from birth date
      let zodiac = null;
      if (formData.birth_date) {
        const date = new Date(formData.birth_date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        zodiac = getZodiacSign(month, day);
      }

      await base44.entities.UserProfile.update(profile.id, {
        ...formData,
        zodiac_sign: zodiac,
        language: lang,
        onboarding_completed: true
      });
      
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
    }
  };

  const getZodiacSign = (month, day) => {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    return 'pisces';
  };

  const content = {
    fr: {
      steps: {
        1: { title: "Choisissez votre mode", subtitle: "Comment souhaitez-vous utiliser GRANDTAROT ?" },
        2: { title: "Votre profil", subtitle: "Présentez-vous à la communauté" },
        3: { title: "Presque terminé", subtitle: "Quelques détails pour personnaliser votre expérience" }
      },
      modes: [
        { value: 'amour', icon: Heart, title: "Amour", desc: "Trouvez votre âme sœur", color: "from-pink-500 to-rose-500" },
        { value: 'amitie', icon: Users, title: "Amitié", desc: "Rencontrez des esprits connectés", color: "from-blue-500 to-cyan-500" },
        { value: 'pro', icon: Briefcase, title: "Pro", desc: "Réseautage pour dirigeants", color: "from-amber-500 to-orange-500" }
      ],
      name: "Prénom ou pseudo",
      birthDate: "Date de naissance",
      bio: "Présentez-vous (FR)",
      bioHint: "Décrivez vos centres d'intérêt, ce que vous recherchez...",
      next: "Continuer",
      finish: "Commencer l'aventure"
    },
    en: {
      steps: {
        1: { title: "Choose your mode", subtitle: "How do you want to use GRANDTAROT?" },
        2: { title: "Your profile", subtitle: "Introduce yourself to the community" },
        3: { title: "Almost done", subtitle: "A few details to personalize your experience" }
      },
      modes: [
        { value: 'amour', icon: Heart, title: "Love", desc: "Find your soulmate", color: "from-pink-500 to-rose-500" },
        { value: 'amitie', icon: Users, title: "Friendship", desc: "Meet connected spirits", color: "from-blue-500 to-cyan-500" },
        { value: 'pro', icon: Briefcase, title: "Pro", desc: "Networking for leaders", color: "from-amber-500 to-orange-500" }
      ],
      name: "First name or nickname",
      birthDate: "Date of birth",
      bio: "Introduce yourself (EN)",
      bioHint: "Describe your interests, what you're looking for...",
      next: "Continue",
      finish: "Start the adventure"
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

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-purple-500' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">{t.steps[step].title}</h1>
          <p className="text-purple-200/60">{t.steps[step].subtitle}</p>
        </div>

        {/* Step 1: Mode Selection */}
        {step === 1 && (
          <div className="space-y-4">
            {t.modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setFormData(prev => ({ ...prev, mode: mode.value }))}
                className={`w-full p-5 rounded-2xl border-2 transition-all ${
                  formData.mode === mode.value 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${mode.color} rounded-xl flex items-center justify-center`}>
                    <mode.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{mode.title}</h3>
                    <p className="text-purple-200/60 text-sm">{mode.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-purple-300 mb-2">{t.name}</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                placeholder={t.name}
              />
            </div>
            <div>
              <label className="block text-sm text-purple-300 mb-2">{t.birthDate}</label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 3: Bio */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-purple-300 mb-2">{t.bio}</label>
              <Textarea
                value={lang === 'fr' ? formData.bio_fr : formData.bio_en}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  [lang === 'fr' ? 'bio_fr' : 'bio_en']: e.target.value 
                }))}
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-32"
                placeholder={t.bioHint}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8">
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-600 py-6 rounded-xl text-lg"
              disabled={step === 1 && !formData.mode}
            >
              {t.next}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-600 py-6 rounded-xl text-lg"
              disabled={saving}
            >
              {saving ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t.finish}
                </>
              )}
            </Button>
          )}
          
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="w-full mt-4 text-purple-300/60 hover:text-white text-sm"
            >
              ← {lang === 'fr' ? 'Retour' : 'Back'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}