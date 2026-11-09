import { Club, Player, MatchEvent, Formation } from '@/types/football-manager';

export interface LiveMatchState {
  id: string;
  season: number;
  round: number;
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  minute: number;
  isFinished: boolean;
  isPaused: boolean;
  speedMultiplier: number; // 1, 2, 5
  ballPosition: { x: number; y: number }; // 0-100%
  ballCarrierId: string | null; // ID del jugador que conduce el balón
  playerPositions: Record<string, { x: number; y: number }>; // Coordenadas individuales de cada jugador (0-100%)
  attackingTeamId: string;
  events: MatchEvent[];
  homeStats: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    chances: number;
    fouls: number;
    corners: number;
  };
  awayStats: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    chances: number;
    fouls: number;
    corners: number;
  };
  homeSubsRemaining: number;
  awaySubsRemaining: number;
  homeLineup: string[]; // Current 11 on pitch
  awayLineup: string[]; // Current 11 on pitch
  homeBench: string[];
  awayBench: string[];
  playerRatings: Record<string, number>; // playerId -> 6.0 to 10.0
}

// Coordenadas base en escala 0-100 para el campo completo (11v11 reglamentario)
// Local juega de izquierda (portería propia en X=5) a derecha (portería rival en X=95)
export const FORMATION_COORDS_HOME: Record<Formation, Array<{ x: number; y: number; pos: string }>> = {
  '4-3-3': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 24, y: 16, pos: 'LI' },
    { x: 19, y: 38, pos: 'DFC' },
    { x: 19, y: 62, pos: 'DFC' },
    { x: 24, y: 84, pos: 'LD' },
    { x: 36, y: 50, pos: 'MCD' },
    { x: 48, y: 34, pos: 'MC' },
    { x: 48, y: 66, pos: 'MC' },
    { x: 68, y: 20, pos: 'EI' },
    { x: 74, y: 50, pos: 'DC' },
    { x: 68, y: 80, pos: 'ED' },
  ],
  '4-2-3-1': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 24, y: 16, pos: 'LI' },
    { x: 19, y: 38, pos: 'DFC' },
    { x: 19, y: 62, pos: 'DFC' },
    { x: 24, y: 84, pos: 'LD' },
    { x: 35, y: 36, pos: 'MCD' },
    { x: 35, y: 64, pos: 'MCD' },
    { x: 66, y: 20, pos: 'EI' },
    { x: 58, y: 50, pos: 'MCO' },
    { x: 66, y: 80, pos: 'ED' },
    { x: 74, y: 50, pos: 'DC' },
  ],
  '4-4-2': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 24, y: 16, pos: 'LI' },
    { x: 19, y: 38, pos: 'DFC' },
    { x: 19, y: 62, pos: 'DFC' },
    { x: 24, y: 84, pos: 'LD' },
    { x: 50, y: 18, pos: 'MI' },
    { x: 45, y: 38, pos: 'MC' },
    { x: 45, y: 62, pos: 'MC' },
    { x: 50, y: 82, pos: 'MD' },
    { x: 73, y: 40, pos: 'DC' },
    { x: 73, y: 60, pos: 'DC' },
  ],
  '3-5-2': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 19, y: 25, pos: 'DFC' },
    { x: 17, y: 50, pos: 'DFC' },
    { x: 19, y: 75, pos: 'DFC' },
    { x: 44, y: 14, pos: 'CAI' },
    { x: 40, y: 36, pos: 'MC' },
    { x: 40, y: 64, pos: 'MC' },
    { x: 44, y: 86, pos: 'CAD' },
    { x: 58, y: 50, pos: 'MCO' },
    { x: 73, y: 40, pos: 'DC' },
    { x: 73, y: 60, pos: 'DC' },
  ],
  '5-3-2': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 24, y: 14, pos: 'LI' },
    { x: 19, y: 32, pos: 'DFC' },
    { x: 17, y: 50, pos: 'DFC' },
    { x: 19, y: 68, pos: 'DFC' },
    { x: 24, y: 86, pos: 'LD' },
    { x: 44, y: 34, pos: 'MC' },
    { x: 38, y: 50, pos: 'MCD' },
    { x: 44, y: 66, pos: 'MC' },
    { x: 73, y: 40, pos: 'DC' },
    { x: 73, y: 60, pos: 'DC' },
  ],
};

// Restricción posicional estricta: un delantero NUNCA defiende en su área ni un defensa ataca de 9
export function clampToRoleZone(
  pos: string,
  isHome: boolean,
  x: number,
  y: number
): { x: number; y: number } {
  if (isHome) {
    // Local: Ataca hacia la derecha (X=95), Defiende su portería en X=5
    switch (pos) {
      case 'POR':
        return {
          x: Math.min(8, Math.max(5, x)),
          y: Math.min(56, Math.max(44, y)),
        };
      case 'DFC':
        return {
          x: Math.min(28, Math.max(14, x)),
          y: Math.min(74, Math.max(26, y)),
        };
      case 'LI':
      case 'CAI':
        return {
          x: Math.min(52, Math.max(18, x)),
          y: Math.min(26, Math.max(10, y)),
        };
      case 'LD':
      case 'CAD':
        return {
          x: Math.min(52, Math.max(18, x)),
          y: Math.min(90, Math.max(74, y)),
        };
      case 'MCD':
        return {
          x: Math.min(46, Math.max(28, x)),
          y: Math.min(65, Math.max(35, y)),
        };
      case 'MC':
        return {
          x: Math.min(62, Math.max(36, x)),
          y: Math.min(80, Math.max(20, y)),
        };
      case 'MI':
        return {
          x: Math.min(66, Math.max(38, x)),
          y: Math.min(30, Math.max(12, y)),
        };
      case 'MD':
        return {
          x: Math.min(66, Math.max(38, x)),
          y: Math.min(88, Math.max(70, y)),
        };
      case 'MCO':
        return {
          x: Math.min(72, Math.max(48, x)),
          y: Math.min(70, Math.max(30, y)),
        };
      case 'EI':
        return {
          x: Math.min(88, Math.max(58, x)),
          y: Math.min(30, Math.max(12, y)),
        };
      case 'ED':
        return {
          x: Math.min(88, Math.max(58, x)),
          y: Math.min(88, Math.max(70, y)),
        };
      case 'DC':
      default:
        return {
          x: Math.min(90, Math.max(64, x)),
          y: Math.min(68, Math.max(32, y)),
        };
    }
  } else {
    // Visitante: Ataca hacia la izquierda (X=5), Defiende su portería en X=95
    switch (pos) {
      case 'POR':
        return {
          x: Math.min(95, Math.max(92, x)),
          y: Math.min(56, Math.max(44, y)),
        };
      case 'DFC':
        return {
          x: Math.min(86, Math.max(72, x)),
          y: Math.min(74, Math.max(26, y)),
        };
      case 'LI':
      case 'CAI':
        return {
          x: Math.min(82, Math.max(48, x)),
          y: Math.min(90, Math.max(74, y)),
        };
      case 'LD':
      case 'CAD':
        return {
          x: Math.min(82, Math.max(48, x)),
          y: Math.min(26, Math.max(10, y)),
        };
      case 'MCD':
        return {
          x: Math.min(72, Math.max(54, x)),
          y: Math.min(65, Math.max(35, y)),
        };
      case 'MC':
        return {
          x: Math.min(64, Math.max(38, x)),
          y: Math.min(80, Math.max(20, y)),
        };
      case 'MI':
        return {
          x: Math.min(62, Math.max(34, x)),
          y: Math.min(88, Math.max(70, y)),
        };
      case 'MD':
        return {
          x: Math.min(62, Math.max(34, x)),
          y: Math.min(30, Math.max(12, y)),
        };
      case 'MCO':
        return {
          x: Math.min(52, Math.max(28, x)),
          y: Math.min(70, Math.max(30, y)),
        };
      case 'EI':
        return {
          x: Math.min(42, Math.max(12, x)),
          y: Math.min(88, Math.max(70, y)),
        };
      case 'ED':
        return {
          x: Math.min(42, Math.max(12, x)),
          y: Math.min(30, Math.max(12, y)),
        };
      case 'DC':
      default:
        return {
          x: Math.min(36, Math.max(10, x)),
          y: Math.min(68, Math.max(32, y)),
        };
    }
  }
}

export function getBaseFormationCoords(formation: Formation, isHome: boolean): Array<{ x: number; y: number; pos: string }> {
  const homeCoords = FORMATION_COORDS_HOME[formation] || FORMATION_COORDS_HOME['4-3-3'];
  if (isHome) return homeCoords;

  // Visitante juega hacia la izquierda (espejado horizontal)
  return homeCoords.map((c) => ({
    x: 100 - c.x,
    y: c.y,
    pos: c.pos,
  }));
}

export function initLiveMatch(
  season: number,
  round: number,
  homeClub: Club,
  awayClub: Club
): LiveMatchState {
  const ratings: Record<string, number> = {};
  const initialPositions: Record<string, { x: number; y: number }> = {};

  const homeCoords = getBaseFormationCoords(homeClub.formation, true);
  homeClub.startingXI.forEach((id, idx) => {
    ratings[id] = 6.0;
    initialPositions[id] = {
      x: homeCoords[idx]?.x || 20,
      y: homeCoords[idx]?.y || 50,
    };
  });

  const awayCoords = getBaseFormationCoords(awayClub.formation, false);
  awayClub.startingXI.forEach((id, idx) => {
    ratings[id] = 6.0;
    initialPositions[id] = {
      x: awayCoords[idx]?.x || 80,
      y: awayCoords[idx]?.y || 50,
    };
  });

  // Saque inicial: el delantero centro local tiene el balón en el centro del campo
  const kickoffCarrierId = homeClub.startingXI[homeClub.startingXI.length - 1] || homeClub.startingXI[0];
  if (kickoffCarrierId) {
    initialPositions[kickoffCarrierId] = { x: 50, y: 50 };
  }

  return {
    id: `live-m-${season}-${round}-${Date.now()}`,
    season,
    round,
    homeClub: JSON.parse(JSON.stringify(homeClub)),
    awayClub: JSON.parse(JSON.stringify(awayClub)),
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    isFinished: false,
    isPaused: false,
    speedMultiplier: 1,
    ballPosition: { x: 50, y: 50 },
    ballCarrierId: kickoffCarrierId,
    playerPositions: initialPositions,
    attackingTeamId: homeClub.id,
    events: [
      {
        minute: 0,
        type: 'commentary',
        teamId: homeClub.id,
        description: `¡Arranca el partido en el ${homeClub.stadiumName}! ${homeClub.name} vs ${awayClub.name}`,
        ballZone: { x: 50, y: 50 },
      },
    ],
    homeStats: {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      chances: 0,
      fouls: 0,
      corners: 0,
    },
    awayStats: {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      chances: 0,
      fouls: 0,
      corners: 0,
    },
    homeSubsRemaining: 5,
    awaySubsRemaining: 5,
    homeLineup: [...homeClub.startingXI],
    awayLineup: [...awayClub.startingXI],
    homeBench: [...homeClub.substitutes],
    awayBench: [...awayClub.substitutes],
    playerRatings: ratings,
  };
}

// Simulates 1 minute of match action with individual player positioning and ball carrier tracking
export function tickLiveMatch(
  match: LiveMatchState,
  allPlayersMap: Record<string, Player>
): LiveMatchState {
  if (match.isFinished) return match;

  const currentMinute = match.minute + 1;
  const next = { ...match, minute: currentMinute };

  // Calculate team strengths with tactical modifiers
  const homePlayers = match.homeLineup.map((id) => allPlayersMap[id]).filter(Boolean);
  const awayPlayers = match.awayLineup.map((id) => allPlayersMap[id]).filter(Boolean);

  const homeGk = homePlayers.find((p) => p.position === 'POR') || homePlayers[0];
  const awayGk = awayPlayers.find((p) => p.position === 'POR') || awayPlayers[0];

  const getTeamPwr = (players: Player[], ment: Club['mentalidad']) => {
    const avg = players.reduce((s, p) => s + p.overall, 0) / Math.max(1, players.length);
    let mod = 1.0;
    if (ment === 'ultra_ofensiva') mod = 1.15;
    else if (ment === 'ofensiva') mod = 1.07;
    else if (ment === 'muy_defensiva') mod = 0.85;
    return avg * mod;
  };

  const homePwr = getTeamPwr(homePlayers, match.homeClub.mentalidad) + 2.5; // Ventaja local
  const awayPwr = getTeamPwr(awayPlayers, match.awayClub.mentalidad);

  // Determinar quién tiene la iniciativa ofensiva este minuto
  const homeProb = homePwr / (homePwr + awayPwr);
  const isHomeAttack = Math.random() < homeProb;
  const attTeam = isHomeAttack ? match.homeClub : match.awayClub;
  const defTeam = isHomeAttack ? match.awayClub : match.homeClub;
  const attPlayers = isHomeAttack ? homePlayers : awayPlayers;
  const defPlayers = isHomeAttack ? awayPlayers : homePlayers;
  const defGk = isHomeAttack ? awayGk : homeGk;

  next.attackingTeamId = attTeam.id;

  // 1. FASE DE JUEGO Y SELECCIÓN DE PORTADOR CON COHERENCIA TÁCTICA
  const roll = Math.random();
  const isDangerousPhase = roll < 0.20; // 20% jugada de peligro en el área
  const isProgressionPhase = !isDangerousPhase && roll < 0.75; // 55% progresión en medio campo

  let carrier: Player;
  if (isDangerousPhase) {
    // Fase de peligro: SOLO delanteros, extremos o mediapuntas
    const dangerCandidates = attPlayers.filter((p) => ['DC', 'EI', 'ED', 'MCO'].includes(p.position));
    carrier = dangerCandidates[Math.floor(Math.random() * dangerCandidates.length)] || attPlayers[attPlayers.length - 1];
  } else if (isProgressionPhase) {
    // Fase de progresión: mediocentros, volantes o extremos
    const progCandidates = attPlayers.filter((p) => ['MC', 'MCD', 'MCO', 'EI', 'ED', 'MI', 'MD'].includes(p.position));
    carrier = progCandidates[Math.floor(Math.random() * progCandidates.length)] || attPlayers[0];
  } else {
    // Fase de salida desde atrás: pivotes, mediocentros o laterales
    const buildCandidates = attPlayers.filter((p) => ['MCD', 'MC', 'LI', 'LD', 'CAI', 'CAD'].includes(p.position));
    carrier = buildCandidates[Math.floor(Math.random() * buildCandidates.length)] || attPlayers[0];
  }

  next.ballCarrierId = carrier?.id || null;

  // 2. DESPLAZAMIENTO COLECTIVO TRANQUILO Y ARMÓNICO (Sin saltos bruscos ni mareo)
  // En ataque el bloque adelanta 1-5%; en defensa repliega 1-4%.
  const attShift = isDangerousPhase ? 4.5 : isProgressionPhase ? 2.8 : 1.2;
  const defShift = isDangerousPhase ? 3.8 : isProgressionPhase ? 2.2 : 0.8;

  const homeBase = getBaseFormationCoords(match.homeClub.formation, true);
  const awayBase = getBaseFormationCoords(match.awayClub.formation, false);

  const newPositions: Record<string, { x: number; y: number }> = {};

  // Posicionar a cada jugador del Equipo Local respetando estrictamente su rol
  match.homeLineup.forEach((pId, idx) => {
    const p = allPlayersMap[pId];
    const base = homeBase[idx] || { x: 25, y: 50, pos: p?.position || 'MC' };
    const posRole = base.pos;

    // Micro-variación suave (< 0.7%) para respiración visual sin vibraciones
    const microX = Math.sin(currentMinute * 0.4 + idx * 0.7) * 0.7;
    const microY = Math.cos(currentMinute * 0.35 + idx * 0.75) * 0.7;

    let targetX = base.x;
    let targetY = base.y;

    if (isHomeAttack) {
      // Local en ataque hacia X=95
      targetX += attShift + microX;
      targetY += microY;

      // El portador avanza un poco más en su carril natural
      if (pId === next.ballCarrierId) {
        targetX += isDangerousPhase ? 4.5 : 2.5;
      }
    } else {
      // Local en repliegue hacia X=5
      targetX -= defShift - microX;
      targetY += microY;
    }

    // CLAMPEO ESTRICTO POR ROL: un DC nunca baja a defensa ni un DFC sube a delantera
    const clamped = clampToRoleZone(posRole, true, targetX, targetY);
    newPositions[pId] = {
      x: Math.round(clamped.x * 10) / 10,
      y: Math.round(clamped.y * 10) / 10,
    };
  });

  // Posicionar a cada jugador del Equipo Visitante respetando estrictamente su rol
  match.awayLineup.forEach((pId, idx) => {
    const p = allPlayersMap[pId];
    const base = awayBase[idx] || { x: 75, y: 50, pos: p?.position || 'MC' };
    const posRole = base.pos;

    const microX = Math.cos(currentMinute * 0.4 + idx * 0.7) * 0.7;
    const microY = Math.sin(currentMinute * 0.35 + idx * 0.75) * 0.7;

    let targetX = base.x;
    let targetY = base.y;

    if (!isHomeAttack) {
      // Visitante en ataque hacia X=5
      targetX -= attShift - microX;
      targetY += microY;

      if (pId === next.ballCarrierId) {
        targetX -= isDangerousPhase ? 4.5 : 2.5;
      }
    } else {
      // Visitante en repliegue hacia X=95
      targetX += defShift + microX;
      targetY += microY;
    }

    // CLAMPEO ESTRICTO POR ROL
    const clamped = clampToRoleZone(posRole, false, targetX, targetY);
    newPositions[pId] = {
      x: Math.round(clamped.x * 10) / 10,
      y: Math.round(clamped.y * 10) / 10,
    };
  });

  next.playerPositions = newPositions;

  // Fijar la posición del balón exactamente a los pies del jugador que la porta
  if (next.ballCarrierId && newPositions[next.ballCarrierId]) {
    next.ballPosition = {
      x: newPositions[next.ballCarrierId].x,
      y: newPositions[next.ballCarrierId].y,
    };
  } else {
    next.ballPosition = { x: 50, y: 50 };
  }

  // Actualizar posesión dinámica
  const totalMins = Math.max(1, currentMinute);
  const homeAttacks = next.events.filter((e) => e.teamId === match.homeClub.id).length + (isHomeAttack ? 1 : 0);
  const rawPoss = Math.round((homeAttacks / (totalMins + 10)) * 100);
  next.homeStats.possession = Math.max(35, Math.min(65, rawPoss));
  next.awayStats.possession = 100 - next.homeStats.possession;

  // 3. EVENTOS DEL PARTIDO (DISPARO, GOL, PARADA, TARJETA)
  if (isDangerousPhase) {
    const shooter = carrier;
    const passer = attPlayers.filter((p) => p.id !== shooter?.id && ['MC', 'MCO', 'EI', 'ED'].includes(p.position))[0];

    const statsObj = isHomeAttack ? next.homeStats : next.awayStats;
    statsObj.shots += 1;

    // Efecto de arma Blue Lock
    const weapon = shooter?.weapons?.[0];
    let shotPower = (shooter?.stats.shooting || 75) + (weapon ? weapon.level * 0.15 : 0);
    const gkPower = (defGk?.stats.goalkeeping || 70) + (defGk?.weapons?.[0] ? defGk.weapons[0].level * 0.15 : 0);

    // Activación de Flow State
    if (shooter?.egoRating && shooter.egoRating > 88 && Math.random() < 0.3) {
      shotPower += 15;
      next.events.unshift({
        minute: currentMinute,
        type: 'flow',
        teamId: attTeam.id,
        playerId: shooter.id,
        playerName: shooter.name,
        description: `⚡ ¡FLOW ACTIVADO! ${shooter.name} entra en trance egoísta y visualiza la trayectoria perfecta.`,
        ballZone: next.ballPosition,
      });
    }

    const isTarget = Math.random() < 0.65;
    if (isTarget) {
      statsObj.shotsOnTarget += 1;

      const goalThreshold = 0.42 * (shotPower / (shotPower + gkPower));
      if (Math.random() < goalThreshold) {
        // ¡GOL!
        statsObj.chances += 1;
        if (isHomeAttack) {
          next.homeScore += 1;
        } else {
          next.awayScore += 1;
        }

        if (shooter) {
          next.playerRatings[shooter.id] = Math.min(10, (next.playerRatings[shooter.id] || 6.0) + 1.2);
        }
        if (passer) {
          next.playerRatings[passer.id] = Math.min(10, (next.playerRatings[passer.id] || 6.0) + 0.6);
        }

        let goalDesc = `⚽ ¡GOOOOOOL DE ${attTeam.name.toUpperCase()}! (${currentMinute}') `;
        if (weapon) {
          goalDesc += `¡${shooter.name} ejecuta su ${weapon.name} sin piedad directo al fondo de la red!`;
        } else {
          goalDesc += `¡Definición inapelable de ${shooter?.name || 'delantero'} tras desmarque al espacio!`;
        }
        if (passer) {
          goalDesc += ` (Asistencia de ${passer.name})`;
        }

        // El balón entra al fondo de la red
        next.ballPosition = { x: isHomeAttack ? 97 : 3, y: 50 };

        next.events.unshift({
          minute: currentMinute,
          type: 'goal',
          teamId: attTeam.id,
          playerId: shooter?.id,
          playerName: shooter?.name,
          assistPlayerId: passer?.id,
          assistPlayerName: passer?.name,
          description: goalDesc,
          ballZone: next.ballPosition,
        });
      } else {
        // PARADA DEL PORTERO
        if (defGk) {
          next.playerRatings[defGk.id] = Math.min(10, (next.playerRatings[defGk.id] || 6.0) + 0.4);
          // Balón en manos del portero
          next.ballCarrierId = defGk.id;
          next.ballPosition = { x: isHomeAttack ? 94 : 6, y: newPositions[defGk.id]?.y || 50 };
        }
        const gkWeapon = defGk?.weapons?.[0];
        let saveDesc = `🧤 ¡PARADÓN de ${defGk?.name || 'el portero'}! `;
        if (gkWeapon) {
          saveDesc += `Desvía el misil de ${shooter?.name} con su habilidad especial ${gkWeapon.name}.`;
        } else {
          saveDesc += `Ataja el disparo ajustado de ${shooter?.name} con reflejos felinos.`;
        }

        next.events.unshift({
          minute: currentMinute,
          type: 'save',
          teamId: defTeam.id,
          playerId: defGk?.id,
          playerName: defGk?.name,
          description: saveDesc,
          ballZone: next.ballPosition,
        });

        if (Math.random() < 0.5) {
          statsObj.corners += 1;
        }
      }
    } else {
      // Disparo fuera
      next.events.unshift({
        minute: currentMinute,
        type: 'shot',
        teamId: attTeam.id,
        playerId: shooter?.id,
        playerName: shooter?.name,
        description: `Ocasión de ${shooter?.name}: remate potente que sale rozando el poste de la portería de ${defTeam.name}.`,
        ballZone: next.ballPosition,
      });
    }
  } else if (roll > 0.96) {
    // Falta o tarjeta
    const defender = defPlayers[Math.floor(Math.random() * defPlayers.length)];
    const defStats = isHomeAttack ? next.awayStats : next.homeStats;
    defStats.fouls += 1;

    const isCard = Math.random() < 0.35;
    if (isCard && defender) {
      next.playerRatings[defender.id] = Math.max(4.0, (next.playerRatings[defender.id] || 6.0) - 0.5);

      next.events.unshift({
        minute: currentMinute,
        type: 'yellow_card',
        teamId: defTeam.id,
        playerId: defender.id,
        playerName: defender.name,
        description: `🟨 Tarjeta amarilla para ${defender.name} por cortar la conducción de ${carrier?.name}.`,
        ballZone: next.ballPosition,
      });
    }
  } else if (roll > 0.86 && roll <= 0.90) {
    // Duelo de mediocampo / Metavisión
    const midAtt = attPlayers.find((p) => p.weapons.some((w) => w.type === 'vision')) || carrier;

    if (midAtt) {
      next.events.unshift({
        minute: currentMinute,
        type: 'commentary',
        teamId: attTeam.id,
        playerId: midAtt.id,
        playerName: midAtt.name,
        description: `👀 ${midAtt.name} conduce con Metavisión y supera la presión individual con un cambio de ritmo.`,
        ballZone: next.ballPosition,
      });
    }
  }

  // Pitido final a los 90 minutos
  if (currentMinute >= 90) {
    next.isFinished = true;
    next.events.unshift({
      minute: 90,
      type: 'commentary',
      teamId: match.homeClub.id,
      description: `🏁 ¡FINAL DEL PARTIDO! Marcador definitivo: ${match.homeClub.name} ${next.homeScore} - ${next.awayScore} ${match.awayClub.name}.`,
      ballZone: { x: 50, y: 50 },
    });
  }

  return next;
}

// In-match player substitution
export function executeLiveSub(
  match: LiveMatchState,
  isHome: boolean,
  playerOutId: string,
  playerInId: string,
  allPlayersMap: Record<string, Player>
): LiveMatchState {
  const currentSubs = isHome ? match.homeSubsRemaining : match.awaySubsRemaining;
  if (currentSubs <= 0) return match;

  const currentLineup = isHome ? [...match.homeLineup] : [...match.awayLineup];
  const currentBench = isHome ? [...match.homeBench] : [...match.awayBench];

  const outIdx = currentLineup.indexOf(playerOutId);
  const inIdx = currentBench.indexOf(playerInId);

  if (outIdx === -1 || inIdx === -1) return match;

  // Swap
  currentLineup[outIdx] = playerInId;
  currentBench[inIdx] = playerOutId;

  const pOut = allPlayersMap[playerOutId];
  const pIn = allPlayersMap[playerInId];
  const team = isHome ? match.homeClub : match.awayClub;

  const newRatings = { ...match.playerRatings };
  if (!newRatings[playerInId]) newRatings[playerInId] = 6.0;

  // Heredar posición en el campo
  const newPositions = { ...match.playerPositions };
  if (newPositions[playerOutId]) {
    newPositions[playerInId] = { ...newPositions[playerOutId] };
    delete newPositions[playerOutId];
  }

  const newEvents = [
    {
      minute: match.minute,
      type: 'sub' as const,
      teamId: team.id,
      playerId: playerInId,
      playerName: pIn?.name || 'Jugador',
      description: `🔄 Cambio en ${team.name}: entra ${pIn?.name || 'suplente'} sustituyendo a ${pOut?.name || 'titular'}.`,
      ballZone: match.ballPosition,
    },
    ...match.events,
  ];

  return {
    ...match,
    homeLineup: isHome ? currentLineup : match.homeLineup,
    awayLineup: !isHome ? currentLineup : match.awayLineup,
    homeBench: isHome ? currentBench : match.homeBench,
    awayBench: !isHome ? currentBench : match.awayBench,
    homeSubsRemaining: isHome ? currentSubs - 1 : match.homeSubsRemaining,
    awaySubsRemaining: !isHome ? currentSubs - 1 : match.awaySubsRemaining,
    events: newEvents,
    playerRatings: newRatings,
    playerPositions: newPositions,
  };
}
