import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Shield, ExternalLink, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminStripeConfig() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadData = async () => {
    try {
      await loadSettings();
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
    }
  };

  const loadSettings = async () => {
    try {
      const allSettings = await base44.entities.AppSettings.list();
      const settingsMap = {};
      allSettings.forEach(s => {
        settingsMap[s.setting_key] = s;
      });
      setSettings(settingsMap);

      // Check if Stripe is enabled via Base44
      setStripeEnabled(!!window.base44?.payments);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    setSaving(true);
    try {
      const existing = settings[key];
      if (existing) {
        await base44.entities.AppSettings.update(existing.id, { value_string: value });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: key,
          value_string: value,
          category: 'payment',
          description_fr: `Configuration ${key}`,
          description_en: `${key} configuration`
        });
      }
      await loadSettings();
      toast.success('Paramètre sauvegardé');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  const successUrl = `${window.location.origin}${createPageUrl('SubscribeSuccess')}`;
  const cancelUrl = `${window.location.origin}${createPageUrl('SubscribeCancel')}`;

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <span className="font-semibold text-lg">Configuration Stripe</span>
          </div>
          <Button onClick={() => window.location.href = createPageUrl('AdminDashboard')} variant="outline" className="border-amber-500/20">
            Retour Admin
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Status */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {stripeEnabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Stripe Activé via Base44</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-orange-400" />
                  <span>Stripe non activé (fallback Payment Link actif)</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stripeEnabled ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  ✅ Les paiements natifs Base44 sont activés. Les webhooks et la gestion des abonnements sont automatiques.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-200 mb-2">
                    📋 Pour configurer votre abonnement mensuel 6.90€:
                  </p>
                  <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Allez dans Base44 Dashboard → Payments</li>
                    <li>Créez un produit "GRANDTAROT Premium"</li>
                    <li>Ajoutez un prix récurrent: 6.90€/mois</li>
                    <li>Copiez le Price ID et configurez-le dans le code</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  ⚠️ Stripe n'est pas encore activé via Base44. L'app utilise le Payment Link en fallback.
                </p>
                <Button 
                  onClick={() => window.open('https://app.base44.com/settings/payments', '_blank')}
                  className="bg-gradient-to-r from-amber-500 to-violet-600"
                >
                  Activer Stripe dans Base44
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Link Configuration */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Configuration Payment Link (Fallback)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Stripe Payment Link URL</label>
              <div className="flex gap-2">
                <Input
                  value={settings.stripe_payment_link_url?.value_string || 'https://buy.stripe.com/28E3cv4bZfue4Sh6YR28800'}
                  onChange={(e) => {
                    const newSettings = { ...settings };
                    if (newSettings.stripe_payment_link_url) {
                      newSettings.stripe_payment_link_url.value_string = e.target.value;
                    }
                    setSettings(newSettings);
                  }}
                  className="flex-1 bg-slate-900/50 border-amber-500/10 text-white"
                  placeholder="https://buy.stripe.com/..."
                />
                <Button 
                  onClick={() => updateSetting('stripe_payment_link_url', settings.stripe_payment_link_url?.value_string)}
                  disabled={saving}
                  className="bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                URL du Stripe Payment Link pour l'abonnement 6.90€/mois
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-amber-200 mb-2">URLs de redirection à configurer dans Stripe:</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-500">Success URL:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-slate-800 px-3 py-2 rounded text-green-400">
                      {successUrl}
                    </code>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(successUrl)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Cancel URL:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-slate-800 px-3 py-2 rounded text-orange-400">
                      {cancelUrl}
                    </code>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cancelUrl)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div>
              <p className="font-medium text-amber-200 mb-1">Test paiement:</p>
              <ul className="text-xs space-y-1 list-disc list-inside text-slate-400">
                <li>Créez un compte test</li>
                <li>Accédez à /subscribe</li>
                <li>Effectuez le paiement (sandbox Stripe)</li>
                <li>Vérifiez redirection vers /subscribe/success</li>
                <li>Vérifiez subscription_status = "active"</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-amber-200 mb-1">Simuler past_due:</p>
              <ul className="text-xs space-y-1 list-disc list-inside text-slate-400">
                <li>Allez dans AdminSubscriptionManager</li>
                <li>Changez manuellement le status d'un user à "past_due"</li>
                <li>Connectez-vous avec ce user</li>
                <li>Vérifiez qu'il est redirigé vers /subscribe</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminGuard>
  );
}