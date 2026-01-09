import React, { useEffect, useState, useRef } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Shield, Flag, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessageBubble from '@/components/chat/MessageBubble';
import { sendMessageSecure, blockUser } from '@/components/helpers/messageWorkflow';

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
  
  // Modals
  const [blockModal, setBlockModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (conversation) {
      const interval = setInterval(() => {
        loadMessages(conversation.id, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Landing');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      
      if (currentUser.role !== 'admin') {
        const hasActiveSubscription = profiles.length > 0 && 
          (profiles[0].subscription_status === 'active' || profiles[0].subscription_status === 'trialing');
        
        if (!hasActiveSubscription) {
          window.location.href = createPageUrl('Subscribe');
          return;
        }
      }

      setProfile(profiles[0]);
      setLang(profiles[0].language_pref || 'fr');

      // Get conversation ID from URL
      const params = new URLSearchParams(window.location.search);
      const conversationId = params.get('conversation');
      
      if (!conversationId) {
        window.location.href = createPageUrl('AppIntentions');
        return;
      }

      await loadConversation(conversationId, currentUser.email);
    } catch (error) {
      console.error('Error:', error);
      window.location.href = createPageUrl('Landing');
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
      
      // Check user is participant
      if (conv.user_a_id !== userId && conv.user_b_id !== userId) {
        window.location.href = createPageUrl('AppIntentions');
        return;
      }

      // Check not blocked
      if (conv.status === 'blocked') {
        setError(lang === 'fr' 
          ? 'Cette conversation est bloquée.' 
          : 'This conversation is blocked.');
        setLoading(false);
        return;
      }

      setConversation(conv);

      // Load other user profile
      const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
      const profiles = await base44.entities.UserProfile.filter({ user_id: otherUserId });
      if (profiles.length > 0) {
        setOtherProfile(profiles[0]);
      }

      await loadMessages(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, silent = false) => {
    try {
      const msgs = await base44.entities.Message.filter({ 
        conversation_id: conversationId,
        is_deleted: false 
      });
      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMessages(msgs);

      // Mark unread messages as read
      if (!silent) {
        const unreadMessages = msgs.filter(m => !m.is_read && m.from_user_id !== user.email);
        for (const msg of unreadMessages) {
          await base44.entities.Message.update(msg.id, {
            is_read: true,
            read_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || messageText.length > 2000) return;
    
    setSending(true);
    setError('');
    
    try {
      const result = await sendMessageSecure({
        conversationId: conversation.id,
        fromUserId: user.email,
        messageBody: messageText.trim(),
        lang
      });

      if (!result.success) {
        setError(result.error);
        setSending(false);
        return;
      }

      setMessageText('');
      await loadMessages(conversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(lang === 'fr' ? 'Erreur lors de l\'envoi' : 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await blockUser(user.email, otherProfile.user_id, 'not_interested');
      window.location.href = createPageUrl('AppIntentions');
    } catch (error) {
      console.error('Error blocking:', error);
    } finally {
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason || !reportDescription.trim() || reportDescription.length < 10) return;

    setReporting(true);
    try {
      await base44.entities.Report.create({
        reporter_user_id: user.email,
        target_user_id: otherProfile.user_id,
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
      console.error('Error reporting:', error);
    } finally {
      setReporting(false);
    }
  };

  const content = {
    fr: {
      back: "Retour",
      typing: "Votre message...",
      send: "Envoyer",
      maxChars: "Maximum 2000 caractères",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={() => window.location.href = createPageUrl('AppIntentions')}>
            {t.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto">
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

      {/* Input */}
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

      {/* Block Modal */}
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

      {/* Report Modal */}
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
  );
}