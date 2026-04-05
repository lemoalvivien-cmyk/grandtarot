import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Settings, DollarSign, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [settings, setSettings] = useState({});
  const [featureFlags, setFeatureFlags] = useState({
    feature_numerology: null,
    feature_astrology: null
  });

  const defaultSettings = {
    // Limits
    intentions_per_day: { value: '5', category: 'limits', description: 'Max intentions par jour' },
    affinities_per_day: { value: '20', category: 'limits', description: 'Affinités générées par jour' },
    intention_expiry_hours: { value: '72', category: 'limits', description: 'Expiration intention (heures)' },
    cooldown_days: { value: '7', category: 'limits', description: 'Cooldown après refus (jours)' },
    
    // Pricing
    subscription_price: { value: '6.90', category: 'pricing', description: 'Prix abonnement mensuel (€)' },
    stripe_link: { value: 'https://buy.stripe.com/eVq00jfe2gx84ktd1XcIE03', category: 'pricing', description: 'Lien Stripe Payment' },
    
    // Prompts
    reading_prompt_fr: { value: '', category: 'prompts', description: 'Prompt tirage IA (FR)', value_fr: '' },
    reading_prompt_en: { value: '', category: 'prompts', description: 'Prompt tirage IA (EN)', value_en: '' }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load existing settings
      const existingSettings = await base44.entities.AppSettings.list();
      const settingsMap = { ...defaultSettings };
      
      existingSettings.forEach(s => {
        if (settingsMap[s.key]) {
          settingsMap[s.key] = { 
            ...settingsMap[s.key], 
            ...s,
            id: s.id 
          };
        }
      });

      setSettings(settingsMap);
      
      // Load feature flags
      const [numFlag, astroFlag] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'feature_numerology' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'feature_astrology' }, null, 1)
      ]);
      
      setFeatureFlags({
        feature_numerology: numFlag.length > 0 ? numFlag[0] : null,
        feature_astrology: astroFlag.length > 0 ? astroFlag[0] : null
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, setting] of Object.entries(settings)) {
        if (setting.id) {
          // Update existing
          await base44.entities.AppSettings.update(setting.id, {
            value: setting.value,
            value_fr: setting.value_fr,
            value_en: setting.value_en
          });
        } else {
          // Create new
          await base44.entities.AppSettings.create({
            key,
            value: setting.value,
            value_fr: setting.value_fr,
            value_en: setting.value_en,
            category: setting.category,
            description: setting.description
          });
        }
      }

      // Log action
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'settings_changed',
        entity_name: 'AppSettings',
        payload_summary: `Updated ${Object.keys(settings).length} settings`,
        payload_data: { 
          updated_settings: Object.keys(settings)
        }
      });

      alert('Paramètres sauvegardés');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const initializeFeatureFlags = async () => {
    setInitializing(true);
    try {
      const admin = await base44.auth.me();
      
      // Create feature_numerology if missing
      if (!featureFlags.feature_numerology) {
        await base44.entities.AppSettings.create({
          setting_key: 'feature_numerology',
          value_boolean: true,
          category: 'features',
          description_fr: 'Activer la numérologie',
          description_en: 'Enable numerology',
          is_public: false
        });
      }
      
      // Create feature_astrology if missing
      if (!featureFlags.feature_astrology) {
        await base44.entities.AppSettings.create({
          setting_key: 'feature_astrology',
          value_boolean: true,
          category: 'features',
          description_fr: 'Activer l\'astrologie',
          description_en: 'Enable astrology',
          is_public: false
        });
      }
      
      // Log action
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'settings_changed',
        entity_name: 'AppSettings',
        payload_summary: 'Initialized feature flags (numerology, astrology)',
        severity: 'info',
        status: 'success'
      }).catch(() => {});
      
      alert('✅ Feature flags initialisés');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const toggleFeatureFlag = async (flagKey) => {
    setSaving(true);
    try {
      const flag = featureFlags[flagKey];
      if (!flag) return;
      
      await base44.entities.AppSettings.update(flag.id, {
        value_boolean: !flag.value_boolean
      });
      
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'settings_changed',
        entity_name: 'AppSettings',
        payload_summary: `Toggled ${flagKey} to ${!flag.value_boolean}`,
        severity: 'info',
        status: 'success'
      }).catch(() => {});
      
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const limitSettings = Object.entries(settings).filter(([_, s]) => s.category === 'limits');
  const pricingSettings = Object.entries(settings).filter(([_, s]) => s.category === 'pricing');
  const promptSettings = Object.entries(settings).filter(([_, s]) => s.category === 'prompts');

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminDashboard')} className="text-purple-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">Paramètres</h1>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="bg-green-600 hover:bg-green-500">
            {saving ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="features">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="features" className="data-[state=active]:bg-purple-500">
              <Settings className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="limits" className="data-[state=active]:bg-purple-500">
              <Shield className="w-4 h-4 mr-2" />
              Limites
            </TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-purple-500">
              <DollarSign className="w-4 h-4 mr-2" />
              Prix
            </TabsTrigger>
            <TabsTrigger value="prompts" className="data-[state=active]:bg-purple-500">
              <MessageSquare className="w-4 h-4 mr-2" />
              Prompts IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="features">
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Feature Flags (Global)</span>
                  {(!featureFlags.feature_numerology || !featureFlags.feature_astrology) && (
                    <Button
                      onClick={initializeFeatureFlags}
                      disabled={initializing}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {initializing ? '...' : 'Initialize Missing Flags'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Numerology Flag */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">Numérologie</h3>
                      <p className="text-xs text-slate-400">
                        {featureFlags.feature_numerology 
                          ? `Status: ${featureFlags.feature_numerology.value_boolean ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}`
                          : 'Status: NON INITIALISÉ ⚠️'}
                      </p>
                    </div>
                    {featureFlags.feature_numerology && (
                      <Button
                        onClick={() => toggleFeatureFlag('feature_numerology')}
                        disabled={saving}
                        size="sm"
                        className={featureFlags.feature_numerology.value_boolean 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'}
                      >
                        {featureFlags.feature_numerology.value_boolean ? 'Désactiver' : 'Activer'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Si désactivé: liens cachés, widgets masqués, AppNumerology affiche page fallback
                  </p>
                </div>

                {/* Astrology Flag */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">Astrologie</h3>
                      <p className="text-xs text-slate-400">
                        {featureFlags.feature_astrology 
                          ? `Status: ${featureFlags.feature_astrology.value_boolean ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}`
                          : 'Status: NON INITIALISÉ ⚠️'}
                      </p>
                    </div>
                    {featureFlags.feature_astrology && (
                      <Button
                        onClick={() => toggleFeatureFlag('feature_astrology')}
                        disabled={saving}
                        size="sm"
                        className={featureFlags.feature_astrology.value_boolean 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'}
                      >
                        {featureFlags.feature_astrology.value_boolean ? 'Désactiver' : 'Activer'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Si désactivé: liens cachés, widgets masqués, AppAstrology affiche page fallback
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Limites et quotas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {limitSettings.map(([key, setting]) => (
                  <div key={key}>
                    <label className="text-sm text-purple-300 mb-2 block">{setting.description}</label>
                    <Input
                      type="number"
                      value={setting.value}
                      onChange={(e) => updateSetting(key, 'value', e.target.value)}
                      className="bg-white/5 border-white/10 text-white max-w-xs"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Configuration tarification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingSettings.map(([key, setting]) => (
                  <div key={key}>
                    <label className="text-sm text-purple-300 mb-2 block">{setting.description}</label>
                    <Input
                      value={setting.value}
                      onChange={(e) => updateSetting(key, 'value', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Prompts IA pour les tirages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {promptSettings.map(([key, setting]) => (
                  <div key={key}>
                    <label className="text-sm text-purple-300 mb-2 block">{setting.description}</label>
                    <Textarea
                      value={key.includes('_fr') ? setting.value_fr : setting.value_en}
                      onChange={(e) => updateSetting(key, key.includes('_fr') ? 'value_fr' : 'value_en', e.target.value)}
                      className="bg-white/5 border-white/10 text-white min-h-32"
                      placeholder="Entrez le prompt personnalisé..."
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminGuard>
  );
}