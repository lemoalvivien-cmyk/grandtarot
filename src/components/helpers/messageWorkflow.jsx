import { base44 } from '@/api/base44Client';
import { moderateMessage } from './aiService';
import { callFunctionRaw } from './functionFetch';

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
    const result = await callFunctionRaw('chat_open_conversation', { otherUserEmail });
    
    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.json?.error || result.text || 'Erreur ouverture conversation'
      };
    }
    
    if (!result.json?.conversationId) {
      return {
        success: false,
        status: result.status,
        error: 'Pas de conversationId retourné'
      };
    }
    
    return {
      success: true,
      conversationId: result.json.conversationId,
      status: result.status
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
 * 
 * CRITICAL: clientMsgId is REQUIRED - no fallback generation here
 */
export const sendMessageSecure = async ({ 
  conversationId, 
  messageBody,
  clientMsgId,
  lang 
}) => {
  // STRICT: clientMsgId must be provided by caller
  if (!clientMsgId) {
    throw new Error('clientMsgId required for idempotence');
  }
  
  try {
    // Call backend function - ONLY conversationId + body + clientMsgId
    const result = await callFunctionRaw('chat_send_message', {
      conversationId,
      body: messageBody,
      clientMsgId
    });
    
    if (!result.success) {
      let errorMsg = lang === 'fr' 
        ? 'Erreur lors de l\'envoi du message.' 
        : 'Error sending message.';
      
      if (result.status === 403) {
        errorMsg = lang === 'fr' ? 'Accès interdit.' : 'Access denied.';
      } else if (result.status === 429) {
        errorMsg = lang === 'fr' ? 'Trop rapide - Attendez 1 seconde.' : 'Too fast - Wait 1 second.';
      } else if (result.status === 400) {
        errorMsg = lang === 'fr' ? 'Message invalide.' : 'Invalid message.';
      }
      
      return {
        success: false,
        status: result.status,
        error: errorMsg,
        code: `HTTP_${result.status}`
      };
    }
    
    if (!result.json?.message) {
      return {
        success: false,
        status: result.status,
        error: lang === 'fr' ? 'Pas de message retourné' : 'No message returned'
      };
    }
    
    return {
      success: true,
      status: result.status,
      message: result.json.message,
      duplicate: result.json.duplicate || false
    };
    
  } catch (error) {
    console.error('[sendMessage] Error:', error);
    
    let errorMsg = lang === 'fr' 
      ? 'Erreur lors de l\'envoi du message.' 
      : 'Error sending message.';
    
    return {
      success: false,
      error: errorMsg,
      code: 'EXCEPTION'
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