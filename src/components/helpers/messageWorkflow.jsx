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
 */
export const sendMessageSecure = async ({ 
  conversationId, 
  messageBody,
  clientMsgId,
  lang 
}) => {
  if (!clientMsgId) {
    throw new Error('clientMsgId required for idempotence');
  }
  
  try {
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
    // STEP 1: Fetch blocker's ProfilePublic (unique source of public_id)
    const blockerProfiles = await base44.entities.ProfilePublic.filter({ 
      user_id: blockerUserEmail 
    }, null, 1);
    
    if (!blockerProfiles.length) {
      return { success: false, error: 'Blocker onboarding incomplete (ProfilePublic missing)' };
    }
    
    const blockerPublicId = blockerProfiles[0].public_id;
    
    // STEP 2: Fetch blocked user's ProfilePublic
    const blockedProfiles = await base44.entities.ProfilePublic.filter({ 
      user_id: blockedUserEmail 
    }, null, 1);
    
    if (!blockedProfiles.length) {
      return { success: false, error: 'Blocked user onboarding incomplete (ProfilePublic missing)' };
    }
    
    const blockedPublicId = blockedProfiles[0].public_id;
    
    // STEP 3: Create Block with STRICT public_id fields (NEVER email)
    await base44.entities.Block.create({
      blocker_profile_id: blockerPublicId,
      blocked_profile_id: blockedPublicId,
      reason,
      is_mutual: false,
      is_admin_enforced: false
    });
    
    // STEP 4: Archive related conversations
    const convsA = await base44.entities.Conversation.filter({ 
      user_a_id: blockerUserEmail, 
      user_b_id: blockedUserEmail 
    }, null, 5);
    
    const convsB = await base44.entities.Conversation.filter({ 
      user_a_id: blockedUserEmail, 
      user_b_id: blockerUserEmail 
    }, null, 5);
    
    const userConversations = [...convsA, ...convsB];
    
    for (const conv of userConversations) {
      await base44.entities.Conversation.update(conv.id, {
        status: 'blocked',
        blocked_by: blockerUserEmail,
        blocked_at: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
};