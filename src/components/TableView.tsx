'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import { Flame } from 'lucide-react';
import clsx from 'clsx';
import { LeagueTableRow } from '@/types/football-manager';

interface TableViewProps {
  leagueTable: LeagueTableRow[];
}

export const TableView: React.FC<TableViewProps> = ({ leagueTable }) => {
  const { currentSeason, userClubId, clubs, players, isSeasonCompleted, proceedToNextSeason } = useGameStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white">Clasificación Neo Egoist League</h3>
          <p className="text-xs text-slate-400">Temporada {currentSeason} · 12 Clubes</p>
        </div>
        {isSeasonCompleted && (
          <button
            type="button"
            onClick={proceedToNextSeason}
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-lg animate-pulse"
          >
            🏆 Avanzar a Temporada {currentSeason + 1}
          </button>
        )}
      </div>

      {/* TABLA DE POSICIONES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 w-10">Pos</th>
              <th className="p-3">Club</th>
              <th className="p-3 text-center">PJ</th>
              <th className="p-3 text-center">PG</th>
              <th className="p-3 text-center">PE</th>
              <th className="p-3 text-center">PP</th>
              <th className="p-3 text-center">GF</th>
              <th className="p-3 text-center">GC</th>
              <th className="p-3 text-center">DG</th>
              <th className="p-3 text-center font-bold">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {leagueTable.map((row, idx) => {
              const isUser = row.clubId === userClubId;
              const isChampion = idx === 0;
              const isTopThree = idx < 3;
              return (
                <tr
                  key={row.clubId}
                  className={clsx('hover:bg-slate-800/40 transition-colors', isUser && 'bg-cyan-950/30')}
                >
                  <td className="p-3">
                    <span
                      className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                        isChampion ? 'bg-yellow-500 text-black' : isTopThree ? 'bg-cyan-900 text-cyan-200' : 'text-slate-400'
                      )}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-3 font-sans font-bold text-sm text-white flex items-center gap-2">
                    <span className={clsx(isUser && 'text-cyan-400')}>{row.clubName}</span>
                    {isUser && <span className="text-[10px] text-cyan-400 font-mono">(Tú)</span>}
                  </td>
                  <td className="p-3 text-center text-slate-300">{row.played}</td>
                  <td className="p-3 text-center text-emerald-400">{row.won}</td>
                  <td className="p-3 text-center text-slate-400">{row.drawn}</td>
                  <td className="p-3 text-center text-rose-400">{row.lost}</td>
                  <td className="p-3 text-center text-slate-300">{row.goalsFor}</td>
                  <td className="p-3 text-center text-slate-400">{row.goalsAgainst}</td>
                  <td className="p-3 text-center font-bold text-slate-200">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="p-3 text-center font-black text-sm text-yellow-400">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TABLA DE MÁXIMOS GOLEADORES (PICHICHI) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          Tabla de Máximos Goleadores (Pichichi)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...players]
            .sort((a, b) => b.seasonGoals - a.seasonGoals)
            .slice(0, 6)
            .map((p, idx) => {
              const c = clubs.find((club) => club.id === p.clubId);
              return (
                <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">{idx + 1}</span>
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{c?.name || 'Club'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-cyan-400">{p.seasonGoals}</span>
                    <span className="text-[10px] text-slate-500 block">goles</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
