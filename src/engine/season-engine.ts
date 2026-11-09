import { Club, Player, MatchFixture, LeagueTableRow, SeasonHistoryEntry } from '@/types/football-manager';

// Generates 22 rounds for 12 clubs using round-robin algorithm
export function generateSeasonFixtures(season: number, clubs: Club[]): MatchFixture[] {
  const n = clubs.length;
  const clubIds = clubs.map((c) => c.id);
  const rounds: MatchFixture[] = [];

  // Round robin for 11 rounds
  const tempIds = [...clubIds];
  const half = n / 2;

  const firstLegRounds: Array<Array<[string, string]>> = [];

  for (let r = 0; r < n - 1; r++) {
    const roundPairs: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      let home = tempIds[i];
      let away = tempIds[n - 1 - i];
      if ((i + r) % 2 === 1) {
        [home, away] = [away, home];
      }
      roundPairs.push([home, away]);
    }
    firstLegRounds.push(roundPairs);

    // Rotate array keeping first element fixed
    const last = tempIds.pop()!;
    tempIds.splice(1, 0, last);
  }

  // First leg (Jornadas 1 to 11)
  firstLegRounds.forEach((pairs, rIdx) => {
    const roundNum = rIdx + 1;
    pairs.forEach(([h, a], mIdx) => {
      rounds.push({
        id: `fix-s${season}-r${roundNum}-m${mIdx}`,
        season,
        round: roundNum,
        homeClubId: h,
        awayClubId: a,
        isPlayed: false,
      });
    });
  });

  // Second leg (Jornadas 12 to 22) - Inverted home/away
  firstLegRounds.forEach((pairs, rIdx) => {
    const roundNum = rIdx + 12;
    pairs.forEach(([h, a], mIdx) => {
      rounds.push({
        id: `fix-s${season}-r${roundNum}-m${mIdx}`,
        season,
        round: roundNum,
        homeClubId: a, // Inverted
        awayClubId: h,
        isPlayed: false,
      });
    });
  });

  return rounds;
}

// Simulates background AI matches for a round
export function simulateAiMatchesForRound(
  round: number,
  userClubId: string,
  fixtures: MatchFixture[],
  clubsMap: Record<string, Club>,
  players: Player[]
): { updatedFixtures: MatchFixture[]; updatedPlayers: Player[] } {
  const playersCopy = [...players];
  const fixturesCopy = [...fixtures];

  const roundFixtures = fixturesCopy.filter(
    (f) => f.round === round && !f.isPlayed && f.homeClubId !== userClubId && f.awayClubId !== userClubId
  );

  roundFixtures.forEach((fix) => {
    const hClub = clubsMap[fix.homeClubId];
    const aClub = clubsMap[fix.awayClubId];
    if (!hClub || !aClub) return;

    const hPwr = hClub.level + 2.5;
    const aPwr = aClub.level;

    // Realistic Poisson-like goals
    const hLambda = Math.max(0.4, (hPwr / aPwr) * 1.4);
    const aLambda = Math.max(0.3, (aPwr / hPwr) * 1.1);

    const calcGoals = (lambda: number) => {
      let g = 0;
      let p = Math.exp(-lambda);
      let f = p;
      const u = Math.random();
      while (u > f && g < 7) {
        g++;
        p = (p * lambda) / g;
        f += p;
      }
      return g;
    };

    const hScore = calcGoals(hLambda);
    const aScore = calcGoals(aLambda);

    fix.homeScore = hScore;
    fix.awayScore = aScore;
    fix.isPlayed = true;

    // Asignar goles a delanteros y centrocampistas ofensivos
    const hStrikers = playersCopy.filter((p) => p.clubId === hClub.id && ['DC', 'EI', 'ED', 'MCO'].includes(p.position));
    const aStrikers = playersCopy.filter((p) => p.clubId === aClub.id && ['DC', 'EI', 'ED', 'MCO'].includes(p.position));

    for (let i = 0; i < hScore; i++) {
      const scorer = hStrikers[Math.floor(Math.random() * hStrikers.length)] || hStrikers[0];
      if (scorer) scorer.seasonGoals += 1;
    }
    for (let i = 0; i < aScore; i++) {
      const scorer = aStrikers[Math.floor(Math.random() * aStrikers.length)] || aStrikers[0];
      if (scorer) scorer.seasonGoals += 1;
    }

    // Gestión realista de 11 titulares y hasta 4 sustituciones para cada club AI
    const hClubPlayers = playersCopy.filter((p) => p.clubId === hClub.id);
    const aClubPlayers = playersCopy.filter((p) => p.clubId === aClub.id);

    const hStarters = hClub.startingXI.map((id) => hClubPlayers.find((p) => p.id === id)).filter(Boolean) as Player[];
    const hBench = hClub.substitutes.map((id) => hClubPlayers.find((p) => p.id === id)).filter(Boolean) as Player[];
    const hSubsIn = hBench.slice(0, 4);

    const aStarters = aClub.startingXI.map((id) => aClubPlayers.find((p) => p.id === id)).filter(Boolean) as Player[];
    const aBench = aClub.substitutes.map((id) => aClubPlayers.find((p) => p.id === id)).filter(Boolean) as Player[];
    const aSubsIn = aBench.slice(0, 4);

    // Titulares y suplentes que disputaron minutos en Local
    hStarters.forEach((p) => {
      p.seasonMatches += 1;
      p.seasonMinutes = (p.seasonMinutes || 0) + (hSubsIn.some((s) => s.position === p.position) ? 65 : 90);
      p.consecutiveMatchesWithoutPlaying = 0;
      if (p.age <= 22 && p.overall < p.potential && p.seasonMatches % 3 === 0) {
        p.overall = Math.min(p.potential, p.overall + 1);
      }
    });
    hSubsIn.forEach((p) => {
      p.seasonMatches += 1;
      p.seasonMinutes = (p.seasonMinutes || 0) + 25;
      p.consecutiveMatchesWithoutPlaying = 0;
      if (p.age <= 22 && p.overall < p.potential && p.seasonMatches % 4 === 0) {
        p.overall = Math.min(p.potential, p.overall + 1);
      }
    });
    hClubPlayers.filter((p) => !hStarters.some((s) => s.id === p.id) && !hSubsIn.some((s) => s.id === p.id)).forEach((p) => {
      p.consecutiveMatchesWithoutPlaying = (p.consecutiveMatchesWithoutPlaying || 0) + 1;
      if (p.consecutiveMatchesWithoutPlaying >= 6 && p.consecutiveMatchesWithoutPlaying % 3 === 0) {
        p.overall = Math.max(50, p.overall - 1);
        p.potential = Math.max(p.overall, p.potential - 1);
      }
    });

    // Titulares y suplentes que disputaron minutos en Visitante
    aStarters.forEach((p) => {
      p.seasonMatches += 1;
      p.seasonMinutes = (p.seasonMinutes || 0) + (aSubsIn.some((s) => s.position === p.position) ? 65 : 90);
      p.consecutiveMatchesWithoutPlaying = 0;
      if (p.age <= 22 && p.overall < p.potential && p.seasonMatches % 3 === 0) {
        p.overall = Math.min(p.potential, p.overall + 1);
      }
    });
    aSubsIn.forEach((p) => {
      p.seasonMatches += 1;
      p.seasonMinutes = (p.seasonMinutes || 0) + 25;
      p.consecutiveMatchesWithoutPlaying = 0;
      if (p.age <= 22 && p.overall < p.potential && p.seasonMatches % 4 === 0) {
        p.overall = Math.min(p.potential, p.overall + 1);
      }
    });
    aClubPlayers.filter((p) => !aStarters.some((s) => s.id === p.id) && !aSubsIn.some((s) => s.id === p.id)).forEach((p) => {
      p.consecutiveMatchesWithoutPlaying = (p.consecutiveMatchesWithoutPlaying || 0) + 1;
      if (p.consecutiveMatchesWithoutPlaying >= 6 && p.consecutiveMatchesWithoutPlaying % 3 === 0) {
        p.overall = Math.max(50, p.overall - 1);
        p.potential = Math.max(p.overall, p.potential - 1);
      }
    });
  });

  return { updatedFixtures: fixturesCopy, updatedPlayers: playersCopy };
}

// Compute League Table sorted by Points, GD, GF
export function computeLeagueTable(clubs: Club[], fixtures: MatchFixture[]): LeagueTableRow[] {
  const tableMap: Record<string, LeagueTableRow> = {};

  clubs.forEach((c) => {
    tableMap[c.id] = {
      clubId: c.id,
      clubName: c.name,
      shortName: c.shortName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      formHistory: [],
    };
  });

  fixtures.filter((f) => f.isPlayed && f.homeScore !== undefined && f.awayScore !== undefined).forEach((f) => {
    const hRow = tableMap[f.homeClubId];
    const aRow = tableMap[f.awayClubId];
    if (!hRow || !aRow) return;

    const hs = f.homeScore!;
    const as = f.awayScore!;

    hRow.played += 1;
    aRow.played += 1;
    hRow.goalsFor += hs;
    hRow.goalsAgainst += as;
    aRow.goalsFor += as;
    aRow.goalsAgainst += hs;

    if (hs > as) {
      hRow.won += 1;
      hRow.points += 3;
      hRow.formHistory.push('W');
      aRow.lost += 1;
      aRow.formHistory.push('L');
    } else if (hs === as) {
      hRow.drawn += 1;
      hRow.points += 1;
      hRow.formHistory.push('D');
      aRow.drawn += 1;
      aRow.points += 1;
      aRow.formHistory.push('D');
    } else {
      hRow.lost += 1;
      hRow.formHistory.push('L');
      aRow.won += 1;
      aRow.points += 3;
      aRow.formHistory.push('W');
    }

    hRow.goalDifference = hRow.goalsFor - hRow.goalsAgainst;
    aRow.goalDifference = aRow.goalsFor - aRow.goalsAgainst;
  });

  return Object.values(tableMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

// End of season rollover
export function advanceToNextSeason(
  currentSeason: number,
  userClubId: string,
  clubs: Club[],
  players: Player[],
  table: LeagueTableRow[]
): {
  newSeason: number;
  newClubs: Club[];
  newPlayers: Player[];
  newFixtures: MatchFixture[];
  seasonHistoryEntry: SeasonHistoryEntry;
} {
  const userPos = table.findIndex((r) => r.clubId === userClubId) + 1;
  const champion = table[0];

  // Prize money according to final position
  const prizePool = [
    500000000, 380000000, 300000000, 240000000, 200000000, 160000000,
    130000000, 110000000, 90000000, 75000000, 60000000, 50000000
  ];
  const userPrize = prizePool[userPos - 1] || 50000000;

  // Find top scorer
  const topScorer = [...players].sort((a, b) => b.seasonGoals - a.seasonGoals)[0];
  const topClub = clubs.find((c) => c.id === topScorer?.clubId);

  const historyEntry: SeasonHistoryEntry = {
    seasonNumber: currentSeason,
    championClubId: champion.clubId,
    championClubName: champion.clubName,
    userPosition: userPos,
    userClubId,
    userClubName: clubs.find((c) => c.id === userClubId)?.name || 'Mi Club',
    topScorerName: topScorer?.name || 'Desconocido',
    topScorerGoals: topScorer?.seasonGoals || 0,
    topScorerClubName: topClub?.name || 'Liga',
    prizeMoneyYen: userPrize,
  };

  // Evolve players: Age + 1, growth or decline based on match experience & potential, contracts - 1, reset season stats
  const evolvedPlayers: Player[] = players.map((p) => {
    const age = p.age + 1;
    const matchesPlayed = p.seasonMatches || 0;
    let growth = 0;
    let newPotential = p.potential || p.overall;

    // 1. JUGADORES JÓVENES EN DESARROLLO (Edad <= 22)
    if (age <= 22) {
      if (matchesPlayed >= 14) {
        // Gran rodaje (>=14 partidos): Progresión acelerada hacia su potencial
        const roomToGrow = Math.max(0, newPotential - p.overall);
        growth = Math.min(roomToGrow, Math.floor(Math.random() * 3) + 2); // +2 a +4 de media
        if (p.seasonAverageRating >= 7.5 || p.seasonGoals >= 10) {
          // Despierta un nuevo límite
          newPotential = Math.min(99, newPotential + 1);
        }
      } else if (matchesPlayed >= 7) {
        // Rodaje medio (7-13 partidos): Progresión moderada
        const roomToGrow = Math.max(0, newPotential - p.overall);
        growth = Math.min(roomToGrow, Math.floor(Math.random() * 2) + 1); // +1 a +2 de media
      } else {
        // Pocos o ningún partido (<=6 partidos): Estancamiento y pérdida de potencial
        growth = 0;
        if (matchesPlayed <= 3) {
          // Falta grave de minutos: el potencial se degrada
          const potentialDrop = Math.floor(Math.random() * 2) + 1; // -1 o -2
          newPotential = Math.max(p.overall, newPotential - potentialDrop);
          growth = Math.random() < 0.4 ? -1 : 0; // Pérdida de forma competitiva
        }
      }
    }
    // 2. JUGADORES EN SU PRIME (Edad 23 a 28)
    else if (age <= 28) {
      if (matchesPlayed >= 14) {
        const roomToGrow = Math.max(0, newPotential - p.overall);
        growth = Math.min(roomToGrow, Math.floor(Math.random() * 2)); // 0 a +1 si tiene margen
      } else if (matchesPlayed <= 4) {
        growth = -1; // Falta de ritmo
        newPotential = Math.max(p.overall - 1, newPotential - 1);
      } else {
        growth = 0; // Estable
      }
    }
    // 3. VETERANOS (Edad 29+)
    else {
      if (matchesPlayed >= 15) {
        growth = -1; // Declive atenuado por titularidad constante
      } else {
        growth = -Math.floor(Math.random() * 3) - 1; // Declive acelerado (-1 a -3)
      }
      newPotential = Math.min(newPotential, Math.max(p.overall + growth, 50));
    }

    const newOvr = Math.min(newPotential, Math.max(50, p.overall + growth));
    const newStats = { ...p.stats };
    Object.keys(newStats).forEach((k) => {
      const key = k as keyof Player['stats'];
      newStats[key] = Math.min(99, Math.max(30, newStats[key] + growth));
    });

    return {
      ...p,
      age,
      overall: newOvr,
      potential: newPotential,
      stats: newStats,
      fitness: 100,
      morale: matchesPlayed >= 10 ? 85 : 65,
      form: 75,
      contractYears: Math.max(0, p.contractYears - 1),
      injuryWeeks: 0,
      isBanned: false,
      yellowCardsCount: 0,
      consecutiveMatchesWithoutPlaying: 0,
      seasonMatches: 0,
      seasonGoals: 0,
      seasonAssists: 0,
      seasonYellowCards: 0,
      seasonRedCards: 0,
      seasonCleanSheets: 0,
      seasonAverageRating: 6.8,
    };
  });

  // Update clubs with prize money and renewed budget
  const evolvedClubs: Club[] = clubs.map((c) => {
    const pos = table.findIndex((r) => r.clubId === c.id) + 1;
    const prize = prizePool[pos - 1] || 50000000;
    return {
      ...c,
      cashYen: c.cashYen + prize,
      budgetYen: Math.round(c.budgetYen * 0.9) + Math.round(prize * 0.7),
    };
  });

  const nextSeason = currentSeason + 1;
  const newFixtures = generateSeasonFixtures(nextSeason, evolvedClubs);

  return {
    newSeason: nextSeason,
    newClubs: evolvedClubs,
    newPlayers: evolvedPlayers,
    newFixtures,
    seasonHistoryEntry: historyEntry,
  };
}
