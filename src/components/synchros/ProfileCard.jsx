import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Users, Briefcase, MapPin, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { sanitizeProfile } from '@/components/helpers/profileSanitizer';

export default function ProfileCard({ match, profile, onSendIntention, lang }) {
  // SECURITY: Sanitize profile to remove sensitive data (email, user_id)
  const safeProfile = sanitizeProfile(profile);
  
  const modeIcons = {
    love: Heart,
    friendship: Users,
    professional: Briefcase
  };
  
  const ModeIcon = modeIcons[match.mode] || Heart;
  
  const getScoreColor = (score) => {
    if (score >= 75) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-amber-400 to-orange-500';
    return 'from-slate-400 to-slate-500';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-violet-500/10 rounded-2xl blur-xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
        <div className="flex gap-6">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-xl overflow-hidden border border-amber-500/20">
              {safeProfile.photo_url ? (
                <img 
                  src={safeProfile.photo_url} 
                  alt={safeProfile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <ModeIcon className="w-8 h-8 text-amber-400" />
                </div>
              )}
            </div>
            
            {/* Score Badge */}
            <div className={`absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(match.compatibility_score)} flex items-center justify-center border-2 border-slate-900 shadow-lg`}>
              <span className="text-white font-bold text-sm">{match.compatibility_score}</span>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-xl font-semibold text-amber-100 mb-1">{safeProfile.display_name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  {safeProfile.age_range && <span>{safeProfile.age_range} {lang === 'fr' ? 'ans' : 'years'}</span>}
                  {safeProfile.city && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{safeProfile.city}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Reasons */}
            {match.reasons?.length > 0 && (
              <div className="space-y-2 mb-4">
                {match.reasons.slice(0, 3).map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">
                      {lang === 'fr' ? reason.reason_fr : reason.reason_en}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* CTA */}
            <Button
              onClick={() => onSendIntention(match, profile)}
              disabled={match.intention_sent}
              className={`w-full ${
                match.intention_sent
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500'
              }`}
            >
              {match.intention_sent ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Intention envoyée' : 'Intention sent'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Envoyer une intention' : 'Send intention'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}