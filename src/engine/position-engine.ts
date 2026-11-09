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

  // Ajuste natural de carrilero / interior de la misma banda
  const isWideMidWingback =
    (natural === 'MI' && ['CAI', 'LI'].includes(assignedRole)) ||
    (natural === 'MD' && ['CAD', 'LD'].includes(assignedRole)) ||
    (natural === 'CAI' && ['MI', 'EI'].includes(assignedRole)) ||
    (natural === 'CAD' && ['MD', 'ED'].includes(assignedRole));

  if (isWideMidWingback) {
    return {
      naturalPosition: natural,
      assignedRole,
      isNatural: false,
      isSecondary: false,
      penaltyOvr: 2,
      effectiveOvr: Math.max(30, player.overall - 2),
      performanceRatio: 0.96,
      affinityTier: 'good',
      affinityLabel: 'Carril / Banda Natural (-2)',
      affinityColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300',
      description: 'Misma banda longitudinal. Se desenvuelve con soltura alternando repliegue y subida.',
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
    (['LI', 'LD', 'CAI', 'CAD'].includes(natural) && ['DC'].includes(assignedRole)) ||
    (['DC'].includes(natural) && ['LI', 'LD', 'CAI', 'CAD'].includes(assignedRole));

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

/**
 * Optimiza el orden de los 11 titulares actuales para la formación indicada,
 * asignando a cada futbolista en la demarcación que minimiza penalizaciones
 * y maximiza su media efectiva.
 */
export function optimizeLineupPositions(starters: Player[], formation: Formation): Player[] {
  const roles = getFormationRoles(formation);
  if (starters.length !== 11) return starters;

  const unassigned = [...starters];
  const assigned: Player[] = new Array(11).fill(null as any);

  // 1. Asignar Slot 0 (POR): Priorizar portero natural o con mejores aptitudes
  let bestGkIdx = 0;
  let bestGkScore = -99999;
  unassigned.forEach((p, idx) => {
    let score = p.overall;
    if (p.position === 'POR') score += 1000;
    else score -= 50;
    if (score > bestGkScore) {
      bestGkScore = score;
      bestGkIdx = idx;
    }
  });
  assigned[0] = unassigned.splice(bestGkIdx, 1)[0];

  // 2. Asignación voraz para las 10 plazas de campo restantes
  const fieldRoleIndices = roles.slice(1).map((role, idx) => ({ role, slot: idx + 1 }));

  fieldRoleIndices.forEach(({ role, slot }) => {
    let bestPlayerIdx = 0;
    let bestScore = -99999;
    unassigned.forEach((p, idx) => {
      const adaptation = calculatePositionalAdaptation(p, role);
      // Puntuamos fuertemente que sea natural (sin penalización) y su media efectiva
      const score = adaptation.effectiveOvr * 10 - adaptation.penaltyOvr * 25;
      if (score > bestScore) {
        bestScore = score;
        bestPlayerIdx = idx;
      }
    });
    assigned[slot] = unassigned.splice(bestPlayerIdx, 1)[0];
  });

  // 3. Optimización 2-opt (intercambio por parejas) para alcanzar el máximo global
  let improved = true;
  let passes = 0;
  while (improved && passes < 12) {
    improved = false;
    passes++;
    for (let i = 1; i < 11; i++) {
      for (let j = i + 1; j < 11; j++) {
        const p1 = assigned[i];
        const p2 = assigned[j];
        const r1 = roles[i];
        const r2 = roles[j];

        const currentScore =
          calculatePositionalAdaptation(p1, r1).effectiveOvr +
          calculatePositionalAdaptation(p2, r2).effectiveOvr;

        const swappedScore =
          calculatePositionalAdaptation(p2, r1).effectiveOvr +
          calculatePositionalAdaptation(p1, r2).effectiveOvr;

        if (swappedScore > currentScore) {
          assigned[i] = p2;
          assigned[j] = p1;
          improved = true;
        }
      }
    }
  }

  return assigned;
}

/**
 * Selecciona automáticamente el mejor 11 de toda la plantilla del club para la formación dada,
 * más hasta 7 suplentes para el banquillo y el resto a reservas.
 */
export function selectBest11FromSquad(
  allClubPlayers: Player[],
  formation: Formation
): { startingXI: string[]; substitutes: string[] } {
  const roles = getFormationRoles(formation);

  // Separar jugadores disponibles (no sancionados y no lesionados)
  const available = allClubPlayers.filter((p) => !p.isBanned && (p.injuryWeeks || 0) === 0);
  const pool = available.length >= 11 ? [...available] : [...allClubPlayers];

  // 1. Portero
  const gks = pool.filter((p) => p.position === 'POR').sort((a, b) => b.overall - a.overall);
  const chosenGk = gks[0] || [...pool].sort((a, b) => b.overall - a.overall)[0];
  
  const chosenStarters: Player[] = [chosenGk];
  const remaining = pool.filter((p) => p.id !== chosenGk.id);

  // 2. Jugadores de campo (slots 1 a 10)
  for (let slot = 1; slot < 11; slot++) {
    const role = roles[slot];
    let bestIdx = 0;
    let bestScore = -99999;

    remaining.forEach((p, idx) => {
      const adapt = calculatePositionalAdaptation(p, role);
      const score = adapt.effectiveOvr * 10 - adapt.penaltyOvr * 20;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    if (remaining.length > 0) {
      chosenStarters.push(remaining.splice(bestIdx, 1)[0]);
    }
  }

  // Refinar posiciones del 11 elegido
  const optimizedStarters = optimizeLineupPositions(chosenStarters, formation);
  const starterIds = optimizedStarters.map((p) => p.id);

  // 3. Banquillo: los 7 mejores jugadores restantes de la plantilla
  const nonStarters = allClubPlayers.filter((p) => !starterIds.includes(p.id));
  const bench = nonStarters
    .sort((a, b) => {
      // Priorizar disponibles sobre lesionados/sancionados en el banquillo
      const aUnavailable = a.isBanned || (a.injuryWeeks || 0) > 0 ? 1 : 0;
      const bUnavailable = b.isBanned || (b.injuryWeeks || 0) > 0 ? 1 : 0;
      if (aUnavailable !== bUnavailable) return aUnavailable - bUnavailable;
      return b.overall - a.overall;
    })
    .slice(0, 7);

  const substituteIds = bench.map((p) => p.id);

  return {
    startingXI: starterIds,
    substitutes: substituteIds,
  };
}
