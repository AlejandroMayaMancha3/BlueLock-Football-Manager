import {
  Club,
  Player,
  MatchFixture,
  LeagueTableRow,
  SeasonHistoryEntry,
  PromotionRelegationMovement,
  SeasonTransitionReport,
  CountryLeague,
  TierLevel,
  ClubTrophyRecord,
} from '@/types/football-manager';
import { shouldAwakenWeapon, generateContextualWeapon } from './weapon-registry';
import { getDivisionsByCountry, getDivisionById, COUNTRIES_CATALOG } from './data/divisions-catalog';
import { calculatePlayerMarketValue } from './player-valuation';
import { executeAiTransferMarket } from './transfer-engine';
import { getTierPrizePoolYen, getSeasonRenewalSponsorYen, reconcileClubTreasury } from './finance-engine';
import {
  awardTrophyToClub,
  generateSeasonFixturesWithTournaments,
  getUserEuropeanTournamentQualification,
  isTrueChampionshipFinal,
  resolveKnockoutWinnerId,
} from './competitions-engine';

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

  // First leg (Jornadas 1 to 11 o 1 a 23)
  firstLegRounds.forEach((pairs, rIdx) => {
    const roundNum = rIdx + 1;
    pairs.forEach(([h, a], mIdx) => {
      rounds.push({
        id: `fix-s${season}-r${roundNum}-m${mIdx}`,
        season,
        round: roundNum,
        leagueMatchday: roundNum,
        competitionType: 'league',
        roundStageName: `Jornada ${roundNum}`,
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
        leagueMatchday: roundNum,
        competitionType: 'league',
        roundStageName: `Jornada ${roundNum}`,
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

    // Si es partido eliminatorio y finalizó en empate, definir por tanda de penaltis
    if (fix.isKnockout && hScore === aScore) {
      let pH = 4;
      let pA = 4;
      while (pH === pA) {
        pH = Math.floor(Math.random() * 3) + 3;
        pA = Math.floor(Math.random() * 3) + 3;
        if (Math.random() < 0.5) pH += 1;
        else pA += 1;
      }
      fix.penaltyHomeScore = pH;
      fix.penaltyAwayScore = pA;
    }

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

  // Filtrar estrictamente para que solo participen los partidos de liga regular
  const leagueFixtures = fixtures.filter((f) => !f.competitionType || f.competitionType === 'league');

  const fixtureClubIds = new Set<string>();
  leagueFixtures.forEach((f) => {
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

  leagueFixtures.filter((f) => f.isPlayed && f.homeScore !== undefined && f.awayScore !== undefined).forEach((f) => {
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

// Simula la tabla de clasificación realista para una división IA adaptada a las jornadas transcurridas
export function simulateAiDivisionTable(divisionClubs: Club[], targetRounds: number = 46): LeagueTableRow[] {
  const effectiveRounds = Math.max(0, Math.min(46, targetRounds));

  if (effectiveRounds === 0) {
    return divisionClubs.map((club) => ({
      clubId: club.id,
      clubName: club.name,
      shortName: club.shortName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      formHistory: [],
    }));
  }

  const table: LeagueTableRow[] = divisionClubs.map((club) => {
    const basePower = club.level * 1.6 + (club.reputation * 0.4);
    const variance = (Math.random() * 16) - 8;
    return {
      clubId: club.id,
      clubName: club.name,
      shortName: club.shortName,
      played: effectiveRounds,
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
    const fullTargetPoints = Math.max(
      28,
      Math.min(104, Math.round(96 - (rank * 2.7) + (Math.random() * 6 - 3)))
    );
    const roundRatio = effectiveRounds / 46;
    const targetPoints = Math.round(fullTargetPoints * roundRatio);

    const fullDraws = Math.floor(Math.random() * 7) + 8;
    const scaledDraws = Math.min(effectiveRounds, Math.round(fullDraws * roundRatio));
    const scaledWins = Math.max(0, Math.min(effectiveRounds - scaledDraws, Math.floor((targetPoints - scaledDraws) / 3)));
    const scaledLosses = Math.max(0, effectiveRounds - scaledWins - scaledDraws);
    const actualPoints = (scaledWins * 3) + scaledDraws;

    const fullGf = Math.max(25, Math.round((scaledWins * 2.1) + (scaledDraws * 0.9) + Math.random() * 10));
    const fullGa = Math.max(20, Math.round((scaledLosses * 1.8) + (scaledDraws * 0.9) + Math.random() * 8));
    const goalsFor = Math.max(0, Math.round(fullGf * roundRatio));
    const goalsAgainst = Math.max(0, Math.round(fullGa * roundRatio));

    row.played = effectiveRounds;
    row.won = scaledWins;
    row.drawn = scaledDraws;
    row.lost = scaledLosses;
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
  table: LeagueTableRow[],
  pastFixtures?: MatchFixture[]
): {
  newSeason: number;
  newClubs: Club[];
  newPlayers: Player[];
  newFixtures: MatchFixture[];
  seasonHistoryEntry: SeasonHistoryEntry;
  seasonTransitionReport: SeasonTransitionReport;
  earnedTrophy?: ClubTrophyRecord;
} {
  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPos = table.findIndex((r) => r.clubId === userClubId) + 1;
  const userOldTier = (userClub.tier || getDivisionById(userClub.divisionId || userClub.league)?.tier || 1) as TierLevel;
  const champion = table[0];

  // Premios económicos escalonados por división y categoría (Tier 1 a 4)
  const userTierPrizePool = getTierPrizePoolYen(userOldTier);
  const userPrize = userTierPrizePool[userPos - 1] || userTierPrizePool[userTierPrizePool.length - 1];

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
        (c) => players.filter((ep) => ep.clubId === c.id).length < 25
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

  // 2. Evolución de presupuestos, patrocinios y alineaciones de los clubes
  const evolvedClubs: Club[] = clubs.map((c) => {
    const isUserC = c.id === userClubId;
    const pos = isUserC ? userPos : Math.floor(Math.random() * 24) + 1;
    const cTier = (c.tier || getDivisionById(c.divisionId || c.league)?.tier || 1) as TierLevel;
    const tierPrizePool = getTierPrizePoolYen(cTier);
    const prize = isUserC ? userPrize : tierPrizePool[pos - 1] || tierPrizePool[tierPrizePool.length - 1];
    const seasonSponsor = getSeasonRenewalSponsorYen(cTier, c.reputation);

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

    const updatedCash = c.cashYen + prize + seasonSponsor;
    const updatedBudget = Math.round(c.budgetYen * 0.9) + Math.round((prize + seasonSponsor) * 0.65);

    const clubCandidate: Club = {
      ...c,
      cashYen: updatedCash,
      budgetYen: updatedBudget,
      startingXI,
      substitutes,
      captainId: validCaptain,
      penaltyTakerId: validPenalty,
      freeKickTakerId: validFk,
    };

    const { reconciledClub } = reconcileClubTreasury(clubCandidate);
    return reconciledClub;
  });

  // 3. Simulación de la pirámide completa y ascensos/descensos para TODAS las 5 naciones
  const userCountry = (userClub.country as CountryLeague) || 'Spain';
  const allPromotions: PromotionRelegationMovement[] = [];
  const allRelegations: PromotionRelegationMovement[] = [];
  const countryChampions: Record<string, { tier: number; divisionName: string; clubId: string; clubName: string }[]> = {};
  const allTier1Tables: Record<CountryLeague, LeagueTableRow[]> = {
    Spain: [],
    England: [],
    Germany: [],
    Italy: [],
    France: [],
  };

  COUNTRIES_CATALOG.forEach((cntry) => {
    const cDivisions = getDivisionsByCountry(cntry.id);
    const cDiv1 = cDivisions.find((d) => d.tier === 1)!;
    const cDiv2 = cDivisions.find((d) => d.tier === 2)!;
    const cDiv3 = cDivisions.find((d) => d.tier === 3)!;
    const cDiv4 = cDivisions.find((d) => d.tier === 4)!;

    const cTierTables: Record<number, LeagueTableRow[]> = {};
    [1, 2, 3, 4].forEach((t) => {
      if (cntry.id === userCountry && userOldTier === t) {
        cTierTables[t] = table;
      } else {
        const div = cDivisions.find((d) => d.tier === t)!;
        const divClubs = evolvedClubs.filter((c) => (c.divisionId || c.league) === div.id);
        cTierTables[t] = simulateAiDivisionTable(divClubs);
      }
    });

    allTier1Tables[cntry.id as CountryLeague] = cTierTables[1] || [];

    countryChampions[cntry.id] = [
      { tier: 1, divisionName: cDiv1.name, clubId: cTierTables[1][0]?.clubId || '', clubName: cTierTables[1][0]?.clubName || '' },
      { tier: 2, divisionName: cDiv2.name, clubId: cTierTables[2][0]?.clubId || '', clubName: cTierTables[2][0]?.clubName || '' },
      { tier: 3, divisionName: cDiv3.name, clubId: cTierTables[3][0]?.clubId || '', clubName: cTierTables[3][0]?.clubName || '' },
      { tier: 4, divisionName: cDiv4.name, clubId: cTierTables[4][0]?.clubId || '', clubName: cTierTables[4][0]?.clubName || '' },
    ];

    // --- INTERCAMBIO TIER 1 <-> TIER 2 ---
    // Descienden de Tier 1 a Tier 2 (total 3 equipos: directos + playoff/relegation)
    const t1RelegCount = (cDiv1.relegationDirect || 0) + (cDiv1.relegationPlayoff || 0) || 3;
    const t1RelegatedRows = cTierTables[1].slice(-t1RelegCount);
    t1RelegatedRows.forEach((row, idx) => {
      allRelegations.push({
        clubId: row.clubId,
        clubName: row.clubName,
        fromDivisionId: cDiv1.id,
        fromDivisionName: cDiv1.name,
        toDivisionId: cDiv2.id,
        toDivisionName: cDiv2.name,
        type: 'relegation_direct',
        finalPosition: (cTierTables[1].length - t1RelegCount) + idx + 1,
      });
    });

    // Ascienden de Tier 2 a Tier 1 (1.º y 2.º directo + ganador playoff 3.º al 6.º)
    const t2DirectCount = cDiv2.promotionDirect || 2;
    const t2PlayoffCount = cDiv2.promotionPlayoff || 4;
    const t2DirectPromRows = cTierTables[2].slice(0, t2DirectCount);
    t2DirectPromRows.forEach((row, idx) => {
      allPromotions.push({
        clubId: row.clubId,
        clubName: row.clubName,
        fromDivisionId: cDiv2.id,
        fromDivisionName: cDiv2.name,
        toDivisionId: cDiv1.id,
        toDivisionName: cDiv1.name,
        type: 'promotion_direct',
        finalPosition: idx + 1,
      });
    });

    const t2PlayoffRows = cTierTables[2].slice(t2DirectCount, t2DirectCount + t2PlayoffCount);
    if (t2PlayoffRows.length > 0) {
      const userInT2Playoff = t2PlayoffRows.find((r) => r.clubId === userClubId);
      const t2PlayoffWinnerRow = userInT2Playoff || t2PlayoffRows[Math.floor(Math.random() * t2PlayoffRows.length)] || t2PlayoffRows[0];
      allPromotions.push({
        clubId: t2PlayoffWinnerRow.clubId,
        clubName: t2PlayoffWinnerRow.clubName,
        fromDivisionId: cDiv2.id,
        fromDivisionName: cDiv2.name,
        toDivisionId: cDiv1.id,
        toDivisionName: cDiv1.name,
        type: 'promotion_playoff',
        finalPosition: cTierTables[2].findIndex((r) => r.clubId === t2PlayoffWinnerRow.clubId) + 1,
      });
    }

    // --- INTERCAMBIO TIER 2 <-> TIER 3 ---
    // Descienden de Tier 2 a Tier 3 (total 3 equipos: directos + playoff/relegation)
    const t2RelegCount = (cDiv2.relegationDirect || 0) + (cDiv2.relegationPlayoff || 0) || 3;
    const t2RelegatedRows = cTierTables[2].slice(-t2RelegCount);
    t2RelegatedRows.forEach((row, idx) => {
      allRelegations.push({
        clubId: row.clubId,
        clubName: row.clubName,
        fromDivisionId: cDiv2.id,
        fromDivisionName: cDiv2.name,
        toDivisionId: cDiv3.id,
        toDivisionName: cDiv3.name,
        type: 'relegation_direct',
        finalPosition: (cTierTables[2].length - t2RelegCount) + idx + 1,
      });
    });

    // Ascienden de Tier 3 a Tier 2 (1.º y 2.º directo + ganador playoff 3.º al 6.º)
    const t3DirectCount = cDiv3.promotionDirect || 2;
    const t3PlayoffCount = cDiv3.promotionPlayoff || 4;
    const t3DirectPromRows = cTierTables[3].slice(0, t3DirectCount);
    t3DirectPromRows.forEach((row, idx) => {
      allPromotions.push({
        clubId: row.clubId,
        clubName: row.clubName,
        fromDivisionId: cDiv3.id,
        fromDivisionName: cDiv3.name,
        toDivisionId: cDiv2.id,
        toDivisionName: cDiv2.name,
        type: 'promotion_direct',
        finalPosition: idx + 1,
      });
    });

    const t3PlayoffRows = cTierTables[3].slice(t3DirectCount, t3DirectCount + t3PlayoffCount);
    if (t3PlayoffRows.length > 0) {
      const userInT3Playoff = t3PlayoffRows.find((r) => r.clubId === userClubId);
      const t3PlayoffWinnerRow = userInT3Playoff || t3PlayoffRows[Math.floor(Math.random() * t3PlayoffRows.length)] || t3PlayoffRows[0];
      allPromotions.push({
        clubId: t3PlayoffWinnerRow.clubId,
        clubName: t3PlayoffWinnerRow.clubName,
        fromDivisionId: cDiv3.id,
        fromDivisionName: cDiv3.name,
        toDivisionId: cDiv2.id,
        toDivisionName: cDiv2.name,
        type: 'promotion_playoff',
        finalPosition: cTierTables[3].findIndex((r) => r.clubId === t3PlayoffWinnerRow.clubId) + 1,
      });
    }

    // --- INTERCAMBIO TIER 3 <-> TIER 4 ---
    // Descienden de Tier 3 a Tier 4 (total 4 equipos: directos + playoff)
    const t3RelegCount = (cDiv3.relegationDirect || 0) + (cDiv3.relegationPlayoff || 0) || 4;
    const t3RelegatedRows = cTierTables[3].slice(-t3RelegCount);
    t3RelegatedRows.forEach((row, idx) => {
      allRelegations.push({
        clubId: row.clubId,
        clubName: row.clubName,
        fromDivisionId: cDiv3.id,
        fromDivisionName: cDiv3.name,
        toDivisionId: cDiv4.id,
        toDivisionName: cDiv4.name,
        type: 'relegation_direct',
        finalPosition: (cTierTables[3].length - t3RelegCount) + idx + 1,
      });
    });

    // Ascienden de Tier 4 a Tier 3 (1.º, 2.º y 3.º directo + ganador playoff 4.º al 7.º)
    const t4DirectCount = cDiv4.promotionDirect || 3;
    const t4PlayoffCount = cDiv4.promotionPlayoff || 4;
    const t4DirectPromRows = cTierTables[4].slice(0, t4DirectCount);
    t4DirectPromRows.forEach((row, idx) => {
      allPromotions.push({
        clubId: row.clubId,
        clubName: row.clubName,
        fromDivisionId: cDiv4.id,
        fromDivisionName: cDiv4.name,
        toDivisionId: cDiv3.id,
        toDivisionName: cDiv3.name,
        type: 'promotion_direct',
        finalPosition: idx + 1,
      });
    });

    const t4PlayoffRows = cTierTables[4].slice(t4DirectCount, t4DirectCount + t4PlayoffCount);
    if (t4PlayoffRows.length > 0) {
      const userInT4Playoff = t4PlayoffRows.find((r) => r.clubId === userClubId);
      const t4PlayoffWinnerRow = userInT4Playoff || t4PlayoffRows[Math.floor(Math.random() * t4PlayoffRows.length)] || t4PlayoffRows[0];
      allPromotions.push({
        clubId: t4PlayoffWinnerRow.clubId,
        clubName: t4PlayoffWinnerRow.clubName,
        fromDivisionId: cDiv4.id,
        fromDivisionName: cDiv4.name,
        toDivisionId: cDiv3.id,
        toDivisionName: cDiv3.name,
        type: 'promotion_playoff',
        finalPosition: cTierTables[4].findIndex((r) => r.clubId === t4PlayoffWinnerRow.clubId) + 1,
      });
    }
  });

  // 4. Aplicar cambios de categoría a los clubes
  const promotionMap = new Map(allPromotions.map((p) => [p.clubId, p]));
  const relegationMap = new Map(allRelegations.map((r) => [r.clubId, r]));

  evolvedClubs.forEach((club) => {
    if (!club.tier) {
      const d = getDivisionById(club.divisionId || club.league);
      if (d) club.tier = d.tier;
    }

    const prom = promotionMap.get(club.id);
    if (prom) {
      club.divisionId = prom.toDivisionId;
      club.league = prom.toDivisionId;
      const targetDiv = getDivisionById(prom.toDivisionId);
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
      const targetDiv = getDivisionById(rel.toDivisionId);
      if (targetDiv) {
        club.tier = targetDiv.tier;
        club.reputation = Math.max(35, club.reputation - 2);
      }
    }
  });

  // 5. Mercado de fichajes de pretemporada entre clubes rivales
  // Los clubes recién ascendidos (como el CD Utrera) y clubes con presupuesto invierten activamente
  // en reforzar sus plantillas antes del arranque de la nueva temporada.
  const nextSeason = currentSeason + 1;
  const promotedClubIds = new Set(allPromotions.map((p) => p.clubId));
  const preSeasonMarket = executeAiTransferMarket(
    evolvedClubs,
    evolvedPlayers,
    nextSeason,
    1,
    userClubId,
    {
      maxTransfers: 35,
      isPreSeason: true,
      promotedClubIds,
    }
  );

  const finalEvolvedClubs = preSeasonMarket.updatedClubs;
  const finalEvolvedPlayers = [...preSeasonMarket.updatedPlayers];
  const preSeasonRivalTransfers = preSeasonMarket.news;

  // 5b. Garantizar nómina mínima viable (>= 18 futbolistas) para que ningún club quede descalificado o incompleto
  finalEvolvedClubs.forEach((club) => {
    let clubPlayers = finalEvolvedPlayers.filter((p) => p.clubId === club.id);
    const needed = 18 - clubPlayers.length;
    if (needed > 0) {
      const positions: Array<'DC' | 'MC' | 'DFC' | 'POR' | 'EI' | 'ED' | 'LI' | 'LD'> = [
        'DC', 'MC', 'DFC', 'POR', 'EI', 'ED', 'LI', 'LD',
      ];
      for (let k = 0; k < needed; k++) {
        const pos = positions[k % positions.length];
        const age = 17 + Math.floor(Math.random() * 4);
        const ovr = Math.min(88, Math.max(52, club.level - Math.floor(Math.random() * 6) - 4));
        const pot = Math.min(94, ovr + Math.floor(Math.random() * 8) + 4);
        const canterano: Player = {
          id: `ply-gen-s${nextSeason}-${club.id}-${Date.now()}-${k}`,
          name: `Canterano ${club.shortName} #${k + 1}`,
          age,
          nationality: (club.country || 'Spain') as string,
          clubId: club.id,
          position: pos,
          overall: ovr,
          potential: pot,
          stats: {
            pace: Math.min(99, Math.max(40, ovr + Math.floor(Math.random() * 10) - 5)),
            shooting: Math.min(99, Math.max(40, ovr + Math.floor(Math.random() * 10) - 5)),
            passing: Math.min(99, Math.max(40, ovr + Math.floor(Math.random() * 10) - 5)),
            dribbling: Math.min(99, Math.max(40, ovr + Math.floor(Math.random() * 10) - 5)),
            defense: Math.min(99, Math.max(40, ovr + Math.floor(Math.random() * 10) - 5)),
            physical: Math.min(99, Math.max(40, ovr + Math.floor(Math.random() * 10) - 5)),
            goalkeeping: pos === 'POR' ? ovr : 20,
          },
          weapons: [],
          egoRating: Math.floor(Math.random() * 30) + 45,
          flowState: false,
          marketValueYen: Math.round(ovr * 1500000),
          weeklyWageYen: Math.round(ovr * 15000),
          fitness: 100,
          morale: 80,
          form: 75,
          contractYears: 3,
          isTransferListed: false,
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
        finalEvolvedPlayers.push(canterano);
        clubPlayers.push(canterano);
      }
    }

    const validMemberIds = new Set(clubPlayers.map((p) => p.id));
    let validStartingXI = club.startingXI.filter((id) => validMemberIds.has(id));
    if (validStartingXI.length < 11) {
      const candidates = clubPlayers
        .filter((p) => !validStartingXI.includes(p.id))
        .sort((a, b) => b.overall - a.overall);
      while (validStartingXI.length < 11 && candidates.length > 0) {
        validStartingXI.push(candidates.shift()!.id);
      }
    }
    const validSubs = clubPlayers
      .map((p) => p.id)
      .filter((id) => !validStartingXI.includes(id))
      .slice(0, 7);

    club.startingXI = validStartingXI;
    club.substitutes = validSubs;
  });

  // 6. Determinar el destino del club del usuario
  const userClubAfter = finalEvolvedClubs.find((c) => c.id === userClubId) || finalEvolvedClubs[0];
  const userNewTier = (userClubAfter.tier || getDivisionById(userClubAfter.divisionId || userClubAfter.league)?.tier || 1) as TierLevel;

  let userOutcome: 'champion' | 'promoted' | 'relegated' | 'stayed' = 'stayed';
  if (userNewTier < userOldTier) {
    userOutcome = userPos === 1 ? 'champion' : 'promoted';
  } else if (userNewTier > userOldTier) {
    userOutcome = 'relegated';
  } else {
    userOutcome = userPos === 1 ? 'champion' : 'stayed';
  }

  // 7. Evaluar clasificación reglamentaria a competiciones UEFA y generar calendario de la nueva temporada
  // Buscar ganadores reales de los torneos disputados en la temporada previa
  const playedCupFinal = pastFixtures?.find(
    (f) =>
      f.competitionType === 'cup' &&
      f.isPlayed &&
      isTrueChampionshipFinal(f.roundStageName, f.trophyKey)
  );
  const actualCupWinnerId = playedCupFinal
    ? resolveKnockoutWinnerId(playedCupFinal, playedCupFinal.homeClubId, playedCupFinal.awayClubId)
    : undefined;

  const playedUclFinal = pastFixtures?.find(
    (f) =>
      f.competitionType === 'ucl' &&
      f.isPlayed &&
      isTrueChampionshipFinal(f.roundStageName, f.trophyKey)
  );
  const uclChampId = playedUclFinal
    ? resolveKnockoutWinnerId(playedUclFinal, playedUclFinal.homeClubId, playedUclFinal.awayClubId)
    : undefined;

  const playedUelFinal = pastFixtures?.find(
    (f) =>
      f.competitionType === 'uel' &&
      f.isPlayed &&
      isTrueChampionshipFinal(f.roundStageName, f.trophyKey)
  );
  const uelChampId = playedUelFinal
    ? resolveKnockoutWinnerId(playedUelFinal, playedUelFinal.homeClubId, playedUelFinal.awayClubId)
    : undefined;

  const cupWinners: Record<CountryLeague, { mainCupWinnerClubId: string; secondaryCupWinnerClubId?: string }> = {
    Spain: {
      mainCupWinnerClubId:
        userCountry === 'Spain' && actualCupWinnerId
          ? actualCupWinnerId
          : allTier1Tables.Spain[1]?.clubId || allTier1Tables.Spain[0]?.clubId || '',
    },
    England: {
      mainCupWinnerClubId:
        userCountry === 'England' && actualCupWinnerId
          ? actualCupWinnerId
          : allTier1Tables.England[2]?.clubId || allTier1Tables.England[0]?.clubId || '',
      secondaryCupWinnerClubId: allTier1Tables.England[3]?.clubId || allTier1Tables.England[1]?.clubId || '',
    },
    Germany: {
      mainCupWinnerClubId:
        userCountry === 'Germany' && actualCupWinnerId
          ? actualCupWinnerId
          : allTier1Tables.Germany[1]?.clubId || allTier1Tables.Germany[0]?.clubId || '',
    },
    Italy: {
      mainCupWinnerClubId:
        userCountry === 'Italy' && actualCupWinnerId
          ? actualCupWinnerId
          : allTier1Tables.Italy[1]?.clubId || allTier1Tables.Italy[0]?.clubId || '',
    },
    France: {
      mainCupWinnerClubId:
        userCountry === 'France' && actualCupWinnerId
          ? actualCupWinnerId
          : allTier1Tables.France[1]?.clubId || allTier1Tables.France[0]?.clubId || '',
    },
  };

  const euroQual = getUserEuropeanTournamentQualification(
    allTier1Tables,
    cupWinners,
    userClubId,
    {
      performanceSpotCountries: ['Spain', 'England'],
      uclDefendingChampionClubId: uclChampId,
      uelDefendingChampionClubId: uelChampId,
    }
  );

  const userEuropeanTournament = euroQual.tournament;
  const userEuropeanReason =
    euroQual.reason ||
    (userOldTier !== 1
      ? `Club militante en categorías inferiores (Tier ${userOldTier}) - Sin acceso continental`
      : userPos >= 8
      ? `Puesto ${userPos}.º en liga regular - Sin acceso continental`
      : 'No clasificado para competiciones continentales');

  const userNewDivId = userClubAfter.divisionId || userClubAfter.league;
  const divClubs = finalEvolvedClubs.filter((c) => (c.divisionId || c.league) === userNewDivId);
  const clubsForFixtures = divClubs.length >= 2 ? divClubs : finalEvolvedClubs;
  const newFixtures = generateSeasonFixturesWithTournaments(
    nextSeason,
    clubsForFixtures,
    finalEvolvedClubs,
    userClubId,
    {
      europeanTournament: userEuropeanTournament,
    }
  );

  const userCountryDivisions = getDivisionsByCountry(userCountry);
  const userCountryDivIds = new Set(userCountryDivisions.map((d) => d.id));
  const userPromotions = allPromotions.filter((p) => userCountryDivIds.has(p.toDivisionId) || userCountryDivIds.has(p.fromDivisionId));
  const userRelegations = allRelegations.filter((r) => userCountryDivIds.has(r.toDivisionId) || userCountryDivIds.has(r.fromDivisionId));

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
    divisionName: userCountryDivisions.find((d) => d.tier === userOldTier)?.name,
    userOutcome,
    promotedClubNames: userPromotions.map((p) => p.clubName),
    relegatedClubNames: userRelegations.map((r) => r.clubName),
    europeanQualification: userEuropeanTournament,
    europeanQualificationReason: userEuropeanReason,
  };

  const seasonTransitionReport: SeasonTransitionReport = {
    seasonNumber: currentSeason,
    country: userCountry,
    userOutcome,
    userClubId,
    userClubName: userClub.name,
    userOldDivisionName: userCountryDivisions.find((d) => d.tier === userOldTier)?.name || 'División',
    userNewDivisionName: userCountryDivisions.find((d) => d.tier === userNewTier)?.name || 'División',
    userOldTier,
    userNewTier,
    userPosition: userPos,
    prizeMoneyYen: userPrize,
    champions: countryChampions[userCountry] || [],
    promotions: userPromotions,
    relegations: userRelegations,
    rivalTransfers: preSeasonRivalTransfers,
    europeanQualification: userEuropeanTournament,
    europeanQualificationReason: userEuropeanReason,
  };

  let earnedTrophy: ClubTrophyRecord | undefined;
  if (userPos === 1) {
    earnedTrophy = awardTrophyToClub(userClub, userClub.divisionId || '', currentSeason, {
      customCompetitionName: userCountryDivisions.find((d) => d.tier === userOldTier)?.name,
      dateStr: `Temporada ${currentSeason}`,
    });
  }

  return {
    newSeason: nextSeason,
    newClubs: finalEvolvedClubs,
    newPlayers: finalEvolvedPlayers,
    newFixtures,
    seasonHistoryEntry: historyEntry,
    seasonTransitionReport,
    earnedTrophy,
  };
}

