import { Player, Position, IndividualTrainingFocus, PositionConversionPlan } from '@/types/football-manager';

export interface TrainingFocusDetail {
  id: IndividualTrainingFocus;
  name: string;
  shortDesc: string;
  icon: string;
  boostedStats: string[];
}

export const TRAINING_FOCUS_CATALOG: TrainingFocusDetail[] = [
  {
    id: 'balanced',
    name: 'Equilibrado / General',
    shortDesc: 'Desarrollo uniforme de todos los atributos sin especialización.',
    icon: '⚖️',
    boostedStats: ['Todas las facetas'],
  },
  {
    id: 'finishing',
    name: 'Definición y Golpeo',
    shortDesc: 'Disparo de empeine, tiro colocado y frialdad ante puerta.',
    icon: '🎯',
    boostedStats: ['Tiro (+2)', 'Físico (+1)'],
  },
  {
    id: 'playmaking',
    name: 'Creación y Metavisión',
    shortDesc: 'Lectura espacial de líneas, pases filtrados y control de balón.',
    icon: '🔮',
    boostedStats: ['Pase (+2)', 'Regate (+1)'],
  },
  {
    id: 'dribbling_pace',
    name: 'Desborde y Aceleración',
    shortDesc: 'Velocidad en el cambio de ritmo, paso cero y regate eléctrico.',
    icon: '⚡',
    boostedStats: ['Ritmo (+2)', 'Regate (+1)'],
  },
  {
    id: 'defending_physical',
    name: 'Muro Defensivo y Presión',
    shortDesc: 'Contención física, tackle limpio y colocación en la zaga.',
    icon: '🛡️',
    boostedStats: ['Defensa (+2)', 'Físico (+1)'],
  },
  {
    id: 'goalkeeping_reflexes',
    name: 'Reflejos y Paradas',
    shortDesc: 'Estirada bajo palos, reacción felina y blocaje aéreo.',
    icon: '🧤',
    boostedStats: ['Portería (+2)', 'Físico (+1)'],
  },
];

export const ALL_POSITIONS: Position[] = [
  'POR',
  'LI',
  'DFC',
  'LD',
  'CAI',
  'CAD',
  'MCD',
  'MC',
  'MI',
  'MD',
  'MCO',
  'EI',
  'ED',
  'DC',
];

export function getPositionName(pos: Position): string {
  switch (pos) {
    case 'POR': return 'Portero';
    case 'LI': return 'Lateral Izquierdo';
    case 'DFC': return 'Defensa Central';
    case 'LD': return 'Lateral Derecho';
    case 'CAI': return 'Carrilero Izquierdo';
    case 'CAD': return 'Carrilero Derecho';
    case 'MCD': return 'Mediocentro Defensivo';
    case 'MC': return 'Mediocentro Organizador';
    case 'MI': return 'Medio Izquierdo (MI)';
    case 'MD': return 'Medio Derecho (MD)';
    case 'MCO': return 'Mediapunta Creativo';
    case 'EI': return 'Extremo Izquierdo';
    case 'ED': return 'Extremo Derecho';
    case 'DC': return 'Delantero Centro';
    default: return pos;
  }
}

export function getPositionCategory(pos: Position): 'POR' | 'DEF' | 'MED' | 'DEL' {
  if (pos === 'POR') return 'POR';
  if (['DFC', 'LI', 'LD', 'CAI', 'CAD'].includes(pos)) return 'DEF';
  if (['MCD', 'MC', 'MI', 'MD', 'MCO'].includes(pos)) return 'MED';
  return 'DEL';
}

/**
 * Calcula dinámicamente las jornadas necesarias para que un futbolista
 * complete su conversión a una nueva posición (sistema inspirado en FIFA / EA FC).
 * 
 * Variables tenidas en cuenta:
 * 1. Simetría y afinidad de demarcación (extremos entre sí o bandas es rápido; cruzado delantero/defensa es lento; portero es extremo).
 * 2. Edad del jugador (jóvenes < 20 aprenden en -30% tiempo; veteranos 30+ tardan +50%).
 * 3. Atributos afines del jugador hacia la posición objetivo.
 * 4. Nivel de Ego / determinación.
 */
export function calculateConversionWeeks(
  player: Player,
  targetPosition: Position
): {
  weeks: number;
  difficultyLabel: string;
  difficultyColor: string;
} {
  const current = player.position;
  if (current === targetPosition) {
    return { weeks: 0, difficultyLabel: 'Posición Actual', difficultyColor: 'text-slate-400' };
  }

  // 1. Duración base por distancia táctica
  let baseWeeks = 8;

  // A) Caso extremo: Arquero a campo o campo a arquero
  const isGkTransition = (current === 'POR' && targetPosition !== 'POR') || (current !== 'POR' && targetPosition === 'POR');

  // B) Si ya tiene la posición objetivo como secundaria
  const isAlreadySecondary = player.secondaryPosition === targetPosition;

  // C) Inversión de bandas laterales, carrileros o extremos
  const isWingInversion =
    (current === 'EI' && targetPosition === 'ED') ||
    (current === 'ED' && targetPosition === 'EI') ||
    (current === 'MI' && targetPosition === 'MD') ||
    (current === 'MD' && targetPosition === 'MI') ||
    (current === 'LI' && targetPosition === 'LD') ||
    (current === 'LD' && targetPosition === 'LI') ||
    (current === 'CAI' && targetPosition === 'CAD') ||
    (current === 'CAD' && targetPosition === 'CAI') ||
    (current === 'EI' && targetPosition === 'MI') ||
    (current === 'MI' && targetPosition === 'EI') ||
    (current === 'ED' && targetPosition === 'MD') ||
    (current === 'MD' && targetPosition === 'ED') ||
    (current === 'LI' && targetPosition === 'CAI') ||
    (current === 'CAI' && targetPosition === 'LI') ||
    (current === 'LD' && targetPosition === 'CAD') ||
    (current === 'CAD' && targetPosition === 'LD');

  // D) Continuidad natural de línea táctica
  const isLineExtension =
    (['DFC', 'MCD'].includes(current) && ['DFC', 'MCD'].includes(targetPosition)) ||
    (['MCD', 'MC'].includes(current) && ['MCD', 'MC'].includes(targetPosition)) ||
    (['MC', 'MCO'].includes(current) && ['MC', 'MCO'].includes(targetPosition)) ||
    (['MC', 'MI', 'MD'].includes(current) && ['MC', 'MI', 'MD'].includes(targetPosition)) ||
    (['MCO', 'MI', 'MD'].includes(current) && ['MCO', 'MI', 'MD'].includes(targetPosition)) ||
    (['LI', 'CAI', 'MI', 'EI'].includes(current) && ['LI', 'CAI', 'MI', 'EI'].includes(targetPosition)) ||
    (['LD', 'CAD', 'MD', 'ED'].includes(current) && ['LD', 'CAD', 'MD', 'ED'].includes(targetPosition)) ||
    (['DC', 'EI', 'ED', 'MCO'].includes(current) && ['DC', 'EI', 'ED', 'MCO'].includes(targetPosition));

  // E) Cruces de campo radicales opuestos
  const isRadicalCross =
    (['DC', 'EI', 'ED'].includes(current) && ['DFC'].includes(targetPosition)) ||
    (['DFC'].includes(current) && ['DC', 'EI', 'ED'].includes(targetPosition)) ||
    (['LI', 'LD', 'CAI', 'CAD'].includes(current) && ['DC'].includes(targetPosition)) ||
    (['DC'].includes(current) && ['LI', 'LD', 'CAI', 'CAD'].includes(targetPosition));

  if (isGkTransition) {
    baseWeeks = 35; // Requiere una dedicación extrema (más de una temporada completa)
  } else if (isAlreadySecondary) {
    baseWeeks = 2; // Ya posee fundamentos de la posición
  } else if (isWingInversion) {
    baseWeeks = 3; // Muy rápido: solo adaptación de perfil o banda simétrica
  } else if (isLineExtension) {
    baseWeeks = 4; // Rápido y asequible: misma franja longitudinal o medular adyacente
  } else if (isRadicalCross) {
    baseWeeks = 16; // Largo: reconversión de mentalidad total
  } else {
    baseWeeks = 8; // Desplazamiento medio
  }

  // 2. Modificador por edad (Jóvenes son esponjas tácticas; veteranos tienen automatismos fijos)
  let ageMod = 1.0;
  if (player.age <= 19) ageMod = 0.70;
  else if (player.age <= 22) ageMod = 0.85;
  else if (player.age <= 27) ageMod = 1.00;
  else if (player.age <= 30) ageMod = 1.25;
  else ageMod = 1.50;

  // 3. Modificador por atributos acordes a la nueva posición
  let statBonus = 0;
  const s = player.stats;
  if (targetPosition === 'DFC') {
    const avg = (s.defense + s.physical) / 2;
    if (avg >= 78) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'MCD') {
    const avg = (s.defense + s.passing) / 2;
    if (avg >= 78) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'MC' || targetPosition === 'MCO') {
    const avg = (s.passing + s.dribbling) / 2;
    if (avg >= 78) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'MI' || targetPosition === 'MD') {
    const avg = (s.pace + s.passing + s.dribbling) / 3;
    if (avg >= 76) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'CAI' || targetPosition === 'CAD') {
    const avg = (s.pace + s.defense + s.passing) / 3;
    if (avg >= 76) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'EI' || targetPosition === 'ED') {
    const avg = (s.pace + s.dribbling) / 2;
    if (avg >= 80) statBonus = -2;
    else if (avg < 60) statBonus = 2;
  } else if (targetPosition === 'DC') {
    const avg = (s.shooting + s.physical) / 2;
    if (avg >= 78) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'LI' || targetPosition === 'LD') {
    const avg = (s.pace + s.defense) / 2;
    if (avg >= 78) statBonus = -2;
    else if (avg < 55) statBonus = 2;
  } else if (targetPosition === 'POR') {
    if (s.goalkeeping >= 60) statBonus = -3;
    else statBonus = 3;
  }

  // 4. Modificador de Ego
  let egoBonus = 0;
  if (player.egoRating >= 90) egoBonus = -1;

  let totalWeeks = Math.round(baseWeeks * ageMod) + statBonus + egoBonus;
  totalWeeks = Math.max(2, totalWeeks);

  // Clasificación de dificultad
  let difficultyLabel = 'Moderado';
  let difficultyColor = 'text-amber-400';

  if (totalWeeks <= 3) {
    difficultyLabel = 'Muy Rápido';
    difficultyColor = 'text-emerald-400';
  } else if (totalWeeks <= 6) {
    difficultyLabel = 'Rápido';
    difficultyColor = 'text-cyan-400';
  } else if (totalWeeks <= 12) {
    difficultyLabel = 'Moderado';
    difficultyColor = 'text-amber-400';
  } else if (totalWeeks <= 20) {
    difficultyLabel = 'Largo';
    difficultyColor = 'text-orange-400';
  } else {
    difficultyLabel = 'Extremo';
    difficultyColor = 'text-rose-400';
  }

  return {
    weeks: totalWeeks,
    difficultyLabel,
    difficultyColor,
  };
}

/**
 * Inicia el plan de conversión de posición para un futbolista.
 */
export function startPositionConversion(player: Player, targetPosition: Position): Player {
  const { weeks } = calculateConversionWeeks(player, targetPosition);
  const conversionPlan: PositionConversionPlan = {
    targetPosition,
    totalWeeks: weeks,
    weeksElapsed: 0,
  };

  return {
    ...player,
    positionConversion: conversionPlan,
  };
}

/**
 * Cancela el plan de conversión de posición activo.
 */
export function cancelPositionConversion(player: Player): Player {
  return {
    ...player,
    positionConversion: null,
  };
}

/**
 * Actualiza el enfoque de entrenamiento personal del futbolista.
 */
export function setPlayerTrainingFocus(player: Player, focus: IndividualTrainingFocus): Player {
  return {
    ...player,
    trainingFocus: focus,
  };
}
