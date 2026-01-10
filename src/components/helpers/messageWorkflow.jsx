import { base44 } from '@/api/base44Client';
import { moderateMessage } from './aiService';

/**
 * SECURE MESSAGE WORKFLOW - NO MERCY MODE
 * Anti-spoof, participants-only, zero trust client input
 */

// Regex patterns for detection
const PATTERNS = {
  url: /(https?:\/\/|www\.|\.com|\.fr|\.net|\.org|\.be|\.ch)/i,
  phone: /(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,})/,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  externalContact: /(whatsapp|telegram|insta|snapchat|snap|discord|skype)/i,
  crypto: /(bitcoin|btc|ethereum|eth|crypto|wallet|binance)/i,
  money: /(paypal|virement|bank|carte bancaire|iban|western union)/i
};

/**
 * Basic validation rules
 */
const basicValidation = (message) => {
  const errors = [];
  
  if (PATTERNS.url.test(message)) {
    errors.push({ type: 'url', severity: 'high' });
  }
  
  if (PATTERNS.phone.test(message)) {
    errors.push({ type: 'phone', severity: 'high' });
  }
  
  if (PATTERNS.email.test(message)) {
    errors.push({ type: 'email', severity: 'medium' });
  }
  
  if (PATTERNS.externalContact.test(message)) {
    errors.push({ type: 'external_contact', severity: 'high' });
  }
  
  if (PATTERNS.crypto.test(message) || PATTERNS.money.test(message)) {
    errors.push({ type: 'financial', severity: 'critical' });
  }
  
  return errors;
};

/**
 * Apply moderation action based on severity
 */
const applyModerationAction = async (userId, severity, flags) => {
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId }, null, 1);
    if (!profiles.length) return;
    
    const profile = profiles[0];
    
    // Critical violations = immediate temp ban
    if (severity === 'critical' || flags.includes('scam')) {
      const banEnd = new Date();
      banEnd.setDate(banEnd.getDate() + 7); // 7 days
      
      await base44.entities.UserProfile.update(profile.id, {
        cooldown_until: banEnd.toISOString()
      });
      
      // Auto-reports not allowed from client (admin-only via backend if needed)
      console.warn('[SECURITY] Auto-report blocked - requires backend function');
    }
    
    // High violations = warning cooldown
    if (severity === 'high' && !flags.includes('scam')) {
      const cooldownEnd = new Date();
      cooldownEnd.setHours(cooldownEnd.getHours() + 24);
      
      await base44.entities.UserProfile.update(profile.id, {
        cooldown_until: cooldownEnd.toISOString()
      });
    }
  } catch (error) {
    console.error('Error applying moderation action:', error);
  }
};

/**
 * ⚠️ SECURE MESSAGE CREATION - ANTI-SPOOF WORKFLOW ⚠️
 * 
 * CLIENT MUST ONLY SEND:
 * - conversationId (required)
 * - body (required)
 * 
 * SERVER ENFORCES:
 * - from_user_id = {user.email} (FORCED)
 * - participant_a_id, participant_b_id = FROM CONVERSATION (DENORMALIZED)
 * - to_user_id = CALCULATED (other participant)
 * 
 * ANY CLIENT-PROVIDED participant fields or from_user_id ARE IGNORED
 */
/**
 * SECURE: Open conversation via backend function
 * Returns conversationId if authorized
 */
export const openConversationSecure = async (otherUserEmail) => {
  try {
    const response = await base44.functions.chat_open_conversation({ otherUserEmail });
    
    if (!response.conversationId) {
      throw new Error('Pas de conversationId retourné');
    }
    
    return {
      success: true,
      conversationId: response.conversationId
    };
  } catch (error) {
    console.error('[openConversation] Error:', error);
    return {
      success: false,
      error: error.message || 'Erreur ouverture conversation'
    };
  }
};

/**
 * SECURE: Send message via backend function
 * ONLY sends conversationId + body + clientMsgId (NO participant fields)
 */
export const sendMessageSecure = async ({ 
  conversationId, 
  messageBody,
  clientMsgId,
  lang 
}) => {
  try {
    // Call backend function - ONLY conversationId + body + clientMsgId
    const response = await base44.functions.chat_send_message({
      conversationId,
      body: messageBody,
      clientMsgId: clientMsgId || `${Date.now()}-${Math.random()}`
    });
    
    if (!response.message) {
      throw new Error(response.error || 'Pas de message retourné');
    }
    
    return {
      success: true,
      message: response.message,
      duplicate: response.duplicate || false
    };
    
  } catch (error) {
    console.error('[sendMessage] Error:', error);
    
    // Parse error message
    let errorMsg = lang === 'fr' 
      ? 'Erreur lors de l\'envoi du message.' 
      : 'Error sending message.';
    
    if (error.message?.includes('403') || error.message?.includes('Non autorisé')) {
      errorMsg = lang === 'fr' ? 'Accès interdit.' : 'Access denied.';
    } else if (error.message?.includes('429') || error.message?.includes('Trop rapide')) {
      errorMsg = lang === 'fr' ? 'Trop rapide - Attendez 1 seconde.' : 'Too fast - Wait 1 second.';
    } else if (error.message?.includes('400') || error.message?.includes('vide')) {
      errorMsg = lang === 'fr' ? 'Message invalide.' : 'Invalid message.';
    }
    
    return {
      success: false,
      error: errorMsg,
      code: error.statusCode || 'SERVER_ERROR'
    };
  }
};

/**
 * Block a user (with scoped queries)
 */
export const blockUser = async (blockerUserId, blockedUserId, reason = 'not_interested') => {
  try {
    // Create block
    await base44.entities.Block.create({
      blocker_user_id: blockerUserId,
      blocked_user_id: blockedUserId,
      reason,
      is_mutual: false,
      is_admin_enforced: false
    });
    
    // Archive conversations (SCOPED queries, no .list())
    const convsA = await base44.entities.Conversation.filter({ 
      user_a_id: blockerUserId, 
      user_b_id: blockedUserId 
    }, null, 5);
    
    const convsB = await base44.entities.Conversation.filter({ 
      user_a_id: blockedUserId, 
      user_b_id: blockerUserId 
    }, null, 5);
    
    const userConversations = [...convsA, ...convsB];
    
    for (const conv of userConversations) {
      await base44.entities.Conversation.update(conv.id, {
        status: 'blocked',
        blocked_by: blockerUserId,
        blocked_at: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
};