'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { Pitch2D } from '@/components/Pitch2D';
import { Formation, TacticalMentalidad, TacticalPresion, TacticalPase, Player } from '@/types/football-manager';
import { Zap, AlertTriangle, Shield, Award, Users, ArrowRightLeft, X, CheckCircle2, Info } from 'lucide-react';
import clsx from 'clsx';
import { calculatePositionalAdaptation, getFormationRoles } from '@/engine/position-engine';

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
  const [selectedReserveForBench, setSelectedReserveForBench] = useState<Player | null>(null);
  const [selectedBenchForReserve, setSelectedBenchForReserve] = useState<Player | null>(null);
  const [panelTab, setPanelTab] = useState<'bench' | 'reserves'>('bench');

  const tacticsContainerRef = useRef<HTMLDivElement>(null);

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

  // Detección de jugadores titulares fuera de posición
  const formationRoles = getFormationRoles(userClub.formation);
  const startersAdaptations = starters.map((p, idx) => {
    const assignedRole = formationRoles[idx] || p.position;
    const adaptation = calculatePositionalAdaptation(p, assignedRole);
    return {
      player: p,
      assignedRole,
      adaptation,
    };
  });
  const outOfPositionStarters = startersAdaptations.filter((sa) => sa.adaptation.penaltyOvr > 0);

  // Adaptación del titular actualmente seleccionado (si lo hay)
  const selectedStarterAdaptation = tacticsSelectedPlayer
    ? startersAdaptations.find((sa) => sa.player.id === tacticsSelectedPlayer.id)
    : null;

  // Deseleccionar al hacer clic fuera de las opciones o pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTacticsSelectedPlayer(null);
        setSelectedReserveForBench(null);
        setSelectedBenchForReserve(null);
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Si el clic proviene de botones o tarjetas con acciones tácticas interactivas, no deseleccionar
      if (
        target.closest('.interactive-player-action') ||
        target.closest('.interactive-player-card') ||
        target.closest('.interactive-role-btn')
      ) {
        return;
      }
      // En cualquier otro caso (clic fuera, clic en fondo, etc.), deseleccionar
      setTacticsSelectedPlayer(null);
      setSelectedReserveForBench(null);
      setSelectedBenchForReserve(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const clearAllSelections = () => {
    setTacticsSelectedPlayer(null);
    setSelectedReserveForBench(null);
    setSelectedBenchForReserve(null);
  };

  return (
    <div ref={tacticsContainerRef} className="space-y-6">
      {/* BARRA FLOTANTE DE SELECCIÓN ACTIVA CON BOTÓN PARA CANCELAR / DESELECCIONAR */}
      {(tacticsSelectedPlayer || selectedReserveForBench || selectedBenchForReserve) && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-500/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-medium">
              {tacticsSelectedPlayer && (
                <>
                  Modo cambio de titular activo: <b className="text-cyan-300 font-bold">{tacticsSelectedPlayer.name}</b> ({tacticsSelectedPlayer.position} · {tacticsSelectedPlayer.overall}).
                  Haz clic en cualquier jugador del banquillo o reservas para intercambiarlo, o haz clic fuera para cancelar.
                </>
              )}
              {selectedReserveForBench && (
                <>
                  Eligiendo sustituto en el banquillo para subir a <b className="text-cyan-300 font-bold">{selectedReserveForBench.name}</b> ({selectedReserveForBench.position} · {selectedReserveForBench.overall}).
                </>
              )}
              {selectedBenchForReserve && (
                <>
                  Eligiendo sustituto en la reserva para bajar a <b className="text-cyan-300 font-bold">{selectedBenchForReserve.name}</b> ({selectedBenchForReserve.position}).
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={clearAllSelections}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0 interactive-player-action"
          >
            <X className="w-3.5 h-3.5" />
            <span>Deseleccionar / Cancelar (ESC)</span>
          </button>
        </div>
      )}

      {/* ALERTA DE JUGADORES NO ELEGIBLES EN EL 11 */}
      {(hasSanctionedStarter || hasInjuredStarter) && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-500/60 rounded-2xl flex items-center gap-3 text-xs text-rose-300 font-semibold shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            <b>Aviso Táctico:</b> Tienes futbolistas sancionados o lesionados en tu 11 titular. Haz clic en ellos en la pizarra y sustitúyelos por un jugador disponible del banquillo o reservas para no disputar el partido mermado.
          </span>
        </div>
      )}

      {/* AVISO DE ADAPTACIÓN POSICIONAL Y PENALIZACIÓN DE MEDIA */}
      {outOfPositionStarters.length > 0 ? (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border border-amber-500/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300 block">
                Penalización por Posición Adaptada ({outOfPositionStarters.length} en el 11 titular):
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {outOfPositionStarters.map((s, idx) => (
                  <span key={s.player.id} className="mr-2">
                    <b>{s.player.name}</b> ({s.player.position} → {s.assignedRole}:{' '}
                    <span className="text-amber-400 font-bold">-{s.adaptation.penaltyOvr} OVR</span>, rinde al {Math.round(s.adaptation.performanceRatio * 100)}%)
                    {idx < outOfPositionStarters.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <b>Afinidad Posicional Óptima:</b> Todos los jugadores de tu 11 titular juegan en su demarcación natural o idónea (100% de rendimiento).
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
            onPlayerClick={(p) => {
              // Si ya estaba seleccionado, deseleccionar; de lo contrario seleccionar
              setTacticsSelectedPlayer((prev) => (prev?.id === p.id ? null : p));
              setSelectedReserveForBench(null);
              setSelectedBenchForReserve(null);
            }}
            onPitchClick={clearAllSelections}
          />
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              💡 Haz clic en cualquier jugador para cambiarlo o asignarle roles. Haz clic en el césped vacío para deseleccionar.
            </span>
            {tacticsSelectedPlayer && (
              <button
                type="button"
                onClick={clearAllSelections}
                className="text-cyan-400 hover:text-cyan-300 font-bold interactive-player-action"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanelTab('bench');
                  }}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all interactive-player-action',
                    panelTab === 'bench' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Banquillo ({benchPlayers.length}/7)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanelTab('reserves');
                  }}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all interactive-player-action',
                    panelTab === 'reserves' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Reservas ({reservePlayers.length})
                </button>
              </div>
            </div>

            {/* AVISO GUÍA CUANDO SE SELECCIONA UN RESERVA PARA SUBIR AL BANQUILLO */}
            {selectedReserveForBench && panelTab === 'bench' && (
              <div className="p-3 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/60 rounded-xl space-y-2 text-xs shadow-md animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                    Subir a: <b className="text-white">{selectedReserveForBench.name}</b> ({selectedReserveForBench.position} · {selectedReserveForBench.overall})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReserveForBench(null);
                    }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold interactive-player-action"
                  >
                    ✕ Cancelar
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Haz clic en <b>&quot;Quitar por {selectedReserveForBench.name.split(' ').pop()}&quot;</b> en el jugador del banquillo que deseas sustituir:
                </p>
                {benchPlayers.length < 7 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      swapBenchPlayer(selectedReserveForBench.id, selectedReserveForBench.id);
                      setSelectedReserveForBench(null);
                    }}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5 interactive-player-action"
                  >
                    <span>➕ Ocupar plaza libre en el banquillo ({benchPlayers.length}/7) sin retirar a nadie</span>
                  </button>
                )}
              </div>
            )}

            {/* AVISO GUÍA CUANDO SE SELECCIONA UN SUPLENTE PARA BAJAR A RESERVAS */}
            {selectedBenchForReserve && panelTab === 'reserves' && (
              <div className="p-3 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/60 rounded-xl space-y-2 text-xs shadow-md animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    Bajar a reservas: <b className="text-white">{selectedBenchForReserve.name}</b> ({selectedBenchForReserve.position})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBenchForReserve(null);
                    }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold interactive-player-action"
                  >
                    ✕ Cancelar
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Elige qué jugador de la reserva subirá al banquillo para reemplazarlo:
                </p>
              </div>
            )}

            {/* Subtítulo orientativo */}
            {!selectedReserveForBench && !selectedBenchForReserve && (
              <p className="text-[11px] text-slate-400">
                {panelTab === 'bench'
                  ? 'Convocados para los cambios en vivo del partido (máx 7). Puedes cambiarlos por reservas.'
                  : 'Resto de la plantilla. Haz clic en "Subir al Banquillo" y elige a quién sustituir.'}
              </p>
            )}

            {/* LISTA DE JUGADORES */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(panelTab === 'bench' ? benchPlayers : reservePlayers).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  {panelTab === 'bench'
                    ? 'No hay jugadores en el banquillo. Añade futbolistas desde Reservas eligiendo su plaza.'
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
                        'p-2.5 rounded-xl border text-xs transition-all space-y-1.5 interactive-player-card',
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
                          {/* 1. MODO: Hay un titular seleccionado en la pizarra -> Meter al 11 */}
                          {tacticsSelectedPlayer && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                swapStartingPlayer(tacticsSelectedPlayer.id, p.id);
                                clearAllSelections();
                              }}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded text-[10px] transition-all flex items-center gap-1 interactive-player-action shadow-md"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Por {tacticsSelectedPlayer.name.split(' ').pop()}
                            </button>
                          )}

                          {/* 2. MODO: Hay un reserva seleccionado para subir al banquillo y estamos en el banquillo */}
                          {!tacticsSelectedPlayer && selectedReserveForBench && panelTab === 'bench' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                swapBenchPlayer(p.id, selectedReserveForBench.id);
                                setSelectedReserveForBench(null);
                              }}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded text-[10px] transition-all flex items-center gap-1 interactive-player-action shadow-lg animate-pulse"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Quitar por {selectedReserveForBench.name.split(' ').pop()}
                            </button>
                          )}

                          {/* 3. MODO: Hay un suplente seleccionado para bajar a reservas y estamos en reservas */}
                          {!tacticsSelectedPlayer && selectedBenchForReserve && panelTab === 'reserves' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                swapBenchPlayer(selectedBenchForReserve.id, p.id);
                                setSelectedBenchForReserve(null);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black rounded text-[10px] transition-all flex items-center gap-1 interactive-player-action shadow-lg animate-pulse"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Subir por {selectedBenchForReserve.name.split(' ').pop()}
                            </button>
                          )}

                          {/* 4. MODO NORMAL en Reservas: Botón para iniciar selección de a quién sustituir del banquillo */}
                          {!tacticsSelectedPlayer && !selectedReserveForBench && !selectedBenchForReserve && panelTab === 'reserves' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReserveForBench(p);
                                setPanelTab('bench');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 font-bold rounded text-[10px] transition-all interactive-player-action flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Subir al Banquillo...
                            </button>
                          )}

                          {/* 5. MODO NORMAL en Banquillo: Botón para retirar a la reserva eligiendo sustituto */}
                          {!tacticsSelectedPlayer && !selectedReserveForBench && !selectedBenchForReserve && panelTab === 'bench' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBenchForReserve(p);
                                setPanelTab('reserves');
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-400 font-medium rounded text-[10px] transition-all interactive-player-action"
                            >
                              Bajar a Reservas...
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

          {/* Panel inferior de asignación de roles e información táctica cuando se selecciona a un titular */}
          {tacticsSelectedPlayer && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Roles para <b className="text-white">{tacticsSelectedPlayer.name}</b>:
                </span>
                <button
                  type="button"
                  onClick={clearAllSelections}
                  className="text-[10px] text-slate-500 hover:text-slate-300 interactive-player-action"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* Tarjeta de Afinidad Posicional del titular seleccionado */}
              {selectedStarterAdaptation && (
                <div
                  className={clsx(
                    'p-2 rounded-xl border text-[11px] space-y-1',
                    selectedStarterAdaptation.adaptation.badgeBg
                  )}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      Demarcación: {selectedStarterAdaptation.assignedRole} (Natural: {tacticsSelectedPlayer.position})
                    </span>
                    <span>
                      {selectedStarterAdaptation.adaptation.penaltyOvr > 0 ? (
                        <b className="text-amber-300">-{selectedStarterAdaptation.adaptation.penaltyOvr} OVR</b>
                      ) : (
                        <b className="text-emerald-300">100% Óptimo</b>
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-90">
                    {selectedStarterAdaptation.adaptation.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRole('captain', tacticsSelectedPlayer.id);
                  }}
                  className={clsx(
                    'px-2 py-1.5 rounded text-[10px] font-bold border transition-all text-center interactive-role-btn',
                    userClub.captainId === tacticsSelectedPlayer.id
                      ? 'bg-yellow-500 text-black border-yellow-400 shadow-md font-black'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/20'
                  )}
                >
                  {userClub.captainId === tacticsSelectedPlayer.id ? '★ Capitán' : 'Capitán'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRole('penalty', tacticsSelectedPlayer.id);
                  }}
                  className={clsx(
                    'px-2 py-1.5 rounded text-[10px] font-bold border transition-all text-center interactive-role-btn',
                    userClub.penaltyTakerId === tacticsSelectedPlayer.id
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/40 hover:bg-blue-500/20'
                  )}
                >
                  {userClub.penaltyTakerId === tacticsSelectedPlayer.id ? '⚽ Penaltis' : 'Penaltis'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRole('freekick', tacticsSelectedPlayer.id);
                  }}
                  className={clsx(
                    'px-2 py-1.5 rounded text-[10px] font-bold border transition-all text-center interactive-role-btn',
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
