import { create } from 'zustand';
import {
  Club,
  Player,
  MatchFixture,
  LeagueTableRow,
  TransferOffer,
  ClubLedgerEntry,
  DecisionEvent,
  SeasonHistoryEntry,
  TacticalMentalidad,
  TacticalPresion,
  TacticalPase,
  Formation,
} from '@/types/football-manager';
import { generateInitialClubsAndPlayers } from '@/engine/game-data';
import {
  generateSeasonFixtures,
  simulateAiMatchesForRound,
  computeLeagueTable,
  advanceToNextSeason,
} from '@/engine/season-engine';
import {
  LiveMatchState,
  initLiveMatch,
  tickLiveMatch,
  executeLiveSub,
} from '@/engine/match-engine-2d';
import { DECISION_EVENTS_POOL } from '@/engine/events-data';

const STORAGE_KEY = 'bluelock_football_manager_v2';

export interface GameStoreState {
  hasStarted: boolean;
  managerName: string;
  userClubId: string;
  currentSeason: number;
  currentRound: number; // 1 to 22
  clubs: Club[];
  players: Player[];
  fixtures: MatchFixture[];
  activeTab: 'office' | 'squad' | 'tactics' | 'live_match' | 'table' | 'market' | 'training' | 'finance' | 'inbox';
  liveMatch: LiveMatchState | null;
  boardTrust: number; // 0-100
  squadMorale: number; // 0-100
  trainingPlan: 'equilibrado' | 'fisico' | 'ofensivo' | 'defensivo' | 'descanso';
  youthPromotedThisSeason: boolean;
  activeDecisionEvent: DecisionEvent | null;
  transferOffers: TransferOffer[];
  ledger: ClubLedgerEntry[];
  seasonHistory: SeasonHistoryEntry[];
  isSacked: boolean;
  isSeasonCompleted: boolean;

  // Actions
  startNewGame: (managerName: string, clubId: string) => void;
  loadFromStorage: () => boolean;
  saveToStorage: () => void;
  setActiveTab: (tab: GameStoreState['activeTab']) => void;
  startMatchDay: () => void;
  tickMatchMinute: () => void;
  executeMatchSub: (outId: string, inId: string) => void;
  finishMatchDay: () => void;
  updateTactics: (mentalidad: TacticalMentalidad, presion: TacticalPresion, estiloPase: TacticalPase) => void;
  updateFormation: (formation: Formation) => void;
  swapStartingPlayer: (playerOutId: string, playerInId: string) => void;
  setRole: (role: 'captain' | 'penalty' | 'freekick', playerId: string) => void;
  setTrainingPlan: (plan: GameStoreState['trainingPlan']) => void;
  promoteYouthPlayer: () => { success: boolean; message: string };
  makeBuyOffer: (playerId: string, feeYen: number, wageYen: number, years: number) => { success: boolean; message: string };
  acceptSellOffer: (offerId: string) => void;
  rejectSellOffer: (offerId: string) => void;
  renewPlayerContract: (playerId: string, newWageYen: number, addYears: number) => { success: boolean; message: string };
  answerDecisionEvent: (optionIndex: number) => void;
  proceedToNextSeason: () => void;
  exportGameJson: () => string;
  importGameJson: (jsonStr: string) => { success: boolean; message: string };
  resetCareerGame: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  hasStarted: false,
  managerName: 'Ego Jinpachi',
  userClubId: 'club-bm',
  currentSeason: 1,
  currentRound: 1,
  clubs: [],
  players: [],
  fixtures: [],
  activeTab: 'office',
  liveMatch: null,
  boardTrust: 75,
  squadMorale: 80,
  trainingPlan: 'equilibrado',
  youthPromotedThisSeason: false,
  activeDecisionEvent: null,
  transferOffers: [],
  ledger: [],
  seasonHistory: [],
  isSacked: false,
  isSeasonCompleted: false,

  startNewGame: (managerName: string, clubId: string) => {
    const { clubs, players } = generateInitialClubsAndPlayers();
    const fixtures = generateSeasonFixtures(1, clubs);

    const userClub = clubs.find((c) => c.id === clubId) || clubs[0];

    const initialLedger: ClubLedgerEntry[] = [
      {
        id: `led-0-${Date.now()}`,
        season: 1,
        round: 1,
        type: 'patrocinio',
        concept: 'Presupuesto Inicial y Patrocinio de Temporada',
        amountYen: userClub.cashYen,
        dateStr: 'Inicio de Temporada 1',
      },
    ];

    const newState: Partial<GameStoreState> = {
      hasStarted: true,
      managerName: managerName.trim() || 'Ego Jinpachi',
      userClubId: userClub.id,
      currentSeason: 1,
      currentRound: 1,
      clubs,
      players,
      fixtures,
      activeTab: 'office',
      liveMatch: null,
      boardTrust: 75,
      squadMorale: 80,
      trainingPlan: 'equilibrado',
      youthPromotedThisSeason: false,
      activeDecisionEvent: null,
      transferOffers: [],
      ledger: initialLedger,
      seasonHistory: [],
      isSacked: false,
      isSeasonCompleted: false,
    };

    set(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  },

  loadFromStorage: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      if (parsed && parsed.clubs && parsed.players && parsed.fixtures) {
        set(parsed);
        return true;
      }
    } catch (e) {
      console.error('Failed to load game from storage', e);
    }
    return false;
  },

  saveToStorage: () => {
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  startMatchDay: () => {
    const { fixtures, currentSeason, currentRound, userClubId, clubs } = get();
    const userFixture = fixtures.find(
      (f) => f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)
    );
    if (!userFixture) return;

    const homeClub = clubs.find((c) => c.id === userFixture.homeClubId);
    const awayClub = clubs.find((c) => c.id === userFixture.awayClubId);
    if (!homeClub || !awayClub) return;

    const liveMatch = initLiveMatch(currentSeason, currentRound, homeClub, awayClub);
    set({ liveMatch, activeTab: 'live_match' });
  },

  tickMatchMinute: () => {
    const { liveMatch, players } = get();
    if (!liveMatch || liveMatch.isFinished) return;

    const playersMap = players.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Player>);

    const updated = tickLiveMatch(liveMatch, playersMap);
    set({ liveMatch: updated });
  },

  executeMatchSub: (outId: string, inId: string) => {
    const { liveMatch, players, userClubId } = get();
    if (!liveMatch) return;

    const isHome = liveMatch.homeClub.id === userClubId;
    const playersMap = players.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Player>);

    const updated = executeLiveSub(liveMatch, isHome, outId, inId, playersMap);
    set({ liveMatch: updated });
  },

  finishMatchDay: () => {
    const {
      liveMatch,
      fixtures,
      currentRound,
      currentSeason,
      userClubId,
      clubs,
      players,
      trainingPlan,
      ledger,
      boardTrust,
      squadMorale,
    } = get();

    if (!liveMatch) return;

    // 1. Mark user fixture as played
    const updatedFixtures = fixtures.map((f) => {
      if (f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)) {
        return {
          ...f,
          isPlayed: true,
          homeScore: liveMatch.homeScore,
          awayScore: liveMatch.awayScore,
          events: liveMatch.events,
          homeStats: liveMatch.homeStats,
          awayStats: liveMatch.awayStats,
        };
      }
      return f;
    });

    // 2. Clubs map
    const clubsMap = clubs.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, Club>);

    // 3. Simulate all AI matches for this round
    const { updatedFixtures: finalFixtures, updatedPlayers } = simulateAiMatchesForRound(
      currentRound,
      userClubId,
      updatedFixtures,
      clubsMap,
      players
    );

    // 4. Update stats for user players from the live match
    const userIsHome = liveMatch.homeClub.id === userClubId;
    const userLineup = userIsHome ? liveMatch.homeLineup : liveMatch.awayLineup;
    const userWon = userIsHome ? liveMatch.homeScore > liveMatch.awayScore : liveMatch.awayScore > liveMatch.homeScore;
    const userDrew = liveMatch.homeScore === liveMatch.awayScore;

    const finalPlayers = updatedPlayers.map((p) => {
      if (userLineup.includes(p.id)) {
        const rating = liveMatch.playerRatings[p.id] || 6.5;
        // Goals scored by this player
        const playerGoals = liveMatch.events.filter(
          (e) => e.type === 'goal' && e.playerId === p.id && e.teamId === userClubId
        ).length;
        const playerAssists = liveMatch.events.filter(
          (e) => e.type === 'goal' && e.assistPlayerId === p.id && e.teamId === userClubId
        ).length;

        // Apply training recovery and growth
        let staminaRecovery = 25;
        let moraleBonus = userWon ? 4 : userDrew ? 0 : -3;
        if (trainingPlan === 'descanso') staminaRecovery = 35;
        else if (trainingPlan === 'fisico') staminaRecovery = 15;

        return {
          ...p,
          seasonMatches: p.seasonMatches + 1,
          seasonGoals: p.seasonGoals + playerGoals,
          seasonAssists: p.seasonAssists + playerAssists,
          fitness: Math.min(100, Math.max(50, p.fitness - 15 + staminaRecovery)),
          morale: Math.min(100, Math.max(30, p.morale + moraleBonus)),
          form: Math.min(100, Math.max(40, Math.round(p.form * 0.7 + rating * 3.5))),
          marketValueYen: Math.round(p.marketValueYen * (1 + (playerGoals * 0.08) + (userWon ? 0.02 : 0))),
        };
      }
      return p;
    });

    // 5. Financial updates (Ticket revenue if home, weekly wages)
    const userClub = clubs.find((c) => c.id === userClubId)!;
    const updatedLedger = [...ledger];

    let newCash = userClub.cashYen;
    if (userIsHome) {
      const attendance = Math.round(userClub.stadiumCapacity * (0.7 + Math.random() * 0.3));
      const ticketRevenue = attendance * userClub.ticketPriceYen;
      newCash += ticketRevenue;
      updatedLedger.push({
        id: `led-t-${currentRound}-${Date.now()}`,
        season: currentSeason,
        round: currentRound,
        type: 'taquilla',
        concept: `Taquilla J${currentRound} (${attendance.toLocaleString()} espectadores)`,
        amountYen: ticketRevenue,
        dateStr: `Jornada ${currentRound}`,
      });
    }

    // Weekly wages
    const totalWeeklyWage = finalPlayers
      .filter((p) => p.clubId === userClubId)
      .reduce((sum, p) => sum + p.weeklyWageYen, 0);
    newCash -= totalWeeklyWage;
    updatedLedger.push({
      id: `led-w-${currentRound}-${Date.now()}`,
      season: currentSeason,
      round: currentRound,
      type: 'salarios',
      concept: `Pago de Salarios Semanales (Plantilla)`,
      amountYen: -totalWeeklyWage,
      dateStr: `Jornada ${currentRound}`,
    });

    // Update club cash
    const updatedClubs = clubs.map((c) => (c.id === userClubId ? { ...c, cashYen: newCash } : c));

    // Board trust and morale
    const trustDelta = userWon ? 5 : userDrew ? 0 : -6;
    const newBoardTrust = Math.min(100, Math.max(5, boardTrust + trustDelta));
    const newSquadMorale = Math.min(100, Math.max(20, squadMorale + (userWon ? 6 : userDrew ? 0 : -5)));

    // Check if season is complete (Round 22 finished)
    const isSeasonCompleted = currentRound >= 22;

    // Pick random decision event occasionally (every 3-4 rounds)
    let nextDecisionEvent: DecisionEvent | null = null;
    if (!isSeasonCompleted && (currentRound % 3 === 0 || Math.random() < 0.35)) {
      nextDecisionEvent = DECISION_EVENTS_POOL[Math.floor(Math.random() * DECISION_EVENTS_POOL.length)];
    }

    set({
      fixtures: finalFixtures,
      players: finalPlayers,
      clubs: updatedClubs,
      ledger: updatedLedger,
      boardTrust: newBoardTrust,
      squadMorale: newSquadMorale,
      currentRound: isSeasonCompleted ? currentRound : currentRound + 1,
      isSeasonCompleted,
      isSacked: newBoardTrust < 15,
      activeDecisionEvent: nextDecisionEvent,
      activeTab: isSeasonCompleted ? 'table' : 'office',
      liveMatch: null,
    });

    get().saveToStorage();
  },

  updateTactics: (mentalidad, presion, estiloPase) => {
    const { clubs, userClubId } = get();
    const updated = clubs.map((c) =>
      c.id === userClubId ? { ...c, mentalidad, presion, estiloPase } : c
    );
    set({ clubs: updated });
    get().saveToStorage();
  },

  updateFormation: (formation) => {
    const { clubs, userClubId } = get();
    const updated = clubs.map((c) => (c.id === userClubId ? { ...c, formation } : c));
    set({ clubs: updated });
    get().saveToStorage();
  },

  swapStartingPlayer: (playerOutId, playerInId) => {
    const { clubs, userClubId } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    if (!userClub) return;

    const xi = [...userClub.startingXI];
    const bench = [...userClub.substitutes];

    const outIdx = xi.indexOf(playerOutId);
    const inIdx = bench.indexOf(playerInId);

    if (outIdx !== -1 && inIdx !== -1) {
      xi[outIdx] = playerInId;
      bench[inIdx] = playerOutId;
    } else if (outIdx !== -1 && xi.indexOf(playerInId) !== -1) {
      // Swap positions on pitch
      const pos2 = xi.indexOf(playerInId);
      xi[outIdx] = playerInId;
      xi[pos2] = playerOutId;
    }

    const updated = clubs.map((c) =>
      c.id === userClubId ? { ...c, startingXI: xi, substitutes: bench } : c
    );
    set({ clubs: updated });
    get().saveToStorage();
  },

  setRole: (role, playerId) => {
    const { clubs, userClubId } = get();
    const updated = clubs.map((c) => {
      if (c.id === userClubId) {
        if (role === 'captain') return { ...c, captainId: playerId };
        if (role === 'penalty') return { ...c, penaltyTakerId: playerId };
        if (role === 'freekick') return { ...c, freeKickTakerId: playerId };
      }
      return c;
    });
    set({ clubs: updated });
    get().saveToStorage();
  },

  setTrainingPlan: (plan) => {
    set({ trainingPlan: plan });
    get().saveToStorage();
  },

  promoteYouthPlayer: () => {
    const { youthPromotedThisSeason, clubs, players, userClubId, currentSeason, ledger } = get();
    if (youthPromotedThisSeason) {
      return { success: false, message: 'Ya has promocionado a una promesa de la cantera esta temporada.' };
    }

    const userClub = clubs.find((c) => c.id === userClubId);
    const promotionCost = 60000000; // 60M Yen
    if (!userClub || userClub.cashYen < promotionCost) {
      return { success: false, message: 'Se necesitan al menos 60.000.000 ¥ en caja para la formación del canterano.' };
    }

    const firstNames = ['Seiichi', 'Takuma', 'Kazuya', 'Ryosuke', 'Taiki', 'Shinji', 'Ren'];
    const lastNames = ['Nakamura', 'Fujiwara', 'Matsuda', 'Onda', 'Shibata', 'Hayashi'];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

    const positions: Player['position'][] = ['DC', 'EI', 'ED', 'MCO', 'MC', 'DFC'];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const baseStat = userClub.level - 4;

    const newYouth: Player = {
      id: `youth-promoted-${Date.now()}`,
      clubId: userClubId,
      name: `${name} (Cantera)`,
      age: 16,
      nationality: 'Japón',
      position: pos,
      overall: baseStat,
      potential: Math.min(99, baseStat + 15),
      stats: {
        pace: baseStat + Math.floor(Math.random() * 8),
        shooting: pos === 'DC' ? baseStat + 5 : baseStat - 5,
        passing: baseStat + 2,
        dribbling: baseStat + 4,
        defense: pos === 'DFC' ? baseStat + 6 : baseStat - 10,
        physical: baseStat + 3,
        goalkeeping: 15,
      },
      weapons: [
        {
          name: 'Despertar de Cantera',
          type: 'striker',
          level: 86,
          description: 'Hambre pura descubierta en las pruebas de selección de Blue Lock',
        },
      ],
      egoRating: 88,
      flowState: false,
      fitness: 100,
      morale: 95,
      form: 80,
      marketValueYen: 50000000,
      weeklyWageYen: 1200000,
      contractYears: 4,
      injuryWeeks: 0,
      isBanned: false,
      yellowCardsCount: 0,
      seasonMatches: 0,
      seasonGoals: 0,
      seasonAssists: 0,
      seasonYellowCards: 0,
      seasonRedCards: 0,
      seasonCleanSheets: 0,
      seasonAverageRating: 7.0,
    };

    const updatedClubs = clubs.map((c) =>
      c.id === userClubId ? { ...c, cashYen: c.cashYen - promotionCost } : c
    );

    const updatedLedger: ClubLedgerEntry[] = [
      ...ledger,
      {
        id: `led-y-${Date.now()}`,
        season: currentSeason,
        round: get().currentRound,
        type: 'cantera',
        concept: `Promoción de Cantera (${newYouth.name})`,
        amountYen: -promotionCost,
        dateStr: `Temporada ${currentSeason}`,
      },
    ];

    set({
      players: [newYouth, ...players],
      clubs: updatedClubs,
      ledger: updatedLedger,
      youthPromotedThisSeason: true,
    });

    get().saveToStorage();
    return { success: true, message: `¡${newYouth.name} se une al primer equipo con 16 años y 88 de potencial!` };
  },

  makeBuyOffer: (playerId, feeYen, wageYen, years) => {
    const { players, clubs, userClubId, currentRound, ledger, currentSeason } = get();
    // Check transfer windows (Rounds 1-4 or 11-14)
    const isWindowOpen = currentRound <= 4 || (currentRound >= 11 && currentRound <= 14);
    if (!isWindowOpen) {
      return { success: false, message: 'La ventana de fichajes está cerrada. Se abrirá en las Jornadas 1-4 y 11-14.' };
    }

    const player = players.find((p) => p.id === playerId);
    const userClub = clubs.find((c) => c.id === userClubId);
    if (!player || !userClub) return { success: false, message: 'Datos inválidos.' };

    if (player.clubId === userClubId) {
      return { success: false, message: 'Este jugador ya pertenece a tu club.' };
    }

    if (userClub.cashYen < feeYen || userClub.budgetYen < feeYen) {
      return { success: false, message: 'Fondos o presupuesto de fichajes insuficiente.' };
    }

    // AI Acceptance algorithm
    const minAcceptableFee = player.marketValueYen * 0.9;
    const minAcceptableWage = player.weeklyWageYen * 1.1;

    if (feeYen < minAcceptableFee) {
      return {
        success: false,
        message: `El club propietario ha rechazado la oferta. Exigen al menos ${(minAcceptableFee).toLocaleString()} ¥.`,
      };
    }

    if (wageYen < minAcceptableWage) {
      return {
        success: false,
        message: `El jugador considera insuficiente el salario propuesto. Solicita al menos ${(minAcceptableWage).toLocaleString()} ¥ semanales.`,
      };
    }

    // Success! Complete transfer
    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          clubId: userClubId,
          weeklyWageYen: wageYen,
          contractYears: years,
          morale: 90,
        };
      }
      return p;
    });

    const updatedClubs = clubs.map((c) => {
      if (c.id === userClubId) {
        return {
          ...c,
          cashYen: c.cashYen - feeYen,
          budgetYen: c.budgetYen - feeYen,
          substitutes: [...c.substitutes, playerId],
        };
      }
      if (c.id === player.clubId) {
        return {
          ...c,
          cashYen: c.cashYen + feeYen,
          budgetYen: c.budgetYen + feeYen,
          startingXI: c.startingXI.filter((id) => id !== playerId),
          substitutes: c.substitutes.filter((id) => id !== playerId),
        };
      }
      return c;
    });

    const updatedLedger: ClubLedgerEntry[] = [
      ...ledger,
      {
        id: `led-b-${Date.now()}`,
        season: currentSeason,
        round: currentRound,
        type: 'fichaje_compra',
        concept: `Fichaje de ${player.name}`,
        amountYen: -feeYen,
        dateStr: `Jornada ${currentRound}`,
      },
    ];

    set({ players: updatedPlayers, clubs: updatedClubs, ledger: updatedLedger });
    get().saveToStorage();

    return { success: true, message: `¡Fichaje completado! ${player.name} firma por ${years} temporadas.` };
  },

  acceptSellOffer: (offerId) => {
    const { transferOffers, players, clubs, userClubId, ledger, currentSeason, currentRound } = get();
    const offer = transferOffers.find((o) => o.id === offerId);
    if (!offer) return;

    const player = players.find((p) => p.id === offer.playerId);
    if (!player) return;

    const updatedPlayers = players.map((p) => (p.id === offer.playerId ? { ...p, clubId: offer.buyerClubId } : p));

    const updatedClubs = clubs.map((c) => {
      if (c.id === userClubId) {
        return {
          ...c,
          cashYen: c.cashYen + offer.offeredFeeYen,
          budgetYen: c.budgetYen + Math.round(offer.offeredFeeYen * 0.8),
          startingXI: c.startingXI.filter((id) => id !== offer.playerId),
          substitutes: c.substitutes.filter((id) => id !== offer.playerId),
        };
      }
      return c;
    });

    const updatedLedger: ClubLedgerEntry[] = [
      ...ledger,
      {
        id: `led-s-${Date.now()}`,
        season: currentSeason,
        round: currentRound,
        type: 'fichaje_venta',
        concept: `Venta de ${player.name} al ${offer.buyerClubName}`,
        amountYen: offer.offeredFeeYen,
        dateStr: `Jornada ${currentRound}`,
      },
    ];

    set({
      players: updatedPlayers,
      clubs: updatedClubs,
      ledger: updatedLedger,
      transferOffers: transferOffers.filter((o) => o.id !== offerId),
    });

    get().saveToStorage();
  },

  rejectSellOffer: (offerId) => {
    set((state) => ({
      transferOffers: state.transferOffers.filter((o) => o.id !== offerId),
    }));
    get().saveToStorage();
  },

  renewPlayerContract: (playerId, newWageYen, addYears) => {
    const { players, clubs, userClubId } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    const player = players.find((p) => p.id === playerId);
    if (!player || !userClub) return { success: false, message: 'Jugador no encontrado.' };

    const minAcceptableWage = player.weeklyWageYen * 1.15;
    if (newWageYen < minAcceptableWage) {
      return {
        success: false,
        message: `El jugador exige un incremento del 15% (mínimo ${(minAcceptableWage).toLocaleString()} ¥/semana).`,
      };
    }

    const updatedPlayers = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            weeklyWageYen: newWageYen,
            contractYears: p.contractYears + addYears,
            morale: Math.min(100, p.morale + 10),
          }
        : p
    );

    set({ players: updatedPlayers });
    get().saveToStorage();
    return { success: true, message: `Contrato de ${player.name} renovado por ${addYears} años adicionales.` };
  },

  answerDecisionEvent: (optionIndex) => {
    const { activeDecisionEvent, clubs, userClubId, boardTrust, squadMorale } = get();
    if (!activeDecisionEvent) return;

    const option = activeDecisionEvent.options[optionIndex];
    if (!option) return;

    let newTrust = boardTrust;
    let newMorale = squadMorale;
    let newClubs = clubs;

    if (option.impact.boardTrustChange) {
      newTrust = Math.min(100, Math.max(0, newTrust + option.impact.boardTrustChange));
    }
    if (option.impact.squadMoraleChange) {
      newMorale = Math.min(100, Math.max(0, newMorale + option.impact.squadMoraleChange));
    }
    if (option.impact.budgetChangeYen) {
      newClubs = clubs.map((c) =>
        c.id === userClubId
          ? {
              ...c,
              cashYen: c.cashYen + option.impact.budgetChangeYen!,
              budgetYen: c.budgetYen + option.impact.budgetChangeYen!,
            }
          : c
      );
    }

    set({
      activeDecisionEvent: null,
      boardTrust: newTrust,
      squadMorale: newMorale,
      clubs: newClubs,
    });

    get().saveToStorage();
  },

  proceedToNextSeason: () => {
    const { currentSeason, userClubId, clubs, players, fixtures, seasonHistory, ledger } = get();
    const table = computeLeagueTable(clubs, fixtures);

    const { newSeason, newClubs, newPlayers, newFixtures, seasonHistoryEntry } = advanceToNextSeason(
      currentSeason,
      userClubId,
      clubs,
      players,
      table
    );

    const prizeEntry: ClubLedgerEntry = {
      id: `led-p-${newSeason}-${Date.now()}`,
      season: newSeason,
      round: 1,
      type: 'premios',
      concept: `Premios de Clasificación Temporada ${currentSeason} (Puesto ${seasonHistoryEntry.userPosition}º)`,
      amountYen: seasonHistoryEntry.prizeMoneyYen,
      dateStr: `Inicio Temporada ${newSeason}`,
    };

    set({
      currentSeason: newSeason,
      currentRound: 1,
      clubs: newClubs,
      players: newPlayers,
      fixtures: newFixtures,
      seasonHistory: [seasonHistoryEntry, ...seasonHistory],
      ledger: [prizeEntry, ...ledger],
      youthPromotedThisSeason: false,
      isSeasonCompleted: false,
      activeTab: 'office',
    });

    get().saveToStorage();
  },

  exportGameJson: () => {
    return JSON.stringify(get(), null, 2);
  },

  importGameJson: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.clubs && parsed.players && parsed.fixtures && parsed.currentSeason) {
        set(parsed);
        get().saveToStorage();
        return { success: true, message: '¡Partida importada con éxito!' };
      }
      return { success: false, message: 'Formato de archivo inválido.' };
    } catch (e: any) {
      return { success: false, message: 'Error al procesar el archivo JSON.' };
    }
  },

  resetCareerGame: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    set({
      hasStarted: false,
      clubs: [],
      players: [],
      fixtures: [],
      liveMatch: null,
    });
  },
}));
