import { base44 } from '@/api/base44Client';
import { moderateMessage } from './aiService';
import createLogger from './logger';

const logger = createLogger('messageWorkflow');

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
      logger.warn('Auto-ban appliqué (critical violation)', { userId });
    }
    
    // High violations = warning cooldown
    if (severity === 'high' && !flags.includes('scam')) {
      const cooldownEnd = new Date();
      cooldownEnd.setHours(cooldownEnd.getHours() + 24);
      await base44.entities.UserProfile.update(profile.id, {
        cooldown_until: cooldownEnd.toISOString()
      });
      logger.warn('Cooldown 24h appliqué (high violation)', { userId });
    }
  } catch (error) {
    logger.error('applyModerationAction failed', { message: error.message });
    // Non-blocking: don't throw
  }
};

/**
 * SECURE: Open conversation via backend function
 * Returns conversationId if authorized
 */
export const openConversationSecure = async (otherUserEmail) => {
  try {
    if (!otherUserEmail) {
      return { success: false, error: 'Invalid email' };
    }
    
    const result = await base44.functions.invoke('chat_open_conversation', { otherUserEmail });
    const conversationId = result?.data?.conversationId;
    if (!conversationId) {
      return { success: false, error: result?.data?.error || 'Pas de conversationId retourné' };
    }
    return { success: true, conversationId };
  } catch (error) {
    logger.error('openConversationSecure failed', { message: error.message });
    return { success: false, error: error.message || 'Erreur ouverture conversation' };
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
  if (!conversationId) {
    return { success: false, error: lang === 'fr' ? 'Conversation invalide' : 'Invalid conversation' };
  }
  if (!messageBody || !messageBody.trim()) {
    return { success: false, error: lang === 'fr' ? 'Message vide' : 'Empty message' };
  }
  if (!clientMsgId) {
    return { success: false, error: 'clientMsgId required for idempotence' };
  }
  
  try {
    const result = await base44.functions.invoke('chat_send_message', {
      conversationId,
      body: messageBody,
      clientMsgId
    });
    
    const msg = result?.data?.message;
    if (!msg) {
      return {
        success: false,
        error: result?.data?.error || (lang === 'fr' ? 'Pas de message retourné' : 'No message returned')
      };
    }
    return { success: true, message: msg, duplicate: result?.data?.duplicate || false };
    
  } catch (error) {
    logger.error('sendMessageSecure failed', { message: error.message });
    // Essai d'extraire le status HTTP depuis l'erreur axios
    const status = error?.response?.status;
    let errorMsg = lang === 'fr' ? 'Erreur lors de l\'envoi du message.' : 'Error sending message.';
    if (status === 403) errorMsg = lang === 'fr' ? 'Accès interdit.' : 'Access denied.';
    else if (status === 429) errorMsg = lang === 'fr' ? 'Trop rapide - Attendez 1 seconde.' : 'Too fast - Wait 1 second.';
    else if (status === 400) errorMsg = lang === 'fr' ? 'Message invalide.' : 'Invalid message.';
    return { success: false, error: errorMsg };
  }
};

/**
 * Block a user — STRICT ProfilePublic.public_id (NO bridge)
 * 
 * CRITICAL: Block entity requires blocker_profile_id / blocked_profile_id (ProfilePublic.public_id)
 * This aligns with:
 * - Block AccessRules: blocker_profile_id == {user.public_id}
 * - chat_open_conversation block checks via public_id
 * 
 * SOURCE: ProfilePublic.filter({ user_id: email }, null, 1).public_id ONLY
 */
export const blockUser = async (blockerUserEmail, blockedUserEmail, reason = 'not_interested') => {
  try {
    if (!blockerUserEmail || !blockedUserEmail) {
      return { success: false, error: 'Invalid email parameters' };
    }
    if (blockerUserEmail === blockedUserEmail) {
      return { success: false, error: 'Cannot block self' };
    }
    
    // Delegate to backend function (no cross-user AccountPrivate access)
    const result = await base44.functions.invoke('block_user', {
      blockedUserEmail,
      reason
    });
    
    if (!result?.data?.success) {
      return { success: false, error: result?.data?.error || 'Block failed' };
    }
    
    return { success: true };
  } catch (error) {
    logger.error('blockUser failed', { message: error.message });
    return { success: false, error: error.message || 'Block failed' };
  }
};