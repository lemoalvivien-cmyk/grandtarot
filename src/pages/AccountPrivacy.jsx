import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, AlertTriangle, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function AccountPrivacy() {
  const [lang, setLang] = useState('fr');
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;

      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      if (!user) {
        alert(lang === 'fr' ? 'Erreur utilisateur' : 'User error');
        return;
      }

      // RGPD EXPORT: Fetch user's own data ONLY (NEVER other users' content)
      const [profile, profilePublic, account, billingReqs, consent, messages] = await Promise.all([
        base44.entities.UserProfile.filter({ user_id: user.email }, null, 1),
        base44.entities.ProfilePublic.filter({ user_id: user.email }, null, 1),
        base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1),
        base44.entities.BillingRequest.filter({ requester_user_email: user.email }, null, 50),
        base44.entities.ConsentPreference.filter({ user_id: user.email }, null, 10),
        base44.entities.Message.filter({ from_user_id: user.email }, '-created_date', 100)
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_email: user.email,
        data: {
          user_profile: profile.length > 0 ? profile[0] : null,
          profile_public: profilePublic.length > 0 ? profilePublic[0] : null,
          account_private: account.length > 0 ? account[0] : null,
          billing_requests: billingReqs,
          consent_preferences: consent,
          messages_sent: messages.slice(0, 50) // LIMIT 50 most recent
        },
        note: lang === 'fr' 
          ? "Export RGPD — Uniquement vos données, sans contenu des autres utilisateurs."
          : "GDPR Export — Only your data, without content from other users."
      };

      setData(exportData);
    } catch (error) {
      console.error('Error exporting:', error);
      alert(lang === 'fr' ? 'Erreur lors de l\'export' : 'Error exporting data');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!data) return;

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grandtarot-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJSON = () => {
    if (!data) return;

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert(lang === 'fr' ? 'Données copiées' : 'Data copied');
  };

  const handleRequestDeletion = async () => {
    setDeleteSubmitting(true);

    try {
      if (!user) return;

      await base44.entities.DsarRequest.create({
        requester_user_id: user.email,
        type: 'deletion',
        message:
          lang === 'fr'
            ? 'Je demande la suppression complète de mon compte et toutes mes données personnelles.'
            : 'I request complete deletion of my account and all personal data.'
      });

      alert(
        lang === 'fr'
          ? 'Demande de suppression soumise. Un admin confirmera sous 30 jours.'
          : 'Deletion request submitted. An admin will confirm within 30 days.'
      );

      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error:', error);
      alert(lang === 'fr' ? 'Erreur lors de la soumission' : 'Error submitting request');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const content = {
    fr: {
      title: 'Confidentialité du compte',
      subtitle: 'Gérez vos données personnelles',
      export: {
        title: 'Exporter mes données',
        desc: 'Téléchargez une copie complète de vos données personnelles (profil, compte, messages envoyés). Export conforme RGPD.',
        btn: 'Exporter',
        note: 'Export RGPD — Uniquement vos données, sans contenu des autres utilisateurs.'
      },
      delete: {
        title: 'Supprimer mon compte',
        desc: 'Demandez la suppression complète de votre compte et toutes vos données.',
        btn: 'Demander la suppression',
        confirm: 'Êtes-vous certain ? Cette action entraînera la suppression définitive de votre compte.',
        cancel: 'Annuler',
        submit: 'Confirmer la suppression'
      }
    },
    en: {
      title: 'Account Privacy',
      subtitle: 'Manage your personal data',
      export: {
        title: 'Export My Data',
        desc: 'Download a complete copy of your personal data (profile, account, sent messages). GDPR compliant export.',
        btn: 'Export',
        note: 'GDPR Export — Only your data, without content from other users.'
      },
      delete: {
        title: 'Delete My Account',
        desc: 'Request complete deletion of your account and all your data.',
        btn: 'Request Deletion',
        confirm: 'Are you sure? This action will result in permanent deletion of your account.',
        cancel: 'Cancel',
        submit: 'Confirm Deletion'
      }
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-slate-300 mb-8">{t.subtitle}</p>

          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setLang('fr')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                lang === 'fr'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                lang === 'en'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700'
              }`}
            >
              EN
            </button>
          </div>

          {/* Export Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-100 mb-4">{t.export.title}</h2>
            <p className="text-slate-300 mb-6">{t.export.desc}</p>

            {!data ? (
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? (lang === 'fr' ? 'Export...' : 'Exporting...') : t.export.btn}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
                <p className="text-xs text-green-400 flex items-center gap-2">
                  ✅ {t.export.note}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopyJSON}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {lang === 'fr' ? 'Copier' : 'Copy'}
                  </Button>
                  <Button
                    onClick={handleDownloadJSON}
                    className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {lang === 'fr' ? 'Télécharger JSON' : 'Download JSON'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Section */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-red-200 mb-4">{t.delete.title}</h2>
            <p className="text-slate-300 mb-6">{t.delete.desc}</p>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.delete.btn}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-100">{t.delete.confirm}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    {t.delete.cancel}
                  </Button>
                  <Button
                    onClick={handleRequestDeletion}
                    disabled={deleteSubmitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteSubmitting ? (lang === 'fr' ? 'En cours...' : 'Submitting...') : t.delete.submit}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}