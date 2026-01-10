import { base44 } from '@/api/base44Client';
import { moderateMessage } from './aiService';

/**
 * Message Security Workflow
 * Validates and moderates messages before sending
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
  
  // Check for URLs
  if (PATTERNS.url.test(message)) {
    errors.push({ type: 'url', severity: 'high' });
  }
  
  // Check for phone numbers
  if (PATTERNS.phone.test(message)) {
    errors.push({ type: 'phone', severity: 'high' });
  }
  
  // Check for emails
  if (PATTERNS.email.test(message)) {
    errors.push({ type: 'email', severity: 'medium' });
  }
  
  // Check for external contact requests
  if (PATTERNS.externalContact.test(message)) {
    errors.push({ type: 'external_contact', severity: 'high' });
  }
  
  // Check for crypto/money mentions
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
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
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
 * Main workflow: Send Message Securely
 */
export const sendMessageSecure = async ({ 
  conversationId, 
  fromUserId, 
  messageBody, 
  lang 
}) => {
  try {
    // 1. Basic validation
    const basicErrors = basicValidation(messageBody);
    
    if (basicErrors.length > 0) {
      const highSeverity = basicErrors.some(e => e.severity === 'high' || e.severity === 'critical');
      
      if (highSeverity) {
        // Apply immediate action for critical violations
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
    
    // 2. AI Moderation (async, doesn't block)
    let aiModeration = { safe: true, flags: [] };
    try {
      aiModeration = await moderateMessage({ message: messageBody, lang });
    } catch (error) {
      console.error('AI moderation failed, allowing message:', error);
      // Fail open - don't block if AI fails
    }
    
    // 3. Create message
    const message = await base44.entities.Message.create({
      conversation_id: conversationId,
      from_user_id: fromUserId,
      body: messageBody,
      flagged_scam: aiModeration.flags.includes('scam'),
      flagged_harassment: aiModeration.flags.includes('harassment'),
      flagged_inappropriate: aiModeration.flags.includes('inappropriate'),
      contains_link: PATTERNS.url.test(messageBody),
      contains_phone: PATTERNS.phone.test(messageBody),
      moderation_status: aiModeration.safe ? 'clean' : 'flagged',
      flag_details: aiModeration.details || {}
    });
    
    // 4. Update conversation
    await base44.entities.Conversation.update(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: messageBody.substring(0, 100),
      message_count: (await base44.entities.Message.filter({ conversation_id: conversationId })).length
    });
    
    // 5. Apply moderation actions if needed
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
    console.error('Error in message workflow:', error);
    return {
      success: false,
      error: lang === 'fr' 
        ? 'Erreur lors de l\'envoi du message.' 
        : 'Error sending message.'
    };
  }
};

/**
 * Block a user
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
    
    // Archive all conversations between them
    // Query both directions separately (Base44 may not support $or)
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