import {
  CountryLeague,
  LeagueTableRow,
  TierLevel,
  ClubTrophyRecord,
  EuropeanQualificationEntry,
  UefaTournamentType,
  Club,
  SeasonHistoryEntry,
} from '@/types/football-manager';
import { getTrophyForDivision, getTrophyForCup, getTrophyForUefa } from './data/trophies-catalog';

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
