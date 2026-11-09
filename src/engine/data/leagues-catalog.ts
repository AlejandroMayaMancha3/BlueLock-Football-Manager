import { Club, Player, Position, Formation, CountryLeague, Weapon } from '@/types/football-manager';
import { calculateOvr } from '@/engine/game-data';
import { SPAIN_CLUBS } from './leagues/spain';
import { ENGLAND_CLUBS } from './leagues/england';
import { GERMANY_CLUBS } from './leagues/germany';
import { ITALY_CLUBS } from './leagues/italy';
import { FRANCE_CLUBS } from './leagues/france';

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

// ==============================================================================
// CATÁLOGO MAESTRO DE 480 CLUBES (24 POR CADA UNA DE LAS 20 DIVISIONES)
// ==============================================================================
export const CLUBS_MASTER_CATALOG: ClubTemplate[] = [
  ...SPAIN_CLUBS,
  ...ENGLAND_CLUBS,
  ...GERMANY_CLUBS,
  ...ITALY_CLUBS,
  ...FRANCE_CLUBS,
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
