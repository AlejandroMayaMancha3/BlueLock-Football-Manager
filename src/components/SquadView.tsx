'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import clsx from 'clsx';
import { Zap, TrendingUp, AlertTriangle, Star, Tag, Users, UserCheck } from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { Player } from '@/types/football-manager';
import { PlayerDetailModal } from './PlayerDetailModal';

export const SquadView: React.FC = () => {
  const { userClubId, clubs, players, selectedCurrency } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.clubId === userClubId);

  const getPotentialTier = (pot: number) => {
    if (pot >= 95) {
      return {
        label: 'Mundial',
        color: 'text-amber-300 border-amber-500/50 bg-amber-950/40',
        icon: '🌟',
      };
    }
    if (pot >= 90) {
      return {
        label: 'Élite',
        color: 'text-purple-300 border-purple-500/50 bg-purple-950/40',
        icon: '💎',
      };
    }
    if (pot >= 85) {
      return {
        label: 'Promesa',
        color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/40',
        icon: '⚡',
      };
    }
    if (pot >= 80) {
      return {
        label: 'Desarrollo',
        color: 'text-blue-300 border-blue-500/50 bg-blue-950/40',
        icon: '📈',
      };
    }
    return {
      label: 'Consolidado',
      color: 'text-slate-400 border-slate-700 bg-slate-900',
      icon: '🛡️',
    };
  };

  return (
    <div className="space-y-4">
      {/* CABECERA CON LÍMITE REGLAMENTARIO DE 25 JUGADORES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-black text-white">
              Plantilla del Primer Equipo
            </h3>
            <span
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-mono font-black border flex items-center gap-1.5 shadow-sm',
                userPlayers.length >= 25
                  ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 animate-pulse'
                  : userPlayers.length >= 22
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                  : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Plantilla: {userPlayers.length} / 25 jugadores
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Límite reglamentario de 25 fichas. Haz click <b>únicamente en el nombre</b> de cualquier jugador para abrir su expediente, renovar contrato o ponerlo en venta.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 bg-amber-950/50 border border-amber-500/40 text-amber-300 rounded-lg font-bold flex items-center gap-1">
            🌟 95+ Mundial
          </span>
          <span className="px-2.5 py-1 bg-purple-950/50 border border-purple-500/40 text-purple-300 rounded-lg font-bold flex items-center gap-1">
            💎 90+ Élite
          </span>
        </div>
      </div>

      {/* ADVERTENCIA DE LÍMITE DE PLANTILLA ALCANZADO */}
      {userPlayers.length >= 25 && (
        <div className="p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-2xl flex items-center justify-between text-xs text-rose-300 font-semibold shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <b>Plantilla al completo (25/25):</b> No podrás fichar nuevos jugadores ni promocionar promesas de la cantera hasta vender a futbolistas en su menú personal para liberar plazas.
            </span>
          </div>
        </div>
      )}

      {/* TABLA DE JUGADORES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Pos</th>
                <th className="p-3">Jugador (Click en nombre para expediente)</th>
                <th className="p-3">Edad</th>
                <th className="p-3">Media Actual</th>
                <th className="p-3 text-center">Potencial Máx</th>
                <th className="p-3">Estado y Minutos</th>
                <th className="p-3">Armas / Habilidades</th>
                <th className="p-3">Físico</th>
                <th className="p-3">Salario</th>
                <th className="p-3">Valor de Mercado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[...userPlayers]
                .sort((a, b) => b.overall - a.overall)
                .map((player) => {
                  const isStarter = userClub.startingXI.includes(player.id);
                  const tier = getPotentialTier(player.potential);
                  const isStagnating = (player.consecutiveMatchesWithoutPlaying || 0) >= 3;
                  const isWasted = (player.consecutiveMatchesWithoutPlaying || 0) >= 6;
                  const isExpiring = player.contractYears <= 1;

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
                        <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                          {/* CLICK SOLO EN EL NOMBRE */}
                          <button
                            type="button"
                            onClick={() => setSelectedPlayer(player)}
                            className="font-bold text-white hover:text-cyan-400 cursor-pointer underline-offset-2 hover:underline transition-colors text-left"
                            title={`Abrir expediente completo de ${player.name}`}
                          >
                            {player.name}
                          </button>

                          {player.isTransferListed && (
                            <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded font-bold">
                              🏷️ En Venta
                            </span>
                          )}

                          {isExpiring && (
                            <span className="text-[9px] bg-rose-950/80 text-rose-300 border border-rose-500/50 px-1.5 py-0.2 rounded font-bold animate-pulse">
                              ⚠️ 1 año
                            </span>
                          )}

                          {userClub.captainId === player.id && (
                            <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-black">C</span>
                          )}
                          {isStarter && (
                            <span className="text-[9px] bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 px-1 rounded font-bold">
                              11
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{player.nationality}</div>
                      </td>
                      <td className="p-3 text-slate-300">{player.age} años</td>
                      <td className="p-3">
                        <span className="font-black text-base text-white">{player.overall}</span>
                      </td>
                      {/* COLUMNA POTENCIAL DEDICADA */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-black shadow-sm">
                          <span className={clsx('px-2 py-0.5 rounded-md border font-black text-xs flex items-center gap-1', tier.color)}>
                            <span>{tier.icon}</span>
                            <span>{player.potential}</span>
                            <span className="text-[9px] font-normal opacity-80 uppercase ml-0.5">{tier.label}</span>
                          </span>
                        </div>
                      </td>
                      {/* ESTADO DE MINUTOS Y PROGRESIÓN */}
                      <td className="p-3">
                        {isWasted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Degradación ({player.consecutiveMatchesWithoutPlaying} sin jugar)
                          </span>
                        ) : isStagnating ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Estancado ({player.consecutiveMatchesWithoutPlaying} sin jugar)
                          </span>
                        ) : player.seasonMatches > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3" />
                            En desarrollo ({player.seasonMatches} PJ)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Pendiente de debut</span>
                        )}
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          PJ: {player.seasonMatches} ({player.seasonMinutes || 0}&apos;) · Goles: {player.seasonGoals} · Asist: {player.seasonAssists}
                        </div>
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
                      <td className="p-3 font-mono text-slate-400">
                        {formatMoney(player.weeklyWageYen, selectedCurrency)}/sem
                      </td>
                      <td className="p-3 font-mono text-cyan-400 font-bold">
                        {formatMoney(player.marketValueYen, selectedCurrency)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLADO DE EXPEDIENTE DEL JUGADOR */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};
