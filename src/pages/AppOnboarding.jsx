import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, ChevronRight, MapPin, Star, Hash, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PhotoUpload from '@/components/onboarding/PhotoUpload';
import InterestSelector from '@/components/onboarding/InterestSelector';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import TurnstileWidget from '@/components/security/TurnstileWidget';

export default function AppOnboarding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    gender: '',
    photo_url: '',
    city: '',
    radius_km: 50,
    mode_active: 'love',
    interest_ids: [],
    pro_sector: '',
    pro_company_size: '',
    pro_current_challenge: '',
    language_pref: 'fr',
    age_18_confirmed: false,
    // Astro/Num fields
    astrology_enabled: false,
    astrology_scope: 'personal_only',
    birth_time: '',
    birth_place: '',
    numerology_enabled: false,
    numerology_scope: 'personal_only',
    numerology_name: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1);
      
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

      // Prefill mode from demo if available
      const urlParams = new URLSearchParams(window.location.search);
      const modeFromUrl = urlParams.get('from_demo');
      const modeFromStorage = typeof window !== 'undefined' 
        ? localStorage.getItem('demo_selected_mode') 
        : null;
      const demoMode = modeFromUrl || modeFromStorage;

      let prefilledMode = profiles[0].mode_active || 'love';
      if (demoMode && ['love', 'friendship', 'professional'].includes(demoMode)) {
        prefilledMode = demoMode;
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');
      setFormData(prev => ({
        ...prev,
        display_name: profiles[0].display_name || currentUser.full_name || '',
        photo_url: profiles[0].photo_url || '',
        mode_active: prefilledMode,
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
      if (!formData.display_name || !formData.gender || !formData.photo_url || !formData.age_18_confirmed) {
        alert(lang === 'fr' ? 'Veuillez remplir tous les champs, ajouter une photo et confirmer votre âge' : 'Please fill all fields, add a photo and confirm your age');
        return;
      }
    }

    if (step === 2) {
      if (!formData.city || !formData.mode_active) {
        alert(lang === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
        return;
      }
    }

    if (step === 3) {
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
    }

    setStep(step + 1);
  };

  const handleComplete = async () => {
    // Step 4 validation
    if (!turnstileToken) {
      alert(lang === 'fr' ? 'Veuillez valider le captcha' : 'Please validate captcha');
      return;
    }

    if (!termsAccepted) {
      alert(lang === 'fr' ? 'Vous devez accepter les Conditions d\'utilisation' : 'You must accept Terms of Service');
      return;
    }

    if (!privacyAccepted) {
      alert(lang === 'fr' ? 'Vous devez accepter la Politique de confidentialité' : 'You must accept Privacy Policy');
      return;
    }

    setSaving(true);
    try {
      // CRITICAL: SERVER-SIDE AGE VERIFICATION (RGPD/COPPA compliance)
      // Le serveur lit lui-même birth_year/month/day depuis UserProfile — rien n'est passé du client
      const ageResult = await base44.functions.invoke('validate_age_gate', {});
      
      if (!ageResult?.data?.age_confirmed) {
        const age = ageResult?.data?.calculated_age;
        alert(lang === 'fr' 
          ? `Vous devez avoir au moins 18 ans.${age ? ` Âge calculé: ${age}` : ''}` 
          : `You must be at least 18 years old.${age ? ` Calculated age: ${age}` : ''}`);
        setSaving(false);
        return;
      }
      
      // Calculate profile completion
      let completion = 40; // Base
      if (formData.photo_url) completion += 20;
      if (formData.interest_ids.length >= 5) completion += 20;
      if (formData.city) completion += 10;
      if (formData.mode_active === 'professional' && formData.pro_sector) completion += 10;

      await base44.entities.UserProfile.update(profile.id, {
        display_name: formData.display_name,
        gender: formData.gender,
        photo_url: formData.photo_url,
        city: formData.city,
        radius_km: formData.radius_km,
        mode_active: formData.mode_active,
        interest_ids: formData.interest_ids,
        pro_sector: formData.pro_sector,
        pro_company_size: formData.pro_company_size,
        pro_current_challenge: formData.pro_current_challenge,
        language_pref: formData.language_pref,
        onboarding_completed: true,
        profile_completion: completion,
        last_active: new Date().toISOString()
      });

      // Store age confirmation + preferred mode + astro/num settings in AccountPrivate
      const accounts = await base44.entities.AccountPrivate.filter({
        user_email: user.email
      }, null, 1);

      if (accounts.length > 0) {
        const termsVersion = '1.0';
        const privacyVersion = '1.0';
        const accountUpdate = {
          age_confirmed_at: new Date().toISOString(),
          terms_accepted_at: new Date().toISOString(),
          terms_version_accepted: termsVersion,
          privacy_accepted_at: new Date().toISOString(),
          privacy_version_accepted: privacyVersion,
          preferred_mode: formData.mode_active,
          // Astrology settings
          astrology_enabled: formData.astrology_enabled,
          astrology_scope: formData.astrology_scope,
          birth_time: formData.birth_time || null,
          birth_place: formData.birth_place || null,
          // Numerology settings
          numerology_enabled: formData.numerology_enabled,
          numerology_scope: formData.numerology_scope,
          numerology_name: formData.numerology_name || null
        };
        
        await base44.entities.AccountPrivate.update(accounts[0].id, accountUpdate);
      }

      // Clear demo localStorage after successful onboarding
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_selected_mode');
        localStorage.removeItem('demo_source');
        localStorage.removeItem('demo_selected_at');
      }
      
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
        3: { title: "Vos affinités", subtitle: "Pour mieux vous connecter" },
        4: { title: "Guidance personnelle", subtitle: "Astrologie & Numérologie (optionnel)" }
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
      finish: "Commencer l'aventure",
      ageConfirm: "J'ai plus de 18 ans",
      ageMustConfirm: "Vous devez confirmer que vous avez plus de 18 ans",
      termsAccept: "J'accepte les Conditions d'utilisation",
      privacyAccept: "J'ai lu la Politique de confidentialité",
      astroTitle: "Astrologie",
      astroDesc: "Recevez vos prévisions quotidiennes personnalisées",
      numTitle: "Numérologie",
      numDesc: "Découvrez votre chemin de vie et énergies",
      scopePersonalOnly: "Pour moi uniquement",
      scopePersonalOnlyDesc: "Guidance privée, pas visible dans le matching",
      scopeMatching: "Pour moi + compatibilité",
      scopeMatchingDesc: "Visible dans votre profil et utilisé pour le matching",
      birthTime: "Heure de naissance (optionnel)",
      birthPlace: "Lieu de naissance (optionnel)",
      numName: "Nom complet pour numérologie (optionnel)",
      privacyNote: "🔒 Mode 'Pour moi uniquement' recommandé : rien n'apparaît dans vos profils de matching"
    },
    en: {
      steps: {
        1: { title: "Who are you?", subtitle: "Let's create your GRANDTAROT profile" },
        2: { title: "Your quest", subtitle: "How do you want to use the app?" },
        3: { title: "Your affinities", subtitle: "To better connect you" },
        4: { title: "Personal guidance", subtitle: "Astrology & Numerology (optional)" }
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
      finish: "Start the adventure",
      ageConfirm: "I am 18 years or older",
      ageMustConfirm: "You must confirm that you are 18 years or older",
      termsAccept: "I accept the Terms of Service",
      privacyAccept: "I have read the Privacy Policy",
      astroTitle: "Astrology",
      astroDesc: "Receive personalized daily forecasts",
      numTitle: "Numerology",
      numDesc: "Discover your life path and energies",
      scopePersonalOnly: "For me only",
      scopePersonalOnlyDesc: "Private guidance, not visible in matching",
      scopeMatching: "For me + compatibility",
      scopeMatchingDesc: "Visible in your profile and used for matching",
      birthTime: "Birth time (optional)",
      birthPlace: "Birth place (optional)",
      numName: "Full name for numerology (optional)",
      privacyNote: "🔒 'For me only' mode recommended: nothing appears in your matching profiles"
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
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${
              s <= step 
                ? 'bg-gradient-to-r from-amber-500 to-violet-500' 
                : 'bg-slate-800'
            }`} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
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
              <p className="text-xs text-slate-500 mb-3">{t.interestsDesc}</p>
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

        {/* Step 4: Astrology & Numerology */}
        {step === 4 && (
          <div className="space-y-8">
            {/* Privacy Notice */}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-violet-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-violet-200">{t.privacyNote}</p>
            </div>

            {/* Astrology Section */}
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-100 mb-1">{t.astroTitle}</h3>
                    <p className="text-sm text-slate-400">{t.astroDesc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.astrology_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, astrology_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                </label>
              </div>

              {formData.astrology_enabled && (
                <div className="space-y-4 pl-13">
                  {/* Scope Selection */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all">
                      <input
                        type="radio"
                        name="astrology_scope"
                        checked={formData.astrology_scope === 'personal_only'}
                        onChange={() => setFormData(prev => ({ ...prev, astrology_scope: 'personal_only' }))}
                        className="w-4 h-4 mt-1 accent-violet-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-violet-300" />
                          <span className="text-sm font-medium text-amber-100">{t.scopePersonalOnly}</span>
                        </div>
                        <p className="text-xs text-slate-400">{t.scopePersonalOnlyDesc}</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all">
                      <input
                        type="radio"
                        name="astrology_scope"
                        checked={formData.astrology_scope === 'personal_and_matching'}
                        onChange={() => setFormData(prev => ({ ...prev, astrology_scope: 'personal_and_matching' }))}
                        className="w-4 h-4 mt-1 accent-violet-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-amber-300" />
                          <span className="text-sm font-medium text-amber-100">{t.scopeMatching}</span>
                        </div>
                        <p className="text-xs text-slate-400">{t.scopeMatchingDesc}</p>
                      </div>
                    </label>
                  </div>

                  {/* Optional Fields */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">{t.birthTime}</label>
                      <Input
                        type="time"
                        value={formData.birth_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, birth_time: e.target.value }))}
                        className="bg-slate-800/50 border-slate-700 text-white h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">{t.birthPlace}</label>
                      <Input
                        value={formData.birth_place}
                        onChange={(e) => setFormData(prev => ({ ...prev, birth_place: e.target.value }))}
                        className="bg-slate-800/50 border-slate-700 text-white h-10 text-sm"
                        placeholder="Paris, France"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Numerology Section */}
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-100 mb-1">{t.numTitle}</h3>
                    <p className="text-sm text-slate-400">{t.numDesc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.numerology_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, numerology_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {formData.numerology_enabled && (
                <div className="space-y-4 pl-13">
                  {/* Scope Selection */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all">
                      <input
                        type="radio"
                        name="numerology_scope"
                        checked={formData.numerology_scope === 'personal_only'}
                        onChange={() => setFormData(prev => ({ ...prev, numerology_scope: 'personal_only' }))}
                        className="w-4 h-4 mt-1 accent-amber-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-violet-300" />
                          <span className="text-sm font-medium text-amber-100">{t.scopePersonalOnly}</span>
                        </div>
                        <p className="text-xs text-slate-400">{t.scopePersonalOnlyDesc}</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all">
                      <input
                        type="radio"
                        name="numerology_scope"
                        checked={formData.numerology_scope === 'personal_and_matching'}
                        onChange={() => setFormData(prev => ({ ...prev, numerology_scope: 'personal_and_matching' }))}
                        className="w-4 h-4 mt-1 accent-amber-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-amber-300" />
                          <span className="text-sm font-medium text-amber-100">{t.scopeMatching}</span>
                        </div>
                        <p className="text-xs text-slate-400">{t.scopeMatchingDesc}</p>
                      </div>
                    </label>
                  </div>

                  {/* Optional Name */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">{t.numName}</label>
                    <Input
                      value={formData.numerology_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, numerology_name: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white h-10 text-sm"
                      placeholder="Jean Dupont"
                      maxLength={100}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legal Checkboxes (Final Step) */}
        {step === 4 && (
          <div className="mt-8 space-y-4">
            {/* Turnstile (before legal) */}
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-xl p-6 flex justify-center">
              <TurnstileWidget onVerify={setTurnstileToken} />
            </div>

            {/* Legal Checkboxes */}
            <div className="space-y-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-amber-500"
                />
                <div className="text-sm text-amber-100">
                  {t.termsAccept}
                  {' '}
                  <a 
                    href={createPageUrl('Terms')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline text-amber-300 hover:text-amber-200"
                  >
                    {lang === 'fr' ? 'Lire les CGU' : 'Read Terms'}
                  </a>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-amber-500"
                />
                <div className="text-sm text-amber-100">
                  {t.privacyAccept}
                  {' '}
                  <a 
                    href={createPageUrl('Privacy')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline text-amber-300 hover:text-amber-200"
                  >
                    {lang === 'fr' ? 'Lire la politique' : 'Read Policy'}
                  </a>
                </div>
              </label>
            </div>
          </div>
          )}

        {/* Navigation */}
        <div className="mt-12 space-y-4">
          {step < 4 ? (
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
    </SubscriptionGuard>
  );
}