'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { Pitch2D } from '@/components/Pitch2D';
import { Formation, TacticalMentalidad, TacticalPresion, TacticalPase, Player } from '@/types/football-manager';
import { Zap, AlertTriangle, Shield, Award, Users, ArrowRightLeft } from 'lucide-react';
import clsx from 'clsx';

export const TacticsView: React.FC = () => {
  const {
    userClubId,
    clubs,
    players,
    updateTactics,
    updateFormation,
    swapStartingPlayer,
    swapBenchPlayer,
    setRole,
  } = useGameStore();

  const [tacticsSelectedPlayer, setTacticsSelectedPlayer] = useState<Player | null>(null);
  const [panelTab, setPanelTab] = useState<'bench' | 'reserves'>('bench');

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const allPlayersMap = players.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Player>);

  const clubPlayers = players.filter((p) => p.clubId === userClubId);
  const starters = userClub.startingXI.map((id) => allPlayersMap[id]).filter(Boolean);
  const nonStarters = clubPlayers.filter((p) => !userClub.startingXI.includes(p.id));
  const benchPlayers = nonStarters.filter((p) => userClub.substitutes.includes(p.id));
  const reservePlayers = nonStarters.filter((p) => !userClub.substitutes.includes(p.id));

  const hasSanctionedStarter = starters.some((p) => p.isBanned);
  const hasInjuredStarter = starters.some((p) => (p.injuryWeeks || 0) > 0);

  return (
    <div className="space-y-6">
      {/* ALERTA DE JUGADORES NO ELEGIBLES EN EL 11 */}
      {(hasSanctionedStarter || hasInjuredStarter) && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-500/60 rounded-2xl flex items-center gap-3 text-xs text-rose-300 font-semibold shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            <b>Aviso Táctico:</b> Tienes futbolistas sancionados o lesionados en tu 11 titular. Haz clic en ellos en la pizarra y sustitúyelos por un jugador disponible del banquillo o reservas para no disputar el partido mermado.
          </span>
        </div>
      )}

      {/* Controles de Formación y Mentalidad */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Formación:</label>
          <select
            value={userClub.formation}
            onChange={(e) => updateFormation(e.target.value as Formation)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="4-3-3">4-3-3 Ofensiva</option>
            <option value="4-2-3-1">4-2-3-1 Equilibrada</option>
            <option value="4-4-2">4-4-2 Clásica</option>
            <option value="3-5-2">3-5-2 Posesión</option>
            <option value="5-3-2">5-3-2 Contragolpe</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Mentalidad:</label>
          <select
            value={userClub.mentalidad}
            onChange={(e) => updateTactics(e.target.value as TacticalMentalidad, userClub.presion, userClub.estiloPase)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="muy_defensiva">Muy Defensiva</option>
            <option value="defensiva">Defensiva</option>
            <option value="equilibrada">Equilibrada</option>
            <option value="ofensiva">Ofensiva</option>
            <option value="ultra_ofensiva">Ultra Ofensiva (All-in)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Presión:</label>
          <select
            value={userClub.presion}
            onChange={(e) => updateTactics(userClub.mentalidad, e.target.value as TacticalPresion, userClub.estiloPase)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="baja">Baja (Repliegue)</option>
            <option value="media">Media (Zona media)</option>
            <option value="alta">Alta (Gegenpressing)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Estilo de Pase:</label>
          <select
            value={userClub.estiloPase}
            onChange={(e) => updateTactics(userClub.mentalidad, userClub.presion, e.target.value as TacticalPase)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="posesion">Posesión Corta</option>
            <option value="directo">Pase Directo / Al Hueco</option>
            <option value="contraataque">Contraataque Veloz</option>
          </select>
        </div>
      </div>

      {/* Pizarra 2D y Banquillo / Reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Pitch2D
            club={userClub}
            allPlayersMap={allPlayersMap}
            selectedPlayerId={tacticsSelectedPlayer?.id}
            onPlayerClick={(p) => setTacticsSelectedPlayer(p)}
          />
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>💡 Haz clic en cualquier jugador de la pizarra para asignarle roles o cambiarlo por otro jugador.</span>
            {tacticsSelectedPlayer && (
              <button
                type="button"
                onClick={() => setTacticsSelectedPlayer(null)}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Deseleccionar ({tacticsSelectedPlayer.name})
              </button>
            )}
          </div>
        </div>

        {/* Panel Lateral: Suplentes, Reservas y Roles */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Cabecera y Tabs del panel */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Jugadores No Titulares ({nonStarters.length})</span>
              </h4>
              <div className="flex bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPanelTab('bench')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all',
                    panelTab === 'bench' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Banquillo ({benchPlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('reserves')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all',
                    panelTab === 'reserves' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Reservas ({reservePlayers.length})
                </button>
              </div>
            </div>

            {/* Subtítulo orientativo */}
            <p className="text-[11px] text-slate-400">
              {panelTab === 'bench'
                ? 'Convocados oficiales para los cambios en vivo del partido (máximo 7).'
                : 'Resto de la plantilla (hasta 25 jugadores). Puedes meterlos directamente al 11 o al banquillo.'}
            </p>

            {/* LISTA DE JUGADORES */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(panelTab === 'bench' ? benchPlayers : reservePlayers).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  {panelTab === 'bench'
                    ? 'No hay jugadores en el banquillo. Añade futbolistas desde Reservas.'
                    : 'No hay jugadores en la reserva. Todos tus efectivos están convocados o en el 11 titular.'}
                </div>
              ) : (
                (panelTab === 'bench' ? benchPlayers : reservePlayers).map((p) => {
                  const isCaptain = userClub.captainId === p.id;
                  const isPenalty = userClub.penaltyTakerId === p.id;
                  const isFreeKick = userClub.freeKickTakerId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={clsx(
                        'p-2.5 rounded-xl border text-xs transition-all space-y-1.5',
                        p.isBanned
                          ? 'bg-rose-950/30 border-rose-800/60'
                          : (p.injuryWeeks || 0) > 0
                          ? 'bg-amber-950/30 border-amber-800/60'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                            {p.position}
                          </span>
                          <span className="font-bold text-white text-xs">{p.name}</span>

                          {isCaptain && <span className="bg-yellow-500 text-black text-[9px] px-1 font-black rounded">C</span>}
                          {isPenalty && <span className="bg-blue-600 text-white text-[9px] px-1 font-black rounded">Pen</span>}
                          {isFreeKick && <span className="bg-emerald-600 text-white text-[9px] px-1 font-black rounded">Falta</span>}

                          {p.isBanned && (
                            <span className="bg-rose-900/80 text-rose-300 border border-rose-600/50 text-[9px] px-1 font-bold rounded">
                              🟥 Sancionado
                            </span>
                          )}
                          {(p.injuryWeeks || 0) > 0 && (
                            <span className="bg-amber-900/80 text-amber-300 border border-amber-600/50 text-[9px] px-1 font-bold rounded">
                              🏥 {p.injuryWeeks} sem
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-white font-mono font-bold">{p.overall}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-1">/ {p.potential}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>
                          {p.age} años · Fit {p.fitness}% · {p.weapons?.length ? `⚡ ${p.weapons[0].name}` : 'Sin arma'}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Botón para meter en el 11 si hay un titular seleccionado */}
                          {tacticsSelectedPlayer && (
                            <button
                              type="button"
                              onClick={() => {
                                swapStartingPlayer(tacticsSelectedPlayer.id, p.id);
                                setTacticsSelectedPlayer(null);
                              }}
                              className="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded text-[10px] transition-all flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Por {tacticsSelectedPlayer.name.split(' ').pop()}
                            </button>
                          )}

                          {/* Si está en reservas y no hay titular seleccionado, opción de pasar al banquillo */}
                          {!tacticsSelectedPlayer && panelTab === 'reserves' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (benchPlayers.length < 7) {
                                  swapBenchPlayer(p.id, p.id);
                                } else if (benchPlayers[0]) {
                                  swapBenchPlayer(benchPlayers[0].id, p.id);
                                }
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 font-bold rounded text-[10px] transition-all"
                            >
                              Al Banquillo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel inferior de asignación de roles cuando se selecciona a un jugador */}
          {tacticsSelectedPlayer && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Asignar roles a <b className="text-white">{tacticsSelectedPlayer.name}</b>:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRole('captain', tacticsSelectedPlayer.id)}
                  className={clsx(
                    'px-2 py-1.5 rounded text-[10px] font-bold border transition-all text-center',
                    userClub.captainId === tacticsSelectedPlayer.id
                      ? 'bg-yellow-500 text-black border-yellow-400 shadow-md font-black'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/20'
                  )}
                >
                  {userClub.captainId === tacticsSelectedPlayer.id ? '★ Capitán' : 'Capitán'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('penalty', tacticsSelectedPlayer.id)}
                  className={clsx(
                    'px-2 py-1.5 rounded text-[10px] font-bold border transition-all text-center',
                    userClub.penaltyTakerId === tacticsSelectedPlayer.id
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/40 hover:bg-blue-500/20'
                  )}
                >
                  {userClub.penaltyTakerId === tacticsSelectedPlayer.id ? '⚽ Penaltis' : 'Penaltis'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('freekick', tacticsSelectedPlayer.id)}
                  className={clsx(
                    'px-2 py-1.5 rounded text-[10px] font-bold border transition-all text-center',
                    userClub.freeKickTakerId === tacticsSelectedPlayer.id
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-black'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                  )}
                >
                  {userClub.freeKickTakerId === tacticsSelectedPlayer.id ? '🎯 Faltas' : 'Faltas'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
