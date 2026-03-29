/**
 * generate_guidance — Backend function pour la génération de guidance quotidienne
 * Sécurité: appel InvokeLLM côté serveur, quota vérifié serveur, pas d'exposition de données
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
    if (!checkRateLimit(`guidance:${currentUser.email}`, 5, 60 * 60 * 1000)) {
      return Response.json({ error: 'Trop de requêtes — réessayez dans 1 heure' }, { status: 429 });
    }

    const body = await req.json();
    const { question, mode, lang, cardContext } = body;

    // Validation inputs
    if (!question || typeof question !== 'string' || question.trim().length < 10 || question.trim().length > 500) {
      return Response.json({ error: 'Question invalide (10-500 caractères)' }, { status: 400 });
    }

    if (!['amour', 'amitie', 'pro'].includes(mode)) {
      return Response.json({ error: 'Mode invalide' }, { status: 400 });
    }

    if (!['fr', 'en'].includes(lang)) {
      return Response.json({ error: 'Langue invalide' }, { status: 400 });
    }

    const serviceRole = base44.asServiceRole;

    // Vérifier abonnement actif
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

    // Vérifier quota: 1 guidance/jour (compter par day_key)
    const today = new Date().toISOString().split('T')[0];
    const todayGuidances = await serviceRole.entities.GuidanceAnswer.filter(
      {
        user_id: currentUser.email,
        day_key: today
      },
      null,
      1
    );

    if (todayGuidances.length > 0) {
      return Response.json({ error: 'Limite quotidienne atteinte — 1 guidance/jour' }, { status: 403 });
    }

    // Construire le prompt côté serveur
    const modeLabels = {
      amour: { fr: 'amour/rencontres', en: 'love/dating' },
      amitie: { fr: 'amitié', en: 'friendship' },
      pro: { fr: 'professionnel/carrière', en: 'professional/career' }
    };

    const cardInfo = cardContext
      ? lang === 'fr'
        ? `Carte du jour: ${cardContext.name_fr}. `
        : `Today's card: ${cardContext.name_en}. `
      : '';

    const prompt =
      lang === 'fr'
        ? `Tu es un guide bienveillant spécialisé en ${modeLabels[mode].fr}. ${cardInfo}Question: "${question}"

Réponds en 6-10 lignes max, structure:
1) Lecture rapide (2 lignes)
2) Conseils d'action aujourd'hui (3 bullets)
3) À éviter (2 bullets)
4) Question de recentrage (1 ligne)

Ton: clair, concret, bienveillant. PAS de santé/juridique/diagnostic. Suggérer, ne pas affirmer "certitudes".`
        : `You are a caring guide specialized in ${modeLabels[mode].en}. ${cardInfo}Question: "${question}"

Answer in 6-10 lines max, structure:
1) Quick reading (2 lines)
2) Action tips for today (3 bullets)
3) Things to avoid (2 bullets)
4) Centering question (1 line)

Tone: clear, concrete, caring. NO health/legal/diagnosis. Suggest, don't claim "certainties".`;

    // Call InvokeLLM with timeout
    const aiResponse = await Promise.race([
      base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 30000))
    ]);

    const answer =
      typeof aiResponse === 'string' ? aiResponse : aiResponse.response || aiResponse.text || '';

    if (!answer || answer.length < 50) {
      throw new Error('AI response too short or empty');
    }

    // Save to GuidanceAnswer via serviceRole
    const newGuidance = await serviceRole.entities.GuidanceAnswer.create({
      user_id: currentUser.email,
      mode: mode,
      day_key: today,
      question: question.substring(0, 240),
      answer: answer.substring(0, 1600),
      language: lang,
      card_context: cardContext || null
    });

    // Return without sensitive data
    return Response.json({
      success: true,
      guidance: {
        id: newGuidance.id,
        answer: newGuidance.answer,
        mode: newGuidance.mode,
        day_key: newGuidance.day_key
      }
    });

  } catch (error) {
    console.error('[generate_guidance] Error:', error.message);
    if (error.message === 'AI timeout') {
      return Response.json({ error: 'Délai d\'attente dépassé. Réessayez.' }, { status: 504 });
    }
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});