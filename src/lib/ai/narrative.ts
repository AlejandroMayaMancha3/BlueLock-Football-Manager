import Groq from 'groq-sdk';
import { SimulationResult } from '@/engine/match-simulator';

export interface EgoCritiqueResponse {
  speaker: 'Ego Jinpachi';
  title: string;
  critique: string;
  egoAdvice: string;
  evaluatedPlayerRatingTitle: string;
  isAiGenerated: boolean;
  modelUsed: string;
}

/**
 * Procedural Fallback Dialog Generator
 * Produces authentic Jinpachi Ego dialogues and tactical critiques without any API Key or cost.
 */
function generateProceduralEgoCritique(
  matchResult: SimulationResult,
  focusPlayerName?: string
): EgoCritiqueResponse {
  const { homeClub, awayClub, homeScore, awayScore, summary } = matchResult;
  const motm = summary.manOfTheMatch;
  const totalGoals = homeScore + awayScore;
  const isHighScoring = totalGoals >= 4;
  const isCleanSheet = homeScore === 0 || awayScore === 0;
  const player = focusPlayerName
    ? Object.values(matchResult.playerStats).find(
        (p) => p.name.toLowerCase() === focusPlayerName.toLowerCase()
      ) || motm
    : motm;

  // Title templates
  const titles = [
    'Lección del Master Jinpachi: La Anatomía del Ego',
    'Auditoría Táctica: ¿Delantero Revolucionario o Comida para Tiburones?',
    'Sala de Prensa Blue Lock: El Despertar de los Instintos',
    'El Veredicto de Jinpachi: Desglose Post-Partido',
  ];
  const title = titles[Math.floor(Math.random() * titles.length)];

  // Rating Titles based on performance
  let ratingTitle = 'Diamante en Bruto (Unpolished Diamond)';
  if (player.rating >= 9.0 || player.goals >= 2) {
    ratingTitle = 'Monstruo del Despertar Egoísta (True Egoist)';
  } else if (player.rating >= 7.5 || player.goals === 1) {
    ratingTitle = 'Cazador de Oportunidades (Ego Awakening)';
  } else if (player.rating < 6.5) {
    ratingTitle = 'Basura Sin Ego (Complacent Mediocrity)';
  }

  // Critique building blocks in authentic Spanish Jinpachi Ego lore
  let opening = `¡Prestad atención, diamantes en bruto! `;
  if (player.goals >= 2) {
    opening += `¿Creéis que haber perforado la red dos veces os convierte en dioses? ¡Qué patético autoengaño! `;
  } else if (player.goals === 1) {
    opening += `Un solitario gol en 90 minutos... apenas una chispa en la oscuridad del fútbol mundial. `;
  } else {
    opening += `Cero goles en el casillero. Si un delantero sale del campo sin anotar, es exactamente igual a no haber nacido. `;
  }

  let tacticalBody = '';
  if (player.flowActivated) {
    tacticalBody = `Vi ese destello en tus ojos: el estado de Flow. Cuando el reto supera tus capacidades y te ves forzado a devorar tus propios límites, la química cerebral responde. Pero el Flow no es un milagro fortuito; es una fórmula matemática que debes ser capaz de recrear a voluntad cada vez que pises el césped de la Neo Egoist League. `;
  } else if (player.chemicalReactionsCount > 0) {
    tacticalBody = `Hubo momentos de sincronización en el campo: reacciones químicas espontáneas. Entendiste que para devorar a tu compañero primero debes inducir su mayor brillo y luego usar su sombra para desaparecer de la visión periférica de los centrales. `;
  } else {
    tacticalBody = `Tu juego carece de fórmula reproducible. Estabas esperando pasivamente a que el balón te cayera en los pies como un delantero de instituto mediocre. En el fútbol de élite europeo, si no manipulas el espacio con Metavisión y no impones tu punto ciego, eres invisible. `;
  }

  const matchSummaryNote = `El marcador final de ${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name} no miente. Los ojeadores de Europa han puesto sus ofertas sobre la mesa en función de vuestra hambre destructiva, no de vuestra simpatía.`;

  const fullCritique = `${opening}${tacticalBody}${matchSummaryNote}`;

  // Actionable advice
  const adviceList = [
    `"Deja de jugar para el equipo. Obliga al equipo a estructurarse para servir a tu tiro directo. Si no te la pasan, conviértete en la única opción matemática que garantice el gol."`,
    `"Amplía tu campo de percepción. Con Metavisión no solo miras el balón; fijas el cuello como un radar cada dos segundos para cartografiar el punto ciego del defensa más peligroso."`,
    `"El instinto depredador (Predator Eye) no busca el espectáculo; acecha inmóvil hasta que el portero balancea su centro de gravedad. En ese milisegundo exacto, disparas a contrapié."`,
    `"Si tus armas actuales están siendo neutralizadas por centrales de talla mundial, no intentes ganarles en su terreno: evoluciona tu armamento en el descanso o quédate en el banquillo para siempre."`,
  ];
  const egoAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];

  return {
    speaker: 'Ego Jinpachi',
    title,
    critique: fullCritique,
    egoAdvice,
    evaluatedPlayerRatingTitle: ratingTitle,
    isAiGenerated: false,
    modelUsed: 'Procedural Ego Narrative Engine (Offline Fallback)',
  };
}

/**
 * Main Narrative Evaluator: Calls Groq / Gemini with instant procedural fallback
 */
export async function generateEgoMatchCritique(
  matchResult: SimulationResult,
  focusPlayerName?: string
): Promise<EgoCritiqueResponse> {
  const groqApiKey = process.env.GROQ_API_KEY;

  // If no API key provided, immediately return high-fidelity procedural narrative without network overhead
  if (!groqApiKey || groqApiKey.trim() === '' || groqApiKey === 'placeholder-groq-key') {
    return generateProceduralEgoCritique(matchResult, focusPlayerName);
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey });

    const keyEventsSummary = matchResult.events
      .slice(-6)
      .map((e) => `[Minuto ${e.minute}] ${e.description}`)
      .join('\n');

    const prompt = `
Eres Ego Jinpachi, el director y creador del proyecto Blue Lock. Tu personalidad es fría, hiper-racional, mordaz, obsesionada con el egoísmo puro, las fórmulas matemáticas de gol, las "armas" futbolísticas (Metavisión, Direct Shot, Predator Eye, Speed Burst), el estado de Flow y la aniquilación de la mediocridad japonesa.

Detalles del partido simulado:
- Encuentro: ${matchResult.homeClub.name} ${matchResult.homeScore} vs ${matchResult.awayScore} ${matchResult.awayClub.name}
- Torneo: Neo Egoist League
- Jugador Destacado / En Foco: ${focusPlayerName || matchResult.summary.manOfTheMatch.name}
- Valoración (Rating): ${matchResult.summary.manOfTheMatch.rating.toFixed(1)}/10
- Goles: ${matchResult.summary.manOfTheMatch.goals}, Asistencias: ${matchResult.summary.manOfTheMatch.assists}
- Flow Desbloqueado: ${matchResult.summary.flowActivations.join(', ') || 'Ninguno'}
- Reacciones Químicas: ${matchResult.summary.totalChemicalReactions}
- Eventos clave:
${keyEventsSummary}

Instrucciones:
Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "title": "Un titular llamativo y hostil al estilo Ego",
  "critique": "Tu análisis táctico de 2 a 3 párrafos en primera persona, llamando 'diamantes en bruto' a los jugadores, analizando si usaron su ego o jugaron con complacencia.",
  "egoAdvice": "Un consejo táctico contundente en una o dos frases entrecomilladas sobre cómo devorar al rival o afilar sus armas.",
  "evaluatedPlayerRatingTitle": "Un título corto para el jugador (ej: Monstruo Despertado, Basura Sin Ego, Depredador de Área)"
}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres Ego Jinpachi de Blue Lock. Analizas partidos de fútbol con frialdad implacable y devoción al egoísmo. Siempre devuelves JSON estricto sin backticks de markdown adicionales.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return generateProceduralEgoCritique(matchResult, focusPlayerName);
    }

    const parsed = JSON.parse(responseContent);

    return {
      speaker: 'Ego Jinpachi',
      title: parsed.title || 'Veredicto de Jinpachi',
      critique: parsed.critique || 'Habéis jugado como peones sin visión...',
      egoAdvice: parsed.egoAdvice || 'Devora a tus compañeros o muere en el banquillo.',
      evaluatedPlayerRatingTitle: parsed.evaluatedPlayerRatingTitle || 'Diamante en Bruto',
      isAiGenerated: true,
      modelUsed: 'Groq (Llama-3.3-70b-versatile)',
    };
  } catch (error) {
    // If rate limit (HTTP 429), quota exceeded, network drop, or invalid key:
    // Gracefully fallback to procedural narrative engine with ZERO errors shown to the player
    console.warn('[BlueLock AI] Groq API unavailable or rate-limited. Activating procedural fallback:', error);
    return generateProceduralEgoCritique(matchResult, focusPlayerName);
  }
}
