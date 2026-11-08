import { Club, Player, MatchEvent } from '@/types/football-manager';

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

export function initLiveMatch(
  season: number,
  round: number,
  homeClub: Club,
  awayClub: Club
): LiveMatchState {
  const ratings: Record<string, number> = {};
  [...homeClub.startingXI, ...awayClub.startingXI].forEach((id) => {
    ratings[id] = 6.0;
  });

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

// Simulates 1 minute of match action
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

  const homePwr = getTeamPwr(homePlayers, match.homeClub.mentalidad) + 2.5; // Ventaja de local
  const awayPwr = getTeamPwr(awayPlayers, match.awayClub.mentalidad);

  // Who gets the ball this minute?
  const homeProb = homePwr / (homePwr + awayPwr);
  const isHomeAttack = Math.random() < homeProb;
  const attTeam = isHomeAttack ? match.homeClub : match.awayClub;
  const defTeam = isHomeAttack ? match.awayClub : match.homeClub;
  const attPlayers = isHomeAttack ? homePlayers : awayPlayers;
  const defPlayers = isHomeAttack ? awayPlayers : homePlayers;
  const defGk = isHomeAttack ? awayGk : homeGk;

  next.attackingTeamId = attTeam.id;

  // Move ball position across 2D pitch
  const targetX = isHomeAttack ? 55 + Math.random() * 40 : 45 - Math.random() * 40;
  const targetY = 15 + Math.random() * 70;
  next.ballPosition = { x: Math.round(targetX), y: Math.round(targetY) };

  // Update dynamic possession
  const totalMins = Math.max(1, currentMinute);
  const homeAttacks = next.events.filter((e) => e.teamId === match.homeClub.id).length + (isHomeAttack ? 1 : 0);
  const rawPoss = Math.round((homeAttacks / (totalMins + 10)) * 100);
  next.homeStats.possession = Math.max(35, Math.min(65, rawPoss));
  next.awayStats.possession = 100 - next.homeStats.possession;

  // Random event roll for this minute
  const roll = Math.random();

  // 1. CHANCE OF DANGEROUS SHOT (approx 12-15% of minutes)
  if (roll < 0.14) {
    const shooter = attPlayers.filter((p) => ['DC', 'EI', 'ED', 'MCO'].includes(p.position))[Math.floor(Math.random() * 4)] || attPlayers[0];
    const passer = attPlayers.filter((p) => p.id !== shooter?.id && ['MC', 'MCO', 'EI', 'ED'].includes(p.position))[0];

    const statsObj = isHomeAttack ? next.homeStats : next.awayStats;
    statsObj.shots += 1;

    // Check shooter weapon (Blue Lock weapon trigger!)
    const weapon = shooter?.weapons?.[0];
    let shotPower = (shooter?.stats.shooting || 75) + (weapon ? weapon.level * 0.15 : 0);
    let gkPower = (defGk?.stats.goalkeeping || 70) + (defGk?.weapons?.[0] ? defGk.weapons[0].level * 0.15 : 0);

    // Flow state bonus
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

    // Shot evaluation
    const isTarget = Math.random() < 0.65;
    if (isTarget) {
      statsObj.shotsOnTarget += 1;

      // Is it a GOAL?
      const goalThreshold = 0.42 * (shotPower / (shotPower + gkPower));
      if (Math.random() < goalThreshold) {
        // GOAL!
        statsObj.chances += 1;
        if (isHomeAttack) {
          next.homeScore += 1;
        } else {
          next.awayScore += 1;
        }

        // Increase rating for scorer
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

        next.events.unshift({
          minute: currentMinute,
          type: 'goal',
          teamId: attTeam.id,
          playerId: shooter?.id,
          playerName: shooter?.name,
          assistPlayerId: passer?.id,
          assistPlayerName: passer?.name,
          description: goalDesc,
          ballZone: { x: isHomeAttack ? 95 : 5, y: 50 },
        });
      } else {
        // SAVED BY GOALKEEPER
        if (defGk) {
          next.playerRatings[defGk.id] = Math.min(10, (next.playerRatings[defGk.id] || 6.0) + 0.4);
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
          ballZone: { x: isHomeAttack ? 92 : 8, y: 50 },
        });

        // Corner chance
        if (Math.random() < 0.5) {
          statsObj.corners += 1;
        }
      }
    } else {
      // Off target shot
      next.events.unshift({
        minute: currentMinute,
        type: 'shot',
        teamId: attTeam.id,
        playerId: shooter?.id,
        playerName: shooter?.name,
        description: `Ocasión de ${shooter?.name}: remate potente que sale rozando el travesaño del ${defTeam.name}.`,
        ballZone: next.ballPosition,
      });
    }
  }
  // 2. FOUL OR CARD (approx 4%)
  else if (roll > 0.96) {
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
        description: `🟨 Tarjeta amarilla para ${defender.name} por una entrada dura cortando el contragolpe.`,
        ballZone: next.ballPosition,
      });
    }
  }
  // 3. MIDFIELD DUELL / METAVISION TACTICAL DUEL (approx 5%)
  else if (roll > 0.85 && roll <= 0.90) {
    const midAtt = attPlayers.find((p) => p.weapons.some((w) => w.type === 'vision')) || attPlayers[0];
    const midDef = defPlayers.find((p) => p.weapons.some((w) => w.type === 'defense')) || defPlayers[0];

    if (midAtt) {
      next.events.unshift({
        minute: currentMinute,
        type: 'commentary',
        teamId: attTeam.id,
        playerId: midAtt.id,
        playerName: midAtt.name,
        description: `👀 ${midAtt.name} escanea el campo con visión periférica y filtra un pase rompiendo líneas defensivas.`,
        ballZone: next.ballPosition,
      });
    }
  }

  // Check full time
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
  };
}
