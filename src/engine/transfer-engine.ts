import {
  Club,
  Player,
  Position,
  TransferNewsEntry,
  CountryLeague,
} from '@/types/football-manager';
import { calculateOvr } from './game-data';
import { calculatePlayerMarketValue } from './player-valuation';
import { NAME_DATABASE } from './data/leagues-catalog';

export type PositionDepartment = 'POR' | 'DEF' | 'MED' | 'DEL';

export function getPositionDepartment(pos: Position): PositionDepartment {
  if (pos === 'POR') return 'POR';
  if (['DFC', 'LI', 'LD', 'CAI', 'CAD'].includes(pos)) return 'DEF';
  if (['MC', 'MCD', 'MCO', 'MI', 'MD'].includes(pos)) return 'MED';
  return 'DEL'; // 'DC', 'EI', 'ED'
}

export const MIN_DEPARTMENT_COUNTS: Record<PositionDepartment, number> = {
  POR: 2,
  DEF: 4,
  MED: 4,
  DEL: 2,
};

/**
 * Evalúa si una plantilla tiene deficiencias críticas en alguna línea o puesto clave
 */
export function checkSquadDepartmentDeficit(squad: Player[]): {
  isDeficient: boolean;
  department: PositionDepartment | null;
  targetPosition: Position;
} {
  const gks = squad.filter((p) => p.position === 'POR');
  if (gks.length < 2) {
    return { isDeficient: true, department: 'POR', targetPosition: 'POR' };
  }

  const dcs = squad.filter((p) => p.position === 'DC');
  const fwds = squad.filter((p) => ['DC', 'EI', 'ED'].includes(p.position));
  if (dcs.length === 0 || fwds.length < 2) {
    return { isDeficient: true, department: 'DEL', targetPosition: 'DC' };
  }

  const defs = squad.filter((p) => ['DFC', 'LI', 'LD', 'CAI', 'CAD'].includes(p.position));
  if (defs.length < 4) {
    return { isDeficient: true, department: 'DEF', targetPosition: 'DFC' };
  }

  const mids = squad.filter((p) => ['MC', 'MCD', 'MCO', 'MI', 'MD'].includes(p.position));
  if (mids.length < 4) {
    return { isDeficient: true, department: 'MED', targetPosition: 'MC' };
  }

  return { isDeficient: false, department: null, targetPosition: 'DC' };
}

/**
 * Genera un canterano de emergencia de calidad adecuada para el club si no encuentra recambio en el mercado
 */
export function generateEmergencyAcademyPlayer(
  club: Club,
  position: Position,
  country: CountryLeague
): Player {
  const namePool = NAME_DATABASE[country] || NAME_DATABASE.Spain;
  const firstName = namePool.first[Math.floor(Math.random() * namePool.first.length)];
  const lastName = namePool.last[Math.floor(Math.random() * namePool.last.length)];
  const fullName = `${firstName} ${lastName}`;
  const age = Math.floor(Math.random() * 4) + 18; // 18 a 21 años

  const targetOvr = Math.min(88, Math.max(54, club.level - Math.floor(Math.random() * 3) - 1));
  const stats = {
    pace: Math.min(94, Math.max(50, targetOvr + Math.floor(Math.random() * 11) - 5)),
    shooting: ['DC', 'EI', 'ED', 'MCO'].includes(position)
      ? Math.min(94, Math.max(55, targetOvr + Math.floor(Math.random() * 9) - 4))
      : Math.max(30, targetOvr - 22),
    passing: ['MC', 'MCO', 'MI', 'MD'].includes(position)
      ? Math.min(94, Math.max(55, targetOvr + Math.floor(Math.random() * 9) - 4))
      : Math.max(35, targetOvr - 18),
    dribbling: ['EI', 'ED', 'MCO', 'MC'].includes(position)
      ? Math.min(94, Math.max(55, targetOvr + Math.floor(Math.random() * 9) - 4))
      : Math.max(35, targetOvr - 18),
    defense: ['DFC', 'MCD', 'LI', 'LD', 'CAD', 'CAI'].includes(position)
      ? Math.min(94, Math.max(55, targetOvr + Math.floor(Math.random() * 9) - 4))
      : Math.max(30, targetOvr - 25),
    physical: Math.min(94, Math.max(50, targetOvr + Math.floor(Math.random() * 9) - 4)),
    goalkeeping: position === 'POR' ? Math.min(94, Math.max(56, targetOvr + Math.floor(Math.random() * 6) - 2)) : 15,
  };

  const finalOvr = calculateOvr(position, stats);
  const potential = Math.min(95, finalOvr + Math.floor(Math.random() * 8) + 4);

  const val = calculatePlayerMarketValue({
    overall: finalOvr,
    potential,
    age,
    weapons: [],
    egoRating: 72,
    position,
  });

  return {
    id: `p-${club.id}-emer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clubId: club.id,
    name: fullName,
    age,
    nationality: country,
    position,
    overall: finalOvr,
    potential,
    stats,
    weapons: [],
    egoRating: 70,
    flowState: false,
    fitness: 100,
    morale: 88,
    form: 75,
    marketValueYen: val.marketValueYen,
    weeklyWageYen: val.weeklyWageYen,
    contractYears: 3,
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
}

/**
 * Reorganiza y optimiza titulares y suplentes tras un fichaje o salida
 */
export function rebalanceClubLineup(club: Club, clubPlayers: Player[]): void {
  const currentXi = club.startingXI.filter((id) => clubPlayers.some((p) => p.id === id));
  const currentSubs = club.substitutes.filter((id) => clubPlayers.some((p) => p.id === id));

  const availableStarters = [...currentXi];
  // Si faltan titulares para llegar a 11, ascender a los mejores futbolistas disponibles
  if (availableStarters.length < 11 && clubPlayers.length >= 11) {
    const pool = clubPlayers
      .filter((p) => !availableStarters.includes(p.id))
      .sort((a, b) => b.overall - a.overall);
    while (availableStarters.length < 11 && pool.length > 0) {
      availableStarters.push(pool.shift()!.id);
    }
  }

  // Si hay futbolistas en la plantilla con mejor media que titulares en la misma posición, promoverlos
  clubPlayers.forEach((p) => {
    if (!availableStarters.includes(p.id)) {
      const samePosStarter = availableStarters
        .map((id) => clubPlayers.find((cp) => cp.id === id)!)
        .filter((sp) => sp && sp.position === p.position)
        .sort((a, b) => a.overall - b.overall)[0];

      if (samePosStarter && p.overall > samePosStarter.overall) {
        const replaceIdx = availableStarters.indexOf(samePosStarter.id);
        if (replaceIdx !== -1) {
          availableStarters[replaceIdx] = p.id;
        }
      }
    }
  });

  const availableSubs = clubPlayers
    .filter((p) => !availableStarters.includes(p.id))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 7)
    .map((p) => p.id);

  club.startingXI = availableStarters.slice(0, 11);
  club.substitutes = availableSubs;

  const validCaptain = clubPlayers.some((p) => p.id === club.captainId)
    ? club.captainId
    : club.startingXI[0] || clubPlayers[0]?.id;
  const validPenalty = clubPlayers.some((p) => p.id === club.penaltyTakerId)
    ? club.penaltyTakerId
    : club.startingXI.find((id) => clubPlayers.find((p) => p.id === id)?.position === 'DC') || validCaptain;
  const validFk = clubPlayers.some((p) => p.id === club.freeKickTakerId)
    ? club.freeKickTakerId
    : club.startingXI.find((id) => ['MCO', 'MC', 'EI'].includes(clubPlayers.find((p) => p.id === id)?.position || '')) || validCaptain;

  club.captainId = validCaptain;
  club.penaltyTakerId = validPenalty;
  club.freeKickTakerId = validFk;
}

/**
 * Reemplazo inmediato para un club que vendió a su jugador y quedó con déficit posicional (ej: sin delanteros)
 */
export function executeEmergencyReplacement(
  sellerClub: Club,
  allClubs: Club[],
  allPlayers: Player[],
  season: number,
  round: number,
  userClubId: string
): { updatedClubs: Club[]; updatedPlayers: Player[]; news?: TransferNewsEntry } {
  let clubsCopy = [...allClubs];
  let playersCopy = [...allPlayers];

  const sellerCurrentSquad = playersCopy.filter((p) => p.clubId === sellerClub.id);
  const deficitCheck = checkSquadDepartmentDeficit(sellerCurrentSquad);

  if (!deficitCheck.isDeficient) {
    return { updatedClubs: clubsCopy, updatedPlayers: playersCopy };
  }

  const targetDept = deficitCheck.department!;
  const targetPos = deficitCheck.targetPosition;
  const maxSpend = Math.min(sellerClub.budgetYen, sellerClub.cashYen);

  // 1. Buscar en otros clubes rivales un jugador disponible de esa posición que el club pueda pagar
  const rivalCandidateClubs = clubsCopy.filter(
    (c) => c.id !== sellerClub.id && c.id !== userClubId
  );

  let bestCandidate: { player: Player; club: Club; fee: number } | null = null;

  for (const rivalC of rivalCandidateClubs) {
    const rivalSquad = playersCopy.filter((p) => p.clubId === rivalC.id);
    if (rivalSquad.length <= 16) continue;

    const rivalInDept = rivalSquad.filter((p) => getPositionDepartment(p.position) === targetDept);
    if (rivalInDept.length <= 2) continue; // No dejar al club rival desprotegido

    const eligiblePlayers = rivalInDept.filter((p) => {
      const fee = Math.round(p.marketValueYen * (0.95 + Math.random() * 0.15));
      return fee <= maxSpend && p.overall >= sellerClub.level - 8;
    });

    if (eligiblePlayers.length > 0) {
      eligiblePlayers.sort((a, b) => b.overall - a.overall);
      const topP = eligiblePlayers[0];
      const fee = Math.round(topP.marketValueYen * (0.95 + Math.random() * 0.15));

      if (!bestCandidate || topP.overall > bestCandidate.player.overall) {
        bestCandidate = { player: topP, club: rivalC, fee };
      }
    }
  }

  if (bestCandidate) {
    const fee = bestCandidate.fee;
    const boughtPlayer = bestCandidate.player;
    const fromClub = bestCandidate.club;

    // Actualizar presupuestos respetando el límite
    sellerClub.cashYen = Math.max(0, sellerClub.cashYen - fee);
    sellerClub.budgetYen = Math.min(sellerClub.cashYen, Math.max(0, sellerClub.budgetYen - fee));
    fromClub.cashYen += fee;
    fromClub.budgetYen = Math.min(fromClub.cashYen, fromClub.budgetYen + Math.round(fee * 0.85));

    // Cambiar club del jugador
    playersCopy = playersCopy.map((p) =>
      p.id === boughtPlayer.id
        ? {
            ...p,
            clubId: sellerClub.id,
            contractYears: 3,
            morale: 90,
            isTransferListed: false,
          }
        : p
    );

    // Rebalancear alineaciones
    const newSellerSquad = playersCopy.filter((p) => p.clubId === sellerClub.id);
    const newFromSquad = playersCopy.filter((p) => p.clubId === fromClub.id);
    rebalanceClubLineup(sellerClub, newSellerSquad);
    rebalanceClubLineup(fromClub, newFromSquad);

    const newsEntry: TransferNewsEntry = {
      id: `tr-emer-${Date.now()}-${boughtPlayer.id}`,
      season,
      round,
      playerId: boughtPlayer.id,
      playerName: boughtPlayer.name,
      playerPosition: boughtPlayer.position,
      playerOverall: boughtPlayer.overall,
      fromClubId: fromClub.id,
      fromClubName: fromClub.name,
      toClubId: sellerClub.id,
      toClubName: sellerClub.name,
      feeYen: fee,
      dateStr: `Jornada ${round}`,
      isImportant: true,
    };

    return { updatedClubs: clubsCopy, updatedPlayers: playersCopy, news: newsEntry };
  }

  // 2. Si ningún club rival tenía excedente pagable, promover un canterano de emergencia
  const country = (sellerClub.country as CountryLeague) || 'Spain';
  const youthReplacement = generateEmergencyAcademyPlayer(sellerClub, targetPos, country);
  playersCopy.push(youthReplacement);

  const devFee = Math.min(sellerClub.budgetYen, Math.round(youthReplacement.marketValueYen * 0.15));
  sellerClub.budgetYen = Math.max(0, sellerClub.budgetYen - devFee);
  sellerClub.cashYen = Math.max(0, sellerClub.cashYen - devFee);

  const updatedSellerSquad = playersCopy.filter((p) => p.clubId === sellerClub.id);
  rebalanceClubLineup(sellerClub, updatedSellerSquad);

  const youthNews: TransferNewsEntry = {
    id: `tr-youth-${Date.now()}-${youthReplacement.id}`,
    season,
    round,
    playerId: youthReplacement.id,
    playerName: youthReplacement.name,
    playerPosition: youthReplacement.position,
    playerOverall: youthReplacement.overall,
    fromClubId: sellerClub.id,
    fromClubName: 'Cantera / Juveniles',
    toClubId: sellerClub.id,
    toClubName: sellerClub.name,
    feeYen: devFee,
    dateStr: `Jornada ${round}`,
    isImportant: false,
  };

  return { updatedClubs: clubsCopy, updatedPlayers: playersCopy, news: youthNews };
}

/**
 * Motor central de fichajes entre clubes rivales (IA vs IA)
 * Permite a los clubes con presupuesto (especialmente clubes ascendidos como CD Utrera y grandes clubes)
 * salir al mercado, invertir su dinero en fichajes para reforzarse y respetar los presupuestos de cada club.
 */
export function executeAiTransferMarket(
  clubs: Club[],
  players: Player[],
  season: number,
  round: number,
  userClubId: string,
  options?: {
    maxTransfers?: number;
    isPreSeason?: boolean;
    promotedClubIds?: Set<string>;
  }
): {
  updatedClubs: Club[];
  updatedPlayers: Player[];
  news: TransferNewsEntry[];
} {
  const maxTransfers = options?.maxTransfers || (options?.isPreSeason ? 35 : 4);
  const promotedSet = options?.promotedClubIds || new Set<string>();

  let clubsCopy = [...clubs];
  let playersCopy = [...players];
  const newsList: TransferNewsEntry[] = [];

  // Filtrar clubes compradores IA válidos con plantilla completa (mínimo 16 futbolistas)
  const aiBuyerCandidates = clubsCopy.filter(
    (c) => c.id !== userClubId && playersCopy.filter((p) => p.clubId === c.id).length >= 16
  );

  // Calcular índice de ambición / urgencia de compra
  const scoredBuyers = aiBuyerCandidates
    .map((club) => {
      const squad = playersCopy.filter((p) => p.clubId === club.id);
      const isPromoted = promotedSet.has(club.id);
      const deficit = checkSquadDepartmentDeficit(squad);

      let urgency = 10;
      if (isPromoted) urgency += 150; // ¡Prioridad absoluta a clubes recién ascendidos como CD Utrera!
      if (deficit.isDeficient) urgency += 60; // Necesidad urgente de reponer posición
      if (club.reputation >= 85) urgency += 25; // Gigantes europeos
      if (club.budgetYen >= 300000000) urgency += 20; // Buen presupuesto disponible

      return {
        club,
        squad,
        urgency,
        isPromoted,
        deficit,
      };
    })
    .filter((entry) => {
      // Un club solo compra si tiene suficiente presupuesto y su plantilla no está saturada (máx 25)
      const maxSpend = Math.min(entry.club.budgetYen * 0.75, entry.club.cashYen * 0.80);
      return maxSpend >= 12000000 && entry.squad.length < 25;
    })
    .sort((a, b) => b.urgency - a.urgency);

  let completedTransfers = 0;

  for (const buyerEntry of scoredBuyers) {
    if (completedTransfers >= maxTransfers) break;

    const buyerClub = buyerEntry.club;
    const buyerSquad = playersCopy.filter((p) => p.clubId === buyerClub.id);
    if (buyerSquad.length >= 25) continue;

    // Límite estricto de gasto para esta operación: máximo 70% de su presupuesto disponible
    const maxSpend = Math.min(buyerClub.budgetYen * 0.70, buyerClub.cashYen * 0.75);
    if (maxSpend < 12000000) continue;

    // Determinar la posición que el club desea reforzar
    let targetPos: Position;
    let targetDept: PositionDepartment;

    if (buyerEntry.deficit.isDeficient) {
      targetPos = buyerEntry.deficit.targetPosition;
      targetDept = buyerEntry.deficit.department!;
    } else {
      // Buscar el titular más débil de su alineación actual
      const starters = buyerSquad.filter((p) => buyerClub.startingXI.includes(p.id));
      const weakest = starters.sort((a, b) => a.overall - b.overall)[0] || buyerSquad[0];
      targetPos = weakest?.position || 'DC';
      targetDept = getPositionDepartment(targetPos);
    }

    // Buscar futbolistas en clubes rivales que mejoren su puesto
    const eligibleSellerClubs = clubsCopy.filter(
      (c) => c.id !== buyerClub.id && c.id !== userClubId
    );

    let bestTarget: { player: Player; sellerClub: Club; fee: number } | null = null;

    for (const seller of eligibleSellerClubs) {
      const sellerSquad = playersCopy.filter((p) => p.clubId === seller.id);
      if (sellerSquad.length <= 16) continue;

      const candidatesInDept = sellerSquad.filter(
        (p) => getPositionDepartment(p.position) === targetDept
      );
      if (candidatesInDept.length <= 2) continue; // No desmantelar al vendedor

      // El jugador debe poder comprarse con el presupuesto disponible y mejorar la media
      const currentAvgInPos = buyerSquad
        .filter((p) => getPositionDepartment(p.position) === targetDept)
        .reduce((sum, p, _, arr) => sum + p.overall / arr.length, 0);

      const viableCandidates = candidatesInDept.filter((p) => {
        const fee = Math.round(p.marketValueYen * (0.95 + Math.random() * 0.20));
        if (fee > maxSpend) return false;
        // Si el comprador ascendió, busca futbolistas contrastados para la nueva categoría
        const minOvrThreshold = buyerEntry.isPromoted ? buyerClub.level - 4 : currentAvgInPos;
        return p.overall >= minOvrThreshold;
      });

      if (viableCandidates.length > 0) {
        viableCandidates.sort((a, b) => b.overall - a.overall);
        const topCandidate = viableCandidates[0];
        const fee = Math.round(topCandidate.marketValueYen * (0.95 + Math.random() * 0.20));

        if (!bestTarget || topCandidate.overall > bestTarget.player.overall) {
          bestTarget = { player: topCandidate, sellerClub: seller, fee };
        }
      }
    }

    // Ejecutar el fichaje si se encontró objetivo
    if (bestTarget) {
      const fee = bestTarget.fee;
      const player = bestTarget.player;
      const seller = bestTarget.sellerClub;

      // 1. Descontar fondos al comprador y sumar al vendedor respetando límites
      buyerClub.cashYen = Math.max(0, buyerClub.cashYen - fee);
      buyerClub.budgetYen = Math.min(buyerClub.cashYen, Math.max(0, buyerClub.budgetYen - fee));
      seller.cashYen += fee;
      seller.budgetYen = Math.min(seller.cashYen, seller.budgetYen + Math.round(fee * 0.85));

      // 2. Traspasar al futbolista
      playersCopy = playersCopy.map((p) =>
        p.id === player.id
          ? {
              ...p,
              clubId: buyerClub.id,
              contractYears: Math.floor(Math.random() * 2) + 3,
              morale: 92,
              isTransferListed: false,
            }
          : p
      );

      // 3. Rebalancear alineaciones
      const updatedBuyerSquad = playersCopy.filter((p) => p.clubId === buyerClub.id);
      const updatedSellerSquad = playersCopy.filter((p) => p.clubId === seller.id);
      rebalanceClubLineup(buyerClub, updatedBuyerSquad);
      rebalanceClubLineup(seller, updatedSellerSquad);

      // 4. Si el club vendedor quedó con déficit posicional (ej. vendió a su delantero y no le queda otro), reponer de inmediato
      const sellerDeficit = checkSquadDepartmentDeficit(updatedSellerSquad);
      if (sellerDeficit.isDeficient) {
        const replacementResult = executeEmergencyReplacement(
          seller,
          clubsCopy,
          playersCopy,
          season,
          round,
          userClubId
        );
        clubsCopy = replacementResult.updatedClubs;
        playersCopy = replacementResult.updatedPlayers;
        if (replacementResult.news) {
          newsList.push(replacementResult.news);
        }
      }

      const newsEntry: TransferNewsEntry = {
        id: `tr-ai-${Date.now()}-${player.id}-${completedTransfers}`,
        season,
        round,
        playerId: player.id,
        playerName: player.name,
        playerPosition: player.position,
        playerOverall: player.overall,
        fromClubId: seller.id,
        fromClubName: seller.name,
        toClubId: buyerClub.id,
        toClubName: buyerClub.name,
        feeYen: fee,
        dateStr: options?.isPreSeason ? `Pretemporada ${season}` : `Jornada ${round}`,
        isImportant: buyerEntry.isPromoted || fee >= 1500000000,
      };

      newsList.push(newsEntry);
      completedTransfers++;
    }
  }

  return {
    updatedClubs: clubsCopy,
    updatedPlayers: playersCopy,
    news: newsList,
  };
}
