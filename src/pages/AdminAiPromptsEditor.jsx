import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Save, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminAiPromptsEditor() {
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeKey, setActiveKey] = useState('interpretation_love');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadData = async () => {
    try {
      await loadPrompts();
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
    }
  };

  const loadPrompts = async () => {
    try {
      const allPrompts = await base44.entities.AiPrompt.list();
      const promptMap = {};
      allPrompts.forEach(p => {
        promptMap[p.prompt_key] = p;
      });
      setPrompts(promptMap);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (promptKey) => {
    setSaving(true);
    try {
      const prompt = prompts[promptKey];
      if (prompt.id) {
        await base44.entities.AiPrompt.update(prompt.id, prompt);
      } else {
        const created = await base44.entities.AiPrompt.create(prompt);
        setPrompts(prev => ({
          ...prev,
          [promptKey]: created
        }));
      }
      
      // Clear AI service cache
      const { clearPromptCache } = await import('@/components/helpers/aiService');
      clearPromptCache();
      
      // Audit log
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'prompt_updated',
        entity_name: 'AiPrompt',
        entity_id: prompt.id,
        payload_summary: `Updated AI prompt: ${promptKey}`,
        payload_data: {
          prompt_key: promptKey,
          version: prompt.version
        }
      });
      
      toast.success('Prompt sauvegardé');
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updatePromptField = (promptKey, field, value) => {
    setPrompts(prev => ({
      ...prev,
      [promptKey]: {
        ...prev[promptKey],
        [field]: value
      }
    }));
  };

  const promptConfigs = [
    {
      key: 'interpretation_love',
      title: 'Interprétation Amour',
      category: 'interpretation',
      description: 'Génère des interprétations pour le mode Amour'
    },
    {
      key: 'interpretation_friendship',
      title: 'Interprétation Amitié',
      category: 'interpretation',
      description: 'Génère des interprétations pour le mode Amitié'
    },
    {
      key: 'interpretation_professional',
      title: 'Interprétation Pro',
      category: 'interpretation',
      description: 'Génère des interprétations pour le mode Professionnel'
    },
    {
      key: 'icebreaker_generator',
      title: 'Générateur Icebreakers',
      category: 'social',
      description: 'Génère 3 suggestions de messages d\'accroche'
    },
    {
      key: 'moderation_message',
      title: 'Modération Messages',
      category: 'safety',
      description: 'Détecte contenus inappropriés, scams, harcèlement'
    }
  ];

  const currentPrompt = prompts[activeKey] || {
    prompt_key: activeKey,
    system_prompt_fr: '',
    system_prompt_en: '',
    temperature: 0.7,
    max_tokens: 1000,
    response_format: 'json',
    is_active: true
  };

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="font-semibold text-lg">Éditeur Prompts IA</span>
          </div>
          <Button onClick={() => window.location.href = createPageUrl('AdminDashboard')} variant="outline" className="border-amber-500/20">
            Retour Admin
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-medium mb-1">Attention</p>
            <p>Les prompts contrôlent la génération IA. Testez bien les modifications avant de les activer en production.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Prompts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {promptConfigs.map((config) => (
                  <button
                    key={config.key}
                    onClick={() => setActiveKey(config.key)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeKey === config.key
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100'
                        : 'bg-slate-900/50 border border-white/5 text-slate-300 hover:border-amber-500/20'
                    }`}
                  >
                    <div className="text-sm font-medium">{config.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{config.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{promptConfigs.find(p => p.key === activeKey)?.title}</CardTitle>
                  <Button
                    onClick={() => savePrompt(activeKey)}
                    disabled={saving}
                    className="bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* System Prompts */}
                <Tabs defaultValue="fr">
                  <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="fr">Français</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fr" className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">System Prompt (FR)</label>
                      <Textarea
                        value={currentPrompt.system_prompt_fr || ''}
                        onChange={(e) => updatePromptField(activeKey, 'system_prompt_fr', e.target.value)}
                        className="bg-slate-900/50 border-amber-500/10 text-white min-h-[300px] font-mono text-sm"
                        placeholder="Tu es un expert en tarot qui génère des interprétations..."
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">System Prompt (EN)</label>
                      <Textarea
                        value={currentPrompt.system_prompt_en || ''}
                        onChange={(e) => updatePromptField(activeKey, 'system_prompt_en', e.target.value)}
                        className="bg-slate-900/50 border-amber-500/10 text-white min-h-[300px] font-mono text-sm"
                        placeholder="You are a tarot expert who generates interpretations..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Parameters */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Temperature</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={currentPrompt.temperature || 0.7}
                      onChange={(e) => updatePromptField(activeKey, 'temperature', parseFloat(e.target.value))}
                      className="bg-slate-900/50 border-amber-500/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Max Tokens</label>
                    <Input
                      type="number"
                      step="100"
                      min="100"
                      max="4000"
                      value={currentPrompt.max_tokens || 1000}
                      onChange={(e) => updatePromptField(activeKey, 'max_tokens', parseInt(e.target.value))}
                      className="bg-slate-900/50 border-amber-500/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Format</label>
                    <select
                      value={currentPrompt.response_format || 'json'}
                      onChange={(e) => updatePromptField(activeKey, 'response_format', e.target.value)}
                      className="w-full bg-slate-900/50 border border-amber-500/10 text-white rounded-md px-3 py-2"
                    >
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Notes internes</label>
                  <Textarea
                    value={currentPrompt.notes || ''}
                    onChange={(e) => updatePromptField(activeKey, 'notes', e.target.value)}
                    className="bg-slate-900/50 border-amber-500/10 text-white"
                    placeholder="Changements effectués, résultats observés..."
                    rows={3}
                  />
                </div>

                {/* Guidelines */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-amber-500/10">
                  <h4 className="text-sm font-medium text-amber-200 mb-2">Guidelines IA</h4>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Pas de fatalisme ni de promesse "destin"</li>
                    <li>• Aucun conseil médical ou santé</li>
                    <li>• Court, actionnable, clair</li>
                    <li>• Toujours inclure une note de sécurité</li>
                    <li>• Respecter le format JSON attendu</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}