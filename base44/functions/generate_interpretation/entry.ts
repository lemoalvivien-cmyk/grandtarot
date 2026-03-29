/**
 * generate_interpretation — Backend function pour la génération d'interprétation tarot
 * Sécurité: appel InvokeLLM côté serveur, une interprétation/jour, pas d'exposition de données
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const _rlStore = new Map();
function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = _rlStore.get(key) || { calls: [] };
  entry.calls = entry.calls.filter(t => now - t < windowMs);
  if (entry.calls.length >= max) {
    _rlStore.set(key, entry);
    return false;
  }
  entry.calls.push(now);
  _rlStore.set(key, entry);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 5 appels/heure max
    if (!checkRateLimit(`interpretation:${currentUser.email}`, 5, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    const body = await req.json();
    const { cardId, mode, lang } = body;

    if (!cardId || !['love', 'friendship', 'professional'].includes(mode) || !['fr', 'en'].includes(lang)) {
      return Response.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // Vérifier abonnement
    const accounts = await serviceRole.entities.AccountPrivate.filter(
      { user_email: currentUser.email },
      null,
      1
    );

    if (!accounts.length) {
      return Response.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    if (accounts[0].plan_status !== 'active' && currentUser.role !== 'admin') {
      return Response.json({ error: 'Abonnement requis' }, { status: 403 });
    }

    // Vérifier qu'un DailyDraw existe pour aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const profileId = accounts[0].public_profile_id;

    if (!profileId) {
      return Response.json({ error: 'Profil public introuvable' }, { status: 404 });
    }

    const existingDraws = await serviceRole.entities.DailyDraw.filter(
      {
        profile_id: profileId,
        draw_date: today,
        mode: mode
      },
      null,
      1
    );

    if (!existingDraws.length) {
      return Response.json({ error: 'Aucun tirage pour aujourd\'hui' }, { status: 404 });
    }

    // Charger la carte
    const cards = await serviceRole.entities.TarotCard.filter({ id: cardId }, null, 1);

    if (!cards.length) {
      return Response.json({ error: 'Carte introuvable' }, { status: 404 });
    }

    const card = cards[0];

    // Construire le prompt côté serveur
    const cardMeaning =
      lang === 'fr'
        ? `${card.meaning_upright_fr || ''}\n\n${
            mode === 'love' ? card.love_meaning_fr || '' : mode === 'friendship' ? card.friendship_meaning_fr || '' : card.career_meaning_fr || ''
          }`
        : `${card.meaning_upright_en || ''}\n\n${
            mode === 'love' ? card.love_meaning_en || '' : mode === 'friendship' ? card.friendship_meaning_en || '' : card.career_meaning_en || ''
          }`;

    const prompt =
      lang === 'fr'
        ? `Tu es un expert tarologue bienveillant. Génère une interprétation JSON structurée pour la carte "${card.name_fr}" en mode "${mode}".

Sens de la carte:
${cardMeaning}

Retourne un JSON strict (VALIDE) avec cette structure:
{
  "summary": "Résumé de 2-3 lignes du message principal",
  "todayFocus": "Focus du jour (1 ligne)",
  "do": ["Action 1", "Action 2", "Action 3"],
  "avoid": ["À éviter 1", "À éviter 2"],
  "reflectionQuestion": "Question de méditation (1 ligne)",
  "themes": ["thème1", "thème2"],
  "safetyNote": "Ceci est une guidance spirituelle, pas un conseil personnel."
}

Ton: bienveillant, spirituel, encourageant. PAS de santé/juridique.`
        : `You are a caring tarot expert. Generate a structured JSON interpretation for the card "${card.name_en}" in mode "${mode}".

Card meaning:
${cardMeaning}

Return strict (VALID) JSON with this structure:
{
  "summary": "2-3 line summary of the main message",
  "todayFocus": "Today's focus (1 line)",
  "do": ["Action 1", "Action 2", "Action 3"],
  "avoid": ["Thing to avoid 1", "Thing to avoid 2"],
  "reflectionQuestion": "Meditation question (1 line)",
  "themes": ["theme1", "theme2"],
  "safetyNote": "This is spiritual guidance, not personal advice."
}

Tone: caring, spiritual, encouraging. NO health/legal.`;

    // Call InvokeLLM with timeout
    const aiResponse = await Promise.race([
      base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            todayFocus: { type: 'string' },
            do: { type: 'array', items: { type: 'string' } },
            avoid: { type: 'array', items: { type: 'string' } },
            reflectionQuestion: { type: 'string' },
            themes: { type: 'array', items: { type: 'string' } },
            safetyNote: { type: 'string' }
          }
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 35000))
    ]);

    const interpretation = typeof aiResponse === 'object' ? aiResponse : JSON.parse(aiResponse);

    if (!interpretation || !interpretation.summary) {
      throw new Error('Invalid interpretation from AI');
    }

    // Update DailyDraw with interpretation
    const draw = existingDraws[0];
    await serviceRole.entities.DailyDraw.update(draw.id, {
      interpretation_json: interpretation,
      themes: interpretation.themes || []
    });

    // Return without sensitive data
    return Response.json({
      success: true,
      interpretation
    });

  } catch (error) {
    console.error('[generate_interpretation] Error:', error.message);
    if (error.message === 'AI timeout') {
      return Response.json({ error: 'Délai d\'attente dépassé. Réessayez.' }, { status: 504 });
    }
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});