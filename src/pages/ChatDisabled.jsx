import React from 'react';
import { MessageCircle, Lock, Server, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function ChatDisabled() {
  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-violet-500/10 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-amber-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-amber-100 mb-4">
                Chat temporairement désactivé
              </h1>
              
              <p className="text-slate-300 mb-6 leading-relaxed">
                Le système de messagerie a été temporairement désactivé pour des raisons de sécurité. 
                Nous travaillons à l'activation d'une infrastructure backend sécurisée pour garantir 
                une protection totale contre les attaques par injection.
              </p>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-amber-200 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Pourquoi cette mesure ?
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Message.create en admin-only (anti-bypass total)</li>
                  <li>• Aucun chemin serveur privilégié disponible actuellement</li>
                  <li>• Préférence: V1 sans chat plutôt que chat contournable</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => window.location.href = createPageUrl('App')}
                  className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
                >
                  Retour à l'accueil
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}