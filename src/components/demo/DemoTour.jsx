import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DemoTour({ lang, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if tour was already seen
    const seen = localStorage.getItem('demo_tour_seen_v1');
    if (!seen) {
      setShow(true);
    }
  }, []);

  const steps = {
    fr: [
      { title: "Choisissez votre mode", desc: "Amour, Amitié ou Professionnel — adaptez l'expérience à vos besoins." },
      { title: "Votre dashboard personnalisé", desc: "Profil, guidance du jour et affinités réunies en un seul endroit." },
      { title: "Guidance quotidienne", desc: "Un tirage tarot + conseil action pour avancer avec clarté chaque jour." },
      { title: "Matching intelligent", desc: "20 profils ultra-compatibles basés sur astrologie, centres d'intérêt et proximité." },
      { title: "Chat sécurisé", desc: "Messages privés déverrouillés uniquement après acceptation mutuelle." }
    ],
    en: [
      { title: "Choose your mode", desc: "Love, Friendship or Professional — adapt the experience to your needs." },
      { title: "Your personalized dashboard", desc: "Profile, daily guidance and matches gathered in one place." },
      { title: "Daily guidance", desc: "A tarot reading + action advice to move forward with clarity every day." },
      { title: "Smart matching", desc: "20 ultra-compatible profiles based on astrology, shared interests and proximity." },
      { title: "Secure chat", desc: "Private messages unlocked only after mutual acceptance." }
    ]
  };

  const content = {
    fr: { next: "Suivant", skip: "Passer", finish: "Compris !" },
    en: { next: "Next", skip: "Skip", finish: "Got it!" }
  };

  const t = content[lang];
  const currentSteps = steps[lang];

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('demo_tour_seen_v1', 'true');
    setShow(false);
    if (onComplete) onComplete();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {currentSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-8 bg-amber-500' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button onClick={handleSkip} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-amber-100 mb-2">
          {currentSteps[currentStep].title}
        </h3>
        <p className="text-slate-300 mb-6 leading-relaxed">
          {currentSteps[currentStep].desc}
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-slate-600 hover:bg-slate-800"
          >
            {t.skip}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
          >
            {currentStep === currentSteps.length - 1 ? t.finish : t.next}
            {currentStep < currentSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}