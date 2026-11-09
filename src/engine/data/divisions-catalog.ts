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
    description: 'Fútbol técnico, posesión y competitividad extrema en 4 divisiones de 24 clubes.',
  },
  {
    id: 'England',
    nameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    currency: 'GBP',
    description: 'Intensidad física, estadios legendarios y playoffs de ascenso en 4 niveles de 24 clubes.',
  },
  {
    id: 'Germany',
    nameEs: 'Alemania',
    flag: '🇩🇪',
    currency: 'EUR',
    description: 'Disciplina táctica, ritmo vertical y eliminatorias de Relegation en 4 niveles de 24 clubes.',
  },
  {
    id: 'Italy',
    nameEs: 'Italia',
    flag: '🇮🇹',
    currency: 'EUR',
    description: 'Maestría defensiva, tensión táctica y playouts en 4 divisiones completas de 24 clubes.',
  },
  {
    id: 'France',
    nameEs: 'Francia',
    flag: '🇫🇷',
    currency: 'EUR',
    description: 'Velocidad, despliegue físico y barrages de permanencia en 4 categorías de 24 clubes.',
  },
];

export const DIVISIONS_CATALOG: DivisionInfo[] = [
  // ==========================================
  // 🇪🇸 ESPAÑA (4 NIVELES DE 24 CLUBES)
  // ==========================================
  {
    id: 'es_laliga',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 1,
    name: 'LaLiga EA Sports',
    shortName: '1.ª División',
    totalTeams: 24,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 3, // 22.º, 23.º y 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [76, 95],
    budgetRangeEur: [18000000, 150000000],
  },
  {
    id: 'es_hypermotion',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 2,
    name: 'LaLiga Hypermotion',
    shortName: '2.ª División',
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff por la 3.ª plaza
    relegationDirect: 3, // 22.º al 24.º
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
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 4, // 21.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [58, 70],
    budgetRangeEur: [1500000, 4800000],
  },
  {
    id: 'es_segunda_rfef',
    country: 'Spain',
    countryNameEs: 'España',
    flag: '🇪🇸',
    tier: 4,
    name: 'Segunda Federación',
    shortName: '2.ª RFEF',
    totalTeams: 24,
    promotionDirect: 3, // 1.º, 2.º y 3.º
    promotionPlayoff: 4, // 4.º al 7.º playoff
    relegationDirect: 0, // En 4.ª división no hay descensos
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [46, 61],
    budgetRangeEur: [400000, 1200000],
  },

  // ==========================================
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 INGLATERRA (4 NIVELES DE 24 CLUBES)
  // ==========================================
  {
    id: 'en_premier',
    country: 'England',
    countryNameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    tier: 1,
    name: 'Premier League',
    shortName: 'Premier',
    totalTeams: 24,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 3, // 22.º, 23.º y 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [78, 96],
    budgetRangeEur: [30000000, 180000000],
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
    promotionPlayoff: 4, // 3.º al 6.º con final en Wembley
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
    promotionPlayoff: 4, // 3.º al 6.º
    relegationDirect: 4, // 21.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [58, 71],
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
    promotionPlayoff: 4, // 4.º al 7.º
    relegationDirect: 0, // En 4.ª división no hay descensos
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [48, 62],
    budgetRangeEur: [500000, 1500000],
  },

  // ==========================================
  // 🇩🇪 ALEMANIA (4 NIVELES DE 24 CLUBES)
  // ==========================================
  {
    id: 'de_bundesliga',
    country: 'Germany',
    countryNameEs: 'Alemania',
    flag: '🇩🇪',
    tier: 1,
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    totalTeams: 24,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 2, // 23.º y 24.º
    relegationPlayoff: 1, // 22.º Relegation ida/vuelta vs 3.º de 2.ª
    hasGroups: false,
    reputationRange: [76, 95],
    budgetRangeEur: [20000000, 140000000],
  },
  {
    id: 'de_2bundesliga',
    country: 'Germany',
    countryNameEs: 'Alemania',
    flag: '🇩🇪',
    tier: 2,
    name: '2. Bundesliga',
    shortName: '2. Bundesliga',
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 2, // 23.º y 24.º
    relegationPlayoff: 1, // 22.º a Relegation vs 3.º de 3. Liga
    hasGroups: false,
    reputationRange: [67, 77],
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
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 4, // 21.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [57, 69],
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
    totalTeams: 24,
    promotionDirect: 3, // 1.º, 2.º y 3.º
    promotionPlayoff: 4, // 4.º al 7.º playoff
    relegationDirect: 0, // En 4.ª división no hay descensos
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [46, 61],
    budgetRangeEur: [400000, 1300000],
  },

  // ==========================================
  // 🇮🇹 ITALIA (4 NIVELES DE 24 CLUBES)
  // ==========================================
  {
    id: 'it_serie_a',
    country: 'Italy',
    countryNameEs: 'Italia',
    flag: '🇮🇹',
    tier: 1,
    name: 'Serie A',
    shortName: 'Serie A',
    totalTeams: 24,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 3, // 22.º, 23.º y 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [76, 93],
    budgetRangeEur: [18000000, 130000000],
  },
  {
    id: 'it_serie_b',
    country: 'Italy',
    countryNameEs: 'Italia',
    flag: '🇮🇹',
    tier: 2,
    name: 'Serie B',
    shortName: 'Serie B',
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 3, // 22.º, 23.º y 24.º
    relegationPlayoff: 0,
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
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 4, // 21.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [56, 69],
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
    totalTeams: 24,
    promotionDirect: 3, // 1.º, 2.º y 3.º
    promotionPlayoff: 4, // 4.º al 7.º playoff
    relegationDirect: 0, // En 4.ª división no hay descensos
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [45, 60],
    budgetRangeEur: [350000, 1100000],
  },

  // ==========================================
  // 🇫🇷 FRANCIA (4 NIVELES DE 24 CLUBES)
  // ==========================================
  {
    id: 'fr_ligue_1',
    country: 'France',
    countryNameEs: 'Francia',
    flag: '🇫🇷',
    tier: 1,
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    totalTeams: 24,
    promotionDirect: 0,
    promotionPlayoff: 0,
    relegationDirect: 2, // 23.º y 24.º
    relegationPlayoff: 1, // 22.º al Barrage vs ganador de playoff Ligue 2
    hasGroups: false,
    reputationRange: [75, 94],
    budgetRangeEur: [16000000, 160000000],
  },
  {
    id: 'fr_ligue_2',
    country: 'France',
    countryNameEs: 'Francia',
    flag: '🇫🇷',
    tier: 2,
    name: 'Ligue 2',
    shortName: 'Ligue 2',
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 2, // 23.º y 24.º
    relegationPlayoff: 1, // 22.º al Barrage vs 3.º de National
    hasGroups: false,
    reputationRange: [65, 76],
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
    totalTeams: 24,
    promotionDirect: 2, // 1.º y 2.º
    promotionPlayoff: 4, // 3.º al 6.º playoff
    relegationDirect: 4, // 21.º al 24.º
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [55, 68],
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
    totalTeams: 24,
    promotionDirect: 3, // 1.º, 2.º y 3.º
    promotionPlayoff: 4, // 4.º al 7.º playoff
    relegationDirect: 0, // En 4.ª división no hay descensos
    relegationPlayoff: 0,
    hasGroups: false,
    reputationRange: [44, 59],
    budgetRangeEur: [350000, 1000000],
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
