'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Globe2,
  ChevronDown,
  ChevronUp,
  Shield,
  Swords,
  Star,
  CheckCircle2,
  ChevronRight,
  Medal,
} from 'lucide-react';
import clsx from 'clsx';
import { LeagueTableRow, CountryLeague, Club, KnockoutMatchup } from '@/types/football-manager';
import { getDivisionById, getDivisionsByCountry, COUNTRIES_CATALOG } from '@/engine/data/divisions-catalog';
import { simulateAiDivisionTable } from '@/engine/season-engine';
import {
  getUefa36Clubs,
  computeUefaLeagueTable,
  getUefaKnockoutBracket,
} from '@/engine/competitions-engine';

/**
 * Obtiene la bandera según el país de procedencia del club
 */
function getCountryFlag(country?: string): string {
  switch (country) {
    case 'England':
      return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    case 'Germany':
      return '🇩🇪';
    case 'Italy':
      return '🇮🇹';
    case 'France':
      return '🇫🇷';
    case 'Spain':
    default:
      return '🇪🇸';
  }
}

/**
 * Zonas oficiales de la Fase de Liga de la UEFA Champions League (36 equipos)
 */
function getZoneBadgeUefa(pos: number) {
  if (pos <= 8) {
    return {
      bg: 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/30',
      border: 'border-l-4 border-emerald-400',
      tag: 'Octavos Directos',
      subTag: 'Cabezas de Serie (Puestos 1-8)',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      isSpecial: true,
    };
  }
  if (pos >= 9 && pos <= 24) {
    return {
      bg: 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/30',
      border: 'border-l-4 border-cyan-400',
      tag: 'Play-off 1/16',
      subTag: 'Dieciseisavos a doble partido (Puestos 9-24)',
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      isSpecial: true,
    };
  }
  return {
    bg: 'bg-rose-950 text-rose-300 border border-rose-600/40 font-bold',
    border: 'border-l-4 border-rose-600/60',
    tag: 'Eliminado',
    subTag: 'Sin torneo continental (Puestos 25-36)',
    badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-500/30',
    isSpecial: false,
  };
}

interface TableViewProps {
  leagueTable: LeagueTableRow[];
}

export const TableView: React.FC<TableViewProps> = ({ leagueTable }) => {
  const {
    currentSeason,
    currentRound,
    userClubId,
    clubs,
    players,
    fixtures,
    selectedDivisionId,
    isSeasonCompleted,
    proceedToNextSeason,
  } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userDivisionId = userClub?.divisionId || userClub?.league || selectedDivisionId || 'es_laliga';
  const userCountry = (userClub?.country as CountryLeague) || 'Spain';

  // Estados de competición: Liga Regular vs Competición Continental UEFA
  const [competitionView, setCompetitionView] = useState<'league' | 'ucl'>('league');
  const [uclSubView, setUclSubView] = useState<'table' | 'bracket'>('table');
  const [bracketFilter, setBracketFilter] = useState<
    'all' | 'playoff_16' | 'round_of_16' | 'quarter' | 'semi' | 'final'
  >('all');
  const [expandedUclClubId, setExpandedUclClubId] = useState<string | null>(null);

  // Estados de navegación para explorar cualquier división del país o del continente
  const [selectedCountry, setSelectedCountry] = useState<CountryLeague>(userCountry);
  const [activeTabDivisionId, setActiveTabDivisionId] = useState<string>(userDivisionId);
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);

  // Mapa rápido de clubes por ID
  const clubsMap = useMemo(() => {
    return clubs.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, Club>);
  }, [clubs]);

  // 1. Clubes oficiales de la UEFA Champions League (36 clubes)
  const uefaClubs = useMemo(() => {
    return getUefa36Clubs(clubs, userClubId, 'ucl');
  }, [clubs, userClubId]);

  // 2. Clasificación de la Fase de Liga UEFA (36 equipos)
  const uefaTable = useMemo(() => {
    return computeUefaLeagueTable(uefaClubs, fixtures, currentRound, isSeasonCompleted, userClubId);
  }, [uefaClubs, fixtures, currentRound, isSeasonCompleted, userClubId]);

  // 3. Cuadro de Eliminatorias UEFA (desde Dieciseisavos 1/16 y Octavos Directos)
  const uefaBracket = useMemo(() => {
    return getUefaKnockoutBracket(uefaTable, clubsMap, fixtures, userClubId);
  }, [uefaTable, clubsMap, fixtures, userClubId]);

  // Sincronizar automáticamente el país y la división activa cuando cambie la temporada o la división del usuario
  useEffect(() => {
    setActiveTabDivisionId(userDivisionId);
    setSelectedCountry(userCountry);
  }, [userDivisionId, userCountry, currentSeason]);

  // Obtener las divisiones del país actualmente seleccionado
  const availableDivisions = useMemo(() => {
    return getDivisionsByCountry(selectedCountry);
  }, [selectedCountry]);

  // Si se cambia de país y la división actual no pertenece a él, seleccionar la primera división
  const activeDivisionInfo = useMemo(() => {
    const found = getDivisionById(activeTabDivisionId);
    if (found && found.country === selectedCountry) {
      return found;
    }
    return availableDivisions[0] || getDivisionById('es_laliga')!;
  }, [activeTabDivisionId, availableDivisions, selectedCountry]);

  const isViewingUserDivision = activeDivisionInfo.id === userDivisionId;
  const divisionName = activeDivisionInfo.name || 'Liga';

  // Calcular la tabla para la división seleccionada
  const displayedTable = useMemo(() => {
    if (isViewingUserDivision) {
      return leagueTable;
    }
    const targetClubs = clubs.filter((c) => (c.divisionId || c.league) === activeDivisionInfo.id);
    const completedMatches = isSeasonCompleted ? 46 : Math.max(0, currentRound - 1);
    return simulateAiDivisionTable(targetClubs, completedMatches);
  }, [isViewingUserDivision, leagueTable, clubs, activeDivisionInfo.id, isSeasonCompleted, currentRound]);

  const totalTeams = displayedTable.length || 24;
  const tier = activeDivisionInfo.tier || 1;
  const promDirect = activeDivisionInfo.promotionDirect || (tier === 1 ? 0 : 2);
  const promPlayoff = activeDivisionInfo.promotionPlayoff || 0;
  const relegDirect = activeDivisionInfo.relegationDirect || (tier === 4 ? 0 : 3);
  const relegPlayoff = activeDivisionInfo.relegationPlayoff || 0;

  // Filtrar futbolistas exclusivamente de los clubes de esta división
  const divisionClubIds = new Set(displayedTable.map((r) => r.clubId));
  const divisionPlayers = players.filter((p) => divisionClubIds.has(p.clubId));

  const topScorers = [...divisionPlayers]
    .filter((p) => (p.seasonGoals || 0) > 0)
    .sort((a, b) => (b.seasonGoals || 0) - (a.seasonGoals || 0))
    .slice(0, 6);

  const topAssists = [...divisionPlayers]
    .filter((p) => (p.seasonAssists || 0) > 0)
    .sort((a, b) => (b.seasonAssists || 0) - (a.seasonAssists || 0))
    .slice(0, 6);

  // Helper para determinar zona y estilo de posición
  const getZoneBadge = (pos: number) => {
    if (tier === 1) {
      if (pos === 1) {
        return {
          bg: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30',
          border: 'border-l-4 border-yellow-400',
          tag: 'Campeón',
          isSpecial: true,
        };
      }
      if (pos >= 2 && pos <= 4) {
        return {
          bg: 'bg-cyan-500 text-black font-black',
          border: 'border-l-4 border-cyan-400',
          tag: 'Zona Élite',
          isSpecial: true,
        };
      }
      if (pos >= 5 && pos <= 6) {
        return {
          bg: 'bg-blue-600 text-white font-bold',
          border: 'border-l-4 border-blue-500',
          tag: 'Europa',
          isSpecial: true,
        };
      }
      if (pos > totalTeams - relegDirect) {
        return {
          bg: 'bg-rose-600 text-white font-bold',
          border: 'border-l-4 border-rose-500',
          tag: 'Descenso Directo',
          isSpecial: true,
        };
      }
      if (relegPlayoff > 0 && pos > totalTeams - relegDirect - relegPlayoff && pos <= totalTeams - relegDirect) {
        return {
          bg: 'bg-amber-600 text-black font-bold',
          border: 'border-l-4 border-amber-500',
          tag: 'Playout',
          isSpecial: true,
        };
      }
      return { bg: 'text-slate-400 bg-slate-800/60', border: '', tag: '', isSpecial: false };
    }

    // Tier 2, 3 o 4
    if (pos <= promDirect) {
      return {
        bg: 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/30',
        border: 'border-l-4 border-emerald-400',
        tag: 'Ascenso Directo',
        isSpecial: true,
      };
    }
    if (pos > promDirect && pos <= promDirect + promPlayoff) {
      return {
        bg: 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20',
        border: 'border-l-4 border-blue-400',
        tag: 'Playoff de Ascenso',
        isSpecial: true,
      };
    }
    if (relegDirect > 0 && pos > totalTeams - relegDirect) {
      return {
        bg: 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/20',
        border: 'border-l-4 border-rose-500',
        tag: 'Descenso Directo',
        isSpecial: true,
      };
    }
    if (relegPlayoff > 0 && pos > totalTeams - relegDirect - relegPlayoff && pos <= totalTeams - relegDirect) {
      return {
        bg: 'bg-amber-600 text-black font-bold',
        border: 'border-l-4 border-amber-500',
        tag: 'Playoff Permanencia',
        isSpecial: true,
      };
    }

    return { bg: 'text-slate-400 bg-slate-800/60', border: '', tag: '', isSpecial: false };
  };

  return (
    <div className="space-y-6">
      {/* SELECTOR GENERAL: LIGAS NACIONALES vs UEFA CHAMPIONS LEAGUE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCompetitionView('league')}
              className={clsx(
                'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                competitionView === 'league'
                  ? 'bg-cyan-500 text-black shadow-lg font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>Ligas Nacionales</span>
            </button>
            <button
              type="button"
              onClick={() => setCompetitionView('ucl')}
              className={clsx(
                'flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                competitionView === 'ucl'
                  ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>UEFA Champions League</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/20 text-black font-mono font-bold">
                36
              </span>
            </button>
          </div>
        </div>

        {competitionView === 'ucl' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setUclSubView('table')}
              className={clsx(
                'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                uclSubView === 'table'
                  ? 'bg-blue-600 text-white shadow font-black'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Fase de Liga (36)</span>
            </button>
            <button
              type="button"
              onClick={() => setUclSubView('bracket')}
              className={clsx(
                'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                uclSubView === 'bracket'
                  ? 'bg-yellow-500 text-black shadow font-black'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Cuadro Eliminatorias (desde 1/16)</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VISTA 1: LIGAS NACIONALES (LAS 5 GRANDES LIGAS Y 4 DIVISIONES) */}
      {/* ============================================================== */}
      {competitionView === 'league' && (
        <>
          {/* SELECTOR INTERACTIVO DE PAÍS Y DIVISIÓN */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            {/* Selector de Países */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>País / Liga Nacional:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
                {COUNTRIES_CATALOG.map((c) => {
                  const isSelected = selectedCountry === c.id;
                  const isUserHome = userCountry === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c.id);
                        const countryDivs = getDivisionsByCountry(c.id);
                        if (countryDivs.length > 0) {
                          setActiveTabDivisionId(countryDivs[0].id);
                        }
                      }}
                      className={clsx(
                        'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap',
                        isSelected
                          ? 'bg-cyan-500 text-black border-cyan-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      )}
                    >
                      <span>{c.flag}</span>
                      <span>{c.nameEs}</span>
                      {isUserHome && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-mono ml-0.5">
                          Tu País
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pestañas de las 4 Divisiones de 24 clubes */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Categoría:</span>
              </span>
              {availableDivisions.map((div) => {
                const isTabActive = activeDivisionInfo.id === div.id;
                const isUserClubDiv = userDivisionId === div.id;

                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setActiveTabDivisionId(div.id)}
                    className={clsx(
                      'shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2',
                      isTabActive
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-lg font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    )}
                  >
                    <span>Nivel {div.tier}: {div.name}</span>
                    {isUserClubDiv && (
                      <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.2 rounded font-black uppercase tracking-wider animate-pulse">
                        Tu División
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CABECERA DINÁMICA DE LA DIVISIÓN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Nivel {tier} · {activeDivisionInfo.countryNameEs || activeDivisionInfo.country || 'Europa'}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Clasificación {divisionName}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Temporada {currentSeason} · {totalTeams} Clubes compitiendo exclusivamente en esta categoría
                {isViewingUserDivision ? ' (Liga en disputa en vivo)' : ' (Simulación de la pirámide de ascenso)'}
              </p>
            </div>

            {isSeasonCompleted && (
              <button
                type="button"
                onClick={proceedToNextSeason}
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black text-xs rounded-xl shadow-xl animate-pulse flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Avanzar a Temporada {currentSeason + 1}</span>
              </button>
            )}
          </div>

          {/* TABLA OFICIAL DE POSICIONES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* VISTA ESCRITORIO (PC) - 100% INTACTA */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2 sm:p-3 w-8 sm:w-12 text-center">Pos</th>
                    <th className="p-2 sm:p-3 min-w-[120px] sm:min-w-[180px]">Club</th>
                    <th className="p-2 sm:p-3 text-center w-8 sm:w-10">PJ</th>
                    <th className="p-2 sm:p-3 text-center w-8 sm:w-10">PG</th>
                    <th className="p-3 text-center w-10 hidden sm:table-cell">PE</th>
                    <th className="p-3 text-center w-10 hidden sm:table-cell">PP</th>
                    <th className="p-3 text-center w-12 hidden sm:table-cell">GF</th>
                    <th className="p-3 text-center w-12 hidden sm:table-cell">GC</th>
                    <th className="p-2 sm:p-3 text-center w-10 sm:w-12">DG</th>
                    <th className="p-2 sm:p-3 text-center w-10 sm:w-14 font-black text-white">PTS</th>
                    <th className="p-3 text-center hidden md:table-cell min-w-[100px]">Últimos 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {displayedTable.map((row, idx) => {
                    const pos = idx + 1;
                    const isUser = row.clubId === userClubId;
                    const zone = getZoneBadge(pos);
                    const lastFive = (row.formHistory || []).slice(-5);

                    return (
                      <tr
                        key={row.clubId}
                        className={clsx(
                          'transition-colors',
                          isUser
                            ? 'bg-cyan-950/60 hover:bg-cyan-900/60 text-white font-bold'
                            : 'hover:bg-slate-800/40 text-slate-300',
                          zone.border
                        )}
                      >
                        <td className="p-2 sm:p-3 text-center">
                          <span
                            className={clsx(
                              'w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg inline-flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm',
                              zone.bg
                            )}
                          >
                            {pos}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm truncate">{row.clubName}</span>
                            {isUser && (
                              <span className="text-[8px] sm:text-[9px] bg-cyan-500 text-black px-1 sm:px-1.5 py-0.2 rounded font-black tracking-wider uppercase shrink-0">
                                TÚ
                              </span>
                            )}
                            {zone.tag && (
                              <span
                                className={clsx(
                                  'text-[9px] px-1.5 py-0.2 rounded font-mono font-bold hidden lg:inline-block shrink-0',
                                  zone.isSpecial
                                    ? 'bg-slate-800/80 text-cyan-300 border border-slate-700'
                                    : 'text-slate-500'
                                )}
                              >
                                {zone.tag}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 text-center text-slate-400">{row.played}</td>
                        <td className="p-2 sm:p-3 text-center">{row.won}</td>
                        <td className="p-3 text-center hidden sm:table-cell">{row.drawn}</td>
                        <td className="p-3 text-center hidden sm:table-cell">{row.lost}</td>
                        <td className="p-3 text-center text-slate-400 hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="p-3 text-center text-slate-400 hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td
                          className={clsx(
                            'p-2 sm:p-3 text-center font-bold',
                            row.goalDifference > 0
                              ? 'text-emerald-400'
                              : row.goalDifference < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          )}
                        >
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="p-2 sm:p-3 text-center font-black text-xs sm:text-sm text-cyan-400 bg-slate-950/40">
                          {row.points}
                        </td>
                        <td className="p-3 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {lastFive.length > 0 ? (
                              lastFive.map((res, fIdx) => (
                                <span
                                  key={fIdx}
                                  className={clsx(
                                    'w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shadow-xs',
                                    res === 'W' && 'bg-emerald-500 text-black',
                                    res === 'D' && 'bg-amber-500 text-black',
                                    res === 'L' && 'bg-rose-500 text-white'
                                  )}
                                >
                                  {res}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL (PANTALLAS PEQUEÑAS) - ULTRA LEGIBLE Y TÁCTIL */}
            <div className="sm:hidden">
              {/* Cabecera compacta móvil */}
              <div className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 px-3 py-2 flex items-center justify-between font-mono font-bold">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center">Pos</span>
                  <span>Club</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="w-6 text-center">PJ</span>
                  <span className="w-8 text-center">DG</span>
                  <span className="w-9 text-center text-cyan-400">PTS</span>
                  <span className="w-4"></span>
                </div>
              </div>

              {/* Lista de filas de la clasificación */}
              <div className="divide-y divide-slate-800/60">
                {displayedTable.map((row, idx) => {
                  const pos = idx + 1;
                  const isUser = row.clubId === userClubId;
                  const zone = getZoneBadge(pos);
                  const isExpanded = expandedClubId === row.clubId;
                  const lastFive = (row.formHistory || []).slice(-5);

                  return (
                    <div
                      key={row.clubId}
                      className={clsx(
                        'transition-colors font-mono',
                        isUser
                          ? 'bg-cyan-950/40 hover:bg-cyan-950/60'
                          : 'hover:bg-slate-800/30',
                        zone.border
                      )}
                    >
                      {/* Fila principal táctil */}
                      <button
                        type="button"
                        onClick={() => setExpandedClubId(isExpanded ? null : row.clubId)}
                        className="w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={clsx(
                              'w-6 h-6 rounded-lg shrink-0 inline-flex items-center justify-center font-bold text-[11px] shadow-sm',
                              zone.bg
                            )}
                          >
                            {pos}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={clsx(
                                  'font-bold text-xs truncate font-sans',
                                  isUser ? 'text-cyan-300' : 'text-white'
                                )}
                              >
                                {row.clubName}
                              </span>
                              {isUser && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 py-0.2 rounded font-black tracking-wider uppercase shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            {zone.tag && zone.isSpecial && (
                              <span className="text-[9px] text-slate-400 font-sans block">
                                {zone.tag}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                          <span className="w-6 text-center text-slate-400">{row.played}</span>
                          <span
                            className={clsx(
                              'w-8 text-center font-bold',
                              row.goalDifference > 0
                                ? 'text-emerald-400'
                                : row.goalDifference < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            )}
                          >
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </span>
                          <span className="w-9 text-center font-black text-sm text-cyan-400 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                            {row.points}
                          </span>
                          <span className="w-4 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </button>

                      {/* Panel expandido con detalles completos (PG, PE, PP, GF, GC y Forma) */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 bg-slate-950/70 border-t border-slate-800/80 space-y-2.5 text-xs animate-fadeIn">
                          <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-400 block font-sans">Victorias</span>
                              <span className="font-bold text-emerald-400">{row.won} PG</span>
                            </div>
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-400 block font-sans">Empates</span>
                              <span className="font-bold text-amber-400">{row.drawn} PE</span>
                            </div>
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-400 block font-sans">Derrotas</span>
                              <span className="font-bold text-rose-400">{row.lost} PP</span>
                            </div>
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-400 block font-sans">Goles +</span>
                              <span className="font-bold text-cyan-400">{row.goalsFor} GF</span>
                            </div>
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-400 block font-sans">Goles -</span>
                              <span className="font-bold text-slate-300">{row.goalsAgainst} GC</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">
                              Racha últimos 5 partidos:
                            </span>
                            <div className="flex items-center gap-1.5 font-mono">
                              {lastFive.length > 0 ? (
                                lastFive.map((res, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className={clsx(
                                      'w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shadow-xs',
                                      res === 'W' && 'bg-emerald-500 text-black',
                                      res === 'D' && 'bg-amber-500 text-black',
                                      res === 'L' && 'bg-rose-500 text-white'
                                    )}
                                  >
                                    {res}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-600 font-sans">Sin partidos disputados</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LEYENDA DINÁMICA DE ZONAS SEGÚN EL TIER */}
            <div className="bg-slate-950/90 p-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold">
              {tier === 1 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block shadow-sm" />
                    <span>1.º Campeón de Liga</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                    <span>2.º al 4.º Zona Élite</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                    <span>5.º y 6.º Europa</span>
                  </div>
                  {relegDirect > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                      <span>
                        {totalTeams - relegDirect + 1}.º al {totalTeams}.º Descenso Directo
                      </span>
                    </div>
                  )}
                  {relegPlayoff > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                      <span>Playout / Permanencia</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {promDirect > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                      <span>1.º al {promDirect}.º Ascenso Directo</span>
                    </div>
                  )}
                  {promPlayoff > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                      <span>
                        {promPlayoff === 1
                          ? `${promDirect + 1}.º Playoff de Ascenso`
                          : `${promDirect + 1}.º al ${promDirect + promPlayoff}.º Playoff de Ascenso`}
                      </span>
                    </div>
                  )}
                  {relegDirect > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                      <span>
                        {totalTeams - relegDirect + 1}.º al {totalTeams}.º Descenso Directo
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span>ℹ️ En 4.ª división no hay descensos (solo ascensos a 3.ª)</span>
                    </div>
                  )}
                  {relegPlayoff > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                      <span>Playout / Permanencia</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* TABLAS DE GOLEADORES Y ASISTENTES DE LA DIVISIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PICHICHI (GOLEADORES DE LA DIVISIÓN) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Máximos Goleadores (Pichichi)</span>
                </h4>
                <span className="text-[10px] text-slate-500 uppercase font-mono">{divisionName}</span>
              </div>

              <div className="space-y-2">
                {topScorers.length > 0 ? (
                  topScorers.map((p, idx) => {
                    const c = clubs.find((club) => club.id === p.clubId);
                    const isUserPlayer = p.clubId === userClubId;
                    return (
                      <div
                        key={p.id}
                        className={clsx(
                          'p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors',
                          isUserPlayer
                            ? 'bg-cyan-950/40 border-cyan-500/40'
                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={clsx(
                              'w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px]',
                              idx === 0
                                ? 'bg-yellow-500 text-black'
                                : idx === 1
                                ? 'bg-slate-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'text-slate-500 bg-slate-900'
                            )}
                          >
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div
                              className={clsx(
                                'font-bold truncate flex items-center gap-1.5',
                                isUserPlayer ? 'text-cyan-300' : 'text-white'
                              )}
                            >
                              <span>{p.name}</span>
                              {isUserPlayer && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.1 rounded font-mono">
                                  Tu Club
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{c?.name || 'Club'}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-cyan-400">{p.seasonGoals}</span>
                          <span className="text-[10px] text-slate-500 block">goles</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Aún no se han anotado goles en esta división.
                  </div>
                )}
              </div>
            </div>

            {/* ASISTENCIAS DE LA DIVISIÓN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Máximos Asistentes</span>
                </h4>
                <span className="text-[10px] text-slate-500 uppercase font-mono">{divisionName}</span>
              </div>

              <div className="space-y-2">
                {topAssists.length > 0 ? (
                  topAssists.map((p, idx) => {
                    const c = clubs.find((club) => club.id === p.clubId);
                    const isUserPlayer = p.clubId === userClubId;
                    return (
                      <div
                        key={p.id}
                        className={clsx(
                          'p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors',
                          isUserPlayer
                            ? 'bg-cyan-950/40 border-cyan-500/40'
                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={clsx(
                              'w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px]',
                              idx === 0
                                ? 'bg-yellow-500 text-black'
                                : idx === 1
                                ? 'bg-slate-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'text-slate-500 bg-slate-900'
                            )}
                          >
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div
                              className={clsx(
                                'font-bold truncate flex items-center gap-1.5',
                                isUserPlayer ? 'text-cyan-300' : 'text-white'
                              )}
                            >
                              <span>{p.name}</span>
                              {isUserPlayer && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.1 rounded font-mono">
                                  Tu Club
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{c?.name || 'Club'}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-cyan-400">{p.seasonAssists}</span>
                          <span className="text-[10px] text-slate-500 block">asistencias</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Aún no se han registrado asistencias en esta división.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: UEFA CHAMPIONS LEAGUE (FASE DE LIGA 36 CLUBES & CUADRO DESDE 16) */}
      {/* ========================================================================= */}
      {competitionView === 'ucl' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CABECERA GENERAL UEFA CHAMPIONS LEAGUE */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Trofeo Oficial: Coupe des Clubs Champions Européens ("La Orejona")</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  <span>UEFA Champions League</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  36 clubes de élite compitiendo bajo el formato suizo de la UEFA. 
                  <span className="text-emerald-400 font-bold ml-1">Puestos 1-8 directos a Octavos</span> · 
                  <span className="text-cyan-400 font-bold ml-1">Puestos 9-24 a Play-off de Dieciseisavos (1/16)</span>.
                </p>
              </div>

              {/* Botón de acceso rápido entre Fase de Liga y Eliminatorias */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUclSubView('table')}
                  className={clsx(
                    'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border',
                    uclSubView === 'table'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30 font-black'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  )}
                >
                  <Layers className="w-4 h-4" />
                  <span>Fase de Liga (36)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUclSubView('bracket')}
                  className={clsx(
                    'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border',
                    uclSubView === 'bracket'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/20 font-black'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  )}
                >
                  <Swords className="w-4 h-4" />
                  <span>Cuadro desde 1/16</span>
                </button>
              </div>
            </div>

            {/* BANNERS INFORMATIVOS DE PROGRESIÓN UEFA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-950/90 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center text-sm shrink-0 shadow-lg shadow-emerald-500/30">
                  1-8
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-emerald-300">Octavos Directos</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                      Cabezas de Serie
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Clasifican directo sin jugar Dieciseisavos (esperan rival en 8vos).
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/90 border border-cyan-500/40 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-sm shrink-0 shadow-lg shadow-cyan-500/30">
                  9-24
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-cyan-300">Play-off 1/16 (16vos)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                      A doble partido
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    16 clubes compiten por las 8 plazas restantes a Octavos de Final.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/90 border border-rose-600/40 p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/50 font-bold flex items-center justify-center text-sm shrink-0">
                  25-36
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-rose-400">Eliminación Directa</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600/30 font-mono">
                      Sin caída
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Eliminados definitivamente sin acceso a Europa League ni Conference.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SUBVISTA A: CLASIFICACIÓN DE LA FASE DE LIGA (36 EQUIPOS) */}
          {uclSubView === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* TABLA ESCRITORIO (PC) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-12 text-center">Pos</th>
                      <th className="p-3 min-w-[220px]">Club</th>
                      <th className="p-3 text-center w-10">PJ</th>
                      <th className="p-3 text-center w-10">PG</th>
                      <th className="p-3 text-center w-10">PE</th>
                      <th className="p-3 text-center w-10">PP</th>
                      <th className="p-3 text-center w-12">GF</th>
                      <th className="p-3 text-center w-12">GC</th>
                      <th className="p-3 text-center w-12">DG</th>
                      <th className="p-3 text-center w-14 font-black text-white">PTS</th>
                      <th className="p-3 text-center min-w-[150px]">Destino Oficial UEFA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {uefaTable.map((row, idx) => {
                      const pos = idx + 1;
                      const isUser = row.clubId === userClubId;
                      const zone = getZoneBadgeUefa(pos);
                      const clubObj = clubsMap[row.clubId];
                      const flag = getCountryFlag(clubObj?.country);

                      return (
                        <tr
                          key={row.clubId}
                          className={clsx(
                            'transition-colors',
                            isUser
                              ? 'bg-cyan-950/60 hover:bg-cyan-900/60 text-white font-bold'
                              : 'hover:bg-slate-800/40 text-slate-300',
                            zone.border
                          )}
                        >
                          <td className="p-3 text-center">
                            <span
                              className={clsx(
                                'w-6 h-6 rounded-lg inline-flex items-center justify-center font-bold text-xs shadow-sm',
                                zone.bg
                              )}
                            >
                              {pos}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base shrink-0" title={clubObj?.country || 'Europa'}>
                                {flag}
                              </span>
                              <span className="font-bold text-white text-sm truncate font-sans">
                                {row.clubName}
                              </span>
                              {isUser && (
                                <span className="text-[9px] bg-cyan-500 text-black px-1.5 py-0.2 rounded font-black tracking-wider uppercase shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-slate-400">{row.played}</td>
                          <td className="p-3 text-center">{row.won}</td>
                          <td className="p-3 text-center">{row.drawn}</td>
                          <td className="p-3 text-center">{row.lost}</td>
                          <td className="p-3 text-center text-slate-400">{row.goalsFor}</td>
                          <td className="p-3 text-center text-slate-400">{row.goalsAgainst}</td>
                          <td
                            className={clsx(
                              'p-3 text-center font-bold',
                              row.goalDifference > 0
                                ? 'text-emerald-400'
                                : row.goalDifference < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            )}
                          >
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                          <td className="p-3 text-center font-black text-sm text-cyan-400 bg-slate-950/50">
                            {row.points}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={clsx(
                                'text-[10px] px-2.5 py-1 rounded-full font-bold font-sans border inline-block whitespace-nowrap',
                                zone.badgeColor
                              )}
                            >
                              {zone.tag}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TABLA MÓVIL OPTIMIZADA TÁCTIL */}
              <div className="sm:hidden">
                <div className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 px-3 py-2 flex items-center justify-between font-mono font-bold">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">Pos</span>
                    <span>Club</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="w-6 text-center">PJ</span>
                    <span className="w-8 text-center">DG</span>
                    <span className="w-9 text-center text-cyan-400">PTS</span>
                    <span className="w-4"></span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {uefaTable.map((row, idx) => {
                    const pos = idx + 1;
                    const isUser = row.clubId === userClubId;
                    const zone = getZoneBadgeUefa(pos);
                    const isExpanded = expandedUclClubId === row.clubId;
                    const clubObj = clubsMap[row.clubId];
                    const flag = getCountryFlag(clubObj?.country);

                    return (
                      <div
                        key={row.clubId}
                        className={clsx(
                          'transition-colors font-mono',
                          isUser
                            ? 'bg-cyan-950/40 hover:bg-cyan-950/60'
                            : 'hover:bg-slate-800/30',
                          zone.border
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedUclClubId(isExpanded ? null : row.clubId)}
                          className="w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span
                              className={clsx(
                                'w-6 h-6 rounded-lg shrink-0 inline-flex items-center justify-center font-bold text-[11px] shadow-sm',
                                zone.bg
                              )}
                            >
                              {pos}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs shrink-0">{flag}</span>
                                <span
                                  className={clsx(
                                    'font-bold text-xs truncate font-sans',
                                    isUser ? 'text-cyan-300 font-black' : 'text-white'
                                  )}
                                >
                                  {row.clubName}
                                </span>
                                {isUser && (
                                  <span className="text-[8px] bg-cyan-500 text-black px-1 py-0.2 rounded font-black tracking-wider uppercase shrink-0">
                                    TÚ
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-sans block mt-0.5">
                                {zone.tag}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                            <span className="w-6 text-center text-slate-400">{row.played}</span>
                            <span
                              className={clsx(
                                'w-8 text-center font-bold',
                                row.goalDifference > 0
                                  ? 'text-emerald-400'
                                  : row.goalDifference < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              )}
                            >
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </span>
                            <span className="w-9 text-center font-black text-sm text-cyan-400 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                              {row.points}
                            </span>
                            <span className="w-4 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </div>
                        </button>

                        {/* Detalle expandido en móvil */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 bg-slate-950/80 border-t border-slate-800/80 space-y-2 text-xs animate-fadeIn">
                            <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-[9px] text-slate-400 block font-sans">PG</span>
                                <span className="font-bold text-emerald-400">{row.won}</span>
                              </div>
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-[9px] text-slate-400 block font-sans">PE</span>
                                <span className="font-bold text-amber-400">{row.drawn}</span>
                              </div>
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-[9px] text-slate-400 block font-sans">PP</span>
                                <span className="font-bold text-rose-400">{row.lost}</span>
                              </div>
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-[9px] text-slate-400 block font-sans">GF</span>
                                <span className="font-bold text-cyan-400">{row.goalsFor}</span>
                              </div>
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <span className="text-[9px] text-slate-400 block font-sans">GC</span>
                                <span className="font-bold text-slate-300">{row.goalsAgainst}</span>
                              </div>
                            </div>

                            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-sans">Estado UEFA:</span>
                              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-bold font-sans border', zone.badgeColor)}>
                                {zone.subTag}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LEYENDA UEFA OFICIAL */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                  <span>1.º al 8.º: Octavos de Final directos (Cabezas de serie)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block shadow-sm" />
                  <span>9.º al 24.º: Play-off de Dieciseisavos (1/16 a doble partido)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-sm" />
                  <span>25.º al 36.º: Eliminación directa continental</span>
                </div>
              </div>
            </div>
          )}

          {/* SUBVISTA B: CUADRO DE ELIMINATORIAS (DESDE 1/16 HASTA LA FINAL) */}
          {uclSubView === 'bracket' && (
            <div className="space-y-6">
              {/* FILTROS DE RONDA */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Todos los Cruces', icon: Trophy, count: 23 },
                  { id: 'playoff_16', label: 'Play-off 1/16 (16vos)', icon: Swords, count: 8 },
                  { id: 'round_of_16', label: 'Octavos de Final', icon: Shield, count: 8 },
                  { id: 'quarter', label: 'Cuartos de Final (1/4)', icon: Medal, count: 4 },
                  { id: 'semi', label: 'Semifinales (1/2)', icon: Flame, count: 2 },
                  { id: 'final', label: '¡Gran Final!', icon: Star, count: 1 },
                ].map((tab) => {
                  const isAct = bracketFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBracketFilter(tab.id as any)}
                      className={clsx(
                        'shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 whitespace-nowrap',
                        isAct
                          ? 'bg-yellow-500 text-black border-yellow-400 font-black shadow-lg shadow-yellow-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 1. PLAY-OFF DE DIECISEISAVOS (1/16) */}
              {(bracketFilter === 'all' || bracketFilter === 'playoff_16') && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Swords className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-base font-black text-white">Play-off de Dieciseisavos (1/16)</h4>
                        <p className="text-[11px] text-slate-400">
                          Puestos 9.º al 24.º de la Fase de Liga a doble partido. Los 8 ganadores avanzan a Octavos.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono font-bold self-start sm:self-auto">
                      8 Cruces Eliminatorios
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {uefaBracket.playoff16.map((m) => {
                      const isUserHome = m.homeTeam.id === userClubId;
                      const isUserAway = m.awayTeam.id === userClubId;
                      const isUser = isUserHome || isUserAway;
                      const homeWin = m.winnerTeamId === m.homeTeam.id;
                      const awayWin = m.winnerTeamId === m.awayTeam.id;

                      return (
                        <div
                          key={m.id}
                          className={clsx(
                            'rounded-2xl border p-3 transition-all space-y-2',
                            isUser
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold">{m.stageName}</span>
                            <span
                              className={clsx(
                                'px-2 py-0.2 rounded-full font-bold',
                                m.isPlayed
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              )}
                            >
                              {m.statusLabel}
                            </span>
                          </div>

                          {/* Local */}
                          <div
                            className={clsx(
                              'flex items-center justify-between p-2 rounded-xl transition-colors',
                              homeWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{getCountryFlag(m.homeTeam.country)}</span>
                              <span
                                className={clsx(
                                  'text-xs font-bold truncate',
                                  isUserHome ? 'text-cyan-300 font-black' : homeWin ? 'text-emerald-300' : 'text-white'
                                )}
                              >
                                {m.homeTeam.name}
                              </span>
                              {isUserHome && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-xs font-black px-1', homeWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.homeScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                              {homeWin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          </div>

                          {/* Visitante */}
                          <div
                            className={clsx(
                              'flex items-center justify-between p-2 rounded-xl transition-colors',
                              awayWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{getCountryFlag(m.awayTeam.country)}</span>
                              <span
                                className={clsx(
                                  'text-xs font-bold truncate',
                                  isUserAway ? 'text-cyan-300 font-black' : awayWin ? 'text-emerald-300' : 'text-white'
                                )}
                              >
                                {m.awayTeam.name}
                              </span>
                              {isUserAway && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-xs font-black px-1', awayWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                              {awayWin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. OCTAVOS DE FINAL (CABEZAS DE SERIE DIRECTOS ESPERANDO) */}
              {(bracketFilter === 'all' || bracketFilter === 'round_of_16') && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-base font-black text-white">Octavos de Final</h4>
                        <p className="text-[11px] text-slate-400">
                          Los 8 Cabezas de Serie (puestos 1 al 8 con pase DIRECTO) vs los 8 clasificados de Dieciseisavos.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono font-bold self-start sm:self-auto">
                      8 Cabezas de Serie Directos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {uefaBracket.roundOf16.map((m) => {
                      const isUserHome = m.homeTeam.id === userClubId;
                      const isUserAway = m.awayTeam.id === userClubId;
                      const isUser = isUserHome || isUserAway;
                      const homeWin = m.winnerTeamId === m.homeTeam.id;
                      const awayWin = m.winnerTeamId === m.awayTeam.id;

                      return (
                        <div
                          key={m.id}
                          className={clsx(
                            'rounded-2xl border p-3 transition-all space-y-2',
                            isUser
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold">{m.stageName}</span>
                            <span
                              className={clsx(
                                'px-2 py-0.2 rounded-full font-bold',
                                m.isPlayed
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              )}
                            >
                              {m.statusLabel}
                            </span>
                          </div>

                          {/* Cabeza de Serie (1º al 8º) */}
                          <div
                            className={clsx(
                              'flex items-center justify-between p-2 rounded-xl transition-colors',
                              homeWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{getCountryFlag(m.homeTeam.country)}</span>
                              <div className="truncate">
                                <span
                                  className={clsx(
                                    'text-xs font-bold truncate block',
                                    isUserHome ? 'text-cyan-300 font-black' : homeWin ? 'text-emerald-300' : 'text-white'
                                  )}
                                >
                                  {m.homeTeam.name}
                                </span>
                                <span className="text-[8px] text-emerald-400 font-mono block">
                                  Cabeza de Serie
                                </span>
                              </div>
                              {isUserHome && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-xs font-black px-1', homeWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.homeScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                              {homeWin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          </div>

                          {/* Clasificado del Play-off 1/16 */}
                          <div
                            className={clsx(
                              'flex items-center justify-between p-2 rounded-xl transition-colors',
                              awayWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{getCountryFlag(m.awayTeam.country)}</span>
                              <div className="truncate">
                                <span
                                  className={clsx(
                                    'text-xs font-bold truncate block',
                                    isUserAway ? 'text-cyan-300 font-black' : awayWin ? 'text-emerald-300' : 'text-white'
                                  )}
                                >
                                  {m.awayTeam.name}
                                </span>
                                <span className="text-[8px] text-cyan-400 font-mono block">
                                  Clasificado 1/16
                                </span>
                              </div>
                              {isUserAway && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-xs font-black px-1', awayWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                              {awayWin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. CUARTOS DE FINAL */}
              {(bracketFilter === 'all' || bracketFilter === 'quarter') && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Medal className="w-5 h-5 text-yellow-400" />
                      <div>
                        <h4 className="text-base font-black text-white">Cuartos de Final (1/4)</h4>
                        <p className="text-[11px] text-slate-400">
                          Los 8 mejores clubes de Europa rumbo a semifinales a doble partido.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-500/30 font-mono font-bold">
                      4 Cruces
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {uefaBracket.quarters.map((m) => {
                      const isUserHome = m.homeTeam.id === userClubId;
                      const isUserAway = m.awayTeam.id === userClubId;
                      const isUser = isUserHome || isUserAway;
                      const homeWin = m.winnerTeamId === m.homeTeam.id;
                      const awayWin = m.winnerTeamId === m.awayTeam.id;

                      return (
                        <div
                          key={m.id}
                          className={clsx(
                            'rounded-2xl border p-3 transition-all space-y-2',
                            isUser
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold">{m.stageName}</span>
                            <span className="text-slate-400">{m.statusLabel}</span>
                          </div>

                          <div
                            className={clsx(
                              'flex items-center justify-between p-2 rounded-xl transition-colors',
                              homeWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{getCountryFlag(m.homeTeam.country)}</span>
                              <span className="text-xs font-bold truncate text-white">{m.homeTeam.name}</span>
                              {isUserHome && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-xs font-black', homeWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.homeScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                              {homeWin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                          </div>

                          <div
                            className={clsx(
                              'flex items-center justify-between p-2 rounded-xl transition-colors',
                              awayWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{getCountryFlag(m.awayTeam.country)}</span>
                              <span className="text-xs font-bold truncate text-white">{m.awayTeam.name}</span>
                              {isUserAway && (
                                <span className="text-[8px] bg-cyan-500 text-black px-1 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-xs font-black', awayWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                              {awayWin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. SEMIFINALES */}
              {(bracketFilter === 'all' || bracketFilter === 'semi') && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <div>
                        <h4 className="text-base font-black text-white">Semifinales (1/2)</h4>
                        <p className="text-[11px] text-slate-400">
                          La antesala del partido más prestigioso de clubes en el planeta.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-orange-950 text-orange-300 border border-orange-500/30 font-mono font-bold">
                      2 Cruces
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uefaBracket.semis.map((m) => {
                      const isUserHome = m.homeTeam.id === userClubId;
                      const isUserAway = m.awayTeam.id === userClubId;
                      const isUser = isUserHome || isUserAway;
                      const homeWin = m.winnerTeamId === m.homeTeam.id;
                      const awayWin = m.winnerTeamId === m.awayTeam.id;

                      return (
                        <div
                          key={m.id}
                          className={clsx(
                            'rounded-2xl border p-4 transition-all space-y-3',
                            isUser
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-xl'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          )}
                        >
                          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                            <span className="text-slate-300 font-bold">{m.stageName}</span>
                            <span className="text-slate-400">{m.statusLabel}</span>
                          </div>

                          <div
                            className={clsx(
                              'flex items-center justify-between p-2.5 rounded-xl transition-colors',
                              homeWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{getCountryFlag(m.homeTeam.country)}</span>
                              <span className="text-sm font-bold truncate text-white">{m.homeTeam.name}</span>
                              {isUserHome && (
                                <span className="text-[9px] bg-cyan-500 text-black px-1.5 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-sm font-black', homeWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.homeScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                              {homeWin && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>
                          </div>

                          <div
                            className={clsx(
                              'flex items-center justify-between p-2.5 rounded-xl transition-colors',
                              awayWin ? 'bg-emerald-950/50 border border-emerald-500/30' : 'bg-slate-900/60'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{getCountryFlag(m.awayTeam.country)}</span>
                              <span className="text-sm font-bold truncate text-white">{m.awayTeam.name}</span>
                              {isUserAway && (
                                <span className="text-[9px] bg-cyan-500 text-black px-1.5 rounded font-black shrink-0">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono shrink-0">
                              {m.isPlayed ? (
                                <span className={clsx('text-sm font-black', awayWin ? 'text-emerald-400' : 'text-slate-400')}>
                                  {m.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                              {awayWin && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. GRAN FINAL POR LA OREJONA */}
              {(bracketFilter === 'all' || bracketFilter === 'final') && (
                <div className="bg-gradient-to-b from-yellow-950/40 via-slate-900 to-slate-950 border-2 border-yellow-500/50 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Trophy className="w-64 h-64 text-yellow-400" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-yellow-500/20 pb-4 relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>¡Gran Final de la UEFA Champions League!</span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        Disputa por "La Orejona" (Coupe des Clubs Champions Européens)
                      </h4>
                      <p className="text-xs text-slate-300">
                        Partido único en campo neutral. El campeón reinará en el fútbol europeo.
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-yellow-500 text-black font-black uppercase tracking-wider shadow-lg shadow-yellow-500/30 self-start sm:self-auto">
                      Partido por el Título
                    </span>
                  </div>

                  {uefaBracket.final.map((m) => {
                    const isUserHome = m.homeTeam.id === userClubId;
                    const isUserAway = m.awayTeam.id === userClubId;
                    const isUser = isUserHome || isUserAway;
                    const homeWin = m.winnerTeamId === m.homeTeam.id;
                    const awayWin = m.winnerTeamId === m.awayTeam.id;

                    return (
                      <div
                        key={m.id}
                        className={clsx(
                          'rounded-3xl border p-4 sm:p-6 transition-all space-y-4 relative z-10',
                          isUser
                            ? 'bg-cyan-950/60 border-cyan-400 shadow-2xl'
                            : 'bg-slate-900/90 border-yellow-500/30 shadow-xl'
                        )}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Finalista 1 */}
                          <div
                            className={clsx(
                              'p-4 rounded-2xl border transition-all flex items-center justify-between',
                              homeWin
                                ? 'bg-gradient-to-r from-yellow-500/20 to-emerald-950/40 border-yellow-400 shadow-lg'
                                : 'bg-slate-950/80 border-slate-800'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl shrink-0">{getCountryFlag(m.homeTeam.country)}</span>
                              <div>
                                <span className="font-black text-sm sm:text-base text-white block truncate">
                                  {m.homeTeam.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Finalista Europeo
                                </span>
                                {isUserHome && (
                                  <span className="text-[8px] bg-cyan-500 text-black px-1.5 py-0.2 rounded font-black inline-block mt-1">
                                    TU CLUB
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              {m.isPlayed ? (
                                <span className={clsx('text-2xl font-black', homeWin ? 'text-yellow-400' : 'text-slate-400')}>
                                  {m.homeScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-500 font-sans">Por jugar</span>
                              )}
                              {homeWin && (
                                <div className="text-[10px] text-yellow-400 font-bold flex items-center gap-1 justify-end mt-1">
                                  <Trophy className="w-3 h-3 text-yellow-400" />
                                  <span>¡CAMPEÓN!</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Finalista 2 */}
                          <div
                            className={clsx(
                              'p-4 rounded-2xl border transition-all flex items-center justify-between',
                              awayWin
                                ? 'bg-gradient-to-r from-yellow-500/20 to-emerald-950/40 border-yellow-400 shadow-lg'
                                : 'bg-slate-950/80 border-slate-800'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl shrink-0">{getCountryFlag(m.awayTeam.country)}</span>
                              <div>
                                <span className="font-black text-sm sm:text-base text-white block truncate">
                                  {m.awayTeam.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Finalista Europeo
                                </span>
                                {isUserAway && (
                                  <span className="text-[8px] bg-cyan-500 text-black px-1.5 py-0.2 rounded font-black inline-block mt-1">
                                    TU CLUB
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              {m.isPlayed ? (
                                <span className={clsx('text-2xl font-black', awayWin ? 'text-yellow-400' : 'text-slate-400')}>
                                  {m.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-500 font-sans">Por jugar</span>
                              )}
                              {awayWin && (
                                <div className="text-[10px] text-yellow-400 font-bold flex items-center gap-1 justify-end mt-1">
                                  <Trophy className="w-3 h-3 text-yellow-400" />
                                  <span>¡CAMPEÓN!</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {m.isPlayed && m.winnerTeamId && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-center">
                            <span className="text-xs text-yellow-300 font-bold flex items-center justify-center gap-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span>
                                ¡Campeón Oficial de Europa: {homeWin ? m.homeTeam.name : m.awayTeam.name}!
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
