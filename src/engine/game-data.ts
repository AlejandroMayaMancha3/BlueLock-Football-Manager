import { Club, Player, Position, Weapon, Formation, PlayerStats } from '@/types/football-manager';

// Random helper
function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateOvr(pos: Position, stats: Player['stats']): number {
  switch (pos) {
    case 'POR':
      return Math.round(stats.goalkeeping * 0.75 + stats.physical * 0.15 + stats.pace * 0.1);
    case 'DFC':
      return Math.round(stats.defense * 0.45 + stats.physical * 0.3 + stats.pace * 0.15 + stats.passing * 0.1);
    case 'LI':
    case 'LD':
      return Math.round(stats.pace * 0.35 + stats.defense * 0.25 + stats.dribbling * 0.2 + stats.passing * 0.2);
    case 'MCD':
      return Math.round(stats.defense * 0.35 + stats.passing * 0.3 + stats.physical * 0.25 + stats.dribbling * 0.1);
    case 'MC':
      return Math.round(stats.passing * 0.35 + stats.dribbling * 0.25 + stats.shooting * 0.15 + stats.defense * 0.15 + stats.physical * 0.1);
    case 'MCO':
      return Math.round(stats.passing * 0.35 + stats.dribbling * 0.3 + stats.shooting * 0.25 + stats.pace * 0.1);
    case 'EI':
    case 'ED':
      return Math.round(stats.pace * 0.35 + stats.dribbling * 0.3 + stats.shooting * 0.2 + stats.passing * 0.15);
    case 'DC':
      return Math.round(stats.shooting * 0.4 + stats.pace * 0.2 + stats.physical * 0.2 + stats.dribbling * 0.1 + stats.passing * 0.1);
  }
}

export function generateInitialClubsAndPlayers(): { clubs: Club[]; players: Player[] } {
  const clubsData: Array<{
    id: string;
    name: string;
    shortName: string;
    country: string;
    reputation: number;
    level: number;
    budgetYen: number;
    cashYen: number;
    weeklyWageCapYen: number;
    primaryColor: string;
    secondaryColor: string;
    stadiumName: string;
    stadiumCapacity: number;
    ticketPriceYen: number;
    boardExpectation: number;
    formation: Formation;
  }> = [
    {
      id: 'club-bm',
      name: 'Bastard München',
      shortName: 'BM',
      country: 'Alemania',
      reputation: 92,
      level: 87,
      budgetYen: 850000000,
      cashYen: 1800000000,
      weeklyWageCapYen: 45000000,
      primaryColor: '#c8102e', // Rojo Baviera
      secondaryColor: '#1d252d', // Negro Grafito
      stadiumName: 'Allianz Arena NEL',
      stadiumCapacity: 75000,
      ticketPriceYen: 6500,
      boardExpectation: 1,
      formation: '4-3-3',
    },
    {
      id: 'club-pxg',
      name: 'Paris X Gen',
      shortName: 'PXG',
      country: 'Francia',
      reputation: 90,
      level: 86,
      budgetYen: 950000000,
      cashYen: 2100000000,
      weeklyWageCapYen: 48000000,
      primaryColor: '#002654', // Azul Marino
      secondaryColor: '#ed2939', // Rojo Carmesí
      stadiumName: 'Parc des Princes NEL',
      stadiumCapacity: 48000,
      ticketPriceYen: 7000,
      boardExpectation: 1,
      formation: '4-3-3',
    },
    {
      id: 'club-mc',
      name: 'Manshine City',
      shortName: 'MC',
      country: 'Inglaterra',
      reputation: 89,
      level: 84,
      budgetYen: 900000000,
      cashYen: 1950000000,
      weeklyWageCapYen: 44000000,
      primaryColor: '#6cabdd', // Celeste
      secondaryColor: '#ffffff', // Blanco
      stadiumName: 'Etihad NEL Stadium',
      stadiumCapacity: 55000,
      ticketPriceYen: 6800,
      boardExpectation: 2,
      formation: '4-3-3',
    },
    {
      id: 'club-ubers',
      name: 'Ubers',
      shortName: 'UBE',
      country: 'Italia',
      reputation: 88,
      level: 85,
      budgetYen: 750000000,
      cashYen: 1600000000,
      weeklyWageCapYen: 40000000,
      primaryColor: '#ffffff', // Blanco
      secondaryColor: '#111111', // Rayas Negras
      stadiumName: 'Juventus Stadium NEL',
      stadiumCapacity: 41000,
      ticketPriceYen: 6200,
      boardExpectation: 2,
      formation: '3-5-2',
    },
    {
      id: 'club-barcha',
      name: 'FC Barcha',
      shortName: 'BAR',
      country: 'España',
      reputation: 87,
      level: 83,
      budgetYen: 700000000,
      cashYen: 1400000000,
      weeklyWageCapYen: 38000000,
      primaryColor: '#a50044', // Grana
      secondaryColor: '#004d98', // Azul
      stadiumName: 'Camp Nou NEL',
      stadiumCapacity: 85000,
      ticketPriceYen: 6400,
      boardExpectation: 3,
      formation: '4-3-3',
    },
    {
      id: 'club-rm',
      name: 'Real Madrid Juvenil',
      shortName: 'RMA',
      country: 'España',
      reputation: 93,
      level: 86,
      budgetYen: 800000000,
      cashYen: 1750000000,
      weeklyWageCapYen: 43000000,
      primaryColor: '#ffffff', // Blanco
      secondaryColor: '#e0b238', // Oro Real
      stadiumName: 'Alfredo Di Stéfano NEL',
      stadiumCapacity: 35000,
      ticketPriceYen: 6000,
      boardExpectation: 1,
      formation: '4-2-3-1',
    },
    {
      id: 'club-inter',
      name: 'Inter Milán NextGen',
      shortName: 'INT',
      country: 'Italia',
      reputation: 83,
      level: 80,
      budgetYen: 550000000,
      cashYen: 1100000000,
      weeklyWageCapYen: 30000000,
      primaryColor: '#001489', // Azul Inter
      secondaryColor: '#000000', // Negro
      stadiumName: 'San Siro B',
      stadiumCapacity: 38000,
      ticketPriceYen: 5200,
      boardExpectation: 4,
      formation: '3-5-2',
    },
    {
      id: 'club-bvb',
      name: 'Borussia West',
      shortName: 'BVB',
      country: 'Alemania',
      reputation: 82,
      level: 79,
      budgetYen: 500000000,
      cashYen: 950000000,
      weeklyWageCapYen: 28000000,
      primaryColor: '#fde100', // Amarillo
      secondaryColor: '#000000', // Negro
      stadiumName: 'Signal Iduna West',
      stadiumCapacity: 40000,
      ticketPriceYen: 5000,
      boardExpectation: 4,
      formation: '4-2-3-1',
    },
    {
      id: 'club-ars',
      name: 'Arsenal Academy',
      shortName: 'ARS',
      country: 'Inglaterra',
      reputation: 81,
      level: 79,
      budgetYen: 520000000,
      cashYen: 1000000000,
      weeklyWageCapYen: 29000000,
      primaryColor: '#ef0107', // Rojo Cañón
      secondaryColor: '#ffffff', // Blanco
      stadiumName: 'Colney Training Ground',
      stadiumCapacity: 28000,
      ticketPriceYen: 4800,
      boardExpectation: 5,
      formation: '4-3-3',
    },
    {
      id: 'club-ajax',
      name: 'Ajax Future Stars',
      shortName: 'AJX',
      country: 'Países Bajos',
      reputation: 80,
      level: 78,
      budgetYen: 450000000,
      cashYen: 850000000,
      weeklyWageCapYen: 25000000,
      primaryColor: '#d2122e', // Rojo
      secondaryColor: '#ffffff', // Blanco
      stadiumName: 'De Toekomst Stadium',
      stadiumCapacity: 25000,
      ticketPriceYen: 4500,
      boardExpectation: 5,
      formation: '4-3-3',
    },
    {
      id: 'club-scp',
      name: 'Sporting Lisboa Talents',
      shortName: 'SCP',
      country: 'Portugal',
      reputation: 78,
      level: 77,
      budgetYen: 400000000,
      cashYen: 750000000,
      weeklyWageCapYen: 22000000,
      primaryColor: '#008057', // Verde
      secondaryColor: '#ffffff', // Rayas Blancas
      stadiumName: 'Academia Cristiano Ronaldo',
      stadiumCapacity: 22000,
      ticketPriceYen: 4200,
      boardExpectation: 6,
      formation: '4-4-2',
    },
    {
      id: 'club-bl11',
      name: 'Blue Lock Eleven',
      shortName: 'BL11',
      country: 'Japón',
      reputation: 82,
      level: 81,
      budgetYen: 600000000,
      cashYen: 1200000000,
      weeklyWageCapYen: 32000000,
      primaryColor: '#0047bb', // Azul Ego Eléctrico
      secondaryColor: '#00ffff', // Cyan Neón
      stadiumName: 'Blue Lock Facility Dome',
      stadiumCapacity: 50000,
      ticketPriceYen: 5500,
      boardExpectation: 3,
      formation: '4-3-3',
    },
  ];

  // Specific Named Blue Lock Key Players
  const blueLockStars: Array<{
    clubId: string;
    name: string;
    age: number;
    nat: string;
    pos: Position;
    sec?: Position;
    stats: Player['stats'];
    weapons: Weapon[];
    ego: number;
    valYen: number;
    wageYen: number;
  }> = [
    // BASTARD MÜNCHEN
    {
      clubId: 'club-bm',
      name: 'Yoichi Isagi',
      age: 17,
      nat: 'Japón',
      pos: 'DC',
      sec: 'MCO',
      stats: { pace: 84, shooting: 88, passing: 89, dribbling: 83, defense: 77, physical: 80, goalkeeping: 15 },
      weapons: [
        { name: 'Metavisión Espacial', type: 'vision', level: 95, description: 'Lectura panorámica en 360° del campo y anticipación absoluta' },
        { name: 'Direct Shot (Al Primer Toque)', type: 'striker', level: 93, description: 'Conversión letal sin control previo anulando tiempos de reacción' },
        { name: 'Lefty Direct Volley', type: 'striker', level: 86, description: 'Disparo de zurda imprevisto como arma secundaria' }
      ],
      ego: 95,
      valYen: 150000000,
      wageYen: 3200000,
    },
    {
      clubId: 'club-bm',
      name: 'Michael Kaiser',
      age: 19,
      nat: 'Alemania',
      pos: 'DC',
      sec: 'ED',
      stats: { pace: 89, shooting: 96, passing: 86, dribbling: 91, defense: 68, physical: 87, goalkeeping: 15 },
      weapons: [
        { name: 'Kaiser Impact', type: 'striker', level: 99, description: 'Velocidad de oscilación de pierna más rápida del planeta' },
        { name: 'Predator & Metavision', type: 'vision', level: 93, description: 'Focalización en los puntos ciegos del portero y defensa' }
      ],
      ego: 96,
      valYen: 320000000,
      wageYen: 6500000,
    },
    {
      clubId: 'club-bm',
      name: 'Alexis Ness',
      age: 18,
      nat: 'Alemania',
      pos: 'MC',
      sec: 'MCO',
      stats: { pace: 85, shooting: 78, passing: 92, dribbling: 93, defense: 71, physical: 77, goalkeeping: 15 },
      weapons: [
        { name: 'Magic Ankle Dribble', type: 'dribble', level: 92, description: 'Movilidad de tobillo elástica y pases curvos de fantasía' }
      ],
      ego: 82,
      valYen: 75000000,
      wageYen: 1800000,
    },
    {
      clubId: 'club-bm',
      name: 'Rensuke Kunigami',
      age: 18,
      nat: 'Japón',
      pos: 'DC',
      sec: 'DFC',
      stats: { pace: 86, shooting: 93, passing: 74, dribbling: 81, defense: 75, physical: 96, goalkeeping: 15 },
      weapons: [
        { name: 'Wild Card Physique', type: 'physical', level: 95, description: 'Cuerpo ambidiestro forjado al límite de Noel Noa' },
        { name: 'Knuckle Shoot 40m', type: 'striker', level: 91, description: 'Disparo de potencia brutal sin efecto desestabilizador' }
      ],
      ego: 90,
      valYen: 65000000,
      wageYen: 1600000,
    },
    {
      clubId: 'club-bm',
      name: 'Gin Gagamaru',
      age: 17,
      nat: 'Japón',
      pos: 'POR',
      stats: { pace: 85, shooting: 70, passing: 72, dribbling: 70, defense: 83, physical: 89, goalkeeping: 91 },
      weapons: [
        { name: 'Scorpion Saves', type: 'gk', level: 94, description: 'Reflejos animales y despejes acrobáticos imposibles' }
      ],
      ego: 86,
      valYen: 45000000,
      wageYen: 1200000,
    },
    {
      clubId: 'club-bm',
      name: 'Ranze Kurona',
      age: 17,
      nat: 'Japón',
      pos: 'LD',
      sec: 'LI',
      stats: { pace: 92, shooting: 72, passing: 84, dribbling: 85, defense: 79, physical: 76, goalkeeping: 15 },
      weapons: [
        { name: 'Planet Hotline', type: 'speed', level: 89, description: 'Paredes a velocidad relámpago en el carril derecho' }
      ],
      ego: 80,
      valYen: 38000000,
      wageYen: 1000000,
    },
    {
      clubId: 'club-bm',
      name: 'Jingo Raichi',
      age: 18,
      nat: 'Japón',
      pos: 'MCD',
      sec: 'DFC',
      stats: { pace: 80, shooting: 72, passing: 75, dribbling: 76, defense: 87, physical: 94, goalkeeping: 15 },
      weapons: [
        { name: 'Protractor Man-Marking', type: 'physical', level: 90, description: 'Marca pegajosa incansable que asfixia a los creadores rivales' }
      ],
      ego: 88,
      valYen: 32000000,
      wageYen: 900000,
    },

    // PARIS X GEN
    {
      clubId: 'club-pxg',
      name: 'Rin Itoshi',
      age: 17,
      nat: 'Japón',
      pos: 'DC',
      sec: 'MCO',
      stats: { pace: 90, shooting: 94, passing: 91, dribbling: 92, defense: 78, physical: 86, goalkeeping: 15 },
      weapons: [
        { name: 'Berserker Flow', type: 'striker', level: 98, description: 'Destruye a los rivales explotando sus mejores fortalezas' },
        { name: 'Curved Trivela Shot', type: 'striker', level: 95, description: 'Curvas de efecto milimétricas desde fuera del área' }
      ],
      ego: 98,
      valYen: 240000000,
      wageYen: 5000000,
    },
    {
      clubId: 'club-pxg',
      name: 'Ryusei Shidou',
      age: 18,
      nat: 'Japón',
      pos: 'DC',
      stats: { pace: 92, shooting: 95, passing: 75, dribbling: 87, defense: 66, physical: 91, goalkeeping: 15 },
      weapons: [
        { name: 'Penalty Area Demon', type: 'striker', level: 96, description: 'Capacidad de rematar de espaldas a portería desde cualquier ángulo' },
        { name: 'Extreme Biology Awareness', type: 'physical', level: 94, description: 'Conciencia espacial intuitiva y acrobacias de chilena aérea' }
      ],
      ego: 97,
      valYen: 180000000,
      wageYen: 4000000,
    },
    {
      clubId: 'club-pxg',
      name: 'Charles Chevalier',
      age: 15,
      nat: 'Francia',
      pos: 'MC',
      sec: 'MCO',
      stats: { pace: 87, shooting: 82, passing: 96, dribbling: 91, defense: 65, physical: 72, goalkeeping: 15 },
      weapons: [
        { name: 'Contrarian Killer Passes', type: 'vision', level: 97, description: 'Pases imposibles teledirigidos desafiando toda la lógica defensiva' }
      ],
      ego: 91,
      valYen: 140000000,
      wageYen: 2800000,
    },
    {
      clubId: 'club-pxg',
      name: 'Tabito Karasu',
      age: 18,
      nat: 'Japón',
      pos: 'MCD',
      sec: 'MC',
      stats: { pace: 82, shooting: 81, passing: 88, dribbling: 89, defense: 88, physical: 86, goalkeeping: 15 },
      weapons: [
        { name: 'Feint Disguise & Pivot', type: 'dribble', level: 90, description: 'Uso de brazos y torso para proteger el balón y localizar el punto débil' }
      ],
      ego: 89,
      valYen: 68000000,
      wageYen: 1700000,
    },
    {
      clubId: 'club-pxg',
      name: 'Zantetsu Tsurugi',
      age: 18,
      nat: 'Japón',
      pos: 'ED',
      sec: 'DC',
      stats: { pace: 95, shooting: 84, passing: 72, dribbling: 81, defense: 68, physical: 84, goalkeeping: 15 },
      weapons: [
        { name: 'Initial Acceleration Burst', type: 'speed', level: 93, description: 'Aceleración explosiva en los primeros 10 metros' }
      ],
      ego: 83,
      valYen: 40000000,
      wageYen: 1100000,
    },

    // MANSHINE CITY
    {
      clubId: 'club-mc',
      name: 'Seishiro Nagi',
      age: 17,
      nat: 'Japón',
      pos: 'DC',
      sec: 'MCO',
      stats: { pace: 87, shooting: 94, passing: 85, dribbling: 93, defense: 64, physical: 88, goalkeeping: 15 },
      weapons: [
        { name: 'Black Hole Zero-Gravity Trap', type: 'striker', level: 98, description: 'Control de balón que anula el momentum de la pelota en el aire' },
        { name: '5-Stage Fake Revolver', type: 'striker', level: 95, description: 'Secuencia de controles aéreos para disparar en volea' }
      ],
      ego: 92,
      valYen: 120000000,
      wageYen: 3000000,
    },
    {
      clubId: 'club-mc',
      name: 'Reo Mikage',
      age: 17,
      nat: 'Japón',
      pos: 'MC',
      sec: 'MCD',
      stats: { pace: 85, shooting: 84, passing: 89, dribbling: 87, defense: 85, physical: 84, goalkeeping: 60 },
      weapons: [
        { name: 'Chameleon 99% Copy', type: 'vision', level: 94, description: 'Capacidad de copiar cualquier habilidad física o técnica al 99%' }
      ],
      ego: 89,
      valYen: 85000000,
      wageYen: 2200000,
    },
    {
      clubId: 'club-mc',
      name: 'Hyoma Chigiri',
      age: 17,
      nat: 'Japón',
      pos: 'EI',
      sec: 'LI',
      stats: { pace: 98, shooting: 88, passing: 81, dribbling: 88, defense: 71, physical: 78, goalkeeping: 15 },
      weapons: [
        { name: '44-Panther Snipe Zone', type: 'speed', level: 96, description: 'Carrera por banda izquierda y recorte al palo largo a 44 metros' }
      ],
      ego: 91,
      valYen: 90000000,
      wageYen: 2400000,
    },

    // UBERS
    {
      clubId: 'club-ubers',
      name: 'Shoei Barou',
      age: 18,
      nat: 'Japón',
      pos: 'DC',
      stats: { pace: 88, shooting: 95, passing: 72, dribbling: 89, defense: 68, physical: 96, goalkeeping: 15 },
      weapons: [
        { name: 'Predator Eye Sniping', type: 'striker', level: 97, description: 'Espera el momento exacto en que el portero pierde la vista del balón' },
        { name: 'Chop Dribble Violent Angle', type: 'dribble', level: 93, description: 'Recortes en 90 grados a máxima potencia destrozando tobillos' }
      ],
      ego: 99,
      valYen: 210000000,
      wageYen: 4500000,
    },
    {
      clubId: 'club-ubers',
      name: 'Don Lorenzo',
      age: 19,
      nat: 'Italia',
      pos: 'DFC',
      sec: 'MCD',
      stats: { pace: 86, shooting: 75, passing: 87, dribbling: 94, defense: 96, physical: 90, goalkeeping: 15 },
      weapons: [
        { name: 'Zombie Dribble & Lock', type: 'defense', level: 98, description: 'Movimientos desconcertantes sin centro de gravedad y anulación del as' }
      ],
      ego: 94,
      valYen: 250000000,
      wageYen: 5500000,
    },
    {
      clubId: 'club-ubers',
      name: 'Oliver Aiku',
      age: 19,
      nat: 'Japón',
      pos: 'DFC',
      stats: { pace: 83, shooting: 71, passing: 84, dribbling: 80, defense: 93, physical: 92, goalkeeping: 15 },
      weapons: [
        { name: 'Total Defense Metavision', type: 'defense', level: 93, description: 'Control de la línea del fuera de juego y anticipación aérea perfecta' }
      ],
      ego: 88,
      valYen: 70000000,
      wageYen: 1900000,
    },
    {
      clubId: 'club-ubers',
      name: 'Ikki Niko',
      age: 16,
      nat: 'Japón',
      pos: 'DFC',
      sec: 'MCD',
      stats: { pace: 80, shooting: 70, passing: 87, dribbling: 81, defense: 89, physical: 78, goalkeeping: 15 },
      weapons: [
        { name: 'Defensive Metavision & Tackle', type: 'vision', level: 91, description: 'Intercepción limpia justo cuando el delantero va a disparar' }
      ],
      ego: 87,
      valYen: 50000000,
      wageYen: 1400000,
    },

    // FC BARCHA
    {
      clubId: 'club-barcha',
      name: 'Meguru Bachira',
      age: 17,
      nat: 'Japón',
      pos: 'ED',
      sec: 'EI',
      stats: { pace: 89, shooting: 87, passing: 90, dribbling: 97, defense: 67, physical: 79, goalkeeping: 15 },
      weapons: [
        { name: 'Monster Ginga Dribble', type: 'dribble', level: 97, description: 'Capoeira y danza impredecible superando a defensas en 1v1 y 1v2' },
        { name: 'Selfish Hyper Assist', type: 'vision', level: 92, description: 'Pases que despiertan el instinto más puro de su compañero' }
      ],
      ego: 94,
      valYen: 160000000,
      wageYen: 3500000,
    },
    {
      clubId: 'club-barcha',
      name: 'Eita Otoya',
      age: 18,
      nat: 'Japón',
      pos: 'EI',
      sec: 'ED',
      stats: { pace: 93, shooting: 83, passing: 82, dribbling: 87, defense: 70, physical: 78, goalkeeping: 15 },
      weapons: [
        { name: 'Ninja Shadow Run', type: 'speed', level: 90, description: 'Infiltración indetectable a la espalda de los centrales' }
      ],
      ego: 84,
      valYen: 55000000,
      wageYen: 1500000,
    },

    // REAL MADRID
    {
      clubId: 'club-rm',
      name: 'Sae Itoshi',
      age: 18,
      nat: 'Japón',
      pos: 'MCO',
      sec: 'MC',
      stats: { pace: 88, shooting: 91, passing: 98, dribbling: 96, defense: 74, physical: 82, goalkeeping: 15 },
      weapons: [
        { name: 'World NextGen Vision', type: 'vision', level: 99, description: 'Calcula trayectorias, efecto, velocidad del césped y postura defensiva' },
        { name: 'Passive Linebreaker', type: 'vision', level: 96, description: 'Pases que obligan al receptor a convertirse en goleador' }
      ],
      ego: 96,
      valYen: 350000000,
      wageYen: 7000000,
    },
    {
      clubId: 'club-rm',
      name: 'Leonardo Luna',
      age: 23,
      nat: 'España',
      pos: 'DC',
      stats: { pace: 91, shooting: 95, passing: 86, dribbling: 93, defense: 60, physical: 88, goalkeeping: 15 },
      weapons: [
        { name: 'Galactico Elegance', type: 'striker', level: 97, description: 'Frialdad implacable y definición perfecta en las esquinas' }
      ],
      ego: 95,
      valYen: 400000000,
      wageYen: 8500000,
    },

    // BLUE LOCK ELEVEN
    {
      clubId: 'club-bl11',
      name: 'Kenyu Yukimiya',
      age: 18,
      nat: 'Japón',
      pos: 'EI',
      sec: 'LI',
      stats: { pace: 90, shooting: 86, passing: 82, dribbling: 94, defense: 72, physical: 82, goalkeeping: 15 },
      weapons: [
        { name: 'Sword Screw Shot', type: 'dribble', level: 92, description: 'Disparo con efecto helicoidal descendente que engaña al portero' }
      ],
      ego: 90,
      valYen: 50000000,
      wageYen: 1400000,
    },
    {
      clubId: 'club-bl11',
      name: 'Yo Hiyori',
      age: 17,
      nat: 'Japón',
      pos: 'MCO',
      sec: 'MC',
      stats: { pace: 84, shooting: 81, passing: 94, dribbling: 89, defense: 73, physical: 75, goalkeeping: 15 },
      weapons: [
        { name: 'Reflex Sync Metavision', type: 'vision', level: 93, description: 'Sincronización telepática de pases al milímetro con el delantero' }
      ],
      ego: 89,
      valYen: 55000000,
      wageYen: 1500000,
    },
  ];

  const players: Player[] = [];

  // Register Blue Lock stars first
  blueLockStars.forEach((star, idx) => {
    const ovr = calculateOvr(star.pos, star.stats);
    players.push({
      id: `star-${idx}-${star.name.toLowerCase().replace(/[^a-z]/g, '')}`,
      clubId: star.clubId,
      name: star.name,
      age: star.age,
      nationality: star.nat,
      position: star.pos,
      secondaryPosition: star.sec,
      overall: ovr,
      potential: Math.min(99, ovr + (star.age < 19 ? rnd(4, 8) : rnd(1, 3))),
      stats: star.stats,
      weapons: star.weapons,
      egoRating: star.ego,
      flowState: false,
      fitness: 100,
      morale: 85,
      form: 80,
      marketValueYen: star.valYen,
      weeklyWageYen: star.wageYen,
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
      seasonAverageRating: 7.0,
    });
  });

  // Generadores de nombres por país para completar plantillas
  const namesByCountry: Record<string, { first: string[]; last: string[] }> = {
    Alemania: {
      first: ['Lukas', 'Julian', 'Maximilian', 'Felix', 'Niklas', 'Florian', 'Leon', 'Tim', 'Jan', 'Moritz', 'Finn'],
      last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer'],
    },
    Francia: {
      first: ['Lucas', 'Théo', 'Antoine', 'Hugo', 'Enzo', 'Nathan', 'Mathis', 'Louis', 'Arthur', 'Gabin', 'Jules'],
      last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'],
    },
    Inglaterra: {
      first: ['Harry', 'Oliver', 'George', 'Jack', 'Charlie', 'Jacob', 'Alfie', 'Freddie', 'Oscar', 'Leo', 'Archie'],
      last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright'],
    },
    Italia: {
      first: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Matteo', 'Tommaso'],
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'],
    },
    España: {
      first: ['Alejandro', 'Pablo', 'Daniel', 'David', 'Adrián', 'Javier', 'Álvaro', 'Marcos', 'Sergio', 'Hugo'],
      last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez'],
    },
    'Países Bajos': {
      first: ['Daan', 'Sem', 'Milan', 'Levi', 'Lucas', 'Finn', 'Jesse', 'Liam', 'Thomas', 'Bram'],
      last: ['de Jong', 'van Dijk', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder'],
    },
    Portugal: {
      first: ['Rodrigo', 'Martim', 'Afonso', 'Tomás', 'Tiago', 'Diogo', 'Guilherme', 'Gabriel', 'Gonçalo'],
      last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus'],
    },
    Japón: {
      first: ['Kenji', 'Daiki', 'Hiroshi', 'Sota', 'Ren', 'Haruto', 'Yuto', 'Takumi', 'Kaito', 'Shota'],
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi'],
    },
  };

  const defaultPositions: Position[] = [
    'POR', 'POR',
    'DFC', 'DFC', 'DFC', 'DFC',
    'LI', 'LI',
    'LD', 'LD',
    'MCD', 'MCD',
    'MC', 'MC', 'MC',
    'MCO',
    'EI', 'ED',
    'DC', 'DC', 'DC'
  ];

  // Fill squads so each club has at least 21 players
  clubsData.forEach((club) => {
    const existing = players.filter((p) => p.clubId === club.id);
    const existingPositions = existing.map((p) => p.position);

    defaultPositions.forEach((pos, pIdx) => {
      // Check if we need more of this position
      const countInClub = existingPositions.filter((p) => p === pos).length;
      if (countInClub > 0 && existingPositions.length >= 21) {
        return;
      }

      const countryPool = namesByCountry[club.country] || namesByCountry['España'];
      const fn = countryPool.first[rnd(0, countryPool.first.length - 1)];
      const ln = countryPool.last[rnd(0, countryPool.last.length - 1)];
      const fullName = `${fn} ${ln}`;

      const age = rnd(17, 26);
      const baseLvl = club.level + rnd(-6, 4);

      const stats: PlayerStats = {
        pace: Math.min(96, Math.max(55, baseLvl + rnd(-10, 10))),
        shooting: pos === 'DC' || pos === 'EI' || pos === 'ED' || pos === 'MCO'
          ? Math.min(95, Math.max(65, baseLvl + rnd(-5, 8)))
          : Math.min(80, Math.max(35, baseLvl - rnd(10, 30))),
        passing: Math.min(95, Math.max(50, baseLvl + rnd(-8, 8))),
        dribbling: Math.min(95, Math.max(55, baseLvl + rnd(-8, 8))),
        defense: pos === 'DFC' || pos === 'MCD' || pos === 'LI' || pos === 'LD'
          ? Math.min(95, Math.max(65, baseLvl + rnd(-5, 8)))
          : Math.min(75, Math.max(30, baseLvl - rnd(10, 25))),
        physical: Math.min(95, Math.max(60, baseLvl + rnd(-6, 8))),
        goalkeeping: pos === 'POR' ? Math.min(94, Math.max(70, baseLvl + rnd(-3, 6))) : 15,
      };

      const ovr = calculateOvr(pos, stats);
      const valYen = Math.round((ovr * ovr * ovr * 22) + rnd(1000000, 5000000));
      const wageYen = Math.round(valYen * 0.025);

      players.push({
        id: `p-${club.id}-${pIdx}-${Date.now()}-${rnd(100, 999)}`,
        clubId: club.id,
        name: fullName,
        age,
        nationality: club.country,
        position: pos,
        overall: ovr,
        potential: Math.min(98, ovr + (age < 21 ? rnd(6, 12) : rnd(1, 4))),
        stats,
        weapons: [],
        egoRating: rnd(60, 80),
        flowState: false,
        fitness: 100,
        morale: rnd(70, 90),
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
      });
    });
  });

  // Assign starting XI and captains for all clubs
  const clubs: Club[] = clubsData.map((cd) => {
    const clubPlayers = players.filter((p) => p.clubId === cd.id);

    // Pick 1 GK
    const gks = clubPlayers.filter((p) => p.position === 'POR').sort((a, b) => b.overall - a.overall);
    const chosenGk = gks[0] || clubPlayers[0];

    // Pick defenders
    const defs = clubPlayers.filter((p) => ['DFC', 'LI', 'LD'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    // Pick midfielders
    const mids = clubPlayers.filter((p) => ['MCD', 'MC', 'MCO'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    // Pick forwards
    const fwds = clubPlayers.filter((p) => ['DC', 'EI', 'ED'].includes(p.position)).sort((a, b) => b.overall - a.overall);

    let chosenDefs: Player[] = [];
    let chosenMids: Player[] = [];
    let chosenFwds: Player[] = [];

    if (cd.formation === '3-5-2') {
      chosenDefs = defs.slice(0, 3);
      chosenMids = mids.slice(0, 5);
      chosenFwds = fwds.slice(0, 2);
    } else if (cd.formation === '5-3-2') {
      chosenDefs = defs.slice(0, 5);
      chosenMids = mids.slice(0, 3);
      chosenFwds = fwds.slice(0, 2);
    } else if (cd.formation === '4-2-3-1' || cd.formation === '4-3-3') {
      chosenDefs = defs.slice(0, 4);
      chosenMids = mids.slice(0, 3);
      chosenFwds = fwds.slice(0, 3);
    } else {
      // 4-4-2
      chosenDefs = defs.slice(0, 4);
      chosenMids = mids.slice(0, 4);
      chosenFwds = fwds.slice(0, 2);
    }

    const starting = [chosenGk, ...chosenDefs, ...chosenMids, ...chosenFwds].filter(Boolean);
    const startingIds = starting.slice(0, 11).map((p) => p.id);

    // Bench
    const bench = clubPlayers.filter((p) => !startingIds.includes(p.id)).sort((a, b) => b.overall - a.overall).slice(0, 7);
    const benchIds = bench.map((p) => p.id);

    // Captain
    const highestRep = [...starting].sort((a, b) => b.overall - a.overall)[0] || clubPlayers[0];

    return {
      ...cd,
      league: 'Neo Egoist League',
      startingXI: startingIds,
      substitutes: benchIds,
      captainId: highestRep.id,
      penaltyTakerId: starting.find((p) => p.position === 'DC')?.id || highestRep.id,
      freeKickTakerId: starting.find((p) => ['MCO', 'MC', 'EI'].includes(p.position))?.id || highestRep.id,
      mentalidad: 'equilibrada',
      presion: 'media',
      estiloPase: 'posesion',
    };
  });

  return { clubs, players };
}
