import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AppOnboarding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [formData, setFormData] = useState({
    display_name: '',
    mode_active: 'love',
    birth_year: '',
    language_pref: 'fr'
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      
      if (profiles.length === 0 || !profiles[0].is_subscribed) {
        window.location.href = createPageUrl('Subscribe');
        return;
      }

      if (profiles[0].onboarding_completed) {
        window.location.href = createPageUrl('App');
        return;
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');
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
      await base44.entities.UserProfile.update(profile.id, {
        ...formData,
        onboarding_completed: true
      });
      
      window.location.href = createPageUrl('App');
    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
    }
  };

  const content = {
    fr: {
      steps: {
        1: { title: "Choisissez votre mode", subtitle: "Comment souhaitez-vous utiliser GRANDTAROT ?" },
        2: { title: "Votre profil", subtitle: "Quelques informations pour personnaliser votre expérience" }
      },
      modes: [
        { value: 'love', icon: Heart, title: "Amour", desc: "Trouvez votre âme sœur", color: "from-rose-500 to-pink-600" },
        { value: 'friendship', icon: Users, title: "Amitié", desc: "Rencontrez des esprits connectés", color: "from-blue-500 to-cyan-600" },
        { value: 'professional', icon: Briefcase, title: "Pro", desc: "Réseautage pour dirigeants", color: "from-amber-500 to-orange-600" }
      ],
      name: "Prénom ou pseudo",
      birthYear: "Année de naissance",
      next: "Continuer",
      finish: "Commencer l'aventure"
    },
    en: {
      steps: {
        1: { title: "Choose your mode", subtitle: "How do you want to use GRANDTAROT?" },
        2: { title: "Your profile", subtitle: "A few details to personalize your experience" }
      },
      modes: [
        { value: 'love', icon: Heart, title: "Love", desc: "Find your soulmate", color: "from-rose-500 to-pink-600" },
        { value: 'friendship', icon: Users, title: "Friendship", desc: "Meet connected spirits", color: "from-blue-500 to-cyan-600" },
        { value: 'professional', icon: Briefcase, title: "Pro", desc: "Networking for leaders", color: "from-amber-500 to-orange-600" }
      ],
      name: "First name or nickname",
      birthYear: "Birth year",
      next: "Continue",
      finish: "Start the adventure"
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
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-gradient-to-r from-amber-500 to-violet-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.steps[step].title}
          </h1>
          <p className="text-lg text-slate-400">{t.steps[step].subtitle}</p>
        </div>

        {/* Step 1: Mode */}
        {step === 1 && (
          <div className="space-y-4">
            {t.modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setFormData(prev => ({ ...prev, mode_active: mode.value }))}
                className={`w-full text-left relative group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${mode.color} rounded-2xl blur-xl ${formData.mode_active === mode.value ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'} transition-all`} />
                <div className={`relative bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-6 transition-all ${
                  formData.mode_active === mode.value 
                    ? 'border-amber-500/50' 
                    : 'border-amber-500/10 hover:border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${mode.color} flex items-center justify-center`}>
                      <mode.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-100 mb-1">{mode.title}</h3>
                      <p className="text-sm text-slate-400">{mode.desc}</p>
                    </div>
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
              <label className="block text-sm text-slate-400 mb-2">{t.name}</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                className="bg-slate-900/50 border-amber-500/10 text-white h-12 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.birthYear}</label>
              <Input
                type="number"
                min="1924"
                max="2010"
                value={formData.birth_year}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_year: parseInt(e.target.value) || '' }))}
                className="bg-slate-900/50 border-amber-500/10 text-white h-12 text-lg"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12">
          {step < 2 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={!formData.mode_active}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl"
            >
              {t.next}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={saving || !formData.display_name}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl"
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
              className="w-full mt-4 text-slate-400 hover:text-amber-200 text-sm"
            >
              ← {lang === 'fr' ? 'Retour' : 'Back'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}