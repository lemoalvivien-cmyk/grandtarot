import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';

export default function InterestSelector({ selectedIds = [], onSelectionChange, lang = 'fr', minRequired = 5 }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const data = await base44.entities.Interest.filter({ is_active: true });
      setInterests(data);
    } catch (error) {
      console.error('Error loading interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId) => {
    if (selectedIds.includes(interestId)) {
      onSelectionChange(selectedIds.filter(id => id !== interestId));
    } else {
      onSelectionChange([...selectedIds, interestId]);
    }
  };

  const groupedByCategory = interests.reduce((acc, interest) => {
    if (!acc[interest.category]) acc[interest.category] = [];
    acc[interest.category].push(interest);
    return acc;
  }, {});

  const content = {
    fr: {
      selected: "sélectionné(s)",
      minimum: `Minimum ${minRequired} requis`
    },
    en: {
      selected: "selected",
      minimum: `Minimum ${minRequired} required`
    }
  };

  const t = content[lang];

  if (loading) {
    return <div className="text-center text-slate-400">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-slate-400">
          {selectedIds.length} {t.selected} • {t.minimum}
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs uppercase tracking-wider text-amber-400 mb-2 capitalize">
              {category.replace(/_/g, ' ')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {items.map((interest) => {
                const isSelected = selectedIds.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white'
                        : 'bg-slate-800/50 border border-amber-500/10 text-slate-300 hover:border-amber-500/30'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {lang === 'fr' ? interest.name_fr : interest.name_en}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}