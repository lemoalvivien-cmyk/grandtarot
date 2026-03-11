import React, { useEffect, useState, useRef } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Shield, Flag, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessageBubble from '@/components/chat/MessageBubble';
import { sendMessageSecure, blockUser } from '@/components/helpers/messageWorkflow';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';

export default function Chat() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('fr');
  const [conversation, setConversation] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const [pendingClientMsgId, setPendingClientMsgId] = useState(null);
  const [pendingBody, setPendingBody] = useState('');
  
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestMessageDate, setOldestMessageDate] = useState(null);
  
  const [lastSendTime, setLastSendTime] = useState(0);
  const [sendAttempts, setSendAttempts] = useState(0);
  
  const [blockModal, setBlockModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null);

  useEffect(() => {
    if (pendingClientMsgId && messageText.trim() !== pendingBody) {
      setPendingClientMsgId(null);
      setPendingBody('');
    }
  }, [messageText, pendingClientMsgId, pendingBody]);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    
    // REAL-TIME SUBSCRIPTION (remplace polling)
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      // Filter: only this conversation + not deleted
      if (event.data.conversation_id !== conversation.id) return;
      if (event.data.is_deleted) return;
      
      if (event.type === 'create') {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      } else if (event.type === 'update') {
        setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
      } else if (event.type === 'delete') {
        setMessages(prev => prev.filter(m => m.id !== event.id));
      }
    });
    
    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email }, null, 1);
      if (!profiles.length) {
        window.location.href = createPageUrl('AppOnboarding');
        return;
      }
      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');

      const params = new URLSearchParams(window.location.search);
      const conversationId = params.get('conversation');
      
      if (!conversationId) {
        window.location.href = createPageUrl('AppIntentions');
        return;
      }

      await loadConversation(conversationId, currentUser.email);
    } catch (error) {
      console.error('Error loading chat:', error);
      setLoading(false);
      setError(lang === 'fr' 
        ? 'Erreur de connexion. Veuillez réessayer.' 
        : 'Connection error. Please try again.');
    }
  };

  const loadConversation = async (conversationId, userId) => {
    try {
      const conversations = await base44.entities.Conversation.filter({ id: conversationId });
      
      if (!conversations.length) {
        window.location.href = createPageUrl('AppIntentions');
        return;
      }

      const conv = conversations[0];
      
      if (conv.user_a_id !== userId && conv.user_b_id !== userId) {
        window.location.href = createPageUrl('AppIntentions');
        return;
      }

      if (conv.status === 'blocked') {
        setError(lang === 'fr' 
          ? 'Cette conversation est bloquée.' 
          : 'This conversation is blocked.');
        setLoading(false);
        return;
      }

      setConversation(conv);

      // Fetch other user's public profile via AccountPrivate → ProfilePublic
      const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
      const otherAccts = await base44.entities.AccountPrivate.filter({ user_email: otherUserId }, null, 1);
      const otherPublicId = otherAccts[0]?.public_profile_id;
      if (otherPublicId) {
        const pubs = await base44.entities.ProfilePublic.filter({ public_id: otherPublicId }, null, 1);
        if (pubs.length > 0) {
          // Attach user_id (email) for block/report — never displayed in UI
          setOtherProfile({ ...pubs[0], user_id: otherUserId });
        }
      } else {
        // Fallback: minimal display object so chat still opens
        setOtherProfile({ display_name: 'Utilisateur', user_id: otherUserId });
      }

      await loadMessages(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError(lang === 'fr' 
        ? 'Impossible de charger la conversation. Réessayez.' 
        : 'Failed to load conversation. Try again.');
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const msgs = await base44.entities.Message.filter({ 
        conversation_id: conversationId,
        is_deleted: false 
      }, '-created_date', 50);
      
      setHasMore(msgs.length === 50);
      
      msgs.reverse();
      setMessages(msgs);
      
      if (msgs.length > 0) {
        setOldestMessageDate(msgs[0].created_date);
      }
    } catch (error) {
      console.error('[Chat] Error loading messages:', error);
      // Non-blocking: messages array stays empty
    }
  };
  

  
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !conversation?.id) return;
    
    setLoadingMore(true);
    try {
      const olderMessages = await base44.entities.Message.filter({ 
        conversation_id: conversation.id,
        is_deleted: false,
        created_date: { $lt: oldestMessageDate }
      }, '-created_date', 50);
      
      setHasMore(olderMessages.length === 50);
      
      if (olderMessages.length > 0) {
        olderMessages.reverse();
        setMessages(prev => [...olderMessages, ...prev]);
        setOldestMessageDate(olderMessages[0].created_date);
      }
    } catch (error) {
      console.error('[Chat] Error loading more messages:', error);
      setLoadingMore(false);
      // Non-blocking: stop pagination
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmed = messageText.trim();
    if (!trimmed || trimmed.length < 1) return;
    if (trimmed.length > 2000) {
      setError(lang === 'fr' ? 'Message trop long (max 2000 caractères)' : 'Message too long (max 2000 chars)');
      return;
    }
    
    if (!conversation?.id) {
      setError(lang === 'fr' ? 'Conversation invalide' : 'Invalid conversation');
      return;
    }
    
    const now = Date.now();
    if (now - lastSendTime < 1000) {
      setError(lang === 'fr' 
        ? 'Veuillez patienter 1 seconde entre chaque message' 
        : 'Please wait 1 second between messages');
      return;
    }
    
    if (sendAttempts >= 10) {
      setError(lang === 'fr' 
        ? 'Trop de messages envoyés. Attendez 1 minute.' 
        : 'Too many messages sent. Wait 1 minute.');
      setTimeout(() => setSendAttempts(0), 60000);
      return;
    }
    
    setSending(true);
    setError('');
    
    const currentBody = trimmed;
    
    const genUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    };
    
    let msgId;
    if (!pendingClientMsgId || currentBody !== pendingBody) {
      msgId = genUUID();
      setPendingClientMsgId(msgId);
      setPendingBody(currentBody);
    } else {
      msgId = pendingClientMsgId;
    }
    
    try {
      const result = await sendMessageSecure({
        conversationId: conversation.id,
        messageBody: currentBody,
        clientMsgId: msgId,
        lang
      });

      if (!result.success) {
        setError(result.error);
        setSending(false);
        return;
      }

      setMessageText('');
      setPendingClientMsgId(null);
      setPendingBody('');
      setLastSendTime(now);
      setSendAttempts(prev => prev + 1);
      
      // Message will appear via subscription (no manual reload needed)
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      setError(lang === 'fr' 
        ? 'Erreur lors de l\'envoi. Vérifiez votre connexion.' 
        : 'Send error. Check your connection.');
      setSending(false);
    }
  };

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await blockUser(user.email, otherProfile.user_id, 'not_interested');
      window.location.href = createPageUrl('AppIntentions');
    } catch (error) {
      console.error('[Chat] Error blocking user:', error);
      alert(lang === 'fr' 
        ? 'Erreur lors du blocage. Réessayez.' 
        : 'Error blocking user. Try again.');
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    const trimmedDesc = reportDescription.trim();
    if (!reportReason) {
      alert(lang === 'fr' ? 'Veuillez sélectionner une raison' : 'Please select a reason');
      return;
    }
    if (!trimmedDesc || trimmedDesc.length < 10) {
      alert(lang === 'fr' ? 'Description trop courte (min 10 caractères)' : 'Description too short (min 10 chars)');
      return;
    }
    if (trimmedDesc.length > 2000) {
      alert(lang === 'fr' ? 'Description trop longue (max 2000 caractères)' : 'Description too long (max 2000 chars)');
      return;
    }

    setReporting(true);
    try {
      // Lookup public_ids via AccountPrivate (source of vérité, ProfilePublic n'a pas user_id)
      const [myAcct, otherAcct] = await Promise.all([
        base44.entities.AccountPrivate.filter({ user_email: user.email }, null, 1),
        base44.entities.AccountPrivate.filter({ user_email: otherProfile.user_id }, null, 1)
      ]);
      
      const myPublicId = myAcct[0]?.public_profile_id;
      const otherPublicId = otherAcct[0]?.public_profile_id;
      
      if (!myPublicId || !otherPublicId) {
        alert('Erreur: Profils publics introuvables');
        setReporting(false);
        return;
      }
      
      await base44.entities.Report.create({
        reporter_profile_id: myPublicId,
        target_profile_id: otherPublicId,
        target_conversation_id: conversation.id,
        reason: reportReason,
        description: reportDescription.trim(),
        severity: 'medium',
        status: 'pending'
      });

      setReportModal(false);
      setReportReason('');
      setReportDescription('');
      
      alert(lang === 'fr' 
        ? 'Signalement envoyé. Notre équipe va l\'examiner.' 
        : 'Report sent. Our team will review it.');
    } catch (error) {
      console.error('[Chat] Error reporting user:', error);
      alert(lang === 'fr' 
        ? 'Erreur lors du signalement. Réessayez.' 
        : 'Error reporting user. Try again.');
      setReporting(false);
    }
  };

  const content = {
    fr: {
      back: "Retour",
      typing: "Votre message...",
      send: "Envoyer",
      maxChars: "Maximum 2000 caractères",
      loadMore: "Charger plus",
      block: "Bloquer",
      report: "Signaler",
      blockTitle: "Bloquer cet utilisateur ?",
      blockDesc: "Vous ne pourrez plus échanger de messages.",
      cancel: "Annuler",
      confirm: "Confirmer",
      reportTitle: "Signaler cet utilisateur",
      reportReason: "Raison",
      reportDesc: "Description détaillée (min 10 caractères)",
      reasons: {
        harassment: "Harcèlement",
        spam: "Spam",
        scam: "Arnaque",
        inappropriate_content: "Contenu inapproprié",
        other: "Autre"
      }
    },
    en: {
      back: "Back",
      typing: "Your message...",
      send: "Send",
      maxChars: "Maximum 2000 characters",
      loadMore: "Load more",
      block: "Block",
      report: "Report",
      blockTitle: "Block this user?",
      blockDesc: "You won't be able to exchange messages anymore.",
      cancel: "Cancel",
      confirm: "Confirm",
      reportTitle: "Report this user",
      reportReason: "Reason",
      reportDesc: "Detailed description (min 10 characters)",
      reasons: {
        harassment: "Harassment",
        spam: "Spam",
        scam: "Scam",
        inappropriate_content: "Inappropriate content",
        other: "Other"
      }
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

  if (error && !conversation) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-300 mb-4">{error}</p>
            <Button onClick={() => window.location.href = createPageUrl('AppIntentions')}>
              {t.back}
            </Button>
          </div>
        </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="flex flex-col" style={{ height: '100dvh' }}>
      <div className="border-b border-amber-500/10 bg-slate-900/50 backdrop-blur-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl('AppIntentions')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/20">
              {otherProfile?.photo_url ? (
                <img src={otherProfile.photo_url} alt={otherProfile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-amber-100">{otherProfile?.display_name || 'User'}</h2>
              <p className="text-xs text-slate-400 capitalize">{conversation?.mode}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportModal(true)}
            className="text-orange-400 hover:text-orange-300"
          >
            <Flag className="w-4 h-4 mr-2" />
            {t.report}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBlockModal(true)}
            className="text-red-400 hover:text-red-300"
          >
            <Shield className="w-4 h-4 mr-2" />
            {t.block}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto">
          {hasMore && (
            <div className="text-center mb-4">
              <Button
                onClick={loadMoreMessages}
                disabled={loadingMore}
                variant="outline"
                size="sm"
                className="border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {t.loadMore}
              </Button>
            </div>
          )}
          
          <div ref={messagesTopRef} />
          
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.from_user_id === user.email}
              lang={lang}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-amber-500/10 bg-slate-900/50 backdrop-blur-xl px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t.typing}
              className="bg-slate-800/50 border-amber-500/10 text-white resize-none"
              rows={2}
              maxLength={2000}
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={sending || !messageText.trim() || messageText.length > 2000}
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 self-end"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
          <p className="text-xs text-slate-500 mt-2">{messageText.length}/2000</p>
        </div>
      </div>

      <Dialog open={blockModal} onOpenChange={setBlockModal}>
        <DialogContent className="bg-slate-900 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-100">{t.blockTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300 mb-4">{t.blockDesc}</p>
          <div className="flex gap-3">
            <Button onClick={() => setBlockModal(false)} variant="outline" className="flex-1">
              {t.cancel}
            </Button>
            <Button onClick={handleBlock} disabled={blocking} className="flex-1 bg-red-500 hover:bg-red-600">
              {blocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportModal} onOpenChange={setReportModal}>
        <DialogContent className="bg-slate-900 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-100">{t.reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t.reportReason}</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-slate-800/50 border border-amber-500/10 text-white rounded-lg px-3 py-2"
              >
                <option value="">--</option>
                {Object.entries(t.reasons).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <Textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder={t.reportDesc}
              className="bg-slate-800/50 border-amber-500/10 text-white"
              rows={4}
            />
            <div className="flex gap-3">
              <Button onClick={() => setReportModal(false)} variant="outline" className="flex-1">
                {t.cancel}
              </Button>
              <Button 
                onClick={handleReport} 
                disabled={reporting || !reportReason || reportDescription.length < 10}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {reporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t.confirm}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </SubscriptionGuard>
  );
}