'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Activity,
  TrendingUp,
  Zap,
  Users,
  Clock,
  Shield,
  X,
  Star,
  Flame,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Repeat,
  Flag,
} from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '@/store/game-store';
import { MatchEvent, MatchSummaryData } from '@/types/football-manager';

interface SimulatedMatchModalProps {
  summary: MatchSummaryData;
  onClose: () => void;
}

export function SimulatedMatchModal({ summary, onClose }: SimulatedMatchModalProps) {
  const { clubs } = useGameStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'squad' | 'round'>('squad');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'goal' | 'sub' | 'card' | 'key'>('all');

  const {
    round,
    season,
    homeClub,
    awayClub,
    homeScore,
    awayScore,
    userClubId,
    userIsHome,
    events,
    homeStats,
    awayStats,
    playerPerformances,
    roundFixtures,
  } = summary;

  const userWon = userIsHome ? homeScore > awayScore : awayScore > homeScore;
  const userDrew = homeScore === awayScore;

  // Jugadores que tuvieron crecimiento de media o potencial
  const upgradedPlayers = playerPerformances.filter(
    (p) => p.newOverall > p.oldOverall || p.newPotential > p.oldPotential
  );

  // Separar goleadores por equipo
  const homeGoals = events
    .filter((e) => e.type === 'goal' && e.teamId === homeClub.id)
    .sort((a, b) => a.minute - b.minute);

  const awayGoals = events
    .filter((e) => e.type === 'goal' && e.teamId === awayClub.id)
    .sort((a, b) => a.minute - b.minute);

  // Filtrar eventos de la cronología
  const filteredEvents = events.filter((e) => {
    if (timelineFilter === 'all') return true;
    if (timelineFilter === 'goal') return e.type === 'goal';
    if (timelineFilter === 'sub') return e.type === 'sub';
    if (timelineFilter === 'card') return e.type === 'yellow_card' || e.type === 'red_card';
    if (timelineFilter === 'key') {
      return (
        e.type === 'goal' ||
        e.type === 'save' ||
        e.type === 'flow' ||
        e.type === 'penalty' ||
        e.type === 'sub' ||
        e.type === 'red_card'
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col h-[86vh] max-h-[820px] overflow-hidden">
        
        {/* HEADER SUPERIOR CON BOTÓN DE CIERRE */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-mono text-[11px] font-bold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 fill-cyan-400" />
              {summary.isSimulated !== false ? 'Simulación Completa · 90 Minutos' : 'Partido Disputado (2D) · 90 Minutos'}
            </span>
            <span className="text-slate-400 text-xs font-semibold hidden sm:inline">
              Temporada {season} · Jornada {round}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Cerrar ventana emergente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HERO SCOREBOARD */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 sm:gap-6">
            
            {/* CLUB LOCAL */}
            <div className="flex items-center justify-start md:justify-end gap-3.5 order-1 md:order-1">
              <div className="text-left md:text-right">
                <div className="flex items-center gap-1.5 md:justify-end">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-white">{homeClub.name}</h3>
                  {homeClub.id === userClubId && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      TÚ
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Local · Nivel {homeClub.level}</p>
              </div>
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-lg border-2 border-white/20 shrink-0"
                style={{ backgroundColor: homeClub.primaryColor, color: homeClub.secondaryColor }}
              >
                {homeClub.shortName}
              </div>
            </div>

            {/* MARCADOR CENTRAL */}
            <div className="flex flex-col items-center justify-center text-center order-2 md:order-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-white tracking-tight">
                  {homeScore}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-600">-</span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-white tracking-tight">
                  {awayScore}
                </span>
              </div>

              {/* Insignia de resultado para el usuario */}
              <div className="mt-1.5 sm:mt-2">
                {userWon && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle className="w-3.5 h-3.5" />
                    VICTORIA (+3 PUNTOS)
                  </span>
                )}
                {userDrew && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-yellow-950/80 text-yellow-400 border border-yellow-500/40">
                    EMPATE (+1 PUNTO)
                  </span>
                )}
                {!userWon && !userDrew && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-950/80 text-rose-400 border border-rose-500/40">
                    DERROTA (0 PUNTOS)
                  </span>
                )}
              </div>
            </div>

            {/* CLUB VISITANTE */}
            <div className="flex items-center justify-start gap-3.5 order-3 md:order-3">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-lg border-2 border-white/20 shrink-0"
                style={{ backgroundColor: awayClub.primaryColor, color: awayClub.secondaryColor }}
              >
                {awayClub.shortName}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-white">{awayClub.name}</h3>
                  {awayClub.id === userClubId && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      TÚ
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Visitante · Nivel {awayClub.level}</p>
              </div>
            </div>
          </div>

          {/* LISTA DE GOLEADORES DEBAJO DEL MARCADOR */}
          {(homeGoals.length > 0 || awayGoals.length > 0) && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 text-xs">
              <div className="space-y-1 text-left md:text-right">
                {homeGoals.map((g, idx) => (
                  <div key={idx} className="text-slate-300 font-medium flex items-center gap-1.5 md:justify-end">
                    <span>⚽ {g.playerName || 'Jugador'} <b className="text-cyan-400 font-mono">{g.minute}&apos;</b></span>
                    {g.assistPlayerName && (
                      <span className="text-slate-500 text-[11px]">(asist. {g.assistPlayerName})</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-left">
                {awayGoals.map((g, idx) => (
                  <div key={idx} className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span>⚽ {g.playerName || 'Jugador'} <b className="text-cyan-400 font-mono">{g.minute}&apos;</b></span>
                    {g.assistPlayerName && (
                      <span className="text-slate-500 text-[11px]">(asist. {g.assistPlayerName})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS DENTRO DEL MODAL */}
        <div className="bg-slate-950 px-3 sm:px-6 py-2 sm:py-2.5 border-b border-slate-800 flex gap-1.5 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            {
              id: 'squad',
              label: 'Plantilla & Mejoras',
              icon: TrendingUp,
              badge: upgradedPlayers.length > 0 ? `+${upgradedPlayers.length} Subidas` : undefined,
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            },
            {
              id: 'timeline',
              label: 'Minuto a Minuto',
              icon: Clock,
              badge: `${events.length} sucesos`,
            },
            {
              id: 'stats',
              label: 'Estadísticas',
              icon: Activity,
            },
            {
              id: 'round',
              label: 'Otros Resultados',
              icon: Trophy,
              badge: `Jornada ${round}`,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.2 rounded-full border',
                      isActive
                        ? 'bg-black/20 text-black border-black/30'
                        : tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENIDO SCROLLEABLE SEGÚN PESTAÑA */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 pb-8">

          {/* TAB 1: RENDIMIENTO & PLANTILLA */}
          {activeTab === 'squad' && (
            <div className="space-y-4">
              {/* Notificación de jugadores mejorados */}
              {upgradedPlayers.length > 0 ? (
                <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        ¡Crecimiento de Ego y Habilidad detectado!
                      </h4>
                      <p className="text-xs text-slate-300">
                        {upgradedPlayers.length} jugador(es) han aumentado sus atributos de Media o Potencial tras disputar este partido simulado.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                    +{upgradedPlayers.length} EVOLUCIÓN
                  </span>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Ningún jugador subió de media o potencial en esta jornada. Siguen sumando minutos acumulados hacia su próxima subida.
                  </span>
                </div>
              )}

              {/* LISTA DE JUGADORES QUE PARTICIPARON */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Jugador y Posición</span>
                  <div className="flex items-center gap-6 sm:gap-10">
                    <span className="hidden sm:inline">Minutos</span>
                    <span>Nota</span>
                    <span>Impacto / Evolución</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-850">
                  {playerPerformances.map((p) => {
                    const hasOvrGain = p.newOverall > p.oldOverall;
                    const hasPotGain = p.newPotential > p.oldPotential;

                    return (
                      <div
                        key={p.playerId}
                        className={clsx(
                          'px-4 py-3.5 flex items-center justify-between gap-3 transition-colors',
                          hasOvrGain || hasPotGain ? 'bg-emerald-950/15 hover:bg-emerald-950/25' : 'hover:bg-slate-900/40'
                        )}
                      >
                        {/* Nombre y posición */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0',
                              p.position === 'DC' || p.position === 'EI' || p.position === 'ED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : p.position === 'MCO' || p.position === 'MC' || p.position === 'MCD'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : p.position === 'POR'
                                ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            )}
                          >
                            {p.position}
                          </span>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white truncate">{p.playerName}</span>
                              {p.isSub ? (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  Suplente
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                  Titular
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{p.age} años</span>
                              <span>·</span>
                              <span>{p.minutesPlayed}&apos; disputados</span>
                              {p.goals > 0 && <span className="text-emerald-400 font-bold">⚽ {p.goals} gol{p.goals > 1 ? 'es' : ''}</span>}
                              {p.assists > 0 && <span className="text-cyan-400 font-bold">🅰️ {p.assists} asist.</span>}
                              {p.yellowCards > 0 && <span className="text-yellow-400 font-bold">🟨 Tarjeta</span>}
                              {p.redCards > 0 && <span className="text-rose-400 font-bold">🟥 Roja</span>}
                            </div>
                          </div>
                        </div>

                        {/* Columna derecha: Minutos, Nota, Mejoras */}
                        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                          {/* Minutos (visible en pantallas grandes) */}
                          <div className="hidden sm:flex flex-col items-center">
                            <span className="font-mono text-xs font-bold text-slate-300">{p.minutesPlayed}&apos;</span>
                            <span className="text-[10px] text-slate-500">Energía {p.fitness}%</span>
                          </div>

                          {/* Nota ⭐ */}
                          <div className="text-center">
                            <span
                              className={clsx(
                                'px-2.5 py-1 rounded-lg font-mono font-bold text-xs inline-flex items-center gap-1 shadow-sm',
                                p.rating >= 8.0
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : p.rating >= 7.0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : p.rating >= 6.0
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              )}
                            >
                              <Star className="w-3 h-3 fill-current" />
                              {p.rating.toFixed(1)}
                            </span>
                          </div>

                          {/* Insignias de mejora */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 min-w-[130px] justify-end">
                            {hasOvrGain && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse">
                                📈 MEDIA +1 ({p.oldOverall}➔{p.newOverall})
                              </span>
                            )}
                            {hasPotGain && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 animate-pulse">
                                🌟 POT +1 ({p.oldPotential}➔{p.newPotential})
                              </span>
                            )}
                            {p.flowState && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                ⚡ FLOW
                              </span>
                            )}
                            {!hasOvrGain && !hasPotGain && !p.flowState && (
                              <span className="text-xs font-mono text-slate-500">
                                OVR {p.newOverall} / POT {p.newPotential}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MINUTO A MINUTO (CRONOLOGÍA) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Filtros rápidos (Sticky para no solaparse ni perderse al scrollear) */}
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md py-2 -mt-2 -mx-1 px-1 flex items-center gap-1.5 overflow-x-auto border-b border-slate-800/80">
                {[
                  { id: 'all', label: 'Todos los Sucesos' },
                  { id: 'key', label: '⭐ Momentos Clave' },
                  { id: 'goal', label: '⚽ Goles' },
                  { id: 'sub', label: '🔄 Sustituciones' },
                  { id: 'card', label: '🟨 Tarjetas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTimelineFilter(f.id as any)}
                    className={clsx(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                      timelineFilter === f.id
                        ? 'bg-slate-700 text-white border border-slate-600'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Feed cronológico */}
              <div className="space-y-2.5">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No hubo sucesos que coincidan con este filtro.
                  </div>
                ) : (
                  filteredEvents.map((e, idx) => {
                    const isHome = e.teamId === homeClub.id;
                    const team = isHome ? homeClub : awayClub;

                    return (
                      <div
                        key={idx}
                        className={clsx(
                          'p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all',
                          e.type === 'goal'
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                            : e.type === 'sub'
                            ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
                            : e.type === 'yellow_card'
                            ? 'bg-yellow-950/20 border-yellow-500/30 text-yellow-200'
                            : e.type === 'red_card'
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            : e.type === 'flow'
                            ? 'bg-purple-950/25 border-purple-500/40 text-purple-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        )}
                      >
                        {/* Minuto */}
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 font-mono text-xs font-bold text-white shrink-0">
                          {e.minute}&apos;
                        </div>

                        {/* Icono e indicador de equipo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: team.primaryColor }}
                            />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                              {team.name}
                            </span>
                            {e.type === 'sub' && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                🔄 CAMBIO TÁCTICO
                              </span>
                            )}
                            {e.type === 'goal' && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                ⚽ GOL
                              </span>
                            )}
                            {e.type === 'yellow_card' && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                🟨 AMARILLA
                              </span>
                            )}
                            {e.type === 'red_card' && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                🟥 ROJA DIRECTA
                              </span>
                            )}
                            {e.type === 'flow' && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                ⚡ FLOW STATE
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-200 leading-relaxed">
                            {e.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ESTADÍSTICAS DEL ENCUENTRO */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Barra de Posesión */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                      style={{ backgroundColor: homeClub.primaryColor === '#ffffff' ? '#e2e8f0' : homeClub.primaryColor }}
                    />
                    <span className="text-white font-mono font-bold text-sm">{homeStats.possession}%</span>
                  </div>
                  <span className="uppercase tracking-wider font-semibold">Posesión de Balón</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-sm">{awayStats.possession}%</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                      style={{ backgroundColor: awayClub.primaryColor }}
                    />
                  </div>
                </div>
                <div className="h-3.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-l-full transition-all duration-300"
                    style={{
                      width: `${homeStats.possession}%`,
                      backgroundColor: homeClub.primaryColor === '#ffffff' ? '#f1f5f9' : homeClub.primaryColor || '#06b6d4',
                    }}
                  />
                  <div className="w-0.5 h-full bg-slate-950 shrink-0" />
                  <div
                    className="h-full rounded-r-full transition-all duration-300"
                    style={{
                      width: `${awayStats.possession}%`,
                      backgroundColor: awayClub.primaryColor || '#f59e0b',
                    }}
                  />
                </div>
              </div>

              {/* Comparador de métricas clave */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-850">
                {[
                  {
                    label: 'Tiros Totales',
                    homeVal: homeStats.shots,
                    awayVal: awayStats.shots,
                  },
                  {
                    label: 'Tiros a Puerta',
                    homeVal: homeStats.shotsOnTarget,
                    awayVal: awayStats.shotsOnTarget,
                  },
                  {
                    label: 'Ocasiones Claras',
                    homeVal: homeStats.chances,
                    awayVal: awayStats.chances,
                  },
                  {
                    label: 'Córners Concedidos',
                    homeVal: homeStats.corners,
                    awayVal: awayStats.corners,
                  },
                  {
                    label: 'Faltas Cometidas',
                    homeVal: homeStats.fouls,
                    awayVal: awayStats.fouls,
                  },
                  {
                    label: 'Tarjetas Amarillas',
                    homeVal: events.filter((e) => e.type === 'yellow_card' && e.teamId === homeClub.id).length,
                    awayVal: events.filter((e) => e.type === 'yellow_card' && e.teamId === awayClub.id).length,
                  },
                  {
                    label: 'Tarjetas Rojas',
                    homeVal: events.filter((e) => e.type === 'red_card' && e.teamId === homeClub.id).length,
                    awayVal: events.filter((e) => e.type === 'red_card' && e.teamId === awayClub.id).length,
                  },
                ].map((row, idx) => (
                  <div key={idx} className="px-5 py-3.5 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-sm text-white w-12 text-left">
                      {row.homeVal}
                    </span>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-center flex-1">
                      {row.label}
                    </span>
                    <span className="font-mono font-bold text-sm text-white w-12 text-right">
                      {row.awayVal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: OTROS PARTIDOS DE LA JORNADA */}
          {activeTab === 'round' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Resultados Simulados · Jornada {round}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {roundFixtures.length} partidos disputados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roundFixtures.map((fix) => {
                  const h = clubs.find((c) => c.id === fix.homeClubId);
                  const a = clubs.find((c) => c.id === fix.awayClubId);
                  if (!h || !a) return null;

                  const isUserMatch = fix.homeClubId === userClubId || fix.awayClubId === userClubId;

                  return (
                    <div
                      key={fix.id}
                      className={clsx(
                        'p-3.5 rounded-2xl border flex items-center justify-between gap-3',
                        isUserMatch
                          ? 'bg-cyan-950/30 border-cyan-500/40 ring-1 ring-cyan-500/20'
                          : 'bg-slate-950 border-slate-800'
                      )}
                    >
                      {/* Local */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ backgroundColor: h.primaryColor, color: h.secondaryColor }}
                        >
                          {h.shortName}
                        </div>
                        <span className="text-xs font-bold text-white truncate">{h.name}</span>
                      </div>

                      {/* Marcador */}
                      <div className="px-3 py-1 bg-slate-900 border border-slate-750 rounded-xl font-mono text-xs font-black text-white shrink-0">
                        {fix.homeScore ?? '-'} : {fix.awayScore ?? '-'}
                      </div>

                      {/* Visitante */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                        <span className="text-xs font-bold text-white truncate">{a.name}</span>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ backgroundColor: a.primaryColor, color: a.secondaryColor }}
                        >
                          {a.shortName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER CON BOTÓN DE CONTINUAR */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            Pulsa continuar para volver al despacho y preparar la siguiente jornada.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs md:text-sm rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Continuar al Despacho
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
