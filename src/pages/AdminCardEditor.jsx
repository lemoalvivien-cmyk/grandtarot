import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminCardEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [card, setCard] = useState({
    name_fr: '',
    name_en: '',
    arcana: 'major',
    suit: 'none',
    number: 0,
    slug: '',
    image_url: '',
    meaning_upright_fr: '',
    meaning_upright_en: '',
    meaning_reversed_fr: '',
    meaning_reversed_en: '',
    keywords_fr: [],
    keywords_en: [],
    love_meaning_fr: '',
    love_meaning_en: '',
    career_meaning_fr: '',
    career_meaning_en: '',
    friendship_meaning_fr: '',
    friendship_meaning_en: ''
  });
  const [isEdit, setIsEdit] = useState(false);
  const [keywordInputFr, setKeywordInputFr] = useState('');
  const [keywordInputEn, setKeywordInputEn] = useState('');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const cardId = params.get('id');

      if (cardId) {
        const cards = await base44.entities.TarotCard.filter({ id: cardId });
        if (cards.length > 0) {
          setCard(cards[0]);
          setIsEdit(true);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const saveCard = async () => {
    if (!card.name_fr || !card.name_en) {
      alert('Nom FR et EN requis');
      return;
    }

    setSaving(true);
    try {
      const cardData = {
        ...card,
        slug: card.slug || generateSlug(card.name_en)
      };

      if (isEdit) {
        await base44.entities.TarotCard.update(card.id, cardData);
      } else {
        await base44.entities.TarotCard.create(cardData);
      }

      window.location.href = createPageUrl('AdminContent');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async () => {
    if (!window.confirm('Supprimer cette carte ?')) return;

    try {
      await base44.entities.TarotCard.delete(card.id);
      window.location.href = createPageUrl('AdminContent');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addKeyword = (lang) => {
    const input = lang === 'fr' ? keywordInputFr : keywordInputEn;
    if (!input.trim()) return;

    const field = lang === 'fr' ? 'keywords_fr' : 'keywords_en';
    setCard(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), input.trim()]
    }));

    if (lang === 'fr') setKeywordInputFr('');
    else setKeywordInputEn('');
  };

  const removeKeyword = (lang, index) => {
    const field = lang === 'fr' ? 'keywords_fr' : 'keywords_en';
    setCard(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminContent')} className="text-purple-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">
              {isEdit ? 'Modifier la carte' : 'Nouvelle carte'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isEdit && (
              <Button onClick={deleteCard} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button onClick={saveCard} disabled={saving} className="bg-green-600 hover:bg-green-500">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-purple-300 mb-2 block">Nom (FR) *</label>
                <Input
                  value={card.name_fr}
                  onChange={(e) => setCard(prev => ({ ...prev, name_fr: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-purple-300 mb-2 block">Name (EN) *</label>
                <Input
                  value={card.name_en}
                  onChange={(e) => setCard(prev => ({ ...prev, name_en: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-purple-300 mb-2 block">Arcane</label>
                <Select value={card.arcana} onValueChange={(v) => setCard(prev => ({ ...prev, arcana: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="major">Majeur</SelectItem>
                    <SelectItem value="minor">Mineur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-purple-300 mb-2 block">Couleur</label>
                <Select value={card.suit} onValueChange={(v) => setCard(prev => ({ ...prev, suit: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="wands">Bâtons</SelectItem>
                    <SelectItem value="cups">Coupes</SelectItem>
                    <SelectItem value="swords">Épées</SelectItem>
                    <SelectItem value="pentacles">Deniers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-purple-300 mb-2 block">Numéro</label>
                <Input
                  type="number"
                  value={card.number}
                  onChange={(e) => setCard(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">URL Image</label>
              <Input
                value={card.image_url}
                onChange={(e) => setCard(prev => ({ ...prev, image_url: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="https://..."
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Mots-clés (FR)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={keywordInputFr}
                  onChange={(e) => setKeywordInputFr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword('fr')}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Ajouter..."
                />
                <Button onClick={() => addKeyword('fr')} variant="outline" size="icon" className="border-white/10">+</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {card.keywords_fr?.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-500/20 rounded text-sm flex items-center gap-1">
                    {kw}
                    <button onClick={() => removeKeyword('fr', i)} className="text-purple-300 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">Keywords (EN)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={keywordInputEn}
                  onChange={(e) => setKeywordInputEn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword('en')}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Add..."
                />
                <Button onClick={() => addKeyword('en')} variant="outline" size="icon" className="border-white/10">+</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {card.keywords_en?.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-500/20 rounded text-sm flex items-center gap-1">
                    {kw}
                    <button onClick={() => removeKeyword('en', i)} className="text-purple-300 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Meanings */}
          <div className="space-y-6">
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Signification à l'endroit (FR)</label>
              <Textarea
                value={card.meaning_upright_fr}
                onChange={(e) => setCard(prev => ({ ...prev, meaning_upright_fr: e.target.value }))}
                className="bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Upright meaning (EN)</label>
              <Textarea
                value={card.meaning_upright_en}
                onChange={(e) => setCard(prev => ({ ...prev, meaning_upright_en: e.target.value }))}
                className="bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Signification renversée (FR)</label>
              <Textarea
                value={card.meaning_reversed_fr}
                onChange={(e) => setCard(prev => ({ ...prev, meaning_reversed_fr: e.target.value }))}
                className="bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Reversed meaning (EN)</label>
              <Textarea
                value={card.meaning_reversed_en}
                onChange={(e) => setCard(prev => ({ ...prev, meaning_reversed_en: e.target.value }))}
                className="bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}