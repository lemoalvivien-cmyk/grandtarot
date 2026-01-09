import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, MessageCircle, Bell, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Messages() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [pendingIntentions, setPendingIntentions] = useState([]);
  const [profiles, setProfiles] = useState({});

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

      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const userProfiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      if (userProfiles.length === 0 || !userProfiles[0].is_subscribed) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      setProfile(userProfiles[0]);
      setLang(userProfiles[0].language || 'fr');

      // Load conversations
      const allConversations = await base44.entities.Conversation.list('-last_message_at');
      const userConversations = allConversations.filter(c => 
        c.user1_id === currentUser.email || c.user2_id === currentUser.email
      );
      setConversations(userConversations);

      // Load pending intentions received
      const receivedIntentions = await base44.entities.Intention.filter({
        receiver_id: currentUser.email,
        status: 'pending'
      });
      setPendingIntentions(receivedIntentions);

      // Load all related profiles
      const userIds = new Set();
      userConversations.forEach(c => {
        userIds.add(c.user1_id);
        userIds.add(c.user2_id);
      });
      receivedIntentions.forEach(i => userIds.add(i.sender_id));
      userIds.delete(currentUser.email);

      if (userIds.size > 0) {
        const allProfiles = await base44.entities.UserProfile.list();
        const profileMap = {};
        allProfiles.forEach(p => {
          if (userIds.has(p.user_id)) {
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

  const handleIntentionResponse = async (intention, accept) => {
    try {
      await base44.entities.Intention.update(intention.id, {
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
        cooldown_until: accept ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days cooldown
      });

      if (accept) {
        // Create conversation
        await base44.entities.Conversation.create({
          user1_id: intention.sender_id,
          user2_id: intention.receiver_id,
          intention_id: intention.id,
          status: 'active',
          mode: intention.mode
        });
      }

      // Refresh data
      await checkAndLoad();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const content = {
    fr: {
      title: "Messages",
      conversations: "Conversations",
      requests: "Demandes",
      noConversations: "Aucune conversation",
      noRequests: "Aucune demande en attente",
      accept: "Accepter",
      decline: "Décliner",
      expires: "Expire dans",
      back: "Retour"
    },
    en: {
      title: "Messages",
      conversations: "Conversations",
      requests: "Requests",
      noConversations: "No conversations",
      noRequests: "No pending requests",
      accept: "Accept",
      decline: "Decline",
      expires: "Expires in",
      back: "Back"
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

  const getExpiryText = (expiresAt) => {
    const hours = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / (1000 * 60 * 60)));
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 text-purple-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-xs ${lang === 'fr' ? 'bg-purple-500' : 'bg-white/10'}`}>FR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs ${lang === 'en' ? 'bg-purple-500' : 'bg-white/10'}`}>EN</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-serif font-bold mb-6">{t.title}</h1>

        <Tabs defaultValue="conversations">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="conversations" className="flex-1 data-[state=active]:bg-purple-500">
              {t.conversations}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 data-[state=active]:bg-purple-500 relative">
              {t.requests}
              {pendingIntentions.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 p-0 flex items-center justify-center">
                  {pendingIntentions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-purple-200/60">{t.noConversations}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => {
                  const otherId = conv.user1_id === user.email ? conv.user2_id : conv.user1_id;
                  const otherProfile = profiles[otherId];
                  const unreadCount = conv.user1_id === user.email ? conv.unread_count_user1 : conv.unread_count_user2;

                  return (
                    <Link 
                      key={conv.id} 
                      to={createPageUrl('Chat') + `?id=${conv.id}`}
                      className="block"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="font-semibold text-purple-400">
                              {otherProfile?.display_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">{otherProfile?.display_name || otherId}</h3>
                            <p className="text-sm text-purple-200/60 truncate">
                              {conv.last_message_preview || (lang === 'fr' ? 'Démarrer la conversation' : 'Start conversation')}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-purple-500 text-white">{unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {pendingIntentions.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-purple-200/60">{t.noRequests}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingIntentions.map((intention) => {
                  const senderProfile = profiles[intention.sender_id];

                  return (
                    <div 
                      key={intention.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="font-semibold text-purple-400">
                            {senderProfile?.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{senderProfile?.display_name || intention.sender_id}</h3>
                          <div className="flex items-center gap-2 text-xs text-purple-300/60">
                            <Clock className="w-3 h-3" />
                            <span>{t.expires} {getExpiryText(intention.expires_at)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-purple-200/80 text-sm mb-4 p-3 bg-white/5 rounded-xl">
                        {intention.message}
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleIntentionResponse(intention, true)}
                          className="flex-1 bg-green-600 hover:bg-green-500"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {t.accept}
                        </Button>
                        <Button
                          onClick={() => handleIntentionResponse(intention, false)}
                          variant="outline"
                          className="flex-1 border-white/10 hover:bg-white/10"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t.decline}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}