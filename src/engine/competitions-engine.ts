import {
  CountryLeague,
  LeagueTableRow,
  TierLevel,
  ClubTrophyRecord,
  EuropeanQualificationEntry,
  UefaTournamentType,
  Club,
  SeasonHistoryEntry,
  MatchFixture,
} from '@/types/football-manager';
import { getTrophyForDivision, getTrophyForCup, getTrophyForUefa } from './data/trophies-catalog';
import { getDivisionById } from './data/divisions-catalog';

/**
 * SISTEMA UEFA Y ASIGNACIÓN DE PLAZAS EUROPEAS CON EFECTO ARRASTRE DE COPAS
 *
 * Aplica las reglas oficiales para las 5 grandes ligas:
 * - España, Inglaterra, Italia, Alemania: Top 4 -> UCL, 5.º -> UEL, Copa -> UEL, 6.º -> UECL
 * - Francia: Top 3 directos + 4.º -> UCL, 5.º -> UEL, Copa -> UEL, 6.º -> UECL
 * - Efecto Arrastre: Si el campeón de copa ya clasifica por liga, su cupo de UEL pasa
 *   al siguiente clasificado de liga (6.º), y el de Conference pasa al 7.º
 * - Particularidad Inglesa (FA Cup + EFL Cup): Si el campeón de EFL Cup ya va a Europa,
 *   la plaza de Conference pasa al 7.º (o 8.º si ambos arrastran).
 * - Plazas Extraordinarias (EPS): Las 2 ligas con mejor coeficiente otorgan plaza extra a UCL a su 5.º.
 */
export function calculateEuropeanQualifications(
  countryTables: Record<CountryLeague, LeagueTableRow[]>,
  cupWinners: Record<
    CountryLeague,
    { mainCupWinnerClubId: string; secondaryCupWinnerClubId?: string }
  >,
  options?: {
    performanceSpotCountries?: CountryLeague[]; // Las 2 ligas con mejor coeficiente
    uclDefendingChampionClubId?: string;
    uelDefendingChampionClubId?: string;
    ueclDefendingChampionClubId?: string;
  }
): Record<CountryLeague, EuropeanQualificationEntry[]> {
  const result: Record<CountryLeague, EuropeanQualificationEntry[]> = {
    Spain: [],
    England: [],
    Germany: [],
    Italy: [],
    France: [],
  };

  const perfSet = new Set(options?.performanceSpotCountries || ['Spain', 'England']);

  (Object.keys(countryTables) as CountryLeague[]).forEach((country) => {
    const table = countryTables[country] || [];
    if (table.length === 0) return;

    const entries: EuropeanQualificationEntry[] = [];
    const cups = cupWinners[country] || { mainCupWinnerClubId: '' };
    const hasPerformanceSpot = perfSet.has(country);

    // Índices de clasificación
    // UCL base slots:
    // Inglaterra, España, Italia, Alemania: Top 4
    // Francia: Top 3 directos + 4.º fase previa/liga
    const uclDirectSpots = country === 'France' ? 3 : 4;
    const uclExtraFranceSpot = country === 'France' ? 1 : 0;
    const totalUclLeagueSpots = uclDirectSpots + uclExtraFranceSpot + (hasPerformanceSpot ? 1 : 0);

    // 1. PLAZAS DE CHAMPIONS LEAGUE POR LIGA
    for (let i = 0; i < totalUclLeagueSpots && i < table.length; i++) {
      const row = table[i];
      const pos = i + 1;
      let reason = `${pos}.º puesto en liga nacional`;
      if (hasPerformanceSpot && pos === totalUclLeagueSpots) {
        reason = `5.º puesto en liga nacional (Plaza de Rendimiento Europeo / EPS)`;
      }

      entries.push({
        clubId: row.clubId,
        clubName: row.clubName,
        country,
        leaguePosition: pos,
        tournament: 'ucl',
        qualificationReason: reason,
        stage: 'league_phase',
      });
    }

    const uclClubIds = new Set(entries.map((e) => e.clubId));

    // 2. EVALUACIÓN DE LA COPA NACIONAL PRINCIPAL (Copa del Rey, FA Cup, Coppa Italia, DFB-Pokal, Coupe de France)
    const mainCupWinnerId = cups.mainCupWinnerClubId;
    const cupWinnerInUcl = uclClubIds.has(mainCupWinnerId);

    // Si el campeón de copa no está en Champions, clasifica directamente a Europa League
    let mainCupRollDown = false;
    if (mainCupWinnerId && !cupWinnerInUcl) {
      const cupWinnerRow = table.find((r) => r.clubId === mainCupWinnerId);
      const pos = cupWinnerRow ? table.indexOf(cupWinnerRow) + 1 : 99;
      entries.push({
        clubId: mainCupWinnerId,
        clubName: cupWinnerRow?.clubName || 'Campeón de Copa',
        country,
        leaguePosition: pos,
        tournament: 'uel',
        qualificationReason: 'Campeón de Copa Nacional (Pase directo a Europa League)',
        stage: 'league_phase',
      });
    } else {
      // EFECTO ARRASTRE: El campeón de copa ya va a Champions League -> El cupo pasa a la liga
      mainCupRollDown = true;
    }

    // 3. PLAZAS DE EUROPA LEAGUE Y CONFERENCE LEAGUE POR LIGA
    // Buscar los mejores equipos en liga que aún no tengan billete europeo
    const assignedIds = new Set(entries.map((e) => e.clubId));
    const eligibleLeagueRows = table.filter((r) => !assignedIds.has(r.clubId));

    // Plaza de UEL por liga (habitualmente el 5.º, o 6.º si hubo EPS en esa liga)
    if (eligibleLeagueRows.length > 0) {
      const uelRow = eligibleLeagueRows.shift()!;
      const pos = table.indexOf(uelRow) + 1;
      entries.push({
        clubId: uelRow.clubId,
        clubName: uelRow.clubName,
        country,
        leaguePosition: pos,
        tournament: 'uel',
        qualificationReason: `${pos}.º puesto en liga nacional (Acceso Europa League)`,
        stage: 'league_phase',
      });
      assignedIds.add(uelRow.clubId);
    }

    // Si la copa nacional arrastró plaza porque su campeón ya estaba en Champions,
    // el siguiente equipo mejor posicionado de la liga recibe el cupo de Europa League
    if (mainCupRollDown && eligibleLeagueRows.length > 0) {
      const rollRow = eligibleLeagueRows.shift()!;
      const pos = table.indexOf(rollRow) + 1;
      entries.push({
        clubId: rollRow.clubId,
        clubName: rollRow.clubName,
        country,
        leaguePosition: pos,
        tournament: 'uel',
        qualificationReason: `${pos}.º puesto en liga (Efecto arrastre por campeón de copa clasificado a Champions)`,
        stage: 'league_phase',
      });
      assignedIds.add(rollRow.clubId);
    }

    // 4. CONFERENCE LEAGUE (Y PARTICULARIDAD INGLESA EFL CUP)
    if (country === 'England') {
      const eflWinnerId = cups.secondaryCupWinnerClubId;
      const eflWinnerAlreadyInEurope = eflWinnerId && assignedIds.has(eflWinnerId);

      if (eflWinnerId && !eflWinnerAlreadyInEurope) {
        const eflRow = table.find((r) => r.clubId === eflWinnerId);
        const pos = eflRow ? table.indexOf(eflRow) + 1 : 99;
        entries.push({
          clubId: eflWinnerId,
          clubName: eflRow?.clubName || 'Campeón de EFL Cup',
          country,
          leaguePosition: pos,
          tournament: 'uecl',
          qualificationReason: 'Campeón de la EFL Cup (Carabao Cup)',
          stage: 'playoff',
        });
        assignedIds.add(eflWinnerId);
      } else {
        // Efecto arrastre inglés: el cupo de EFL Cup pasa al mejor ubicado disponible en Premier (7.º u 8.º)
        if (eligibleLeagueRows.length > 0) {
          const ueclRow = eligibleLeagueRows.shift()!;
          const pos = table.indexOf(ueclRow) + 1;
          entries.push({
            clubId: ueclRow.clubId,
            clubName: ueclRow.clubName,
            country,
            leaguePosition: pos,
            tournament: 'uecl',
            qualificationReason: `${pos}.º puesto en Premier League (Efecto arrastre de EFL Cup)`,
            stage: 'playoff',
          });
          assignedIds.add(ueclRow.clubId);
        }
      }
    } else {
      // España, Alemania, Italia, Francia:
      // Plaza de Conference League al siguiente de la tabla (6.º o 7.º por arrastre)
      if (eligibleLeagueRows.length > 0) {
        const ueclRow = eligibleLeagueRows.shift()!;
        const pos = table.indexOf(ueclRow) + 1;
        const isRolled = mainCupRollDown;
        entries.push({
          clubId: ueclRow.clubId,
          clubName: ueclRow.clubName,
          country,
          leaguePosition: pos,
          tournament: 'uecl',
          qualificationReason: isRolled
            ? `${pos}.º puesto en liga nacional (Efecto arrastre de cupo continental)`
            : `${pos}.º puesto en liga nacional (Plaza Conference League)`,
          stage: 'playoff',
        });
        assignedIds.add(ueclRow.clubId);
      }
    }

    result[country] = entries;
  });

  return result;
}

/**
 * Registra y otorga un trofeo oficial al palmarés histórico del club
 */
export function awardTrophyToClub(
  club: Club,
  trophyKey: string,
  season: number,
  options?: {
    dateStr?: string;
    customOfficialName?: string;
    customCompetitionName?: string;
  }
): ClubTrophyRecord {
  let trophyDef = getTrophyForUefa(trophyKey as any);
  if (!trophyDef || !['ucl', 'uel', 'uecl'].includes(trophyKey)) {
    const tier = (club.tier || 1) as TierLevel;
    const country = (club.country || 'Spain') as CountryLeague;
    if (trophyKey.includes('cup')) {
      trophyDef = getTrophyForCup(country, trophyKey.includes('secondary'));
    } else {
      trophyDef = getTrophyForDivision(country, tier);
    }
  }

  const record: ClubTrophyRecord = {
    id: `trophy-${Date.now()}-${club.id}-${Math.floor(Math.random() * 1000)}`,
    clubId: club.id,
    season,
    trophyKey: trophyDef.key,
    trophyType: trophyDef.trophyType,
    officialName: options?.customOfficialName || trophyDef.officialName,
    popularName: trophyDef.popularName,
    competitionName: options?.customCompetitionName || trophyDef.competitionName,
    country: trophyDef.country,
    dateStr: options?.dateStr || `Temporada ${season}`,
    iconType: trophyDef.iconType,
    tier: trophyDef.tier,
  };

  return record;
}

/**
 * Reconstruye retroactivamente los trofeos históricos del club a partir de su historial de temporadas.
 * Si el usuario ya fue campeón en temporadas anteriores (ej. Puesto 1.º en Temporada 2 y Temporada 3),
 * le otorga automáticamente sus títulos oficiales correspondientes para llenar su vitrina.
 */
export function reconstructClubTrophiesFromHistory(
  club: Club,
  seasonHistory: SeasonHistoryEntry[],
  existingTrophies: ClubTrophyRecord[] = []
): ClubTrophyRecord[] {
  const trophyMap = new Map<string, ClubTrophyRecord>();
  existingTrophies.forEach((t) => trophyMap.set(t.id, t));

  const country = (club.country || 'Spain') as CountryLeague;

  seasonHistory.forEach((h) => {
    // Si el usuario quedó campeón de la división en esa temporada
    if (
      (h.userOutcome === 'champion' || h.userPosition === 1 || h.championClubId === club.id) &&
      h.userClubId === club.id
    ) {
      const season = h.seasonNumber;
      const alreadyHas = Array.from(trophyMap.values()).some(
        (t) => t.season === season && ['league_t1', 'league_t2', 'league_t3', 'league_t4'].includes(t.trophyType)
      );

      if (!alreadyHas) {
        const tier = (club.tier || 1) as TierLevel;
        const trophyDef = getTrophyForDivision(country, tier);
        const record: ClubTrophyRecord = {
          id: `trophy-hist-s${season}-${club.id}`,
          clubId: club.id,
          season,
          trophyKey: trophyDef.key,
          trophyType: trophyDef.trophyType,
          officialName: trophyDef.officialName,
          popularName: trophyDef.popularName,
          competitionName: h.divisionName || trophyDef.competitionName,
          country,
          dateStr: `Temporada ${season}`,
          iconType: trophyDef.iconType,
          tier: trophyDef.tier,
        };
        trophyMap.set(record.id, record);
      }
    }
  });

  return Array.from(trophyMap.values()).sort((a, b) => b.season - a.season);
}

/**
 * Genera el calendario de ligas para los clubes de la división utilizando round-robin
 */
function generateLeagueMatchdays(clubs: Club[]): Array<Array<[string, string]>> {
  const n = clubs.length;
  const clubIds = clubs.map((c) => c.id);
  const tempIds = [...clubIds];
  const half = n / 2;

  const firstLegRounds: Array<Array<[string, string]>> = [];

  for (let r = 0; r < n - 1; r++) {
    const roundPairs: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      let home = tempIds[i];
      let away = tempIds[n - 1 - i];
      if ((i + r) % 2 === 1) {
        [home, away] = [away, home];
      }
      roundPairs.push([home, away]);
    }
    firstLegRounds.push(roundPairs);

    const last = tempIds.pop()!;
    tempIds.splice(1, 0, last);
  }

  // Segunda vuelta: invirtiendo condición de local y visitante
  const secondLegRounds: Array<Array<[string, string]>> = firstLegRounds.map((pairs) =>
    pairs.map(([h, a]) => [a, h])
  );

  return [...firstLegRounds, ...secondLegRounds];
}

/**
 * Obtiene los nombres oficiales y claves de la copa nacional según el país
 */
export function getNationalCupInfo(country: CountryLeague): {
  name: string;
  trophyKey: string;
  roundNames: string[];
} {
  switch (country) {
    case 'England':
      return {
        name: 'The FA Cup',
        trophyKey: 'en_fa_cup',
        roundNames: [
          'FA Cup · 3.ª Ronda (1/32)',
          'FA Cup · 4.ª Ronda (1/16)',
          'FA Cup · Octavos de Final',
          'FA Cup · Cuartos de Final',
          'FA Cup · Semifinales',
          '¡Gran Final de The FA Cup!',
        ],
      };
    case 'Germany':
      return {
        name: 'DFB-Pokal',
        trophyKey: 'de_dfb_pokal',
        roundNames: [
          'DFB-Pokal · 1.ª Ronda (1/32)',
          'DFB-Pokal · 2.ª Ronda (1/16)',
          'DFB-Pokal · Octavos de Final',
          'DFB-Pokal · Cuartos de Final',
          'DFB-Pokal · Semifinales',
          '¡Gran Final de la DFB-Pokal!',
        ],
      };
    case 'Italy':
      return {
        name: 'Coppa Italia',
        trophyKey: 'it_coppa_italia',
        roundNames: [
          'Coppa Italia · Dieciseisavos (1/32)',
          'Coppa Italia · 1/16 de Final',
          'Coppa Italia · Octavos de Final',
          'Coppa Italia · Cuartos de Final',
          'Coppa Italia · Semifinales',
          '¡Gran Final de la Coppa Italia!',
        ],
      };
    case 'France':
      return {
        name: 'Coupe de France',
        trophyKey: 'fr_coupe_de_france',
        roundNames: [
          'Coupe de France · 1/32 de Final',
          'Coupe de France · 1/16 de Final',
          'Coupe de France · Octavos de Final',
          'Coupe de France · Cuartos de Final',
          'Coupe de France · Semifinales',
          '¡Gran Final de la Coupe de France!',
        ],
      };
    case 'Spain':
    default:
      return {
        name: 'Copa del Rey',
        trophyKey: 'es_copa_del_rey',
        roundNames: [
          'Copa del Rey · 1/32 de Final',
          'Copa del Rey · 1/16 de Final',
          'Copa del Rey · Octavos de Final',
          'Copa del Rey · Cuartos de Final',
          'Copa del Rey · Semifinales',
          '¡Gran Final de la Copa del Rey!',
        ],
      };
  }
}

/**
 * GENERADOR INTEGRAL DEL CALENDARIO DE TEMPORADA CON COMPETICIONES EUROPEAS Y COPA NACIONAL
 *
 * Cumple estrictamente con las reglas:
 * 1. Partidos Europeos (Champions League): Rivales EXCLUSIVAMENTE de otras ligas/países (4 en casa, 4 fuera).
 * 2. Copas Nacionales: Rivales EXCLUSIVAMENTE del mismo país, pero de distintas divisiones (Tier 1 a 4).
 * 3. Partidos de Liga: 46 jornadas regulares de la división del club.
 * 4. Intercalación cronológica realista para que cada jornada contenga un partido disputable por el usuario.
 */
export function generateSeasonFixturesWithTournaments(
  season: number,
  divisionClubs: Club[],
  allClubs: Club[],
  userClubId: string,
  options?: {
    europeanTournament?: 'ucl' | 'uel' | 'uecl';
  }
): MatchFixture[] {
  const userClub =
    allClubs.find((c) => c.id === userClubId) ||
    divisionClubs.find((c) => c.id === userClubId) ||
    divisionClubs[0];

  const userCountry = (userClub?.country || 'Spain') as CountryLeague;
  const userDivId = userClub?.divisionId || userClub?.league || 'es_laliga';
  const divisionInfo = getDivisionById(userDivId);
  const leagueName = divisionInfo?.name || 'Liga Regular';

  // 1. GENERAR 46 JORNADAS DE LIGA REGULAR
  const leagueMatchdays = generateLeagueMatchdays(divisionClubs);

  // 2. SELECCIONAR RIVALES EUROPEOS (EXCLUSIVAMENTE DE OTROS PAÍSES)
  const euroTournament = options?.europeanTournament || 'ucl';
  const euroName =
    euroTournament === 'ucl'
      ? 'UEFA Champions League'
      : euroTournament === 'uel'
      ? 'UEFA Europa League'
      : 'UEFA Conference League';

  const otherCountries: CountryLeague[] = (['Spain', 'England', 'Germany', 'Italy', 'France'] as CountryLeague[]).filter(
    (c) => c !== userCountry
  );

  // Seleccionar los clubes más prestigiosos de cada uno de los otros 4 países
  const europeanRivalPool: Club[] = [];
  otherCountries.forEach((country) => {
    const foreignClubs = allClubs
      .filter((c) => c.country === country && c.tier === 1)
      .sort((a, b) => b.level - a.level);
    // Tomar los 2 mejores de cada país para la fase suiza de 8 partidos
    if (foreignClubs[0]) europeanRivalPool.push(foreignClubs[0]);
    if (foreignClubs[1]) europeanRivalPool.push(foreignClubs[1]);
  });

  // Si por alguna razón faltan clubes, completar con cualquier club extranjero de primer nivel
  if (europeanRivalPool.length < 8) {
    const extras = allClubs
      .filter((c) => c.country !== userCountry && !europeanRivalPool.some((p) => p.id === c.id))
      .sort((a, b) => b.level - a.level);
    europeanRivalPool.push(...extras.slice(0, 8 - europeanRivalPool.length));
  }

  // Seleccionar 4 rivales adicionales para las rondas eliminatorias (Octavos, Cuartos, Semis, Final)
  const euroKnockoutRivals: Club[] = allClubs
    .filter((c) => c.country !== userCountry && !europeanRivalPool.some((p) => p.id === c.id))
    .sort((a, b) => b.level - a.level)
    .slice(0, 4);

  // Si no hay suficientes extras, reutilizar los gigantes extranjeros más fuertes en orden inverso
  while (euroKnockoutRivals.length < 4) {
    euroKnockoutRivals.push(europeanRivalPool[euroKnockoutRivals.length % europeanRivalPool.length]);
  }

  // 3. SELECCIONAR RIVALES DE COPA NACIONAL (EXCLUSIVAMENTE DEL MISMO PAÍS, DISTINTAS DIVISIONES)
  const cupInfo = getNationalCupInfo(userCountry);
  const nationalClubs = allClubs.filter((c) => c.country === userCountry && c.id !== userClubId);

  // Intentar seleccionar rivales de distintas categorías para una progresión auténtica de Copa
  const tier4Clubs = nationalClubs.filter((c) => c.tier === 4);
  const tier3Clubs = nationalClubs.filter((c) => c.tier === 3);
  const tier2Clubs = nationalClubs.filter((c) => c.tier === 2);
  const tier1Clubs = nationalClubs.filter((c) => c.tier === 1).sort((a, b) => b.level - a.level);

  const cupRivals: Club[] = [
    tier4Clubs[Math.floor(Math.random() * tier4Clubs.length)] || nationalClubs[0],
    tier3Clubs[Math.floor(Math.random() * tier3Clubs.length)] || nationalClubs[1] || nationalClubs[0],
    tier2Clubs[Math.floor(Math.random() * tier2Clubs.length)] || nationalClubs[2] || nationalClubs[0],
    tier1Clubs[Math.floor(Math.random() * Math.min(6, tier1Clubs.length))] || nationalClubs[3] || nationalClubs[0],
    tier1Clubs[1] || nationalClubs[4] || nationalClubs[0],
    tier1Clubs[0] || nationalClubs[0], // Gran Final de Copa contra el rival de mayor prestigio del país
  ];

  // 4. ESTRUCTURA CRONOLÓGICA DE JORNADAS DE LA TEMPORADA
  // Intercalar partidos de liga, copa y competiciones continentales
  interface ScheduledSlot {
    type: 'league' | 'cup' | 'uefa_league' | 'uefa_knockout';
    leagueIndex?: number;
    cupIndex?: number;
    uefaIndex?: number;
  }

  const scheduleSlots: ScheduledSlot[] = [];
  let leagueIdx = 0;
  let cupIdx = 0;
  let uefaLeagueIdx = 0;
  let uefaKoIdx = 0;

  // Intercalar cronológicamente los 64 eventos
  // Fase de otoño / invierno
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 1
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 2
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 3 (UCL J1)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 4
  scheduleSlots.push({ type: 'cup', cupIndex: cupIdx++ }); // 5 (Copa 1/32)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 6
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 7 (UCL J2)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 8
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 9
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 10 (UCL J3)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 11
  scheduleSlots.push({ type: 'cup', cupIndex: cupIdx++ }); // 12 (Copa 1/16)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 13
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 14
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 15 (UCL J4)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 16
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 17
  scheduleSlots.push({ type: 'cup', cupIndex: cupIdx++ }); // 18 (Copa Octavos)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 19
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 20
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 21 (UCL J5)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 22
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 23
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 24
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 25 (UCL J6)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 26
  scheduleSlots.push({ type: 'cup', cupIndex: cupIdx++ }); // 27 (Copa Cuartos)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 28
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 29
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 30 (UCL J7)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 31
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 32
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 33
  scheduleSlots.push({ type: 'uefa_league', uefaIndex: uefaLeagueIdx++ }); // 34 (UCL J8)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 35 (Fin 1ª Vuelta)

  // Fase de primavera / desenlace de títulos
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 36
  scheduleSlots.push({ type: 'cup', cupIndex: cupIdx++ }); // 37 (Copa Semifinal)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 38
  scheduleSlots.push({ type: 'uefa_knockout', uefaIndex: uefaKoIdx++ }); // 39 (UCL Octavos)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 40
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 41
  scheduleSlots.push({ type: 'uefa_knockout', uefaIndex: uefaKoIdx++ }); // 42 (UCL Cuartos)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 43
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 44
  scheduleSlots.push({ type: 'uefa_knockout', uefaIndex: uefaKoIdx++ }); // 45 (UCL Semifinal)
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // 46
  scheduleSlots.push({ type: 'cup', cupIndex: cupIdx++ }); // 47 (¡Gran Final de Copa Nacional!)

  // Resto de jornadas de liga hasta la jornada 45
  while (leagueIdx < 45) {
    scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ });
  }

  // Penúltimo: Jornada 46 decisiva de liga regular
  scheduleSlots.push({ type: 'league', leagueIndex: leagueIdx++ }); // Última jornada liguera

  // Colofón de la temporada: ¡Gran Final Continental de UEFA Champions League!
  scheduleSlots.push({ type: 'uefa_knockout', uefaIndex: uefaKoIdx++ });

  // 5. CONVERTIR SLOTS A FIXTURES COMPLETOS
  const allGeneratedFixtures: MatchFixture[] = [];

  scheduleSlots.forEach((slot, slotIdx) => {
    const roundNumber = slotIdx + 1;

    if (slot.type === 'league' && slot.leagueIndex !== undefined) {
      const matchdayPairs = leagueMatchdays[slot.leagueIndex] || [];
      const matchdayNumber = slot.leagueIndex + 1;

      matchdayPairs.forEach(([h, a], mIdx) => {
        allGeneratedFixtures.push({
          id: `fix-s${season}-r${roundNumber}-lg-m${mIdx}`,
          season,
          round: roundNumber,
          homeClubId: h,
          awayClubId: a,
          isPlayed: false,
          competitionType: 'league',
          competitionName: leagueName,
          roundStageName: `Jornada ${matchdayNumber}`,
          isKnockout: false,
        });
      });
    } else if (slot.type === 'cup' && slot.cupIndex !== undefined) {
      const cIdx = slot.cupIndex;
      const cupRival = cupRivals[cIdx] || cupRivals[0];
      const stageName = cupInfo.roundNames[cIdx] || `Ronda ${cIdx + 1}`;
      const isFinal = cIdx === cupRivals.length - 1;
      const isHome = cIdx % 2 === 0;

      // Partido del club del usuario
      allGeneratedFixtures.push({
        id: `fix-s${season}-r${roundNumber}-cup-user`,
        season,
        round: roundNumber,
        homeClubId: isHome ? userClubId : cupRival.id,
        awayClubId: isHome ? cupRival.id : userClubId,
        isPlayed: false,
        competitionType: 'cup',
        competitionName: cupInfo.name,
        roundStageName: stageName,
        isKnockout: true,
        trophyKey: isFinal ? cupInfo.trophyKey : undefined,
      });

      // Partidos complementarios de IA de la misma copa nacional
      const otherNationalClubs = nationalClubs.filter((c) => c.id !== cupRival.id);
      for (let i = 0; i < 4 && i * 2 + 1 < otherNationalClubs.length; i++) {
        allGeneratedFixtures.push({
          id: `fix-s${season}-r${roundNumber}-cup-ai-${i}`,
          season,
          round: roundNumber,
          homeClubId: otherNationalClubs[i * 2].id,
          awayClubId: otherNationalClubs[i * 2 + 1].id,
          isPlayed: false,
          competitionType: 'cup',
          competitionName: cupInfo.name,
          roundStageName: stageName,
          isKnockout: true,
        });
      }
    } else if (slot.type === 'uefa_league' && slot.uefaIndex !== undefined) {
      const uIdx = slot.uefaIndex;
      const euroRival = europeanRivalPool[uIdx] || europeanRivalPool[0];
      const isHome = uIdx % 2 === 0; // 4 casa, 4 fuera alternados
      const stageName = `Fase de Liga · Jornada ${uIdx + 1}`;

      // Partido del usuario contra rival de otra liga
      allGeneratedFixtures.push({
        id: `fix-s${season}-r${roundNumber}-uefa-user`,
        season,
        round: roundNumber,
        homeClubId: isHome ? userClubId : euroRival.id,
        awayClubId: isHome ? euroRival.id : userClubId,
        isPlayed: false,
        competitionType: euroTournament,
        competitionName: euroName,
        roundStageName: stageName,
        isKnockout: false,
      });

      // Partidos complementarios de IA entre clubes europeos
      const otherForeigns = allClubs
        .filter((c) => c.tier === 1 && c.id !== userClubId && c.id !== euroRival.id)
        .slice(0, 8);

      for (let i = 0; i < 3 && i * 2 + 1 < otherForeigns.length; i++) {
        allGeneratedFixtures.push({
          id: `fix-s${season}-r${roundNumber}-uefa-ai-${i}`,
          season,
          round: roundNumber,
          homeClubId: otherForeigns[i * 2].id,
          awayClubId: otherForeigns[i * 2 + 1].id,
          isPlayed: false,
          competitionType: euroTournament,
          competitionName: euroName,
          roundStageName: stageName,
          isKnockout: false,
        });
      }
    } else if (slot.type === 'uefa_knockout' && slot.uefaIndex !== undefined) {
      const koIdx = slot.uefaIndex;
      const koRivals = euroKnockoutRivals;
      const koStages = ['Octavos de Final', 'Cuartos de Final', 'Semifinal', '¡Gran Final de la Champions League!'];
      const stageName = `${euroName} · ${koStages[koIdx] || 'Eliminatoria'}`;
      const isFinal = koIdx === 3;
      const koRival = koRivals[koIdx] || koRivals[0];
      const isHome = koIdx % 2 === 0;

      // Partido eliminatorio del usuario
      allGeneratedFixtures.push({
        id: `fix-s${season}-r${roundNumber}-uefa-ko-user`,
        season,
        round: roundNumber,
        homeClubId: isHome || isFinal ? userClubId : koRival.id,
        awayClubId: isHome || isFinal ? koRival.id : userClubId,
        isPlayed: false,
        competitionType: euroTournament,
        competitionName: euroName,
        roundStageName: stageName,
        isKnockout: true,
        trophyKey: isFinal ? euroTournament : undefined,
      });

      // Partidos complementarios de eliminatoria europea para IA
      const foreignContenders = allClubs.filter(
        (c) => c.country !== userCountry && c.tier === 1 && c.id !== koRival.id
      );
      for (let i = 0; i < 3 && i * 2 + 1 < foreignContenders.length; i++) {
        allGeneratedFixtures.push({
          id: `fix-s${season}-r${roundNumber}-uefa-ko-ai-${i}`,
          season,
          round: roundNumber,
          homeClubId: foreignContenders[i * 2].id,
          awayClubId: foreignContenders[i * 2 + 1].id,
          isPlayed: false,
          competitionType: euroTournament,
          competitionName: euroName,
          roundStageName: stageName,
          isKnockout: true,
        });
      }
    }
  });

  return allGeneratedFixtures;
}

/**
 * Poda los partidos futuros de un torneo eliminatorio cuando el usuario resulta eliminado,
 * y renumera las jornadas restantes de manera correlativa y sin huecos para una experiencia continua.
 */
export function pruneEliminatedTournamentFixtures(
  fixtures: MatchFixture[],
  currentRound: number,
  competitionType: string,
  userClubId: string
): MatchFixture[] {
  // Descartar futuros partidos del usuario en esa competición de eliminatoria
  const filtered = fixtures.filter((f) => {
    const isUserMatch = f.homeClubId === userClubId || f.awayClubId === userClubId;
    if (f.round > currentRound && isUserMatch && f.competitionType === competitionType && !f.isPlayed) {
      return false;
    }
    return true;
  });

  // Identificar todas las jornadas futuras que aún tienen al menos un partido programado
  const remainingFutureRounds = Array.from(
    new Set(filtered.filter((f) => f.round > currentRound).map((f) => f.round))
  ).sort((a, b) => a - b);

  // Mapear cada jornada antigua a una jornada correlativa (currentRound + 1, currentRound + 2...)
  const roundMap = new Map<number, number>();
  remainingFutureRounds.forEach((oldRound, idx) => {
    roundMap.set(oldRound, currentRound + 1 + idx);
  });

  return filtered.map((f) => {
    if (f.round > currentRound && roundMap.has(f.round)) {
      return {
        ...f,
        round: roundMap.get(f.round)!,
      };
    }
    return f;
  });
}

/**
 * Asegura que una partida activa existente incorpore los partidos de Copa Nacional y Torneos Europeos
 * sin alterar los resultados previos ya disputados.
 */
export function ensureSeasonTournaments(
  season: number,
  currentRound: number,
  existingFixtures: MatchFixture[],
  allClubs: Club[],
  userClubId: string
): MatchFixture[] {
  const hasTournaments = existingFixtures.some(
    (f) => f.competitionType === 'cup' || f.competitionType === 'ucl' || f.competitionType === 'uel' || f.competitionType === 'uecl'
  );

  if (hasTournaments) {
    return existingFixtures;
  }

  const userClub = allClubs.find((c) => c.id === userClubId) || allClubs[0];
  const userDivId = userClub.divisionId || userClub.league || 'es_laliga';
  const divClubs = allClubs.filter((c) => (c.divisionId || c.league) === userDivId);
  const clubsForFixtures = divClubs.length >= 2 ? divClubs : allClubs;

  // Si la temporada aún está al inicio (jornada 1 sin jugar)
  if (currentRound <= 1 && existingFixtures.every((f) => !f.isPlayed)) {
    return generateSeasonFixturesWithTournaments(season, clubsForFixtures, allClubs, userClubId);
  }

  // Si ya se han jugado jornadas, generamos el calendario completo y preservamos los jugados
  const fullCalendar = generateSeasonFixturesWithTournaments(season, clubsForFixtures, allClubs, userClubId);
  const playedFixtures = existingFixtures.filter((f) => f.isPlayed);
  const playedUserFixtures = playedFixtures.filter((f) => f.homeClubId === userClubId || f.awayClubId === userClubId);
  const playedCount = playedUserFixtures.length;

  // Reemplazar los primeros 'playedCount' partidos con los datos ya jugados
  const userFullMatches = fullCalendar
    .filter((f) => f.homeClubId === userClubId || f.awayClubId === userClubId)
    .sort((a, b) => a.round - b.round);

  playedUserFixtures.forEach((pFix, idx) => {
    const targetMatch = userFullMatches[idx];
    if (targetMatch) {
      const matchInFull = fullCalendar.find((f) => f.id === targetMatch.id);
      if (matchInFull) {
        matchInFull.isPlayed = true;
        matchInFull.homeScore = pFix.homeScore;
        matchInFull.awayScore = pFix.awayScore;
        matchInFull.events = pFix.events;
        matchInFull.homeStats = pFix.homeStats;
        matchInFull.awayStats = pFix.awayStats;
      }
    }
  });

  return fullCalendar;
}
