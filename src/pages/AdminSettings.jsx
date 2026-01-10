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
  const [settings, setSettings] = useState({});

  const defaultSettings = {
    // Limits
    intentions_per_day: { value: '5', category: 'limits', description: 'Max intentions par jour' },
    affinities_per_day: { value: '20', category: 'limits', description: 'Affinités générées par jour' },
    intention_expiry_hours: { value: '72', category: 'limits', description: 'Expiration intention (heures)' },
    cooldown_days: { value: '7', category: 'limits', description: 'Cooldown après refus (jours)' },
    
    // Pricing
    subscription_price: { value: '6.90', category: 'pricing', description: 'Prix abonnement mensuel (€)' },
    stripe_link: { value: 'https://buy.stripe.com/28E3cv4bZfue4Sh6YR28800', category: 'pricing', description: 'Lien Stripe Payment' },
    
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
        <Tabs defaultValue="limits">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
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