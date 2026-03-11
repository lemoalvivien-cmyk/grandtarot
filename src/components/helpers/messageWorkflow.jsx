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
    console.error('[messageWorkflow] Error applying moderation action:', error);
    // Non-blocking: don't throw
  }
};

/**
 * SECURE: Open conversation via backend function
 * Returns conversationId if authorized
 */
export const openConversationSecure = async (otherUserEmail) => {
  try {
    const result = await base44.functions.invoke('chat_open_conversation', { otherUserEmail });
    const conversationId = result?.data?.conversationId;
    if (!conversationId) {
      return { success: false, error: result?.data?.error || 'Pas de conversationId retourné' };
    }
    return { success: true, conversationId };
  } catch (error) {
    console.error('[openConversation] Error:', error);
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
  if (!clientMsgId) {
    throw new Error('clientMsgId required for idempotence');
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
    console.error('[sendMessage] Error:', error);
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
    // STEP 1: Fetch public_id via AccountPrivate (user_id n'existe pas dans ProfilePublic)
    const [blockerAccts, blockedAccts] = await Promise.all([
      base44.entities.AccountPrivate.filter({ user_email: blockerUserEmail }, null, 1),
      base44.entities.AccountPrivate.filter({ user_email: blockedUserEmail }, null, 1)
    ]);
    
    const blockerPublicId = blockerAccts[0]?.public_profile_id;
    const blockedPublicId = blockedAccts[0]?.public_profile_id;
    
    if (!blockerPublicId) {
      return { success: false, error: 'Blocker onboarding incomplete (public_profile_id missing)' };
    }
    
    if (!blockedPublicId) {
      return { success: false, error: 'Blocked user onboarding incomplete (public_profile_id missing)' };
    }
    
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
    console.error('[messageWorkflow] Error blocking user:', error);
    return { success: false, error: error.message || 'Block failed' };
  }
};