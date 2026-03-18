import { base44 } from '@/api/base44Client';
import createLogger from './logger';

const logger = createLogger('aiService');

/**
 * AI Service for GRANDTAROT
 * Manages all AI-powered features using AiPrompt entity
 */

// LLM timeout: 25 seconds (hard limit)
const LLM_TIMEOUT_MS = 25000;

/** Wraps any promise with a 25s timeout + graceful rejection */
const withTimeout = (promise, ms = LLM_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
    )
  ]);

// Cache for prompts to avoid repeated DB calls
let promptCache = {};
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load AI prompts from database (with caching)
 */
const loadPrompts = async () => {
  const now = Date.now();
  if (promptCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return promptCache;
  }

  try {
    const prompts = await base44.entities.AiPrompt.filter({ is_active: true });
    promptCache = {};
    prompts.forEach(p => {
      promptCache[p.prompt_key] = p;
    });
    cacheTimestamp = now;
    return promptCache;
  } catch (error) {
    console.error('[aiService] Error loading AI prompts:', error);
    // Return empty object to trigger fallbacks
    return {};
  }
};

/**
 * Generate interpretation for daily tarot draw
 */
export const generateInterpretation = async ({ card, mode, lang, userProfile }) => {
  try {
    const prompts = await loadPrompts();
    const promptKey = `interpretation_${mode}`;
    const prompt = prompts[promptKey];

    if (!prompt) {
      throw new Error(`Prompt not found: ${promptKey}`);
    }

    const cardName = lang === 'fr' ? card.name_fr : card.name_en;
    const cardMeaning = lang === 'fr' ? card.meaning_upright_fr : card.meaning_upright_en;
    const keywords = lang === 'fr' ? card.keywords_fr?.join(', ') : card.keywords_en?.join(', ');

    const userPrompt = `Carte tirée: ${cardName}
Mots-clés: ${keywords}
Signification: ${cardMeaning}

Génère une interprétation personnalisée pour ${mode} en suivant le format JSON attendu.`;

    // Timeout 25s (hard limit)
    const response = await withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: userPrompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string", maxLength: 200 },
            todayFocus: { type: "string", maxLength: 150 },
            do: { type: "array", items: { type: "string" }, maxItems: 3 },
            avoid: { type: "array", items: { type: "string" }, maxItems: 2 },
            reflectionQuestion: { type: "string", maxLength: 150 },
            themes: { type: "array", items: { type: "string" }, maxItems: 3 },
            safetyNote: { type: "string" }
          },
          required: ["summary", "todayFocus", "do", "avoid", "reflectionQuestion", "themes", "safetyNote"]
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LLM timeout')), 30000)
      )
    ]);

    // Ensure safety note is always present
    if (!response.safetyNote || response.safetyNote.length < 10) {
      response.safetyNote = lang === 'fr' 
        ? "Le tarot est un outil symbolique de réflexion, pas une prédiction certaine."
        : "Tarot is a symbolic reflection tool, not a certain prediction.";
    }

    return response;
  } catch (error) {
    console.error('[aiService] Error generating interpretation:', error);
    
    // Fallback interpretation
    return {
      summary: lang === 'fr' 
        ? "Une journée riche en réflexion vous attend."
        : "A day rich in reflection awaits you.",
      todayFocus: lang === 'fr'
        ? "Concentrez-vous sur l'instant présent."
        : "Focus on the present moment.",
      do: [
        lang === 'fr' ? "Écoutez votre intuition" : "Listen to your intuition",
        lang === 'fr' ? "Restez ouvert aux opportunités" : "Stay open to opportunities"
      ],
      avoid: [
        lang === 'fr' ? "Les décisions impulsives" : "Impulsive decisions"
      ],
      reflectionQuestion: lang === 'fr'
        ? "Qu'est-ce qui mérite vraiment votre attention aujourd'hui ?"
        : "What truly deserves your attention today?",
      themes: ["reflection", "awareness"],
      safetyNote: lang === 'fr'
        ? "Le tarot est un outil symbolique de réflexion, pas une prédiction certaine."
        : "Tarot is a symbolic reflection tool, not a certain prediction."
    };
  }
};

/**
 * Generate icebreaker suggestions for intention messages
 */
export const generateIcebreakers = async ({ targetProfile, mode, lang, sharedInterests }) => {
  try {
    const prompts = await loadPrompts();
    const prompt = prompts['icebreaker_generator'];

    if (!prompt) {
      throw new Error('Icebreaker prompt not found');
    }

    const systemPrompt = lang === 'fr' ? prompt.system_prompt_fr : prompt.system_prompt_en;
    
    const userPrompt = `Mode: ${mode}
Centres d'intérêt communs: ${sharedInterests?.join(', ') || 'Aucun'}

Génère 3 messages d'accroche authentiques et respectueux (20-80 mots chacun).`;

    // Add timeout protection (20s max for icebreakers)
    const response = await Promise.race([
      base44.integrations.Core.InvokeLLM({
        prompt: userPrompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            icebreakers: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["icebreakers"]
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Icebreaker timeout')), 20000)
      )
    ]);

    return response.icebreakers || [];
  } catch (error) {
    console.error('[aiService] Error generating icebreakers:', error);
    
    // Fallback icebreakers
    if (lang === 'fr') {
      return [
        "Bonjour ! J'ai été intrigué par votre profil. Que diriez-vous d'échanger ?",
        "Salut ! Nos centres d'intérêt semblent alignés. J'aimerais en savoir plus sur vous.",
        "Bonjour, je trouve votre énergie inspirante. Seriez-vous partant pour une conversation ?"
      ];
    } else {
      return [
        "Hi! Your profile caught my attention. Would you like to chat?",
        "Hello! Our interests seem aligned. I'd love to know more about you.",
        "Hi there, I find your energy inspiring. Would you be up for a conversation?"
      ];
    }
  }
};

/**
 * Moderate message content
 * Returns: { safe: boolean, flags: string[], details: object }
 */
export const moderateMessage = async ({ message, lang }) => {
  try {
    const prompts = await loadPrompts();
    const prompt = prompts['moderation_message'];

    if (!prompt) {
      // If no prompt, allow by default
      return { safe: true, flags: [], details: {} };
    }

    const systemPrompt = lang === 'fr' ? prompt.system_prompt_fr : prompt.system_prompt_en;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Message à analyser: "${message}"
      
Détecte: harcèlement, spam, contenu inapproprié, demande d'argent/crypto, liens suspects, numéros de téléphone.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          flags: {
            type: "array",
            items: { 
              type: "string",
              enum: ["harassment", "spam", "scam", "inappropriate", "external_contact", "other"]
            }
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" }
        },
        required: ["safe", "flags"]
      }
    });

    return {
      safe: response.safe !== false, // Default to safe if unclear
      flags: response.flags || [],
      details: {
        confidence: response.confidence,
        reasoning: response.reasoning
      }
    };
  } catch (error) {
    console.error('[aiService] Error moderating message:', error);
    
    // Basic regex-based fallback moderation
    const lowerMessage = message.toLowerCase();
    const flags = [];
    
    // Scam detection
    if (/(crypto|bitcoin|argent|money|paypal|virement|bank|carte bancaire)/i.test(lowerMessage)) {
      flags.push('scam');
    }
    
    // External contact detection
    if (/(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|whatsapp|telegram|insta|snap)/i.test(lowerMessage)) {
      flags.push('external_contact');
    }
    
    // URL detection
    if (/(https?:\/\/|www\.|\.com|\.fr|\.net)/i.test(lowerMessage)) {
      flags.push('spam');
    }

    return {
      safe: flags.length === 0,
      flags,
      details: { fallback: true }
    };
  }
};

/**
 * Clear prompt cache (useful after admin updates prompts)
 */
export const clearPromptCache = () => {
  promptCache = {};
  cacheTimestamp = null;
};