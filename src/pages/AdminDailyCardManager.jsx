import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles, Calendar, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDailyCardManager() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [interpretationFr, setInterpretationFr] = useState('');
  const [interpretationEn, setInterpretationEn] = useState('');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('App');
        return;
      }

      await loadCards();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      const allCards = await base44.entities.TarotCard.list();
      setCards(allCards);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const drawRandomCard = async () => {
    setDrawing(true);
    try {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      setSelectedCard(randomCard);
      
      // Pre-fill with default meanings
      setInterpretationFr(randomCard.meaning_upright_fr || '');
      setInterpretationEn(randomCard.meaning_upright_en || '');
    } catch (error) {
      console.error('Error drawing card:', error);
    } finally {
      setDrawing(false);
    }
  };

  const publishCard = async () => {
    if (!selectedCard || !interpretationFr || !interpretationEn) return;

    setSaving(true);
    try {
      // Check if already exists for this date
      const existing = await base44.entities.AdminDailyCard.filter({ publish_date: publishDate });
      
      if (existing.length > 0) {
        // Update existing
        await base44.entities.AdminDailyCard.update(existing[0].id, {
          tarot_card_id: selectedCard.id,
          interpretation_fr: interpretationFr,
          interpretation_en: interpretationEn,
          is_published: true,
          published_at: new Date().toISOString()
        });
      } else {
        // Create new
        const admin = await base44.auth.me();
        await base44.entities.AdminDailyCard.create({
          publish_date: publishDate,
          tarot_card_id: selectedCard.id,
          interpretation_fr: interpretationFr,
          interpretation_en: interpretationEn,
          is_published: true,
          published_at: new Date().toISOString(),
          created_by: admin.email
        });
      }

      // Audit log
      const adminUser = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: adminUser.email,
        actor_role: 'admin',
        action: 'card_of_day_published',
        entity_name: 'AdminDailyCard',
        entity_id: existing.length > 0 ? existing[0].id : null,
        payload_summary: `Published daily card for ${publishDate}: ${selectedCard.name_fr}`,
        payload_data: {
          card_id: selectedCard.id,
          card_name: selectedCard.name_fr,
          publish_date: publishDate
        }
      });

      alert('Carte publiée avec succès !');
      
      // Reset
      setSelectedCard(null);
      setInterpretationFr('');
      setInterpretationEn('');
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Erreur lors de la publication');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminDashboard')} className="text-amber-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-semibold">Carte du Jour</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Date Selector */}
        <div className="mb-8">
          <label className="block text-sm text-slate-400 mb-2">Date de publication</label>
          <input
            type="date"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
            className="bg-slate-900/50 border border-amber-500/10 rounded-lg px-4 py-2 text-white"
          />
        </div>

        {/* Draw Card */}
        {!selectedCard && (
          <div className="text-center py-16">
            <Button
              onClick={drawRandomCard}
              disabled={drawing}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
            >
              {drawing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Tirer une carte aléatoire
            </Button>
          </div>
        )}

        {/* Selected Card */}
        {selectedCard && (
          <div className="space-y-6">
            {/* Card Preview */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-amber-100">Carte sélectionnée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-48 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {selectedCard.image_url ? (
                      <img src={selectedCard.image_url} alt={selectedCard.name_fr} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-12 h-12 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-amber-100 mb-2">{selectedCard.name_fr}</h3>
                    <p className="text-slate-400">{selectedCard.name_en}</p>
                    <div className="flex gap-2 mt-3">
                      {selectedCard.keywords_fr?.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={drawRandomCard}
                  variant="outline"
                  className="mt-4 border-amber-500/20"
                  disabled={drawing}
                >
                  Tirer une autre carte
                </Button>
              </CardContent>
            </Card>

            {/* Interpretations */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-amber-100">Interprétations</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fr">
                  <TabsList className="bg-white/5 border border-white/10 mb-4">
                    <TabsTrigger value="fr">Français</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>

                  <TabsContent value="fr">
                    <Textarea
                      value={interpretationFr}
                      onChange={(e) => setInterpretationFr(e.target.value)}
                      placeholder="Interprétation en français (100-2000 caractères)..."
                      className="bg-slate-900/50 border-amber-500/10 text-white min-h-[200px]"
                      maxLength={2000}
                    />
                    <p className="text-xs text-slate-500 mt-2">{interpretationFr.length}/2000</p>
                  </TabsContent>

                  <TabsContent value="en">
                    <Textarea
                      value={interpretationEn}
                      onChange={(e) => setInterpretationEn(e.target.value)}
                      placeholder="English interpretation (100-2000 characters)..."
                      className="bg-slate-900/50 border-amber-500/10 text-white min-h-[200px]"
                      maxLength={2000}
                    />
                    <p className="text-xs text-slate-500 mt-2">{interpretationEn.length}/2000</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Publish */}
            <div className="flex justify-end">
              <Button
                onClick={publishCard}
                disabled={saving || interpretationFr.length < 100 || interpretationEn.length < 100}
                className="bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Publier
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}