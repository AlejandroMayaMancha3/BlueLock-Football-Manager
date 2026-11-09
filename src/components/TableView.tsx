'use client';

import React from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import { LeagueTableRow } from '@/types/football-manager';
import { getDivisionById } from '@/engine/data/divisions-catalog';

interface TableViewProps {
  leagueTable: LeagueTableRow[];
}

export const TableView: React.FC<TableViewProps> = ({ leagueTable }) => {
  const {
    currentSeason,
    userClubId,
    clubs,
    players,
    selectedDivisionId,
    isSeasonCompleted,
    proceedToNextSeason,
  } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const activeDivisionId = userClub?.divisionId || userClub?.league || selectedDivisionId || 'es_laliga';
  const divisionInfo = getDivisionById(activeDivisionId);
  const divisionName = divisionInfo?.name || 'Liga';

  const totalTeams = leagueTable.length;
  const tier = divisionInfo?.tier || 1;
  const promDirect = divisionInfo?.promotionDirect || (tier === 1 ? 0 : 2);
  const promPlayoff = divisionInfo?.promotionPlayoff || 0;
  const relegDirect = divisionInfo?.relegationDirect || (tier === 4 ? 0 : 3);
  const relegPlayoff = divisionInfo?.relegationPlayoff || 0;

  // Filtrar futbolistas exclusivamente de los clubes de esta división
  const divisionClubIds = new Set(leagueTable.map((r) => r.clubId));
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
      {/* CABECERA DINÁMICA DE LA DIVISIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
            <Trophy className="w-3.5 h-3.5" />
            Nivel {tier} · {divisionInfo?.country || 'Europa'}
          </div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <span>Clasificación {divisionName}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Temporada {currentSeason} · {totalTeams} Clubes compitiendo exclusivamente en esta categoría
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 w-12 text-center">Pos</th>
                <th className="p-3 min-w-[180px]">Club</th>
                <th className="p-3 text-center w-10">PJ</th>
                <th className="p-3 text-center w-10">PG</th>
                <th className="p-3 text-center w-10">PE</th>
                <th className="p-3 text-center w-10">PP</th>
                <th className="p-3 text-center w-12">GF</th>
                <th className="p-3 text-center w-12">GC</th>
                <th className="p-3 text-center w-12">DG</th>
                <th className="p-3 text-center w-14 font-black text-white">PTS</th>
                <th className="p-3 text-center hidden md:table-cell min-w-[100px]">Últimos 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {leagueTable.map((row, idx) => {
                const pos = idx + 1;
                const isUser = row.clubId === userClubId;
                const zone = getZoneBadge(pos);
                const lastFive = (row.formHistory || []).slice(-5);

                return (
                  <tr
                    key={row.clubId}
                    className={clsx(
                      'hover:bg-slate-800/40 transition-colors',
                      zone.border,
                      isUser ? 'bg-cyan-950/40 font-bold' : ''
                    )}
                  >
                    {/* Posición */}
                    <td className="p-3 text-center">
                      <span
                        className={clsx(
                          'w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs transition-transform',
                          zone.bg,
                          isUser && 'ring-2 ring-cyan-400'
                        )}
                      >
                        {pos}
                      </span>
                    </td>

                    {/* Club */}
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'text-sm font-bold truncate',
                            isUser ? 'text-cyan-300 font-black' : 'text-white'
                          )}
                        >
                          {row.clubName}
                        </span>
                        {isUser && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                            Tú
                          </span>
                        )}
                        {zone.isSpecial && (
                          <span className="hidden lg:inline-block text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase text-slate-400">
                            {zone.tag}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estadísticas */}
                    <td className="p-3 text-center text-slate-300 font-bold">{row.played}</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">{row.won}</td>
                    <td className="p-3 text-center text-slate-400">{row.drawn}</td>
                    <td className="p-3 text-center text-rose-400">{row.lost}</td>
                    <td className="p-3 text-center text-slate-300">{row.goalsFor}</td>
                    <td className="p-3 text-center text-slate-400">{row.goalsAgainst}</td>
                    <td className="p-3 text-center font-bold">
                      <span
                        className={clsx(
                          row.goalDifference > 0
                            ? 'text-emerald-400'
                            : row.goalDifference < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        )}
                      >
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </span>
                    </td>

                    {/* Puntos */}
                    <td className="p-3 text-center font-black text-base text-yellow-400 bg-slate-950/40">
                      {row.points}
                    </td>

                    {/* Forma últimos 5 */}
                    <td className="p-3 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {lastFive.length > 0 ? (
                          lastFive.map((res, rIdx) => (
                            <span
                              key={rIdx}
                              className={clsx(
                                'w-4 h-4 rounded text-[9px] font-black inline-flex items-center justify-center font-mono',
                                res === 'W' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                                res === 'D' && 'bg-slate-700 text-slate-300 border border-slate-600',
                                res === 'L' && 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              )}
                            >
                              {res}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* LEYENDA OFICIAL DE ZONAS */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 text-[11px] flex flex-wrap items-center gap-4 text-slate-400">
          <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-400 font-mono">
            Zonas de Clasificación:
          </span>
          {tier === 1 ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                <span>1.º Campeón de Liga</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                <span>2.º al 4.º Zona Élite</span>
              </div>
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
                  <span>Playout de Permanencia</span>
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
                    {promDirect + 1}.º al {promDirect + promPlayoff}.º Playoff de Ascenso
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
              <span>Máximos Asistentes (Pases Clave)</span>
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
                      <span className="text-[10px] text-slate-500 block">asist.</span>
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
