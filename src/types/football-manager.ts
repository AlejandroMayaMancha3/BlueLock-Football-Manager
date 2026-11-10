export type Position =
  | 'POR'
  | 'DFC'
  | 'LI'
  | 'LD'
  | 'CAI'
  | 'CAD'
  | 'MCD'
  | 'MC'
  | 'MI'
  | 'MD'
  | 'MCO'
  | 'EI'
  | 'ED'
  | 'DC';
export type Currency = 'EUR' | 'USD' | 'JPY' | 'GBP';

export type CountryLeague = 'Spain' | 'England' | 'Germany' | 'Italy' | 'France';
export type TierLevel = 1 | 2 | 3 | 4;

export interface DivisionGroupInfo {
  id: string;
  name: string;
  shortName: string;
}

export interface DivisionInfo {
  id: string;
  country: CountryLeague;
  countryNameEs: string;
  flag: string;
  tier: TierLevel;
  name: string;
  shortName: string;
  totalTeams: number;
  promotionDirect: number;
  promotionPlayoff: number;
  relegationDirect: number;
  relegationPlayoff: number;
  hasGroups: boolean;
  groups?: DivisionGroupInfo[];
  reputationRange: [number, number];
  budgetRangeEur: [number, number];
}

export type IndividualTrainingFocus =
  | 'balanced'
  | 'finishing'
  | 'playmaking'
  | 'dribbling_pace'
  | 'defending_physical'
  | 'goalkeeping_reflexes';

export interface PositionConversionPlan {
  targetPosition: Position;
  totalWeeks: number;
  weeksElapsed: number;
}

export type TacticalMentalidad = 'muy_defensiva' | 'defensiva' | 'equilibrada' | 'ofensiva' | 'ultra_ofensiva';
export type TacticalPresion = 'baja' | 'media' | 'alta';
export type TacticalPase = 'directo' | 'posesion' | 'contraataque';
export type Formation = '4-3-3' | '4-2-3-1' | '4-4-2' | '3-5-2' | '5-3-2';

export interface Weapon {
  name: string;
  type: 'striker' | 'vision' | 'speed' | 'physical' | 'gk' | 'dribble' | 'defense';
  level: number;
  description: string;
}

export interface PlayerStats {
  pace: number;        // Ritmo / Velocidad
  shooting: number;    // Tiro / Definición
  passing: number;     // Pase / Visión
  dribbling: number;   // Regate / Técnica
  defense: number;     // Defensa / Entradas
  physical: number;    // Físico / Resistencia
  goalkeeping: number; // Reflejos / Portería
}

export interface Player {
  id: string;
  clubId: string;
  name: string;
  age: number;
  nationality: string;
  position: Position;
  secondaryPosition?: Position;
  overall: number;
  potential: number;
  stats: PlayerStats;
  weapons: Weapon[];
  egoRating: number;      // 0-100
  flowState: boolean;
  fitness: number;        // 0-100 (Estado físico / stamina)
  morale: number;         // 0-100
  form: number;           // 0-100 (Forma reciente)
  marketValueYen: number;
  weeklyWageYen: number;
  contractYears: number;
  isTransferListed?: boolean;
  blockOffers?: boolean; // Si está activo, rechaza y bloquea automáticamente todas las ofertas de traspaso entrantes en el despacho
  trainingFocus?: IndividualTrainingFocus;
  positionConversion?: PositionConversionPlan | null;
  injuryWeeks: number;
  isBanned: boolean;
  yellowCardsCount: number;
  consecutiveMatchesWithoutPlaying: number; // Partidos consecutivos sin jugar (para estancamiento/caída de potencial)
  isUnlicensedParody?: boolean;
  realNameReference?: string;
  // Season cumulative stats
  seasonMatches: number;
  seasonMinutes?: number;
  seasonGoals: number;
  seasonAssists: number;
  seasonYellowCards: number;
  seasonRedCards: number;
  seasonCleanSheets: number;
  seasonAverageRating: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league: string;
  divisionId?: string;
  tier?: TierLevel;
  groupId?: string;
  reputation: number;     // 1-100
  level: number;          // Fuerza general del club
  budgetYen: number;      // Presupuesto de fichajes
  cashYen: number;        // Saldo total en caja
  weeklyWageCapYen: number; // Límite de masa salarial semanal
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  ticketPriceYen: number;
  boardExpectation: number; // Posición esperada en tabla (ej: Top 3, Top 6, Evitar descenso)
  formation: Formation;
  startingXI: string[];    // Array de 11 player IDs
  substitutes: string[];   // Array de hasta 7 player IDs
  captainId: string;
  penaltyTakerId: string;
  freeKickTakerId: string;
  mentalidad: TacticalMentalidad;
  presion: TacticalPresion;
  estiloPase: TacticalPase;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'shot' | 'save' | 'yellow_card' | 'red_card' | 'injury' | 'sub' | 'flow' | 'commentary' | 'corner' | 'foul' | 'penalty';
  teamId: string;
  playerId?: string;
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  description: string;
  ballZone?: { x: number; y: number }; // Porcentajes de 0 a 100 en la pizarra 2D
}

export interface MatchFixture {
  id: string;
  season: number;
  round: number;
  leagueMatchday?: number;
  divisionId?: string;
  isPlayoff?: boolean;
  playoffStage?: 'semi' | 'final' | 'relegation_tie' | 'barrage' | 'spareggio' | 'playout';
  leg?: number;
  competitionType?: 'league' | 'ucl' | 'uel' | 'uecl' | 'cup' | 'secondary_cup';
  competitionName?: string;
  roundStageName?: string;
  isKnockout?: boolean;
  trophyKey?: string;
  homeClubId: string;
  awayClubId: string;
  homeScore?: number;
  awayScore?: number;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
  aggregateHomeScore?: number;
  aggregateAwayScore?: number;
  isPlayed: boolean;
  events?: MatchEvent[];
  homeStats?: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    chances: number;
    fouls: number;
    corners: number;
  };
  awayStats?: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    chances: number;
    fouls: number;
    corners: number;
  };
}

export interface LeagueTableRow {
  clubId: string;
  clubName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  formHistory: ('W' | 'D' | 'L')[];
}

export interface TransferOffer {
  id: string;
  playerId: string;
  playerName: string;
  sellerClubId: string;
  buyerClubId: string;
  buyerClubName: string;
  offeredFeeYen: number;
  offeredWageYen: number;
  contractYears: number;
  status: 'pending' | 'accepted' | 'rejected';
  dateStr: string;
  isFromUser: boolean;
}

export interface ClubLedgerEntry {
  id: string;
  season: number;
  round: number;
  type: 'taquilla' | 'patrocinio' | 'premios' | 'salarios' | 'fichaje_compra' | 'fichaje_venta' | 'cantera' | 'tv' | 'mantenimiento' | 'rebalanceo';
  concept: string;
  amountYen: number;
  dateStr: string;
}

export interface DecisionEvent {
  id: string;
  title: string;
  narrative: string;
  speaker: string;
  options: {
    label: string;
    description: string;
    impact: {
      budgetChangeYen?: number;
      boardTrustChange?: number;
      squadMoraleChange?: number;
      egoBonusPlayerId?: string;
    };
  }[];
}

export interface PromotionRelegationMovement {
  clubId: string;
  clubName: string;
  fromDivisionId: string;
  fromDivisionName: string;
  toDivisionId: string;
  toDivisionName: string;
  type: 'promotion_direct' | 'promotion_playoff' | 'relegation_direct' | 'relegation_playoff';
  finalPosition: number;
}

export interface TransferNewsEntry {
  id: string;
  season: number;
  round: number;
  playerId: string;
  playerName: string;
  playerPosition: Position;
  playerOverall: number;
  fromClubId: string;
  fromClubName: string;
  toClubId: string;
  toClubName: string;
  feeYen: number;
  dateStr: string;
  isImportant?: boolean;
}

export interface SeasonTransitionReport {
  seasonNumber: number;
  country: CountryLeague;
  userOutcome: 'champion' | 'promoted' | 'relegated' | 'stayed';
  userClubId: string;
  userClubName: string;
  userOldDivisionName: string;
  userNewDivisionName: string;
  userOldTier: number;
  userNewTier: number;
  userPosition: number;
  prizeMoneyYen: number;
  champions: { tier: number; divisionName: string; clubName: string; clubId: string }[];
  promotions: PromotionRelegationMovement[];
  relegations: PromotionRelegationMovement[];
  rivalTransfers?: TransferNewsEntry[];
}

export interface SeasonHistoryEntry {
  seasonNumber: number;
  championClubId: string;
  championClubName: string;
  userPosition: number;
  userClubId: string;
  userClubName: string;
  topScorerName: string;
  topScorerGoals: number;
  topScorerClubName: string;
  prizeMoneyYen: number;
  divisionId?: string;
  divisionName?: string;
  userOutcome?: 'champion' | 'promoted' | 'relegated' | 'stayed';
  promotedClubNames?: string[];
  relegatedClubNames?: string[];
}

export interface PlayerPerformanceSummary {
  playerId: string;
  playerName: string;
  position: Position;
  age: number;
  minutesPlayed: number;
  rating: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  oldOverall: number;
  newOverall: number;
  oldPotential: number;
  newPotential: number;
  flowState: boolean;
  fitness: number;
  isSub: boolean;
}

export interface MatchSummaryData {
  round: number;
  season: number;
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  userClubId: string;
  userIsHome: boolean;
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
  playerPerformances: PlayerPerformanceSummary[];
  roundFixtures: MatchFixture[];
  isSimulated?: boolean;
  competitionType?: 'league' | 'ucl' | 'uel' | 'uecl' | 'cup' | 'secondary_cup';
  competitionName?: string;
  roundStageName?: string;
  isKnockout?: boolean;
  trophyKey?: string;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
}

export type TrophyType =
  | 'ucl'            // UEFA Champions League ("La Orejona")
  | 'uel'            // UEFA Europa League ("Copa de la UEFA")
  | 'uecl'           // UEFA Conference League ("Trofeo UEFA Conference")
  | 'league_t1'      // 1ª División Nacional (LaLiga, Premier, Serie A, Bundesliga, Ligue 1)
  | 'league_t2'      // 2ª División
  | 'league_t3'      // 3ª División
  | 'league_t4'      // 4ª División
  | 'cup_main'       // Copa Nacional (Copa del Rey, FA Cup, Coppa Italia, DFB-Pokal, Coupe de France)
  | 'cup_secondary'; // EFL Cup / Carabao Cup

export interface ClubTrophyRecord {
  id: string;
  clubId: string;
  season: number;
  trophyKey: string;
  trophyType: TrophyType;
  officialName: string;
  popularName?: string;
  competitionName: string;
  country?: CountryLeague | 'Europe';
  dateStr: string;
  iconType: string;
  tier?: TierLevel;
}

export type UefaTournamentType = 'ucl' | 'uel' | 'uecl';

export interface EuropeanQualificationEntry {
  clubId: string;
  clubName: string;
  country: CountryLeague;
  leaguePosition: number;
  tournament: UefaTournamentType;
  qualificationReason: string;
  stage: 'league_phase' | 'playoff';
}

export interface KnockoutMatchup {
  id: string;
  stageKey: 'playoff_16' | 'round_of_16' | 'quarter' | 'semi' | 'final';
  stageName: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
    seedRank?: number;
    country?: CountryLeague;
    level?: number;
    isTbd?: boolean;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
    seedRank?: number;
    country?: CountryLeague;
    level?: number;
    isTbd?: boolean;
  };
  homeScore?: number;
  awayScore?: number;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
  winnerTeamId?: string;
  isPlayed: boolean;
  statusLabel?: string;
}


