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

    // Attribute goals and assists to top forwards/midfielders of AI clubs
    const hStrikers = playersCopy.filter((p) => p.clubId === hClub.id && ['DC', 'EI', 'ED'].includes(p.position));
    const aStrikers = playersCopy.filter((p) => p.clubId === aClub.id && ['DC', 'EI', 'ED'].includes(p.position));

    for (let i = 0; i < hScore; i++) {
      const scorer = hStrikers[Math.floor(Math.random() * hStrikers.length)];
      if (scorer) scorer.seasonGoals += 1;
    }
    for (let i = 0; i < aScore; i++) {
      const scorer = aStrikers[Math.floor(Math.random() * aStrikers.length)];
      if (scorer) scorer.seasonGoals += 1;
    }

    // Update match count
    playersCopy.filter((p) => p.clubId === hClub.id || p.clubId === aClub.id).forEach((p) => {
      p.seasonMatches += 1;
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

  // Evolve players: Age + 1, growth or decline, contracts - 1, reset season stats
  const evolvedPlayers: Player[] = players.map((p) => {
    const age = p.age + 1;
    let growth = 0;

    if (age <= 21) {
      growth = Math.floor(Math.random() * 4) + 1; // Youngsters grow +1 to +4
    } else if (age <= 25) {
      growth = Math.floor(Math.random() * 3); // Prime ages grow 0 to +2
    } else if (age >= 32) {
      growth = -Math.floor(Math.random() * 3) - 1; // Decline -1 to -3
    }

    const newOvr = Math.min(99, Math.max(50, p.overall + growth));
    const newStats = { ...p.stats };
    Object.keys(newStats).forEach((k) => {
      const key = k as keyof Player['stats'];
      newStats[key] = Math.min(99, Math.max(30, newStats[key] + growth));
    });

    return {
      ...p,
      age,
      overall: newOvr,
      stats: newStats,
      fitness: 100,
      morale: 80,
      form: 75,
      contractYears: Math.max(0, p.contractYears - 1),
      injuryWeeks: 0,
      isBanned: false,
      yellowCardsCount: 0,
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
