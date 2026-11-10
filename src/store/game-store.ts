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
  Position,
  IndividualTrainingFocus,
  CountryLeague,
  TierLevel,
  SeasonTransitionReport,
  TransferNewsEntry,
  ClubTrophyRecord,
} from '@/types/football-manager';
import { generateInitialClubsAndPlayers, calculateOvr } from '@/engine/game-data';
import {
  generatePyramidClubsAndPlayers,
  getClubTemplateById,
  ensureAllClubsAndPlayers,
} from '@/engine/data/leagues-catalog';
import { calculatePlayerMarketValue, normalizePlayerValuations } from '@/engine/player-valuation';
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
import { shouldAwakenWeapon, generateContextualWeapon } from '@/engine/weapon-registry';
import { optimizeLineupPositions, selectBest11FromSquad } from '@/engine/position-engine';
import { startPositionConversion, cancelPositionConversion } from '@/engine/training-engine';
import { DECISION_EVENTS_POOL } from '@/engine/events-data';
import { formatMoney } from '@/lib/currency';
import { getDivisionById } from '@/engine/data/divisions-catalog';
import {
  executeAiTransferMarket,
  executeEmergencyReplacement,
  checkSquadDepartmentDeficit,
  rebalanceClubLineup,
} from '@/engine/transfer-engine';
import {
  calculateMatchdayFinances,
  reconcileClubTreasury,
  getSeasonRenewalSponsorYen,
} from '@/engine/finance-engine';
import {
  reconstructClubTrophiesFromHistory,
  awardTrophyToClub,
  generateSeasonFixturesWithTournaments,
  pruneEliminatedTournamentFixtures,
  ensureSeasonTournaments,
} from '@/engine/competitions-engine';

const STORAGE_KEY = 'bluelock_football_manager_v2';

export interface GameStoreState {
  hasStarted: boolean;
  selectedCurrency: Currency;
  selectedCountry?: CountryLeague;
  selectedDivisionId?: string;
  selectedTier?: TierLevel;
  managerName: string;
  userClubId: string;
  currentSeason: number;
  currentRound: number; // 1 to totalRounds
  clubs: Club[];
  players: Player[];
  fixtures: MatchFixture[];
  activeTab: 'office' | 'squad' | 'tactics' | 'live_match' | 'table' | 'calendar' | 'market' | 'training' | 'finance' | 'inbox' | 'my_club';
  liveMatch: LiveMatchState | null;
  boardTrust: number; // 0-100
  squadMorale: number; // 0-100
  trainingPlan: 'equilibrado' | 'fisico' | 'ofensivo' | 'defensivo' | 'descanso';
  youthPromotedThisSeason: boolean;
  activeDecisionEvent: DecisionEvent | null;
  transferOffers: TransferOffer[];
  ledger: ClubLedgerEntry[];
  seasonHistory: SeasonHistoryEntry[];
  clubTrophies: ClubTrophyRecord[];
  isSacked: boolean;
  isSeasonCompleted: boolean;
  simulatedMatchSummary: MatchSummaryData | null;
  lastMatchSummary: MatchSummaryData | null;
  lastSeasonTransitionReport: SeasonTransitionReport | null;
  clearSeasonTransitionReport: () => void;
  recentTransfers: TransferNewsEntry[];
  reconcileUserTreasury: () => void;
  awardClubTrophy: (trophyKey: string, customOfficialName?: string) => void;

  // Actions
  startNewGame: (managerName: string, clubId: string, currency?: Currency, country?: CountryLeague, divisionId?: string) => void;
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
  swapBenchPlayer: (benchPlayerId: string, reservePlayerId: string) => void;
  addToBench: (playerId: string) => void;
  removeFromBench: (playerId: string) => void;
  autoOptimizeLineup: () => void;
  autoSelectBestSquadLineup: () => void;
  setRole: (role: 'captain' | 'penalty' | 'freekick', playerId: string) => void;
  setTrainingPlan: (plan: GameStoreState['trainingPlan']) => void;
  setPlayerTrainingFocus: (playerId: string, focus: IndividualTrainingFocus) => void;
  startPositionConversion: (playerId: string, targetPosition: Position) => void;
  cancelPositionConversion: (playerId: string) => void;
  promoteYouthPlayer: () => { success: boolean; message: string };
  makeBuyOffer: (playerId: string, feeYen: number, wageYen: number, years: number) => { success: boolean; message: string };
  toggleTransferListed: (playerId: string) => void;
  toggleBlockOffers: (playerId: string) => void;
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
  lastSeasonTransitionReport: null,
  recentTransfers: [],
  clubTrophies: [],
  clearSeasonTransitionReport: () => {
    set({ lastSeasonTransitionReport: null });
    get().saveToStorage();
  },

  setCurrency: (currency: Currency) => {
    set({ selectedCurrency: currency });
    get().saveToStorage();
  },

  startNewGame: (
    managerName: string,
    clubId: string,
    currency: Currency = 'EUR',
    country?: CountryLeague,
    divisionId?: string
  ) => {
    let resolvedCountry: CountryLeague = country || 'Spain';
    let resolvedDivision: string = divisionId || 'es_laliga';

    const tmpl = getClubTemplateById(clubId);
    if (tmpl) {
      resolvedCountry = tmpl.country;
      resolvedDivision = tmpl.divisionId;
    }

    // Generar clubes y futbolistas de la pirámide de ligas
    let generated = generatePyramidClubsAndPlayers(resolvedCountry, resolvedDivision);
    if (!generated.clubs || generated.clubs.length === 0) {
      generated = generateInitialClubsAndPlayers();
    }

    const { clubs, players } = generated;
    // Si los clubes pertenecen a la división, armar el calendario de esa categoría
    const divClubs = clubs.filter((c) => (c.divisionId || c.league) === resolvedDivision);
    const clubsForFixtures = divClubs.length >= 2 ? divClubs : clubs;
    const userClub = clubs.find((c) => c.id === clubId) || clubsForFixtures[0] || clubs[0];
    const fixtures = generateSeasonFixturesWithTournaments(1, clubsForFixtures, clubs, userClub.id);

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
      selectedCountry: resolvedCountry,
      selectedDivisionId: resolvedDivision,
      selectedTier: userClub.tier || 1,
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
      lastSeasonTransitionReport: null,
      recentTransfers: [],
      clubTrophies: [],
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
        const sanitizedClubs = parsed.clubs.map((c: any) => {
          const divId = c.divisionId || c.league;
          const dInfo = getDivisionById(divId);
          return {
            ...c,
            divisionId: divId,
            league: divId,
            tier: c.tier || dInfo?.tier || 1,
            substitutes: Array.from(new Set<string>((c.substitutes || []) as string[]))
              .filter((id) => !(c.startingXI || []).includes(id))
              .slice(0, 7),
          };
        });
        // Normalizar valoraciones de mercado para corregir precios desactualizados o no calibrados
        const calibratedPlayers = normalizePlayerValuations(parsed.players);
        // Asegurar que todos los clubes y futbolistas internacionales de los 5 países estén presentes
        const { clubs: completeClubs, players: completePlayers } = ensureAllClubsAndPlayers(
          sanitizedClubs,
          calibratedPlayers,
          (parsed.selectedCountry as CountryLeague) || 'Spain'
        );

        // Reconciliación de tesorería y fondos: sanea deudas operativas históricas con remanentes de fichajes
        let currentLedger: ClubLedgerEntry[] = parsed.ledger || [];
        const reconciledClubs = completeClubs.map((club) => {
          const { reconciledClub, wasAdjusted, adjustmentLedgerEntry } = reconcileClubTreasury(club);
          if (wasAdjusted && club.id === parsed.userClubId && adjustmentLedgerEntry) {
            currentLedger = [adjustmentLedgerEntry, ...currentLedger];
          }
          return reconciledClub;
        });

        // Reconstruir o cargar el palmarés histórico del club
        const userClub = completeClubs.find((c) => c.id === parsed.userClubId) || completeClubs[0];
        const loadedTrophies = reconstructClubTrophiesFromHistory(
          userClub,
          parsed.seasonHistory || [],
          parsed.clubTrophies || []
        );

        // Asegurar que la temporada incorpore torneos (Copa Nacional y Torneos Europeos UEFA)
        const completeFixtures = ensureSeasonTournaments(
          parsed.currentSeason || 1,
          parsed.currentRound || 1,
          parsed.fixtures || [],
          reconciledClubs,
          parsed.userClubId || userClub.id
        );

        set({
          ...parsed,
          clubs: reconciledClubs,
          players: completePlayers,
          fixtures: completeFixtures,
          ledger: currentLedger,
          clubTrophies: loadedTrophies,
          selectedCurrency: parsed.selectedCurrency || 'EUR',
          recentTransfers: parsed.recentTransfers || [],
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

    const liveMatch = initLiveMatch(currentSeason, currentRound, homeClub, awayClub, {
      competitionType: userFixture.competitionType,
      competitionName: userFixture.competitionName,
      roundStageName: userFixture.roundStageName,
      isKnockout: userFixture.isKnockout,
      trophyKey: userFixture.trophyKey,
    });
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
    let match = initLiveMatch(currentSeason, currentRound, homeClub, awayClub, {
      competitionType: userFixture.competitionType,
      competitionName: userFixture.competitionName,
      roundStageName: userFixture.roundStageName,
      isKnockout: userFixture.isKnockout,
      trophyKey: userFixture.trophyKey,
    });
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

    // 0. Comprobar datos del partido del usuario y tanda de penaltis en eliminatorias
    const userFixture = fixtures.find(
      (f) => f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)
    );

    let penaltyHomeScore: number | undefined = undefined;
    let penaltyAwayScore: number | undefined = undefined;

    // Si es eliminatoria y finalizó en empate tras 90 min, definir por tanda de penaltis
    if (userFixture?.isKnockout && liveMatch.homeScore === liveMatch.awayScore) {
      let pH = 4;
      let pA = 4;
      while (pH === pA) {
        pH = Math.floor(Math.random() * 3) + 3;
        pA = Math.floor(Math.random() * 3) + 3;
        if (Math.random() < 0.5) pH += 1;
        else pA += 1;
      }
      penaltyHomeScore = pH;
      penaltyAwayScore = pA;

      liveMatch.events.push({
        minute: 120,
        type: 'commentary',
        teamId: pH > pA ? liveMatch.homeClub.id : liveMatch.awayClub.id,
        description: `🎯 ¡FINAL DE LA TANDA DE PENALTIS! ${liveMatch.homeClub.shortName} (${pH}) - (${pA}) ${liveMatch.awayClub.shortName}.`,
        ballZone: { x: 50, y: 50 },
      });
    }

    const userIsHome = liveMatch.homeClub.id === userClubId;
    const userWonRegular = userIsHome
      ? liveMatch.homeScore > liveMatch.awayScore
      : liveMatch.awayScore > liveMatch.homeScore;

    const userWonPenalties =
      userFixture?.isKnockout && liveMatch.homeScore === liveMatch.awayScore
        ? userIsHome
          ? (penaltyHomeScore || 0) > (penaltyAwayScore || 0)
          : (penaltyAwayScore || 0) > (penaltyHomeScore || 0)
        : false;

    const userWon = userWonRegular || userWonPenalties;
    const userDrew = !userFixture?.isKnockout && liveMatch.homeScore === liveMatch.awayScore;

    // Otorgar trofeo oficial de torneo al usuario si ganó una Final
    if (userWon && userFixture?.trophyKey && (userFixture.roundStageName?.includes('Final') || userFixture.isKnockout)) {
      get().awardClubTrophy(userFixture.trophyKey, userFixture.competitionName);
      liveMatch.events.push({
        minute: 90,
        type: 'commentary',
        teamId: userClubId,
        description: `🏆 ¡¡CAMPEONES HISTÓRICOS!! ¡${userIsHome ? liveMatch.homeClub.name : liveMatch.awayClub.name} conquista el título oficial de ${userFixture.competitionName}!`,
        ballZone: { x: 50, y: 50 },
      });
    }

    // 1. Mark user fixture as played
    const updatedFixtures = fixtures.map((f) => {
      if (f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)) {
        return {
          ...f,
          isPlayed: true,
          homeScore: liveMatch.homeScore,
          awayScore: liveMatch.awayScore,
          penaltyHomeScore,
          penaltyAwayScore,
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

    // 3b. Si el usuario cayó eliminado en un torneo eliminatorio (isKnockout), podar futuros partidos de ese torneo
    let finalFixturesWithPrune = finalFixtures;
    if (userFixture?.isKnockout && !userWon && userFixture.competitionType) {
      finalFixturesWithPrune = pruneEliminatedTournamentFixtures(
        finalFixtures,
        currentRound,
        userFixture.competitionType,
        userClubId
      );
    }

    const playerPerformances: PlayerPerformanceSummary[] = [];

    const finalPlayers = updatedPlayers.map((p) => {
      // 0. Si el futbolista pertenece al club del usuario, procesar plan de entrenamiento individual y conversión
      let updatedPos = p.position;
      let updatedSec = p.secondaryPosition;
      let updatedConversion = p.positionConversion ? { ...p.positionConversion } : null;
      let updatedStats = { ...p.stats };

      if (p.clubId === userClubId && updatedConversion) {
        updatedConversion.weeksElapsed += 1;
        if (updatedConversion.weeksElapsed >= updatedConversion.totalWeeks) {
          const oldPos = updatedPos;
          updatedPos = updatedConversion.targetPosition;
          updatedSec = oldPos;
          updatedConversion = null;

          liveMatch.events.unshift({
            minute: 90,
            type: 'commentary',
            teamId: p.clubId,
            playerId: p.id,
            playerName: p.name,
            description: `🎓 ¡CONVERSIÓN DE POSICIÓN COMPLETADA! ${p.name} culmina su plan de entrenamiento y su nueva posición oficial es [${updatedPos}].`,
            ballZone: { x: 50, y: 50 },
          });
        }
      }

      if (p.clubId === userClubId && p.trainingFocus) {
        if (p.trainingFocus === 'finishing') {
          if (Math.random() < 0.35) updatedStats.shooting = Math.min(99, updatedStats.shooting + 1);
          if (Math.random() < 0.20) updatedStats.physical = Math.min(99, updatedStats.physical + 1);
        } else if (p.trainingFocus === 'playmaking') {
          if (Math.random() < 0.35) updatedStats.passing = Math.min(99, updatedStats.passing + 1);
          if (Math.random() < 0.20) updatedStats.dribbling = Math.min(99, updatedStats.dribbling + 1);
        } else if (p.trainingFocus === 'dribbling_pace') {
          if (Math.random() < 0.35) updatedStats.pace = Math.min(99, updatedStats.pace + 1);
          if (Math.random() < 0.20) updatedStats.dribbling = Math.min(99, updatedStats.dribbling + 1);
        } else if (p.trainingFocus === 'defending_physical') {
          if (Math.random() < 0.35) updatedStats.defense = Math.min(99, updatedStats.defense + 1);
          if (Math.random() < 0.20) updatedStats.physical = Math.min(99, updatedStats.physical + 1);
        } else if (p.trainingFocus === 'goalkeeping_reflexes') {
          if (Math.random() < 0.35) updatedStats.goalkeeping = Math.min(99, updatedStats.goalkeeping + 1);
          if (Math.random() < 0.20) updatedStats.physical = Math.min(99, updatedStats.physical + 1);
        } else if (p.trainingFocus === 'balanced' && Math.random() < 0.20) {
          const keys: (keyof typeof updatedStats)[] = ['pace', 'shooting', 'passing', 'dribbling', 'defense', 'physical'];
          const randKey = keys[Math.floor(Math.random() * keys.length)];
          updatedStats[randKey] = Math.min(99, updatedStats[randKey] + 1);
        }
      }

      // Efecto colectivo semanal según el plan general del plantel
      if (p.clubId === userClubId) {
        if (trainingPlan === 'fisico' && Math.random() < 0.25) {
          if (Math.random() < 0.5) updatedStats.pace = Math.min(99, updatedStats.pace + 1);
          else updatedStats.physical = Math.min(99, updatedStats.physical + 1);
        } else if (trainingPlan === 'ofensivo' && Math.random() < 0.25) {
          if (Math.random() < 0.5) updatedStats.shooting = Math.min(99, updatedStats.shooting + 1);
          else updatedStats.dribbling = Math.min(99, updatedStats.dribbling + 1);
        } else if (trainingPlan === 'defensivo' && Math.random() < 0.25) {
          if (Math.random() < 0.5) updatedStats.defense = Math.min(99, updatedStats.defense + 1);
          else updatedStats.passing = Math.min(99, updatedStats.passing + 1);
        }
      }

      const statDerivedOvr = calculateOvr(updatedPos, updatedStats);

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
        if (trainingPlan === 'descanso') {
          staminaRecovery = 35;
          moraleBonus += 4;
        } else if (trainingPlan === 'fisico') {
          staminaRecovery = 15;
        }

        const fatigueLoss = Math.round(20 * (Math.min(90, Math.max(10, minutesPlayed)) / 90));

        // Crecimiento dinámico de MEDIA y POTENCIAL según edad, minutos, entrenamiento y rendimiento
        let currentOvr = Math.max(p.overall, statDerivedOvr);
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
        const fisicoStrain = trainingPlan === 'fisico' && (p.injuryWeeks || 0) === 0 && Math.random() < 0.03 ? 1 : 0;
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

        // Comprobar Despertar de Armas (Consagración, Prodigio o Epifanía de Ego)
        let currentWeapons = p.weapons ? [...p.weapons] : [];
        const candidateForAwaken: Player = { ...p, overall: currentOvr, potential: currentPot };

        const isEpiphany =
          currentWeapons.length === 0 &&
          (rating >= 8.8 || playerGoals >= 2 || (p.position === 'POR' && cleanSheet > 0 && rating >= 8.5));

        if (isEpiphany) {
          const awakened = generateContextualWeapon(candidateForAwaken, false);
          currentWeapons.push(awakened);
          liveMatch.events.unshift({
            minute: 90,
            type: 'commentary',
            teamId: p.clubId,
            playerId: p.id,
            playerName: p.name,
            description: `⚡ ¡EPIFANÍA DE EGO! Tras una exhibición descomunal (Nota ${rating.toFixed(1)}), ¡${p.name} despierta su arma: [${awakened.name}]!`,
            ballZone: { x: 50, y: 50 },
          });
        } else {
          const awakenDecision = shouldAwakenWeapon(candidateForAwaken);
          if (awakenDecision.awaken) {
            if (currentWeapons.length === 0) {
              const awakened = generateContextualWeapon(candidateForAwaken, false);
              currentWeapons.push(awakened);
              liveMatch.events.unshift({
                minute: 90,
                type: 'commentary',
                teamId: p.clubId,
                playerId: p.id,
                playerName: p.name,
                description: `🌟 ¡DESPERTAR DE EGO! ${p.name} alcanza el umbral de maestría y forja su arma: [${awakened.name}]!`,
                ballZone: { x: 50, y: 50 },
              });
            } else if (awakenDecision.isSecondary && currentWeapons.length === 1 && Math.random() < 0.35) {
              const secondary = generateContextualWeapon(candidateForAwaken, true);
              currentWeapons.push(secondary);
              liveMatch.events.unshift({
                minute: 90,
                type: 'commentary',
                teamId: p.clubId,
                playerId: p.id,
                playerName: p.name,
                description: `🔮 ¡EVOLUCIÓN DE PRODIGIO! ${p.name} despierta su segunda arma de Ego: [${secondary.name}]!`,
                ballZone: { x: 50, y: 50 },
              });
            }
          }
        }

        const postMatchVal = calculatePlayerMarketValue({
          overall: currentOvr,
          potential: currentPot,
          age: p.age,
          weapons: currentWeapons,
          egoRating: p.egoRating,
          position: updatedPos,
        });
        const matchPerformanceMultiplier = 1 + (playerGoals * 0.04) + (userWon ? 0.015 : 0) + (rating >= 8.0 ? 0.025 : 0);
        const dynamicMarketValue = Math.max(postMatchVal.marketValueYen, Math.round(postMatchVal.marketValueYen * matchPerformanceMultiplier));

        return {
          ...p,
          position: updatedPos,
          secondaryPosition: updatedSec,
          positionConversion: updatedConversion,
          stats: updatedStats,
          overall: currentOvr,
          potential: currentPot,
          weapons: currentWeapons,
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
          marketValueYen: dynamicMarketValue,
          weeklyWageYen: postMatchVal.weeklyWageYen,
          isBanned: playerReds > 0 || ((p.yellowCardsCount || 0) + playerYellows >= 5),
          yellowCardsCount: ((p.yellowCardsCount || 0) + playerYellows >= 5) ? 0 : ((p.yellowCardsCount || 0) + playerYellows),
          injuryWeeks: Math.max(fisicoStrain, Math.max(0, (p.injuryWeeks || 0) - 1)),
        };
      }

      // Jugadores de mi club que NO han jugado este partido
      if (p.clubId === userClubId) {
        const unplayed = (p.consecutiveMatchesWithoutPlaying || 0) + 1;
        let newOvr = Math.max(p.overall, statDerivedOvr);
        let newPot = p.potential;
        let newForm = Math.max(30, p.form - 3);
        let newMorale = Math.max(25, p.morale - 2 + (trainingPlan === 'descanso' ? 4 : 0));

        // Si lleva 4+ jornadas sin jugar: pérdida de ritmo y moral
        if (unplayed >= 4) {
          newForm = Math.max(25, newForm - 3);
          newMorale = Math.max(20, newMorale - 4);
        }

        // Si lleva 6+ jornadas sin jugar: estancamiento severo, baja de media y caída de potencial
        if (unplayed >= 6 && unplayed % 3 === 0) {
          newOvr = Math.max(50, newOvr - 1);
          newPot = Math.max(newOvr, p.potential - 1);
        }

        const unplayedStaminaRecovery = trainingPlan === 'descanso' ? 30 : 15;
        const unplayedVal = calculatePlayerMarketValue({
          overall: newOvr,
          potential: newPot,
          age: p.age,
          weapons: p.weapons,
          egoRating: p.egoRating,
          position: updatedPos,
        });

        return {
          ...p,
          position: updatedPos,
          secondaryPosition: updatedSec,
          positionConversion: updatedConversion,
          stats: updatedStats,
          consecutiveMatchesWithoutPlaying: unplayed,
          overall: newOvr,
          potential: newPot,
          form: newForm,
          morale: newMorale,
          marketValueYen: unplayedVal.marketValueYen,
          weeklyWageYen: unplayedVal.weeklyWageYen,
          fitness: Math.min(100, p.fitness + unplayedStaminaRecovery), // Descansado físicamente
          isBanned: false, // Si descansó, cumple su partido de sanción
          injuryWeeks: Math.max(0, (p.injuryWeeks || 0) - 1),
        };
      }
      return p;
    });

    // 5. Financial updates (Taquilla, Derechos TV, Patrocinios y Nóminas semanales)
    const userClub = clubs.find((c) => c.id === userClubId)!;
    const totalWeeklyWage = finalPlayers
      .filter((p) => p.clubId === userClubId)
      .reduce((sum, p) => sum + p.weeklyWageYen, 0);

    const matchFinances = calculateMatchdayFinances(
      userClub,
      userIsHome,
      currentRound,
      currentSeason,
      totalWeeklyWage
    );

    const updatedLedger = [...matchFinances.ledgerEntries, ...ledger];

    // Actualizar caja y reconciliar tesorería para evitar contradicciones entre saldo y fichajes
    const updatedClubs = clubs.map((c) => {
      if (c.id === userClubId) {
        const candidate: Club = {
          ...c,
          cashYen: c.cashYen + matchFinances.netWeeklyYen,
        };
        const { reconciledClub } = reconcileClubTreasury(candidate);
        return reconciledClub;
      }
      return c;
    });

    // Board trust and morale
    const trustDelta = userWon ? 5 : userDrew ? 0 : -6;
    const newBoardTrust = Math.min(100, Math.max(5, boardTrust + trustDelta));
    const newSquadMorale = Math.min(100, Math.max(20, squadMorale + (userWon ? 6 : userDrew ? 0 : -5)));

    // Check if season is complete (All regular league rounds finished)
    const maxSeasonRound =
      finalFixturesWithPrune.length > 0 ? Math.max(...finalFixturesWithPrune.map((f) => f.round)) : 46;
    const isSeasonCompleted = currentRound >= maxSeasonRound;

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
      penaltyHomeScore,
      penaltyAwayScore,
      competitionType: userFixture?.competitionType,
      competitionName: userFixture?.competitionName,
      roundStageName: userFixture?.roundStageName,
      isKnockout: userFixture?.isKnockout,
      trophyKey: userFixture?.trophyKey,
      userClubId,
      userIsHome,
      events: [...liveMatch.events],
      homeStats: { ...liveMatch.homeStats },
      awayStats: { ...liveMatch.awayStats },
      playerPerformances,
      roundFixtures: finalFixturesWithPrune.filter((f) => f.round === currentRound),
      isSimulated: isSimulation,
    };

    // Generar ofertas automáticas de compra de la IA para jugadores puestos en venta (si no tienen ofertas bloqueadas)
    const currentOffers = [...get().transferOffers];
    const listedPlayers = finalPlayers.filter(
      (p) => p.clubId === userClubId && p.isTransferListed && !p.blockOffers && !currentOffers.some((o) => o.playerId === p.id && o.status === 'pending')
    );

    listedPlayers.forEach((lp) => {
      if (Math.random() < 0.75) {
        const rivalClubs = updatedClubs.filter((c) => c.id !== userClubId);
        const eligibleBuyers = rivalClubs.filter(
          (c) => finalPlayers.filter((p) => p.clubId === c.id).length < 25
        );
        if (eligibleBuyers.length > 0) {
          const buyer = eligibleBuyers[Math.floor(Math.random() * eligibleBuyers.length)];
          const mult = 0.88 + Math.random() * 0.32;
          currentOffers.push({
            id: `sell-offer-${Date.now()}-${lp.id}-${buyer.id}`,
            playerId: lp.id,
            playerName: lp.name,
            sellerClubId: userClubId,
            buyerClubId: buyer.id,
            buyerClubName: buyer.name,
            offeredFeeYen: Math.round(lp.marketValueYen * mult),
            offeredWageYen: Math.round(lp.weeklyWageYen * 1.15),
            contractYears: 3,
            status: 'pending',
            dateStr: `Jornada ${currentRound}`,
            isFromUser: false,
          });
        }
      }
    });

    // Ofertas no solicitadas para estrellas mundiales (OVR >= 85) no transferibles (si no tienen ofertas bloqueadas)
    const unlistedStars = finalPlayers.filter(
      (p) => p.clubId === userClubId && !p.isTransferListed && !p.blockOffers && p.overall >= 85 && !currentOffers.some((o) => o.playerId === p.id && o.status === 'pending')
    );

    unlistedStars.forEach((star) => {
      if (Math.random() < 0.25) {
        const topRivals = updatedClubs.filter((c) => c.id !== userClubId && c.reputation >= 70);
        const candidateClubs = topRivals.length > 0 ? topRivals : updatedClubs.filter((c) => c.id !== userClubId);
        const eligibleBuyers = candidateClubs.filter(
          (c) => finalPlayers.filter((p) => p.clubId === c.id).length < 25
        );
        if (eligibleBuyers.length > 0) {
          const buyer = eligibleBuyers[Math.floor(Math.random() * eligibleBuyers.length)];
          const mult = 1.05 + Math.random() * 0.35; // Entre 105% y 140% de su cotización de mercado
          currentOffers.push({
            id: `star-offer-${Date.now()}-${star.id}-${buyer.id}`,
            playerId: star.id,
            playerName: star.name,
            sellerClubId: userClubId,
            buyerClubId: buyer.id,
            buyerClubName: buyer.name,
            offeredFeeYen: Math.round(star.marketValueYen * mult),
            offeredWageYen: Math.round(star.weeklyWageYen * 1.30),
            contractYears: 4,
            status: 'pending',
            dateStr: `Jornada ${currentRound}`,
            isFromUser: false,
          });
        }
      }
    });

    // Mercado dinámico entre clubes rivales (IA vs IA) durante las ventanas de fichajes abiertas
    let finalMarketClubs = updatedClubs;
    let finalMarketPlayers = finalPlayers;
    const existingRecentTransfers = get().recentTransfers || [];
    let updatedRecentTransfers = [...existingRecentTransfers];

    const isTransferWindowActive = currentRound <= 6 || (currentRound >= 22 && currentRound <= 28);
    if (isTransferWindowActive && !isSeasonCompleted && Math.random() < 0.85) {
      const rivalMarketResult = executeAiTransferMarket(
        finalMarketClubs,
        finalMarketPlayers,
        currentSeason,
        currentRound,
        userClubId,
        { maxTransfers: Math.floor(Math.random() * 3) + 2 }
      );
      finalMarketClubs = rivalMarketResult.updatedClubs;
      finalMarketPlayers = rivalMarketResult.updatedPlayers;
      if (rivalMarketResult.news.length > 0) {
        updatedRecentTransfers = [...rivalMarketResult.news, ...updatedRecentTransfers].slice(0, 60);
      }
    }

    set({
      fixtures: finalFixturesWithPrune,
      players: finalMarketPlayers,
      clubs: finalMarketClubs,
      ledger: updatedLedger,
      transferOffers: currentOffers,
      recentTransfers: updatedRecentTransfers,
      boardTrust: newBoardTrust,
      squadMorale: newSquadMorale,
      currentRound: isSeasonCompleted ? currentRound : currentRound + 1,
      isSeasonCompleted,
      isSacked: newBoardTrust < 15,
      activeDecisionEvent: nextDecisionEvent,
      activeTab: isSeasonCompleted ? 'table' : 'office',
      liveMatch: null,
      lastMatchSummary: summaryData,
      simulatedMatchSummary: summaryData,
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
    const { clubs, userClubId, players, liveMatch } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    let newStartingXI = userClub ? [...userClub.startingXI] : [];

    // Al cambiar de formación, auto-alinear los 11 titulares actuales a los roles de la nueva formación
    if (userClub && newStartingXI.length === 11) {
      const allPlayersMap = players.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, Player>);
      const currentStarters = newStartingXI.map((id) => allPlayersMap[id]).filter(Boolean);
      if (currentStarters.length === 11) {
        newStartingXI = optimizeLineupPositions(currentStarters, formation).map((p) => p.id);
      }
    }

    const updated = clubs.map((c) =>
      c.id === userClubId ? { ...c, formation, startingXI: newStartingXI } : c
    );
    let updatedLiveMatch = liveMatch;
    if (liveMatch) {
      const isHome = liveMatch.homeClub.id === userClubId;
      updatedLiveMatch = {
        ...liveMatch,
        homeClub: isHome ? { ...liveMatch.homeClub, formation, startingXI: newStartingXI } : liveMatch.homeClub,
        awayClub: !isHome ? { ...liveMatch.awayClub, formation, startingXI: newStartingXI } : liveMatch.awayClub,
      };
    }
    set({ clubs: updated, liveMatch: updatedLiveMatch });
    get().saveToStorage();
  },

  swapStartingPlayer: (playerOutId, playerInId) => {
    const { clubs, userClubId, players } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    if (!userClub) return;

    let xi = [...userClub.startingXI];
    let bench = [...userClub.substitutes];

    const outIdx = xi.indexOf(playerOutId);
    const inBenchIdx = bench.indexOf(playerInId);

    // 1. Ambos en el campo (intercambio de posición táctica)
    if (outIdx !== -1 && xi.indexOf(playerInId) !== -1) {
      const pos2 = xi.indexOf(playerInId);
      xi[outIdx] = playerInId;
      xi[pos2] = playerOutId;
    }
    // 2. Jugador del banquillo entra al 11 titular
    else if (outIdx !== -1 && inBenchIdx !== -1) {
      xi[outIdx] = playerInId;
      bench[inBenchIdx] = playerOutId;
    }
    // 3. Jugador de reservas entra al 11 titular
    else if (outIdx !== -1) {
      const userPlayers = players.filter((p) => p.clubId === userClubId);
      if (userPlayers.some((p) => p.id === playerInId)) {
        xi[outIdx] = playerInId;
        bench = bench.filter((id) => id !== playerInId);
        // Si el banquillo tiene plazas libres (< 7), el saliente se coloca en el banquillo.
        // Si el banquillo ya está completo (>= 7), el saliente pasa a las reservas (NO se añade al banquillo).
        if (bench.length < 7 && !bench.includes(playerOutId)) {
          bench.push(playerOutId);
        }
      }
    }

    // Regla reglamentaria estricta: el banquillo nunca puede exceder los 7 jugadores
    bench = Array.from(new Set(bench)).filter((id) => !xi.includes(id)).slice(0, 7);

    // Traspaso automático de roles si el jugador saliente era capitán, penaltis o faltas
    let captainId = userClub.captainId;
    let penaltyTakerId = userClub.penaltyTakerId;
    let freeKickTakerId = userClub.freeKickTakerId;

    if (captainId === playerOutId) {
      captainId = xi.includes(playerInId) ? playerInId : xi[0];
    }
    if (penaltyTakerId === playerOutId) {
      penaltyTakerId = xi.includes(playerInId) ? playerInId : xi[0];
    }
    if (freeKickTakerId === playerOutId) {
      freeKickTakerId = xi.includes(playerInId) ? playerInId : xi[0];
    }

    const updated = clubs.map((c) =>
      c.id === userClubId
        ? {
            ...c,
            startingXI: xi,
            substitutes: bench,
            captainId,
            penaltyTakerId,
            freeKickTakerId,
          }
        : c
    );
    set({ clubs: updated });
    get().saveToStorage();
  },

  swapBenchPlayer: (benchPlayerId, reservePlayerId) => {
    const { clubs, userClubId } = get();
    const updated = clubs.map((c) => {
      if (c.id === userClubId) {
        let newBench = c.substitutes.map((id) => (id === benchPlayerId ? reservePlayerId : id));
        if (!c.substitutes.includes(benchPlayerId)) {
          if (newBench.length < 7 && !newBench.includes(reservePlayerId)) {
            newBench.push(reservePlayerId);
          }
        }
        newBench = Array.from(new Set(newBench)).filter((id) => !c.startingXI.includes(id)).slice(0, 7);
        return { ...c, substitutes: newBench };
      }
      return c;
    });
    set({ clubs: updated });
    get().saveToStorage();
  },

  addToBench: (playerId: string) => {
    const { clubs, userClubId } = get();
    const updated = clubs.map((c) => {
      if (c.id === userClubId) {
        if (c.startingXI.includes(playerId) || c.substitutes.includes(playerId)) return c;
        if (c.substitutes.length >= 7) return c;
        const newBench = [...c.substitutes, playerId].slice(0, 7);
        return { ...c, substitutes: newBench };
      }
      return c;
    });
    set({ clubs: updated });
    get().saveToStorage();
  },

  removeFromBench: (playerId: string) => {
    const { clubs, userClubId } = get();
    const updated = clubs.map((c) => {
      if (c.id === userClubId) {
        const newBench = c.substitutes.filter((id) => id !== playerId);
        return { ...c, substitutes: newBench };
      }
      return c;
    });
    set({ clubs: updated });
    get().saveToStorage();
  },

  autoOptimizeLineup: () => {
    const { clubs, userClubId, players } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    if (!userClub) return;

    const allPlayersMap = players.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Player>);

    const starters = userClub.startingXI.map((id) => allPlayersMap[id]).filter(Boolean);
    if (starters.length !== 11) return;

    const optimized = optimizeLineupPositions(starters, userClub.formation);
    const newStartingXI = optimized.map((p) => p.id);

    // Asegurar capitán y lanzadores válidos
    const captainId = newStartingXI.includes(userClub.captainId) ? userClub.captainId : newStartingXI[0];
    const penaltyTakerId = newStartingXI.includes(userClub.penaltyTakerId)
      ? userClub.penaltyTakerId
      : newStartingXI.find((id) => allPlayersMap[id]?.position === 'DC') || captainId;
    const freeKickTakerId = newStartingXI.includes(userClub.freeKickTakerId)
      ? userClub.freeKickTakerId
      : newStartingXI.find((id) => ['MCO', 'MC', 'EI'].includes(allPlayersMap[id]?.position || '')) || captainId;

    const updated = clubs.map((c) =>
      c.id === userClubId
        ? {
            ...c,
            startingXI: newStartingXI,
            captainId,
            penaltyTakerId,
            freeKickTakerId,
          }
        : c
    );

    set({ clubs: updated });
    get().saveToStorage();
  },

  autoSelectBestSquadLineup: () => {
    const { clubs, userClubId, players } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    if (!userClub) return;

    const clubPlayers = players.filter((p) => p.clubId === userClubId);
    if (clubPlayers.length < 11) return;

    const { startingXI, substitutes } = selectBest11FromSquad(clubPlayers, userClub.formation);

    const allPlayersMap = players.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Player>);

    const captain = clubPlayers
      .filter((p) => startingXI.includes(p.id))
      .sort((a, b) => b.overall - a.overall)[0]?.id || startingXI[0];
    const penalty = startingXI.find((id) => allPlayersMap[id]?.position === 'DC') || captain;
    const freeKick = startingXI.find((id) => ['MCO', 'MC', 'EI'].includes(allPlayersMap[id]?.position || '')) || captain;

    const updated = clubs.map((c) =>
      c.id === userClubId
        ? {
            ...c,
            startingXI,
            substitutes,
            captainId: captain,
            penaltyTakerId: penalty,
            freeKickTakerId: freeKick,
          }
        : c
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

  setPlayerTrainingFocus: (playerId, focus) => {
    const { players, userClubId } = get();
    const updated = players.map((p) =>
      p.id === playerId && p.clubId === userClubId ? { ...p, trainingFocus: focus } : p
    );
    set({ players: updated });
    get().saveToStorage();
  },

  startPositionConversion: (playerId, targetPosition) => {
    const { players, userClubId } = get();
    const updated = players.map((p) => {
      if (p.id === playerId && p.clubId === userClubId) {
        return startPositionConversion(p, targetPosition);
      }
      return p;
    });
    set({ players: updated });
    get().saveToStorage();
  },

  cancelPositionConversion: (playerId) => {
    const { players, userClubId } = get();
    const updated = players.map((p) => {
      if (p.id === playerId && p.clubId === userClubId) {
        return cancelPositionConversion(p);
      }
      return p;
    });
    set({ players: updated });
    get().saveToStorage();
  },

  promoteYouthPlayer: () => {
    const { youthPromotedThisSeason, clubs, players, userClubId, currentSeason, ledger } = get();
    if (youthPromotedThisSeason) {
      return { success: false, message: 'Ya has promocionado a una promesa de la cantera esta temporada.' };
    }

    const userPlayers = players.filter((p) => p.clubId === userClubId);
    if (userPlayers.length >= 25) {
      return {
        success: false,
        message: 'Límite de plantilla alcanzado (25/25 jugadores). Debes poner jugadores en la lista de transferibles y venderlos para hacer hueco a la cantera.',
      };
    }

    const userClub = clubs.find((c) => c.id === userClubId);
    const promotionCost = 60000000; // 60M Yen
    if (!userClub || userClub.cashYen < promotionCost) {
      return { success: false, message: `Se necesitan al menos ${formatMoney(60000000, get().selectedCurrency)} en caja para la formación del canterano.` };
    }

    const clubCountry = userClub.country || 'Spain';
    const isBlueLockTalent = Math.random() < 0.15; // 15% de probabilidad de ser un becado especial del proyecto Blue Lock
    let firstName = 'Pablo';
    let lastName = 'García';
    let youthNationality = 'España';

    if (isBlueLockTalent) {
      const jpFirst = ['Seiichi', 'Takuma', 'Kazuya', 'Ryosuke', 'Taiki', 'Shinji', 'Ren', 'Kiyoshi', 'Kouhei'];
      const jpLast = ['Nakamura', 'Fujiwara', 'Matsuda', 'Onda', 'Shibata', 'Hayashi', 'Endo', 'Takahashi'];
      firstName = jpFirst[Math.floor(Math.random() * jpFirst.length)];
      lastName = jpLast[Math.floor(Math.random() * jpLast.length)];
      youthNationality = 'Japón';
    } else if (clubCountry === 'England') {
      const enFirst = ['Jack', 'Oliver', 'Harry', 'George', 'Charlie', 'Mason', 'Archie', 'Freddie', 'Jude', 'Callum'];
      const enLast = ['Smith', 'Walker', 'Harrison', 'Taylor', 'Wilson', 'Bennett', 'Fletcher', 'Sterling', 'Shaw'];
      firstName = enFirst[Math.floor(Math.random() * enFirst.length)];
      lastName = enLast[Math.floor(Math.random() * enLast.length)];
      youthNationality = 'Inglaterra';
    } else if (clubCountry === 'Germany') {
      const deFirst = ['Lukas', 'Leon', 'Felix', 'Jonas', 'Maximilian', 'Tim', 'Niklas', 'Julian', 'Florian', 'Kai'];
      const deLast = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz'];
      firstName = deFirst[Math.floor(Math.random() * deFirst.length)];
      lastName = deLast[Math.floor(Math.random() * deLast.length)];
      youthNationality = 'Alemania';
    } else if (clubCountry === 'Italy') {
      const itFirst = ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Matteo', 'Tommaso', 'Federico', 'Nicolo'];
      const itLast = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino'];
      firstName = itFirst[Math.floor(Math.random() * itFirst.length)];
      lastName = itLast[Math.floor(Math.random() * itLast.length)];
      youthNationality = 'Italia';
    } else if (clubCountry === 'France') {
      const frFirst = ['Lucas', 'Louis', 'Gabriel', 'Hugo', 'Arthur', 'Jules', 'Raphaël', 'Théo', 'Mathis', 'Maxime'];
      const frLast = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy'];
      firstName = frFirst[Math.floor(Math.random() * frFirst.length)];
      lastName = frLast[Math.floor(Math.random() * frLast.length)];
      youthNationality = 'Francia';
    } else {
      const esFirst = ['Pablo', 'Mateo', 'Alejandro', 'Hugo', 'Adrián', 'Álvaro', 'Iker', 'Lucas', 'Marc', 'Raúl'];
      const esLast = ['García', 'Rodríguez', 'López', 'Martínez', 'Navarro', 'Torres', 'Serrano', 'Mendoza', 'Romero'];
      firstName = esFirst[Math.floor(Math.random() * esFirst.length)];
      lastName = esLast[Math.floor(Math.random() * esLast.length)];
      youthNationality = 'España';
    }

    const name = `${firstName} ${lastName}`;

    const positions: Player['position'][] = ['POR', 'LI', 'DFC', 'LD', 'MCD', 'MC', 'MI', 'MD', 'MCO', 'EI', 'ED', 'DC'];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const baseStat = userClub.level - 4;

    const stats = {
      pace: pos === 'POR' ? baseStat - 10 : baseStat + Math.floor(Math.random() * 8),
      shooting: pos === 'POR' ? 20 : pos === 'DC' ? baseStat + 5 : baseStat - 5,
      passing: pos === 'POR' ? baseStat - 12 : baseStat + 2,
      dribbling: pos === 'POR' ? baseStat - 15 : baseStat + 4,
      defense: pos === 'POR' ? 20 : ['DFC', 'CAI', 'CAD', 'LI', 'LD'].includes(pos) ? baseStat + 6 : baseStat - 10,
      physical: baseStat + 3,
      goalkeeping: pos === 'POR' ? baseStat + 6 : 15,
    };

    const calculatedOvr = calculateOvr(pos, stats);
    const youthPotential = Math.min(99, Math.max(calculatedOvr + 12, 90));
    const youthValuation = calculatePlayerMarketValue({
      overall: calculatedOvr,
      potential: youthPotential,
      age: 16,
      weapons: [
        {
          name: 'Despertar de Cantera',
          type: 'striker',
          level: 86,
          description: isBlueLockTalent ? 'Prodigio becado por las pruebas de selección mundial de Blue Lock' : 'Joya forjada en las categorías inferiores del club',
        },
      ],
      egoRating: 88,
      position: pos,
    });

    const newYouth: Player = {
      id: `youth-promoted-${Date.now()}`,
      clubId: userClubId,
      name: `${name} (Cantera)`,
      age: 16,
      nationality: youthNationality,
      position: pos,
      overall: calculatedOvr,
      potential: youthPotential,
      trainingFocus: 'balanced',
      positionConversion: null,
      stats,
      weapons: [
        {
          name: 'Despertar de Cantera',
          type: 'striker',
          level: 86,
          description: isBlueLockTalent ? 'Prodigio becado por las pruebas de selección mundial de Blue Lock' : 'Joya forjada en las categorías inferiores del club',
        },
      ],
      egoRating: 88,
      flowState: false,
      fitness: 100,
      morale: 95,
      form: 80,
      marketValueYen: youthValuation.marketValueYen,
      weeklyWageYen: youthValuation.weeklyWageYen,
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
      c.id === userClubId
        ? {
            ...c,
            cashYen: c.cashYen - promotionCost,
            substitutes: c.substitutes.length < 7 ? [...c.substitutes, newYouth.id] : c.substitutes,
          }
        : c
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
    return { success: true, message: `¡${newYouth.name} se une al primer equipo con 16 años y ${newYouth.potential} de potencial!` };
  },

  makeBuyOffer: (playerId, feeYen, wageYen, years) => {
    const { players, clubs, userClubId, currentRound, ledger, currentSeason, isSeasonCompleted } = get();
    // En una liga de 46 jornadas: Verano (J1-6 o fin de temporada) e Invierno (J22-28)
    const isWindowOpen = isSeasonCompleted || currentRound <= 6 || (currentRound >= 22 && currentRound <= 28);
    if (!isWindowOpen) {
      return { success: false, message: 'La ventana de fichajes está cerrada. Se abrirá en las Jornadas 1-6 (Verano) y 22-28 (Invierno).' };
    }

    const player = players.find((p) => p.id === playerId);
    const userClub = clubs.find((c) => c.id === userClubId);
    if (!player || !userClub) return { success: false, message: 'Datos inválidos.' };

    const userPlayers = players.filter((p) => p.clubId === userClubId);
    if (userPlayers.length >= 25) {
      return {
        success: false,
        message: 'Límite de plantilla alcanzado (25/25 jugadores). No puedes incorporar más futbolistas; pon a jugadores en lista de transferibles y acéptales ofertas para liberar plazas.',
      };
    }

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
        return reconcileClubTreasury({
          ...c,
          cashYen: c.cashYen - feeYen,
          budgetYen: c.budgetYen - feeYen,
          substitutes: c.substitutes.length < 7 ? [...c.substitutes, playerId] : c.substitutes,
        }).reconciledClub;
      }
      if (c.id === player.clubId) {
        let newXi = c.startingXI.filter((id) => id !== playerId);
        let newSubs = c.substitutes.filter((id) => id !== playerId);
        if (newXi.length < 11) {
          const sellerPlayers = updatedPlayers.filter((p) => p.clubId === c.id && !newXi.includes(p.id));
          const rep = sellerPlayers.sort((a, b) => b.overall - a.overall)[0];
          if (rep) {
            newXi.push(rep.id);
            newSubs = newSubs.filter((id) => id !== rep.id);
          }
        }
        const newCap = newXi.includes(c.captainId) ? c.captainId : newXi[0] || c.captainId;
        const newPen = newXi.includes(c.penaltyTakerId) ? c.penaltyTakerId : newCap;
        const newFk = newXi.includes(c.freeKickTakerId) ? c.freeKickTakerId : newCap;
        return {
          ...c,
          cashYen: c.cashYen + feeYen,
          budgetYen: c.budgetYen + feeYen,
          startingXI: newXi,
          substitutes: newSubs,
          captainId: newCap,
          penaltyTakerId: newPen,
          freeKickTakerId: newFk,
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

    const sellerClub = clubs.find((c) => c.id === player.clubId);
    const sellerClubName = sellerClub?.name || 'Club Rival';

    const userTransferNews: TransferNewsEntry = {
      id: `tr-user-buy-${Date.now()}-${player.id}`,
      season: currentSeason,
      round: currentRound,
      playerId: player.id,
      playerName: player.name,
      playerPosition: player.position,
      playerOverall: player.overall,
      fromClubId: player.clubId,
      fromClubName: sellerClubName,
      toClubId: userClubId,
      toClubName: userClub.name,
      feeYen,
      dateStr: `Jornada ${currentRound}`,
      isImportant: true,
    };

    let postClubs = updatedClubs;
    let postPlayers = updatedPlayers;
    const existingTransfers = get().recentTransfers || [];
    let updatedRecentTransfers: TransferNewsEntry[] = [userTransferNews, ...existingTransfers];

    // Comprobar si el club vendedor IA quedó desprotegido en la posición del jugador vendido
    // (Por ejemplo: vendió a su delantero y no tiene otro delantero, o se queda sin portero)
    const sellerInUpdated = postClubs.find((c) => c.id === player.clubId);
    if (sellerInUpdated) {
      const sellerSquad = postPlayers.filter((p) => p.clubId === player.clubId);
      const deficit = checkSquadDepartmentDeficit(sellerSquad);
      if (deficit.isDeficient) {
        const replacement = executeEmergencyReplacement(
          sellerInUpdated,
          postClubs,
          postPlayers,
          currentSeason,
          currentRound,
          userClubId
        );
        postClubs = replacement.updatedClubs;
        postPlayers = replacement.updatedPlayers;
        if (replacement.news) {
          updatedRecentTransfers = [replacement.news, ...updatedRecentTransfers];
        }
      }
    }

    set({
      players: postPlayers,
      clubs: postClubs,
      ledger: updatedLedger,
      recentTransfers: updatedRecentTransfers.slice(0, 60),
    });
    get().saveToStorage();

    return { success: true, message: `¡Fichaje completado! ${player.name} firma por ${years} temporadas.` };
  },

  acceptSellOffer: (offerId) => {
    const { transferOffers, players, clubs, userClubId, ledger, currentSeason, currentRound } = get();
    const offer = transferOffers.find((o) => o.id === offerId);
    if (!offer) return;

    const player = players.find((p) => p.id === offer.playerId);
    if (!player) return;

    const updatedPlayers = players.map((p) =>
      p.id === offer.playerId
        ? { ...p, clubId: offer.buyerClubId, isTransferListed: false, positionConversion: null, trainingFocus: undefined }
        : p
    );

    const updatedClubs = clubs.map((c) => {
      if (c.id === userClubId) {
        let newStartingXI = c.startingXI.filter((id) => id !== offer.playerId);
        let newSubstitutes = c.substitutes.filter((id) => id !== offer.playerId);

        // Si el jugador vendido era titular, reponer automáticamente con el mejor suplente
        const remainingUserPlayers = updatedPlayers.filter((p) => p.clubId === userClubId);
        if (newStartingXI.length < 11 && remainingUserPlayers.length >= 11) {
          const replacement = remainingUserPlayers
            .filter((p) => !newStartingXI.includes(p.id))
            .sort((a, b) => b.overall - a.overall)[0];
          if (replacement) {
            newStartingXI.push(replacement.id);
            newSubstitutes = newSubstitutes.filter((id) => id !== replacement.id);
          }
        }

        // Si el jugador vendido era capitán o tirador, reasignar a un jugador activo
        const newCaptain = remainingUserPlayers.some((p) => p.id === c.captainId)
          ? c.captainId
          : newStartingXI[0] || remainingUserPlayers[0]?.id;
        const newPenalty = remainingUserPlayers.some((p) => p.id === c.penaltyTakerId)
          ? c.penaltyTakerId
          : newStartingXI.find((id) => remainingUserPlayers.find((p) => p.id === id)?.position === 'DC') || newCaptain;
        const newFk = remainingUserPlayers.some((p) => p.id === c.freeKickTakerId)
          ? c.freeKickTakerId
          : newStartingXI.find((id) => ['MCO', 'MC', 'EI'].includes(remainingUserPlayers.find((p) => p.id === id)?.position || '')) || newCaptain;

        return reconcileClubTreasury({
          ...c,
          cashYen: c.cashYen + offer.offeredFeeYen,
          budgetYen: c.budgetYen + Math.round(offer.offeredFeeYen * 0.8),
          startingXI: newStartingXI,
          substitutes: newSubstitutes,
          captainId: newCaptain,
          penaltyTakerId: newPenalty,
          freeKickTakerId: newFk,
        }).reconciledClub;
      }
      if (c.id === offer.buyerClubId) {
        return {
          ...c,
          cashYen: Math.max(0, c.cashYen - offer.offeredFeeYen),
          budgetYen: Math.max(0, c.budgetYen - offer.offeredFeeYen),
          substitutes: c.substitutes.length < 7 ? [...c.substitutes, offer.playerId] : c.substitutes,
        };
      }
      return c;
    });

    // Rebalancear alineación del club comprador IA para integrar al fichaje si es titular
    const buyerObj = updatedClubs.find((c) => c.id === offer.buyerClubId);
    if (buyerObj) {
      const buyerSquad = updatedPlayers.filter((p) => p.clubId === buyerObj.id);
      rebalanceClubLineup(buyerObj, buyerSquad);
    }

    const userClubName = clubs.find((c) => c.id === userClubId)?.name || 'Tu Club';
    const userSellNews: TransferNewsEntry = {
      id: `tr-user-sell-${Date.now()}-${player.id}`,
      season: currentSeason,
      round: currentRound,
      playerId: player.id,
      playerName: player.name,
      playerPosition: player.position,
      playerOverall: player.overall,
      fromClubId: userClubId,
      fromClubName: userClubName,
      toClubId: offer.buyerClubId,
      toClubName: offer.buyerClubName,
      feeYen: offer.offeredFeeYen,
      dateStr: `Jornada ${currentRound}`,
      isImportant: true,
    };

    const existingTransfers = get().recentTransfers || [];
    const updatedRecentTransfers = [userSellNews, ...existingTransfers].slice(0, 60);

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
      recentTransfers: updatedRecentTransfers,
    });

    get().saveToStorage();
  },

  rejectSellOffer: (offerId) => {
    set((state) => ({
      transferOffers: state.transferOffers.filter((o) => o.id !== offerId),
    }));
    get().saveToStorage();
  },

  toggleTransferListed: (playerId) => {
    const { players, userClubId } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player || player.clubId !== userClubId) return;

    const nextStatus = !player.isTransferListed;
    const updatedPlayers = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            isTransferListed: nextStatus,
            // Si se pone en venta, desactivar el bloqueo de ofertas
            blockOffers: nextStatus ? false : p.blockOffers,
          }
        : p
    );
    set({ players: updatedPlayers });
    get().saveToStorage();
  },

  toggleBlockOffers: (playerId) => {
    const { players, userClubId, transferOffers } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player || player.clubId !== userClubId) return;

    const nextBlocked = !player.blockOffers;
    const updatedPlayers = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            blockOffers: nextBlocked,
            // Si se bloquea, retirar inmediatamente de la lista de transferibles
            isTransferListed: nextBlocked ? false : p.isTransferListed,
          }
        : p
    );

    // Si se activa el bloqueo de ofertas, retirar automáticamente cualquier oferta pendiente para este jugador
    const updatedOffers = nextBlocked
      ? transferOffers.filter((o) => !(o.playerId === playerId && o.status === 'pending'))
      : transferOffers;

    set({ players: updatedPlayers, transferOffers: updatedOffers });
    get().saveToStorage();
  },

  renewPlayerContract: (playerId, newWageYen, addYears) => {
    const { players, clubs, userClubId } = get();
    const userClub = clubs.find((c) => c.id === userClubId);
    const player = players.find((p) => p.id === playerId);
    if (!player || !userClub) return { success: false, message: 'Jugador no encontrado.' };

    const minAcceptableWage = Math.round(player.weeklyWageYen * 1.148); // Tolerancia anti-redondeo entre divisas
    if (newWageYen < minAcceptableWage) {
      return {
        success: false,
        message: `El jugador exige un incremento del 15% (mínimo ${formatMoney(Math.round(player.weeklyWageYen * 1.15), get().selectedCurrency)}/semana).`,
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
    const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
    const userDivId = userClub?.divisionId || userClub?.league;
    const divClubs = clubs.filter((c) => (c.divisionId || c.league) === userDivId);
    const clubsForTable = divClubs.length > 0 ? divClubs : clubs;
    const table = computeLeagueTable(clubsForTable, fixtures);

    const {
      newSeason,
      newClubs,
      newPlayers,
      newFixtures,
      seasonHistoryEntry,
      seasonTransitionReport,
      earnedTrophy,
    } = advanceToNextSeason(
      currentSeason,
      userClubId,
      clubs,
      players,
      table
    );

    const userClubAfter = newClubs.find((c) => c.id === userClubId) || newClubs[0];
    const preSeasonRivalTransfers = seasonTransitionReport.rivalTransfers || [];
    const updatedRecentTransfers = [...preSeasonRivalTransfers, ...(get().recentTransfers || [])].slice(0, 60);

    const userTier = (userClubAfter.tier || 1) as TierLevel;
    const userSeasonSponsorYen = getSeasonRenewalSponsorYen(userTier, userClubAfter.reputation);

    const prizeEntry: ClubLedgerEntry = {
      id: `led-p-${newSeason}-${Date.now()}`,
      season: newSeason,
      round: 1,
      type: 'premios',
      concept: `Premios de Clasificación Temporada ${currentSeason} (Puesto ${seasonHistoryEntry.userPosition}º)`,
      amountYen: seasonHistoryEntry.prizeMoneyYen,
      dateStr: `Inicio Temporada ${newSeason}`,
    };

    const sponsorEntry: ClubLedgerEntry = {
      id: `led-sp-season-${newSeason}-${Date.now()}`,
      season: newSeason,
      round: 1,
      type: 'patrocinio',
      concept: `Renovación de Patrocinio Principal y Derechos Comerciales Temporada ${newSeason}`,
      amountYen: userSeasonSponsorYen,
      dateStr: `Inicio Temporada ${newSeason}`,
    };

    const currentTrophies = get().clubTrophies || [];
    const updatedTrophies = earnedTrophy ? [earnedTrophy, ...currentTrophies] : currentTrophies;

    set({
      currentSeason: newSeason,
      currentRound: 1,
      clubs: newClubs,
      players: newPlayers,
      fixtures: newFixtures,
      selectedDivisionId: userClubAfter.divisionId || userClubAfter.league,
      selectedTier: userClubAfter.tier || 1,
      seasonHistory: [seasonHistoryEntry, ...seasonHistory],
      ledger: [sponsorEntry, prizeEntry, ...ledger],
      recentTransfers: updatedRecentTransfers,
      clubTrophies: updatedTrophies,
      youthPromotedThisSeason: false,
      isSeasonCompleted: false,
      activeTab: 'office',
      lastSeasonTransitionReport: seasonTransitionReport,
    });

    get().saveToStorage();
  },

  reconcileUserTreasury: () => {
    const { clubs, userClubId, ledger } = get();
    let updatedLedger = [...ledger];
    const updatedClubs = clubs.map((c) => {
      if (c.id === userClubId) {
        const { reconciledClub, wasAdjusted, adjustmentLedgerEntry } = reconcileClubTreasury(c);
        if (wasAdjusted && adjustmentLedgerEntry) {
          updatedLedger = [adjustmentLedgerEntry, ...updatedLedger];
        }
        return reconciledClub;
      }
      return c;
    });
    set({ clubs: updatedClubs, ledger: updatedLedger });
    get().saveToStorage();
  },

  awardClubTrophy: (trophyKey: string, customOfficialName?: string) => {
    const { clubs, userClubId, currentSeason, clubTrophies } = get();
    const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
    const newTrophy = awardTrophyToClub(userClub, trophyKey, currentSeason, {
      customOfficialName,
    });
    set({ clubTrophies: [newTrophy, ...(clubTrophies || [])] });
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
