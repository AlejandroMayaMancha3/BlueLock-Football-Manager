'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  Calendar as CalendarIcon,
  Trophy,
  Play,
  FastForward,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Home,
  Plane,
  ChevronRight,
  Filter,
  Eye,
  TrendingUp,
  Flame,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { MatchFixture, Club } from '@/types/football-manager';
import { getDivisionById } from '@/engine/data/divisions-catalog';

// Meses de la temporada y jornadas aproximadas
const SEASON_MONTHS = [
  { name: 'Agosto', rounds: [1, 2, 3] },
  { name: 'Septiembre', rounds: [4, 5, 6, 7, 8] },
  { name: 'Octubre', rounds: [9, 10, 11, 12, 13] },
  { name: 'Noviembre', rounds: [14, 15, 16, 17] },
  { name: 'Diciembre', rounds: [18, 19, 20, 21] },
  { name: 'Enero (Mercado Invierno)', rounds: [22, 23, 24, 25, 26] },
  { name: 'Febrero', rounds: [27, 28, 29, 30, 31] },
  { name: 'Marzo', rounds: [32, 33, 34, 35, 36] },
  { name: 'Abril', rounds: [37, 38, 39, 40, 41] },
  { name: 'Mayo (Desenlace)', rounds: [42, 43, 44, 45, 46] },
];

/**
 * Genera una fecha simulada realista de fin de semana para cada jornada
 */
function getSimulatedDate(round: number, season: number): string {
  const baseYear = 2026 + (season - 1);
  const startDate = new Date(baseYear, 7, 16); // 16 de Agosto
  const matchDate = new Date(startDate.getTime() + (round - 1) * 7 * 24 * 60 * 60 * 1000);

  const day = matchDate.getDate();
  const monthsEs = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const monthName = monthsEs[matchDate.getMonth()];
  return `${day} ${monthName} ${matchDate.getFullYear()}`;
}

export const CalendarView: React.FC = () => {
  const {
    currentSeason,
    currentRound,
    userClubId,
    clubs,
    fixtures,
    isSeasonCompleted,
    startMatchDay,
    simulateFullMatchDay,
    lastMatchSummary,
    openLastMatchSummary,
  } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const activeDivisionId = userClub?.divisionId || userClub?.league || 'es_laliga';
  const divisionInfo = getDivisionById(activeDivisionId);
  const divisionName = divisionInfo?.name || 'Liga Regular';

  // Mapa rápido de clubes por ID
  const clubsMap = useMemo(() => {
    return clubs.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, Club>);
  }, [clubs]);

  // Fixtures del usuario ordenados por jornada
  const userFixtures = useMemo(() => {
    return fixtures
      .filter((f) => f.homeClubId === userClubId || f.awayClubId === userClubId)
      .sort((a, b) => a.round - b.round);
  }, [fixtures, userClubId]);

  // Estados de vista y filtros
  const [viewMode, setViewMode] = useState<'timeline' | 'month' | 'grid'>('timeline');
  const [filterType, setFilterType] = useState<
    'all' | 'played' | 'pending' | 'first_half' | 'second_half' | 'home' | 'away'
  >('all');
  const [inspectRound, setInspectRound] = useState<number | null>(null);

  // Referencia al elemento de la jornada actual para auto-scroll
  const currentRoundCardRef = useRef<HTMLDivElement>(null);

  const scrollToCurrentRound = () => {
    if (currentRoundCardRef.current) {
      currentRoundCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Balance y Estadísticas de la temporada
  const seasonStats = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const historyResults: Array<'W' | 'D' | 'L'> = [];

    userFixtures.forEach((f) => {
      if (f.isPlayed && f.homeScore !== undefined && f.awayScore !== undefined) {
        const isHome = f.homeClubId === userClubId;
        const myScore = isHome ? f.homeScore : f.awayScore;
        const rivalScore = isHome ? f.awayScore : f.homeScore;

        goalsFor += myScore;
        goalsAgainst += rivalScore;

        if (myScore > rivalScore) {
          wins++;
          historyResults.push('W');
        } else if (myScore === rivalScore) {
          draws++;
          historyResults.push('D');
        } else {
          losses++;
          historyResults.push('L');
        }
      }
    });

    const points = wins * 3 + draws;
    const played = wins + draws + losses;
    const lastFive = historyResults.slice(-5);

    return {
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      points,
      lastFive,
      completionRate: Math.round((played / (userFixtures.length || 46)) * 100),
    };
  }, [userFixtures, userClubId]);

  // Filtrado de fixtures según selección del usuario
  const filteredFixtures = useMemo(() => {
    return userFixtures.filter((f) => {
      const isHome = f.homeClubId === userClubId;
      if (filterType === 'played') return f.isPlayed;
      if (filterType === 'pending') return !f.isPlayed;
      if (filterType === 'first_half') return f.round <= 23;
      if (filterType === 'second_half') return f.round > 23;
      if (filterType === 'home') return isHome;
      if (filterType === 'away') return !isHome;
      return true;
    });
  }, [userFixtures, filterType, userClubId]);

  // Partidos de la jornada inspeccionada en el modal (todos los 12 enfrentamientos)
  const roundInspectFixtures = useMemo(() => {
    if (!inspectRound) return [];
    return fixtures.filter((f) => f.round === inspectRound);
  }, [fixtures, inspectRound]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. CABECERA ESTILO FIFA / EA FC MODO CARRERA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl border-2 border-white/20 shrink-0"
              style={{ backgroundColor: userClub.primaryColor, color: userClub.secondaryColor }}
            >
              {userClub.shortName}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendario Oficial · Temporada {currentSeason}
              </div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span>{userClub.name}</span>
                <span className="text-slate-500 font-normal text-sm">·</span>
                <span className="text-cyan-400 text-lg font-bold">{divisionName}</span>
              </h2>
              <p className="text-xs text-slate-400">
                46 Jornadas de competición regular · Próximo compromiso: <b>Jornada {currentRound}</b>
              </p>
            </div>
          </div>

          {/* Selector de Modos y Botón Rápido */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={scrollToCurrentRound}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Ir a Jornada Actual ({currentRound})</span>
            </button>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg font-bold transition-all',
                  viewMode === 'timeline' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                )}
              >
                Cronograma FIFA
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg font-bold transition-all',
                  viewMode === 'month' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                )}
              >
                Mes a Mes
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESO Y KPI DE RENDIMIENTO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Partidos Jugados</span>
            <span className="text-base font-black text-white font-mono">
              {seasonStats.played} <span className="text-xs text-slate-500 font-normal">/ 46</span>
            </span>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${seasonStats.completionRate}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Balance V / E / D</span>
            <div className="text-base font-black font-mono flex items-center gap-1.5 mt-0.5">
              <span className="text-emerald-400">{seasonStats.wins}V</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400">{seasonStats.draws}E</span>
              <span className="text-slate-500">·</span>
              <span className="text-rose-400">{seasonStats.losses}D</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">{seasonStats.points} Puntos</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Goles a Favor / Contra</span>
            <span className="text-base font-black text-white font-mono block mt-0.5">
              {seasonStats.goalsFor} <span className="text-slate-600">:</span> {seasonStats.goalsAgainst}
            </span>
            <span
              className={clsx(
                'text-[10px] font-bold font-mono',
                seasonStats.goalDiff > 0 ? 'text-emerald-400' : seasonStats.goalDiff < 0 ? 'text-rose-400' : 'text-slate-500'
              )}
            >
              {seasonStats.goalDiff > 0 ? `+${seasonStats.goalDiff}` : seasonStats.goalDiff} Dif.
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Próximo Rival</span>
            {(() => {
              const nextFix = userFixtures.find((f) => f.round === currentRound);
              if (!nextFix) return <span className="text-xs text-slate-500">Temporada finalizada</span>;
              const isH = nextFix.homeClubId === userClubId;
              const rivId = isH ? nextFix.awayClubId : nextFix.homeClubId;
              const riv = clubsMap[rivId];
              return (
                <div className="truncate mt-0.5">
                  <span className="text-white font-bold truncate block">{riv?.name || 'Rival'}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {isH ? 'En Casa (C)' : 'A Domicilio (F)'}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Racha Últimos 5</span>
            <div className="flex items-center gap-1 mt-1.5">
              {seasonStats.lastFive.length > 0 ? (
                seasonStats.lastFive.map((res, idx) => (
                  <span
                    key={idx}
                    className={clsx(
                      'w-5 h-5 rounded font-black text-[10px] flex items-center justify-center font-mono shadow-xs',
                      res === 'W' && 'bg-emerald-500 text-black',
                      res === 'D' && 'bg-amber-500 text-black',
                      res === 'L' && 'bg-rose-500 text-white'
                    )}
                  >
                    {res}
                  </span>
                ))
              ) : (
                <span className="text-slate-600 text-xs">Sin disputar</span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Estado de Temporada</span>
            <span className="text-xs font-bold text-cyan-400">
              {isSeasonCompleted ? '🏆 Concluida' : `En curso (J${currentRound})`}
            </span>
          </div>
        </div>

        {/* FILTROS DE FIXTURES */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filtro:</span>
          </span>
          {[
            { id: 'all', label: `Todos (${userFixtures.length})` },
            { id: 'pending', label: `Pendientes (${userFixtures.filter((f) => !f.isPlayed).length})` },
            { id: 'played', label: `Jugados (${userFixtures.filter((f) => f.isPlayed).length})` },
            { id: 'first_half', label: '1.ª Vuelta (J1-23)' },
            { id: 'second_half', label: '2.ª Vuelta (J24-46)' },
            { id: 'home', label: 'En Casa (Local)' },
            { id: 'away', label: 'Fuera (Visitante)' },
          ].map((flt) => (
            <button
              key={flt.id}
              type="button"
              onClick={() => setFilterType(flt.id as any)}
              className={clsx(
                'shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                filterType === flt.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              )}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. VISTA CRONOGRAMA FIFA (TIMELINE HORIZONTAL DE TARJETAS) */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {filteredFixtures.map((fix) => {
            const isHome = fix.homeClubId === userClubId;
            const rivalClubId = isHome ? fix.awayClubId : fix.homeClubId;
            const rivalClub = clubsMap[rivalClubId];
            const isCurrentMatch = fix.round === currentRound && !isSeasonCompleted;
            const isPlayed = fix.isPlayed;
            const dateStr = getSimulatedDate(fix.round, currentSeason);

            // Calcular resultado del usuario si se jugó
            const userScore = isHome ? fix.homeScore : fix.awayScore;
            const rivalScore = isHome ? fix.awayScore : fix.homeScore;
            const userWon = isPlayed && userScore !== undefined && rivalScore !== undefined && userScore > rivalScore;
            const userDrew = isPlayed && userScore !== undefined && rivalScore !== undefined && userScore === rivalScore;
            const userLost = isPlayed && userScore !== undefined && rivalScore !== undefined && userScore < rivalScore;

            const homeC = clubsMap[fix.homeClubId] || userClub;
            const awayC = clubsMap[fix.awayClubId] || rivalClub || userClub;

            return (
              <div
                key={fix.id}
                ref={isCurrentMatch ? currentRoundCardRef : undefined}
                className={clsx(
                  'rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg',
                  isCurrentMatch
                    ? 'bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border-2 border-cyan-400 ring-4 ring-cyan-500/20 shadow-cyan-500/20 scale-[1.01]'
                    : isPlayed
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-750 opacity-95'
                )}
              >
                {/* FRANJA DE CABECERA DE LA TARJETA */}
                <div
                  className={clsx(
                    'px-3 sm:px-4 py-2 border-b flex flex-wrap items-center justify-between gap-1.5 text-xs',
                    isCurrentMatch
                      ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400'
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-mono font-black text-white text-[11px] sm:text-xs">JORNADA {fix.round}</span>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {dateStr}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                      {isHome ? (
                        <>
                          <Home className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300 font-bold">Local</span>
                        </>
                      ) : (
                        <>
                          <Plane className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-300 font-bold">Visitante</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {isCurrentMatch && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-black" />
                        Próximo
                      </span>
                    )}

                    {isPlayed && (
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider',
                          userWon && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
                          userDrew && 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                          userLost && 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        )}
                      >
                        {userWon ? 'Victoria' : userDrew ? 'Empate' : 'Derrota'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectRound(fix.round)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Ver todos los resultados de los 12 partidos de esta jornada"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Ver Jornada {fix.round}</span>
                      <span className="sm:hidden">J{fix.round}</span>
                    </button>
                  </div>
                </div>

                {/* CONTENIDO PRINCIPAL: CLUB LOCAL VS CLUB VISITANTE */}
                <div className="p-3 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* CLUB LOCAL */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-base shadow-md border-2 border-white/20 shrink-0"
                        style={{ backgroundColor: homeC.primaryColor, color: homeC.secondaryColor }}
                      >
                        {homeC.shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              'font-black text-xs sm:text-sm md:text-base truncate',
                              homeC.id === userClubId ? 'text-cyan-300' : 'text-white'
                            )}
                          >
                            {homeC.name}
                          </span>
                          {homeC.id === userClubId && (
                            <span className="text-[8px] sm:text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                              TÚ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <span>Nivel {homeC.level}</span>
                          <span className="text-slate-600 hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{homeC.country}</span>
                        </div>
                      </div>
                    </div>

                    {/* CENTRO: MARCADOR O ESTADO DE PARTIDO */}
                    <div className="shrink-0 px-2 text-center">
                      {isPlayed ? (
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-widest text-white px-3 sm:px-4 py-1 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
                            <span>{fix.homeScore}</span>
                            <span className="text-slate-600 mx-1.5 sm:mx-2">-</span>
                            <span>{fix.awayScore}</span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1 block tracking-wider">
                            Finalizado
                          </span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-bold text-slate-500 font-mono px-2.5 sm:px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80">
                            VS
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono mt-0.5 block">
                            {isCurrentMatch ? 'En turno' : 'Por jugar'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CLUB VISITANTE */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 text-right flex-1 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center justify-end gap-1.5">
                          {awayC.id === userClubId && (
                            <span className="text-[8px] sm:text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                              TÚ
                            </span>
                          )}
                          <span
                            className={clsx(
                              'font-black text-xs sm:text-sm md:text-base truncate',
                              awayC.id === userClubId ? 'text-cyan-300' : 'text-white'
                            )}
                          >
                            {awayC.name}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5 truncate">
                          <span>Nivel {awayC.level}</span>
                          <span className="text-slate-600 hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{awayC.country}</span>
                        </div>
                      </div>
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-base shadow-md border-2 border-white/20 shrink-0"
                        style={{ backgroundColor: awayC.primaryColor, color: awayC.secondaryColor }}
                      >
                        {awayC.shortName}
                      </div>
                    </div>
                  </div>

                  {/* SI ES EL PARTIDO ACTUAL: BOTONES DE DISPUTAR / SIMULAR EN FILA ADAPTADA */}
                  {isCurrentMatch && !isPlayed && (
                    <div className="pt-2.5 border-t border-cyan-500/30 flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={startMatchDay}
                        className="w-full sm:w-auto px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Disputar en Vivo (2D)</span>
                      </button>
                      <button
                        type="button"
                        onClick={simulateFullMatchDay}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                      >
                        <FastForward className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Simular Partido</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* PIE DE TARJETA SI FUE EL ÚLTIMO PARTIDO */}
                {isPlayed && lastMatchSummary && lastMatchSummary.round === fix.round && (
                  <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Último acta registrada en vivo con notas de rendimiento y evolución de media
                    </span>
                    <button
                      type="button"
                      onClick={openLastMatchSummary}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span>Abrir Acta Oficial Completa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. VISTA MES A MES (DISTRIBUCIÓN ANUAL ESTILO FIFA) */}
      {viewMode === 'month' && (
        <div className="space-y-6">
          {SEASON_MONTHS.map((month) => {
            const monthFixs = userFixtures.filter((f) => month.rounds.includes(f.round));
            if (monthFixs.length === 0) return null;

            return (
              <div key={month.name} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-cyan-400" />
                    <span>{month.name}</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Jornadas {month.rounds[0]} a {month.rounds[month.rounds.length - 1]}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {monthFixs.map((f) => {
                    const isH = f.homeClubId === userClubId;
                    const rivId = isH ? f.awayClubId : f.homeClubId;
                    const riv = clubsMap[rivId];
                    const isCurrent = f.round === currentRound && !isSeasonCompleted;
                    const dateStr = getSimulatedDate(f.round, currentSeason);

                    return (
                      <div
                        key={f.id}
                        onClick={() => setInspectRound(f.round)}
                        className={clsx(
                          'p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm',
                          isCurrent
                            ? 'bg-cyan-950/50 border-cyan-500/80 ring-2 ring-cyan-500/30'
                            : f.isPlayed
                            ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono font-black text-white">J{f.round}</span>
                          <span>{dateStr}</span>
                          <span className={clsx('font-bold', isH ? 'text-cyan-400' : 'text-amber-400')}>
                            {isH ? 'Casa' : 'Fuera'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            {riv && (
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow border border-white/20"
                                style={{ backgroundColor: riv.primaryColor, color: riv.secondaryColor }}
                              >
                                {riv.shortName}
                              </div>
                            )}
                            <div className="truncate">
                              <span className="font-bold text-xs text-white truncate block">{riv?.name}</span>
                              <span className="text-[10px] text-slate-500">Nivel {riv?.level}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {f.isPlayed ? (
                              <div className="font-mono font-black text-sm text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {f.homeScore} - {f.awayScore}
                              </div>
                            ) : isCurrent ? (
                              <span className="text-[10px] bg-cyan-500 text-black px-2 py-0.5 rounded font-black animate-pulse">
                                HOY
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">VS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL DETALLADO DE JORNADA COMPLETA (TODOS LOS 12 PARTIDOS DE LA DIVISIÓN) */}
      {inspectRound !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">
                  Competición Regular · {divisionName}
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Jornada {inspectRound} Completa</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({getSimulatedDate(inspectRound, currentSeason)})
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectRound(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Todos los 12 enfrentamientos de la jornada correspondientes a los 24 clubes de la división:
            </p>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {roundInspectFixtures.map((f) => {
                const homeC = clubsMap[f.homeClubId];
                const awayC = clubsMap[f.awayClubId];
                const isUserMatch = f.homeClubId === userClubId || f.awayClubId === userClubId;

                return (
                  <div
                    key={f.id}
                    className={clsx(
                      'p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors',
                      isUserMatch
                        ? 'bg-cyan-950/60 border-cyan-500/60 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/80 border-slate-800/80'
                    )}
                  >
                    {/* Club Local */}
                    <div className="flex items-center gap-2.5 w-5/12 justify-end text-right truncate">
                      <span
                        className={clsx(
                          'font-bold truncate',
                          homeC?.id === userClubId ? 'text-cyan-300 font-black' : 'text-white'
                        )}
                      >
                        {homeC?.name}
                      </span>
                      {homeC && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border border-white/20"
                          style={{ backgroundColor: homeC.primaryColor, color: homeC.secondaryColor }}
                        >
                          {homeC.shortName}
                        </div>
                      )}
                    </div>

                    {/* Marcador */}
                    <div className="w-2/12 text-center shrink-0">
                      {f.isPlayed ? (
                        <span className="font-mono font-black text-sm text-white px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                          {f.homeScore} - {f.awayScore}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">VS</span>
                      )}
                    </div>

                    {/* Club Visitante */}
                    <div className="flex items-center gap-2.5 w-5/12 justify-start truncate">
                      {awayC && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border border-white/20"
                          style={{ backgroundColor: awayC.primaryColor, color: awayC.secondaryColor }}
                        >
                          {awayC.shortName}
                        </div>
                      )}
                      <span
                        className={clsx(
                          'font-bold truncate',
                          awayC?.id === userClubId ? 'text-cyan-300 font-black' : 'text-white'
                        )}
                      >
                        {awayC?.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectRound(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
