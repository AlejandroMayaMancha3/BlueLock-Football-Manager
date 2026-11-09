'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import { LeagueTableRow, CountryLeague } from '@/types/football-manager';
import { getDivisionById, getDivisionsByCountry, COUNTRIES_CATALOG } from '@/engine/data/divisions-catalog';
import { simulateAiDivisionTable } from '@/engine/season-engine';

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
    selectedDivisionId,
    isSeasonCompleted,
    proceedToNextSeason,
  } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userDivisionId = userClub?.divisionId || userClub?.league || selectedDivisionId || 'es_laliga';
  const userCountry = (userClub?.country as CountryLeague) || 'Spain';

  // Estados de navegación para explorar cualquier división del país o del continente
  const [selectedCountry, setSelectedCountry] = useState<CountryLeague>(userCountry);
  const [activeTabDivisionId, setActiveTabDivisionId] = useState<string>(userDivisionId);
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);

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
    </div>
  );
};
