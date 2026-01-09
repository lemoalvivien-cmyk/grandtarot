import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, MoreVertical, Flag, Ban, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Chat() {
  const [lang, setLang] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [sending, setSending] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('id');
    
    if (!conversationId) {
      window.location.href = createPageUrl('Messages');
      return;
    }

    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        window.location.href = createPageUrl('Paywall');
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load conversation
      const conv = await base44.entities.Conversation.filter({ id: conversationId });
      if (conv.length === 0) {
        window.location.href = createPageUrl('Messages');
        return;
      }

      const thisConv = conv[0];
      
      // Check if user is part of conversation
      if (thisConv.user1_id !== currentUser.email && thisConv.user2_id !== currentUser.email) {
        window.location.href = createPageUrl('Messages');
        return;
      }

      setConversation(thisConv);

      // Load other profile
      const otherId = thisConv.user1_id === currentUser.email ? thisConv.user2_id : thisConv.user1_id;
      const profiles = await base44.entities.UserProfile.filter({ user_id: otherId });
      if (profiles.length > 0) {
        setOtherProfile(profiles[0]);
        setLang(profiles[0].language || 'fr');
      }

      // Load messages
      const msgs = await base44.entities.Message.filter({ conversation_id: conversationId });
      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMessages(msgs);

      // Mark as read
      const unreadMsgs = msgs.filter(m => !m.is_read && m.sender_id !== currentUser.email);
      for (const msg of unreadMsgs) {
        await base44.entities.Message.update(msg.id, { is_read: true });
      }

      // Reset unread count
      const updateField = thisConv.user1_id === currentUser.email ? 'unread_count_user1' : 'unread_count_user2';
      await base44.entities.Conversation.update(thisConv.id, { [updateField]: 0 });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const msg = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: user.email,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, msg]);
      setNewMessage('');

      // Update conversation
      const otherUnreadField = conversation.user1_id === user.email ? 'unread_count_user2' : 'unread_count_user1';
      const currentUnread = conversation[otherUnreadField] || 0;
      
      await base44.entities.Conversation.update(conversation.id, {
        last_message_at: new Date().toISOString(),
        last_message_preview: newMessage.trim().substring(0, 50),
        [otherUnreadField]: currentUnread + 1
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(lang === 'fr' ? 'Bloquer cet utilisateur ?' : 'Block this user?')) return;

    try {
      await base44.entities.Block.create({
        blocker_id: user.email,
        blocked_id: otherProfile.user_id
      });

      await base44.entities.Conversation.update(conversation.id, { status: 'blocked' });
      window.location.href = createPageUrl('Messages');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const submitReport = async () => {
    if (!reportReason) return;

    try {
      await base44.entities.Report.create({
        reporter_id: user.email,
        reported_user_id: otherProfile.user_id,
        reason: reportReason,
        details: reportDetails,
        conversation_id: conversation.id,
        status: 'pending'
      });

      setShowReport(false);
      setReportReason('');
      setReportDetails('');
      alert(lang === 'fr' ? 'Signalement envoyé' : 'Report submitted');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const content = {
    fr: {
      back: "Messages",
      placeholder: "Écrivez un message...",
      report: "Signaler",
      block: "Bloquer",
      reportTitle: "Signaler cet utilisateur",
      reason: "Raison",
      details: "Détails (optionnel)",
      submit: "Envoyer le signalement",
      reasons: {
        harassment: "Harcèlement",
        spam: "Spam",
        inappropriate_content: "Contenu inapproprié",
        fake_profile: "Faux profil",
        other: "Autre"
      }
    },
    en: {
      back: "Messages",
      placeholder: "Write a message...",
      report: "Report",
      block: "Block",
      reportTitle: "Report this user",
      reason: "Reason",
      details: "Details (optional)",
      submit: "Submit report",
      reasons: {
        harassment: "Harassment",
        spam: "Spam",
        inappropriate_content: "Inappropriate content",
        fake_profile: "Fake profile",
        other: "Other"
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Messages')} className="text-purple-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="font-semibold text-purple-400">
                {otherProfile?.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="font-medium">{otherProfile?.display_name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-purple-300 hover:text-white">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
            <DropdownMenuItem onClick={() => setShowReport(true)} className="hover:bg-white/10">
              <Flag className="w-4 h-4 mr-2" />{t.report}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBlock} className="hover:bg-white/10 text-red-400">
              <Ban className="w-4 h-4 mr-2" />{t.block}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                isMe 
                  ? 'bg-purple-600 text-white rounded-br-sm' 
                  : 'bg-white/10 text-white rounded-bl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation?.status === 'active' && (
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={t.placeholder}
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {t.reportTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-purple-300 mb-2 block">{t.reason}</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={t.reason} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {Object.entries(t.reasons).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-purple-300 mb-2 block">{t.details}</label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button onClick={submitReport} disabled={!reportReason} className="w-full bg-red-600 hover:bg-red-500">
              {t.submit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}