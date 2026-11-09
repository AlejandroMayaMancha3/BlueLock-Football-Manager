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

// Coordenadas base en una escala 0-100 para campo completo
// Local juega de izquierda (portería en X=5) a derecha (portería rival en X=95)
export const FORMATION_COORDS_HOME: Record<Formation, Array<{ x: number; y: number; pos: string }>> = {
  '4-3-3': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 19, y: 15, pos: 'LI' },
    { x: 17, y: 38, pos: 'DFC' },
    { x: 17, y: 62, pos: 'DFC' },
    { x: 19, y: 85, pos: 'LD' },
    { x: 30, y: 50, pos: 'MCD' },
    { x: 36, y: 30, pos: 'MC' },
    { x: 36, y: 70, pos: 'MC' },
    { x: 44, y: 18, pos: 'EI' },
    { x: 46, y: 50, pos: 'DC' },
    { x: 44, y: 82, pos: 'ED' },
  ],
  '4-2-3-1': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 19, y: 15, pos: 'LI' },
    { x: 17, y: 38, pos: 'DFC' },
    { x: 17, y: 62, pos: 'DFC' },
    { x: 19, y: 85, pos: 'LD' },
    { x: 28, y: 35, pos: 'MCD' },
    { x: 28, y: 65, pos: 'MCD' },
    { x: 42, y: 18, pos: 'EI' },
    { x: 40, y: 50, pos: 'MCO' },
    { x: 42, y: 82, pos: 'ED' },
    { x: 46, y: 50, pos: 'DC' },
  ],
  '4-4-2': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 19, y: 15, pos: 'LI' },
    { x: 17, y: 38, pos: 'DFC' },
    { x: 17, y: 62, pos: 'DFC' },
    { x: 19, y: 85, pos: 'LD' },
    { x: 34, y: 16, pos: 'MI' },
    { x: 32, y: 38, pos: 'MC' },
    { x: 32, y: 62, pos: 'MC' },
    { x: 34, y: 84, pos: 'MD' },
    { x: 46, y: 38, pos: 'DC' },
    { x: 46, y: 62, pos: 'DC' },
  ],
  '3-5-2': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 17, y: 24, pos: 'DFC' },
    { x: 16, y: 50, pos: 'DFC' },
    { x: 17, y: 76, pos: 'DFC' },
    { x: 32, y: 14, pos: 'CAI' },
    { x: 30, y: 36, pos: 'MC' },
    { x: 30, y: 64, pos: 'MC' },
    { x: 32, y: 86, pos: 'CAD' },
    { x: 40, y: 50, pos: 'MCO' },
    { x: 46, y: 38, pos: 'DC' },
    { x: 46, y: 62, pos: 'DC' },
  ],
  '5-3-2': [
    { x: 6, y: 50, pos: 'POR' },
    { x: 19, y: 14, pos: 'LI' },
    { x: 17, y: 32, pos: 'DFC' },
    { x: 15, y: 50, pos: 'DFC' },
    { x: 17, y: 68, pos: 'DFC' },
    { x: 19, y: 86, pos: 'LD' },
    { x: 32, y: 30, pos: 'MC' },
    { x: 30, y: 50, pos: 'MCD' },
    { x: 32, y: 70, pos: 'MC' },
    { x: 46, y: 38, pos: 'DC' },
    { x: 46, y: 62, pos: 'DC' },
  ],
};

export function getBaseFormationCoords(formation: Formation, isHome: boolean): Array<{ x: number; y: number; pos: string }> {
  const homeCoords = FORMATION_COORDS_HOME[formation] || FORMATION_COORDS_HOME['4-3-3'];
  if (isHome) return homeCoords;

  // Visitante juega hacia la izquierda (espejado)
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

  // 1. SELECCIONAR AL PORTADOR DEL BALÓN (Ball Carrier)
  const roll = Math.random();
  const isDangerousPhase = roll < 0.15;

  let carrier: Player;
  if (isDangerousPhase) {
    // Fase de peligro: delanteros o mediapuntas
    const dangerCandidates = attPlayers.filter((p) => ['DC', 'EI', 'ED', 'MCO'].includes(p.position));
    carrier = dangerCandidates[Math.floor(Math.random() * dangerCandidates.length)] || attPlayers[attPlayers.length - 1];
  } else {
    // Fase de construcción / progresión: mediocentros, extremos o laterales
    const buildCandidates = attPlayers.filter((p) => ['MC', 'MCD', 'MCO', 'EI', 'ED', 'LI', 'LD'].includes(p.position));
    carrier = buildCandidates[Math.floor(Math.random() * buildCandidates.length)] || attPlayers[0];
  }

  next.ballCarrierId = carrier?.id || null;

  // 2. CALCULAR POSICIONES INDIVIDUALES Y AUTÓNOMAS DE CADA JUGADOR (Evitar movimiento en bloque)
  const newPositions: Record<string, { x: number; y: number }> = {};

  const homeBase = getBaseFormationCoords(match.homeClub.formation, true);
  const awayBase = getBaseFormationCoords(match.awayClub.formation, false);

  // Destino del portador del balón
  let carrierTargetX: number;
  let carrierTargetY: number;

  if (isHomeAttack) {
    // Atacante local avanza hacia la portería visitante (X=95)
    carrierTargetX = isDangerousPhase ? 78 + Math.random() * 12 : 52 + Math.random() * 26;
    carrierTargetY = 20 + Math.random() * 60;
  } else {
    // Atacante visitante avanza hacia la portería local (X=5)
    carrierTargetX = isDangerousPhase ? 22 - Math.random() * 12 : 48 - Math.random() * 26;
    carrierTargetY = 20 + Math.random() * 60;
  }

  // EL BALÓN SE MUEVE EXACTAMENTE CON EL JUGADOR QUE LO PORTA
  next.ballPosition = {
    x: Math.round(carrierTargetX),
    y: Math.round(carrierTargetY),
  };

  // Posicionar a cada jugador del Equipo Local individualmente
  match.homeLineup.forEach((pId, idx) => {
    const p = allPlayersMap[pId];
    const base = homeBase[idx] || { x: 20, y: 50, pos: p?.position || 'MC' };

    if (pId === next.ballCarrierId) {
      // El jugador que lleva la pelota está justo con el balón
      newPositions[pId] = {
        x: Math.round(carrierTargetX),
        y: Math.round(carrierTargetY),
      };
      return;
    }

    // Variación individual por jugador y minuto (para que cada uno tenga su propia trayectoria)
    const personalJitterX = Math.sin(currentMinute * 1.7 + idx * 2.3) * 3.5;
    const personalJitterY = Math.cos(currentMinute * 1.4 + idx * 2.9) * 3.0;

    let posX = base.x;
    let posY = base.y;

    if (isHomeAttack) {
      // Equipo local en fase ofensiva:
      if (base.pos === 'POR') {
        posX = 8 + Math.min(6, (carrierTargetX - 50) * 0.1);
        posY = 50 + (carrierTargetY - 50) * 0.15;
      } else if (['DFC'].includes(base.pos)) {
        // Centrales suben a apoyar pero guardan vigilancia (X entre 25 y 40)
        posX = base.x + 10 + personalJitterX;
        posY = base.y + personalJitterY;
      } else if (['LI', 'LD', 'CAI', 'CAD'].includes(base.pos)) {
        // Laterales doblan por la banda
        posX = Math.min(75, base.x + 30 + personalJitterX);
        posY = base.y > 50 ? 86 + personalJitterY * 0.5 : 14 + personalJitterY * 0.5;
      } else if (['MCD', 'MC', 'MCO'].includes(base.pos)) {
        // Medios se escalonan para recibir pase en tres cuartos
        posX = Math.min(78, base.x + 22 + personalJitterX);
        posY = Math.min(85, Math.max(15, base.y + (carrierTargetY - base.y) * 0.35 + personalJitterY));
      } else {
        // Delanteros y extremos buscan el área y diagonales
        posX = Math.min(92, Math.max(68, carrierTargetX + (idx % 2 === 0 ? 5 : -4) + personalJitterX));
        posY = Math.min(84, Math.max(16, base.y + personalJitterY * 1.2));
      }
    } else {
      // Equipo local en fase defensiva (visitante atacando hacia la portería local en X=5):
      if (base.pos === 'POR') {
        // Portero cubre el ángulo del disparo
        posX = 6 + Math.max(0, (20 - carrierTargetX) * 0.2);
        posY = Math.min(64, Math.max(36, 50 + (carrierTargetY - 50) * 0.4));
      } else if (['DFC'].includes(base.pos)) {
        // Centrales se repliegan en el área propia (X entre 12 y 22)
        posX = Math.min(24, Math.max(10, base.x - 5 + personalJitterX));
        posY = Math.min(68, Math.max(32, base.y + (carrierTargetY - base.y) * 0.25 + personalJitterY));
      } else if (['MCD', 'MC'].includes(base.pos)) {
        // Si es el defensor más cercano al balón, acude a presionar en solitario
        const distToBall = Math.hypot(base.x - carrierTargetX, base.y - carrierTargetY);
        if (distToBall < 30) {
          posX = carrierTargetX + 4;
          posY = carrierTargetY + (idx % 2 === 0 ? 3 : -3);
        } else {
          posX = Math.min(45, Math.max(18, base.x - 4 + personalJitterX));
          posY = base.y + personalJitterY;
        }
      } else {
        // Delanteros se quedan descolgados arriba para contragolpe (X entre 40 y 55)
        posX = Math.max(38, base.x + personalJitterX);
        posY = base.y + personalJitterY;
      }
    }

    newPositions[pId] = {
      x: Math.round(Math.min(95, Math.max(5, posX))),
      y: Math.round(Math.min(92, Math.max(8, posY))),
    };
  });

  // Posicionar a cada jugador del Equipo Visitante individualmente
  match.awayLineup.forEach((pId, idx) => {
    const p = allPlayersMap[pId];
    const base = awayBase[idx] || { x: 80, y: 50, pos: p?.position || 'MC' };

    if (pId === next.ballCarrierId) {
      // El jugador visitante que lleva la pelota
      newPositions[pId] = {
        x: Math.round(carrierTargetX),
        y: Math.round(carrierTargetY),
      };
      return;
    }

    // Variación individual por jugador y minuto
    const personalJitterX = Math.cos(currentMinute * 1.6 + idx * 2.5) * 3.5;
    const personalJitterY = Math.sin(currentMinute * 1.3 + idx * 2.8) * 3.0;

    let posX = base.x;
    let posY = base.y;

    if (!isHomeAttack) {
      // Equipo visitante en fase ofensiva (atacando hacia portería local en X=5):
      if (base.pos === 'POR') {
        posX = 92 - Math.min(6, (50 - carrierTargetX) * 0.1);
        posY = 50 + (carrierTargetY - 50) * 0.15;
      } else if (['DFC'].includes(base.pos)) {
        posX = base.x - 10 + personalJitterX;
        posY = base.y + personalJitterY;
      } else if (['LI', 'LD', 'CAI', 'CAD'].includes(base.pos)) {
        posX = Math.max(25, base.x - 30 + personalJitterX);
        posY = base.y > 50 ? 86 + personalJitterY * 0.5 : 14 + personalJitterY * 0.5;
      } else if (['MCD', 'MC', 'MCO'].includes(base.pos)) {
        posX = Math.max(22, base.x - 22 + personalJitterX);
        posY = Math.min(85, Math.max(15, base.y + (carrierTargetY - base.y) * 0.35 + personalJitterY));
      } else {
        posX = Math.max(8, Math.min(32, carrierTargetX + (idx % 2 === 0 ? -5 : 4) + personalJitterX));
        posY = Math.min(84, Math.max(16, base.y + personalJitterY * 1.2));
      }
    } else {
      // Equipo visitante en fase defensiva (local atacando hacia portería visitante en X=95):
      if (base.pos === 'POR') {
        posX = 94 - Math.max(0, (carrierTargetX - 80) * 0.2);
        posY = Math.min(64, Math.max(36, 50 + (carrierTargetY - 50) * 0.4));
      } else if (['DFC'].includes(base.pos)) {
        posX = Math.max(76, Math.min(90, base.x + 5 + personalJitterX));
        posY = Math.min(68, Math.max(32, base.y + (carrierTargetY - base.y) * 0.25 + personalJitterY));
      } else if (['MCD', 'MC'].includes(base.pos)) {
        const distToBall = Math.hypot(base.x - carrierTargetX, base.y - carrierTargetY);
        if (distToBall < 30) {
          posX = carrierTargetX - 4;
          posY = carrierTargetY + (idx % 2 === 0 ? 3 : -3);
        } else {
          posX = Math.max(55, Math.min(82, base.x + 4 + personalJitterX));
          posY = base.y + personalJitterY;
        }
      } else {
        posX = Math.min(62, base.x + personalJitterX);
        posY = base.y + personalJitterY;
      }
    }

    newPositions[pId] = {
      x: Math.round(Math.min(95, Math.max(5, posX))),
      y: Math.round(Math.min(92, Math.max(8, posY))),
    };
  });

  next.playerPositions = newPositions;

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
          next.ballPosition = { x: isHomeAttack ? 94 : 6, y: Math.round(carrierTargetY) };
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
