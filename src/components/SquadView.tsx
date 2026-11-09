'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import clsx from 'clsx';
import { Zap } from 'lucide-react';

export const SquadView: React.FC = () => {
  const { userClubId, clubs, players } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.clubId === userClubId);

  const fmtYen = (yen: number) => {
    if (yen >= 100000000) return `${(yen / 100000000).toFixed(1)} M¥`;
    if (yen >= 10000) return `${(yen / 10000).toFixed(0)} k¥`;
    return `${yen.toLocaleString('es-ES')} ¥`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white">
          Plantilla del Primer Equipo ({userPlayers.length} jugadores)
        </h3>
        <span className="text-xs text-slate-400">Ordenados por Calidad General</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Pos</th>
                <th className="p-3">Jugador</th>
                <th className="p-3">Edad</th>
                <th className="p-3">Media</th>
                <th className="p-3">Armas / Habilidades</th>
                <th className="p-3">Físico</th>
                <th className="p-3">Moral</th>
                <th className="p-3">Estadísticas (PJ/G/A)</th>
                <th className="p-3">Salario</th>
                <th className="p-3">Valor Mercado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[...userPlayers]
                .sort((a, b) => b.overall - a.overall)
                .map((player) => {
                  const isStarter = userClub.startingXI.includes(player.id);
                  return (
                    <tr
                      key={player.id}
                      className={clsx('hover:bg-slate-800/40 transition-colors', isStarter && 'bg-cyan-950/20')}
                    >
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-cyan-300">
                          {player.position}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          {player.name}
                          {userClub.captainId === player.id && (
                            <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-black">C</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{player.nationality}</div>
                      </td>
                      <td className="p-3 text-slate-300">{player.age} años</td>
                      <td className="p-3">
                        <span className="font-black text-sm text-cyan-400">{player.overall}</span>
                        <span className="text-[10px] text-slate-500 ml-1">/{player.potential}</span>
                      </td>
                      <td className="p-3">
                        {player.weapons && player.weapons.length > 0 ? (
                          <div className="space-y-0.5">
                            {player.weapons.map((w, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-purple-950 text-purple-300 border border-purple-800 text-[10px] px-1.5 py-0.5 rounded mr-1"
                              >
                                ⚡ {w.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full" style={{ width: `${player.fitness}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-300">{player.fitness}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={clsx(
                            'text-[10px] font-bold',
                            player.morale >= 80 ? 'text-emerald-400' : 'text-yellow-400'
                          )}
                        >
                          {player.morale}%
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {player.seasonMatches} /{' '}
                        <span className="text-emerald-400 font-bold">{player.seasonGoals}</span> / {player.seasonAssists}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{fmtYen(player.weeklyWageYen)}/sem</td>
                      <td className="p-3 font-mono text-cyan-400 font-bold">{fmtYen(player.marketValueYen)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
