import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PhotoUpload from '@/components/onboarding/PhotoUpload';
import InterestSelector from '@/components/onboarding/InterestSelector';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function AppOnboarding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [formData, setFormData] = useState({
    display_name: '',
    birth_year: '',
    gender: '',
    photo_url: '',
    city: '',
    radius_km: 50,
    mode_active: 'love',
    interest_ids: [],
    pro_sector: '',
    pro_company_size: '',
    pro_current_challenge: '',
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

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      const hasActiveSubscription = profiles.length > 0 && 
        (profiles[0].subscription_status === 'active' || profiles[0].subscription_status === 'trialing');
      
      if (!hasActiveSubscription) {
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
        display_name: profiles[0].display_name || currentUser.full_name || '',
        photo_url: profiles[0].photo_url || '',
        mode_active: profiles[0].mode_active || 'love',
        language_pref: profiles[0].language_pref || 'fr'
      }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validation
    if (step === 1) {
      if (!formData.display_name || !formData.birth_year || !formData.gender || !formData.photo_url) {
        alert(lang === 'fr' ? 'Veuillez remplir tous les champs et ajouter une photo' : 'Please fill all fields and add a photo');
        return;
      }
      const age = new Date().getFullYear() - formData.birth_year;
      if (age < 18 || age > 100) {
        alert(lang === 'fr' ? 'Vous devez avoir entre 18 et 100 ans' : 'You must be between 18 and 100 years old');
        return;
      }
    }

    if (step === 2) {
      if (!formData.city || !formData.mode_active) {
        alert(lang === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleComplete = async () => {
    // Step 3 validation
    if (formData.interest_ids.length < 5) {
      alert(lang === 'fr' ? 'Sélectionnez au moins 5 centres d\'intérêt' : 'Select at least 5 interests');
      return;
    }

    if (formData.mode_active === 'professional') {
      if (!formData.pro_sector || !formData.pro_company_size) {
        alert(lang === 'fr' ? 'Complétez les informations professionnelles' : 'Complete professional information');
        return;
      }
    }

    setSaving(true);
    try {
      // Calculate profile completion
      let completion = 40; // Base
      if (formData.photo_url) completion += 20;
      if (formData.interest_ids.length >= 5) completion += 20;
      if (formData.city) completion += 10;
      if (formData.mode_active === 'professional' && formData.pro_sector) completion += 10;

      await base44.entities.UserProfile.update(profile.id, {
        ...formData,
        onboarding_completed: true,
        profile_completion: completion,
        last_active: new Date().toISOString()
      });
      
      window.location.href = createPageUrl('App');
    } catch (error) {
      console.error('Error:', error);
      alert(lang === 'fr' ? 'Erreur lors de la sauvegarde' : 'Save error');
      setSaving(false);
    }
  };

  const content = {
    fr: {
      steps: {
        1: { title: "Qui êtes-vous ?", subtitle: "Créons votre profil GRANDTAROT" },
        2: { title: "Votre quête", subtitle: "Comment souhaitez-vous utiliser l'app ?" },
        3: { title: "Vos affinités", subtitle: "Pour mieux vous connecter" }
      },
      modes: [
        { value: 'love', icon: Heart, title: "Amour", desc: "Trouvez votre âme sœur", color: "from-rose-500 to-pink-600" },
        { value: 'friendship', icon: Users, title: "Amitié", desc: "Rencontrez des esprits connectés", color: "from-blue-500 to-cyan-600" },
        { value: 'professional', icon: Briefcase, title: "Pro", desc: "Réseautage pour dirigeants", color: "from-amber-500 to-orange-600" }
      ],
      name: "Prénom ou pseudo",
      birthYear: "Année de naissance",
      gender: "Genre",
      genders: {
        male: "Homme",
        female: "Femme",
        non_binary: "Non-binaire",
        prefer_not_say: "Préfère ne pas dire"
      },
      city: "Ville",
      radius: "Rayon de recherche",
      interests: "Centres d'intérêt",
      interestsDesc: "Sélectionnez au moins 5",
      proSector: "Secteur d'activité",
      proCompanySize: "Taille entreprise",
      proChallenge: "Défi actuel (optionnel)",
      next: "Continuer",
      back: "Retour",
      finish: "Commencer l'aventure"
    },
    en: {
      steps: {
        1: { title: "Who are you?", subtitle: "Let's create your GRANDTAROT profile" },
        2: { title: "Your quest", subtitle: "How do you want to use the app?" },
        3: { title: "Your affinities", subtitle: "To better connect you" }
      },
      modes: [
        { value: 'love', icon: Heart, title: "Love", desc: "Find your soulmate", color: "from-rose-500 to-pink-600" },
        { value: 'friendship', icon: Users, title: "Friendship", desc: "Meet connected spirits", color: "from-blue-500 to-cyan-600" },
        { value: 'professional', icon: Briefcase, title: "Pro", desc: "Networking for leaders", color: "from-amber-500 to-orange-600" }
      ],
      name: "First name or nickname",
      birthYear: "Birth year",
      gender: "Gender",
      genders: {
        male: "Male",
        female: "Female",
        non_binary: "Non-binary",
        prefer_not_say: "Prefer not to say"
      },
      city: "City",
      radius: "Search radius",
      interests: "Interests",
      interestsDesc: "Select at least 5",
      proSector: "Industry sector",
      proCompanySize: "Company size",
      proChallenge: "Current challenge (optional)",
      next: "Continue",
      back: "Back",
      finish: "Start the adventure"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <SubscriptionGuard allowOnboarding={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard allowOnboarding={true}>
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${
              s <= step 
                ? 'bg-gradient-to-r from-amber-500 to-violet-500' 
                : 'bg-slate-800'
            }`} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.steps[step].title}
          </h1>
          <p className="text-lg text-slate-400">{t.steps[step].subtitle}</p>
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-8">
            <PhotoUpload 
              currentPhotoUrl={formData.photo_url}
              onPhotoUploaded={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
              lang={lang}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">{t.name} *</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className="bg-slate-900/50 border-amber-500/10 text-white h-12"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">{t.birthYear} *</label>
                <Input
                  type="number"
                  min="1924"
                  max="2008"
                  value={formData.birth_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_year: parseInt(e.target.value) || '' }))}
                  className="bg-slate-900/50 border-amber-500/10 text-white h-12"
                  placeholder="1990"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.gender} *</label>
              <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}>
                <SelectTrigger className="bg-slate-900/50 border-amber-500/10 text-white h-12">
                  <SelectValue placeholder={t.gender} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-amber-500/10 text-white">
                  {Object.entries(t.genders).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Location & Mode */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t.city} *
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-slate-900/50 border-amber-500/10 text-white h-12"
                  placeholder="Paris, Lyon, Marseille..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">{t.radius}</label>
                <Select value={formData.radius_km.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, radius_km: parseInt(v) }))}>
                  <SelectTrigger className="bg-slate-900/50 border-amber-500/10 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-amber-500/10 text-white">
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                    <SelectItem value="200">200 km</SelectItem>
                    <SelectItem value="500">500 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm text-slate-400 mb-4">Mode actif *</label>
              <div className="space-y-3">
                {t.modes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setFormData(prev => ({ ...prev, mode_active: mode.value }))}
                    className="w-full text-left relative group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${mode.color} rounded-2xl blur-xl ${
                      formData.mode_active === mode.value ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'
                    } transition-all`} />
                    <div className={`relative bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-5 transition-all ${
                      formData.mode_active === mode.value 
                        ? 'border-amber-500/50' 
                        : 'border-amber-500/10 hover:border-amber-500/30'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${mode.color} flex items-center justify-center`}>
                          <mode.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-amber-100">{mode.title}</h3>
                          <p className="text-sm text-slate-400">{mode.desc}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Interests + Pro */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm text-slate-400 mb-4">{t.interests} *</label>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
                <InterestSelector
                  selectedIds={formData.interest_ids}
                  onSelectionChange={(ids) => setFormData(prev => ({ ...prev, interest_ids: ids }))}
                  lang={lang}
                  minRequired={5}
                />
              </div>
            </div>

            {/* Pro Fields */}
            {formData.mode_active === 'professional' && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-amber-400 mb-4">
                  {lang === 'fr' ? 'Informations professionnelles' : 'Professional information'}
                </h3>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t.proSector} *</label>
                  <Input
                    value={formData.pro_sector}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_sector: e.target.value }))}
                    className="bg-slate-900/50 border-amber-500/10 text-white h-12"
                    placeholder="Tech, Finance, Santé..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t.proCompanySize} *</label>
                  <Select value={formData.pro_company_size} onValueChange={(v) => setFormData(prev => ({ ...prev, pro_company_size: v }))}>
                    <SelectTrigger className="bg-slate-900/50 border-amber-500/10 text-white h-12">
                      <SelectValue placeholder={t.proCompanySize} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-amber-500/10 text-white">
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-1000">201-1,000</SelectItem>
                      <SelectItem value="1000+">1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t.proChallenge}</label>
                  <Textarea
                    value={formData.pro_current_challenge}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_current_challenge: e.target.value }))}
                    className="bg-slate-900/50 border-amber-500/10 text-white"
                    placeholder={lang === 'fr' ? 'Ex: Développer mon réseau...' : 'Ex: Expand my network...'}
                    maxLength={300}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 space-y-4">
          {step < 3 ? (
            <Button 
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl shadow-xl shadow-amber-500/20"
            >
              {t.next}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 py-6 text-lg rounded-xl shadow-xl shadow-amber-500/20"
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
          
          {step > 1 && !saving && (
            <button 
              onClick={() => setStep(step - 1)}
              className="w-full text-slate-400 hover:text-amber-200 text-sm"
            >
              ← {t.back}
            </button>
          )}
        </div>

        {/* Required fields note */}
        <p className="text-xs text-slate-500 text-center mt-6">
          * {lang === 'fr' ? 'Champs obligatoires' : 'Required fields'}
        </p>
      </div>
    </div>
  );
}