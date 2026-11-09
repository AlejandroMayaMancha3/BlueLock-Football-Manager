import { CountryLeague, DivisionInfo } from '@/types/football-manager';

export interface CountryMetadata {
  id: CountryLeague;
  nameEs: string;
  flag: string;
  currency: 'EUR' | 'GBP';
  description: string;
}

export const COUNTRIES_CATALOG: CountryMetadata[] = [
  {
    id: 'Spain',
    nameEs: 'España',
    flag: '🇪🇸',
    currency: 'EUR',
    description: 'Fútbol técnico, posesión y competitividad extrema con 4 niveles piramidales.',
  },
  {
    id: 'England',
    nameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    currency: 'GBP',
    description: 'Intensidad física, estadios históricos y la final del playoff en Wembley.',
  },
  {
    id: 'Germany',
    nameEs: 'Alemania',
    flag: '🇩🇪',
    currency: 'EUR',
    description: 'Disciplina táctica, presión alta y la implacable eliminatoria de Relegation.',
  },
  {
    id: 'Italy',
    nameEs: 'Italia',
    flag: '🇮🇹',
    currency: 'EUR',
    description: 'Maestría defensiva, tensión táctica, Spareggio y playouts a doble partido.',
  },
  {
    id: 'France',
    nameEs: 'Francia',
    flag: '🇫🇷',
    currency: 'EUR',
    description: 'Velocidad, potencia atlética y los intensos Barrages de permanencia y ascenso.',
  },
];

export const DIVISIONS_CATALOG: DivisionInfo[] = [
  // ==========================================
  // 🇪🇸 ESPAÑA (4 NIVELES)
  // ==========================================
  {
    id: 'es_laliga',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 1,
    name: 'LaLiga EA Sports',
    shortName: '1.ª División',
    totalTeams: 20,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 3, // 18.º, 19.º y 20.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [78, 93],
    budgetRangeEur: [25000000, 150000000],
  },
  {
    id: 'es_hypermotion',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 2,
    name: 'LaLiga Hypermotion',
    shortName: '2.ª División',
    totalTeams: 22,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // 3.º al 6.º playoff ida y vuelta
    relegationDirect: 4, // 19.º al 22.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [68, 77],
    budgetRangeEur: [5000000, 18000000],
  },
  {
    id: 'es_primera_rfef',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 3,
    name: 'Primera Federación',
    shortName: '1.ª RFEF',
    totalTeams: 40,
    promotionDirect: 2, // Campeones Grupo 1 y 2
    promotionPlayoff: 2, // Playoff cruzado 2.º al 5.º
    relegationDirect: 10, // 5 últimos de cada grupo
    relegationPlayoff: 0,
    hasGroups: true,
    groups: [
      { id: 'es_rfef1_g1', name: 'Grupo 1 (Norte/Oeste)', shortName: 'Grupo 1' },
      { id: 'es_rfef1_g2', name: 'Grupo 2 (Sur/Este)', shortName: 'Grupo 2' },
    ],
    reputationRange: [58, 69],
    budgetRangeEur: [1500000, 4500000],
  },
  {
    id: 'es_segunda_rfef',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 4,
    name: 'Segunda Federación',
    shortName: '2.ª RFEF',
    totalTeams: 90,
    promotionDirect: 5, // 5 campeones de grupo
    promotionPlayoff: 5, // Playoff 2.º al 5.º
    relegationDirect: 25,
    relegationPlayoff: 4,
    hasGroups: true,
    groups: [
      { id: 'es_rfef2_g1', name: 'Grupo 1 (Galicia, Asturias, Cantabria)', shortName: 'Grupo 1' },
      { id: 'es_rfef2_g2', name: 'Grupo 2 (País Vasco, Navarra, La Rioja, Aragón)', shortName: 'Grupo 2' },
      { id: 'es_rfef2_g3', name: 'Grupo 3 (Cataluña, Baleares, C. Valenciana)', shortName: 'Grupo 3' },
      { id: 'es_rfef2_g4', name: 'Grupo 4 (Andalucía, Murcia)', shortName: 'Grupo 4' },
      { id: 'es_rfef2_g5', name: 'Grupo 5 (Madrid, Castilla-La Mancha, Extremadura)', shortName: 'Grupo 5' },
    ],
    reputationRange: [45, 59],
    budgetRangeEur: [350000, 1100000],
  },

  // ==========================================
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 INGLATERRA (4 NIVELES)
  // ==========================================
  {
    id: 'en_premier',
    country: 'England',
    countryNameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    tier: 1,
    name: 'Premier League',
    shortName: 'Premier',
    totalTeams: 20,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 3, // 18.º, 19.º y 20.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [80, 95],
    budgetRangeEur: [40000000, 180000000],
  },
  {
    id: 'en_championship',
    country: 'England',
    countryNameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    tier: 2,
    name: 'EFL Championship',
    shortName: 'Championship',
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // 3.º al 6.º con final en Wembley
    relegationDirect: 3, // 22.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [70, 79],
    budgetRangeEur: [8000000, 30000000],
  },
  {
    id: 'en_league_one',
    country: 'England',
    countryNameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    tier: 3,
    name: 'EFL League One',
    shortName: 'League One',
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // 3.º al 6.º
    relegationDirect: 4, // 21.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [58, 70],
    budgetRangeEur: [2000000, 6000000],
  },
  {
    id: 'en_league_two',
    country: 'England',
    countryNameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    tier: 4,
    name: 'EFL League Two',
    shortName: 'League Two',
    totalTeams: 24,
    promotionDirect: 3, // 1.º, 2.º y 3.º
    promotionPlayoff: 1, // 4.º al 7.º
    relegationDirect: 2,
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [48, 60],
    budgetRangeEur: [500000, 1500000],
  },

  // ==========================================
  // 🇩🇪 ALEMANIA (4 NIVELES)
  // ==========================================
  {
    id: 'de_bundesliga',
    country: 'Germany',
    countryNameEs: 'Alemania',
    flag: '🇩🇪',
    tier: 1,
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    totalTeams: 18,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 2, // 17.º y 18.º
    relegationPlayoff: 1, // 16.º Relegation ida/vuelta vs 3.º de 2.ª
    hasGroups: false,
    reputationRange: [79, 93],
    budgetRangeEur: [25000000, 140000000],
  },
  {
    id: 'de_2bundesliga',
    country: 'Germany',
    countryNameEs: 'Alemania',
    flag: '🇩🇪',
    tier: 2,
    name: '2. Bundesliga',
    shortName: '2. Bundesliga',
    totalTeams: 18,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // 3.º a Relegation vs 16.º de Bundesliga
    relegationDirect: 2, // 17.º y 18.º
    relegationPlayoff: 1, // 16.º a Relegation vs 3.º de 3. Liga
    hasGroups: false,
    reputationRange: [67, 76],
    budgetRangeEur: [5000000, 18000000],
  },
  {
    id: 'de_3liga',
    country: 'Germany',
    countryNameEs: 'Alemania',
    flag: '🇩🇪',
    tier: 3,
    name: '3. Liga',
    shortName: '3. Liga',
    totalTeams: 20,
    promotionDirect: 2, // 1.º y 2.º (veto filiales)
    promotionPlayoff: 1, // 3.º a Relegation vs 16.º de 2. Bundesliga
    relegationDirect: 4, // 17.º al 20.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [57, 68],
    budgetRangeEur: [1600000, 4800000],
  },
  {
    id: 'de_regionalliga',
    country: 'Germany',
    countryNameEs: 'Alemania',
    flag: '🇩🇪',
    tier: 4,
    name: 'Regionalliga',
    shortName: 'Regionalliga',
    totalTeams: 90,
    promotionDirect: 3,
    promotionPlayoff: 1,
    relegationDirect: 15,
    relegationPlayoff: 0,
    hasGroups: true,
    groups: [
      { id: 'de_reg_nord', name: 'Regionalliga Nord', shortName: 'Nord' },
      { id: 'de_reg_nordost', name: 'Regionalliga Nordost', shortName: 'Nordost' },
      { id: 'de_reg_west', name: 'Regionalliga West', shortName: 'West' },
      { id: 'de_reg_sudwest', name: 'Regionalliga Südwest', shortName: 'Südwest' },
      { id: 'de_reg_bayern', name: 'Regionalliga Bayern', shortName: 'Bayern' },
    ],
    reputationRange: [46, 59],
    budgetRangeEur: [400000, 1200000],
  },

  // ==========================================
  // 🇮🇹 ITALIA (4 NIVELES)
  // ==========================================
  {
    id: 'it_serie_a',
    country: 'Italy',
    countryNameEs: 'Italia',
    flag: '🇮🇹',
    tier: 1,
    name: 'Serie A',
    shortName: 'Serie A',
    totalTeams: 20,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 3, // 18.º, 19.º y 20.º (Spareggio si empatan 17.º y 18.º)
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [78, 92],
    budgetRangeEur: [22000000, 130000000],
  },
  {
    id: 'it_serie_b',
    country: 'Italy',
    countryNameEs: 'Italia',
    flag: '🇮🇹',
    tier: 2,
    name: 'Serie B',
    shortName: 'Serie B',
    totalTeams: 20,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // 3.º directo si >14 pts, si no playoff 3.º al 8.º
    relegationDirect: 3, // 18.º, 19.º y 20.º
    relegationPlayoff: 1, // Playout 16.º vs 17.º (salvo >4 pts)
    hasGroups: false,
    reputationRange: [66, 76],
    budgetRangeEur: [4500000, 16000000],
  },
  {
    id: 'it_serie_c',
    country: 'Italy',
    countryNameEs: 'Italia',
    flag: '🇮🇹',
    tier: 3,
    name: 'Serie C',
    shortName: 'Serie C',
    totalTeams: 60,
    promotionDirect: 3, // Campeones Girone A, B y C
    promotionPlayoff: 1, // Macro-Playoff nacional
    relegationDirect: 9, // 3 por grupo
    relegationPlayoff: 0,
    hasGroups: true,
    groups: [
      { id: 'it_seriec_ga', name: 'Girone A (Norte)', shortName: 'Girone A' },
      { id: 'it_seriec_gb', name: 'Girone B (Centro)', shortName: 'Girone B' },
      { id: 'it_seriec_gc', name: 'Girone C (Sur e Islas)', shortName: 'Girone C' },
    ],
    reputationRange: [56, 68],
    budgetRangeEur: [1400000, 4200000],
  },
  {
    id: 'it_serie_d',
    country: 'Italy',
    countryNameEs: 'Italia',
    flag: '🇮🇹',
    tier: 4,
    name: 'Serie D',
    shortName: 'Serie D',
    totalTeams: 160,
    promotionDirect: 9, // Campeones de los 9 grupos
    promotionPlayoff: 0,
    relegationDirect: 36,
    relegationPlayoff: 0,
    hasGroups: true,
    groups: [
      { id: 'it_seried_ga', name: 'Girone A (Noroeste)', shortName: 'Girone A' },
      { id: 'it_seried_gb', name: 'Girone B (Lombardía)', shortName: 'Girone B' },
      { id: 'it_seried_gc', name: 'Girone C (Veneto/Friuli)', shortName: 'Girone C' },
      { id: 'it_seried_gd', name: 'Girone D (Emilia-Romagna/Toscana)', shortName: 'Girone D' },
      { id: 'it_seried_ge', name: 'Girone E (Toscana/Umbria)', shortName: 'Girone E' },
      { id: 'it_seried_gf', name: 'Girone F (Marche/Abruzzo)', shortName: 'Girone F' },
      { id: 'it_seried_gg', name: 'Girone G (Lazio/Cerdeña)', shortName: 'Girone G' },
      { id: 'it_seried_gh', name: 'Girone H (Puglia/Basilicata)', shortName: 'Girone H' },
      { id: 'it_seried_gi', name: 'Girone I (Campania/Calabria/Sicilia)', shortName: 'Girone I' },
    ],
    reputationRange: [44, 58],
    budgetRangeEur: [350000, 1000000],
  },

  // ==========================================
  // 🇫🇷 FRANCIA (4 NIVELES)
  // ==========================================
  {
    id: 'fr_ligue_1',
    country: 'France',
    countryNameEs: 'Francia',
    flag: '🇫🇷',
    tier: 1,
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    totalTeams: 18,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 2, // 17.º y 18.º
    relegationPlayoff: 1, // 16.º al Barrage vs ganador de playoff Ligue 2
    hasGroups: false,
    reputationRange: [76, 92],
    budgetRangeEur: [20000000, 160000000],
  },
  {
    id: 'fr_ligue_2',
    country: 'France',
    countryNameEs: 'Francia',
    flag: '🇫🇷',
    tier: 2,
    name: 'Ligue 2',
    shortName: 'Ligue 2',
    totalTeams: 18,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // Ganador de 3.º al 5.º va al Barrage vs 16.º de Ligue 1
    relegationDirect: 2, // 17.º y 18.º
    relegationPlayoff: 1, // 16.º al Barrage vs 3.º de National
    hasGroups: false,
    reputationRange: [65, 75],
    budgetRangeEur: [4000000, 14000000],
  },
  {
    id: 'fr_national_1',
    country: 'France',
    countryNameEs: 'Francia',
    flag: '🇫🇷',
    tier: 3,
    name: 'Championnat National 1',
    shortName: 'National 1',
    totalTeams: 18,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 1, // 3.º al Barrage vs 16.º de Ligue 2
    relegationDirect: 3, // 16.º, 17.º y 18.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [55, 67],
    budgetRangeEur: [1300000, 3800000],
  },
  {
    id: 'fr_national_2',
    country: 'France',
    countryNameEs: 'Francia',
    flag: '🇫🇷',
    tier: 4,
    name: 'Championnat National 2',
    shortName: 'National 2',
    totalTeams: 48,
    promotionDirect: 3, // Campeones de los 3 grupos
    promotionPlayoff: 0,
    relegationDirect: 9,
    relegationPlayoff: 0,
    hasGroups: true,
    groups: [
      { id: 'fr_nat2_ga', name: 'Groupe A (Oeste / Bretaña)', shortName: 'Groupe A' },
      { id: 'fr_nat2_gb', name: 'Groupe B (Norte / Este)', shortName: 'Groupe B' },
      { id: 'fr_nat2_gc', name: 'Groupe C (Sur / Mediterráneo)', shortName: 'Groupe C' },
    ],
    reputationRange: [43, 57],
    budgetRangeEur: [320000, 950000],
  },
];

// Helper functions
export function getDivisionsByCountry(country: CountryLeague): DivisionInfo[] {
  return DIVISIONS_CATALOG.filter((d) => d.country === country).sort((a, b) => a.tier - b.tier);
}

export function getDivisionById(id: string): DivisionInfo | undefined {
  return DIVISIONS_CATALOG.find((d) => d.id === id);
}

export function getDivisionByCountryAndTier(country: CountryLeague, tier: 1 | 2 | 3 | 4): DivisionInfo | undefined {
  return DIVISIONS_CATALOG.find((d) => d.country === country && d.tier === tier);
}

export function getCountryMetadata(country: CountryLeague): CountryMetadata | undefined {
  return COUNTRIES_CATALOG.find((c) => c.id === country);
}
