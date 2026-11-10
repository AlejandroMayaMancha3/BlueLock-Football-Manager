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
  KnockoutMatchup,
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

/**
 * Obtiene los 36 clubes que disputan la UEFA Champions League en formato suizo único
 */
export function getUefa36Clubs(
  allClubs: Club[],
  userClubId: string,
  _tournament: 'ucl' | 'uel' | 'uecl' = 'ucl'
): Club[] {
  const userClub = allClubs.find((c) => c.id === userClubId);
  const selectedClubs: Club[] = [];

  // 1. Incluir club del usuario si existe
  if (userClub) {
    selectedClubs.push(userClub);
  }

  // 2. Filtrar clubes de primera categoría de los 5 países (España, Inglaterra, Alemania, Italia, Francia)
  const tier1Clubs = allClubs
    .filter((c) => c.tier === 1 && c.id !== userClubId)
    .sort((a, b) => b.level * 1.5 + b.reputation - (a.level * 1.5 + a.reputation));

  // Distribuir de forma equilibrada entre las 5 grandes ligas
  const countries: CountryLeague[] = ['Spain', 'England', 'Germany', 'Italy', 'France'];
  countries.forEach((country) => {
    const countryClubs = tier1Clubs.filter((c) => c.country === country);
    const toTake = countryClubs.slice(0, 7);
    toTake.forEach((c) => {
      if (!selectedClubs.some((sc) => sc.id === c.id) && selectedClubs.length < 36) {
        selectedClubs.push(c);
      }
    });
  });

  // Completar si falta alguno hasta llegar a 36
  tier1Clubs.forEach((c) => {
    if (!selectedClubs.some((sc) => sc.id === c.id) && selectedClubs.length < 36) {
      selectedClubs.push(c);
    }
  });

  // Fallback si la base tuviese menos de 36 clubes Tier 1
  if (selectedClubs.length < 36) {
    const extras = allClubs
      .filter((c) => !selectedClubs.some((sc) => sc.id === c.id))
      .sort((a, b) => b.level - a.level);
    for (const c of extras) {
      if (selectedClubs.length >= 36) break;
      selectedClubs.push(c);
    }
  }

  return selectedClubs;
}

/**
 * Calcula la clasificación oficial de la Fase de Liga de la UEFA Champions League (36 equipos)
 * aplicando los 8 partidos de la fase suiza.
 */
export function computeUefaLeagueTable(
  uefaClubs: Club[],
  fixtures: MatchFixture[],
  _currentRound: number,
  isSeasonCompleted: boolean,
  userClubId: string
): LeagueTableRow[] {
  // Número de jornadas suizas disputadas por el club del usuario
  const playedUserUefaMatches = fixtures.filter(
    (f) =>
      (f.competitionType === 'ucl' || f.competitionType === 'uel' || f.competitionType === 'uecl') &&
      !f.isKnockout &&
      f.isPlayed &&
      (f.homeClubId === userClubId || f.awayClubId === userClubId)
  );

  const completedMatchdays = isSeasonCompleted ? 8 : Math.min(8, playedUserUefaMatches.length);

  const tableRows: LeagueTableRow[] = uefaClubs.map((club) => {
    // Si el club tiene partidos oficiales jugados en los fixtures de la temporada
    const clubPlayedFixtures = fixtures.filter(
      (f) =>
        (f.competitionType === 'ucl' || f.competitionType === 'uel' || f.competitionType === 'uecl') &&
        !f.isKnockout &&
        f.isPlayed &&
        (f.homeClubId === club.id || f.awayClubId === club.id)
    );

    if (clubPlayedFixtures.length > 0) {
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let gf = 0;
      let ga = 0;
      const form: Array<'W' | 'D' | 'L'> = [];

      clubPlayedFixtures.forEach((f) => {
        const isHome = f.homeClubId === club.id;
        const myScore = isHome ? f.homeScore || 0 : f.awayScore || 0;
        const opScore = isHome ? f.awayScore || 0 : f.homeScore || 0;
        gf += myScore;
        ga += opScore;

        if (myScore > opScore) {
          won++;
          form.push('W');
        } else if (myScore === opScore) {
          drawn++;
          form.push('D');
        } else {
          lost++;
          form.push('L');
        }
      });

      return {
        clubId: club.id,
        clubName: club.name,
        shortName: club.shortName,
        played: clubPlayedFixtures.length,
        won,
        drawn,
        lost,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gf - ga,
        points: won * 3 + drawn,
        formHistory: form,
      };
    }

    // Si aún no se ha jugado ninguna jornada
    if (completedMatchdays === 0) {
      return {
        clubId: club.id,
        clubName: club.name,
        shortName: club.shortName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        formHistory: [],
      };
    }

    // Simulación determinista y coherente basada en el nivel y prestigio del club
    const pwr = club.level * 1.5 + (club.reputation || 70) * 0.5;
    let hash = 0;
    for (let i = 0; i < club.id.length; i++) {
      hash = (hash * 31 + club.id.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    const winProb = Math.min(0.82, Math.max(0.18, (pwr - 60) / 45));
    const drawProb = 0.20;

    let won = 0;
    let drawn = 0;
    let lost = 0;
    const form: Array<'W' | 'D' | 'L'> = [];

    for (let m = 0; m < completedMatchdays; m++) {
      const matchSeed = (seed + m * 0.17) % 1;
      if (matchSeed < winProb) {
        won++;
        form.push('W');
      } else if (matchSeed < winProb + drawProb) {
        drawn++;
        form.push('D');
      } else {
        lost++;
        form.push('L');
      }
    }

    const gf = won * 2 + drawn * 1 + Math.floor(seed * 4);
    const ga = lost * 2 + drawn * 1 + Math.floor((1 - seed) * 3);

    return {
      clubId: club.id,
      clubName: club.name,
      shortName: club.shortName,
      played: completedMatchdays,
      won,
      drawn,
      lost,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDifference: gf - ga,
      points: won * 3 + drawn,
      formHistory: form,
    };
  });

  return tableRows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const clubA = uefaClubs.find((c) => c.id === a.clubId);
    const clubB = uefaClubs.find((c) => c.id === b.clubId);
    return (clubB?.level || 0) - (clubA?.level || 0);
  });
}

/**
 * Construye el cuadro de eliminatorias de la UEFA Champions League a partir de los resultados
 * de la Fase de Liga:
 * - Puestos 1.º al 8.º: Pasan directamente a Octavos de Final (Cabezas de serie)
 * - Puestos 9.º al 24.º: Disputan el Play-off de Dieciseisavos (1/16)
 * - Puestos 25.º al 36.º: Quedan eliminados
 */
export function getUefaKnockoutBracket(
  uefaTable: LeagueTableRow[],
  allClubsMap: Record<string, Club>,
  fixtures: MatchFixture[],
  _userClubId: string
): {
  playoff16: KnockoutMatchup[];
  roundOf16: KnockoutMatchup[];
  quarters: KnockoutMatchup[];
  semis: KnockoutMatchup[];
  final: KnockoutMatchup[];
} {
  const getClubData = (clubId: string, seedRank?: number) => {
    const c = allClubsMap[clubId] || {
      id: clubId,
      name: 'Club Europeo',
      shortName: 'EUR',
      primaryColor: '#001489',
      secondaryColor: '#ffffff',
      country: 'Spain' as CountryLeague,
      level: 80,
    };
    return {
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      primaryColor: c.primaryColor,
      secondaryColor: c.secondaryColor,
      seedRank,
      country: (c.country || 'Spain') as CountryLeague,
      level: c.level,
    };
  };

  const findPlayedKnockout = (stageKeyword: string, clubAId: string, clubBId?: string) => {
    return fixtures.find(
      (f) =>
        f.isKnockout &&
        f.isPlayed &&
        (f.competitionType === 'ucl' || f.competitionType === 'uel' || f.competitionType === 'uecl') &&
        f.roundStageName?.toLowerCase().includes(stageKeyword.toLowerCase()) &&
        (f.homeClubId === clubAId || f.awayClubId === clubAId) &&
        (!clubBId || f.homeClubId === clubBId || f.awayClubId === clubBId)
    );
  };

  // 1. PLAY-OFF DE DIECISEISAVOS (1/16) - Puestos 9 al 24 de la Fase de Liga
  // 8 emparejamientos: 9º vs 24º, 10º vs 23º, 11º vs 22º, 12º vs 21º, 13º vs 20º, 14º vs 19º, 15º vs 18º, 16º vs 17º
  const playoff16: KnockoutMatchup[] = [];
  const playoffWinners: string[] = [];

  for (let i = 0; i < 8; i++) {
    const highIdx = 8 + i; // 9º a 16º
    const lowIdx = 23 - i; // 24º a 17º
    const highRow = uefaTable[highIdx] || uefaTable[8] || { clubId: `club-p16-h-${i}` };
    const lowRow = uefaTable[lowIdx] || uefaTable[23] || { clubId: `club-p16-l-${i}` };

    const hTeam = getClubData(highRow.clubId, highIdx + 1);
    const aTeam = getClubData(lowRow.clubId, lowIdx + 1);

    const playedFix =
      findPlayedKnockout('dieciseisavos', hTeam.id, aTeam.id) ||
      findPlayedKnockout('1/16', hTeam.id, aTeam.id);

    let isPlayed = false;
    let hScore = 0;
    let aScore = 0;
    let winnerId = '';
    let pH: number | undefined;
    let pA: number | undefined;

    if (playedFix) {
      isPlayed = true;
      const isHome = playedFix.homeClubId === hTeam.id;
      hScore = isHome ? playedFix.homeScore || 0 : playedFix.awayScore || 0;
      aScore = isHome ? playedFix.awayScore || 0 : playedFix.homeScore || 0;
      pH = isHome ? playedFix.penaltyHomeScore : playedFix.penaltyAwayScore;
      pA = isHome ? playedFix.penaltyAwayScore : playedFix.penaltyHomeScore;

      const penaltiesWin = (pH || 0) > (pA || 0);
      winnerId = hScore > aScore || penaltiesWin ? hTeam.id : aTeam.id;
    } else {
      winnerId = (hTeam.level || 82) >= (aTeam.level || 80) ? hTeam.id : aTeam.id;
    }

    playoffWinners.push(winnerId);

    playoff16.push({
      id: `ko-po16-${i}`,
      stageKey: 'playoff_16',
      stageName: `Play-off 1/16 · Cruce ${i + 1}`,
      homeTeam: hTeam,
      awayTeam: aTeam,
      homeScore: isPlayed ? hScore : undefined,
      awayScore: isPlayed ? aScore : undefined,
      penaltyHomeScore: pH,
      penaltyAwayScore: pA,
      winnerTeamId: isPlayed ? winnerId : undefined,
      isPlayed,
      statusLabel: isPlayed ? 'Finalizado' : `${highIdx + 1}.º vs ${lowIdx + 1}.º`,
    });
  }

  // 2. OCTAVOS DE FINAL - 8 partidos
  // Los 8 primeros (cabezas de serie) esperan a los 8 ganadores de Dieciseisavos
  const roundOf16: KnockoutMatchup[] = [];
  const r16Winners: string[] = [];

  for (let i = 0; i < 8; i++) {
    const seedRow = uefaTable[i]; // 1º al 8º clasificados directos
    const seedTeam = getClubData(seedRow?.clubId || `seed-${i}`, i + 1);
    const poWinnerId = playoffWinners[7 - i] || playoff16[7 - i]?.homeTeam.id;
    const poWinnerTeam = getClubData(poWinnerId);

    const playedFix =
      findPlayedKnockout('octavos', seedTeam.id, poWinnerTeam.id) ||
      findPlayedKnockout('round of 16', seedTeam.id, poWinnerTeam.id);

    let isPlayed = false;
    let hScore = 0;
    let aScore = 0;
    let winnerId = '';
    let pH: number | undefined;
    let pA: number | undefined;

    if (playedFix) {
      isPlayed = true;
      const isHome = playedFix.homeClubId === seedTeam.id;
      hScore = isHome ? playedFix.homeScore || 0 : playedFix.awayScore || 0;
      aScore = isHome ? playedFix.awayScore || 0 : playedFix.homeScore || 0;
      pH = isHome ? playedFix.penaltyHomeScore : playedFix.penaltyAwayScore;
      pA = isHome ? playedFix.penaltyAwayScore : playedFix.penaltyHomeScore;

      winnerId = hScore > aScore || (pH || 0) > (pA || 0) ? seedTeam.id : poWinnerTeam.id;
    } else {
      winnerId = (seedTeam.level || 86) >= (poWinnerTeam.level || 82) ? seedTeam.id : poWinnerTeam.id;
    }

    r16Winners.push(winnerId);

    roundOf16.push({
      id: `ko-r16-${i}`,
      stageKey: 'round_of_16',
      stageName: `Octavos de Final · Cruce ${i + 1}`,
      homeTeam: seedTeam,
      awayTeam: poWinnerTeam,
      homeScore: isPlayed ? hScore : undefined,
      awayScore: isPlayed ? aScore : undefined,
      penaltyHomeScore: pH,
      penaltyAwayScore: pA,
      winnerTeamId: isPlayed ? winnerId : undefined,
      isPlayed,
      statusLabel: isPlayed ? 'Finalizado' : 'Cabeza de Serie Directo vs Ganador 1/16',
    });
  }

  // 3. CUARTOS DE FINAL - 4 partidos
  const quarters: KnockoutMatchup[] = [];
  const qWinners: string[] = [];

  for (let i = 0; i < 4; i++) {
    const tA = getClubData(r16Winners[i * 2] || roundOf16[i * 2]?.homeTeam.id);
    const tB = getClubData(r16Winners[i * 2 + 1] || roundOf16[i * 2 + 1]?.homeTeam.id);

    const playedFix = findPlayedKnockout('cuartos', tA.id, tB.id);
    let isPlayed = false;
    let hScore = 0;
    let aScore = 0;
    let winnerId = '';
    let pH: number | undefined;
    let pA: number | undefined;

    if (playedFix) {
      isPlayed = true;
      const isHome = playedFix.homeClubId === tA.id;
      hScore = isHome ? playedFix.homeScore || 0 : playedFix.awayScore || 0;
      aScore = isHome ? playedFix.awayScore || 0 : playedFix.homeScore || 0;
      pH = isHome ? playedFix.penaltyHomeScore : playedFix.penaltyAwayScore;
      pA = isHome ? playedFix.penaltyAwayScore : playedFix.penaltyHomeScore;
      winnerId = hScore > aScore || (pH || 0) > (pA || 0) ? tA.id : tB.id;
    } else {
      winnerId = (tA.level || 87) >= (tB.level || 87) ? tA.id : tB.id;
    }

    qWinners.push(winnerId);

    quarters.push({
      id: `ko-qf-${i}`,
      stageKey: 'quarter',
      stageName: `Cuartos de Final · Cruce ${i + 1}`,
      homeTeam: tA,
      awayTeam: tB,
      homeScore: isPlayed ? hScore : undefined,
      awayScore: isPlayed ? aScore : undefined,
      penaltyHomeScore: pH,
      penaltyAwayScore: pA,
      winnerTeamId: isPlayed ? winnerId : undefined,
      isPlayed,
      statusLabel: isPlayed ? 'Finalizado' : 'Por Disputar',
    });
  }

  // 4. SEMIFINALES - 2 partidos
  const semis: KnockoutMatchup[] = [];
  const semiWinners: string[] = [];

  for (let i = 0; i < 2; i++) {
    const tA = getClubData(qWinners[i * 2] || quarters[i * 2]?.homeTeam.id);
    const tB = getClubData(qWinners[i * 2 + 1] || quarters[i * 2 + 1]?.homeTeam.id);

    const playedFix = findPlayedKnockout('semifinal', tA.id, tB.id);
    let isPlayed = false;
    let hScore = 0;
    let aScore = 0;
    let winnerId = '';
    let pH: number | undefined;
    let pA: number | undefined;

    if (playedFix) {
      isPlayed = true;
      const isHome = playedFix.homeClubId === tA.id;
      hScore = isHome ? playedFix.homeScore || 0 : playedFix.awayScore || 0;
      aScore = isHome ? playedFix.awayScore || 0 : playedFix.homeScore || 0;
      pH = isHome ? playedFix.penaltyHomeScore : playedFix.penaltyAwayScore;
      pA = isHome ? playedFix.penaltyAwayScore : playedFix.penaltyHomeScore;
      winnerId = hScore > aScore || (pH || 0) > (pA || 0) ? tA.id : tB.id;
    } else {
      winnerId = (tA.level || 89) >= (tB.level || 89) ? tA.id : tB.id;
    }

    semiWinners.push(winnerId);

    semis.push({
      id: `ko-sf-${i}`,
      stageKey: 'semi',
      stageName: `Semifinal ${i + 1}`,
      homeTeam: tA,
      awayTeam: tB,
      homeScore: isPlayed ? hScore : undefined,
      awayScore: isPlayed ? aScore : undefined,
      penaltyHomeScore: pH,
      penaltyAwayScore: pA,
      winnerTeamId: isPlayed ? winnerId : undefined,
      isPlayed,
      statusLabel: isPlayed ? 'Finalizado' : 'Por Disputar',
    });
  }

  // 5. GRAN FINAL - 1 partido por el trofeo continental ("La Orejona")
  const finalTeamA = getClubData(semiWinners[0] || semis[0]?.homeTeam.id);
  const finalTeamB = getClubData(semiWinners[1] || semis[1]?.homeTeam.id);

  const playedFinal = fixtures.find(
    (f) =>
      f.isKnockout &&
      f.isPlayed &&
      (f.competitionType === 'ucl' || f.competitionType === 'uel' || f.competitionType === 'uecl') &&
      f.roundStageName?.toLowerCase().includes('final') &&
      !f.roundStageName?.toLowerCase().includes('semi') &&
      !f.roundStageName?.toLowerCase().includes('cuarto') &&
      !f.roundStageName?.toLowerCase().includes('octavo') &&
      !f.roundStageName?.toLowerCase().includes('1/16') &&
      (f.homeClubId === finalTeamA.id || f.awayClubId === finalTeamA.id)
  );

  let finalPlayed = false;
  let finH = 0;
  let finA = 0;
  let finWin = '';
  let finPH: number | undefined;
  let finPA: number | undefined;

  if (playedFinal) {
    finalPlayed = true;
    const isHome = playedFinal.homeClubId === finalTeamA.id;
    finH = isHome ? playedFinal.homeScore || 0 : playedFinal.awayScore || 0;
    finA = isHome ? playedFinal.awayScore || 0 : playedFinal.homeScore || 0;
    finPH = isHome ? playedFinal.penaltyHomeScore : playedFinal.penaltyAwayScore;
    finPA = isHome ? playedFinal.penaltyAwayScore : playedFinal.penaltyHomeScore;
    finWin = finH > finA || (finPH || 0) > (finPA || 0) ? finalTeamA.id : finalTeamB.id;
  }

  const finalMatchup: KnockoutMatchup = {
    id: 'ko-final-ucl',
    stageKey: 'final',
    stageName: '¡Gran Final de la UEFA Champions League!',
    homeTeam: finalTeamA,
    awayTeam: finalTeamB,
    homeScore: finalPlayed ? finH : undefined,
    awayScore: finalPlayed ? finA : undefined,
    penaltyHomeScore: finPH,
    penaltyAwayScore: finPA,
    winnerTeamId: finalPlayed ? finWin : undefined,
    isPlayed: finalPlayed,
    statusLabel: finalPlayed ? '🏆 ¡Campeón de Europa!' : 'Partido por La Orejona',
  };

  return {
    playoff16,
    roundOf16,
    quarters,
    semis,
    final: [finalMatchup],
  };
}
