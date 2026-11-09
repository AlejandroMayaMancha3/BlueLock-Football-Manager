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
  Currency,
  MatchSummaryData,
  PlayerPerformanceSummary,
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
import { formatMoney } from '@/lib/currency';

const STORAGE_KEY = 'bluelock_football_manager_v2';

export interface GameStoreState {
  hasStarted: boolean;
  selectedCurrency: Currency;
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
  simulatedMatchSummary: MatchSummaryData | null;
  lastMatchSummary: MatchSummaryData | null;

  // Actions
  startNewGame: (managerName: string, clubId: string, currency?: Currency) => void;
  setCurrency: (currency: Currency) => void;
  loadFromStorage: () => boolean;
  saveToStorage: () => void;
  setActiveTab: (tab: GameStoreState['activeTab']) => void;
  startMatchDay: () => void;
  simulateFullMatchDay: () => void;
  tickMatchMinute: () => void;
  fastForwardMatch: () => void;
  executeMatchSub: (outId: string, inId: string) => void;
  finishMatchDay: (isSimulation?: boolean) => void;
  clearSimulatedMatchSummary: () => void;
  openLastMatchSummary: () => void;
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
  selectedCurrency: 'EUR',
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
  simulatedMatchSummary: null,
  lastMatchSummary: null,

  setCurrency: (currency: Currency) => {
    set({ selectedCurrency: currency });
    get().saveToStorage();
  },

  startNewGame: (managerName: string, clubId: string, currency: Currency = 'EUR') => {
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
      selectedCurrency: currency,
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
      simulatedMatchSummary: null,
      lastMatchSummary: null,
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
        set({
          ...parsed,
          selectedCurrency: parsed.selectedCurrency || 'EUR',
        });
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

  simulateFullMatchDay: () => {
    const { fixtures, currentSeason, currentRound, userClubId, clubs, players } = get();
    const userFixture = fixtures.find(
      (f) => f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)
    );
    if (!userFixture) return;

    const homeClub = clubs.find((c) => c.id === userFixture.homeClubId);
    const awayClub = clubs.find((c) => c.id === userFixture.awayClubId);
    if (!homeClub || !awayClub) return;

    const playersMap = players.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Player>);

    // Iniciar partido y simular los 90 minutos con cambios tácticos automáticos para ambos equipos
    let match = initLiveMatch(currentSeason, currentRound, homeClub, awayClub);
    let safetyCounter = 0;
    while (!match.isFinished && safetyCounter < 120) {
      match = tickLiveMatch(match, playersMap, true);
      safetyCounter++;
    }

    set({ liveMatch: match });
    get().finishMatchDay(true);
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

  fastForwardMatch: () => {
    const { liveMatch, players } = get();
    if (!liveMatch || liveMatch.isFinished) return;

    const playersMap = players.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Player>);

    let current = liveMatch;
    let safetyCounter = 0;
    while (!current.isFinished && safetyCounter < 120) {
      // autoManageSubsForHome = true para que el equipo local también complete sus sustituciones
      current = tickLiveMatch(current, playersMap, true);
      safetyCounter++;
    }
    set({ liveMatch: current });
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

  finishMatchDay: (isSimulation: boolean = false) => {
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
    const userWon = userIsHome ? liveMatch.homeScore > liveMatch.awayScore : liveMatch.awayScore > liveMatch.homeScore;
    const userDrew = liveMatch.homeScore === liveMatch.awayScore;

    const playerPerformances: PlayerPerformanceSummary[] = [];

    const finalPlayers = updatedPlayers.map((p) => {
      // Un jugador participó si fue titular o entró como suplente (tiene valoración en playerRatings)
      const userPlayed = p.clubId === userClubId && liveMatch.playerRatings[p.id] !== undefined;
      if (userPlayed) {
        const rating = liveMatch.playerRatings[p.id] || 6.5;

        // Minutos exactos disputados en el encuentro
        const minutesPlayed = liveMatch.playerMinutes?.[p.id] !== undefined
          ? liveMatch.playerMinutes[p.id]
          : (liveMatch.homeLineup.includes(p.id) || liveMatch.awayLineup.includes(p.id) ? 90 : 25);

        // Goles, asistencias y tarjetas de este jugador en el partido
        const playerGoals = liveMatch.events.filter(
          (e) => e.type === 'goal' && e.playerId === p.id && e.teamId === userClubId
        ).length;
        const playerAssists = liveMatch.events.filter(
          (e) => e.type === 'goal' && e.assistPlayerId === p.id && e.teamId === userClubId
        ).length;
        const playerYellows = liveMatch.events.filter(
          (e) => e.type === 'yellow_card' && e.playerId === p.id && e.teamId === userClubId
        ).length;
        const playerReds = liveMatch.events.filter(
          (e) => e.type === 'red_card' && e.playerId === p.id && e.teamId === userClubId
        ).length;

        // Desgaste físico proporcional a los minutos jugados (90 mins -> 20 fatiga; 25 mins -> 6 fatiga)
        let staminaRecovery = 25;
        let moraleBonus = userWon ? 4 : userDrew ? 0 : -3;
        if (trainingPlan === 'descanso') staminaRecovery = 35;
        else if (trainingPlan === 'fisico') staminaRecovery = 15;

        const fatigueLoss = Math.round(20 * (Math.min(90, Math.max(10, minutesPlayed)) / 90));

        // Crecimiento dinámico de MEDIA y POTENCIAL según edad, minutos y rendimiento
        let currentOvr = p.overall;
        let currentPot = p.potential;
        const newSeasonMatches = p.seasonMatches + 1;
        const newSeasonMinutes = (p.seasonMinutes || 0) + minutesPlayed;

        // 1. Jóvenes promesas (edad <= 23):
        // Acumulan minutos y rinden bien -> subida de media hacia su potencial
        if (p.age <= 23 && currentOvr < currentPot) {
          if ((rating >= 7.0 && newSeasonMatches % 3 === 0) || (rating >= 8.5 && minutesPlayed >= 45)) {
            currentOvr = Math.min(currentPot, currentOvr + 1);
          }
          // Actuación estelar (nota >= 9.0 o doblete en Flow): despierta su ego y eleva su potencial máximo (+1)
          if ((rating >= 9.0 || (playerGoals >= 2 && p.flowState)) && currentPot < 99 && Math.random() < 0.45) {
            currentPot = Math.min(99, currentPot + 1);
          }
        }
        // 2. Jugadores en plenitud (24 a 28 años):
        else if (p.age <= 28 && currentOvr < currentPot && rating >= 7.6 && newSeasonMatches % 5 === 0) {
          currentOvr = Math.min(currentPot, currentOvr + 1);
        }

        // Valoración media acumulada de la temporada
        const oldMatches = p.seasonMatches || 0;
        const newAvgRating = Math.round(((p.seasonAverageRating * oldMatches + rating) / newSeasonMatches) * 10) / 10;

        // Portería a cero si es arquero o zaguero
        const cleanSheet = (p.position === 'POR' || p.position === 'DFC') && (userIsHome ? liveMatch.awayScore === 0 : liveMatch.homeScore === 0) ? 1 : 0;

        const calculatedFitness = Math.min(100, Math.max(40, p.fitness - fatigueLoss + staminaRecovery));
        const isStarter = userIsHome
          ? liveMatch.homeLineup.includes(p.id)
          : liveMatch.awayLineup.includes(p.id);

        playerPerformances.push({
          playerId: p.id,
          playerName: p.name,
          position: p.position,
          age: p.age,
          minutesPlayed,
          rating,
          goals: playerGoals,
          assists: playerAssists,
          yellowCards: playerYellows,
          redCards: playerReds,
          oldOverall: p.overall,
          newOverall: currentOvr,
          oldPotential: p.potential,
          newPotential: currentPot,
          flowState: !!p.flowState,
          fitness: calculatedFitness,
          isSub: !isStarter,
        });

        return {
          ...p,
          overall: currentOvr,
          potential: currentPot,
          consecutiveMatchesWithoutPlaying: 0,
          seasonMatches: newSeasonMatches,
          seasonMinutes: newSeasonMinutes,
          seasonGoals: p.seasonGoals + playerGoals,
          seasonAssists: p.seasonAssists + playerAssists,
          seasonYellowCards: (p.seasonYellowCards || 0) + playerYellows,
          seasonRedCards: (p.seasonRedCards || 0) + playerReds,
          seasonCleanSheets: (p.seasonCleanSheets || 0) + cleanSheet,
          seasonAverageRating: newAvgRating,
          fitness: calculatedFitness,
          morale: Math.min(100, Math.max(25, p.morale + moraleBonus + (rating >= 8.0 ? 3 : 0))),
          form: Math.min(100, Math.max(35, Math.round(p.form * 0.65 + rating * 3.8))),
          marketValueYen: Math.round(p.marketValueYen * (1 + (playerGoals * 0.08) + (userWon ? 0.02 : 0))),
        };
      }

      // Jugadores de mi club que NO han jugado este partido
      if (p.clubId === userClubId) {
        const unplayed = (p.consecutiveMatchesWithoutPlaying || 0) + 1;
        let newOvr = p.overall;
        let newPot = p.potential;
        let newForm = Math.max(30, p.form - 3);
        let newMorale = Math.max(25, p.morale - 2);

        // Si lleva 4+ jornadas sin jugar: pérdida de ritmo y moral
        if (unplayed >= 4) {
          newForm = Math.max(25, newForm - 3);
          newMorale = Math.max(20, newMorale - 4);
        }

        // Si lleva 6+ jornadas sin jugar: estancamiento severo, baja de media y caída de potencial
        if (unplayed >= 6 && unplayed % 3 === 0) {
          newOvr = Math.max(50, p.overall - 1);
          newPot = Math.max(newOvr, p.potential - 1);
        }

        return {
          ...p,
          consecutiveMatchesWithoutPlaying: unplayed,
          overall: newOvr,
          potential: newPot,
          form: newForm,
          morale: newMorale,
          fitness: Math.min(100, p.fitness + 15), // Descansado físicamente
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

    // Ordenar actuaciones: titulares primero, luego suplentes; ordenados por minutos descendente
    playerPerformances.sort((a, b) => {
      if (a.isSub !== b.isSub) return a.isSub ? 1 : -1;
      return b.minutesPlayed - a.minutesPlayed;
    });

    const summaryData: MatchSummaryData = {
      round: currentRound,
      season: currentSeason,
      homeClub: liveMatch.homeClub,
      awayClub: liveMatch.awayClub,
      homeScore: liveMatch.homeScore,
      awayScore: liveMatch.awayScore,
      userClubId,
      userIsHome,
      events: [...liveMatch.events],
      homeStats: { ...liveMatch.homeStats },
      awayStats: { ...liveMatch.awayStats },
      playerPerformances,
      roundFixtures: finalFixtures.filter((f) => f.round === currentRound),
    };

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
      lastMatchSummary: summaryData,
      simulatedMatchSummary: isSimulation ? summaryData : null,
    });

    get().saveToStorage();
  },

  clearSimulatedMatchSummary: () => set({ simulatedMatchSummary: null }),

  openLastMatchSummary: () => {
    const { lastMatchSummary } = get();
    if (lastMatchSummary) {
      set({ simulatedMatchSummary: lastMatchSummary });
    }
  },

  updateTactics: (mentalidad, presion, estiloPase) => {
    const { clubs, userClubId, liveMatch } = get();
    const updated = clubs.map((c) =>
      c.id === userClubId ? { ...c, mentalidad, presion, estiloPase } : c
    );
    let updatedLiveMatch = liveMatch;
    if (liveMatch) {
      const isHome = liveMatch.homeClub.id === userClubId;
      updatedLiveMatch = {
        ...liveMatch,
        homeClub: isHome ? { ...liveMatch.homeClub, mentalidad, presion, estiloPase } : liveMatch.homeClub,
        awayClub: !isHome ? { ...liveMatch.awayClub, mentalidad, presion, estiloPase } : liveMatch.awayClub,
      };
    }
    set({ clubs: updated, liveMatch: updatedLiveMatch });
    get().saveToStorage();
  },

  updateFormation: (formation) => {
    const { clubs, userClubId, liveMatch } = get();
    const updated = clubs.map((c) => (c.id === userClubId ? { ...c, formation } : c));
    let updatedLiveMatch = liveMatch;
    if (liveMatch) {
      const isHome = liveMatch.homeClub.id === userClubId;
      updatedLiveMatch = {
        ...liveMatch,
        homeClub: isHome ? { ...liveMatch.homeClub, formation } : liveMatch.homeClub,
        awayClub: !isHome ? { ...liveMatch.awayClub, formation } : liveMatch.awayClub,
      };
    }
    set({ clubs: updated, liveMatch: updatedLiveMatch });
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
      return { success: false, message: `Se necesitan al menos ${formatMoney(60000000, get().selectedCurrency)} en caja para la formación del canterano.` };
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
      consecutiveMatchesWithoutPlaying: 0,
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
        message: `El club propietario ha rechazado la oferta. Exigen al menos ${formatMoney(minAcceptableFee, get().selectedCurrency)}.`,
      };
    }

    if (wageYen < minAcceptableWage) {
      return {
        success: false,
        message: `El jugador considera insuficiente el salario propuesto. Solicita al menos ${formatMoney(minAcceptableWage, get().selectedCurrency)} semanales.`,
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
        message: `El jugador exige un incremento del 15% (mínimo ${formatMoney(minAcceptableWage, get().selectedCurrency)}/semana).`,
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
