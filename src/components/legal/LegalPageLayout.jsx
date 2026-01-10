import React, { useState, useEffect } from 'react';
import { ChevronRight, FileText } from 'lucide-react';

export default function LegalPageLayout({ 
  title_fr, 
  title_en, 
  lastUpdated, 
  toc = [], 
  children 
}) {
  const [lang, setLang] = useState('fr');
  const [expandedToc, setExpandedToc] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('legal_lang');
      if (saved) setLang(saved);
    } catch (e) {
      // localStorage may not be available
    }
  }, []);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('legal_lang', newLang);
    } catch (e) {
      // localStorage may not be available
    }
  };

  const title = lang === 'fr' ? title_fr : title_en;
  const content = children(lang);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setExpandedToc(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => handleLangChange('fr')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                lang === 'fr' 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' 
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => handleLangChange('en')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                lang === 'en' 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' 
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* Last Updated */}
          <p className="text-slate-400 text-sm">
            {lang === 'fr' ? 'Dernière mise à jour :' : 'Last updated:'} <span className="text-amber-200">{lastUpdated}</span>
          </p>
        </div>

        {/* Table of Contents */}
        {toc.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-12">
            <button
              onClick={() => setExpandedToc(!expandedToc)}
              className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
            >
              <ChevronRight
                className={`w-5 h-5 text-amber-400 transition-transform ${
                  expandedToc ? 'rotate-90' : ''
                }`}
              />
              <h2 className="text-lg font-semibold text-amber-100">
                {lang === 'fr' ? 'Sommaire' : 'Table of Contents'}
              </h2>
            </button>

            {expandedToc && (
              <nav className="mt-4 space-y-2">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-amber-200 transition-all text-sm"
                  >
                    {lang === 'fr' ? item.label_fr : item.label_en}
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none [&_h2]:scroll-mt-20">
          {content}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700">
          <p className="text-slate-400 text-sm text-center">
            {lang === 'fr' 
              ? '© GRANDTAROT. Tous droits réservés. Dernière mise à jour : ' 
              : '© GRANDTAROT. All rights reserved. Last updated: '
            }
            <span className="text-amber-200">{lastUpdated}</span>
          </p>
        </div>
      </div>
    </div>
  );
}