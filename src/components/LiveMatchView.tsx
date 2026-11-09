'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  Play,
  Pause,
  FastForward,
  CheckCircle,
  Zap,
  Users,
  Shield,
  Clock,
  ArrowRight,
  Activity,
  Flame,
  Award,
} from 'lucide-react';
import clsx from 'clsx';
import { Player } from '@/types/football-manager';
import { getBaseFormationCoords } from '@/engine/match-engine-2d';

export const LiveMatchView: React.FC = () => {
  const {
    liveMatch,
    players,
    userClubId,
    tickMatchMinute,
    fastForwardMatch,
    executeMatchSub,
    finishMatchDay,
  } = useGameStore();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // 1, 2, 5
  const [subModalOpen, setSubModalOpen] = useState<boolean>(false);
  const [selectedOutPlayerId, setSelectedOutPlayerId] = useState<string | null>(null);
  const [hasSeenHalfTime, setHasSeenHalfTime] = useState<boolean>(false);

  const playersMap = players.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Player>);

  // Live timer tick con pausa obligatoria al descanso (45')
  useEffect(() => {
    if (!liveMatch || liveMatch.isFinished || !isPlaying) return;

    // Pausa automática y aviso de descanso al minuto 45
    if (liveMatch.minute === 45 && !hasSeenHalfTime) {
      setIsPlaying(false);
      setHasSeenHalfTime(true);
      return;
    }

    const intervalTime = speed === 1 ? 850 : speed === 2 ? 400 : 120;
    const interval = setInterval(() => {
      tickMatchMinute();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [liveMatch, isPlaying, speed, tickMatchMinute, hasSeenHalfTime]);

  if (!liveMatch) return null;

  // Duración de la transición adaptada dinámicamente a la velocidad para evitar tirones y mareos
  const transitionMs = speed === 1 ? 650 : speed === 2 ? 300 : 90;

  const isUserHome = liveMatch.homeClub.id === userClubId;
  const userTeam = isUserHome ? liveMatch.homeClub : liveMatch.awayClub;
  const userLineup = isUserHome ? liveMatch.homeLineup : liveMatch.awayLineup;
  const userBench = isUserHome ? liveMatch.homeBench : liveMatch.awayBench;
  const userSubsLeft = isUserHome ? liveMatch.homeSubsRemaining : liveMatch.awaySubsRemaining;

  // Saltar al final sincronizado y seguro
  const handleFastSimulateAll = () => {
    setIsPlaying(false);
    fastForwardMatch();
  };

  // Abrir cambios pausando el tiempo automáticamente
  const handleOpenSubModal = () => {
    setIsPlaying(false);
    setSubModalOpen(true);
  };

  const handleConfirmSub = (inPlayerId: string) => {
    if (!selectedOutPlayerId) return;
    executeMatchSub(selectedOutPlayerId, inPlayerId);
    setSelectedOutPlayerId(null);
    setSubModalOpen(false);
  };

  // Calcular posiciones base en campo reglamentario completo (0-100)
  const homeCoords = getBaseFormationCoords(liveMatch.homeClub.formation, true);
  const awayCoords = getBaseFormationCoords(liveMatch.awayClub.formation, false);

  const ballX = liveMatch.ballPosition.x;
  const ballY = liveMatch.ballPosition.y;

  return (
    <div className="space-y-6">
      {/* 1. MARCADOR EN VIVO Y CRONÓMETRO */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Club Local */}
          <div className="flex items-center gap-4 flex-1 justify-end text-right">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">{liveMatch.homeClub.name}</h2>
              <span className="text-xs text-slate-400 uppercase tracking-widest">{liveMatch.homeClub.formation}</span>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-2 border-white/20"
              style={{ backgroundColor: liveMatch.homeClub.primaryColor, color: liveMatch.homeClub.secondaryColor }}
            >
              {liveMatch.homeClub.shortName}
            </div>
          </div>

          {/* Marcador Central y Minuto */}
          <div className="flex flex-col items-center px-6 py-2 bg-slate-950/80 border border-slate-800 rounded-xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">
                {liveMatch.isFinished
                  ? "FINAL 90+3'"
                  : liveMatch.minute === 45 && !isPlaying
                  ? 'DESCANSO (45\')'
                  : `${liveMatch.minute}'`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-4xl md:text-5xl font-black tracking-tight text-white font-mono">
              <span className={clsx(liveMatch.homeScore > liveMatch.awayScore && 'text-yellow-400')}>
                {liveMatch.homeScore}
              </span>
              <span className="text-slate-600">-</span>
              <span className={clsx(liveMatch.awayScore > liveMatch.homeScore && 'text-yellow-400')}>
                {liveMatch.awayScore}
              </span>
            </div>

            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
              Jornada {liveMatch.round} · Temporada {liveMatch.season}
            </span>
          </div>

          {/* Club Visitante */}
          <div className="flex items-center gap-4 flex-1 justify-start text-left">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-2 border-white/20"
              style={{ backgroundColor: liveMatch.awayClub.primaryColor, color: liveMatch.awayClub.secondaryColor }}
            >
              {liveMatch.awayClub.shortName}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">{liveMatch.awayClub.name}</h2>
              <span className="text-xs text-slate-400 uppercase tracking-widest">{liveMatch.awayClub.formation}</span>
            </div>
          </div>
        </div>

        {/* CONTROLES DE SIMULACIÓN Y SUSTITUCIÓN */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {!liveMatch.isFinished ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-all shadow-md"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                  {isPlaying ? 'Pausar' : 'Reanudar'}
                </button>

                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setSpeed(spd)}
                      className={clsx(
                        'px-2.5 py-1 text-xs font-bold rounded transition-all',
                        speed === spd ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                      )}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleFastSimulateAll}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
                  title="Simular instantáneamente hasta el pitido final (90'+)"
                >
                  <FastForward className="w-3.5 h-3.5 text-yellow-400" />
                  Saltar al Final
                </button>

                <button
                  type="button"
                  onClick={handleOpenSubModal}
                  disabled={userSubsLeft <= 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                  title="Hacer cambios (pausa el tiempo automáticamente)"
                >
                  <Users className="w-3.5 h-3.5" />
                  Cambios ({userSubsLeft} disp.)
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={finishMatchDay}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-sm rounded-xl shadow-lg hover:brightness-110 transition-all animate-pulse"
              >
                <CheckCircle className="w-4 h-4" />
                Continuar a Resultados y Clasificación
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Posesión: <b className="text-white">{liveMatch.homeStats.possession}%</b> - <b className="text-white">{liveMatch.awayStats.possession}%</b>
            </span>
            <span>
              Tiros: <b className="text-white">{liveMatch.homeStats.shots}</b> ({liveMatch.homeStats.shotsOnTarget}) - <b className="text-white">{liveMatch.awayStats.shots}</b> ({liveMatch.awayStats.shotsOnTarget})
            </span>
          </div>
        </div>
      </div>

      {/* 2. PITCH 2D ANIMADO EN TIEMPO REAL CON 22 JUGADORES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full aspect-[1.55] rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 select-none">
            {/* Césped con franjas tácticas */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #000 0, #000 10%, transparent 10%, transparent 20%)',
              }}
            />
            {/* Líneas reglamentarias del campo */}
            <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none">
              {/* Línea de medio campo */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 -translate-x-1/2" />
              {/* Círculo central */}
              <div className="absolute left-1/2 top-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 border-2 border-white/40 rounded-full" />
              {/* Área local (izquierda) */}
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1/5 border-r-2 border-white/40" />
              {/* Área visitante (derecha) */}
              <div className="absolute right-0 top-1/4 bottom-1/4 w-1/5 border-l-2 border-white/40" />
            </div>

            {/* JUGADORES DEL EQUIPO LOCAL (11 TITULARES EN MOVIMIENTO INDIVIDUAL AUTÓNOMO) */}
            {liveMatch.homeLineup.map((pId, idx) => {
              const player = playersMap[pId];
              const pos = liveMatch.playerPositions?.[pId];
              const base = homeCoords[idx] || { x: 25, y: 50 };
              // Posición individual reglamentaria calculada por el motor táctico
              const posX = pos ? pos.x : base.x;
              const posY = pos ? pos.y : base.y;

              const isCarrier = liveMatch.ballCarrierId === pId;
              const isFlow = player?.flowState;
              const shortSurname = player?.name.split(' ').pop() || `H${idx + 1}`;

              return (
                <div
                  key={`home-${pId}-${idx}`}
                  className={clsx(
                    'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none',
                    isCarrier ? 'z-30' : 'z-10'
                  )}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transition: `left ${transitionMs}ms ease-out, top ${transitionMs}ms ease-out`,
                  }}
                >
                  <div
                    className={clsx(
                      'w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs shadow-md border-2 transition-colors relative',
                      isCarrier
                        ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-[0_0_12px_#facc15]'
                        : isFlow
                        ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_8px_#00ffff]'
                        : 'border-white/70'
                    )}
                    style={{
                      backgroundColor: liveMatch.homeClub.primaryColor,
                      color: liveMatch.homeClub.secondaryColor,
                    }}
                  >
                    {idx === 0 ? '1' : `${idx + 1}`}
                    {isCarrier && (
                      <span className="absolute -top-2.5 -right-2 text-[10px] leading-none drop-shadow">
                        ⚽
                      </span>
                    )}
                  </div>
                  <span
                    className={clsx(
                      'text-[9px] font-semibold px-1 rounded shadow-sm whitespace-nowrap mt-0.5 max-w-[65px] truncate',
                      isCarrier ? 'bg-yellow-400 text-black font-bold' : 'text-white bg-slate-950/80'
                    )}
                  >
                    {shortSurname}
                  </span>
                </div>
              );
            })}

            {/* JUGADORES DEL EQUIPO VISITANTE (11 TITULARES EN MOVIMIENTO INDIVIDUAL AUTÓNOMO) */}
            {liveMatch.awayLineup.map((pId, idx) => {
              const player = playersMap[pId];
              const pos = liveMatch.playerPositions?.[pId];
              const base = awayCoords[idx] || { x: 75, y: 50 };
              // Posición individual reglamentaria calculada por el motor táctico
              const posX = pos ? pos.x : base.x;
              const posY = pos ? pos.y : base.y;

              const isCarrier = liveMatch.ballCarrierId === pId;
              const isFlow = player?.flowState;
              const shortSurname = player?.name.split(' ').pop() || `A${idx + 1}`;

              return (
                <div
                  key={`away-${pId}-${idx}`}
                  className={clsx(
                    'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none',
                    isCarrier ? 'z-30' : 'z-10'
                  )}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transition: `left ${transitionMs}ms ease-out, top ${transitionMs}ms ease-out`,
                  }}
                >
                  <div
                    className={clsx(
                      'w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs shadow-md border-2 transition-colors relative',
                      isCarrier
                        ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-[0_0_12px_#facc15]'
                        : isFlow
                        ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-[0_0_8px_#facc15]'
                        : 'border-black/50'
                    )}
                    style={{
                      backgroundColor: liveMatch.awayClub.primaryColor,
                      color: liveMatch.awayClub.secondaryColor,
                    }}
                  >
                    {idx === 0 ? '1' : `${idx + 1}`}
                    {isCarrier && (
                      <span className="absolute -top-2.5 -right-2 text-[10px] leading-none drop-shadow">
                        ⚽
                      </span>
                    )}
                  </div>
                  <span
                    className={clsx(
                      'text-[9px] font-semibold px-1 rounded shadow-sm whitespace-nowrap mt-0.5 max-w-[65px] truncate',
                      isCarrier ? 'bg-yellow-400 text-black font-bold' : 'text-slate-200 bg-slate-950/80'
                    )}
                  >
                    {shortSurname}
                  </span>
                </div>
              );
            })}

            {/* Balón que acompaña al jugador con suavidad o vuela a portería */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              style={{
                left: `${ballX}%`,
                top: `${ballY}%`,
                transition: `left ${transitionMs}ms ease-out, top ${transitionMs}ms ease-out`,
              }}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.85)] border border-slate-900 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              </div>
            </div>

            {/* Zona de Ataque Activa */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>
                Ataque:{' '}
                <strong className="text-white">
                  {liveMatch.attackingTeamId === liveMatch.homeClub.id
                    ? liveMatch.homeClub.name
                    : liveMatch.awayClub.name}
                </strong>
              </span>
            </div>

            {/* MODAL / PANTALLA DE DESCANSO (45') */}
            {liveMatch.minute === 45 && !isPlaying && hasSeenHalfTime && !liveMatch.isFinished && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-full text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
                  ⏸️ DESCANSO · 45&apos;
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-white">
                  {liveMatch.homeClub.name} <span className="text-yellow-400">{liveMatch.homeScore}</span> -{' '}
                  <span className="text-yellow-400">{liveMatch.awayScore}</span> {liveMatch.awayClub.name}
                </h3>
                <p className="text-xs text-slate-300 max-w-md">
                  Pausa táctica en el vestuario. Es el momento perfecto para realizar sustituciones clave, refrescar el
                  once o cambiar el ritmo para la segunda mitad.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubModalOpen(true)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Ajustes y Cambios ({userSubsLeft} disp.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black" /> Reanudar 2ª Parte (46&apos;)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ESTADÍSTICAS COMPARATIVAS EN TIEMPO REAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estadísticas del Encuentro</h4>

            {/* Posesión */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{liveMatch.homeStats.possession}%</span>
                <span className="text-slate-500 uppercase font-bold text-[10px]">Posesión</span>
                <span>{liveMatch.awayStats.possession}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-cyan-500 transition-all duration-300" style={{ width: `${liveMatch.homeStats.possession}%` }} />
                <div className="bg-rose-500 transition-all duration-300" style={{ width: `${liveMatch.awayStats.possession}%` }} />
              </div>
            </div>

            {/* Tiros */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[10px]">Tiros Totales</div>
                <div className="text-white font-bold text-sm">
                  {liveMatch.homeStats.shots} - {liveMatch.awayStats.shots}
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[10px]">Tiros a Puerta</div>
                <div className="text-cyan-400 font-bold text-sm">
                  {liveMatch.homeStats.shotsOnTarget} - {liveMatch.awayStats.shotsOnTarget}
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[10px]">Córners / Faltas</div>
                <div className="text-white font-bold text-sm">
                  {liveMatch.homeStats.corners + liveMatch.homeStats.fouls} - {liveMatch.awayStats.corners + liveMatch.awayStats.fouls}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. NARRACIÓN EN VIVO (LIVE COMMENTARY FEED) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              Retransmisión en Directo
            </h3>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded-full font-mono">
              EN VIVO
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {liveMatch.events.map((ev, idx) => {
              const isGoal = ev.type === 'goal';
              const isFlow = ev.type === 'flow';
              const isSave = ev.type === 'save';
              const isCard = ev.type === 'yellow_card' || ev.type === 'red_card';

              return (
                <div
                  key={idx}
                  className={clsx(
                    'p-3 rounded-xl border text-xs leading-relaxed transition-all',
                    isGoal
                      ? 'bg-yellow-950/40 border-yellow-500/60 text-yellow-200'
                      : isFlow
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                      : isCard
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : isSave
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-2 font-mono font-bold text-[10px] text-slate-400 mb-1">
                    <span>{ev.minute}&apos;</span>
                    {isGoal && <span className="text-yellow-400 font-bold uppercase tracking-wider">¡GOL!</span>}
                    {isFlow && <span className="text-cyan-400 font-bold uppercase tracking-wider">FLOW STATE</span>}
                    {isSave && <span className="text-emerald-400 font-bold uppercase tracking-wider">PARADA</span>}
                  </div>
                  <div>{ev.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE SUSTITUCIÓN EN VIVO CON POTENCIAL */}
      {subModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Realizar Sustitución Táctica ({userSubsLeft} disponibles)
              </h3>
              <button
                type="button"
                onClick={() => setSubModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Paso 1: Seleccionar jugador que sale */}
            <div>
              <label className="text-xs text-slate-400 block mb-2 font-semibold">
                1. Selecciona el jugador que sale del campo:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {userLineup.map((id) => {
                  const p = playersMap[id];
                  if (!p) return null;
                  const isSel = selectedOutPlayerId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedOutPlayerId(id)}
                      className={clsx(
                        'p-2 rounded-lg border text-left text-xs transition-all',
                        isSel ? 'border-yellow-400 bg-yellow-950/40' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      )}
                    >
                      <div className="font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.position} · MED: <b className="text-white">{p.overall}</b> · POT: <b className="text-cyan-400">{p.potential}</b>
                      </div>
                      <div className="text-[9px] text-slate-500">Físico: {p.fitness}%</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paso 2: Seleccionar suplente que entra */}
            {selectedOutPlayerId && (
              <div>
                <label className="text-xs text-slate-400 block mb-2 font-semibold">
                  2. Selecciona el suplente que entra:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {userBench.map((id) => {
                    const p = playersMap[id];
                    if (!p) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleConfirmSub(id)}
                        className="p-2 rounded-lg border border-slate-800 bg-slate-950 hover:border-cyan-400 hover:bg-cyan-950/30 text-left text-xs transition-all"
                      >
                        <div className="font-bold text-cyan-300 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.position} · MED: <b className="text-white">{p.overall}</b> · POT: <b className="text-cyan-400">{p.potential}</b>
                        </div>
                        <div className="text-[9px] text-slate-500">Físico: {p.fitness}%</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
