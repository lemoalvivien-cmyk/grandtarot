import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Users, Briefcase, Check, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReceivedIntentionCard({ intention, senderProfile, onAccept, onRefuse, lang }) {
  const [accepting, setAccepting] = useState(false);
  const [refusing, setRefusing] = useState(false);

  const modeIcons = {
    love: Heart,
    friendship: Users,
    professional: Briefcase
  };
  const ModeIcon = modeIcons[intention.mode] || Heart;

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(intention, senderProfile);
    setAccepting(false);
  };

  const handleRefuse = async () => {
    setRefusing(true);
    await onRefuse(intention);
    setRefusing(false);
  };

  const getStatusBadge = () => {
    if (intention.status === 'accepted') {
      return (
        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 text-xs rounded-full flex items-center gap-1">
          <Check className="w-3 h-3" />
          {lang === 'fr' ? 'Acceptée' : 'Accepted'}
        </span>
      );
    }
    if (intention.status === 'refused') {
      return (
        <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-full flex items-center gap-1">
          <X className="w-3 h-3" />
          {lang === 'fr' ? 'Refusée' : 'Refused'}
        </span>
      );
    }
    if (intention.status === 'expired') {
      return (
        <span className="px-3 py-1 bg-slate-500/20 border border-slate-500/30 text-slate-300 text-xs rounded-full">
          {lang === 'fr' ? 'Expirée' : 'Expired'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs rounded-full flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {lang === 'fr' ? 'En attente' : 'Pending'}
      </span>
    );
  };

  const age = senderProfile?.birth_year ? new Date().getFullYear() - senderProfile.birth_year : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-pink-500/10 rounded-2xl blur-xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
        <div className="flex gap-4">
          {/* Photo */}
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-500/20 flex-shrink-0">
            {senderProfile?.photo_url ? (
              <img 
                src={senderProfile.photo_url} 
                alt={senderProfile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <ModeIcon className="w-6 h-6 text-amber-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-amber-100">{senderProfile?.display_name || 'Unknown'}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {age && <span>{age} {lang === 'fr' ? 'ans' : 'years'}</span>}
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <ModeIcon className="w-3 h-3" />
                    <span className="capitalize">{intention.mode}</span>
                  </div>
                </div>
              </div>
              {getStatusBadge()}
            </div>

            {/* Message */}
            <div className="bg-slate-800/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-300 leading-relaxed">{intention.message}</p>
            </div>

            {/* Time */}
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'fr' ? 'Reçue' : 'Received'} {new Date(intention.created_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Actions */}
            {intention.status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  onClick={handleRefuse}
                  disabled={refusing || accepting}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Refuser' : 'Refuse'}
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={accepting || refusing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Accepter' : 'Accept'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}