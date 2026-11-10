import { CountryLeague, TierLevel, TrophyType } from '@/types/football-manager';

export interface TrophyDefinition {
  key: string;
  officialName: string;
  popularName?: string;
  competitionName: string;
  trophyType: TrophyType;
  country: CountryLeague | 'Europe';
  tier?: TierLevel;
  iconType: 'orejona' | 'copa_uefa' | 'conference' | 'ensaladera' | 'trofeo_liga' | 'copa_nacional' | 'trofeo_div';
  description: string;
  prestigeScore: number; // 1-100
  colorAccent: string;
}

export const TROPHIES_CATALOG: TrophyDefinition[] = [
  // ============================================================
  // 1. COMPETICIONES CONTINENTALES UEFA (FORMATO DE 36 EQUIPOS)
  // ============================================================
  {
    key: 'ucl',
    officialName: 'Copa de Clubes Campeones Europeos (Coupe des Clubs Champions Européens)',
    popularName: 'La Orejona',
    competitionName: 'UEFA Champions League',
    trophyType: 'ucl',
    country: 'Europe',
    iconType: 'orejona',
    description: 'El trofeo continental más prestigioso del fútbol mundial. Fase de liga de 36 equipos y eliminatorias.',
    prestigeScore: 100,
    colorAccent: '#001489',
  },
  {
    key: 'uel',
    officialName: 'Copa de la UEFA (UEFA Cup)',
    popularName: 'La Copa de la UEFA',
    competitionName: 'UEFA Europa League',
    trophyType: 'uel',
    country: 'Europe',
    iconType: 'copa_uefa',
    description: 'Histórico trofeo continental de plata esterlina sobre base de mármol amarillo. 36 clubes en liza.',
    prestigeScore: 88,
    colorAccent: '#f37021',
  },
  {
    key: 'uecl',
    officialName: 'Trofeo de la UEFA Conference League',
    popularName: 'Trofeo Conference League',
    competitionName: 'UEFA Conference League',
    trophyType: 'uecl',
    country: 'Europe',
    iconType: 'conference',
    description: 'Escultura de 32 espinas geométricas curvadas en bronce pulido y plata galvanizada.',
    prestigeScore: 78,
    colorAccent: '#00d66c',
  },

  // ============================================================
  // 2. INGLATERRA
  // ============================================================
  {
    key: 'en_premier_league',
    officialName: 'Premier League Trophy (Trofeo de la Premier League)',
    popularName: 'Trofeo Premier League',
    competitionName: 'Premier League',
    trophyType: 'league_t1',
    country: 'England',
    tier: 1,
    iconType: 'trofeo_liga',
    description: 'Corona dorada y leones heráldicos de plata esterlina que coronan al campeón de la liga inglesa.',
    prestigeScore: 96,
    colorAccent: '#38003c',
  },
  {
    key: 'en_fa_cup',
    officialName: 'The Football Association Challenge Cup (FA Cup)',
    popularName: 'La FA Cup',
    competitionName: 'FA Cup',
    trophyType: 'cup_main',
    country: 'England',
    iconType: 'copa_nacional',
    description: 'El torneo oficial de fútbol más antiguo del planeta (1871). Acceso directo a UEFA Europa League.',
    prestigeScore: 92,
    colorAccent: '#ff0037',
  },
  {
    key: 'en_efl_cup',
    officialName: 'EFL Cup Trophy (Copa de la Liga / Carabao Cup)',
    popularName: 'Carabao Cup',
    competitionName: 'EFL Cup',
    trophyType: 'cup_secondary',
    country: 'England',
    iconType: 'copa_nacional',
    description: 'Copa de tres asas creada en 1960. Otorga billete europeo a la UEFA Conference League.',
    prestigeScore: 82,
    colorAccent: '#00a651',
  },
  {
    key: 'en_championship',
    officialName: 'EFL Championship Trophy',
    popularName: 'Trofeo Championship',
    competitionName: 'EFL Championship',
    trophyType: 'league_t2',
    country: 'England',
    tier: 2,
    iconType: 'trofeo_div',
    description: 'El clásico trofeo que corona al campeón de la segunda categoría del fútbol inglés.',
    prestigeScore: 68,
    colorAccent: '#1b458f',
  },
  {
    key: 'en_league1',
    officialName: 'EFL League One Trophy',
    popularName: 'Trofeo League One',
    competitionName: 'EFL League One',
    trophyType: 'league_t3',
    country: 'England',
    tier: 3,
    iconType: 'trofeo_div',
    description: 'Trofeo al campeón de la 3.ª división profesional de Inglaterra.',
    prestigeScore: 56,
    colorAccent: '#0057b8',
  },
  {
    key: 'en_league2',
    officialName: 'EFL League Two Trophy',
    popularName: 'Trofeo League Two',
    competitionName: 'EFL League Two',
    trophyType: 'league_t4',
    country: 'England',
    tier: 4,
    iconType: 'trofeo_div',
    description: 'Trofeo al campeón de la 4.ª división profesional de Inglaterra.',
    prestigeScore: 48,
    colorAccent: '#7a263a',
  },

  // ============================================================
  // 3. ESPAÑA
  // ============================================================
  {
    key: 'es_laliga',
    officialName: 'Trofeo de Campeón de Primera División (Trofeo de LaLiga)',
    popularName: 'Trofeo de LaLiga',
    competitionName: 'LaLiga EA Sports',
    trophyType: 'league_t1',
    country: 'Spain',
    tier: 1,
    iconType: 'trofeo_liga',
    description: 'El trofeo histórico que acredita al campeón de Primera División de España.',
    prestigeScore: 95,
    colorAccent: '#ff4655',
  },
  {
    key: 'es_copa_del_rey',
    officialName: 'Copa de Su Majestad el Rey (Copa del Rey / Campeonato de España)',
    popularName: 'La Copa del Rey',
    competitionName: 'Copa del Rey',
    trophyType: 'cup_main',
    country: 'Spain',
    iconType: 'copa_nacional',
    description: 'El torneo decano del fútbol español. Otorga billete directo a la fase de liga de UEFA Europa League.',
    prestigeScore: 91,
    colorAccent: '#ffc400',
  },
  {
    key: 'es_hypermotion',
    officialName: 'Trofeo de Campeón de Segunda División (LaLiga Hypermotion)',
    popularName: 'Trofeo Hypermotion',
    competitionName: 'LaLiga Hypermotion',
    trophyType: 'league_t2',
    country: 'Spain',
    tier: 2,
    iconType: 'trofeo_div',
    description: 'Copa que corona al campeón de la categoría de plata del fútbol español.',
    prestigeScore: 68,
    colorAccent: '#002f6c',
  },
  {
    key: 'es_primera_rfef',
    officialName: 'Trofeo de Campeón de Primera Federación (1.ª RFEF)',
    popularName: 'Trofeo 1.ª RFEF',
    competitionName: 'Primera Federación',
    trophyType: 'league_t3',
    country: 'Spain',
    tier: 3,
    iconType: 'trofeo_div',
    description: 'Trofeo de campeón de la 3.ª categoría nacional española.',
    prestigeScore: 56,
    colorAccent: '#d62626',
  },
  {
    key: 'es_segunda_rfef',
    officialName: 'Trofeo de Campeón de Segunda Federación (2.ª RFEF)',
    popularName: 'Trofeo 2.ª RFEF',
    competitionName: 'Segunda Federación',
    trophyType: 'league_t4',
    country: 'Spain',
    tier: 4,
    iconType: 'trofeo_div',
    description: 'Trofeo que premia al campeón de Segunda Federación.',
    prestigeScore: 48,
    colorAccent: '#008542',
  },

  // ============================================================
  // 4. ITALIA
  // ============================================================
  {
    key: 'it_seriea',
    officialName: 'Coppa Campioni d’Italia (asociada al "Scudetto")',
    popularName: 'Il Scudetto',
    competitionName: 'Serie A',
    trophyType: 'league_t1',
    country: 'Italy',
    tier: 1,
    iconType: 'trofeo_liga',
    description: 'La copa cónica dorada diseñada en 1960 que premia al poseedor del Scudetto italiano.',
    prestigeScore: 94,
    colorAccent: '#008fd7',
  },
  {
    key: 'it_coppa_italia',
    officialName: 'Trofeo Coppa Italia',
    popularName: 'La Coppa Italia',
    competitionName: 'Coppa Italia',
    trophyType: 'cup_main',
    country: 'Italy',
    iconType: 'copa_nacional',
    description: 'Copa de oro y tricolor italiano. Acceso directo a UEFA Europa League.',
    prestigeScore: 90,
    colorAccent: '#009246',
  },
  {
    key: 'it_serieb',
    officialName: 'Coppa Ali della Vittoria (Serie B)',
    popularName: 'Coppa Serie B',
    competitionName: 'Serie B',
    trophyType: 'league_t2',
    country: 'Italy',
    tier: 2,
    iconType: 'trofeo_div',
    description: 'Escultura con alas que corona al vencedor de la Serie B italiana.',
    prestigeScore: 68,
    colorAccent: '#005ba6',
  },
  {
    key: 'it_seriec',
    officialName: 'Trofeo Serie C',
    popularName: 'Trofeo Serie C',
    competitionName: 'Serie C',
    trophyType: 'league_t3',
    country: 'Italy',
    tier: 3,
    iconType: 'trofeo_div',
    description: 'Trofeo al campeón de la 3.ª división italiana.',
    prestigeScore: 56,
    colorAccent: '#d4001f',
  },
  {
    key: 'it_seried',
    officialName: 'Scudetto Serie D',
    popularName: 'Scudetto Serie D',
    competitionName: 'Serie D',
    trophyType: 'league_t4',
    country: 'Italy',
    tier: 4,
    iconType: 'trofeo_div',
    description: 'Trofeo de campeón de la máxima categoría interregional amateur italiana.',
    prestigeScore: 48,
    colorAccent: '#241f20',
  },

  // ============================================================
  // 5. ALEMANIA
  // ============================================================
  {
    key: 'de_bundesliga',
    officialName: 'Meisterschale (popularmente "La Ensaladera de Campeón")',
    popularName: 'La Ensaladera (Meisterschale)',
    competitionName: 'Bundesliga',
    trophyType: 'league_t1',
    country: 'Germany',
    tier: 1,
    iconType: 'ensaladera',
    description: 'El legendario plato circular de plata maciza con 16 gemas de turmalina creado en 1949.',
    prestigeScore: 95,
    colorAccent: '#d20515',
  },
  {
    key: 'de_dfb_pokal',
    officialName: 'DFB-Pokal-Trophäe (Trofeo de la Copa de Alemania)',
    popularName: 'DFB-Pokal',
    competitionName: 'DFB-Pokal',
    trophyType: 'cup_main',
    country: 'Germany',
    iconType: 'copa_nacional',
    description: 'Trofeo bañado en oro con doce turmalinas y gemas preciosas. Otorga cupo a UEFA Europa League.',
    prestigeScore: 91,
    colorAccent: '#008542',
  },
  {
    key: 'de_bundesliga2',
    officialName: 'Meisterschale 2. Bundesliga',
    popularName: 'Ensaladera 2. Bundesliga',
    competitionName: '2. Bundesliga',
    trophyType: 'league_t2',
    country: 'Germany',
    tier: 2,
    iconType: 'ensaladera',
    description: 'Plato de plata que distingue al campeón de la 2.ª Bundesliga alemana.',
    prestigeScore: 68,
    colorAccent: '#002f6c',
  },
  {
    key: 'de_3liga',
    officialName: 'Meistertrophäe 3. Liga',
    popularName: 'Trofeo 3. Liga',
    competitionName: '3. Liga',
    trophyType: 'league_t3',
    country: 'Germany',
    tier: 3,
    iconType: 'trofeo_div',
    description: 'Trofeo moderno de plata al campeón de la 3. Liga.',
    prestigeScore: 56,
    colorAccent: '#e30613',
  },
  {
    key: 'de_regionalliga',
    officialName: 'Regionalliga Meisterpokal',
    popularName: 'Pokal Regionalliga',
    competitionName: 'Regionalliga',
    trophyType: 'league_t4',
    country: 'Germany',
    tier: 4,
    iconType: 'trofeo_div',
    description: 'Copa al campeón de la división regional alemana.',
    prestigeScore: 48,
    colorAccent: '#231f20',
  },

  // ============================================================
  // 6. FRANCIA
  // ============================================================
  {
    key: 'fr_ligue1',
    officialName: 'Trophée de la Ligue 1 (anteriormente llamado "Hexagoal")',
    popularName: 'Hexagoal (Trophée Ligue 1)',
    competitionName: 'Ligue 1',
    trophyType: 'league_t1',
    country: 'France',
    tier: 1,
    iconType: 'trofeo_liga',
    description: 'Pieza de diseño hexagonal en bronce y plata creada por el artista Pablo Reinoso.',
    prestigeScore: 93,
    colorAccent: '#091c3e',
  },
  {
    key: 'fr_coupe_de_france',
    officialName: 'Coupe Charles-Simon (Trofeo de la Coupe de France)',
    popularName: 'Coupe de France',
    competitionName: 'Coupe de France',
    trophyType: 'cup_main',
    country: 'France',
    iconType: 'copa_nacional',
    description: 'Copa clásica de plata de dos asas en homenaje al héroe Charles Simon. Pase directo a UEFA Europa League.',
    prestigeScore: 90,
    colorAccent: '#0055a5',
  },
  {
    key: 'fr_ligue2',
    officialName: 'Trophée de la Ligue 2',
    popularName: 'Trophée Ligue 2',
    competitionName: 'Ligue 2',
    trophyType: 'league_t2',
    country: 'France',
    tier: 2,
    iconType: 'trofeo_div',
    description: 'Trofeo que acredita al campeón de la Ligue 2 francesa.',
    prestigeScore: 68,
    colorAccent: '#132257',
  },
  {
    key: 'fr_national',
    officialName: 'Trophée Championnat National',
    popularName: 'Trophée National',
    competitionName: 'Championnat National',
    trophyType: 'league_t3',
    country: 'France',
    tier: 3,
    iconType: 'trofeo_div',
    description: 'Trofeo que corona al líder de la 3.ª categoría del fútbol francés.',
    prestigeScore: 56,
    colorAccent: '#003399',
  },
  {
    key: 'fr_national2',
    officialName: 'Trophée National 2',
    popularName: 'Trophée National 2',
    competitionName: 'National 2',
    trophyType: 'league_t4',
    country: 'France',
    tier: 4,
    iconType: 'trofeo_div',
    description: 'Trofeo al campeón de la 4.ª división francesa.',
    prestigeScore: 48,
    colorAccent: '#cc0000',
  },
];

/**
 * Obtiene la definición de trofeo según la división y país
 */
export function getTrophyForDivision(country: CountryLeague, tier: TierLevel): TrophyDefinition {
  const match = TROPHIES_CATALOG.find((t) => t.country === country && t.tier === tier);
  if (match) return match;

  // Fallback a trofeos genéricos de tier
  return (
    TROPHIES_CATALOG.find((t) => t.country === 'Spain' && t.tier === tier) ||
    TROPHIES_CATALOG[3]
  );
}

/**
 * Obtiene el trofeo de copa nacional para un país
 */
export function getTrophyForCup(country: CountryLeague, isSecondary?: boolean): TrophyDefinition {
  if (isSecondary && country === 'England') {
    return TROPHIES_CATALOG.find((t) => t.key === 'en_efl_cup')!;
  }
  return (
    TROPHIES_CATALOG.find((t) => t.country === country && t.trophyType === 'cup_main') ||
    TROPHIES_CATALOG.find((t) => t.key === 'es_copa_del_rey')!
  );
}

/**
 * Obtiene la definición para un torneo continental UEFA
 */
export function getTrophyForUefa(type: 'ucl' | 'uel' | 'uecl'): TrophyDefinition {
  return TROPHIES_CATALOG.find((t) => t.key === type) || TROPHIES_CATALOG[0];
}
