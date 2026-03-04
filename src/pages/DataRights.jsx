import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Eye, Pencil, Trash2, Ban, Download, Lock, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function DataRights() {
  const [lang, setLang] = useState('fr');
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'access',
    message: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess('');
    setSubmitError('');

    if (!user) {
      setSubmitError(lang === 'fr' ? 'Veuillez vous connecter pour continuer.' : 'Please log in to continue.');
      setSubmitting(false);
      return;
    }

    try {
      if (formData.type === 'access') {
        // Export instantané
        const result = await base44.functions.invoke('generate_dsar_export', {});
        
        if (result?.data?.export_data) {
          const blob = new Blob([JSON.stringify(result.data.export_data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.data.download_filename || `grandtarot_export_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setSubmitSuccess(lang === 'fr'
            ? '✅ Export téléchargé ! Vos données complètes sont dans le fichier JSON.'
            : '✅ Export downloaded! Your complete data is in the JSON file.');
          setFormData({ type: 'access', message: '' });
        } else {
          throw new Error(result?.data?.error || 'Export échoué');
        }
        return;
      }

      if (!formData.message || formData.message.length < 10) {
        setSubmitError(lang === 'fr'
          ? 'Veuillez décrire votre demande (minimum 10 caractères).'
          : 'Please describe your request (minimum 10 characters).');
        return;
      }

      await base44.entities.DsarRequest.create({
        requester_user_id: user.email,
        type: formData.type,
        message: formData.message
      });

      setSubmitSuccess(lang === 'fr'
        ? 'Votre demande a été soumise. Un admin vous répondra sous 30 jours.'
        : 'Your request has been submitted. An admin will respond within 30 days.');
      setFormData({ type: 'access', message: '' });
    } catch (error) {
      setSubmitError(lang === 'fr'
        ? 'Une erreur s\'est produite. Réessayez ou contactez support@grandtarot.com'
        : 'An error occurred. Please retry or contact support@grandtarot.com');
    } finally {
      setSubmitting(false);
    }
  };

  const rights = [
    {
      icon: Eye,
      titleFr: 'Droit d\'accès',
      titleEn: 'Right of Access',
      descFr: 'Demander une copie de vos données personnelles',
      descEn: 'Request a copy of your personal data',
      type: 'access'
    },
    {
      icon: Pencil,
      titleFr: 'Droit de rectification',
      titleEn: 'Right of Rectification',
      descFr: 'Corriger ou mettre à jour vos données',
      descEn: 'Correct or update your data',
      type: 'rectification'
    },
    {
      icon: Trash2,
      titleFr: 'Droit à l\'oubli',
      titleEn: 'Right to Erasure',
      descFr: 'Demander la suppression de vos données',
      descEn: 'Request deletion of your data',
      type: 'deletion'
    },
    {
      icon: Ban,
      titleFr: 'Droit d\'opposition',
      titleEn: 'Right of Objection',
      descFr: 'Vous opposer au traitement de vos données',
      descEn: 'Object to processing of your data',
      type: 'objection'
    },
    {
      icon: Download,
      titleFr: 'Droit à la portabilité',
      titleEn: 'Right to Data Portability',
      descFr: 'Exporter vos données dans un format structuré',
      descEn: 'Export your data in a structured format',
      type: 'portability'
    },
    {
      icon: Lock,
      titleFr: 'Droit à la limitation',
      titleEn: 'Right to Restriction',
      descFr: 'Restreindre le traitement de vos données',
      descEn: 'Restrict processing of your data',
      type: 'restriction'
    }
  ];

  const content = {
    fr: {
      title: 'Vos droits RGPD',
      subtitle: 'Exercez vos droits sur vos données personnelles',
      form: {
        type: 'Type de demande',
        message: 'Détails de votre demande',
        submit: 'Soumettre',
        submitting: 'Soumission...',
        placeholder: 'Décrivez votre demande de manière détaillée (minimum 10 caractères)'
      },
      info: 'Une fois soumise, votre demande sera traitée dans un délai de 30 jours conformément au RGPD.'
    },
    en: {
      title: 'Your GDPR Rights',
      subtitle: 'Exercise your rights over your personal data',
      form: {
        type: 'Request Type',
        message: 'Details of your request',
        submit: 'Submit',
        submitting: 'Submitting...',
        placeholder: 'Describe your request in detail (minimum 10 characters)'
      },
      info: 'Once submitted, your request will be processed within 30 days in accordance with GDPR.'
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-slate-300">{t.subtitle}</p>
        </div>

        {/* Language */}
        <div className="flex justify-center gap-2 mb-12">
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

        {/* Rights Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {rights.map((right) => {
            const Icon = right.icon;
            return (
              <div key={right.type} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <Icon className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-100 mb-2">
                      {lang === 'fr' ? right.titleFr : right.titleEn}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {lang === 'fr' ? right.descFr : right.descEn}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-amber-100 mb-6">
            {lang === 'fr' ? 'Exercer vos droits' : 'Exercise Your Rights'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t.form.type}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="access">
                  {lang === 'fr' ? "Droit d'accès" : 'Right of Access'}
                </option>
                <option value="rectification">
                  {lang === 'fr' ? 'Droit de rectification' : 'Right of Rectification'}
                </option>
                <option value="deletion">
                  {lang === 'fr' ? "Droit à l'oubli" : 'Right to Erasure'}
                </option>
                <option value="objection">
                  {lang === 'fr' ? "Droit d'opposition" : 'Right of Objection'}
                </option>
                <option value="portability">
                  {lang === 'fr' ? 'Droit à la portabilité' : 'Right to Data Portability'}
                </option>
                <option value="restriction">
                  {lang === 'fr' ? 'Droit à la limitation' : 'Right to Restriction'}
                </option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t.form.message}
              </label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t.form.placeholder}
                minLength={10}
                maxLength={2000}
                className="bg-slate-700/50 border-slate-600 text-white h-32"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                {formData.message.length}/2000
              </p>
            </div>

            {/* Info */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-100">{t.info}</p>
            </div>

            {/* Feedback */}
            {submitSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-200">{submitSuccess}</p>
              </div>
            )}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || !user}
              className="w-full bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 disabled:opacity-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              {submitting ? t.form.submitting : t.form.submit}
            </Button>
          </form>
        </div>

        {/* Login Required */}
        {!user && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
            <p className="text-red-200">
              {lang === 'fr'
                ? 'Veuillez vous connecter pour exercer vos droits'
                : 'Please log in to exercise your rights'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}