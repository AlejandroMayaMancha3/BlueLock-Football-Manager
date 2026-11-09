import { Club, Player, Position, Formation, CountryLeague, Weapon } from '@/types/football-manager';
import { calculateOvr } from '@/engine/game-data';

export interface ClubTemplate {
  id: string;
  name: string;
  shortName: string;
  country: CountryLeague;
  divisionId: string;
  tier: 1 | 2 | 3 | 4;
  groupId?: string;
  reputation: number;     // 1-100
  level: number;          // 40-95
  budgetEur: number;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  ticketPriceEur: number;
  formation: Formation;
  starPlayers?: {
    name: string;
    position: Position;
    overall: number;
    potential: number;
    weaponName?: string;
    weaponType?: 'striker' | 'vision' | 'speed' | 'physical' | 'gk' | 'dribble' | 'defense';
    isBlueLock?: boolean;
    realRef?: string;
  }[];
}

// Factor de conversión EUR -> YEN (1 EUR = 160 JPY)
export const EUR_TO_YEN = 160;

export const CLUBS_MASTER_CATALOG: ClubTemplate[] = [
  // ==========================================
  // 🇪🇸 ESPAÑA - 1.ª DIVISIÓN (LALIGA EA SPORTS)
  // ==========================================
  {
    id: 'es_barcha',
    name: 'FC Barcha',
    shortName: 'BAR',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 92,
    level: 87,
    budgetEur: 95000000,
    primaryColor: '#a50044',
    secondaryColor: '#004d98',
    stadiumName: 'Camp Nou Barcha',
    stadiumCapacity: 85000,
    ticketPriceEur: 65,
    formation: '4-3-3',
    starPlayers: [
      { name: 'Lavinho', position: 'ED', overall: 93, potential: 93, weaponName: 'Dancing Dribbler Master', weaponType: 'dribble', isBlueLock: true },
      { name: 'Meguru Bachira', position: 'EI', overall: 86, potential: 93, weaponName: 'Monster Trance & Jingling Dribble', weaponType: 'dribble', isBlueLock: true },
      { name: 'Yamal Lamine', position: 'ED', overall: 88, potential: 95, weaponName: 'Golden Left Arch', weaponType: 'dribble', realRef: 'Lamine Yamal' },
      { name: 'R. Lewangoalski', position: 'DC', overall: 89, potential: 89, weaponName: 'Clinical Poacher Reflex', weaponType: 'striker', realRef: 'Robert Lewandowski' },
      { name: 'Pedri Gonz', position: 'MC', overall: 87, potential: 92, weaponName: 'Silky Meta-Vision', weaponType: 'vision', realRef: 'Pedri' },
      { name: 'Eita Otoya', position: 'ED', overall: 83, potential: 88, weaponName: 'Ninja Shadow Infiltration', weaponType: 'speed', isBlueLock: true },
    ],
  },
  {
    id: 'es_inbers',
    name: 'Real Inbers',
    shortName: 'REI',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 95,
    level: 89,
    budgetEur: 125000000,
    primaryColor: '#ffffff',
    secondaryColor: '#e0b238',
    stadiumName: 'Santiago Inbers Arena',
    stadiumCapacity: 81000,
    ticketPriceEur: 70,
    formation: '4-3-3',
    starPlayers: [
      { name: 'Leonardo Luna', position: 'DC', overall: 93, potential: 93, weaponName: 'Spanish Heavy Artillery', weaponType: 'striker', isBlueLock: true },
      { name: 'Sae Itoshi', position: 'MCO', overall: 87, potential: 94, weaponName: 'Beautiful Destruction & Meta-Vision', weaponType: 'vision', isBlueLock: true },
      { name: 'V. Junior', position: 'EI', overall: 91, potential: 94, weaponName: 'Samba Electric Step', weaponType: 'speed', realRef: 'Vinicius Jr.' },
      { name: 'J. Bellingham', position: 'MCO', overall: 90, potential: 94, weaponName: 'Clutch Ghost Run', weaponType: 'physical', realRef: 'Jude Bellingham' },
      { name: 'L. Modrich', position: 'MC', overall: 86, potential: 86, weaponName: 'Trivela God Vision', weaponType: 'vision', realRef: 'Luka Modric' },
      { name: 'F. Valverde', position: 'MC', overall: 89, potential: 91, weaponName: 'Falcon Cannon Stride', weaponType: 'physical', realRef: 'Fede Valverde' },
    ],
  },
  {
    id: 'es_atletico',
    name: 'Athletico Metropol',
    shortName: 'ATM',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 88,
    level: 84,
    budgetEur: 70000000,
    primaryColor: '#cb3524',
    secondaryColor: '#ffffff',
    stadiumName: 'Cívitas Metropol',
    stadiumCapacity: 70000,
    ticketPriceEur: 55,
    formation: '5-3-2',
    starPlayers: [
      { name: 'A. Griezman', position: 'DC', overall: 88, potential: 88, weaponName: 'Total Pitch Chessmaster', weaponType: 'vision', realRef: 'Antoine Griezmann' },
      { name: 'J. Alvarez', position: 'DC', overall: 86, potential: 91, weaponName: 'Spider Press & Venom Strike', weaponType: 'striker', realRef: 'Julián Álvarez' },
      { name: 'J. Oblak', position: 'POR', overall: 88, potential: 88, weaponName: 'Iron Wall Reflexes', weaponType: 'gk', realRef: 'Jan Oblak' },
    ],
  },
  {
    id: 'es_batis',
    name: 'Real Batis Balompié',
    shortName: 'BAT',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 80,
    level: 79,
    budgetEur: 16000000,
    primaryColor: '#009540',
    secondaryColor: '#ffffff',
    stadiumName: 'Benito Villamarín Batis',
    stadiumCapacity: 60000,
    ticketPriceEur: 42,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'Isco Alarcon', position: 'MCO', overall: 84, potential: 84, weaponName: 'Andalusian Magic Pirouette', weaponType: 'dribble', realRef: 'Isco' },
      { name: 'N. Fekir', position: 'MCO', overall: 82, potential: 82, weaponName: 'Bulldozer Shield Dribble', weaponType: 'physical', realRef: 'Nabil Fekir' },
    ],
  },
  {
    id: 'es_sevilya',
    name: 'Sevilya FC',
    shortName: 'SEV',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 81,
    level: 78,
    budgetEur: 18000000,
    primaryColor: '#ffffff',
    secondaryColor: '#d4001f',
    stadiumName: 'Ramón Sánchez Sevilya',
    stadiumCapacity: 43000,
    ticketPriceEur: 44,
    formation: '4-3-3',
    starPlayers: [
      { name: 'J. Navas', position: 'LD', overall: 80, potential: 80, weaponName: 'Endless Flank Cross', weaponType: 'speed', realRef: 'Jesús Navas' },
      { name: 'L. Ocampos', position: 'EI', overall: 81, potential: 81, weaponName: 'Viking Charge', weaponType: 'physical', realRef: 'Lucas Ocampos' },
    ],
  },
  {
    id: 'es_valenc',
    name: 'Valen-C CF',
    shortName: 'VAL',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 79,
    level: 77,
    budgetEur: 14000000,
    primaryColor: '#ffffff',
    secondaryColor: '#ff7300',
    stadiumName: 'Mestalla Turia Arena',
    stadiumCapacity: 49000,
    ticketPriceEur: 40,
    formation: '4-4-2',
    starPlayers: [
      { name: 'J. Guerra', position: 'MC', overall: 81, potential: 87, weaponName: 'Che Power Box-to-Box', weaponType: 'physical', realRef: 'Javi Guerra' },
      { name: 'Diego Lopez', position: 'ED', overall: 79, potential: 85, weaponName: 'Guanche Sprint', weaponType: 'speed', realRef: 'Diego López' },
    ],
  },
  {
    id: 'es_athletic',
    name: 'Athletic Leoi',
    shortName: 'ATH',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 83,
    level: 81,
    budgetEur: 28000000,
    primaryColor: '#ee2524',
    secondaryColor: '#000000',
    stadiumName: 'San Mamés Leoi',
    stadiumCapacity: 53000,
    ticketPriceEur: 46,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'Nico Willians', position: 'EI', overall: 85, potential: 91, weaponName: 'Lightning Flash Step', weaponType: 'speed', realRef: 'Nico Williams' },
      { name: 'I. Williams', position: 'ED', overall: 83, potential: 83, weaponName: 'Basque Iron Cheetah', weaponType: 'speed', realRef: 'Iñaki Williams' },
      { name: 'O. Sancet', position: 'MCO', overall: 82, potential: 86, weaponName: 'Tower Vision Volley', weaponType: 'striker', realRef: 'Oihan Sancet' },
    ],
  },
  {
    id: 'es_sociedad',
    name: 'Sociedad Donosti',
    shortName: 'RSO',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 84,
    level: 82,
    budgetEur: 26000000,
    primaryColor: '#0067b1',
    secondaryColor: '#ffffff',
    stadiumName: 'Reale Donosti Arena',
    stadiumCapacity: 39000,
    ticketPriceEur: 45,
    formation: '4-3-3',
    starPlayers: [
      { name: 'T. Kubo', position: 'ED', overall: 84, potential: 89, weaponName: 'Samurai Razor Cut', weaponType: 'dribble', realRef: 'Takefusa Kubo' },
      { name: 'M. Oyarzabal', position: 'DC', overall: 83, potential: 84, weaponName: 'Heart of Guipúzcoa', weaponType: 'striker', realRef: 'Mikel Oyarzabal' },
    ],
  },
  {
    id: 'es_villargro',
    name: 'Villar-gro Sub',
    shortName: 'VIL',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 82,
    level: 80,
    budgetEur: 22000000,
    primaryColor: '#ffe600',
    secondaryColor: '#00519e',
    stadiumName: 'Estadio Cerámica Sub',
    stadiumCapacity: 23500,
    ticketPriceEur: 38,
    formation: '4-4-2',
    starPlayers: [
      { name: 'A. Baena', position: 'MI', overall: 83, potential: 88, weaponName: 'Curved Golden Needle', weaponType: 'vision', realRef: 'Álex Baena' },
      { name: 'G. Moreno', position: 'DC', overall: 83, potential: 83, weaponName: 'Catalan Precision Volley', weaponType: 'striker', realRef: 'Gerard Moreno' },
    ],
  },
  {
    id: 'es_girona',
    name: 'Girona Blanc-Vermell',
    shortName: 'GIR',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 81,
    level: 80,
    budgetEur: 20000000,
    primaryColor: '#d71920',
    secondaryColor: '#ffffff',
    stadiumName: 'Montilivi Arena',
    stadiumCapacity: 14500,
    ticketPriceEur: 40,
    formation: '4-3-3',
    starPlayers: [
      { name: 'V. Tsygankov', position: 'ED', overall: 82, potential: 85, weaponName: 'Carpathian Arc Shot', weaponType: 'striker', realRef: 'Viktor Tsygankov' },
      { name: 'Y. Herrera', position: 'MC', overall: 81, potential: 83, weaponName: 'Granite Anchor', weaponType: 'physical', realRef: 'Yangel Herrera' },
    ],
  },
  {
    id: 'es_celta',
    name: 'Celta Celeste',
    shortName: 'CEL',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 77,
    level: 76,
    budgetEur: 12000000,
    primaryColor: '#8ac3ee',
    secondaryColor: '#ffffff',
    stadiumName: 'Balaídos Celeste',
    stadiumCapacity: 24500,
    ticketPriceEur: 35,
    formation: '3-5-2',
    starPlayers: [
      { name: 'I. Aspas', position: 'DC', overall: 83, potential: 83, weaponName: 'Prince of the Rías', weaponType: 'striker', realRef: 'Iago Aspas' },
    ],
  },
  {
    id: 'es_mallorca',
    name: 'Mallorca Bermellón',
    shortName: 'MLL',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 76,
    level: 75,
    budgetEur: 11000000,
    primaryColor: '#e20613',
    secondaryColor: '#000000',
    stadiumName: 'Son Moix Bermellón',
    stadiumCapacity: 23000,
    ticketPriceEur: 35,
    formation: '5-3-2',
    starPlayers: [
      { name: 'V. Muriqi', position: 'DC', overall: 81, potential: 81, weaponName: 'Balkan Pirate Header', weaponType: 'physical', realRef: 'Vedat Muriqi' },
    ],
  },
  {
    id: 'es_osasuna',
    name: 'Osasuna Gorri',
    shortName: 'OSA',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 77,
    level: 76,
    budgetEur: 11500000,
    primaryColor: '#c8102e',
    secondaryColor: '#0a1c2a',
    stadiumName: 'El Sadar Gorri',
    stadiumCapacity: 23500,
    ticketPriceEur: 36,
    formation: '4-3-3',
  },
  {
    id: 'es_getafe',
    name: 'Getafe Azules',
    shortName: 'GET',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 76,
    level: 75,
    budgetEur: 10000000,
    primaryColor: '#005ba9',
    secondaryColor: '#ffffff',
    stadiumName: 'Coliseum Getafe',
    stadiumCapacity: 16500,
    ticketPriceEur: 34,
    formation: '4-4-2',
  },
  {
    id: 'es_rayo',
    name: 'Rayo Vallecas',
    shortName: 'RAY',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 76,
    level: 75,
    budgetEur: 10500000,
    primaryColor: '#ffffff',
    secondaryColor: '#e20613',
    stadiumName: 'Campo de Vallecas',
    stadiumCapacity: 14700,
    ticketPriceEur: 35,
    formation: '4-2-3-1',
  },
  {
    id: 'es_laspalmas',
    name: 'Las Palmas Amarillos',
    shortName: 'LPA',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 75,
    level: 74,
    budgetEur: 9500000,
    primaryColor: '#ffdd00',
    secondaryColor: '#004d98',
    stadiumName: 'Estadio Gran Canaria',
    stadiumCapacity: 32400,
    ticketPriceEur: 32,
    formation: '4-3-3',
    starPlayers: [
      { name: 'A. Moleiro', position: 'MCO', overall: 80, potential: 86, weaponName: 'Tenerife Juggling Feint', weaponType: 'dribble', realRef: 'Alberto Moleiro' },
    ],
  },
  {
    id: 'es_alaves',
    name: 'Babazorros Alavés',
    shortName: 'ALA',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 75,
    level: 74,
    budgetEur: 9000000,
    primaryColor: '#005bac',
    secondaryColor: '#ffffff',
    stadiumName: 'Mendizorroza Arena',
    stadiumCapacity: 19800,
    ticketPriceEur: 32,
    formation: '4-2-3-1',
  },
  {
    id: 'es_espanyol',
    name: 'Espanyol Pericos',
    shortName: 'ESP',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 76,
    level: 75,
    budgetEur: 10000000,
    primaryColor: '#007bc4',
    secondaryColor: '#ffffff',
    stadiumName: 'Stage Front Pericos',
    stadiumCapacity: 40000,
    ticketPriceEur: 34,
    formation: '4-4-2',
  },
  {
    id: 'es_valladolid',
    name: 'Valladolid Pucela',
    shortName: 'VLL',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 75,
    level: 74,
    budgetEur: 9200000,
    primaryColor: '#5b2c86',
    secondaryColor: '#ffffff',
    stadiumName: 'José Zorrilla Pucela',
    stadiumCapacity: 27600,
    ticketPriceEur: 32,
    formation: '4-3-3',
  },
  {
    id: 'es_leganes',
    name: 'Leganés Pepineros',
    shortName: 'LEG',
    country: 'Spain',
    divisionId: 'es_laliga',
    tier: 1,
    reputation: 74,
    level: 73,
    budgetEur: 8500000,
    primaryColor: '#0055a5',
    secondaryColor: '#ffffff',
    stadiumName: 'Butarque Pepinero',
    stadiumCapacity: 12450,
    ticketPriceEur: 30,
    formation: '5-3-2',
  },

  // ==========================================
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 INGLATERRA - 1.ª DIVISIÓN (PREMIER LEAGUE)
  // ==========================================
  {
    id: 'en_manshine',
    name: 'Manshine City',
    shortName: 'MNC',
    country: 'England',
    divisionId: 'en_premier',
    tier: 1,
    reputation: 96,
    level: 90,
    budgetEur: 160000000,
    primaryColor: '#6cabdd',
    secondaryColor: '#ffffff',
    stadiumName: 'Etihad Manshine Arena',
    stadiumCapacity: 55000,
    ticketPriceEur: 75,
    formation: '4-3-3',
    starPlayers: [
      { name: 'Chris Prince', position: 'DC', overall: 94, potential: 94, weaponName: 'Perfect Physical Specimen Master', weaponType: 'physical', isBlueLock: true },
      { name: 'Chigiri Hyoma', position: 'CAD', overall: 86, potential: 93, weaponName: '44 Panther Snipe & Mach Speed', weaponType: 'speed', isBlueLock: true },
      { name: 'Nagi Seishiro', position: 'DC', overall: 87, potential: 95, weaponName: 'Black Hole Zero-Gravity Trap', weaponType: 'dribble', isBlueLock: true },
      { name: 'Reo Mikage', position: 'MC', overall: 85, potential: 92, weaponName: 'Chameleon 99% Metamorphosis', weaponType: 'vision', isBlueLock: true },
      { name: 'E. Halland', position: 'DC', overall: 91, potential: 94, weaponName: 'Nordic Monster Breaker', weaponType: 'striker', realRef: 'Erling Haaland' },
      { name: 'K. De Bruyn', position: 'MC', overall: 90, potential: 90, weaponName: 'Laser Trajectory Compass', weaponType: 'vision', realRef: 'Kevin De Bruyne' },
    ],
  },
  {
    id: 'en_barsenal',
    name: 'Barsenal',
    shortName: 'BAR',
    country: 'England',
    divisionId: 'en_premier',
    tier: 1,
    reputation: 92,
    level: 87,
    budgetEur: 110000000,
    primaryColor: '#ef0107',
    secondaryColor: '#ffffff',
    stadiumName: 'Ashburton Barsenal Grove',
    stadiumCapacity: 60700,
    ticketPriceEur: 70,
    formation: '4-3-3',
    starPlayers: [
      { name: 'B. Saka', position: 'ED', overall: 88, potential: 92, weaponName: 'London Starboy Cut', weaponType: 'dribble', realRef: 'Bukayo Saka' },
      { name: 'M. Odegaard', position: 'MCO', overall: 88, potential: 91, weaponName: 'Nordic Maestro Baton', weaponType: 'vision', realRef: 'Martin Ødegaard' },
      { name: 'D. Rice', position: 'MCD', overall: 87, potential: 90, weaponName: 'Thames Iron Anchor', weaponType: 'defense', realRef: 'Declan Rice' },
    ],
  },
  {
    id: 'en_liverpooh',
    name: 'Liver Pooh',
    shortName: 'LIV',
    country: 'England',
    divisionId: 'en_premier',
    tier: 1,
    reputation: 93,
    level: 88,
    budgetEur: 120000000,
    primaryColor: '#c8102e',
    secondaryColor: '#00b2a9',
    stadiumName: 'Anfield Pooh Fortress',
    stadiumCapacity: 61000,
    ticketPriceEur: 72,
    formation: '4-3-3',
    starPlayers: [
      { name: 'M. Salah', position: 'ED', overall: 89, potential: 89, weaponName: 'Pharaoh Vortex Curling', weaponType: 'striker', realRef: 'Mohamed Salah' },
      { name: 'V. Van Dijk', position: 'DFC', overall: 89, potential: 89, weaponName: 'Immovable Colossus Field', weaponType: 'defense', realRef: 'Virgil van Dijk' },
      { name: 'Alexander-Arn', position: 'LD', overall: 86, potential: 89, weaponName: 'Diagonal Guided Missile', weaponType: 'vision', realRef: 'Trent Alexander-Arnold' },
    ],
  },
  {
    id: 'en_chelc',
    name: 'Chel-C London',
    shortName: 'CHE',
    country: 'England',
    divisionId: 'en_premier',
    tier: 1,
    reputation: 89,
    level: 84,
    budgetEur: 90000000,
    primaryColor: '#034694',
    secondaryColor: '#ffffff',
    stadiumName: 'Stamford Bridge Chel-C',
    stadiumCapacity: 40300,
    ticketPriceEur: 68,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'Cole Palmar', position: 'MCO', overall: 86, potential: 92, weaponName: 'Cold Sub-Zero Precision', weaponType: 'vision', realRef: 'Cole Palmer' },
      { name: 'Enzo Fern', position: 'MC', overall: 84, potential: 88, weaponName: 'Pampa Architect Vision', weaponType: 'vision', realRef: 'Enzo Fernández' },
    ],
  },
  {
    id: 'en_manchestred',
    name: 'Manchest-Red Devils',
    shortName: 'MUN',
    country: 'England',
    divisionId: 'en_premier',
    tier: 1,
    reputation: 90,
    level: 83,
    budgetEur: 85000000,
    primaryColor: '#da291c',
    secondaryColor: '#000000',
    stadiumName: 'Old Devils Theatre',
    stadiumCapacity: 74300,
    ticketPriceEur: 65,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'B. Fernandes', position: 'MCO', overall: 87, potential: 87, weaponName: 'Iberian Through-Ball Cannon', weaponType: 'vision', realRef: 'Bruno Fernandes' },
      { name: 'K. Mainoo', position: 'MC', overall: 80, potential: 89, weaponName: 'Silky Composure Glide', weaponType: 'dribble', realRef: 'Kobbie Mainoo' },
    ],
  },

  // ==========================================
  // 🇩🇪 ALEMANIA - 1.ª DIVISIÓN (BUNDESLIGA)
  // ==========================================
  {
    id: 'de_bastard',
    name: 'Bastard München',
    shortName: 'BMU',
    country: 'Germany',
    divisionId: 'de_bundesliga',
    tier: 1,
    reputation: 95,
    level: 89,
    budgetEur: 130000000,
    primaryColor: '#c8102e',
    secondaryColor: '#1d252d',
    stadiumName: 'Allianz Bastard Arena',
    stadiumCapacity: 75000,
    ticketPriceEur: 68,
    formation: '4-3-3',
    starPlayers: [
      { name: 'Noel Noa', position: 'DC', overall: 94, potential: 94, weaponName: 'World Best Dual-Footed Machine', weaponType: 'striker', isBlueLock: true },
      { name: 'Michael Kaiser', position: 'DC', overall: 89, potential: 95, weaponName: 'Kaiser Impact God Velocity', weaponType: 'striker', isBlueLock: true },
      { name: 'Alexis Ness', position: 'MC', overall: 84, potential: 90, weaponName: 'Magic Dribble & Synchronous Pass', weaponType: 'vision', isBlueLock: true },
      { name: 'Yoichi Isagi', position: 'MCO', overall: 88, potential: 96, weaponName: 'Meta-Vision & Two-Gun Volley', weaponType: 'striker', isBlueLock: true },
      { name: 'Rensuke Kunigami', position: 'DC', overall: 86, potential: 91, weaponName: 'Wild Card Ambipodal Power Knuckle', weaponType: 'physical', isBlueLock: true },
      { name: 'Gin Gagamaru', position: 'POR', overall: 85, potential: 90, weaponName: 'Wild Beast Scorpion Saves', weaponType: 'gk', isBlueLock: true },
      { name: 'H. Cane', position: 'DC', overall: 90, potential: 90, weaponName: 'English Golden Pivot Cannon', weaponType: 'striker', realRef: 'Harry Kane' },
      { name: 'J. Musiala', position: 'MCO', overall: 88, potential: 93, weaponName: 'Bavarian Bambi Slalom', weaponType: 'dribble', realRef: 'Jamal Musiala' },
    ],
  },
  {
    id: 'de_berserk',
    name: 'Berserk Dortmund',
    shortName: 'BVB',
    country: 'Germany',
    divisionId: 'de_bundesliga',
    tier: 1,
    reputation: 88,
    level: 83,
    budgetEur: 75000000,
    primaryColor: '#fde100',
    secondaryColor: '#000000',
    stadiumName: 'Signal Berserk Wall',
    stadiumCapacity: 81365,
    ticketPriceEur: 55,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'J. Brandt', position: 'MCO', overall: 85, potential: 86, weaponName: 'Westphalian Velvet Touch', weaponType: 'vision', realRef: 'Julian Brandt' },
      { name: 'K. Adeyemi', position: 'EI', overall: 82, potential: 87, weaponName: 'Sonic Jet Afterburner', weaponType: 'speed', realRef: 'Karim Adeyemi' },
    ],
  },
  {
    id: 'de_bayer',
    name: 'Bayer Werkself',
    shortName: 'B04',
    country: 'Germany',
    divisionId: 'de_bundesliga',
    tier: 1,
    reputation: 90,
    level: 86,
    budgetEur: 85000000,
    primaryColor: '#e32221',
    secondaryColor: '#000000',
    stadiumName: 'BayArena Werkself',
    stadiumCapacity: 30210,
    ticketPriceEur: 58,
    formation: '3-5-2',
    starPlayers: [
      { name: 'F. Wirtz', position: 'MCO', overall: 88, potential: 94, weaponName: 'Rhineland Diamond Meta-Dribble', weaponType: 'vision', realRef: 'Florian Wirtz' },
      { name: 'J. Frimpong', position: 'CAD', overall: 85, potential: 89, weaponName: 'Wingback Hyperdrive', weaponType: 'speed', realRef: 'Jeremie Frimpong' },
      { name: 'G. Xhaka', position: 'MC', overall: 86, potential: 86, weaponName: 'Alpine Commander Long-Ball', weaponType: 'vision', realRef: 'Granit Xhaka' },
    ],
  },

  // ==========================================
  // 🇮🇹 ITALIA - 1.ª DIVISIÓN (SERIE A)
  // ==========================================
  {
    id: 'it_ubers',
    name: 'Ubers',
    shortName: 'UBE',
    country: 'Italy',
    divisionId: 'it_serie_a',
    tier: 1,
    reputation: 91,
    level: 87,
    budgetEur: 90000000,
    primaryColor: '#ffffff',
    secondaryColor: '#111111',
    stadiumName: 'Allianz Ubers Arena',
    stadiumCapacity: 41507,
    ticketPriceEur: 62,
    formation: '3-5-2',
    starPlayers: [
      { name: 'Marc Snuffy', position: 'DC', overall: 93, potential: 93, weaponName: 'Tactical Grandmaster of Europe', weaponType: 'vision', isBlueLock: true },
      { name: 'Don Lorenzo', position: 'DFC', overall: 88, potential: 94, weaponName: 'Zombie Defense & Dead-Leg Steal', weaponType: 'defense', isBlueLock: true },
      { name: 'Oliver Aiku', position: 'DFC', overall: 85, potential: 91, weaponName: 'Meta-Vision Total Commander', weaponType: 'defense', isBlueLock: true },
      { name: 'Shoei Barou', position: 'DC', overall: 87, potential: 93, weaponName: 'Predator Eye & Chop Dribble Chop', weaponType: 'striker', isBlueLock: true },
      { name: 'Jyubei Aryu', position: 'DFC', overall: 83, potential: 88, weaponName: 'Glam Aerial Jumping Reach', weaponType: 'physical', isBlueLock: true },
      { name: 'Ikki Niko', position: 'MCD', overall: 83, potential: 89, weaponName: 'Spatial Watchtower Interception', weaponType: 'vision', isBlueLock: true },
      { name: 'D. Vlahovik', position: 'DC', overall: 85, potential: 88, weaponName: 'Serbian Hammer Left Foot', weaponType: 'striker', realRef: 'Dušan Vlahović' },
    ],
  },
  {
    id: 'it_acmlan',
    name: 'A.C. M-Lan',
    shortName: 'MIL',
    country: 'Italy',
    divisionId: 'it_serie_a',
    tier: 1,
    reputation: 90,
    level: 85,
    budgetEur: 80000000,
    primaryColor: '#fb090b',
    secondaryColor: '#000000',
    stadiumName: 'San Siro Diavolo',
    stadiumCapacity: 75923,
    ticketPriceEur: 60,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'R. Leao', position: 'EI', overall: 87, potential: 91, weaponName: 'Lusitanian Smirk Glide', weaponType: 'speed', realRef: 'Rafael Leão' },
      { name: 'Theo Hernan', position: 'LI', overall: 86, potential: 88, weaponName: 'Train on Rails Flank Charge', weaponType: 'speed', realRef: 'Theo Hernández' },
    ],
  },
  {
    id: 'it_internaz',
    name: 'Internaz Milano',
    shortName: 'INT',
    country: 'Italy',
    divisionId: 'it_serie_a',
    tier: 1,
    reputation: 91,
    level: 87,
    budgetEur: 88000000,
    primaryColor: '#001489',
    secondaryColor: '#000000',
    stadiumName: 'Stadio Giuseppe Neraz',
    stadiumCapacity: 75923,
    ticketPriceEur: 62,
    formation: '3-5-2',
    starPlayers: [
      { name: 'Lautaro Martez', position: 'DC', overall: 89, potential: 91, weaponName: 'El Toro Fierce Volley', weaponType: 'striker', realRef: 'Lautaro Martínez' },
      { name: 'N. Barella', position: 'MC', overall: 87, potential: 89, weaponName: 'Sardinian Dynamo Box-to-Box', weaponType: 'physical', realRef: 'Nicolò Barella' },
      { name: 'A. Bastoni', position: 'DFC', overall: 86, potential: 89, weaponName: 'Quarterback Deep Diagonal', weaponType: 'vision', realRef: 'Alessandro Bastoni' },
    ],
  },

  // ==========================================
  // 🇫🇷 FRANCIA - 1.ª DIVISIÓN (LIGUE 1)
  // ==========================================
  {
    id: 'fr_pxg',
    name: 'PXG (Paris X Gen)',
    shortName: 'PXG',
    country: 'France',
    divisionId: 'fr_ligue_1',
    tier: 1,
    reputation: 94,
    level: 88,
    budgetEur: 145000000,
    primaryColor: '#002654',
    secondaryColor: '#ed2939',
    stadiumName: 'Parc des Princes PXG',
    stadiumCapacity: 48583,
    ticketPriceEur: 70,
    formation: '4-3-3',
    starPlayers: [
      { name: 'Julian Loky', position: 'EI', overall: 94, potential: 96, weaponName: 'Godspeed Sprint Supernova Master', weaponType: 'speed', isBlueLock: true },
      { name: 'Rin Itoshi', position: 'DC', overall: 89, potential: 96, weaponName: 'Berserker Puppetmaster & Curve Shot', weaponType: 'striker', isBlueLock: true },
      { name: 'Ryusei Shidou', position: 'DC', overall: 88, potential: 94, weaponName: 'Spatial Awareness Drive Shot', weaponType: 'striker', isBlueLock: true },
      { name: 'Tabito Karasu', position: 'MCD', overall: 84, potential: 89, weaponName: 'Crow Assassin Arm Shielding', weaponType: 'vision', isBlueLock: true },
      { name: 'Nijiro Nanase', position: 'MC', overall: 79, potential: 85, weaponName: 'Ambipodal Synchronized Link', weaponType: 'vision', isBlueLock: true },
      { name: 'Tsurugi Zantetsu', position: 'ED', overall: 82, potential: 87, weaponName: 'Golden First-Step Acceleration', weaponType: 'speed', isBlueLock: true },
      { name: 'K. Mbape', position: 'DC', overall: 91, potential: 94, weaponName: 'Bondy Flash Cannon', weaponType: 'speed', realRef: 'Kylian Mbappé' },
      { name: 'O. Dembel', position: 'ED', overall: 86, potential: 87, weaponName: 'Two-Footed Chaos Dribble', weaponType: 'dribble', realRef: 'Ousmane Dembélé' },
    ],
  },
  {
    id: 'fr_omars',
    name: 'O. Mars (Phocéens)',
    shortName: 'OMA',
    country: 'France',
    divisionId: 'fr_ligue_1',
    tier: 1,
    reputation: 84,
    level: 80,
    budgetEur: 42000000,
    primaryColor: '#ffffff',
    secondaryColor: '#00a3e0',
    stadiumName: 'Orange Vélodrome Mars',
    stadiumCapacity: 67394,
    ticketPriceEur: 48,
    formation: '4-3-3',
    starPlayers: [
      { name: 'P. Aubame', position: 'DC', overall: 82, potential: 82, weaponName: 'Panther Breakaway Instinct', weaponType: 'speed', realRef: 'Pierre-Emerick Aubameyang' },
    ],
  },
  {
    id: 'fr_monaco',
    name: 'A.S. Principauté',
    shortName: 'ASM',
    country: 'France',
    divisionId: 'fr_ligue_1',
    tier: 1,
    reputation: 85,
    level: 81,
    budgetEur: 48000000,
    primaryColor: '#d50032',
    secondaryColor: '#ffffff',
    stadiumName: 'Stade Louis II Principauté',
    stadiumCapacity: 18523,
    ticketPriceEur: 50,
    formation: '4-2-3-1',
  },
  {
    id: 'fr_lyon',
    name: 'O. Rhodania (Lyon Gones)',
    shortName: 'LYO',
    country: 'France',
    divisionId: 'fr_ligue_1',
    tier: 1,
    reputation: 83,
    level: 79,
    budgetEur: 38000000,
    primaryColor: '#ffffff',
    secondaryColor: '#002f6c',
    stadiumName: 'Groupama Rhodania Stadium',
    stadiumCapacity: 59186,
    ticketPriceEur: 45,
    formation: '4-3-3',
  },
  {
    id: 'fr_lille',
    name: 'Lille Dogues',
    shortName: 'LOS',
    country: 'France',
    divisionId: 'fr_ligue_1',
    tier: 1,
    reputation: 83,
    level: 80,
    budgetEur: 35000000,
    primaryColor: '#e01e26',
    secondaryColor: '#001e62',
    stadiumName: 'Decathlon Arena Dogues',
    stadiumCapacity: 50186,
    ticketPriceEur: 44,
    formation: '4-2-3-1',
  },

  // ==========================================
  // SELECCIÓN DE CLUBES DE 2.ª DIVISIÓN
  // ==========================================
  {
    id: 'es_zaragoza',
    name: 'Zaragoza Blanquillo',
    shortName: 'ZAR',
    country: 'Spain',
    divisionId: 'es_hypermotion',
    tier: 2,
    reputation: 74,
    level: 74,
    budgetEur: 8500000,
    primaryColor: '#ffffff',
    secondaryColor: '#003399',
    stadiumName: 'La Romareda Blanquilla',
    stadiumCapacity: 33608,
    ticketPriceEur: 24,
    formation: '4-4-2',
  },
  {
    id: 'es_oviedo',
    name: 'Real Oviedin',
    shortName: 'ROV',
    country: 'Spain',
    divisionId: 'es_hypermotion',
    tier: 2,
    reputation: 73,
    level: 73,
    budgetEur: 7800000,
    primaryColor: '#003399',
    secondaryColor: '#ffffff',
    stadiumName: 'Carlos Tartiere Oviedin',
    stadiumCapacity: 30500,
    ticketPriceEur: 22,
    formation: '4-2-3-1',
    starPlayers: [
      { name: 'Santi Cazorla', position: 'MC', overall: 80, potential: 80, weaponName: 'Asturian Two-Footed Magic', weaponType: 'vision', realRef: 'Santi Cazorla' },
    ],
  },
  {
    id: 'es_sporting',
    name: 'Sporting Gijonés',
    shortName: 'RSG',
    country: 'Spain',
    divisionId: 'es_hypermotion',
    tier: 2,
    reputation: 73,
    level: 73,
    budgetEur: 7500000,
    primaryColor: '#d4001f',
    secondaryColor: '#ffffff',
    stadiumName: 'El Molinón Gijonés',
    stadiumCapacity: 30000,
    ticketPriceEur: 22,
    formation: '4-2-3-1',
  },
  {
    id: 'es_levante',
    name: 'Levante Granota',
    shortName: 'LEV',
    country: 'Spain',
    divisionId: 'es_hypermotion',
    tier: 2,
    reputation: 75,
    level: 74,
    budgetEur: 9000000,
    primaryColor: '#001489',
    secondaryColor: '#a50044',
    stadiumName: 'Ciutat de València Granota',
    stadiumCapacity: 26354,
    ticketPriceEur: 24,
    formation: '4-3-3',
  },
  {
    id: 'en_leeds',
    name: 'Leeds Whites',
    shortName: 'LEE',
    country: 'England',
    divisionId: 'en_championship',
    tier: 2,
    reputation: 78,
    level: 77,
    budgetEur: 18000000,
    primaryColor: '#ffffff',
    secondaryColor: '#0000ff',
    stadiumName: 'Elland Road Whites',
    stadiumCapacity: 37890,
    ticketPriceEur: 32,
    formation: '4-2-3-1',
  },
  {
    id: 'en_sunderland',
    name: 'Sunderland Black Cats',
    shortName: 'SUN',
    country: 'England',
    divisionId: 'en_championship',
    tier: 2,
    reputation: 75,
    level: 74,
    budgetEur: 14000000,
    primaryColor: '#ff0000',
    secondaryColor: '#ffffff',
    stadiumName: 'Stadium of Light Black Cats',
    stadiumCapacity: 49000,
    ticketPriceEur: 28,
    formation: '4-3-3',
  },
  {
    id: 'de_hamburg',
    name: 'Hamburg Hanseaten',
    shortName: 'HSV',
    country: 'Germany',
    divisionId: 'de_2bundesliga',
    tier: 2,
    reputation: 77,
    level: 76,
    budgetEur: 15000000,
    primaryColor: '#ffffff',
    secondaryColor: '#0000ff',
    stadiumName: 'Volksparkstadion Hanseaten',
    stadiumCapacity: 57000,
    ticketPriceEur: 26,
    formation: '4-3-3',
  },
  {
    id: 'de_schalke',
    name: 'Schalke Königsblau',
    shortName: 'S04',
    country: 'Germany',
    divisionId: 'de_2bundesliga',
    tier: 2,
    reputation: 77,
    level: 75,
    budgetEur: 14000000,
    primaryColor: '#004d98',
    secondaryColor: '#ffffff',
    stadiumName: 'Veltins Arena Königsblau',
    stadiumCapacity: 62271,
    ticketPriceEur: 25,
    formation: '4-4-2',
  },
  {
    id: 'it_palermo',
    name: 'Palermo Rosanero',
    shortName: 'PAL',
    country: 'Italy',
    divisionId: 'it_serie_b',
    tier: 2,
    reputation: 74,
    level: 74,
    budgetEur: 9500000,
    primaryColor: '#ffc0cb',
    secondaryColor: '#000000',
    stadiumName: 'Renzo Barbera Rosanero',
    stadiumCapacity: 36365,
    ticketPriceEur: 22,
    formation: '4-3-3',
  },
  {
    id: 'it_sampdoria',
    name: 'Sampdoria Blucerchiati',
    shortName: 'SAM',
    country: 'Italy',
    divisionId: 'it_serie_b',
    tier: 2,
    reputation: 76,
    level: 74,
    budgetEur: 11000000,
    primaryColor: '#002f6c',
    secondaryColor: '#ffffff',
    stadiumName: 'Luigi Ferraris Blucerchiati',
    stadiumCapacity: 36599,
    ticketPriceEur: 22,
    formation: '4-3-3',
  },
  {
    id: 'fr_bordeaux',
    name: 'Girondins Marine-et-Blanc',
    shortName: 'BOR',
    country: 'France',
    divisionId: 'fr_ligue_2',
    tier: 2,
    reputation: 75,
    level: 73,
    budgetEur: 9000000,
    primaryColor: '#001e62',
    secondaryColor: '#ffffff',
    stadiumName: 'Matmut Atlantique Marine',
    stadiumCapacity: 42115,
    ticketPriceEur: 20,
    formation: '4-3-3',
  },

  // ==========================================
  // SELECCIÓN DE CLUBES DE 3.ª DIVISIÓN (HISTÓRICOS)
  // ==========================================
  {
    id: 'es_depor',
    name: 'Dep. A Coruña Herculino',
    shortName: 'DEP',
    country: 'Spain',
    divisionId: 'es_primera_rfef',
    tier: 3,
    groupId: 'es_rfef1_g1',
    reputation: 72,
    level: 72,
    budgetEur: 4500000,
    primaryColor: '#004d98',
    secondaryColor: '#ffffff',
    stadiumName: 'Riazor Herculino',
    stadiumCapacity: 32490,
    ticketPriceEur: 18,
    formation: '4-3-3',
    starPlayers: [
      { name: 'Lucas Perez', position: 'DC', overall: 79, potential: 79, weaponName: 'Herculino Pride Left Foot', weaponType: 'striker', realRef: 'Lucas Pérez' },
    ],
  },
  {
    id: 'es_malaga',
    name: 'Málaga Boquerón',
    shortName: 'MCF',
    country: 'Spain',
    divisionId: 'es_primera_rfef',
    tier: 3,
    groupId: 'es_rfef1_g2',
    reputation: 71,
    level: 71,
    budgetEur: 4200000,
    primaryColor: '#007bc4',
    secondaryColor: '#ffffff',
    stadiumName: 'La Rosaleda Boquerona',
    stadiumCapacity: 30044,
    ticketPriceEur: 16,
    formation: '4-2-3-1',
  },
  {
    id: 'en_birmingham',
    name: 'Birmingham Blues',
    shortName: 'BIR',
    country: 'England',
    divisionId: 'en_league_one',
    tier: 3,
    reputation: 71,
    level: 72,
    budgetEur: 6000000,
    primaryColor: '#0000ff',
    secondaryColor: '#ffffff',
    stadiumName: 'St. Andrew Blues',
    stadiumCapacity: 29409,
    ticketPriceEur: 20,
    formation: '4-2-3-1',
  },
  {
    id: 'en_wrexham',
    name: 'Wrexham Red Dragons',
    shortName: 'WRE',
    country: 'England',
    divisionId: 'en_league_one',
    tier: 3,
    reputation: 70,
    level: 70,
    budgetEur: 5500000,
    primaryColor: '#ff0000',
    secondaryColor: '#ffffff',
    stadiumName: 'Racecourse Ground Dragons',
    stadiumCapacity: 12600,
    ticketPriceEur: 22,
    formation: '3-5-2',
    starPlayers: [
      { name: 'Paul Mullin', position: 'DC', overall: 75, potential: 76, weaponName: 'Red Dragon Fire Volley', weaponType: 'striker' },
    ],
  },
  {
    id: 'de_dresden',
    name: 'Dynamo Dresden',
    shortName: 'DRE',
    country: 'Germany',
    divisionId: 'de_3liga',
    tier: 3,
    reputation: 68,
    level: 69,
    budgetEur: 3800000,
    primaryColor: '#fde100',
    secondaryColor: '#000000',
    stadiumName: 'Rudolf-Harbig Dynamo Stadium',
    stadiumCapacity: 32249,
    ticketPriceEur: 16,
    formation: '4-3-3',
  },
  {
    id: 'it_catania',
    name: 'Catania Etnei',
    shortName: 'CAT',
    country: 'Italy',
    divisionId: 'it_serie_c',
    tier: 3,
    groupId: 'it_seriec_gc',
    reputation: 67,
    level: 68,
    budgetEur: 3200000,
    primaryColor: '#d4001f',
    secondaryColor: '#005ca9',
    stadiumName: 'Angelo Massimino Etneo',
    stadiumCapacity: 20016,
    ticketPriceEur: 14,
    formation: '4-3-3',
  },
  {
    id: 'fr_sochaux',
    name: 'Sochaux Lionceaux',
    shortName: 'SOC',
    country: 'France',
    divisionId: 'fr_national_1',
    tier: 3,
    reputation: 66,
    level: 67,
    budgetEur: 2800000,
    primaryColor: '#ffd700',
    secondaryColor: '#000080',
    stadiumName: 'Stade Bonal Lionceaux',
    stadiumCapacity: 20005,
    ticketPriceEur: 14,
    formation: '4-4-2',
  },

  // ==========================================
  // SELECCIÓN DE CLUBES DE 4.ª DIVISIÓN (HISTÓRICOS)
  // ==========================================
  {
    id: 'es_numancia',
    name: 'Numancia Soriano',
    shortName: 'NUM',
    country: 'Spain',
    divisionId: 'es_segunda_rfef',
    tier: 4,
    groupId: 'es_rfef2_g1',
    reputation: 61,
    level: 62,
    budgetEur: 1100000,
    primaryColor: '#d4001f',
    secondaryColor: '#005ca9',
    stadiumName: 'Los Pajaritos Sorianos',
    stadiumCapacity: 8261,
    ticketPriceEur: 12,
    formation: '4-4-2',
  },
  {
    id: 'es_pontevedra',
    name: 'Pontevedra Granate',
    shortName: 'PON',
    country: 'Spain',
    divisionId: 'es_segunda_rfef',
    tier: 4,
    groupId: 'es_rfef2_g1',
    reputation: 60,
    level: 61,
    budgetEur: 950000,
    primaryColor: '#7a0026',
    secondaryColor: '#ffffff',
    stadiumName: 'Pasarón Granate',
    stadiumCapacity: 10500,
    ticketPriceEur: 12,
    formation: '4-2-3-1',
  },
  {
    id: 'es_hercules',
    name: 'Hércules Herculano',
    shortName: 'HER',
    country: 'Spain',
    divisionId: 'es_segunda_rfef',
    tier: 4,
    groupId: 'es_rfef2_g3',
    reputation: 63,
    level: 63,
    budgetEur: 1200000,
    primaryColor: '#003399',
    secondaryColor: '#ffffff',
    stadiumName: 'José Rico Pérez Herculano',
    stadiumCapacity: 29500,
    ticketPriceEur: 14,
    formation: '4-3-3',
  },
  {
    id: 'en_nottscounty',
    name: 'Notts County Magpies',
    shortName: 'NCO',
    country: 'England',
    divisionId: 'en_league_two',
    tier: 4,
    reputation: 60,
    level: 62,
    budgetEur: 1250000,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    stadiumName: 'Meadow Lane Magpies',
    stadiumCapacity: 19841,
    ticketPriceEur: 16,
    formation: '3-5-2',
  },
  {
    id: 'en_bradford',
    name: 'Bradford Bantams',
    shortName: 'BRA',
    country: 'England',
    divisionId: 'en_league_two',
    tier: 4,
    reputation: 61,
    level: 62,
    budgetEur: 1300000,
    primaryColor: '#7a263a',
    secondaryColor: '#ffb81c',
    stadiumName: 'Valley Parade Bantams',
    stadiumCapacity: 25136,
    ticketPriceEur: 16,
    formation: '4-4-2',
  },
  {
    id: 'de_aachen',
    name: 'Alemannia Aachen (Tivoli)',
    shortName: 'AAC',
    country: 'Germany',
    divisionId: 'de_regionalliga',
    tier: 4,
    groupId: 'de_reg_west',
    reputation: 62,
    level: 62,
    budgetEur: 1200000,
    primaryColor: '#000000',
    secondaryColor: '#ffdd00',
    stadiumName: 'Neuer Tivoli Aachen',
    stadiumCapacity: 32960,
    ticketPriceEur: 14,
    formation: '4-3-3',
  },
  {
    id: 'de_duisburg',
    name: 'MSV Duisburg Zebras',
    shortName: 'DUI',
    country: 'Germany',
    divisionId: 'de_regionalliga',
    tier: 4,
    groupId: 'de_reg_west',
    reputation: 63,
    level: 63,
    budgetEur: 1350000,
    primaryColor: '#002f6c',
    secondaryColor: '#ffffff',
    stadiumName: 'Schauinsland-Reisen Zebra Arena',
    stadiumCapacity: 31500,
    ticketPriceEur: 14,
    formation: '4-2-3-1',
  },
  {
    id: 'it_chievo',
    name: 'Chievo Verona Clivense',
    shortName: 'CHV',
    country: 'Italy',
    divisionId: 'it_serie_d',
    tier: 4,
    groupId: 'it_seriec_gc',
    reputation: 59,
    level: 60,
    budgetEur: 900000,
    primaryColor: '#ffdd00',
    secondaryColor: '#002f6c',
    stadiumName: 'Stadio Clivense Verona',
    stadiumCapacity: 6000,
    ticketPriceEur: 10,
    formation: '4-3-3',
  },
  {
    id: 'fr_cannes',
    name: 'AS Cannes',
    shortName: 'CAN',
    country: 'France',
    divisionId: 'fr_national_2',
    tier: 4,
    groupId: 'fr_nat2_gc',
    reputation: 58,
    level: 59,
    budgetEur: 850000,
    primaryColor: '#d4001f',
    secondaryColor: '#ffffff',
    stadiumName: 'Stade Pierre de Coubertin Cannes',
    stadiumCapacity: 12800,
    ticketPriceEur: 10,
    formation: '4-3-3',
  },
];

// Helper: busca clubes por división
export function getClubsByDivision(divisionId: string): ClubTemplate[] {
  return CLUBS_MASTER_CATALOG.filter((c) => c.divisionId === divisionId);
}

// Helper: busca clubes por país y nivel
export function getClubsByCountryAndTier(country: CountryLeague, tier: 1 | 2 | 3 | 4): ClubTemplate[] {
  return CLUBS_MASTER_CATALOG.filter((c) => c.country === country && c.tier === tier);
}

// Helper: busca plantilla por ID
export function getClubTemplateById(id: string): ClubTemplate | undefined {
  return CLUBS_MASTER_CATALOG.find((c) => c.id === id);
}

// ==============================================================================
// GENERADOR DE JUGADORES Y PLANTILLAS DE LAS 5 GRANDES LIGAS
// ==============================================================================

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const NAME_DATABASE: Record<CountryLeague, { first: string[]; last: string[] }> = {
  Spain: {
    first: ['Hugo', 'David', 'Pablo', 'Marcos', 'Adrián', 'Álvaro', 'Sergio', 'Mateo', 'Lucas', 'Daniel', 'Iker', 'Mario', 'Rubén', 'Alejandro', 'Javier', 'Carlos', 'Diego', 'Marc', 'Pol', 'Unai', 'Gorka', 'Ander'],
    last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Navarro'],
  },
  England: {
    first: ['Jack', 'Oliver', 'Harry', 'George', 'Noah', 'Charlie', 'Jacob', 'Alfie', 'Freddie', 'Oscar', 'Leo', 'Arthur', 'Henry', 'Archie', 'Thomas', 'James', 'William', 'Alexander', 'Ethan', 'Edward', 'Mason', 'Callum'],
    last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Thomas', 'Clarke', 'Jackson', 'Harris'],
  },
  Germany: {
    first: ['Lukas', 'Maximilian', 'Leon', 'Paul', 'Felix', 'Jonas', 'Elias', 'Finn', 'Noah', 'Ben', 'Niklas', 'Julian', 'Moritz', 'Jan', 'Florian', 'Tobias', 'Alexander', 'Simon', 'Tim', 'Philipp', 'Bastian', 'Mats'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun'],
  },
  Italy: {
    first: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo', 'Matteo', 'Federico', 'Giuseppe', 'Antonio', 'Marco', 'Davide', 'Simone', 'Luca', 'Pietro', 'Giovanni', 'Gianluigi'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri'],
  },
  France: {
    first: ['Gabriel', 'Léo', 'Raphaël', 'Arthur', 'Louis', 'Lucas', 'Adam', 'Jules', 'Hugo', 'Maël', 'Liam', 'Noah', 'Paul', 'Nathan', 'Sacha', 'Théo', 'Maxime', 'Antoine', 'Clément', 'Mathis', 'Kylian', 'Aurélien'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel'],
  },
};

export function generatePyramidClubsAndPlayers(
  selectedCountry: CountryLeague,
  selectedDivisionId: string
): { clubs: Club[]; players: Player[] } {
  // 1. Filtrar los clubes: todos los del país seleccionado (para la pirámide completa)
  // más los clubes canónicos de otras ligas para el mercado internacional
  let candidateTemplates = CLUBS_MASTER_CATALOG.filter((c) => c.country === selectedCountry);
  if (candidateTemplates.length === 0) {
    candidateTemplates = CLUBS_MASTER_CATALOG.filter((c) => c.divisionId === selectedDivisionId);
  }

  // Asegurar que al menos tengamos los clubes de la división activa
  const activeDivTemplates = candidateTemplates.filter((c) => c.divisionId === selectedDivisionId);
  const otherDivTemplates = candidateTemplates.filter((c) => c.divisionId !== selectedDivisionId);
  const templatesToUse = [...activeDivTemplates, ...otherDivTemplates];

  const allPlayers: Player[] = [];
  const allClubs: Club[] = [];

  templatesToUse.forEach((tmpl) => {
    const clubId = tmpl.id;
    const clubPlayers: Player[] = [];
    const namePool = NAME_DATABASE[tmpl.country] || NAME_DATABASE.Spain;

    // 1. Crear jugadores estrella / Blue Lock / parodias si existen
    if (tmpl.starPlayers && tmpl.starPlayers.length > 0) {
      tmpl.starPlayers.forEach((sp, idx) => {
        const baseOvr = sp.overall;
        const stats = {
          pace: Math.min(99, Math.max(50, baseOvr + rnd(-4, 6))),
          shooting: ['DC', 'EI', 'ED', 'MCO'].includes(sp.position) ? Math.min(99, baseOvr + rnd(-2, 5)) : Math.max(30, baseOvr - 20),
          passing: ['MC', 'MCO', 'MI', 'MD'].includes(sp.position) ? Math.min(99, baseOvr + rnd(0, 5)) : Math.max(40, baseOvr - 15),
          dribbling: ['EI', 'ED', 'MCO', 'MC'].includes(sp.position) ? Math.min(99, baseOvr + rnd(0, 5)) : Math.max(40, baseOvr - 15),
          defense: ['DFC', 'MCD', 'LI', 'LD', 'CAD', 'CAI'].includes(sp.position) ? Math.min(99, baseOvr + rnd(0, 5)) : Math.max(30, baseOvr - 25),
          physical: Math.min(99, Math.max(50, baseOvr + rnd(-5, 5))),
          goalkeeping: sp.position === 'POR' ? Math.min(99, baseOvr + rnd(0, 4)) : 15,
        };

        const weapons: Weapon[] = [];
        if (sp.weaponName) {
          weapons.push({
            name: sp.weaponName,
            type: sp.weaponType || (['POR'].includes(sp.position) ? 'gk' : 'striker'),
            level: Math.min(99, baseOvr + 5),
            description: sp.isBlueLock ? 'Arma canónica del universo Blue Lock' : 'Habilidad estelar característica',
          });
        }

        const starPlayer: Player = {
          id: `p-${clubId}-star-${idx}`,
          clubId,
          name: sp.name,
          age: sp.isBlueLock ? rnd(17, 21) : rnd(22, 33),
          nationality: tmpl.country,
          position: sp.position,
          overall: baseOvr,
          potential: Math.max(baseOvr, sp.potential),
          stats,
          weapons,
          egoRating: sp.isBlueLock ? rnd(85, 98) : rnd(75, 92),
          flowState: false,
          fitness: 100,
          morale: rnd(85, 95),
          form: rnd(75, 90),
          marketValueYen: Math.round(baseOvr * baseOvr * baseOvr * 30 * EUR_TO_YEN),
          weeklyWageYen: Math.round(baseOvr * 35000 * (EUR_TO_YEN / 160)),
          contractYears: rnd(2, 5),
          isUnlicensedParody: !sp.isBlueLock,
          realNameReference: sp.realRef,
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

        clubPlayers.push(starPlayer);
        allPlayers.push(starPlayer);
      });
    }

    // 2. Completar plantilla hasta 19 futbolistas asegurando equilibrio posicional
    const targetSquadSize = 19;
    const requiredPositions: Position[] = [
      'POR', 'POR',
      'DFC', 'DFC', 'DFC', 'DFC',
      'LI', 'LD',
      'MCD', 'MC', 'MC', 'MCO',
      'MI', 'MD',
      'EI', 'ED',
      'DC', 'DC', 'DC',
    ];

    // Contar cuántos faltan por posición
    const currentPositions = clubPlayers.map((p) => p.position);
    const missingPositions = requiredPositions.filter((pos) => {
      const idx = currentPositions.indexOf(pos);
      if (idx !== -1) {
        currentPositions.splice(idx, 1);
        return false;
      }
      return true;
    });

    const tierBaseOvr = tmpl.tier === 1 ? tmpl.level : tmpl.tier === 2 ? tmpl.level - 2 : tmpl.tier === 3 ? tmpl.level - 3 : tmpl.level - 4;

    missingPositions.forEach((pos, mIdx) => {
      if (clubPlayers.length >= targetSquadSize) return;

      const firstName = namePool.first[rnd(0, namePool.first.length - 1)];
      const lastName = namePool.last[rnd(0, namePool.last.length - 1)];
      const fullName = `${firstName} ${lastName}`;
      const age = rnd(18, 32);

      const targetOvr = Math.min(92, Math.max(52, tierBaseOvr + rnd(-4, 4)));
      const stats = {
        pace: Math.min(96, Math.max(48, targetOvr + rnd(-8, 8))),
        shooting: ['DC', 'EI', 'ED', 'MCO'].includes(pos) ? Math.min(95, Math.max(55, targetOvr + rnd(-4, 6))) : Math.max(30, targetOvr - 25),
        passing: ['MC', 'MCO', 'MI', 'MD'].includes(pos) ? Math.min(95, Math.max(55, targetOvr + rnd(-4, 6))) : Math.max(35, targetOvr - 18),
        dribbling: ['EI', 'ED', 'MCO', 'MC'].includes(pos) ? Math.min(95, Math.max(55, targetOvr + rnd(-5, 6))) : Math.max(35, targetOvr - 18),
        defense: ['DFC', 'MCD', 'LI', 'LD', 'CAD', 'CAI'].includes(pos) ? Math.min(95, Math.max(55, targetOvr + rnd(-4, 6))) : Math.max(30, targetOvr - 28),
        physical: Math.min(95, Math.max(50, targetOvr + rnd(-6, 6))),
        goalkeeping: pos === 'POR' ? Math.min(94, Math.max(58, targetOvr + rnd(-2, 4))) : 15,
      };

      const finalOvr = calculateOvr(pos, stats);
      const valYen = Math.round(finalOvr * finalOvr * finalOvr * 18 * (EUR_TO_YEN / 160) + rnd(500000, 3000000));
      const wageYen = Math.max(30000, Math.round(valYen * 0.015));

      const generatedPlayer: Player = {
        id: `p-${clubId}-gen-${mIdx}-${rnd(100, 999)}`,
        clubId,
        name: fullName,
        age,
        nationality: tmpl.country,
        position: pos,
        overall: finalOvr,
        potential: Math.min(96, finalOvr + (age < 22 ? rnd(4, 10) : rnd(0, 3))),
        stats,
        weapons: [],
        egoRating: rnd(60, 80),
        flowState: false,
        fitness: 100,
        morale: rnd(75, 90),
        form: rnd(65, 85),
        marketValueYen: valYen,
        weeklyWageYen: wageYen,
        contractYears: rnd(2, 4),
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

      clubPlayers.push(generatedPlayer);
      allPlayers.push(generatedPlayer);
    });

    // 3. Configurar alineación titular (11), suplentes (7) y capitanías
    const gks = clubPlayers.filter((p) => p.position === 'POR').sort((a, b) => b.overall - a.overall);
    const chosenGk = gks[0] || clubPlayers[0];

    const defs = clubPlayers.filter((p) => ['DFC', 'LI', 'LD', 'CAD', 'CAI'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    const mids = clubPlayers.filter((p) => ['MCD', 'MC', 'MCO', 'MI', 'MD'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    const fwds = clubPlayers.filter((p) => ['DC', 'EI', 'ED'].includes(p.position)).sort((a, b) => b.overall - a.overall);

    let chosenDefs: Player[] = [];
    let chosenMids: Player[] = [];
    let chosenFwds: Player[] = [];

    if (tmpl.formation === '3-5-2') {
      chosenDefs = defs.slice(0, 3);
      chosenMids = mids.slice(0, 5);
      chosenFwds = fwds.slice(0, 2);
    } else if (tmpl.formation === '5-3-2') {
      chosenDefs = defs.slice(0, 5);
      chosenMids = mids.slice(0, 3);
      chosenFwds = fwds.slice(0, 2);
    } else if (tmpl.formation === '4-2-3-1' || tmpl.formation === '4-3-3') {
      chosenDefs = defs.slice(0, 4);
      chosenMids = mids.slice(0, 3);
      chosenFwds = fwds.slice(0, 3);
    } else {
      chosenDefs = defs.slice(0, 4);
      chosenMids = mids.slice(0, 4);
      chosenFwds = fwds.slice(0, 2);
    }

    const startingXI = [chosenGk, ...chosenDefs, ...chosenMids, ...chosenFwds].filter(Boolean);
    const startingIds = startingXI.slice(0, 11).map((p) => p.id);

    const bench = clubPlayers.filter((p) => !startingIds.includes(p.id)).sort((a, b) => b.overall - a.overall).slice(0, 7);
    const benchIds = bench.map((p) => p.id);

    const bestPlayer = [...startingXI].sort((a, b) => b.overall - a.overall)[0] || clubPlayers[0];
    const penaltyTaker = startingXI.find((p) => p.position === 'DC') || bestPlayer;
    const freeKickTaker = startingXI.find((p) => ['MCO', 'MC', 'EI', 'ED'].includes(p.position)) || bestPlayer;

    const budgetYen = Math.round(tmpl.budgetEur * EUR_TO_YEN);
    const ticketPriceYen = Math.round(tmpl.ticketPriceEur * EUR_TO_YEN);

    const club: Club = {
      id: tmpl.id,
      name: tmpl.name,
      shortName: tmpl.shortName,
      country: tmpl.country,
      league: tmpl.divisionId,
      divisionId: tmpl.divisionId,
      tier: tmpl.tier,
      groupId: tmpl.groupId,
      reputation: tmpl.reputation,
      level: tmpl.level,
      budgetYen,
      cashYen: budgetYen * 2,
      weeklyWageCapYen: Math.round(budgetYen * 0.04),
      primaryColor: tmpl.primaryColor,
      secondaryColor: tmpl.secondaryColor,
      stadiumName: tmpl.stadiumName,
      stadiumCapacity: tmpl.stadiumCapacity,
      ticketPriceYen,
      boardExpectation: tmpl.tier === 1 ? (tmpl.reputation > 85 ? 1 : 6) : 1,
      formation: tmpl.formation,
      startingXI: startingIds,
      substitutes: benchIds,
      captainId: bestPlayer.id,
      penaltyTakerId: penaltyTaker.id,
      freeKickTakerId: freeKickTaker.id,
      mentalidad: 'equilibrada',
      presion: 'media',
      estiloPase: 'posesion',
    };

    allClubs.push(club);
  });

  return { clubs: allClubs, players: allPlayers };
}

