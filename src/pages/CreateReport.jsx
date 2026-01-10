import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { canCreateReport, logRateLimitViolation } from '@/components/helpers/rateLimiter';
import TurnstileWidget from '@/components/security/TurnstileWidget';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function CreateReport() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [turnstileToken, setTurnstileToken] = useState(null);

  const [formData, setFormData] = useState({
    target_user_id: '',
    reason: 'harassment',
    description: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setLang(profiles[0].language_pref || 'fr');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.target_user_id || !formData.description || formData.description.length < 10) {
      alert(lang === 'fr' ? 'Veuillez remplir tous les champs (min 10 caractères)' : 'Please fill all fields (min 10 chars)');
      return;
    }

    if (!turnstileToken) {
      alert(lang === 'fr' ? 'Veuillez valider le captcha' : 'Please validate captcha');
      return;
    }

    // RATE LIMIT: Check 10 reports/day
    const rateLimitResult = await canCreateReport(user.email);
    if (!rateLimitResult.allowed) {
      await logRateLimitViolation(user.email, 'create_report', rateLimitResult);
      alert(lang === 'fr' 
        ? `Limite atteinte: maximum 10 signalements par jour (${rateLimitResult.current}/10)` 
        : `Limit reached: maximum 10 reports per day (${rateLimitResult.current}/10)`);
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Report.create({
        reporter_user_id: user.email,
        target_user_id: formData.target_user_id,
        reason: formData.reason,
        description: formData.description.trim(),
        status: 'pending',
        severity: 'medium',
        priority: 5
      });

      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        actor_role: 'user',
        action: 'report_created',
        entity_name: 'Report',
        target_user_id: formData.target_user_id,
        payload_summary: `User reported ${formData.target_user_id} for ${formData.reason}`,
        severity: 'warning',
        status: 'success'
      });

      alert(lang === 'fr' ? 'Signalement envoyé avec succès' : 'Report submitted successfully');
      window.location.href = createPageUrl('App');
    } catch (error) {
      console.error('Error:', error);
      alert(lang === 'fr' ? 'Erreur lors du signalement' : 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const content = {
    fr: {
      title: "Signaler un problème",
      subtitle: "Aidez-nous à maintenir une communauté saine et respectueuse",
      targetUser: "Email de l'utilisateur signalé",
      reason: "Raison du signalement",
      reasons: {
        harassment: "Harcèlement",
        spam: "Spam",
        scam: "Arnaque",
        inappropriate_content: "Contenu inapproprié",
        fake_profile: "Faux profil",
        underage: "Mineur",
        violent_threats: "Menaces violentes",
        hate_speech: "Discours haineux",
        impersonation: "Usurpation d'identité",
        solicitation: "Sollicitation",
        other: "Autre"
      },
      description: "Description détaillée",
      descPlaceholder: "Expliquez ce qui s'est passé (minimum 10 caractères)...",
      submit: "Envoyer le signalement",
      cancel: "Annuler",
      warning: "Les signalements abusifs peuvent entraîner la suspension de votre compte"
    },
    en: {
      title: "Report a problem",
      subtitle: "Help us maintain a healthy and respectful community",
      targetUser: "Email of reported user",
      reason: "Report reason",
      reasons: {
        harassment: "Harassment",
        spam: "Spam",
        scam: "Scam",
        inappropriate_content: "Inappropriate content",
        fake_profile: "Fake profile",
        underage: "Underage",
        violent_threats: "Violent threats",
        hate_speech: "Hate speech",
        impersonation: "Impersonation",
        solicitation: "Solicitation",
        other: "Other"
      },
      description: "Detailed description",
      descPlaceholder: "Explain what happened (minimum 10 characters)...",
      submit: "Submit report",
      cancel: "Cancel",
      warning: "Abusive reports may result in account suspension"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-red-400" />
              <h1 className="text-3xl font-bold">{t.title}</h1>
            </div>
            <p className="text-slate-400">{t.subtitle}</p>
          </div>

          {/* Warning */}
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-orange-300 text-sm">{t.warning}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.targetUser} *</label>
              <input
                type="email"
                value={formData.target_user_id}
                onChange={(e) => setFormData(prev => ({ ...prev, target_user_id: e.target.value }))}
                className="w-full bg-slate-900/50 border border-amber-500/10 rounded-lg px-4 py-3 text-white"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.reason} *</label>
              <Select value={formData.reason} onValueChange={(v) => setFormData(prev => ({ ...prev, reason: v }))}>
                <SelectTrigger className="bg-slate-900/50 border-amber-500/10 text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-amber-500/10 text-white">
                  {Object.entries(t.reasons).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.description} *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-900/50 border-amber-500/10 text-white min-h-[150px]"
                placeholder={t.descPlaceholder}
                maxLength={2000}
                required
              />
              <p className="text-xs text-slate-500 mt-1">{formData.description.length}/2000</p>
            </div>

            {/* Turnstile */}
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
              onError={(err) => {
                console.error('Turnstile error:', err);
                setTurnstileToken(null);
              }}
              lang={lang}
            />

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => window.location.href = createPageUrl('App')}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={submitting || !turnstileToken}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  t.submit
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SubscriptionGuard>
  );
}