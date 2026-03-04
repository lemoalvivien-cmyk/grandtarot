import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminSubscriptionSync() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState(null);

  const syncAllSubscriptions = async () => {
    setSyncing(true);
    setResults(null);

    try {
      // SOURCE DE VÉRITÉ: AccountPrivate.plan_status (pas UserProfile.subscription_status)
      const accounts = await base44.entities.AccountPrivate.list();
      const now = new Date();
      let updated = 0;
      let errors = 0;

      for (const account of accounts) {
        try {
          // Si subscription_end est dépassée et plan_status encore 'active' → rétrograder à 'free'
          if (account.subscription_end && new Date(account.subscription_end) < now) {
            if (account.plan_status === 'active' && account.subscription_status !== 'canceled') {
              await base44.entities.AccountPrivate.update(account.id, {
                plan_status: 'free',
                subscription_status: 'past_due'
              });
              updated++;
            }
          }
        } catch (error) {
          console.error(`Error syncing account ${account.user_email}:`, error);
          errors++;
        }
      }

      setResults({
        total: accounts.length,
        updated,
        errors,
        timestamp: new Date().toISOString()
      });

      // Audit log
      const admin = await base44.auth.me();
      await base44.entities.AuditLog.create({
        actor_user_id: admin.email,
        actor_role: 'admin',
        action: 'subscription_resynced',
        entity_name: 'AccountPrivate',
        payload_summary: `Synced ${accounts.length} accounts: ${updated} updated, ${errors} errors`,
        payload_data: { total: accounts.length, updated, errors },
        severity: 'info',
        status: 'success'
      });
    } catch (error) {
      console.error('Sync error:', error);
      setResults({ error: error.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-amber-400" />
              <span className="font-semibold text-lg">Synchronisation Abonnements</span>
            </div>
            <Button onClick={() => window.location.href = createPageUrl('AdminDashboard')} variant="outline" className="border-amber-500/20">
              Retour Admin
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Info */}
          <Card className="bg-blue-500/10 border-blue-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-200 mb-2">À propos de la synchronisation</h3>
                  <ul className="text-blue-300 text-sm space-y-2">
                    <li>• Vérifie tous les profils avec abonnements actifs</li>
                    <li>• Marque "past_due" les abonnements expirés (subscription_end &lt; maintenant)</li>
                    <li>• Ne modifie PAS les statuts "canceled" ou "none"</li>
                    <li>• <strong>⚠️ LIMITATION:</strong> Pas de vérification Stripe réelle (backend requis)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Button */}
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">Synchroniser tous les abonnements</h3>
              <p className="text-slate-400 text-sm mb-6">
                Cette opération vérifie tous les profils et met à jour les statuts selon les dates d'expiration.
              </p>
              <Button
                onClick={syncAllSubscriptions}
                disabled={syncing}
                className="bg-violet-600 hover:bg-violet-700"
                size="lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Synchronisation en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Lancer la synchronisation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card className={`${results.error ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  {results.error ? (
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-3 ${results.error ? 'text-red-200' : 'text-green-200'}`}>
                      {results.error ? 'Erreur de synchronisation' : 'Synchronisation terminée'}
                    </h3>
                    
                    {results.error ? (
                      <p className="text-red-300 text-sm">{results.error}</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Total de profils vérifiés:</span>
                          <span className="font-semibold text-green-200">{results.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Statuts mis à jour:</span>
                          <span className="font-semibold text-green-200">{results.updated}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Erreurs:</span>
                          <span className={`font-semibold ${results.errors > 0 ? 'text-orange-300' : 'text-green-200'}`}>
                            {results.errors}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-green-500/20">
                          <span className="text-slate-400 text-xs">Timestamp:</span>
                          <span className="text-slate-400 text-xs">{new Date(results.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Card className="bg-orange-500/10 border-orange-500/30 mt-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-200 mb-2">Limitations actuelles</h3>
                  <div className="text-orange-300 text-sm space-y-2">
                    <p>
                      <strong>⚠️ Backend functions désactivées:</strong> Cette synchronisation ne contacte PAS Stripe.
                      Elle se base uniquement sur les dates stockées en base de données.
                    </p>
                    <p>
                      <strong>Pour une vraie synchro Stripe:</strong> Activez les backend functions et configurez les webhooks Stripe
                      (<code className="text-orange-200">subscription.updated</code>, <code className="text-orange-200">subscription.deleted</code>).
                    </p>
                    <p className="pt-2 border-t border-orange-500/20">
                      <strong>Solution temporaire:</strong> Utilisez "Gestion Abonnements" pour changer manuellement les statuts
                      des utilisateurs bloqués après vérification Stripe Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}