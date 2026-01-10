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
      
      // Create auto-report
      await base44.entities.Report.create({
        reporter_user_id: 'system@grandtarot.com',
        target_user_id: userId,
        reason: 'scam',
        severity: 'critical',
        description: `Auto-flagged: ${flags.join(', ')}`,
        status: 'pending',
        auto_flagged: true
      });
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
 * ANY CLIENT-PROVIDED participant_*/from_user_id IS IGNORED
 */
export const sendMessageSecure = async ({ 
  conversationId, 
  messageBody, 
  lang 
}) => {
  try {
    // Get current user email (TRUSTED SOURCE)
    const currentUser = await base44.auth.me();
    const fromUserId = currentUser.email;
    
    // 1. LOAD CONVERSATION (with auth check)
    const conversations = await base44.entities.Conversation.filter({ id: conversationId }, null, 1);
    
    if (conversations.length === 0) {
      return {
        success: false,
        error: lang === 'fr' ? 'Conversation introuvable.' : 'Conversation not found.',
        code: 'CONVERSATION_NOT_FOUND'
      };
    }
    
    const conversation = conversations[0];
    
    // 2. AUTH CHECK - User MUST be participant
    const isParticipant = 
      conversation.user_a_id === fromUserId || 
      conversation.user_b_id === fromUserId;
    
    if (!isParticipant) {
      console.error(`[SECURITY] User ${fromUserId} attempted to send message in conversation ${conversationId} (not participant)`);
      return {
        success: false,
        error: lang === 'fr' ? 'Accès interdit.' : 'Access denied.',
        code: 'NOT_PARTICIPANT'
      };
    }
    
    // 3. DENORMALIZE PARTICIPANTS (from conversation, NOT client)
    const participantA = conversation.user_a_id;
    const participantB = conversation.user_b_id;
    const toUserId = participantA === fromUserId ? participantB : participantA;
    
    // 4. Basic validation
    const basicErrors = basicValidation(messageBody);
    
    if (basicErrors.length > 0) {
      const highSeverity = basicErrors.some(e => e.severity === 'high' || e.severity === 'critical');
      
      if (highSeverity) {
        const critical = basicErrors.find(e => e.severity === 'critical');
        if (critical) {
          await applyModerationAction(fromUserId, 'critical', [critical.type]);
        }
        
        return {
          success: false,
          error: lang === 'fr' 
            ? 'Ce message contient du contenu interdit (liens, numéros, sollicitations externes).' 
            : 'This message contains prohibited content (links, phone numbers, external solicitations).',
          blocked: true
        };
      }
    }
    
    // 5. AI Moderation (async, doesn't block)
    let aiModeration = { safe: true, flags: [], details: {} };
    try {
      aiModeration = await moderateMessage({ message: messageBody, lang });
    } catch (error) {
      console.error('AI moderation failed, allowing message:', error);
    }
    
    // 6. CREATE MESSAGE (with FORCED fields)
    const message = await base44.entities.Message.create({
      conversation_id: conversationId,
      participant_a_id: participantA,  // FORCED from conversation
      participant_b_id: participantB,  // FORCED from conversation
      from_user_id: fromUserId,        // FORCED from auth
      to_user_id: toUserId,            // CALCULATED
      body: messageBody,
      flagged_scam: aiModeration.flags.includes('scam'),
      flagged_harassment: aiModeration.flags.includes('harassment'),
      flagged_inappropriate: aiModeration.flags.includes('inappropriate'),
      contains_link: PATTERNS.url.test(messageBody),
      contains_phone: PATTERNS.phone.test(messageBody),
      moderation_status: aiModeration.safe ? 'clean' : 'flagged',
      flag_details: aiModeration.details || {}
    });
    
    // 7. Update conversation
    const messageCount = (await base44.entities.Message.filter(
      { conversation_id: conversationId }, 
      '-created_date', 
      1000
    )).length;
    
    await base44.entities.Conversation.update(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: messageBody.substring(0, 100),
      message_count: messageCount
    });
    
    // 8. Apply moderation actions if needed
    if (!aiModeration.safe && aiModeration.flags.length > 0) {
      const hasCritical = aiModeration.flags.some(f => ['scam', 'harassment'].includes(f));
      await applyModerationAction(
        fromUserId, 
        hasCritical ? 'critical' : 'high', 
        aiModeration.flags
      );
    }
    
    return {
      success: true,
      message,
      flagged: !aiModeration.safe
    };
    
  } catch (error) {
    console.error('[SECURITY] Error in secure message workflow:', error);
    return {
      success: false,
      error: lang === 'fr' 
        ? 'Erreur lors de l\'envoi du message.' 
        : 'Error sending message.',
      code: 'SERVER_ERROR'
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