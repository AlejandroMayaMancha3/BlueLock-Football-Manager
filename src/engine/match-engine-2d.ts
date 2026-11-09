import { Club, Player, MatchEvent, Formation } from '@/types/football-manager';

export interface SetPieceState {
  type: 'kickoff' | 'corner' | 'dangerous_free_kick' | 'midfield_foul';
  teamId: string; // Equipo que ejecuta la acción a balón parado
  defendingTeamId: string; // Equipo que defiende
  x: number;
  y: number;
  takerId?: string;
}

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
  pendingKickoffTeamId?: string | null; // ID del equipo que debe sacar de centro tras encajar gol
  pendingSetPiece?: SetPieceState | null; // Acción a balón parado pendiente (córner, falta con barrera o saque de centro)
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

// Restricción posicional amplia y realista: libertad de desmarques diagonales manteniendo coherencia de rol
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
          x: Math.min(8.5, Math.max(4.5, x)),
          y: Math.min(58, Math.max(42, y)),
        };
      case 'DFC':
        return {
          x: Math.min(30, Math.max(13, x)),
          y: Math.min(80, Math.max(20, y)),
        };
      case 'LI':
      case 'CAI':
        return {
          x: Math.min(58, Math.max(16, x)),
          y: Math.min(36, Math.max(8, y)),
        };
      case 'LD':
      case 'CAD':
        return {
          x: Math.min(58, Math.max(16, x)),
          y: Math.min(92, Math.max(64, y)),
        };
      case 'MCD':
        return {
          x: Math.min(48, Math.max(26, x)),
          y: Math.min(74, Math.max(26, y)),
        };
      case 'MC':
        return {
          x: Math.min(66, Math.max(34, x)),
          y: Math.min(84, Math.max(16, y)),
        };
      case 'MI':
        return {
          x: Math.min(70, Math.max(36, x)),
          y: Math.min(40, Math.max(8, y)),
        };
      case 'MD':
        return {
          x: Math.min(70, Math.max(36, x)),
          y: Math.min(92, Math.max(60, y)),
        };
      case 'MCO':
        return {
          x: Math.min(76, Math.max(46, x)),
          y: Math.min(78, Math.max(22, y)),
        };
      case 'EI':
        return {
          x: Math.min(90, Math.max(55, x)),
          y: Math.min(42, Math.max(8, y)),
        };
      case 'ED':
        return {
          x: Math.min(90, Math.max(55, x)),
          y: Math.min(92, Math.max(58, y)),
        };
      case 'DC':
      default:
        return {
          x: Math.min(92, Math.max(62, x)),
          y: Math.min(75, Math.max(25, y)),
        };
    }
  } else {
    // Visitante: Ataca hacia la izquierda (X=5), Defiende su portería en X=95
    switch (pos) {
      case 'POR':
        return {
          x: Math.min(95.5, Math.max(91.5, x)),
          y: Math.min(58, Math.max(42, y)),
        };
      case 'DFC':
        return {
          x: Math.min(87, Math.max(70, x)),
          y: Math.min(80, Math.max(20, y)),
        };
      case 'LI':
      case 'CAI':
        return {
          x: Math.min(84, Math.max(42, x)),
          y: Math.min(92, Math.max(64, y)),
        };
      case 'LD':
      case 'CAD':
        return {
          x: Math.min(84, Math.max(42, x)),
          y: Math.min(36, Math.max(8, y)),
        };
      case 'MCD':
        return {
          x: Math.min(74, Math.max(52, x)),
          y: Math.min(74, Math.max(26, y)),
        };
      case 'MC':
        return {
          x: Math.min(66, Math.max(34, x)),
          y: Math.min(84, Math.max(16, y)),
        };
      case 'MI':
        return {
          x: Math.min(64, Math.max(30, x)),
          y: Math.min(92, Math.max(60, y)),
        };
      case 'MD':
        return {
          x: Math.min(64, Math.max(30, x)),
          y: Math.min(40, Math.max(8, y)),
        };
      case 'MCO':
        return {
          x: Math.min(54, Math.max(24, x)),
          y: Math.min(78, Math.max(22, y)),
        };
      case 'EI':
        return {
          x: Math.min(45, Math.max(10, x)),
          y: Math.min(92, Math.max(58, y)),
        };
      case 'ED':
        return {
          x: Math.min(45, Math.max(10, x)),
          y: Math.min(42, Math.max(8, y)),
        };
      case 'DC':
      default:
        return {
          x: Math.min(38, Math.max(8, x)),
          y: Math.min(75, Math.max(25, y)),
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
    pendingKickoffTeamId: null,
    pendingSetPiece: null,
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

// Simula 1 minuto de partido con movimiento 2D fluido, saque de centro tras gol y mecánicas de faltas y córners
export function tickLiveMatch(
  match: LiveMatchState,
  allPlayersMap: Record<string, Player>
): LiveMatchState {
  if (match.isFinished) return match;

  const currentMinute = match.minute + 1;
  const next = { ...match, minute: currentMinute };

  // Jugadores disponibles sobre el césped
  const homePlayers = match.homeLineup.map((id) => allPlayersMap[id]).filter(Boolean);
  const awayPlayers = match.awayLineup.map((id) => allPlayersMap[id]).filter(Boolean);

  const homeGk = homePlayers.find((p) => p.position === 'POR') || homePlayers[0];
  const awayGk = awayPlayers.find((p) => p.position === 'POR') || awayPlayers[0];

  // Cálculo de potencias tácticas
  const getTeamPwr = (players: Player[], ment: Club['mentalidad']) => {
    const avg = players.reduce((s, p) => s + p.overall, 0) / Math.max(1, players.length);
    let mod = 1.0;
    if (ment === 'ultra_ofensiva') mod = 1.15;
    else if (ment === 'ofensiva') mod = 1.07;
    else if (ment === 'muy_defensiva') mod = 0.85;
    return avg * mod;
  };

  const homePwr = getTeamPwr(homePlayers, match.homeClub.mentalidad) + 2.5;
  const awayPwr = getTeamPwr(awayPlayers, match.awayClub.mentalidad);

  // 1. MÁQUINA DE ESTADOS PARA ACCIONES A BALÓN PARADO (SET PIECES)
  // Revisa si hay una acción pendiente: saque de centro tras gol, córner reglamentario o falta
  const pending = match.pendingSetPiece || (match.pendingKickoffTeamId ? {
    type: 'kickoff' as const,
    teamId: match.pendingKickoffTeamId,
    defendingTeamId: match.pendingKickoffTeamId === match.homeClub.id ? match.awayClub.id : match.homeClub.id,
    x: 50,
    y: 50,
  } : null);

  if (pending) {
    const isHomeAction = pending.teamId === match.homeClub.id;
    const attTeam = isHomeAction ? match.homeClub : match.awayClub;
    const defTeam = isHomeAction ? match.awayClub : match.homeClub;
    const attPlayers = isHomeAction ? homePlayers : awayPlayers;
    const defPlayers = isHomeAction ? awayPlayers : homePlayers;
    const defGk = isHomeAction ? awayGk : homeGk;
    const statsObj = isHomeAction ? next.homeStats : next.awayStats;

    const homeBase = getBaseFormationCoords(match.homeClub.formation, true);
    const awayBase = getBaseFormationCoords(match.awayClub.formation, false);
    const setPiecePositions: Record<string, { x: number; y: number }> = {};

    // A) SAQUE DE CENTRO TRAS UN GOL (En la realidad saca el equipo que acaba de encajar)
    if (pending.type === 'kickoff') {
      const kickoffStriker = attPlayers.find((p) => ['DC', 'EI', 'ED'].includes(p.position)) || attPlayers[attPlayers.length - 1];

      // Ambos equipos se colocan estrictamente en sus propios campos
      match.homeLineup.forEach((id, idx) => {
        setPiecePositions[id] = {
          x: Math.min(48, homeBase[idx]?.x || 25),
          y: homeBase[idx]?.y || 50,
        };
      });
      match.awayLineup.forEach((id, idx) => {
        setPiecePositions[id] = {
          x: Math.max(52, awayBase[idx]?.x || 75),
          y: awayBase[idx]?.y || 50,
        };
      });

      if (kickoffStriker) {
        setPiecePositions[kickoffStriker.id] = { x: 50, y: 50 };
      }

      next.ballCarrierId = kickoffStriker?.id || null;
      next.ballPosition = { x: 50, y: 50 };
      next.playerPositions = setPiecePositions;
      next.attackingTeamId = attTeam.id;
      next.pendingSetPiece = null;
      next.pendingKickoffTeamId = null;

      next.events.unshift({
        minute: currentMinute,
        type: 'commentary',
        teamId: attTeam.id,
        playerId: kickoffStriker?.id,
        playerName: kickoffStriker?.name,
        description: `🔄 Saque de centro: ${attTeam.name} reanuda el juego desde el círculo central tras encajar el gol.`,
        ballZone: { x: 50, y: 50 },
      });

      if (currentMinute >= 90) {
        next.isFinished = true;
      }
      return next;
    }

    // B) CÓRNER REGLAMENTARIO (Se ejecuta SIEMPRE en la línea de fondo del equipo que defiende)
    if (pending.type === 'corner') {
      // Local ataca hacia la derecha (meta rival en X=95, línea de fondo rival X=98)
      // Visitante ataca hacia la izquierda (meta rival en X=5, línea de fondo rival X=2)
      const cornerX = isHomeAction ? 98 : 2;
      const cornerY = pending.y === 2 ? 2 : 98; // Banderín de arriba o de abajo

      // Elegir lanzador (extremo o especialista con buen pase/visión)
      const takerCandidates = attPlayers.filter((p) => ['EI', 'ED', 'MCO', 'MC'].includes(p.position));
      const cornerTaker = attPlayers.find((p) => p.id === pending.takerId) || takerCandidates[0] || attPlayers[0];

      // Posicionar jugadores para el córner:
      // Lanzador en el banderín
      if (cornerTaker) {
        setPiecePositions[cornerTaker.id] = { x: cornerX, y: cornerY };
      }

      // Rematadores atacantes se meten en el corazón del área
      const boxAttackers = attPlayers.filter((p) => p.id !== cornerTaker?.id && ['DC', 'DFC', 'MC'].includes(p.position)).slice(0, 4);
      boxAttackers.forEach((p, i) => {
        const boxX = isHomeAction ? 89 + (i % 2) * 3 : 11 - (i % 2) * 3;
        const boxY = 40 + i * 7;
        setPiecePositions[p.id] = { x: boxX, y: boxY };
      });

      // Resto de atacantes vigilando el balcón del área o replegados
      attPlayers.filter((p) => p.id !== cornerTaker?.id && !boxAttackers.some((b) => b.id === p.id)).forEach((p, i) => {
        const restX = isHomeAction ? 78 - i * 8 : 22 + i * 8;
        setPiecePositions[p.id] = { x: Math.max(10, Math.min(90, restX)), y: 35 + (i * 12) % 40 };
      });

      // Defensores marcando en el área y portero en la portería
      if (defGk) {
        setPiecePositions[defGk.id] = { x: isHomeAction ? 95 : 5, y: 50 };
      }
      const defOutfield = defPlayers.filter((p) => p.id !== defGk?.id);
      defOutfield.forEach((p, i) => {
        if (i < 6) {
          // Marcando en el área
          const markX = isHomeAction ? 91 + (i % 2) * 2 : 9 - (i % 2) * 2;
          const markY = 38 + i * 5;
          setPiecePositions[p.id] = { x: markX, y: markY };
        } else {
          // Un delantero esperando la contra
          const counterX = isHomeAction ? 65 : 35;
          setPiecePositions[p.id] = { x: counterX, y: 50 };
        }
      });

      next.playerPositions = setPiecePositions;
      next.ballPosition = { x: cornerX, y: cornerY };
      next.ballCarrierId = cornerTaker?.id || null;
      next.attackingTeamId = attTeam.id;

      // Resolución de la jugada del córner
      const headerCandidates = boxAttackers.length > 0 ? boxAttackers : attPlayers;
      const headerTarget = headerCandidates[Math.floor(Math.random() * headerCandidates.length)] || attPlayers[attPlayers.length - 1];
      const cornerRoll = Math.random();

      if (cornerRoll < 0.20) {
        // ¡GOL DE CÓRNER!
        if (isHomeAction) next.homeScore += 1;
        else next.awayScore += 1;
        statsObj.shots += 1;
        statsObj.shotsOnTarget += 1;
        statsObj.chances += 1;

        if (headerTarget) {
          next.playerRatings[headerTarget.id] = Math.min(10, (next.playerRatings[headerTarget.id] || 6.0) + 1.2);
        }
        if (cornerTaker) {
          next.playerRatings[cornerTaker.id] = Math.min(10, (next.playerRatings[cornerTaker.id] || 6.0) + 0.6);
        }

        next.ballPosition = { x: isHomeAction ? 97 : 3, y: 50 };
        // El equipo que encaja debe sacar de centro
        next.pendingSetPiece = {
          type: 'kickoff',
          teamId: defTeam.id,
          defendingTeamId: attTeam.id,
          x: 50,
          y: 50,
        };

        next.events.unshift({
          minute: currentMinute,
          type: 'goal',
          teamId: attTeam.id,
          playerId: headerTarget?.id,
          playerName: headerTarget?.name,
          assistPlayerId: cornerTaker?.id,
          assistPlayerName: cornerTaker?.name,
          description: `⚽ ¡GOOOOOOL DE CÓRNER! (${currentMinute}') ¡Centro medido de ${cornerTaker?.name} desde el banderín e imperial testarazo de ${headerTarget?.name} al fondo de la red!`,
          ballZone: next.ballPosition,
        });
      } else if (cornerRoll < 0.50) {
        // PARADA DEL PORTERO TRAS EL REMATE
        statsObj.shots += 1;
        statsObj.shotsOnTarget += 1;
        next.ballPosition = { x: isHomeAction ? 94 : 6, y: 50 };
        if (defGk) {
          next.ballCarrierId = defGk.id;
          next.playerRatings[defGk.id] = Math.min(10, (next.playerRatings[defGk.id] || 6.0) + 0.5);
        }

        // 35% de probabilidad de que el portero la mande de nuevo a córner en la misma portería
        if (Math.random() < 0.35) {
          next.pendingSetPiece = {
            type: 'corner',
            teamId: attTeam.id,
            defendingTeamId: defTeam.id,
            x: cornerX,
            y: Math.random() > 0.5 ? 2 : 98,
          };
          next.events.unshift({
            minute: currentMinute,
            type: 'save',
            teamId: defTeam.id,
            playerId: defGk?.id,
            playerName: defGk?.name,
            description: `🧤 ¡PARADÓN a remate de córner! ${headerTarget?.name} cabeceó con potencia pero ${defGk?.name} vuela y manda el esférico de nuevo a saque de esquina.`,
            ballZone: next.ballPosition,
          });
        } else {
          next.pendingSetPiece = null;
          next.events.unshift({
            minute: currentMinute,
            type: 'save',
            teamId: defTeam.id,
            playerId: defGk?.id,
            playerName: defGk?.name,
            description: `🧤 ¡Gran estirada del guardameta! ${defGk?.name} atrapa con seguridad por alto el centro de córner botado por ${cornerTaker?.name}.`,
            ballZone: next.ballPosition,
          });
        }
      } else {
        // DESPEJE DEFENSIVO
        const clearer = defPlayers.find((p) => ['DFC', 'MCD'].includes(p.position)) || defPlayers[0];
        next.ballPosition = { x: isHomeAction ? 75 : 25, y: 50 };
        next.pendingSetPiece = null;

        next.events.unshift({
          minute: currentMinute,
          type: 'corner',
          teamId: attTeam.id,
          playerId: cornerTaker?.id,
          playerName: cornerTaker?.name,
          description: `🚩 Córner botado por ${cornerTaker?.name}: centro tenso al primer palo que la zaga de ${defTeam.name} despeja contundentemente gracias a ${clearer?.name}.`,
          ballZone: { x: cornerX, y: cornerY },
        });
      }

      if (currentMinute >= 90) next.isFinished = true;
      return next;
    }

    // C) FALTA PELIGROSA: TIRO LIBRE DIRECTO CON BARRERA DEFENSIVA FÍSICA
    if (pending.type === 'dangerous_free_kick') {
      const foulX = pending.x;
      const foulY = pending.y;

      const fkSpecialists = attPlayers.filter(
        (p) => p.weapons.some((w) => ['shot', 'curve', 'precision', 'vision'].includes(w.type)) || p.stats.shooting >= 80
      );
      const specialist = attPlayers.find((p) => p.id === pending.takerId) || fkSpecialists[0] || attPlayers[attPlayers.length - 1];

      // Colocar al lanzador en el punto de la falta
      if (specialist) {
        setPiecePositions[specialist.id] = { x: foulX, y: foulY };
      }

      // La barrera defensiva se coloca a distancia reglamentaria (7.5 unidades hacia la portería rival)
      const wallX = isHomeAction ? Math.min(92, foulX + 7.5) : Math.max(8, foulX - 7.5);
      const wallDefenders = defPlayers.filter((p) => p.id !== defGk?.id).slice(0, 4);

      wallDefenders.forEach((p, idx) => {
        // Los 4 jugadores de la barrera se alinean hombro con hombro tapando el ángulo
        const wallY = foulY - 4.5 + idx * 3.0;
        setPiecePositions[p.id] = { x: wallX, y: Math.max(15, Math.min(85, wallY)) };
      });

      // El portero se ubica en la línea de meta cubriendo su palo
      if (defGk) {
        const gkY = foulY > 50 ? 44 : 56;
        setPiecePositions[defGk.id] = { x: isHomeAction ? 95 : 5, y: gkY };
      }

      // Resto de jugadores se colocan en el balcón del área atentos al rechace
      defPlayers.filter((p) => p.id !== defGk?.id && !wallDefenders.some((w) => w.id === p.id)).forEach((p, idx) => {
        setPiecePositions[p.id] = {
          x: isHomeAction ? Math.min(94, wallX + 4 + idx * 2) : Math.max(6, wallX - 4 - idx * 2),
          y: 25 + idx * 10,
        };
      });

      attPlayers.filter((p) => p.id !== specialist?.id).forEach((p, idx) => {
        setPiecePositions[p.id] = {
          x: isHomeAction ? Math.min(90, foulX + 2 + (idx % 3) * 3) : Math.max(10, foulX - 2 - (idx % 3) * 3),
          y: 20 + idx * 8,
        };
      });

      next.playerPositions = setPiecePositions;
      next.ballPosition = { x: foulX, y: foulY };
      next.ballCarrierId = specialist?.id || null;
      next.attackingTeamId = attTeam.id;

      statsObj.shots += 1;
      const weapon = specialist?.weapons?.[0];
      const shotQuality = (specialist?.stats.shooting || 78) + (weapon ? weapon.level * 0.18 : 0);
      const gkDefense = defGk?.stats.goalkeeping || 72;

      const fkRoll = Math.random();
      const goalProbability = 0.26 * (shotQuality / (shotQuality + gkDefense));

      if (fkRoll < goalProbability) {
        // ¡GOLAZO DE FALTA DIRECTA!
        statsObj.shotsOnTarget += 1;
        statsObj.chances += 1;
        if (isHomeAction) next.homeScore += 1;
        else next.awayScore += 1;

        if (specialist) {
          next.playerRatings[specialist.id] = Math.min(10, (next.playerRatings[specialist.id] || 6.0) + 1.3);
        }

        next.ballPosition = { x: isHomeAction ? 97 : 3, y: 50 };
        // Saque de centro tras el gol para el equipo que encajó
        next.pendingSetPiece = {
          type: 'kickoff',
          teamId: defTeam.id,
          defendingTeamId: attTeam.id,
          x: 50,
          y: 50,
        };

        let desc = `⚽ ¡GOLAZO DE FALTA DIRECTA! (${currentMinute}') `;
        if (weapon) {
          desc += `¡${specialist.name} supera la barrera ejecutando su ${weapon.name} e incrustando el balón en la escuadra!`;
        } else {
          desc += `¡Golpeo magistral de ${specialist.name} con efecto endiablado por encima de la barrera directo a la red!`;
        }

        next.events.unshift({
          minute: currentMinute,
          type: 'goal',
          teamId: attTeam.id,
          playerId: specialist?.id,
          playerName: specialist?.name,
          description: desc,
          ballZone: next.ballPosition,
        });
      } else if (fkRoll < 0.60) {
        // PARADA DEL PORTERO
        statsObj.shotsOnTarget += 1;
        next.ballPosition = { x: isHomeAction ? 94 : 6, y: setPiecePositions[defGk?.id]?.y || 50 };
        if (defGk) {
          next.playerRatings[defGk.id] = Math.min(10, (next.playerRatings[defGk.id] || 6.0) + 0.5);
        }

        // En el fútbol real, una parada a tiro libre cercano se desvía muy a menudo a córner por la línea de fondo rival
        const cornerTargetX = isHomeAction ? 98 : 2; // Línea de fondo del que defiende
        next.pendingSetPiece = {
          type: 'corner',
          teamId: attTeam.id,
          defendingTeamId: defTeam.id,
          x: cornerTargetX,
          y: Math.random() > 0.5 ? 2 : 98,
        };
        statsObj.corners += 1;

        next.events.unshift({
          minute: currentMinute,
          type: 'save',
          teamId: defTeam.id,
          playerId: defGk?.id,
          playerName: defGk?.name,
          description: `🧤 ¡PARADÓN a tiro libre directo! ${specialist.name} buscó la escuadra, pero ${defGk?.name} se estira felinamente y desvía a córner.`,
          ballZone: next.ballPosition,
        });
      } else if (fkRoll < 0.80) {
        // DISPARO A LA BARRERA
        next.ballPosition = { x: isHomeAction ? foulX + 6 : foulX - 6, y: foulY };
        next.pendingSetPiece = null;

        next.events.unshift({
          minute: currentMinute,
          type: 'foul',
          teamId: attTeam.id,
          playerId: specialist?.id,
          playerName: specialist?.name,
          description: `🎯 Falta directa ejecutada por ${specialist.name}: el lanzamiento potente impacta de lleno en la barrera de ${defTeam.name}.`,
          ballZone: { x: foulX, y: foulY },
        });
      } else {
        // TIRO LIBRE FUERA
        next.ballPosition = { x: isHomeAction ? 96 : 4, y: Math.random() > 0.5 ? 26 : 74 };
        next.pendingSetPiece = null;

        next.events.unshift({
          minute: currentMinute,
          type: 'foul',
          teamId: attTeam.id,
          playerId: specialist?.id,
          playerName: specialist?.name,
          description: `🎯 Falta con rosca de ${specialist.name}: el balón supera la barrera pero sale rozando el travesaño.`,
          ballZone: { x: foulX, y: foulY },
        });
      }

      if (currentMinute >= 90) next.isFinished = true;
      return next;
    }

    // D) FALTA EN MEDIOCAMPO (SAQUE EN CORTO PARA MANTENER LA POSESIÓN)
    if (pending.type === 'midfield_foul') {
      const taker = attPlayers.find((p) => p.id === pending.takerId) || attPlayers[0];
      setPiecePositions[taker.id] = { x: pending.x, y: pending.y };

      // Reorganizar jugadores
      match.homeLineup.forEach((id, idx) => {
        if (id !== taker.id) {
          setPiecePositions[id] = {
            x: homeBase[idx]?.x || 25,
            y: homeBase[idx]?.y || 50,
          };
        }
      });
      match.awayLineup.forEach((id, idx) => {
        if (id !== taker.id) {
          setPiecePositions[id] = {
            x: awayBase[idx]?.x || 75,
            y: awayBase[idx]?.y || 50,
          };
        }
      });

      next.playerPositions = setPiecePositions;
      next.ballPosition = { x: pending.x, y: pending.y };
      next.ballCarrierId = taker.id;
      next.pendingSetPiece = null;

      next.events.unshift({
        minute: currentMinute,
        type: 'foul',
        teamId: attTeam.id,
        playerId: taker.id,
        playerName: taker.name,
        description: `🎯 Saque de falta: ${taker.name} pone el balón en movimiento con un pase corto para reanudar el ataque de ${attTeam.name}.`,
        ballZone: { x: pending.x, y: pending.y },
      });

      if (currentMinute >= 90) next.isFinished = true;
      return next;
    }
  }

  // 2. SIMULACIÓN EN JUEGO ABIERTO (OPEN PLAY)
  const homeProb = homePwr / (homePwr + awayPwr);
  const isHomeAttack = Math.random() < homeProb;
  const attTeam = isHomeAttack ? match.homeClub : match.awayClub;
  const defTeam = isHomeAttack ? match.awayClub : match.homeClub;
  const attPlayers = isHomeAttack ? homePlayers : awayPlayers;
  const defPlayers = isHomeAttack ? awayPlayers : homePlayers;
  const defGk = isHomeAttack ? awayGk : homeGk;

  next.attackingTeamId = attTeam.id;

  // Clasificación de la acción del minuto en juego abierto
  const roll = Math.random();
  const isDangerPhase = roll < 0.22; // 22% ocasión de gol en área
  const isCrossDeflected = !isDangerPhase && roll >= 0.22 && roll < 0.27; // 5% centro al área desviado a córner
  const isFoulPlay = !isDangerPhase && !isCrossDeflected && roll >= 0.88; // 12% falta cometida en disputa

  // Selección coherente del portador del balón
  let carrier: Player;
  if (isDangerPhase) {
    const dangerCandidates = attPlayers.filter((p) => ['DC', 'EI', 'ED', 'MCO'].includes(p.position));
    carrier = dangerCandidates[Math.floor(Math.random() * dangerCandidates.length)] || attPlayers[attPlayers.length - 1];
  } else if (isCrossDeflected) {
    const wingCandidates = attPlayers.filter((p) => ['EI', 'ED', 'LI', 'LD'].includes(p.position));
    carrier = wingCandidates[Math.floor(Math.random() * wingCandidates.length)] || attPlayers[0];
  } else {
    const progCandidates = attPlayers.filter((p) => ['MC', 'MCD', 'MCO', 'EI', 'ED', 'LI', 'LD'].includes(p.position));
    carrier = progCandidates[Math.floor(Math.random() * progCandidates.length)] || attPlayers[0];
  }

  next.ballCarrierId = carrier?.id || null;

  // 3. MOVIMIENTO TÁCTICO FLUIDO EN 2D (Desmarques diagonales, desdobles e incursiones por rol)
  const attShiftX = isDangerPhase ? 4.5 : 2.5;
  const defShiftX = isDangerPhase ? 3.8 : 2.0;

  const homeBase = getBaseFormationCoords(match.homeClub.formation, true);
  const awayBase = getBaseFormationCoords(match.awayClub.formation, false);
  const newPositions: Record<string, { x: number; y: number }> = {};

  // Posicionar equipo local con libertad 2D
  match.homeLineup.forEach((pId, idx) => {
    const p = allPlayersMap[pId];
    const base = homeBase[idx] || { x: 25, y: 50, pos: p?.position || 'MC' };
    const posRole = base.pos;

    const diagX = Math.sin(currentMinute * 0.45 + idx * 1.3) * 2.2;
    const diagY = Math.cos(currentMinute * 0.4 + idx * 1.5) * 3.8;

    let targetX = base.x;
    let targetY = base.y + diagY;

    if (isHomeAttack) {
      targetX += attShiftX + diagX;
      if (['DC'].includes(posRole)) {
        targetY += Math.sin(currentMinute * 0.6) * 5.5;
        if (pId === next.ballCarrierId) targetX += 4.0;
      } else if (['EI', 'MI'].includes(posRole)) {
        targetY += Math.abs(Math.sin(currentMinute * 0.5)) * 4.5;
      } else if (['ED', 'MD'].includes(posRole)) {
        targetY -= Math.abs(Math.sin(currentMinute * 0.5)) * 4.5;
      } else if (['MCO', 'MC'].includes(posRole)) {
        targetY += Math.sin(currentMinute * 0.55 + idx) * 3.5;
      }
    } else {
      targetX -= defShiftX - diagX;
      if (['DFC'].includes(posRole)) {
        targetY += Math.cos(currentMinute * 0.35 + idx) * 2.5;
      }
    }

    const clamped = clampToRoleZone(posRole, true, targetX, targetY);
    newPositions[pId] = {
      x: Math.round(clamped.x * 10) / 10,
      y: Math.round(clamped.y * 10) / 10,
    };
  });

  // Posicionar equipo visitante con libertad 2D
  match.awayLineup.forEach((pId, idx) => {
    const p = allPlayersMap[pId];
    const base = awayBase[idx] || { x: 75, y: 50, pos: p?.position || 'MC' };
    const posRole = base.pos;

    const diagX = Math.cos(currentMinute * 0.45 + idx * 1.3) * 2.2;
    const diagY = Math.sin(currentMinute * 0.4 + idx * 1.5) * 3.8;

    let targetX = base.x;
    let targetY = base.y + diagY;

    if (!isHomeAttack) {
      targetX -= attShiftX - diagX;
      if (['DC'].includes(posRole)) {
        targetY += Math.sin(currentMinute * 0.6) * 5.5;
        if (pId === next.ballCarrierId) targetX -= 4.0;
      } else if (['EI', 'MI'].includes(posRole)) {
        targetY += Math.abs(Math.sin(currentMinute * 0.5)) * 4.5;
      } else if (['ED', 'MD'].includes(posRole)) {
        targetY -= Math.abs(Math.sin(currentMinute * 0.5)) * 4.5;
      } else if (['MCO', 'MC'].includes(posRole)) {
        targetY += Math.sin(currentMinute * 0.55 + idx) * 3.5;
      }
    } else {
      targetX += defShiftX + diagX;
      if (['DFC'].includes(posRole)) {
        targetY += Math.cos(currentMinute * 0.35 + idx) * 2.5;
      }
    }

    const clamped = clampToRoleZone(posRole, false, targetX, targetY);
    newPositions[pId] = {
      x: Math.round(clamped.x * 10) / 10,
      y: Math.round(clamped.y * 10) / 10,
    };
  });

  next.playerPositions = newPositions;

  // Fijar posición inicial del balón en los pies del portador
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

  const statsObj = isHomeAttack ? next.homeStats : next.awayStats;
  const defStats = isHomeAttack ? next.awayStats : next.homeStats;

  // 4. RESOLUCIÓN DE ACCIONES TÁCTICAS EN JUEGO ABIERTO

  // A) FALTA COMETIDA DURANTE EL JUEGO (SE PROGRAMA EL SET PIECE REAL PARA EL SIGUIENTE MINUTO)
  if (isFoulPlay) {
    defStats.fouls += 1;
    const defender = defPlayers[Math.floor(Math.random() * defPlayers.length)] || defPlayers[0];
    const foulX = newPositions[carrier?.id]?.x || (isHomeAttack ? 65 : 35);
    const foulY = newPositions[carrier?.id]?.y || 50;

    next.ballPosition = { x: foulX, y: foulY };

    // Determinar si es falta peligrosa cercana al área rival (a tiro directo de falta)
    // Local ataca hacia X=95 (peligroso X >= 68), Visitante hacia X=5 (peligroso X <= 32)
    const isCloseFoul = isHomeAttack
      ? foulX >= 68 && foulY >= 20 && foulY <= 80
      : foulX <= 32 && foulY >= 20 && foulY <= 80;

    if (isCloseFoul) {
      const fkSpecialists = attPlayers.filter(
        (p) => p.weapons.some((w) => ['shot', 'curve', 'precision', 'vision'].includes(w.type)) || p.stats.shooting >= 80
      );
      const specialist = fkSpecialists[0] || carrier || attPlayers[attPlayers.length - 1];

      // Se programa la falta con barrera para el siguiente minuto
      next.pendingSetPiece = {
        type: 'dangerous_free_kick',
        teamId: attTeam.id,
        defendingTeamId: defTeam.id,
        x: foulX,
        y: foulY,
        takerId: specialist.id,
      };

      const isYellow = Math.random() < 0.35;
      if (isYellow && defender) {
        next.playerRatings[defender.id] = Math.max(4.0, (next.playerRatings[defender.id] || 6.0) - 0.4);
        next.events.unshift({
          minute: currentMinute,
          type: 'yellow_card',
          teamId: defTeam.id,
          playerId: defender.id,
          playerName: defender.name,
          description: `🟨 Tarjeta amarilla para ${defender.name} por derribar a ${carrier.name} al borde del área. ¡FALTA MUY PELIGROSA!`,
          ballZone: { x: foulX, y: foulY },
        });
      } else {
        next.events.unshift({
          minute: currentMinute,
          type: 'foul',
          teamId: attTeam.id,
          playerId: specialist.id,
          playerName: specialist.name,
          description: `⚠️ ¡FALTA PELIGROSA! ${defender.name} frena con falta a ${carrier.name} en el balcón del área (${Math.round(foulX)}m). Se prepara el lanzamiento directo con barrera.`,
          ballZone: { x: foulX, y: foulY },
        });
      }
    } else {
      // Falta en mediocampo o zona defensiva
      next.pendingSetPiece = {
        type: 'midfield_foul',
        teamId: attTeam.id,
        defendingTeamId: defTeam.id,
        x: foulX,
        y: foulY,
        takerId: carrier.id,
      };

      const isYellow = Math.random() < 0.15;
      if (isYellow && defender) {
        next.playerRatings[defender.id] = Math.max(4.0, (next.playerRatings[defender.id] || 6.0) - 0.4);
        next.events.unshift({
          minute: currentMinute,
          type: 'yellow_card',
          teamId: defTeam.id,
          playerId: defender.id,
          playerName: defender.name,
          description: `🟨 Tarjeta amarilla para ${defender.name} por agarrar a ${carrier.name} cortando el contragolpe.`,
          ballZone: { x: foulX, y: foulY },
        });
      } else {
        next.events.unshift({
          minute: currentMinute,
          type: 'foul',
          teamId: attTeam.id,
          playerId: carrier.id,
          playerName: carrier.name,
          description: `⚠️ Falta táctica de ${defender.name} sobre ${carrier.name} para frenar la transición ofensiva.`,
          ballZone: { x: foulX, y: foulY },
        });
      }
    }
  }

  // B) CENTRO AL ÁREA DESVIADO A CÓRNER POR UN DEFENSOR
  else if (isCrossDeflected) {
    statsObj.corners += 1;
    // La línea de fondo es SIEMPRE la del equipo que defiende
    const defEndlineX = isHomeAttack ? 98 : 2;
    const cornerSideY = Math.random() > 0.5 ? 2 : 98;

    next.pendingSetPiece = {
      type: 'corner',
      teamId: attTeam.id,
      defendingTeamId: defTeam.id,
      x: defEndlineX,
      y: cornerSideY,
    };

    next.ballPosition = { x: defEndlineX, y: cornerSideY };

    next.events.unshift({
      minute: currentMinute,
      type: 'corner',
      teamId: attTeam.id,
      playerId: carrier.id,
      playerName: carrier.name,
      description: `🚩 Internada por banda de ${carrier.name}: su centro raso es desviado por la zaga de ${defTeam.name} sobre su propia línea de fondo. ¡Córner para ${attTeam.name}!`,
      ballZone: { x: defEndlineX, y: cornerSideY },
    });
  }

  // C) JUGADA DE PELIGRO EN EL ÁREA (DISPARO, GOL O PARADA CON DESVÍO A CÓRNER)
  else if (isDangerPhase) {
    const shooter = carrier;
    const passer = attPlayers.filter((p) => p.id !== shooter?.id && ['MC', 'MCO', 'EI', 'ED'].includes(p.position))[0];

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
        // ¡GOL EN JUEGO ABIERTO!
        statsObj.chances += 1;
        if (isHomeAttack) next.homeScore += 1;
        else next.awayScore += 1;

        // El equipo que encaja debe sacar de centro en el círculo central
        next.pendingSetPiece = {
          type: 'kickoff',
          teamId: defTeam.id,
          defendingTeamId: attTeam.id,
          x: 50,
          y: 50,
        };

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
          next.playerRatings[defGk.id] = Math.min(10, (next.playerRatings[defGk.id] || 6.0) + 0.5);
          next.ballPosition = { x: isHomeAttack ? 94 : 6, y: newPositions[defGk.id]?.y || 50 };
        }
        const gkWeapon = defGk?.weapons?.[0];

        // En el fútbol real, ~50% de las paradas forzadas desvían el balón sobre la línea de fondo defensiva -> CÓRNER
        const defEndlineX = isHomeAttack ? 98 : 2;
        if (Math.random() < 0.50) {
          statsObj.corners += 1;
          next.pendingSetPiece = {
            type: 'corner',
            teamId: attTeam.id,
            defendingTeamId: defTeam.id,
            x: defEndlineX,
            y: Math.random() > 0.5 ? 2 : 98,
          };

          let saveDesc = `🧤 ¡PARADÓN de ${defGk?.name || 'el portero'}! `;
          if (gkWeapon) {
            saveDesc += `Desvía el misil de ${shooter?.name} con su habilidad especial ${gkWeapon.name}... ¡y manda el balón a CÓRNER!`;
          } else {
            saveDesc += `Ataja con reflejos felinos el tiro ajustado de ${shooter?.name} y desvía por la línea de fondo... ¡CÓRNER!`;
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
        } else {
          // El portero atrapa y se queda el balón
          if (defGk) next.ballCarrierId = defGk.id;
          next.pendingSetPiece = null;

          next.events.unshift({
            minute: currentMinute,
            type: 'save',
            teamId: defTeam.id,
            playerId: defGk?.id,
            playerName: defGk?.name,
            description: `🧤 ¡Seguridad bajo palos! ${defGk?.name} bloquea en dos tiempos el remate peligroso de ${shooter?.name}.`,
            ballZone: next.ballPosition,
          });
        }
      }
    } else {
      // 30% de los tiros desviados son taponados por un central saliendo a córner
      const blocker = defPlayers.find((p) => ['DFC', 'MCD'].includes(p.position)) || defPlayers[0];
      if (Math.random() < 0.30) {
        statsObj.corners += 1;
        const defEndlineX = isHomeAttack ? 98 : 2;
        next.pendingSetPiece = {
          type: 'corner',
          teamId: attTeam.id,
          defendingTeamId: defTeam.id,
          x: defEndlineX,
          y: Math.random() > 0.5 ? 2 : 98,
        };

        next.events.unshift({
          minute: currentMinute,
          type: 'corner',
          teamId: attTeam.id,
          playerId: blocker.id,
          playerName: blocker.name,
          description: `🛡️ ¡Bloqueo providencial! ${blocker.name} tapona el disparo de ${shooter?.name} y el balón se pierde por la línea de fondo. ¡Córner para ${attTeam.name}!`,
          ballZone: { x: defEndlineX, y: 50 },
        });
      } else {
        // Disparo fuera de los tres palos
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
    }
  }

  // D) ACCIÓN DE CIRCULACIÓN / DUELO DE METAVISIÓN
  else if (roll > 0.80 && roll <= 0.88) {
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
