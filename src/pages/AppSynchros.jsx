import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ProfileCard from '@/components/synchros/ProfileCard';
import { generateDailyMatches } from '@/components/helpers/matchingEngine';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function AppSynchros() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState({});
  const [lang, setLang] = useState('fr');
  
  // Intention modal
  const [intentionModal, setIntentionModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [intentionMessage, setIntentionMessage] = useState('');
  const [icebreakers, setIcebreakers] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');
      await loadMatches(profiles[0]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMatches = async (userProfile) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // SCALABLE: Load ONLY DailyMatch records (max 20), never list all profiles
      let dailyMatches = await base44.entities.DailyMatch.filter({
        user_id: userProfile.user_id,
        match_date: today,
        mode: userProfile.mode_active
      }, '-compatibility_score', 20); // Sorted by score desc, limit 20

      // If no matches exist, generate them (lazy loading)
      if (dailyMatches.length === 0) {
        setGenerating(true);
        dailyMatches = await generateDailyMatches(userProfile, 20);
        setGenerating(false);
      }

      setMatches(dailyMatches);

      // SCALABLE: Load ONLY the 20 matched profiles (targeted queries)
      if (dailyMatches.length > 0) {
        const profileMap = {};
        
        // Batch fetch only needed profiles (max 20 queries)
        await Promise.all(
          dailyMatches.map(async (match) => {
            const profiles = await base44.entities.UserProfile.filter({ user_id: match.matched_user_id });
            if (profiles.length > 0) {
              profileMap[match.matched_user_id] = profiles[0];
            }
          })
        );
        
        setMatchProfiles(profileMap);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendIntention = async (match, targetProfile) => {
    // Check cooldown
    if (profile.cooldown_until) {
      const cooldownEnd = new Date(profile.cooldown_until);
      if (cooldownEnd > new Date()) {
        alert(lang === 'fr' 
          ? 'Vous êtes en cooldown suite à plusieurs refus. Réessayez demain.' 
          : 'You are in cooldown after multiple refusals. Try again tomorrow.');
        return;
      }
    }

    // Check daily quota
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_intention_reset !== today) {
      // Reset counter
      await base44.entities.UserProfile.update(profile.id, {
        intentions_sent_today: 0,
        last_intention_reset: today
      });
      setProfile(prev => ({ ...prev, intentions_sent_today: 0, last_intention_reset: today }));
    } else if (profile.intentions_sent_today >= 5) {
      alert(lang === 'fr' 
        ? 'Quota atteint : 5 intentions maximum par jour.' 
        : 'Quota reached: 5 intentions maximum per day.');
      return;
    }

    // Load icebreakers
    setSelectedMatch(match);
    setSelectedProfile(targetProfile);
    setIntentionModal(true);
    
    try {
      const { generateIcebreakers } = await import('@/components/helpers/aiService');
      const sharedInterestIds = match.shared_interests || [];
      const icebreakers = await generateIcebreakers({
        targetProfile,
        mode: profile.mode_active,
        lang,
        sharedInterests: sharedInterestIds
      });
      setIcebreakers(icebreakers);
    } catch (error) {
      console.error('Error loading icebreakers:', error);
      setIcebreakers([]);
    }
  };

  const sendIntention = async () => {
    if (!intentionMessage.trim() || intentionMessage.length < 20) {
      return;
    }

    setSending(true);
    try {
      // Create intention
      await base44.entities.Intention.create({
        from_user_id: user.email,
        to_user_id: selectedMatch.matched_user_id,
        mode: profile.mode_active,
        message: intentionMessage.trim(),
        status: 'pending',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72h
      });

      // Mark match as intention sent
      await base44.entities.DailyMatch.update(selectedMatch.id, {
        intention_sent: true
      });

      // Increment user's intention counter
      await base44.entities.UserProfile.update(profile.id, {
        intentions_sent_today: (profile.intentions_sent_today || 0) + 1
      });

      // Update local state
      setMatches(prev => prev.map(m => 
        m.id === selectedMatch.id ? { ...m, intention_sent: true } : m
      ));
      setProfile(prev => ({ ...prev, intentions_sent_today: (prev.intentions_sent_today || 0) + 1 }));

      setIntentionModal(false);
      setIntentionMessage('');
      setIcebreakers([]);
      setSelectedMatch(null);
      setSelectedProfile(null);
    } catch (error) {
      console.error('Error sending intention:', error);
    } finally {
      setSending(false);
    }
  };

  const regenerateMatches = async () => {
    setGenerating(true);
    try {
      // SCALABLE: Delete only today's matches (limited query)
      const today = new Date().toISOString().split('T')[0];
      const existing = await base44.entities.DailyMatch.filter({
        user_id: profile.user_id,
        match_date: today,
        mode: profile.mode_active
      }, null, 20); // Limit 20
      
      // Batch delete
      await Promise.all(existing.map(match => base44.entities.DailyMatch.delete(match.id)));

      // Generate new matches (will store max 20)
      await loadMatches(profile);
    } catch (error) {
      console.error('Error regenerating matches:', error);
    } finally {
      setGenerating(false);
    }
  };

  const content = {
    fr: {
      title: "Vos Synchros du Jour",
      subtitle: "Affinités cosmiques personnalisées",
      generating: "Calcul des synchros...",
      noMatches: "Aucune synchro disponible aujourd'hui",
      noMatchesDesc: "Élargissez votre rayon de recherche dans les paramètres",
      regenerate: "Régénérer",
      sendIntention: "Envoyer une intention",
      intentionTitle: "Message d'intention",
      intentionPlaceholder: "Présentez-vous de manière authentique et respectueuse (20-500 caractères)...",
      cancel: "Annuler",
      send: "Envoyer",
      minChars: "Minimum 20 caractères"
    },
    en: {
      title: "Your Daily Synchros",
      subtitle: "Personalized cosmic affinities",
      generating: "Calculating synchros...",
      noMatches: "No synchros available today",
      noMatchesDesc: "Expand your search radius in settings",
      regenerate: "Regenerate",
      sendIntention: "Send intention",
      intentionTitle: "Intention message",
      intentionPlaceholder: "Introduce yourself authentically and respectfully (20-500 characters)...",
      cancel: "Cancel",
      send: "Send",
      minChars: "Minimum 20 characters"
    }
  };

  const t = content[lang];

  const modeIcons = {
    love: Heart,
    friendship: Users,
    professional: Briefcase
  };
  const ModeIcon = modeIcons[profile?.mode_active] || Heart;

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <ModeIcon className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm">
              {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-slate-400 mb-6">{t.subtitle}</p>

          {matches.length > 0 && user?.role === 'admin' && (
            <Button
              onClick={regenerateMatches}
              disabled={generating}
              variant="outline"
              className="border-amber-500/20 text-amber-200 hover:bg-amber-500/10"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {t.regenerate}
            </Button>
          )}
        </div>

        {/* Generating State */}
        {generating && matches.length === 0 && (
          <div className="text-center py-24">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-32 h-32 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full border-4 border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-amber-400 animate-pulse" />
              </div>
            </div>
            <p className="text-amber-200 text-lg animate-pulse">{t.generating}</p>
          </div>
        )}

        {/* No Matches */}
        {!generating && matches.length === 0 && (
          <div className="text-center py-24">
            <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">{t.noMatches}</h3>
            <p className="text-slate-500">{t.noMatchesDesc}</p>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((match) => {
              const matchProfile = matchProfiles[match.matched_user_id];
              if (!matchProfile) return null;
              
              return (
                <ProfileCard
                  key={match.id}
                  match={match}
                  profile={matchProfile}
                  onSendIntention={handleSendIntention}
                  lang={lang}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Intention Modal */}
      <Dialog open={intentionModal} onOpenChange={setIntentionModal}>
        <DialogContent className="bg-slate-900 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-100">{t.intentionTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedProfile && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  {selectedProfile.photo_url ? (
                    <img src={selectedProfile.photo_url} alt={selectedProfile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <ModeIcon className="w-6 h-6 text-amber-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-amber-100">{selectedProfile.display_name}</p>
                  <p className="text-xs text-slate-400">
                    {lang === 'fr' ? 'Score de compatibilité' : 'Compatibility score'}: {selectedMatch?.compatibility_score}
                  </p>
                </div>
              </div>
            )}

            {/* Icebreakers */}
            {icebreakers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">{lang === 'fr' ? 'Suggestions IA' : 'AI Suggestions'}</p>
                {icebreakers.map((ice, i) => (
                  <button
                    key={i}
                    onClick={() => setIntentionMessage(ice)}
                    className="w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-amber-500/10 hover:border-amber-500/30 rounded-lg text-sm text-slate-300 transition-all"
                  >
                    {ice}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              value={intentionMessage}
              onChange={(e) => setIntentionMessage(e.target.value)}
              placeholder={t.intentionPlaceholder}
              className="bg-slate-800/50 border-amber-500/10 text-white min-h-[150px]"
              maxLength={500}
            />
            
            <div className="flex items-center justify-between text-xs">
              <span className={`${intentionMessage.length < 20 ? 'text-red-400' : 'text-slate-500'}`}>
                {intentionMessage.length}/500 {intentionMessage.length < 20 && `(${t.minChars})`}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIntentionModal(false)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={sendIntention}
                disabled={sending || intentionMessage.length < 20}
                className="flex-1 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t.send}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </SubscriptionGuard>
  );
}