import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Inbox, Send as SendIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceivedIntentionCard from '@/components/intentions/ReceivedIntentionCard';
import SentIntentionCard from '@/components/intentions/SentIntentionCard';
import { trackIntentionRefusal } from '@/components/helpers/quotaManager';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function AppIntentions() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [receivedIntentions, setReceivedIntentions] = useState([]);
  const [sentIntentions, setSentIntentions] = useState([]);
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    checkAccess();
  }, []);

  const [error, setError] = useState(null);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const userProfiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1);
      if (userProfiles.length === 0) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
      }
      setProfile(userProfiles[0]);
      setLang(userProfiles[0].language_pref || 'fr');
      await loadIntentions(currentUser.email);
    } catch (err) {
      console.error('Error loading intentions access:', err);
      setLoading(false);
      setError(lang === 'fr'
        ? 'Impossible de charger vos intentions. Réessayez dans un instant.'
        : 'Unable to load your intentions. Please try again.');
    }
  };

  const loadIntentions = async (userId) => {
    try {
      // Load received and sent intentions (LIMIT 50 most recent)
      const [received, sent] = await Promise.all([
        base44.entities.Intention.filter({ to_user_id: userId }, '-created_date', 50).catch(() => []),
        base44.entities.Intention.filter({ from_user_id: userId }, '-created_date', 50).catch(() => [])
      ]);

      setReceivedIntentions(received);
      setSentIntentions(sent);

      // Load only PUBLIC profiles (ProfilePublic via AccountPrivate) — never UserProfile which has sensitive data
      const allUserEmails = [
        ...received.map(i => i.from_user_id),
        ...sent.map(i => i.to_user_id)
      ];
      const uniqueEmails = [...new Set(allUserEmails)];
      
      // Use backend function to resolve profiles (no cross-user AccountPrivate access)
      try {
        const result = await base44.functions.invoke('resolve_public_profile', {
          emails: uniqueEmails
        });

        if (result?.data?.profiles) {
          // Convert { email: { publicId, displayName, photoUrl } } to { email: ProfilePublic-like }
          const profileMap = Object.entries(result.data.profiles).reduce((acc, [email, profile]) => {
            acc[email] = {
              public_id: profile.publicId,
              display_name: profile.displayName,
              photo_url: profile.photoUrl
            };
            return acc;
          }, {});
          setProfiles(profileMap);
        }
      } catch (err) {
        console.error('[AppIntentions] Error resolving profiles:', err);
        // Non-blocking: empty profiles is fine
      }
    } catch (error) {
      console.error('[AppIntentions] Error loading intentions:', error);
      // Non-blocking: empty arrays will display empty state
    }
  };

  const [acceptingId, setAcceptingId] = useState(null);
  const [refusingId, setRefusingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleAccept = async (intention, senderProfile) => {
    if (acceptingId || !intention || !intention.id) return;
    setAcceptingId(intention.id);
    setActionError('');
    try {
      await base44.entities.Intention.update(intention.id, {
        status: 'accepted',
        responded_at: new Date().toISOString()
      });

      const { openConversationSecure } = await import('@/components/helpers/messageWorkflow');
      const result = await openConversationSecure(intention.from_user_id);
      
      if (!result.success) {
        setActionError(lang === 'fr'
          ? 'Impossible d\'ouvrir la conversation : ' + result.error
          : 'Could not open conversation: ' + result.error);
        return;
      }

      setReceivedIntentions(prev => 
        prev.map(i => i.id === intention.id ? { ...i, status: 'accepted' } : i)
      );

      setTimeout(() => {
        window.location.href = createPageUrl('Chat') + `?conversation=${result.conversationId}`;
      }, 800);
    } catch (err) {
      setActionError(lang === 'fr'
        ? 'Une erreur s\'est produite. Réessayez.'
        : 'An error occurred. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRefuse = async (intention) => {
    if (refusingId || !intention || !intention.id) return;
    setRefusingId(intention.id);
    setActionError('');
    try {
      await base44.entities.Intention.update(intention.id, {
        status: 'refused',
        responded_at: new Date().toISOString()
      });

      await trackIntentionRefusal(intention.from_user_id);

      setReceivedIntentions(prev => 
        prev.map(i => i.id === intention.id ? { ...i, status: 'refused' } : i)
      );
    } catch (err) {
      setActionError(lang === 'fr'
        ? 'Une erreur s\'est produite. Réessayez.'
        : 'An error occurred. Please try again.');
    } finally {
      setRefusingId(null);
    }
  };

  const content = {
    fr: {
      title: "Intentions",
      subtitle: "Gérez vos connexions",
      received: "Reçues",
      sent: "Envoyées",
      noReceived: "Aucune intention reçue",
      noSent: "Aucune intention envoyée"
    },
    en: {
      title: "Intentions",
      subtitle: "Manage your connections",
      received: "Received",
      sent: "Sent",
      noReceived: "No intentions received",
      noSent: "No intentions sent"
    }
  };

  const t = content[lang];

  if (loading) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </SubscriptionGuard>
    );
  }

  if (error) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-amber-300 underline text-sm">
              {lang === 'fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <MessageCircle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm">{t.title}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-slate-400">{t.subtitle}</p>
        </div>

        {/* Action error */}
        {actionError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300 text-center">
            {actionError}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-amber-500/10 mb-8">
            <TabsTrigger value="received" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-100">
              <Inbox className="w-4 h-4 mr-2" />
              {t.received} {receivedIntentions.length > 0 && `(${receivedIntentions.length})`}
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-100">
              <SendIcon className="w-4 h-4 mr-2" />
              {t.sent} {sentIntentions.length > 0 && `(${sentIntentions.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Received */}
          <TabsContent value="received" className="space-y-4">
            {receivedIntentions.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">{t.noReceived}</p>
              </div>
            ) : (
              receivedIntentions.map(intention => (
                <ReceivedIntentionCard
                  key={intention.id}
                  intention={intention}
                  senderProfile={profiles[intention.from_user_id]}
                  onAccept={handleAccept}
                  onRefuse={handleRefuse}
                  lang={lang}
                />
              ))
            )}
          </TabsContent>

          {/* Sent */}
          <TabsContent value="sent" className="space-y-4">
            {sentIntentions.length === 0 ? (
              <div className="text-center py-16">
                <SendIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">{t.noSent}</p>
              </div>
            ) : (
              sentIntentions.map(intention => (
                <SentIntentionCard
                  key={intention.id}
                  intention={intention}
                  recipientProfile={profiles[intention.to_user_id]}
                  lang={lang}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </SubscriptionGuard>
  );
}