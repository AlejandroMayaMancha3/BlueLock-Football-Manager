'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { Pitch2D } from '@/components/Pitch2D';
import { Formation, TacticalMentalidad, TacticalPresion, TacticalPase, Player } from '@/types/football-manager';
import { Zap, AlertTriangle, Shield, Award, Users, ArrowRightLeft, X, CheckCircle2, Sparkles, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { calculatePositionalAdaptation, getFormationRoles } from '@/engine/position-engine';
import { getActiveTacticalChemicalReactions } from '@/engine/weapon-registry';

export const TacticsView: React.FC = () => {
  const {
    userClubId,
    clubs,
    players,
    updateTactics,
    updateFormation,
    swapStartingPlayer,
    swapBenchPlayer,
    addToBench,
    removeFromBench,
    setRole,
  } = useGameStore();

  const [tacticsSelectedPlayer, setTacticsSelectedPlayer] = useState<Player | null>(null);
  const [selectedReserveForBench, setSelectedReserveForBench] = useState<Player | null>(null);
  const [selectedBenchForReserve, setSelectedBenchForReserve] = useState<Player | null>(null);
  const [panelTab, setPanelTab] = useState<'bench' | 'reserves'>('bench');
  const [showChemicalModal, setShowChemicalModal] = useState<boolean>(false);

  const tacticsContainerRef = useRef<HTMLDivElement>(null);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const allPlayersMap = players.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Player>);

  const clubPlayers = players.filter((p) => p.clubId === userClubId);
  const starters = userClub.startingXI.map((id) => allPlayersMap[id]).filter(Boolean);
  const nonStarters = clubPlayers.filter((p) => !userClub.startingXI.includes(p.id));
  
  // Garantizar estrictamente que el banquillo solo contenga un máximo de 7 jugadores convocados
  const benchIds = (userClub.substitutes || []).filter((id) => !userClub.startingXI.includes(id)).slice(0, 7);
  const benchPlayers = nonStarters.filter((p) => benchIds.includes(p.id));
  const reservePlayers = nonStarters.filter((p) => !benchIds.includes(p.id));

  // Auto-reparar el estado del club si arrastraba más de 7 suplentes de partidas previas
  useEffect(() => {
    if (userClub.substitutes && userClub.substitutes.length > 7) {
      const sanitized = Array.from(new Set(userClub.substitutes))
        .filter((id) => !userClub.startingXI.includes(id))
        .slice(0, 7);
      useGameStore.setState((state) => ({
        clubs: state.clubs.map((c) => (c.id === userClubId ? { ...c, substitutes: sanitized } : c)),
      }));
      useGameStore.getState().saveToStorage();
    }
  }, [userClub.substitutes, userClub.startingXI, userClubId]);

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

  // Reacciones químicas Blue Lock activas entre los titulares del 11
  const activeChemicals = getActiveTacticalChemicalReactions(starters);

  // Adaptación del titular actualmente seleccionado (si lo hay)
  const selectedStarterAdaptation = tacticsSelectedPlayer
    ? startersAdaptations.find((sa) => sa.player.id === tacticsSelectedPlayer.id)
    : null;

  const clearAllSelections = () => {
    setTacticsSelectedPlayer(null);
    setSelectedReserveForBench(null);
    setSelectedBenchForReserve(null);
  };

  // Deseleccionar al pulsar Escape o al hacer clic COMPLETAMENTE FUERA de la vista de tácticas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showChemicalModal) {
          setShowChemicalModal(false);
        } else {
          clearAllSelections();
        }
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      // Solo deseleccionar si hay algo seleccionado y el clic ocurrió fuera del contenedor de tácticas
      if (!tacticsSelectedPlayer && !selectedReserveForBench && !selectedBenchForReserve) return;
      const target = e.target as HTMLElement;
      if (tacticsContainerRef.current && !tacticsContainerRef.current.contains(target)) {
        clearAllSelections();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [tacticsSelectedPlayer, selectedReserveForBench, selectedBenchForReserve]);

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
                  Titular seleccionado: <b className="text-cyan-300 font-bold">{tacticsSelectedPlayer.name}</b> ({tacticsSelectedPlayer.position} · {tacticsSelectedPlayer.overall}).
                  Haz clic en <b>otro titular de la pizarra para intercambiar posiciones</b>, o pulsa en <b>&quot;Meter por {tacticsSelectedPlayer.name.split(' ').pop()}&quot;</b> en el banquillo o reservas para sustituirlo.
                </>
              )}
              {selectedReserveForBench && (
                <>
                  Eligiendo plaza en el banquillo para subir a <b className="text-cyan-300 font-bold">{selectedReserveForBench.name}</b> ({selectedReserveForBench.position} · {selectedReserveForBench.overall}).
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
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0 shadow"
          >
            <X className="w-3.5 h-3.5" />
            <span>Deseleccionar (ESC)</span>
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Pizarra Táctica y Estilo de Juego</span>
          </div>

          {/* BOTÓN PARA ABRIR LA VENTANA EMERGENTE DE REACCIONES QUÍMICAS */}
          <button
            type="button"
            onClick={() => setShowChemicalModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 hover:from-cyan-900 hover:to-slate-800 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow"
            title="Ver reacciones químicas activas entre las armas de los 11 titulares"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Reacciones Químicas</span>
            <span
              className={clsx(
                'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                activeChemicals.length > 0 ? 'bg-cyan-400 text-black' : 'bg-slate-800 text-slate-400'
              )}
            >
              {activeChemicals.length}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Pizarra 2D y Banquillo / Reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Pitch2D
            club={userClub}
            allPlayersMap={allPlayersMap}
            selectedPlayerId={tacticsSelectedPlayer?.id}
            onPlayerClick={(p) => {
              // Si ya hay un titular seleccionado y hacemos clic en OTRO titular del 11:
              if (tacticsSelectedPlayer && tacticsSelectedPlayer.id !== p.id && userClub.startingXI.includes(p.id)) {
                // Intercambiar posiciones entre ambos titulares en la pizarra
                swapStartingPlayer(tacticsSelectedPlayer.id, p.id);
                clearAllSelections();
              } else {
                // Si pulsas en el mismo jugador, se deselecciona; si no, se selecciona para cambiarlo
                setTacticsSelectedPlayer((prev) => (prev?.id === p.id ? null : p));
                setSelectedReserveForBench(null);
                setSelectedBenchForReserve(null);
              }
            }}
            onPitchClick={clearAllSelections}
          />
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              💡 Haz clic en cualquier jugador para sustituirlo o asignarle roles. Haz clic en el césped vacío para deseleccionar.
            </span>
            {tacticsSelectedPlayer && (
              <button
                type="button"
                onClick={clearAllSelections}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                ✕ Deseleccionar ({tacticsSelectedPlayer.name})
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
                  Banquillo ({benchPlayers.length}/7)
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

            {/* AVISO GUÍA: CUANDO HAY UN TITULAR SELECCIONADO EN LA PIZARRA */}
            {tacticsSelectedPlayer && (
              <div className="p-3 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-500/70 rounded-xl space-y-1.5 text-xs shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Sustituyendo a: <b className="text-white">{tacticsSelectedPlayer.name}</b> ({tacticsSelectedPlayer.position} · {tacticsSelectedPlayer.overall})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={clearAllSelections}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                  >
                    ✕ Cancelar
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  • <b>En la pizarra:</b> Haz clic en cualquier otro titular para intercambiar posiciones entre ellos.<br />
                  • <b>En el banquillo o reservas:</b> Pulsa en <b>&quot;Meter por {tacticsSelectedPlayer.name.split(' ').pop()}&quot;</b> para sustituirlo.
                </p>
              </div>
            )}

            {/* AVISO GUÍA: CUANDO SE SELECCIONA UN RESERVA PARA SUBIR AL BANQUILLO */}
            {!tacticsSelectedPlayer && selectedReserveForBench && panelTab === 'bench' && (
              <div className="p-3 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/60 rounded-xl space-y-2 text-xs shadow-md animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                    Subir a: <b className="text-white">{selectedReserveForBench.name}</b> ({selectedReserveForBench.position} · {selectedReserveForBench.overall})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedReserveForBench(null)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
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
                    onClick={() => {
                      swapBenchPlayer(selectedReserveForBench.id, selectedReserveForBench.id);
                      setSelectedReserveForBench(null);
                    }}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    <span>➕ Ocupar plaza libre en el banquillo ({benchPlayers.length}/7) sin retirar a nadie</span>
                  </button>
                )}
              </div>
            )}

            {/* AVISO GUÍA: CUANDO SE SELECCIONA UN SUPLENTE PARA BAJAR A RESERVAS */}
            {!tacticsSelectedPlayer && selectedBenchForReserve && panelTab === 'reserves' && (
              <div className="p-3 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/60 rounded-xl space-y-2 text-xs shadow-md animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    Bajar a reservas: <b className="text-white">{selectedBenchForReserve.name}</b> ({selectedBenchForReserve.position})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBenchForReserve(null)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
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
            {!tacticsSelectedPlayer && !selectedReserveForBench && !selectedBenchForReserve && (
              <p className="text-[11px] text-slate-400">
                {panelTab === 'bench'
                  ? 'Convocados para los cambios en vivo del partido (máx 7). Puedes cambiarlos por reservas.'
                  : 'Resto de la plantilla. Haz clic en "Subir al Banquillo" y elige a quién sustituir.'}
              </p>
            )}

            {/* LISTA DE JUGADORES (BANQUILLO / RESERVAS) */}
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
                        'p-2.5 rounded-xl border text-xs transition-all space-y-1.5',
                        tacticsSelectedPlayer
                          ? 'border-cyan-500/50 bg-cyan-950/20 hover:border-cyan-400'
                          : p.isBanned
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
                              onClick={() => {
                                swapStartingPlayer(tacticsSelectedPlayer.id, p.id);
                                clearAllSelections();
                              }}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded text-[11px] transition-all flex items-center gap-1 shadow-lg animate-pulse"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              Meter por {tacticsSelectedPlayer.name.split(' ').pop()}
                            </button>
                          )}

                          {/* 2. MODO: Hay un reserva seleccionado para subir al banquillo y estamos en el banquillo */}
                          {!tacticsSelectedPlayer && selectedReserveForBench && panelTab === 'bench' && (
                            <button
                              type="button"
                              onClick={() => {
                                swapBenchPlayer(p.id, selectedReserveForBench.id);
                                setSelectedReserveForBench(null);
                              }}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded text-[10px] transition-all flex items-center gap-1 shadow-lg animate-pulse"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Quitar por {selectedReserveForBench.name.split(' ').pop()}
                            </button>
                          )}

                          {/* 3. MODO: Hay un suplente seleccionado para bajar a reservas y estamos en reservas */}
                          {!tacticsSelectedPlayer && selectedBenchForReserve && panelTab === 'reserves' && (
                            <button
                              type="button"
                              onClick={() => {
                                swapBenchPlayer(selectedBenchForReserve.id, p.id);
                                setSelectedBenchForReserve(null);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black rounded text-[10px] transition-all flex items-center gap-1 shadow-lg animate-pulse"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Subir por {selectedBenchForReserve.name.split(' ').pop()}
                            </button>
                          )}

                          {/* 4. MODO NORMAL en Reservas: Botón para convocar directamente o elegir a quién sustituir */}
                          {!tacticsSelectedPlayer && !selectedReserveForBench && !selectedBenchForReserve && panelTab === 'reserves' && (
                            <div className="flex items-center gap-1">
                              {benchPlayers.length < 7 && (
                                <button
                                  type="button"
                                  onClick={() => addToBench(p.id)}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-300 font-bold rounded text-[10px] transition-all flex items-center gap-1 border border-emerald-500/40 shadow-sm"
                                  title="Ocupar plaza vacante en el banquillo"
                                >
                                  <Plus className="w-3 h-3" />
                                  Al Banquillo
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReserveForBench(p);
                                  setPanelTab('bench');
                                }}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 font-bold rounded text-[10px] transition-all flex items-center gap-1"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                {benchPlayers.length >= 7 ? 'Sustituir en Banquillo...' : 'Cambiar por...'}
                              </button>
                            </div>
                          )}

                          {/* 5. MODO NORMAL en Banquillo: Botón directo para desconvocar o cambiar por reserva */}
                          {!tacticsSelectedPlayer && !selectedReserveForBench && !selectedBenchForReserve && panelTab === 'bench' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => removeFromBench(p.id)}
                                className="px-2 py-0.5 bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-300 font-bold rounded text-[10px] transition-all border border-rose-800/40"
                                title="Desconvocar del banquillo y enviar a reservas"
                              >
                                Bajar a Reservas
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBenchForReserve(p);
                                  setPanelTab('reserves');
                                }}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-400 font-medium rounded text-[10px] transition-all"
                              >
                                Cambiar por...
                              </button>
                            </div>
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
                  className="text-[10px] text-slate-500 hover:text-slate-300"
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

      {/* MODAL / VENTANA EMERGENTE DE REACCIONES QUÍMICAS */}
      {showChemicalModal && (
        <div
          onClick={() => setShowChemicalModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-cyan-500/60 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Reacciones Químicas Blue Lock en el 11 Titular
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sinergias egoístas activas entre las armas de los futbolistas sobre el césped
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChemicalModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                title="Cerrar (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {activeChemicals.length > 0 ? (
                activeChemicals.map(({ reaction, p1, p2 }, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/90 border border-cyan-500/40 rounded-xl space-y-2 shadow text-xs hover:border-cyan-400 transition-all"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-cyan-300 text-sm flex items-center gap-1.5 font-black">
                        ⚡ {reaction.name}
                      </span>
                      <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/50 shadow-sm">
                        +{reaction.boost}% Potencia
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-bold text-white">
                        {p1.name} <span className="text-slate-400 font-normal">({p1.position})</span>
                      </span>
                      <span className="text-cyan-400 font-black">↔</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-bold text-white">
                        {p2.name} <span className="text-slate-400 font-normal">({p2.position})</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {reaction.narrative.replace(/^⚡ ¡REACCIÓN QUÍMICA \[[^\]]+\]! /, '')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center space-y-3 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
                  <p className="text-sm font-semibold text-slate-300">
                    No hay reacciones químicas activas con los 11 titulares actuales.
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Prueba a juntar en el campo a futbolistas con armas complementarias:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-left pt-1 text-slate-300">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      • <b>Visión + Velocidad punta:</b> Sincronía a Velocidad Luz
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      • <b>Físico + Cañón/Volea:</b> Pivoteo Destructivo
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      • <b>Centro + Cabezazo/Remate:</b> Asalto Aéreo Coordinado
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      • <b>Robo de contención + Carrera:</b> Transición Relámpago
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowChemicalModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
