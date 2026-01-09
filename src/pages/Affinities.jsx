import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Heart, Star, Send, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function Affinities() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [affinities, setAffinities] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showIntention, setShowIntention] = useState(false);
  const [intentionMessage, setIntentionMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkAndLoad();
  }, []);

  const checkAndLoad = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      const user = await base44.auth.me();
      const userProfiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      
      if (userProfiles.length === 0 || !userProfiles[0].is_subscribed) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      setProfile(userProfiles[0]);
      setLang(userProfiles[0].language || 'fr');

      // Load affinities for today
      const today = new Date().toISOString().split('T')[0];
      let todayAffinities = await base44.entities.Affinity.filter({
        user_id: user.email,
        affinity_date: today
      });

      // If no affinities for today, generate them
      if (todayAffinities.length === 0) {
        todayAffinities = await generateAffinities(user.email, userProfiles[0]);
      }

      setAffinities(todayAffinities);

      // Load profiles for affinities
      const targetIds = todayAffinities.map(a => a.target_user_id);
      if (targetIds.length > 0) {
        const allProfiles = await base44.entities.UserProfile.list();
        const profileMap = {};
        allProfiles.forEach(p => {
          if (targetIds.includes(p.user_id)) {
            profileMap[p.user_id] = p;
          }
        });
        setProfiles(profileMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAffinities = async (userId, userProfile) => {
    // Get all visible profiles in the same mode
    const allProfiles = await base44.entities.UserProfile.filter({
      mode: userProfile.mode,
      is_visible: true,
      is_banned: false
    });

    // Filter out current user and already blocked users
    const blocks = await base44.entities.Block.filter({ blocker_id: userId });
    const blockedIds = blocks.map(b => b.blocked_id);

    const eligibleProfiles = allProfiles.filter(p => 
      p.user_id !== userId && !blockedIds.includes(p.user_id)
    );

    // Generate up to 20 affinities with random scores
    const today = new Date().toISOString().split('T')[0];
    const shuffled = eligibleProfiles.sort(() => Math.random() - 0.5).slice(0, 20);
    
    const newAffinities = [];
    for (const target of shuffled) {
      const affinity = await base44.entities.Affinity.create({
        user_id: userId,
        target_user_id: target.user_id,
        compatibility_score: Math.floor(Math.random() * 40) + 60, // 60-100
        affinity_date: today,
        mode: userProfile.mode,
        seen: false,
        intention_sent: false
      });
      newAffinities.push(affinity);
    }

    return newAffinities;
  };

  const sendIntention = async () => {
    if (!selectedProfile || !intentionMessage.trim()) return;

    // Check daily limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    if (profile.last_intention_reset !== new Date().toISOString().split('T')[0]) {
      // Reset counter for new day
      await base44.entities.UserProfile.update(profile.id, {
        intentions_sent_today: 0,
        last_intention_reset: new Date().toISOString().split('T')[0]
      });
      profile.intentions_sent_today = 0;
    }

    if (profile.intentions_sent_today >= 5) {
      alert(lang === 'fr' 
        ? 'Vous avez atteint votre limite de 5 intentions par jour' 
        : 'You have reached your limit of 5 intentions per day');
      return;
    }

    setSending(true);
    try {
      const user = await base44.auth.me();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      await base44.entities.Intention.create({
        sender_id: user.email,
        receiver_id: selectedProfile.user_id,
        message: intentionMessage,
        status: 'pending',
        mode: profile.mode,
        expires_at: expiresAt.toISOString()
      });

      // Update affinity
      const affinity = affinities.find(a => a.target_user_id === selectedProfile.user_id);
      if (affinity) {
        await base44.entities.Affinity.update(affinity.id, { intention_sent: true });
        setAffinities(prev => prev.map(a => 
          a.id === affinity.id ? { ...a, intention_sent: true } : a
        ));
      }

      // Update profile counter
      await base44.entities.UserProfile.update(profile.id, {
        intentions_sent_today: profile.intentions_sent_today + 1
      });

      setShowIntention(false);
      setSelectedProfile(null);
      setIntentionMessage('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  const content = {
    fr: {
      title: "Vos affinités",
      subtitle: "20 profils compatibles aujourd'hui",
      compatibility: "compatibilité",
      sendIntention: "Envoyer une intention",
      intentionTitle: "Envoyer une intention",
      intentionHint: "Présentez-vous brièvement et expliquez pourquoi vous souhaitez entrer en contact",
      send: "Envoyer",
      sent: "Intention envoyée",
      back: "Retour",
      noAffinities: "Aucune affinité disponible pour le moment",
      remaining: "intentions restantes aujourd'hui"
    },
    en: {
      title: "Your affinities",
      subtitle: "20 compatible profiles today",
      compatibility: "compatibility",
      sendIntention: "Send intention",
      intentionTitle: "Send an intention",
      intentionHint: "Briefly introduce yourself and explain why you want to connect",
      send: "Send",
      sent: "Intention sent",
      back: "Back",
      noAffinities: "No affinities available at the moment",
      remaining: "intentions remaining today"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const remainingIntentions = 5 - (profile?.intentions_sent_today || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs text-purple-300/60">{remainingIntentions} {t.remaining}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-xs ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">{t.title}</h1>
          <p className="text-purple-200/60">{t.subtitle}</p>
        </div>

        {affinities.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-purple-200/60">{t.noAffinities}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {affinities.map((affinity) => {
              const targetProfile = profiles[affinity.target_user_id];
              if (!targetProfile) return null;

              return (
                <div 
                  key={affinity.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                      {targetProfile.photo_url ? (
                        <img src={targetProfile.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-semibold text-purple-400">
                          {targetProfile.display_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{targetProfile.display_name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-purple-200/60">
                          {affinity.compatibility_score}% {t.compatibility}
                        </span>
                      </div>
                    </div>
                    {affinity.intention_sent ? (
                      <span className="text-xs text-green-400 px-3 py-1 bg-green-500/10 rounded-full">
                        {t.sent}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(targetProfile);
                          setShowIntention(true);
                        }}
                        disabled={remainingIntentions <= 0}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Intention Dialog */}
      <Dialog open={showIntention} onOpenChange={setShowIntention}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{t.intentionTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProfile && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="font-semibold text-purple-400">
                    {selectedProfile.display_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{selectedProfile.display_name}</span>
              </div>
            )}
            <Textarea
              value={intentionMessage}
              onChange={(e) => setIntentionMessage(e.target.value)}
              placeholder={t.intentionHint}
              className="bg-white/5 border-white/10 text-white min-h-32"
              maxLength={500}
            />
            <p className="text-xs text-purple-300/60 text-right">{intentionMessage.length}/500</p>
            <Button
              onClick={sendIntention}
              disabled={sending || !intentionMessage.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-600"
            >
              {sending ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t.send}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}