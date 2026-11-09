import { Player, Position, Formation } from '@/types/football-manager';

export type PositionalAffinityTier = 'perfect' | 'good' | 'fair' | 'poor' | 'disaster';

export interface PositionalAdaptationResult {
  naturalPosition: string;
  assignedRole: string;
  isNatural: boolean;
  isSecondary: boolean;
  penaltyOvr: number;
  effectiveOvr: number;
  performanceRatio: number; // Factor multiplicador para rendimiento en partido (0.35 a 1.0)
  affinityTier: PositionalAffinityTier;
  affinityLabel: string;
  affinityColor: string;
  badgeBg: string;
  description: string;
}

/**
 * Calcula el impacto en media y rendimiento de un jugador asignado a un rol táctico.
 * 
 * Reglas de sentido común futbolístico:
 * - Posición idéntica: 0 penalización (100% rendimiento).
 * - Posición secundaria: -1 media (98% rendimiento).
 * - Cambio de banda simétrica (EI <-> ED, LI <-> LD): -2 a -3 media (95-97% rendimiento).
 * - Adaptaciones naturales de línea (MCO <-> MC, MC <-> MCD, DC <-> MCO): -3 a -5 media (90-95% rendimiento).
 * - Cruces de línea severos (DC a DFC): -22 a -24 media (65% rendimiento).
 * - Caso crítico: Jugador de campo en portería (o portero en campo): -48 media (35% rendimiento).
 */
export function calculatePositionalAdaptation(
  player: Player,
  assignedRole: string
): PositionalAdaptationResult {
  const natural: string = player.position;
  const secondary: string | undefined = player.secondaryPosition;

  // 1. Posición natural exacta
  if (natural === assignedRole) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: true,
      isSecondary: false,
      penaltyOvr: 0,
      effectiveOvr: player.overall,
      performanceRatio: 1.0,
      affinityTier: 'perfect',
      affinityLabel: 'Posición Natural (100%)',
      affinityColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300',
      description: 'El jugador rinde al 100% de sus capacidades técnicas y tácticas.',
    };
  }

  // 2. Posición secundaria declarada
  if (secondary && secondary === assignedRole) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: true,
      penaltyOvr: 1,
      effectiveOvr: Math.max(30, player.overall - 1),
      performanceRatio: 0.98,
      affinityTier: 'good',
      affinityLabel: 'Posición Secundaria (-1)',
      affinityColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300',
      description: 'Conoce bien la posición como variante táctica. Apenas hay merma de rendimiento.',
    };
  }

  // 3. Caso MASIVO: Portero en el campo O Jugador de campo de Portero
  if (natural === 'POR' && assignedRole !== 'POR') {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 48,
      effectiveOvr: Math.max(30, player.overall - 48),
      performanceRatio: 0.35,
      affinityTier: 'disaster',
      affinityLabel: '¡Portero en el Campo! (-48)',
      affinityColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse',
      description: 'Carece de técnica de campo, regate y desmarque. Rendimiento drásticamente hundido.',
    };
  }

  if (natural !== 'POR' && assignedRole === 'POR') {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 48,
      effectiveOvr: Math.max(30, player.overall - 48),
      performanceRatio: 0.35,
      affinityTier: 'disaster',
      affinityLabel: '¡Jugador de Campo de Portero! (-48)',
      affinityColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse',
      description: 'No posee reflejos bajo palos ni estirada de guardameta. Encajará goles con facilidad.',
    };
  }

  // 4. Cambios de perfil / banda invertida (Muy poco impacto)
  const isWingInversion =
    (natural === 'EI' && assignedRole === 'ED') ||
    (natural === 'ED' && assignedRole === 'EI') ||
    (natural === 'MI' && assignedRole === 'MD') ||
    (natural === 'MD' && assignedRole === 'MI') ||
    (natural === 'MI' && assignedRole === 'EI') ||
    (natural === 'MD' && assignedRole === 'ED');

  if (isWingInversion) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 2,
      effectiveOvr: Math.max(30, player.overall - 2),
      performanceRatio: 0.97,
      affinityTier: 'good',
      affinityLabel: 'Banda Cambiada (-2)',
      affinityColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300',
      description: 'Juega a pie cambiado o en el flanco opuesto. Mantiene casi todo su desborde y media.',
    };
  }

  const isFullbackInversion =
    (natural === 'LI' && assignedRole === 'LD') ||
    (natural === 'LD' && assignedRole === 'LI') ||
    (natural === 'LI' && assignedRole === 'CAI') ||
    (natural === 'LD' && assignedRole === 'CAD') ||
    (natural === 'CAI' && assignedRole === 'LI') ||
    (natural === 'CAD' && assignedRole === 'LD');

  if (isFullbackInversion) {
    const penalty = (natural === 'LI' && assignedRole === 'CAI') || (natural === 'LD' && assignedRole === 'CAD') ? 1 : 3;
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: penalty,
      effectiveOvr: Math.max(30, player.overall - penalty),
      performanceRatio: 0.95,
      affinityTier: 'good',
      affinityLabel: `Carril Opuesto (-${penalty})`,
      affinityColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300',
      description: 'Adaptado en los carriles defensivos con buena solvencia.',
    };
  }

  // 5. Ajustes de Medular (MC, MCO, MCD, MI, MD)
  const isMidfieldInternal =
    (natural === 'MC' && ['MCO', 'MCD', 'MI', 'MD'].includes(assignedRole)) ||
    (natural === 'MCO' && assignedRole === 'MC') ||
    (natural === 'MCD' && assignedRole === 'MC') ||
    (['MI', 'MD'].includes(natural) && assignedRole === 'MC');

  if (isMidfieldInternal) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 3,
      effectiveOvr: Math.max(30, player.overall - 3),
      performanceRatio: 0.95,
      affinityTier: 'good',
      affinityLabel: 'Ajuste de Mediocampo (-3)',
      affinityColor: 'text-cyan-300',
      badgeBg: 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300',
      description: 'Mantiene buena distribución y visión, variando ligeramente sus obligaciones defensivas/ofensivas.',
    };
  }

  // Mediapunta a extremos o viceversa
  const isMcoWing =
    (natural === 'MCO' && ['EI', 'ED'].includes(assignedRole)) ||
    (['EI', 'ED'].includes(natural) && assignedRole === 'MCO');

  if (isMcoWing) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 4,
      effectiveOvr: Math.max(30, player.overall - 4),
      performanceRatio: 0.93,
      affinityTier: 'fair',
      affinityLabel: 'Mediapunta / Extremo (-4)',
      affinityColor: 'text-amber-300',
      badgeBg: 'bg-amber-950/50 border-amber-500/40 text-amber-300',
      description: 'Buena técnica para asociarse por dentro o por fuera, con menor zancada exterior.',
    };
  }

  // Delantero Centro a Extremo o Segundo Delantero
  const isStrikerToWing =
    (natural === 'DC' && ['EI', 'ED', 'MCO'].includes(assignedRole)) ||
    (['EI', 'ED'].includes(natural) && assignedRole === 'DC');

  if (isStrikerToWing) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 5,
      effectiveOvr: Math.max(30, player.overall - 5),
      performanceRatio: 0.92,
      affinityTier: 'fair',
      affinityLabel: 'Línea de Ataque Adaptada (-5)',
      affinityColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
      description: 'Conserva instinto goleador, aunque pierde fluidez en el timing de remate o desborde.',
    };
  }

  // Centrales y Pivotes defensivos
  const isDfcMcd =
    (natural === 'DFC' && assignedRole === 'MCD') ||
    (natural === 'MCD' && assignedRole === 'DFC');

  if (isDfcMcd) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 4,
      effectiveOvr: Math.max(30, player.overall - 4),
      performanceRatio: 0.93,
      affinityTier: 'fair',
      affinityLabel: 'Líbero / Pivote (-4)',
      affinityColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
      description: 'Mantiene contundencia defensiva y lectura aérea, pero cambia su rango de repliegue.',
    };
  }

  // Laterales a Central o Central a Lateral
  const isFullbackDfc =
    (['LI', 'LD'].includes(natural) && assignedRole === 'DFC') ||
    (natural === 'DFC' && ['LI', 'LD', 'CAI', 'CAD'].includes(assignedRole));

  if (isFullbackDfc) {
    const penalty = natural === 'DFC' ? 7 : 6;
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: penalty,
      effectiveOvr: Math.max(30, player.overall - penalty),
      performanceRatio: 0.88,
      affinityTier: 'fair',
      affinityLabel: `Zaga Recompuesta (-${penalty})`,
      affinityColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
      description: 'Diferencia en juego aéreo o velocidad en banda. Cumple en coberturas pero sufre.',
    };
  }

  // Desplazamiento de dos líneas (Medio a Lateral, o Extremo a Lateral)
  const isWingFullback =
    (['EI', 'ED'].includes(natural) && ['LI', 'LD', 'CAI', 'CAD'].includes(assignedRole)) ||
    (['LI', 'LD'].includes(natural) && ['EI', 'ED'].includes(assignedRole));

  if (isWingFullback) {
    const penalty = ['EI', 'ED'].includes(natural) ? 10 : 8;
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: penalty,
      effectiveOvr: Math.max(30, player.overall - penalty),
      performanceRatio: 0.83,
      affinityTier: 'poor',
      affinityLabel: `Carril Descompensado (-${penalty})`,
      affinityColor: 'text-orange-400',
      badgeBg: 'bg-orange-950/70 border-orange-500/60 text-orange-300',
      description: 'Desequilibrio marcado entre vocación ofensiva y rigor en la marca defensiva.',
    };
  }

  // Mediocentro a Central o Central a Mediocentro
  const isMcDfc =
    (['MC', 'MCO'].includes(natural) && assignedRole === 'DFC') ||
    (natural === 'DFC' && ['MC', 'MCO'].includes(assignedRole));

  if (isMcDfc) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 11,
      effectiveOvr: Math.max(30, player.overall - 11),
      performanceRatio: 0.80,
      affinityTier: 'poor',
      affinityLabel: 'Desubicado (-11)',
      affinityColor: 'text-orange-400',
      badgeBg: 'bg-orange-950/70 border-orange-500/60 text-orange-300',
      description: 'Líneas muy distantes. Descoordinación en la presión y posicionamiento táctico.',
    };
  }

  // Delantero a Mediocentro organizador
  const isStrikerMc =
    (natural === 'DC' && ['MC', 'MCD'].includes(assignedRole)) ||
    (['MCD'].includes(natural) && assignedRole === 'DC');

  if (isStrikerMc) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 14,
      effectiveOvr: Math.max(30, player.overall - 14),
      performanceRatio: 0.75,
      affinityTier: 'poor',
      affinityLabel: 'Fuera de Posición (-14)',
      affinityColor: 'text-orange-400',
      badgeBg: 'bg-orange-950/70 border-orange-500/60 text-orange-300',
      description: 'El futbolista está visiblemente desubicado y pierde gran parte de su efectividad.',
    };
  }

  // Cruce radical de extremos opuestos del campo (Delantero a Defensa o Defensa a Delantero)
  const isRadicalCross =
    (['DC', 'EI', 'ED'].includes(natural) && ['DFC'].includes(assignedRole)) ||
    (['DFC'].includes(natural) && ['DC', 'EI', 'ED'].includes(assignedRole)) ||
    (['LI', 'LD'].includes(natural) && ['DC'].includes(assignedRole)) ||
    (['DC'].includes(natural) && ['LI', 'LD'].includes(assignedRole));

  if (isRadicalCross) {
    const penalty = 24;
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: penalty,
      effectiveOvr: Math.max(30, player.overall - penalty),
      performanceRatio: 0.65,
      affinityTier: 'poor',
      affinityLabel: 'Incompatible (-24)',
      affinityColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/80 border-rose-500/70 text-rose-300',
      description: 'Incompatibilidad total de rol. Su aportación al equipo se reduce drásticamente.',
    };
  }

  // 6. Genérico por defecto para cualquier otra combinación atípica
  const genericPenalty = 15;
  return {
    naturalPosition: natural,
    assignedRole,
    isNatural: false,
    isSecondary: false,
    penaltyOvr: genericPenalty,
    effectiveOvr: Math.max(30, player.overall - genericPenalty),
    performanceRatio: 0.74,
    affinityTier: 'poor',
    affinityLabel: `Desadaptado (-${genericPenalty})`,
    affinityColor: 'text-orange-400',
    badgeBg: 'bg-orange-950/70 border-orange-500/60 text-orange-300',
    description: 'Juega en un sector del campo que desconoce casi por completo.',
  };
}

/**
 * Obtiene el rol táctico asignado a cada slot (0 a 10) según la formación elegida.
 */
export function getFormationRoles(formation: Formation): string[] {
  switch (formation) {
    case '4-3-3':
      return ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MC', 'MC', 'EI', 'DC', 'ED'];
    case '4-2-3-1':
      return ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MCD', 'EI', 'MCO', 'ED', 'DC'];
    case '4-4-2':
      return ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MI', 'MC', 'MC', 'MD', 'DC', 'DC'];
    case '3-5-2':
      return ['POR', 'DFC', 'DFC', 'DFC', 'CAI', 'MC', 'MC', 'CAD', 'MCO', 'DC', 'DC'];
    case '5-3-2':
      return ['POR', 'LI', 'DFC', 'DFC', 'DFC', 'LD', 'MC', 'MCD', 'MC', 'DC', 'DC'];
    default:
      return ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MC', 'MC', 'EI', 'DC', 'ED'];
  }
}
