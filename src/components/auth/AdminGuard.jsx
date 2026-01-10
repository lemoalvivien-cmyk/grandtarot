import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * AdminGuard - Protection pour pages admin
 * Vérifie que l'utilisateur a le rôle admin/moderator
 * Si non autorisé: redirection + message d'erreur
 */
export default function AdminGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        setError('Non authentifié');
        setTimeout(() => {
          window.location.href = createPageUrl('Landing');
        }, 2000);
        return;
      }

      const user = await base44.auth.me();
      
      // Vérification stricte: seuls admin et moderator autorisés
      if (user.role !== 'admin' && user.role !== 'moderator') {
        setError('Accès interdit - Réservé aux administrateurs');
        
        // Audit log de la tentative d'accès non autorisée
        await base44.entities.AuditLog.create({
          actor_user_id: user.email,
          actor_role: user.role || 'user',
          action: 'admin_action',
          entity_name: 'AdminAccess',
          payload_summary: 'Unauthorized access attempt to admin area',
          severity: 'warning',
          status: 'failed'
        }).catch(() => {}); // Ignore si échec (l'user n'a pas accès à AuditLog)
        
        setTimeout(() => {
          window.location.href = createPageUrl('Landing');
        }, 2000);
        return;
      }

      // Accès autorisé
      setAuthorized(true);
    } catch (error) {
      console.error('Admin guard error:', error);
      setError('Erreur de vérification');
      setTimeout(() => {
        window.location.href = createPageUrl('Landing');
      }, 2000);
    } finally {
      setChecking(false);
    }
  };

  // Chargement
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // Erreur d'accès
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-200 mb-2">Accès Interdit</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-sm text-slate-400">Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  // Accès autorisé: rendre les enfants
  if (authorized) {
    return <>{children}</>;
  }

  return null;
}