/**
 * Fallback Tarot Deck - Full 78 cards with real images
 * Imported from centralized deck
 */

import { tarotDeck } from './tarotDeck';

export const fallbackTarotDeck = tarotDeck;

/**
 * Get card of the day based on current date (deterministic)
 * Uses simple hash of YYYY-MM-DD to select card index
 * Now uses full 78-card deck with real images
 */
export function getDailyCardFallback() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % fallbackTarotDeck.length;
  const card = fallbackTarotDeck[index];
  
  // Add minimal interpretation for fallback
  return {
    ...card,
    meaning_upright_fr: `Carte du jour: ${card.name_fr}. Contemplez sa signification dans votre journée.`,
    meaning_upright_en: `Card of the day: ${card.name_en}. Contemplate its meaning in your day.`
  };
}