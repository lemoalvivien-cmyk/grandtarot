import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSecurityFixtures() {
  const [loading, setLoading] = useState(true);
  const [fixtureConvId, setFixtureConvId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadFixture();
  }, []);

  const loadFixture = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'security_fixture_conversation_id'
      }, null, 1);
      
      if (settings.length > 0 && settings[0].value_string) {
        setFixtureConvId(settings[0].value_string);
        setStatus('Fixture existante chargée');
      } else {
        setStatus('Aucune fixture - Créer une nouvelle');
      }
    } catch (error) {
      console.error('Error loading fixture:', error);
      setStatus('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const createFixture = async () => {
    setCreating(true);
    setStatus('Création fixture...');
    
    try {
      const serviceClient = base44.asServiceRole || base44;
      
      // Chercher conversation fixture existante
      const existing = await serviceClient.entities.Conversation.filter({
        user_a_id: 'fixture_a@local.test',
        user_b_id: 'fixture_b@local.test'
      }, null, 1);
      
      let convId;
      
      if (existing.length > 0) {
        convId = existing[0].id;
        setStatus('Fixture existante trouvée');
      } else {
        // Créer nouvelle conversation fixture (admin-only)
        const newConv = await serviceClient.entities.Conversation.create({
          user_a_id: 'fixture_a@local.test',
          user_b_id: 'fixture_b@local.test',
          mode: 'love',
          status: 'active',
          message_count: 0
        });
        
        convId = newConv.id;
        setStatus('Nouvelle fixture créée');
      }
      
      // Store in AppSettings
      const settings = await base44.entities.AppSettings.filter({
        setting_key: 'security_fixture_conversation_id'
      }, null, 1);
      
      if (settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          value_string: convId
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'security_fixture_conversation_id',
          value_string: convId,
          category: 'system',
          description_fr: 'Conversation fixture pour tests de sécurité',
          description_en: 'Fixture conversation for security tests'
        });
      }
      
      setFixtureConvId(convId);
      setStatus(`Fixture enregistrée: ${convId}`);
    } catch (error) {
      console.error('Error creating fixture:', error);
      setStatus(`Erreur: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-violet-500" />
              <h1 className="text-3xl font-bold">Security Test Fixtures</h1>
            </div>
            <p className="text-slate-400">
              Crée une conversation fixture pour tester les erreurs 403 non-participant
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Fixture Conversation</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Conversation entre fixture_a@local.test et fixture_b@local.test
                </p>
                
                {fixtureConvId ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-medium">Fixture active</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">ID: {fixtureConvId}</p>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-300">Aucune fixture disponible</span>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={createFixture}
                  disabled={creating}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Création...
                    </>
                  ) : (
                    fixtureConvId ? 'Recréer fixture' : 'Créer fixture'
                  )}
                </Button>
              </div>
              
              {status && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-300">{status}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Utilisation</h4>
                <p className="text-xs text-slate-500">
                  Cette fixture est utilisée dans AdminBackendHealth et AdminSecuritySelftest 
                  pour tester le rejet 403 lorsqu'un utilisateur tente d'envoyer un message 
                  dans une conversation dont il n'est pas participant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}