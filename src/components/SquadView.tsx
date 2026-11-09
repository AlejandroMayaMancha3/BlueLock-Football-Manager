'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import clsx from 'clsx';
import { Zap, TrendingUp, AlertTriangle, Star, Tag, Users, UserCheck, Search, Filter, ArrowUpDown } from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { Player } from '@/types/football-manager';
import { checkIsProdigy } from '@/engine/weapon-registry';
import { PlayerDetailModal } from './PlayerDetailModal';

export const SquadView: React.FC = () => {
  const { userClubId, clubs, players, selectedCurrency } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'overall' | 'potential' | 'position' | 'age' | 'wage'>('overall');

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

  const filteredAndSortedPlayers = [...userPlayers]
    .filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (posFilter !== 'ALL') {
        if (posFilter === 'EI') {
          if (p.position !== 'EI' && p.position !== 'ED') return false;
        } else if (posFilter === 'MC') {
          if (!['MC', 'MCO', 'MCD', 'MI', 'MD'].includes(p.position)) return false;
        } else if (posFilter === 'DFC') {
          if (!['DFC', 'LI', 'LD', 'CAI', 'CAD'].includes(p.position)) return false;
        } else if (p.position !== posFilter) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'overall') return b.overall - a.overall;
      if (sortBy === 'potential') return b.potential - a.potential;
      if (sortBy === 'age') return a.age - b.age;
      if (sortBy === 'wage') return b.weeklyWageYen - a.weeklyWageYen;
      if (sortBy === 'position') return a.position.localeCompare(b.position);
      return 0;
    });

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

      {/* BARRA DE FILTROS Y ORDENACIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Posición:</span>
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
            >
              <option value="ALL">Todas ({userPlayers.length})</option>
              <option value="DC">Delanteros (DC)</option>
              <option value="EI">Extremos (EI/ED)</option>
              <option value="MC">Centrocampistas (MC/MCO/MCD/MI/MD)</option>
              <option value="DFC">Defensas (DFC/LI/LD/CAI/CAD)</option>
              <option value="POR">Porteros (POR)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
            >
              <option value="overall">Mayor Media (OVR)</option>
              <option value="potential">Mayor Potencial (POT)</option>
              <option value="age">Menor Edad (Promesas)</option>
              <option value="wage">Mayor Salario</option>
              <option value="position">Posición Táctica</option>
            </select>
          </div>
        </div>
      </div>

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
              {filteredAndSortedPlayers.map((player) => {
                const isStarter = userClub.startingXI.includes(player.id);
                const isBench = userClub.substitutes.includes(player.id);
                const isCaptain = userClub.captainId === player.id;
                const isPenalty = userClub.penaltyTakerId === player.id;
                const isFreeKick = userClub.freeKickTakerId === player.id;
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
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-cyan-300">
                          {player.position}
                        </span>
                        {player.secondaryPosition && (
                          <span
                            className="px-1 py-0.5 rounded font-bold text-[9px] bg-slate-900 border border-slate-700 text-slate-400"
                            title={`Posición secundaria dominada: ${player.secondaryPosition}`}
                          >
                            2ª:{player.secondaryPosition}
                          </span>
                        )}
                      </div>
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

                        {/* BADGES DE ESTATUS */}
                        {player.isBanned && (
                          <span className="text-[9px] bg-rose-950/90 text-rose-300 border border-rose-500/60 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            🟥 Sancionado
                          </span>
                        )}

                        {(player.injuryWeeks || 0) > 0 && (
                          <span className="text-[9px] bg-amber-950/90 text-amber-300 border border-amber-500/60 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            🏥 Lesión ({player.injuryWeeks} sem)
                          </span>
                        )}

                        {checkIsProdigy(player) && (
                          <span
                            className="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-500/50 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 shadow-sm"
                            title="Prodigio de Blue Lock: Talento precoz con potencial de élite (≤ 20 años y Potencial ≥ 90). Despierta armas tempranamente."
                          >
                            <span>🔮</span> Prodigio
                          </span>
                        )}

                        {player.positionConversion && (
                          <span
                            className="text-[9px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 shadow-sm"
                            title={`Plan de reconversión de posición activo: ${player.position} → ${player.positionConversion.targetPosition} (Semana ${player.positionConversion.weeksElapsed}/${player.positionConversion.totalWeeks})`}
                          >
                            🔄 → {player.positionConversion.targetPosition} ({Math.round((player.positionConversion.weeksElapsed / player.positionConversion.totalWeeks) * 100)}%)
                          </span>
                        )}

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

                        {isCaptain && (
                          <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-black" title="Capitán del equipo">
                            C
                          </span>
                        )}
                        {isPenalty && (
                          <span className="text-[9px] bg-blue-600 text-white px-1 rounded font-black" title="Tirador de penaltis">
                            Pen
                          </span>
                        )}
                        {isFreeKick && (
                          <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-black" title="Tirador de faltas">
                            Falta
                          </span>
                        )}

                        {isStarter ? (
                          <span className="text-[9px] bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 px-1 rounded font-bold">
                            11 Titular
                          </span>
                        ) : isBench ? (
                          <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1 rounded font-bold">
                            Banquillo
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-800 px-1 rounded">
                            Reserva
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
