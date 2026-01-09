import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Upload, Download, AlertCircle, CheckCircle, Loader2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminTarotImport() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
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
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
    }
  };

  const downloadTemplate = () => {
    const template = `slug,name_fr,name_en,arcana_type,suit,number,keywords_fr,keywords_en,meaning_upright_fr,meaning_upright_en,meaning_reversed_fr,meaning_reversed_en,love_meaning_fr,love_meaning_en,career_meaning_fr,career_meaning_en,friendship_meaning_fr,friendship_meaning_en,themes,image_url
the-fool,Le Mat,The Fool,major,none,0,"nouveaux départs,innocence,spontanéité","new beginnings,innocence,spontaneity","Le Mat représente le début d'un voyage...","The Fool represents the beginning of a journey...","Imprudence, prise de risque excessive...","Recklessness, excessive risk-taking...","Ouverture à une nouvelle relation...","Openness to a new relationship...","Changement de carrière audacieux...","Bold career change...","Nouvelles amitiés spontanées...","Spontaneous new friendships...","love,personal_growth,opportunities",https://images.unsplash.com/photo-1518562923427-c8fded4e6ef2
`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tarot_cards_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV vide ou invalide');
      }

      const headers = lines[0].split(',');
      const cards = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;

        const card = {};
        headers.forEach((header, idx) => {
          const value = values[idx]?.trim();
          
          // Parse arrays for keywords and themes
          if (header === 'keywords_fr' || header === 'keywords_en') {
            card[header] = value ? value.replace(/['"]/g, '').split(';').map(s => s.trim()) : [];
          } else if (header === 'themes') {
            card[header] = value ? value.replace(/['"]/g, '').split(';').map(s => s.trim()) : [];
          } else if (header === 'number') {
            card[header] = parseInt(value) || 0;
          } else {
            card[header] = value || '';
          }
        });

        cards.push(card);
      }

      // Bulk insert (or update if slug exists)
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const card of cards) {
        try {
          const existing = await base44.entities.TarotCard.filter({ slug: card.slug });
          
          if (existing.length > 0) {
            await base44.entities.TarotCard.update(existing[0].id, card);
            updated++;
          } else {
            await base44.entities.TarotCard.create(card);
            created++;
          }
        } catch (err) {
          console.error(`Error importing ${card.slug}:`, err);
          errors++;
        }
      }

      setResult({
        success: true,
        total: cards.length,
        created,
        updated,
        errors
      });

    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileUp className="w-6 h-6 text-amber-400" />
            <span className="font-semibold text-lg">Import Cartes Tarot (CSV)</span>
          </div>
          <Button onClick={() => window.location.href = createPageUrl('AdminDashboard')} variant="outline" className="border-amber-500/20">
            Retour Admin
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        {/* Instructions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Comment importer les 78 cartes ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-medium text-amber-200 mb-2">1. Téléchargez le template CSV</p>
              <p>Le fichier contient un exemple et toutes les colonnes nécessaires.</p>
            </div>
            <div>
              <p className="font-medium text-amber-200 mb-2">2. Remplissez le CSV</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Un slug unique par carte (ex: the-fool, ace-of-cups)</li>
                <li>Noms FR/EN, significations FR/EN</li>
                <li>Mots-clés séparés par ;</li>
                <li>Thèmes séparés par ;</li>
                <li>URL d'image (optionnel)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-amber-200 mb-2">3. Importez</p>
              <p>Les cartes existantes (même slug) seront mises à jour.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Download Template */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Template CSV</h3>
              <p className="text-sm text-slate-400 mb-6">
                Téléchargez le modèle avec un exemple de carte
              </p>
              <Button onClick={downloadTemplate} className="bg-blue-500/20 border border-blue-500/30 text-blue-200 hover:bg-blue-500/30">
                <Download className="w-4 h-4 mr-2" />
                Télécharger template
              </Button>
            </CardContent>
          </Card>

          {/* Upload CSV */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Importer CSV</h3>
              <p className="text-sm text-slate-400 mb-6">
                Sélectionnez votre fichier CSV rempli
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                />
                <Button disabled={importing} className="bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30">
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choisir fichier CSV
                    </>
                  )}
                </Button>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Result */}
        {result && (
          <Card className={`border ${result.success ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {result.success ? '✅ Import réussi' : '❌ Erreur d\'import'}
                  </h3>
                  {result.success ? (
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>Total traité: <strong>{result.total}</strong></p>
                      <p>Créées: <strong className="text-green-400">{result.created}</strong></p>
                      <p>Mises à jour: <strong className="text-blue-400">{result.updated}</strong></p>
                      {result.errors > 0 && (
                        <p>Erreurs: <strong className="text-red-400">{result.errors}</strong></p>
                      )}
                      <div className="mt-4">
                        <Button onClick={() => window.location.href = createPageUrl('Encyclopedia')} variant="outline" className="border-amber-500/20">
                          Voir l'encyclopédie
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-300">{result.error}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Format Reference */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Format CSV attendu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <code className="text-xs text-green-400">
                slug,name_fr,name_en,arcana_type,suit,number,keywords_fr,keywords_en,<br />
                meaning_upright_fr,meaning_upright_en,meaning_reversed_fr,meaning_reversed_en,<br />
                love_meaning_fr,love_meaning_en,career_meaning_fr,career_meaning_en,<br />
                friendship_meaning_fr,friendship_meaning_en,themes,image_url
              </code>
            </div>
            <div className="mt-4 text-sm text-slate-400 space-y-2">
              <p><strong className="text-amber-200">arcana_type:</strong> major ou minor</p>
              <p><strong className="text-amber-200">suit:</strong> none, wands, cups, swords, pentacles</p>
              <p><strong className="text-amber-200">keywords_fr/en:</strong> mot1;mot2;mot3</p>
              <p><strong className="text-amber-200">themes:</strong> love;career;personal_growth</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}