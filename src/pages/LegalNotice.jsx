import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText } from 'lucide-react';

export default function LegalNotice() {
  const [lang, setLang] = useState('fr');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const keys = [
        'legal_entity_name',
        'legal_owner_name',
        'legal_siret',
        'legal_address',
        'legal_email',
        'hosting_provider',
        'hosting_address',
        'legal_contact_email'
      ];

      const results = await Promise.all(
        keys.map(key =>
          base44.entities.AppSettings.filter({ setting_key: key }, null, 1)
            .then(res => ({ key, value: res.length > 0 ? res[0].value_string : '' }))
            .catch(() => ({ key, value: '' }))
        )
      );

      const settingsObj = {};
      results.forEach(({ key, value }) => {
        settingsObj[key] = value || '[Non configuré]';
      });

      setSettings(settingsObj);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: 'Mentions légales',
      publisher: 'Éditeur',
      hosting: 'Hébergement',
      contact: 'Contact',
      legal: 'Informations légales'
    },
    en: {
      title: 'Legal Notice',
      publisher: 'Publisher',
      hosting: 'Hosting',
      contact: 'Contact',
      legal: 'Legal Information'
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-amber-400" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setLang('fr')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              lang === 'fr'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              lang === 'en'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            EN
          </button>
        </div>

        <div className="space-y-8">
          {/* Publisher */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-4">{t.publisher}</h2>
            <div className="space-y-2 text-slate-300">
              <p>
                <strong>{lang === 'fr' ? 'Entreprise :' : 'Company:'}</strong> {settings.legal_entity_name}
              </p>
              <p>
                <strong>{lang === 'fr' ? 'Responsable :' : 'Manager:'}</strong> {settings.legal_owner_name}
              </p>
              <p>
                <strong>SIRET:</strong> {settings.legal_siret}
              </p>
              <p>
                <strong>{lang === 'fr' ? 'Adresse :' : 'Address:'}</strong> {settings.legal_address}
              </p>
              <p>
                <strong>{lang === 'fr' ? 'Email :' : 'Email:'}</strong> {settings.legal_email}
              </p>
            </div>
          </section>

          {/* Hosting */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-4">{t.hosting}</h2>
            <div className="space-y-2 text-slate-300">
              <p>
                <strong>{lang === 'fr' ? 'Hébergeur :' : 'Hosting Provider:'}</strong> {settings.hosting_provider}
              </p>
              <p>
                <strong>{lang === 'fr' ? 'Adresse :' : 'Address:'}</strong> {settings.hosting_address}
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-4">{t.contact}</h2>
            <p className="text-slate-300 mb-4">
              {lang === 'fr'
                ? 'Pour toute question ou demande, contactez-nous à :'
                : 'For any questions or requests, contact us at:'}
            </p>
            <p className="text-amber-200 font-medium">{settings.legal_contact_email}</p>
          </section>

          {/* Legal */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-4">{t.legal}</h2>
            <div className="space-y-4 text-slate-300">
              <p>
                {lang === 'fr'
                  ? 'Les contenus du site (textes, images, vidéos, etc.) sont protégés par les droits d\'auteur et ne peuvent être reproduits ou utilisés sans autorisation.'
                  : 'Site contents (text, images, videos, etc.) are protected by copyright and cannot be reproduced or used without authorization.'}
              </p>
              <p>
                {lang === 'fr'
                  ? 'La responsabilité de l\'éditeur ne peut être engagée pour les éventuels dysfonctionnements ou interruptions du site.'
                  : 'Publisher liability cannot be engaged for any site malfunctions or interruptions.'}
              </p>
              <p>
                {lang === 'fr'
                  ? 'Pour toute violation de propriété intellectuelle, veuillez nous contacter immédiatement.'
                  : 'For any intellectual property violation, please contact us immediately.'}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-slate-400 text-sm text-center">
            © {new Date().getFullYear()} GRANDTAROT
          </p>
        </div>
      </div>
    </div>
  );
}