import {
  Club,
  Player,
  MatchFixture,
  LeagueTableRow,
  SeasonHistoryEntry,
  PromotionRelegationMovement,
  SeasonTransitionReport,
  CountryLeague,
} from '@/types/football-manager';
import { shouldAwakenWeapon, generateContextualWeapon } from './weapon-registry';
import { getDivisionsByCountry } from './data/divisions-catalog';
import { calculatePlayerMarketValue } from './player-valuation';

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

  // Second leg - Inverted home/away
  firstLegRounds.forEach((pairs, rIdx) => {
    const roundNum = rIdx + n;
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

  // Filtrar estrictamente para que solo participen los clubes involucrados en los fixtures de esta división
  const fixtureClubIds = new Set<string>();
  fixtures.forEach((f) => {
    fixtureClubIds.add(f.homeClubId);
    fixtureClubIds.add(f.awayClubId);
  });

  const participatingClubs = fixtureClubIds.size > 0
    ? clubs.filter((c) => fixtureClubIds.has(c.id))
    : clubs;

  participatingClubs.forEach((c) => {
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

// Simula la tabla de clasificación final realista de 46 jornadas para una división IA
export function simulateAiDivisionTable(divisionClubs: Club[]): LeagueTableRow[] {
  const table: LeagueTableRow[] = divisionClubs.map((club) => {
    const basePower = club.level * 1.6 + (club.reputation * 0.4);
    const variance = (Math.random() * 16) - 8;
    return {
      clubId: club.id,
      clubName: club.name,
      shortName: club.shortName,
      played: 46,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      formHistory: [],
      rawStrength: basePower + variance,
    } as any;
  });

  table.sort((a: any, b: any) => b.rawStrength - a.rawStrength);

  table.forEach((row: any, rank) => {
    const targetPoints = Math.max(
      28,
      Math.min(104, Math.round(96 - (rank * 2.7) + (Math.random() * 6 - 3)))
    );
    const draws = Math.floor(Math.random() * 7) + 8;
    const wins = Math.max(5, Math.min(30, Math.floor((targetPoints - draws) / 3)));
    const losses = Math.max(0, 46 - wins - draws);
    const actualPoints = (wins * 3) + draws;

    const goalsFor = Math.max(25, Math.round((wins * 2.1) + (draws * 0.9) + Math.random() * 10));
    const goalsAgainst = Math.max(20, Math.round((losses * 1.8) + (draws * 0.9) + Math.random() * 8));

    row.played = 46;
    row.won = wins;
    row.drawn = draws;
    row.lost = losses;
    row.points = actualPoints;
    row.goalsFor = goalsFor;
    row.goalsAgainst = goalsAgainst;
    row.goalDifference = goalsFor - goalsAgainst;

    const formSample: ('W' | 'D' | 'L')[] = ['W', 'W', 'D', 'W', 'L'];
    row.formHistory = formSample.sort(() => Math.random() - 0.5);
    delete row.rawStrength;
  });

  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

// End of season rollover con simulación de toda la pirámide y ascensos/descensos
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
  seasonTransitionReport: SeasonTransitionReport;
} {
  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPos = table.findIndex((r) => r.clubId === userClubId) + 1;
  const userOldTier = userClub.tier || 1;
  const champion = table[0];

  // Premios económicos escalonados para 24 posiciones
  const prizePool = [
    500000000, 420000000, 360000000, 310000000, 270000000, 240000000,
    210000000, 190000000, 170000000, 150000000, 135000000, 120000000,
    110000000, 100000000, 90000000, 80000000, 70000000, 60000000,
    55000000, 50000000, 45000000, 40000000, 35000000, 30000000,
  ];
  const userPrize = prizePool[userPos - 1] || 30000000;

  // Máximo goleador
  const topScorer = [...players].sort((a, b) => b.seasonGoals - a.seasonGoals)[0];
  const topClub = clubs.find((c) => c.id === topScorer?.clubId);

  // 1. Evolución de futbolistas
  const evolvedPlayers: Player[] = players.map((p) => {
    const age = p.age + 1;
    const matchesPlayed = p.seasonMatches || 0;
    let growth = 0;
    let newPotential = p.potential || p.overall;

    if (age <= 22) {
      if (matchesPlayed >= 14) {
        const roomToGrow = Math.max(0, newPotential - p.overall);
        growth = Math.min(roomToGrow, Math.floor(Math.random() * 3) + 2);
        if (p.seasonAverageRating >= 7.5 || p.seasonGoals >= 10) {
          newPotential = Math.min(99, newPotential + 1);
        }
      } else if (matchesPlayed >= 7) {
        const roomToGrow = Math.max(0, newPotential - p.overall);
        growth = Math.min(roomToGrow, Math.floor(Math.random() * 2) + 1);
      } else {
        growth = 0;
        if (matchesPlayed <= 3) {
          const potentialDrop = Math.floor(Math.random() * 2) + 1;
          newPotential = Math.max(p.overall, newPotential - potentialDrop);
          growth = Math.random() < 0.4 ? -1 : 0;
        }
      }
    } else if (age <= 28) {
      if (matchesPlayed >= 14) {
        const roomToGrow = Math.max(0, newPotential - p.overall);
        growth = Math.min(roomToGrow, Math.floor(Math.random() * 2));
      } else if (matchesPlayed <= 4) {
        growth = -1;
        newPotential = Math.max(p.overall - 1, newPotential - 1);
      } else {
        growth = 0;
      }
    } else {
      if (matchesPlayed >= 15) {
        growth = -1;
      } else {
        growth = -Math.floor(Math.random() * 3) - 1;
      }
      newPotential = Math.min(newPotential, Math.max(p.overall + growth, 50));
    }

    const newOvr = Math.min(newPotential, Math.max(50, p.overall + growth));
    const newStats = { ...p.stats };
    Object.keys(newStats).forEach((k) => {
      const key = k as keyof Player['stats'];
      newStats[key] = Math.min(99, Math.max(30, newStats[key] + growth));
    });

    const isUserPlayer = p.clubId === userClubId;
    let finalClubId = p.clubId;
    let finalContractYears = Math.max(0, p.contractYears - 1);
    let finalTransferListed = p.isTransferListed;

    if (isUserPlayer && p.contractYears <= 1) {
      const rivalClubs = clubs.filter((c) => c.id !== userClubId);
      const eligibleDestinations = rivalClubs.filter(
        (c) => evolvedPlayers.filter((ep) => ep.clubId === c.id).length < 25
      );
      const destinationClub =
        eligibleDestinations[Math.floor(Math.random() * eligibleDestinations.length)] || rivalClubs[0];
      finalClubId = destinationClub.id;
      finalContractYears = 3;
      finalTransferListed = false;
    }

    let finalWeapons = [...(p.weapons || [])];
    const candidatePlayer: Player = { ...p, overall: newOvr, potential: newPotential, stats: newStats, age };
    const awakenCheck = shouldAwakenWeapon(candidatePlayer);
    if (awakenCheck.awaken) {
      if (finalWeapons.length === 0) {
        finalWeapons = [generateContextualWeapon(candidatePlayer, false)];
      } else if (awakenCheck.isSecondary && finalWeapons.length === 1 && Math.random() < 0.45) {
        finalWeapons = [...finalWeapons, generateContextualWeapon(candidatePlayer, true)];
      }
    }

    const newValuation = calculatePlayerMarketValue({
      overall: newOvr,
      potential: newPotential,
      age,
      weapons: finalWeapons,
      egoRating: p.egoRating,
      position: p.position,
    });

    return {
      ...p,
      age,
      clubId: finalClubId,
      overall: newOvr,
      potential: newPotential,
      stats: newStats,
      weapons: finalWeapons,
      marketValueYen: newValuation.marketValueYen,
      weeklyWageYen: newValuation.weeklyWageYen,
      fitness: 100,
      morale: matchesPlayed >= 10 ? 85 : 65,
      form: 75,
      contractYears: finalContractYears,
      isTransferListed: finalTransferListed,
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

  // 2. Evolución de presupuestos y alineaciones de los clubes
  const evolvedClubs: Club[] = clubs.map((c) => {
    const isUserC = c.id === userClubId;
    const pos = isUserC ? userPos : Math.floor(Math.random() * 24) + 1;
    const prize = prizePool[pos - 1] || 30000000;

    let startingXI = [...c.startingXI];
    let substitutes = [...c.substitutes];

    const clubMembers = evolvedPlayers.filter((p) => p.clubId === c.id);
    startingXI = startingXI.filter((id) => clubMembers.some((m) => m.id === id));
    substitutes = substitutes.filter((id) => clubMembers.some((m) => m.id === id));

    if (startingXI.length < 11 && clubMembers.length >= 11) {
      const candidates = clubMembers
        .filter((m) => !startingXI.includes(m.id))
        .sort((a, b) => b.overall - a.overall);
      while (startingXI.length < 11 && candidates.length > 0) {
        const nextIn = candidates.shift()!;
        startingXI.push(nextIn.id);
        substitutes = substitutes.filter((id) => id !== nextIn.id);
      }
    }

    substitutes = Array.from(new Set(substitutes))
      .filter((id) => !startingXI.includes(id))
      .slice(0, 7);

    const validCaptain = clubMembers.some((m) => m.id === c.captainId)
      ? c.captainId
      : startingXI[0] || clubMembers[0]?.id;
    const validPenalty = clubMembers.some((m) => m.id === c.penaltyTakerId)
      ? c.penaltyTakerId
      : startingXI.find((id) => clubMembers.find((m) => m.id === id)?.position === 'DC') || validCaptain;
    const validFk = clubMembers.some((m) => m.id === c.freeKickTakerId)
      ? c.freeKickTakerId
      : startingXI.find((id) => ['MCO', 'MC', 'EI'].includes(clubMembers.find((m) => m.id === id)?.position || '')) || validCaptain;

    return {
      ...c,
      cashYen: c.cashYen + prize,
      budgetYen: Math.round(c.budgetYen * 0.9) + Math.round(prize * 0.7),
      startingXI,
      substitutes,
      captainId: validCaptain,
      penaltyTakerId: validPenalty,
      freeKickTakerId: validFk,
    };
  });

  // 3. Simulación de la pirámide completa de las 4 divisiones del país
  const country = (userClub.country as CountryLeague) || 'Spain';
  const countryDivisions = getDivisionsByCountry(country);
  const div1 = countryDivisions.find((d) => d.tier === 1)!;
  const div2 = countryDivisions.find((d) => d.tier === 2)!;
  const div3 = countryDivisions.find((d) => d.tier === 3)!;
  const div4 = countryDivisions.find((d) => d.tier === 4)!;

  const tierTables: Record<number, LeagueTableRow[]> = {};
  [1, 2, 3, 4].forEach((t) => {
    if (userClub.tier === t) {
      tierTables[t] = table;
    } else {
      const div = countryDivisions.find((d) => d.tier === t)!;
      const divClubs = evolvedClubs.filter((c) => (c.divisionId || c.league) === div.id);
      tierTables[t] = simulateAiDivisionTable(divClubs);
    }
  });

  // 4. Procesar ascensos y descensos
  const promotions: PromotionRelegationMovement[] = [];
  const relegations: PromotionRelegationMovement[] = [];

  // --- INTERCAMBIO TIER 1 <-> TIER 2 ---
  // Descienden de Tier 1 a Tier 2 (los 3 últimos clasificados: 22.º, 23.º, 24.º)
  const t1RelegatedRows = tierTables[1].slice(21, 24);
  t1RelegatedRows.forEach((row, idx) => {
    relegations.push({
      clubId: row.clubId,
      clubName: row.clubName,
      fromDivisionId: div1.id,
      fromDivisionName: div1.name,
      toDivisionId: div2.id,
      toDivisionName: div2.name,
      type: 'relegation_direct',
      finalPosition: 22 + idx,
    });
  });

  // Ascienden de Tier 2 a Tier 1 (1.º y 2.º directo + ganador playoff 3.º al 6.º)
  const t2DirectCount = div2.promotionDirect || 2;
  const t2PlayoffCount = div2.promotionPlayoff || 4;
  const t2DirectPromRows = tierTables[2].slice(0, t2DirectCount);
  t2DirectPromRows.forEach((row, idx) => {
    promotions.push({
      clubId: row.clubId,
      clubName: row.clubName,
      fromDivisionId: div2.id,
      fromDivisionName: div2.name,
      toDivisionId: div1.id,
      toDivisionName: div1.name,
      type: 'promotion_direct',
      finalPosition: idx + 1,
    });
  });

  const t2PlayoffRows = tierTables[2].slice(t2DirectCount, t2DirectCount + t2PlayoffCount);
  const userInT2Playoff = t2PlayoffRows.find((r) => r.clubId === userClubId);
  const t2PlayoffWinnerRow = userInT2Playoff || t2PlayoffRows[Math.floor(Math.random() * t2PlayoffRows.length)] || t2PlayoffRows[0];
  promotions.push({
    clubId: t2PlayoffWinnerRow.clubId,
    clubName: t2PlayoffWinnerRow.clubName,
    fromDivisionId: div2.id,
    fromDivisionName: div2.name,
    toDivisionId: div1.id,
    toDivisionName: div1.name,
    type: 'promotion_playoff',
    finalPosition: tierTables[2].findIndex((r) => r.clubId === t2PlayoffWinnerRow.clubId) + 1,
  });

  // --- INTERCAMBIO TIER 2 <-> TIER 3 ---
  // Descienden de Tier 2 a Tier 3 (los 3 últimos clasificados: 22.º, 23.º, 24.º)
  const t2RelegatedRows = tierTables[2].slice(21, 24);
  t2RelegatedRows.forEach((row, idx) => {
    relegations.push({
      clubId: row.clubId,
      clubName: row.clubName,
      fromDivisionId: div2.id,
      fromDivisionName: div2.name,
      toDivisionId: div3.id,
      toDivisionName: div3.name,
      type: 'relegation_direct',
      finalPosition: 22 + idx,
    });
  });

  // Ascienden de Tier 3 a Tier 2 (1.º y 2.º directo + ganador playoff 3.º al 6.º)
  const t3DirectCount = div3.promotionDirect || 2;
  const t3PlayoffCount = div3.promotionPlayoff || 4;
  const t3DirectPromRows = tierTables[3].slice(0, t3DirectCount);
  t3DirectPromRows.forEach((row, idx) => {
    promotions.push({
      clubId: row.clubId,
      clubName: row.clubName,
      fromDivisionId: div3.id,
      fromDivisionName: div3.name,
      toDivisionId: div2.id,
      toDivisionName: div2.name,
      type: 'promotion_direct',
      finalPosition: idx + 1,
    });
  });

  const t3PlayoffRows = tierTables[3].slice(t3DirectCount, t3DirectCount + t3PlayoffCount);
  const userInT3Playoff = t3PlayoffRows.find((r) => r.clubId === userClubId);
  const t3PlayoffWinnerRow = userInT3Playoff || t3PlayoffRows[Math.floor(Math.random() * t3PlayoffRows.length)] || t3PlayoffRows[0];
  promotions.push({
    clubId: t3PlayoffWinnerRow.clubId,
    clubName: t3PlayoffWinnerRow.clubName,
    fromDivisionId: div3.id,
    fromDivisionName: div3.name,
    toDivisionId: div2.id,
    toDivisionName: div2.name,
    type: 'promotion_playoff',
    finalPosition: tierTables[3].findIndex((r) => r.clubId === t3PlayoffWinnerRow.clubId) + 1,
  });

  // --- INTERCAMBIO TIER 3 <-> TIER 4 ---
  // Descienden de Tier 3 a Tier 4 (los 4 últimos clasificados: 21.º al 24.º)
  const t3RelegatedRows = tierTables[3].slice(20, 24);
  t3RelegatedRows.forEach((row, idx) => {
    relegations.push({
      clubId: row.clubId,
      clubName: row.clubName,
      fromDivisionId: div3.id,
      fromDivisionName: div3.name,
      toDivisionId: div4.id,
      toDivisionName: div4.name,
      type: 'relegation_direct',
      finalPosition: 21 + idx,
    });
  });

  // Ascienden de Tier 4 a Tier 3 (1.º, 2.º y 3.º directo + ganador playoff 4.º al 7.º)
  const t4DirectCount = div4.promotionDirect || 3;
  const t4PlayoffCount = div4.promotionPlayoff || 4;
  const t4DirectPromRows = tierTables[4].slice(0, t4DirectCount);
  t4DirectPromRows.forEach((row, idx) => {
    promotions.push({
      clubId: row.clubId,
      clubName: row.clubName,
      fromDivisionId: div4.id,
      fromDivisionName: div4.name,
      toDivisionId: div3.id,
      toDivisionName: div3.name,
      type: 'promotion_direct',
      finalPosition: idx + 1,
    });
  });

  const t4PlayoffRows = tierTables[4].slice(t4DirectCount, t4DirectCount + t4PlayoffCount);
  const userInT4Playoff = t4PlayoffRows.find((r) => r.clubId === userClubId);
  const t4PlayoffWinnerRow = userInT4Playoff || t4PlayoffRows[Math.floor(Math.random() * t4PlayoffRows.length)] || t4PlayoffRows[0];
  promotions.push({
    clubId: t4PlayoffWinnerRow.clubId,
    clubName: t4PlayoffWinnerRow.clubName,
    fromDivisionId: div4.id,
    fromDivisionName: div4.name,
    toDivisionId: div3.id,
    toDivisionName: div3.name,
    type: 'promotion_playoff',
    finalPosition: tierTables[4].findIndex((r) => r.clubId === t4PlayoffWinnerRow.clubId) + 1,
  });

  // EN 4.ª DIVISIÓN (TIER 4): ¡NO HAY DESCENSOS! SOLO ASCENSOS HACIA LA 3.ª

  // 5. Aplicar cambios de categoría a los clubes
  const promotionMap = new Map(promotions.map((p) => [p.clubId, p]));
  const relegationMap = new Map(relegations.map((r) => [r.clubId, r]));

  evolvedClubs.forEach((club) => {
    const prom = promotionMap.get(club.id);
    if (prom) {
      club.divisionId = prom.toDivisionId;
      club.league = prom.toDivisionId;
      const targetDiv = countryDivisions.find((d) => d.id === prom.toDivisionId);
      if (targetDiv) {
        club.tier = targetDiv.tier;
        const boostEur = targetDiv.tier === 1 ? 20000000 : targetDiv.tier === 2 ? 6000000 : 2000000;
        club.cashYen += Math.round(boostEur * 160);
        club.budgetYen += Math.round(boostEur * 160 * 0.8);
        club.reputation = Math.min(99, club.reputation + 4);
      }
    }

    const rel = relegationMap.get(club.id);
    if (rel) {
      club.divisionId = rel.toDivisionId;
      club.league = rel.toDivisionId;
      const targetDiv = countryDivisions.find((d) => d.id === rel.toDivisionId);
      if (targetDiv) {
        club.tier = targetDiv.tier;
        club.reputation = Math.max(35, club.reputation - 2);
      }
    }
  });

  // 6. Determinar el destino del club del usuario
  const userClubAfter = evolvedClubs.find((c) => c.id === userClubId) || evolvedClubs[0];
  const userNewTier = userClubAfter.tier || 1;

  let userOutcome: 'champion' | 'promoted' | 'relegated' | 'stayed' = 'stayed';
  if (userPos === 1) {
    userOutcome = 'champion';
  } else if (userNewTier < userOldTier) {
    userOutcome = 'promoted';
  } else if (userNewTier > userOldTier) {
    userOutcome = 'relegated';
  }

  // 7. Generar nuevo calendario de 46 jornadas para la división del club del usuario
  const nextSeason = currentSeason + 1;
  const userNewDivId = userClubAfter.divisionId || userClubAfter.league;
  const divClubs = evolvedClubs.filter((c) => (c.divisionId || c.league) === userNewDivId);
  const clubsForFixtures = divClubs.length >= 2 ? divClubs : evolvedClubs;
  const newFixtures = generateSeasonFixtures(nextSeason, clubsForFixtures);

  const historyEntry: SeasonHistoryEntry = {
    seasonNumber: currentSeason,
    championClubId: champion.clubId,
    championClubName: champion.clubName,
    userPosition: userPos,
    userClubId,
    userClubName: userClub.name,
    topScorerName: topScorer?.name || 'Desconocido',
    topScorerGoals: topScorer?.seasonGoals || 0,
    topScorerClubName: topClub?.name || 'Liga',
    prizeMoneyYen: userPrize,
    divisionId: userClub.divisionId,
    divisionName: countryDivisions.find((d) => d.tier === userOldTier)?.name,
    userOutcome,
    promotedClubNames: promotions.map((p) => p.clubName),
    relegatedClubNames: relegations.map((r) => r.clubName),
  };

  const seasonTransitionReport: SeasonTransitionReport = {
    seasonNumber: currentSeason,
    country,
    userOutcome,
    userClubId,
    userClubName: userClub.name,
    userOldDivisionName: countryDivisions.find((d) => d.tier === userOldTier)?.name || 'División',
    userNewDivisionName: countryDivisions.find((d) => d.tier === userNewTier)?.name || 'División',
    userOldTier,
    userNewTier,
    userPosition: userPos,
    prizeMoneyYen: userPrize,
    champions: [
      { tier: 1, divisionName: div1.name, clubId: tierTables[1][0].clubId, clubName: tierTables[1][0].clubName },
      { tier: 2, divisionName: div2.name, clubId: tierTables[2][0].clubId, clubName: tierTables[2][0].clubName },
      { tier: 3, divisionName: div3.name, clubId: tierTables[3][0].clubId, clubName: tierTables[3][0].clubName },
      { tier: 4, divisionName: div4.name, clubId: tierTables[4][0].clubId, clubName: tierTables[4][0].clubName },
    ],
    promotions,
    relegations,
  };

  return {
    newSeason: nextSeason,
    newClubs: evolvedClubs,
    newPlayers: evolvedPlayers,
    newFixtures,
    seasonHistoryEntry: historyEntry,
    seasonTransitionReport,
  };
}

