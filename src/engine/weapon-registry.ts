import { Player, Weapon, Position } from '@/types/football-manager';

export interface WeaponTemplate {
  name: string;
  type: 'striker' | 'vision' | 'speed' | 'physical' | 'gk' | 'dribble' | 'defense';
  dominantStat: 'shooting' | 'passing' | 'dribbling' | 'pace' | 'defense' | 'physical' | 'goalkeeping';
  positions: Position[];
  minLevel: number;
  maxLevel: number;
  description: string;
}

// Catálogo maestro de armas por posición y arquetipo
export const WEAPON_CATALOG: WeaponTemplate[] = [
  // --- DELANTEROS Y REMATADORES (STRIKER / FINISHING) ---
  {
    name: 'Cañón de Volea Espacial',
    type: 'striker',
    dominantStat: 'shooting',
    positions: ['DC', 'EI', 'ED'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Empalma el cuero en el aire sin dejarlo caer con un golpeo de empeine limpio y rotundo.',
  },
  {
    name: 'Disparo en Bucle Imposible',
    type: 'striker',
    dominantStat: 'shooting',
    positions: ['DC', 'MCO', 'EI', 'ED'],
    minLevel: 88,
    maxLevel: 94,
    description: 'Vaselina liftada con parábola descendente fulminante sobre el meta adelantado.',
  },
  {
    name: 'Giro Ciego de Depredador',
    type: 'striker',
    dominantStat: 'dribbling',
    positions: ['DC'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Remate a la media vuelta en una fracción de segundo dentro del área chica desconcertando a los centrales.',
  },
  {
    name: 'Talonazo Fantasma',
    type: 'striker',
    dominantStat: 'dribbling',
    positions: ['DC', 'EI', 'ED'],
    minLevel: 88,
    maxLevel: 93,
    description: 'Recurso técnico imprevisto de tacón al primer toque para descolocar al guardameta rival.',
  },
  {
    name: 'Artillería Pesada Lejana',
    type: 'striker',
    dominantStat: 'physical',
    positions: ['DC', 'MC', 'MCO'],
    minLevel: 90,
    maxLevel: 96,
    description: 'Zapatazo con trayectoria recta sin rotación (knuckleball) letal desde más de 25 metros.',
  },
  {
    name: 'Definición Quirúrgica al Poste',
    type: 'striker',
    dominantStat: 'shooting',
    positions: ['DC', 'EI', 'ED', 'MCO'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Toque milimétrico con el interior del pie rasante y pegado a la base del palo.',
  },
  {
    name: 'Cabezazo en Suspensión Aérea',
    type: 'striker',
    dominantStat: 'physical',
    positions: ['DC'],
    minLevel: 88,
    maxLevel: 94,
    description: 'Vuelo imponente suspendido en el aire para rematar picado imponiendo su potencia física.',
  },

  // --- MEDIAPUNTAS Y CREADORES (VISION & PASSING) ---
  {
    name: 'Pase en Ruptura Láser',
    type: 'vision',
    dominantStat: 'passing',
    positions: ['MCO', 'MC', 'MCD'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Envío rasante con efecto milimétrico que perfora dos líneas defensivas a la carrera del delantero.',
  },
  {
    name: 'Radar Periférico Total',
    type: 'vision',
    dominantStat: 'passing',
    positions: ['MCO', 'MC'],
    minLevel: 90,
    maxLevel: 96,
    description: 'Mapeo constante de los 360 grados del campo que detecta al instante los puntos ciegos de la zaga.',
  },
  {
    name: 'Trazado Triangulado',
    type: 'vision',
    dominantStat: 'passing',
    positions: ['MC', 'MCO', 'MCD'],
    minLevel: 88,
    maxLevel: 93,
    description: 'Paredes ultrarrápidas al primer toque calculando el ángulo de rebote perfecto para progresar.',
  },
  {
    name: 'Centro de Rosca Venenosa',
    type: 'vision',
    dominantStat: 'passing',
    positions: ['EI', 'ED', 'LI', 'LD', 'MCO'],
    minLevel: 88,
    maxLevel: 94,
    description: 'Envío tenso y con comba hacia afuera al corazón del área imposible de despejar de frente.',
  },
  {
    name: 'Pase sin Mirar al Vacío',
    type: 'vision',
    dominantStat: 'passing',
    positions: ['MCO', 'MC', 'EI', 'ED'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Filtra el esférico mirando al lado opuesto hacia el espacio que su compañero atacará.',
  },

  // --- EXTREMOS Y REGATEADORES (SPEED & DRIBBLE) ---
  {
    name: 'Aceleración de Paso Cero',
    type: 'speed',
    dominantStat: 'pace',
    positions: ['EI', 'ED', 'DC', 'LI', 'LD'],
    minLevel: 90,
    maxLevel: 96,
    description: 'Arrancada instantánea explosiva desde parado sin inclinación previa, reventando la marca.',
  },
  {
    name: 'Regate Elástico Callejero',
    type: 'dribble',
    dominantStat: 'dribbling',
    positions: ['EI', 'ED', 'MCO'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Finta exterior-interior en una baldosa desarmando el centro de gravedad del marcador.',
  },
  {
    name: 'Corte Diagonal Fulgurante',
    type: 'speed',
    dominantStat: 'pace',
    positions: ['EI', 'ED'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Incursión en diagonal desde la cal hacia el carril interior para armar el disparo en décimas.',
  },
  {
    name: 'Freno de Ancla y Quiebro',
    type: 'dribble',
    dominantStat: 'dribbling',
    positions: ['EI', 'ED', 'MCO'],
    minLevel: 88,
    maxLevel: 93,
    description: 'Detención en seco a máxima velocidad provocando el desequilibrio y caída del defensor.',
  },
  {
    name: 'Pase de la Muerte Rasante',
    type: 'dribble',
    dominantStat: 'pace',
    positions: ['EI', 'ED', 'LI', 'LD'],
    minLevel: 88,
    maxLevel: 93,
    description: 'Desborde supersónico hasta la línea de fondo y envío diagonal hacia atrás al corazón del área.',
  },

  // --- MEDIOCENTROS Y PIVOTES (PHYSICAL & DEFENSE) ---
  {
    name: 'Pared de Contención Blindada',
    type: 'defense',
    dominantStat: 'defense',
    positions: ['MCD', 'MC', 'DFC'],
    minLevel: 89,
    maxLevel: 94,
    description: 'Tackle firme y limpio que frena en seco la progresión frontal del mediapunta rival.',
  },
  {
    name: 'Cadencia Metronómica',
    type: 'physical',
    dominantStat: 'physical',
    positions: ['MC', 'MCD'],
    minLevel: 88,
    maxLevel: 94,
    description: 'Control absoluto del tempo del partido, acelerando o pausando el balón a conveniencia.',
  },
  {
    name: 'Escudo Centrífugo',
    type: 'physical',
    dominantStat: 'physical',
    positions: ['MCD', 'MC', 'DC'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Protección férrea del balón con los brazos y el tren inferior imposibilitando el robo rival.',
  },
  {
    name: 'Caza Furtiva de Balones',
    type: 'defense',
    dominantStat: 'defense',
    positions: ['MCD', 'MC'],
    minLevel: 88,
    maxLevel: 93,
    description: 'Asedio y acoso incesante sobre el receptor rival antes de que complete el control orientado.',
  },

  // --- DEFENSAS CENTRALES Y LATERALES (DEFENSE) ---
  {
    name: 'Negación de Espacio Absoluto',
    type: 'defense',
    dominantStat: 'defense',
    positions: ['DFC', 'LI', 'LD'],
    minLevel: 90,
    maxLevel: 96,
    description: 'Colocación milimétrica cerrando la línea de remate más peligrosa antes de que se arme el tiro.',
  },
  {
    name: 'Barrida Deslizante Quirúrgica',
    type: 'defense',
    dominantStat: 'defense',
    positions: ['DFC', 'LI', 'LD', 'MCD'],
    minLevel: 89,
    maxLevel: 94,
    description: 'Recuperación limpia a ras de césped arrastrando el balón sin cometer falta.',
  },
  {
    name: 'Salto de Muralla Imponente',
    type: 'defense',
    dominantStat: 'physical',
    positions: ['DFC'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Despeje aéreo imperioso en saques de esquina y balones bombeados hacia el área.',
  },
  {
    name: 'Anticipación de Vectores',
    type: 'defense',
    dominantStat: 'defense',
    positions: ['DFC', 'LI', 'LD', 'MCD'],
    minLevel: 88,
    maxLevel: 94,
    description: 'Lectura de la biomecánica del pasador interceptando la línea de pase antes de que nazca el balón.',
  },

  // --- GUARDAMETAS (GOALKEEPER) ---
  {
    name: 'Extensión Elástica de Brazos',
    type: 'gk',
    dominantStat: 'goalkeeping',
    positions: ['POR'],
    minLevel: 89,
    maxLevel: 95,
    description: 'Estirada acrobática a mano cambiada desviando el esférico justo cuando buscaba la escuadra.',
  },
  {
    name: 'Reflejos Felinos a Bocajarro',
    type: 'gk',
    dominantStat: 'goalkeeping',
    positions: ['POR'],
    minLevel: 90,
    maxLevel: 96,
    description: 'Reacción instintiva felina con extremidades inferiores y brazos ante remates a quemarropa.',
  },
  {
    name: 'Salida en Cruz Monolítica',
    type: 'gk',
    dominantStat: 'goalkeeping',
    positions: ['POR'],
    minLevel: 89,
    maxLevel: 94,
    description: 'Cobertura total en el uno contra uno achicando ángulo al delantero con el cuerpo estirado en cruz.',
  },
  {
    name: 'Agarre Seguro de Garras',
    type: 'gk',
    dominantStat: 'goalkeeping',
    positions: ['POR'],
    minLevel: 88,
    maxLevel: 93,
    description: 'Atrapada aérea firme sin conceder segundas jugadas ni rechaces peligrosos en el área chica.',
  },
];

/**
 * Identifica si un jugador es considerado "Prodigio" en Blue Lock.
 * Condición: Edad <= 20 años y Potencial >= 90 (promesas de élite/mundial).
 */
export function checkIsProdigy(player: Player): boolean {
  return player.age <= 20 && player.potential >= 90;
}

/**
 * Evalúa si un jugador cumple los requisitos para despertar un arma de Ego.
 */
export function shouldAwakenWeapon(player: Player): {
  awaken: boolean;
  isSecondary: boolean;
  reason?: 'consagracion' | 'prodigio' | 'epifania';
} {
  const currentWeapons = player.weapons || [];

  // Si no tiene armas:
  if (currentWeapons.length === 0) {
    // Pilar 1: Consagración por Media (>= 88)
    if (player.overall >= 88) {
      return { awaken: true, isSecondary: false, reason: 'consagracion' };
    }
    // Pilar 2: Prodigio Precoz (Edad <= 20, Potencial >= 90, y media >= 80 o potencial >= 94 con edad <= 18)
    if (checkIsProdigy(player)) {
      if (player.overall >= 80 || (player.potential >= 94 && player.age <= 18)) {
        return { awaken: true, isSecondary: false, reason: 'prodigio' };
      }
    }
    return { awaken: false, isSecondary: false };
  }

  // Si ya tiene 1 arma y es un Prodigio Consagrado (>= 90 de media):
  if (currentWeapons.length === 1 && checkIsProdigy(player) && player.overall >= 90) {
    // 40% de probabilidad de forjar una segunda arma de complemento (estilo Isagi / Kaiser / Rin)
    return { awaken: true, isSecondary: true, reason: 'prodigio' };
  }

  return { awaken: false, isSecondary: false };
}

/**
 * Genera contextualmente un arma de Ego para un jugador según su posición, arquetipo y estadísticas dominantes.
 */
export function generateContextualWeapon(player: Player, isSecondary = false): Weapon {
  const existingNames = (player.weapons || []).map((w) => w.name.toLowerCase());

  // Candidatas según posición
  let candidates = WEAPON_CATALOG.filter(
    (tmpl) => tmpl.positions.includes(player.position) && !existingNames.includes(tmpl.name.toLowerCase())
  );

  // Si no hay candidatos específicos, abrir a cualquier arma no poseída que encaje por tipo
  if (candidates.length === 0) {
    candidates = WEAPON_CATALOG.filter((tmpl) => !existingNames.includes(tmpl.name.toLowerCase()));
  }

  // Ponderar por las estadísticas más fuertes del jugador
  const stats = player.stats;
  const scoredCandidates = candidates.map((tmpl) => {
    let statScore = 70;
    switch (tmpl.dominantStat) {
      case 'shooting':
        statScore = stats.shooting;
        break;
      case 'passing':
        statScore = stats.passing;
        break;
      case 'dribbling':
        statScore = stats.dribbling;
        break;
      case 'pace':
        statScore = stats.pace;
        break;
      case 'defense':
        statScore = stats.defense;
        break;
      case 'physical':
        statScore = stats.physical;
        break;
      case 'goalkeeping':
        statScore = stats.goalkeeping;
        break;
    }

    // Si es secundaria, preferir un tipo diferente al que ya tiene
    let bonusType = 0;
    if (isSecondary && player.weapons?.[0]) {
      if (tmpl.type !== player.weapons[0].type) {
        bonusType = 15;
      }
    }

    return {
      template: tmpl,
      score: statScore + bonusType + Math.random() * 10,
    };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);
  const selectedTemplate = scoredCandidates[0]?.template || WEAPON_CATALOG[0];

  // Calcular nivel del arma calibrado a la media y ego del jugador
  const baseLvl = Math.max(selectedTemplate.minLevel, Math.min(selectedTemplate.maxLevel, player.overall + Math.floor(Math.random() * 4)));
  const finalLevel = Math.min(99, Math.max(85, baseLvl));

  return {
    name: selectedTemplate.name,
    type: selectedTemplate.type,
    level: finalLevel,
    description: selectedTemplate.description,
  };
}

/**
 * Reacciones Químicas Equilibradas (Chemical Reactions).
 * Otorga bonificaciones moderadas (+12 a +18 puntos porcentuales) sin desequilibrar el partido.
 */
export interface ChemicalReactionResult {
  triggered: boolean;
  name: string;
  boost: number;
  narrative: string;
}

export function checkBalancedChemicalReaction(p1: Player, p2: Player): ChemicalReactionResult | null {
  if (!p1 || !p2 || p1.id === p2.id) return null;

  const w1Names = (p1.weapons || []).map((w) => w.name.toLowerCase());
  const w1Types = (p1.weapons || []).map((w) => w.type.toLowerCase());
  const w2Names = (p2.weapons || []).map((w) => w.name.toLowerCase());
  const w2Types = (p2.weapons || []).map((w) => w.type.toLowerCase());

  const has1 = (term: string) => w1Names.some((n) => n.includes(term)) || w1Types.some((t) => t.includes(term));
  const has2 = (term: string) => w2Names.some((n) => n.includes(term)) || w2Types.some((t) => t.includes(term));

  // 1. Sincronía a Velocidad Luz: Visión / Pase filtrado + Velocidad punta
  if ((has1('visión') || has1('vision') || has1('láser') || has1('laser') || has1('metavision')) && (has2('velocidad') || has2('speed') || has2('aceleración') || has2('paso cero'))) {
    return {
      triggered: true,
      name: 'Sincronía a Velocidad Luz',
      boost: 15,
      narrative: `⚡ ¡REACCIÓN QUÍMICA [Sincronía a Velocidad Luz]! ${p1.name} y ${p2.name} conectan el pase en profundidad con la aceleración punta, perforando la zaga rival.`,
    };
  }

  // 2. Asalto Aéreo Coordinado: Centro con rosca / comba + Remate aéreo de cabeza
  if ((has1('centro') || has1('rosca') || has1('vision') || has1('pase')) && (has2('cabezazo') || has2('suspensión') || has2('aérea') || has2('striker'))) {
    return {
      triggered: true,
      name: 'Asalto Aéreo Coordinado',
      boost: 16,
      narrative: `⚡ ¡REACCIÓN QUÍMICA [Asalto Aéreo Coordinado]! El centro templado de ${p1.name} encuentra el vuelo imponente de ${p2.name} en el punto álgido del área.`,
    };
  }

  // 3. Geometría del Gol Frío: Radar periférico / lectura + Definición al poste / Direct shot
  if ((has1('radar') || has1('periférico') || has1('metavision')) && (has2('quirúrgica') || has2('direct') || has2('depredador') || has2('striker'))) {
    return {
      triggered: true,
      name: 'Geometría del Gol Frío',
      boost: 14,
      narrative: `⚡ ¡REACCIÓN QUÍMICA [Geometría del Gol Frío]! ${p1.name} detecta el ángulo muerto de la portería y ${p2.name} ajusta el impacto raso milimétricamente.`,
    };
  }

  // 4. Pivoteo Destructivo: Físico / Escudo de espaldas + Volea / Artillería
  if ((has1('escudo') || has1('físico') || has1('physical')) && (has2('volea') || has2('artillería') || has2('cañón') || has2('striker'))) {
    return {
      triggered: true,
      name: 'Pivoteo Destructivo',
      boost: 15,
      narrative: `⚡ ¡REACCIÓN QUÍMICA [Pivoteo Destructivo]! ${p1.name} protege el balón de espaldas y descarga para el cañonazo imparable de ${p2.name}.`,
    };
  }

  // 5. Transición Relámpago: Robo limpio de pivote + Carrera supersónica de extremo
  if ((has1('contención') || has1('defense') || has1('tackle')) && (has2('corte') || has2('elástico') || has2('dribble') || has2('speed'))) {
    return {
      triggered: true,
      name: 'Transición Relámpago',
      boost: 13,
      narrative: `⚡ ¡REACCIÓN QUÍMICA [Transición Relámpago]! Recuperación quirúrgica de ${p1.name} y contragolpe fulminante conducido por ${p2.name}.`,
    };
  }

  // Sinergia Genérica de Alto Ego (si ambos tienen Ego >= 85)
  if (p1.egoRating >= 85 && p2.egoRating >= 85 && Math.random() < 0.25) {
    return {
      triggered: true,
      name: 'Colisión de Egos Resonante',
      boost: 12,
      narrative: `⚡ ¡REACCIÓN QUÍMICA [Colisión de Egos Resonante]! El egocentrismo desbordante de ${p1.name} y ${p2.name} desestabiliza las marcas rivales.`,
    };
  }

  return null;
}
