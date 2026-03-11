import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ModeSwitch - Switch between Love/Friendship/Professional modes
 * Persists in localStorage + AccountPrivate.preferred_mode
 */
export default function ModeSwitch({ initialMode = 'love', onModeChange, lang = 'fr' }) {
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem('gt_mode');
    if (stored && ['love', 'friendship', 'professional'].includes(stored)) {
      setCurrentMode(stored);
      if (onModeChange) onModeChange(stored);
    }
  }, []);

  const handleModeChange = async (newMode) => {
    if (newMode === currentMode) return;
    if (updating) return; // Prevent concurrent updates
    
    setUpdating(true);
    try {
      // Persist to localStorage (instant)
      localStorage.setItem('gt_mode', newMode);
      setCurrentMode(newMode);

      // Persist to AccountPrivate (async)
      const user = await base44.auth.me();
      const accounts = await base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1);
      
      if (accounts && accounts.length > 0) {
        await base44.entities.AccountPrivate.update(accounts[0].id, {
          preferred_mode: newMode
        });
      }

      // Notify parent
      if (onModeChange) onModeChange(newMode);

      // Reload page to apply mode change
      window.location.reload();
    } catch (error) {
      console.error('[ModeSwitch] Error updating mode:', error);
      // Revert local state on error
      setCurrentMode(currentMode);
      localStorage.setItem('gt_mode', currentMode);
      alert('Erreur lors du changement de mode. Réessayez.');
      setUpdating(false);
    }
  };

  const modes = {
    love: {
      icon: Heart,
      label: lang === 'fr' ? 'Amour' : 'Love',
      color: 'from-rose-500 to-pink-600',
      borderColor: 'border-rose-500/30',
      bgActive: 'bg-rose-500/20'
    },
    friendship: {
      icon: Users,
      label: lang === 'fr' ? 'Amitié' : 'Friendship',
      color: 'from-blue-500 to-cyan-600',
      borderColor: 'border-blue-500/30',
      bgActive: 'bg-blue-500/20'
    },
    professional: {
      icon: Briefcase,
      label: lang === 'fr' ? 'Pro' : 'Pro',
      color: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-500/30',
      bgActive: 'bg-amber-500/20'
    }
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {Object.entries(modes).map(([key, mode]) => {
        const ModeIcon = mode.icon;
        const isActive = currentMode === key;

        return (
          <button
            key={key}
            onClick={() => handleModeChange(key)}
            disabled={updating}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all
              ${isActive 
                ? `${mode.bgActive} border-2 ${mode.borderColor} shadow-lg` 
                : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
              }
              ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <ModeIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}