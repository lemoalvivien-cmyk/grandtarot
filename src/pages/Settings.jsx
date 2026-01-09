import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Heart, Users, Briefcase, Globe, Eye, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Settings() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    mode: 'amour',
    bio_fr: '',
    bio_en: '',
    is_visible: true,
    language: 'fr'
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      if (profiles.length === 0 || !profiles[0].is_subscribed) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language || 'fr');
      setFormData({
        display_name: profiles[0].display_name || '',
        mode: profiles[0].mode || 'amour',
        bio_fr: profiles[0].bio_fr || '',
        bio_en: profiles[0].bio_en || '',
        is_visible: profiles[0].is_visible !== false,
        language: profiles[0].language || 'fr'
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
      await base44.entities.UserProfile.update(profile.id, formData);
      setLang(formData.language);
      alert(lang === 'fr' ? 'Paramètres sauvegardés' : 'Settings saved');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Landing'));
  };

  const content = {
    fr: {
      title: "Paramètres",
      profile: "Profil",
      name: "Nom affiché",
      mode: "Mode actif",
      modes: {
        amour: { icon: Heart, label: "Amour", desc: "Trouvez votre âme sœur" },
        amitie: { icon: Users, label: "Amitié", desc: "Rencontrez des esprits connectés" },
        pro: { icon: Briefcase, label: "Pro", desc: "Réseautage pour dirigeants" }
      },
      bio: "Bio (FR)",
      bioEn: "Bio (EN)",
      visibility: "Visibilité",
      visibleDesc: "Apparaître dans les affinités",
      language: "Langue",
      save: "Sauvegarder",
      logout: "Déconnexion",
      admin: "Administration",
      back: "Retour"
    },
    en: {
      title: "Settings",
      profile: "Profile",
      name: "Display name",
      mode: "Active mode",
      modes: {
        amour: { icon: Heart, label: "Love", desc: "Find your soulmate" },
        amitie: { icon: Users, label: "Friendship", desc: "Meet connected spirits" },
        pro: { icon: Briefcase, label: "Pro", desc: "Networking for leaders" }
      },
      bio: "Bio (FR)",
      bioEn: "Bio (EN)",
      visibility: "Visibility",
      visibleDesc: "Appear in affinities",
      language: "Language",
      save: "Save",
      logout: "Logout",
      admin: "Administration",
      back: "Back"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-serif font-bold mb-8">{t.title}</h1>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="text-sm text-purple-300 mb-2 block">{t.name}</label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="text-sm text-purple-300 mb-2 block">{t.mode}</label>
            <div className="space-y-2">
              {Object.entries(t.modes).map(([key, mode]) => (
                <button
                  key={key}
                  onClick={() => setFormData(prev => ({ ...prev, mode: key }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    formData.mode === key 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <mode.icon className="w-6 h-6 text-purple-400" />
                  <div className="text-left">
                    <p className="font-medium">{mode.label}</p>
                    <p className="text-xs text-purple-200/60">{mode.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bio FR */}
          <div>
            <label className="text-sm text-purple-300 mb-2 block">{t.bio}</label>
            <Textarea
              value={formData.bio_fr}
              onChange={(e) => setFormData(prev => ({ ...prev, bio_fr: e.target.value }))}
              className="bg-white/5 border-white/10 text-white min-h-24"
            />
          </div>

          {/* Bio EN */}
          <div>
            <label className="text-sm text-purple-300 mb-2 block">{t.bioEn}</label>
            <Textarea
              value={formData.bio_en}
              onChange={(e) => setFormData(prev => ({ ...prev, bio_en: e.target.value }))}
              className="bg-white/5 border-white/10 text-white min-h-24"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-medium">{t.visibility}</p>
                <p className="text-xs text-purple-200/60">{t.visibleDesc}</p>
              </div>
            </div>
            <Switch
              checked={formData.is_visible}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
            />
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-purple-400" />
              <p className="font-medium">{t.language}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData(prev => ({ ...prev, language: 'fr' }))}
                className={`px-4 py-2 rounded-lg ${formData.language === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}
              >
                FR
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, language: 'en' }))}
                className={`px-4 py-2 rounded-lg ${formData.language === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Save */}
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-amber-600 py-6"
          >
            {saving ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              t.save
            )}
          </Button>

          {/* Admin Link */}
          {user?.role === 'admin' && (
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <Shield className="w-5 h-5 mr-2" />
                {t.admin}
              </Button>
            </Link>
          )}

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t.logout}
          </Button>
        </div>
      </div>
    </div>
  );
}