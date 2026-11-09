'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  Shield,
  Users,
  Target,
  Play,
  Trophy,
  Search,
  TrendingUp,
  DollarSign,
  Zap,
  FolderDown,
  FolderUp,
  RotateCcw,
  Coins,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';
import { computeLeagueTable } from '@/engine/season-engine';
import { Currency, CountryLeague, TierLevel } from '@/types/football-manager';
import { formatMoney } from '@/lib/currency';
import { COUNTRIES_CATALOG, getDivisionsByCountry, getDivisionById } from '@/engine/data/divisions-catalog';
import { CLUBS_MASTER_CATALOG, EUR_TO_YEN } from '@/engine/data/leagues-catalog';

// Componentes modulares
import { OfficeView } from '@/components/OfficeView';
import { SquadView } from '@/components/SquadView';
import { TacticsView } from '@/components/TacticsView';
import { LiveMatchView } from '@/components/LiveMatchView';
import { TableView } from '@/components/TableView';
import { CalendarView } from '@/components/CalendarView';
import { MarketView } from '@/components/MarketView';
import { TrainingView } from '@/components/TrainingView';
import { FinanceView } from '@/components/FinanceView';
import { SimulatedMatchModal } from '@/components/SimulatedMatchModal';

export default function FootballManagerApp() {
  const {
    hasStarted,
    managerName,
    userClubId,
    currentSeason,
    currentRound,
    clubs,
    fixtures,
    selectedDivisionId,
    activeTab,
    liveMatch,
    boardTrust,
    isSacked,
    selectedCurrency,
    simulatedMatchSummary,
    clearSimulatedMatchSummary,
    setCurrency,
    loadFromStorage,
    startNewGame,
    setActiveTab,
    exportGameJson,
    importGameJson,
    resetCareerGame,
  } = useGameStore();

  const [selectedCoachName, setSelectedCoachName] = useState('Ego Jinpachi');
  const [selectedCountry, setSelectedCountry] = useState<CountryLeague>('Spain');
  const [selectedTier, setSelectedTier] = useState<TierLevel>(1);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState('es_barcha');
  const [startCurrency, setStartCurrency] = useState<Currency>('EUR');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Divisiones del país actual
  const countryDivisions = getDivisionsByCountry(selectedCountry);
  const currentDivision = countryDivisions.find((d) => d.tier === selectedTier) || countryDivisions[0];

  // Clubes disponibles para la categoría y grupo
  const availableClubs = CLUBS_MASTER_CATALOG.filter((c) => {
    if (c.divisionId !== currentDivision.id) return false;
    if (selectedGroupId && c.groupId && c.groupId !== selectedGroupId) return false;
    return true;
  });

  // Si el club seleccionado no está en la lista actual, seleccionar el primero
  useEffect(() => {
    if (availableClubs.length > 0 && !availableClubs.some((c) => c.id === selectedClubId)) {
      setSelectedClubId(availableClubs[0].id);
    }
  }, [availableClubs, selectedClubId]);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const activeDivisionId = userClub?.divisionId || userClub?.league || selectedDivisionId || 'es_laliga';
  const divisionClubs = clubs.filter((c) => (c.divisionId || c.league) === activeDivisionId);
  const clubsForTable = divisionClubs.length > 0 ? divisionClubs : clubs;
  const leagueTable = clubsForTable.length > 0 && fixtures.length > 0 ? computeLeagueTable(clubsForTable, fixtures) : [];

  // 1. PANTALLA INICIAL
  if (!hasStarted) {
    const activeClubTemplate = CLUBS_MASTER_CATALOG.find((c) => c.id === selectedClubId) || availableClubs[0];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 selection:bg-cyan-500 selection:text-black">
        <div className="max-w-5xl w-full space-y-6 my-auto">
          {/* CABECERA */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
              <Zap className="w-4 h-4 fill-cyan-400" /> Blue Lock: European Leagues Career Mode
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic">
              BLUE <span className="text-cyan-400">LOCK</span> <span className="text-slate-400 text-2xl md:text-3xl font-bold not-italic">MANAGER</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto">
              Elige tu país, categoría y club en la pirámide de las 5 grandes ligas europeas con 4 niveles por nación,
              ascensos, descensos y eliminatorias reales.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            {/* NOMBRE DEL MÁNAGER Y DIVISA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre del Entrenador / Mánager:
                </label>
                <input
                  type="text"
                  value={selectedCoachName}
                  onChange={(e) => setSelectedCoachName(e.target.value)}
                  placeholder="Tu nombre (ej: Ego Jinpachi)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-cyan-400" />
                  Divisa del Modo Carrera:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { code: 'EUR', symbol: '€' },
                    { code: 'GBP', symbol: '£' },
                    { code: 'USD', symbol: '$' },
                    { code: 'JPY', symbol: '¥' },
                  ].map((cur) => {
                    const isSel = startCurrency === cur.code;
                    return (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => setStartCurrency(cur.code as Currency)}
                        className={clsx(
                          'p-2 rounded-xl border text-center transition-all',
                          isSel
                            ? 'border-cyan-400 bg-cyan-950/70 ring-2 ring-cyan-500/50 shadow-md'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        )}
                      >
                        <span className="font-black text-sm text-white">{cur.symbol}</span>{' '}
                        <span className="text-[10px] uppercase font-bold text-cyan-400">{cur.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PASO 1: SELECCIÓN DE PAÍS / GRAN LIGA */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Paso 1: Selecciona la Gran Liga (País)</span>
                <span className="text-cyan-400 font-mono text-[11px]">5 Naciones Oficiales</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {COUNTRIES_CATALOG.map((c) => {
                  const isSel = selectedCountry === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c.id);
                        setSelectedTier(1);
                        setSelectedGroupId(null);
                      }}
                      className={clsx(
                        'p-3 rounded-2xl border text-center transition-all transform hover:-translate-y-0.5',
                        isSel
                          ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/60 to-slate-900 ring-2 ring-cyan-500/50 shadow-lg'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      )}
                    >
                      <div className="text-2xl mb-1">{c.flag}</div>
                      <div className="font-bold text-white text-xs">{c.nameEs}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">4 Categorías</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASO 2: SELECCIÓN DE CATEGORÍA / DIVISIÓN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paso 2: Categoría / División ({countryDivisions.length} Niveles)
                </label>
                <span className="text-xs text-slate-300 font-semibold">
                  {currentDivision.name}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {countryDivisions.map((div) => {
                  const isSel = selectedTier === div.tier;
                  return (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() => {
                        setSelectedTier(div.tier);
                        setSelectedGroupId(div.groups ? div.groups[0].id : null);
                      }}
                      className={clsx(
                        'p-3 rounded-xl border text-left transition-all',
                        isSel
                          ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-500/40 shadow-md'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-cyan-400 font-mono">NIVEL {div.tier}</span>
                        <span className="text-[10px] font-bold text-slate-400">{div.totalTeams} equipos</span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">{div.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        {div.tier === 1 && '🏆 Máxima Categoría'}
                        {div.tier === 2 && '⚡ Ascenso y Playoff'}
                        {div.tier === 3 && '🔥 Ascenso cruzado'}
                        {div.tier === 4 && '🌱 Fútbol base y regional'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* REGLAS OFICIALES DE LA CATEGORÍA */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex flex-wrap gap-x-4 gap-y-1 items-center">
                <span className="text-cyan-400 font-bold uppercase tracking-wider font-mono text-[10px]">Sistema Oficial:</span>
                {currentDivision.promotionDirect > 0 && (
                  <span>🟢 {currentDivision.promotionDirect} ascensos directos</span>
                )}
                {currentDivision.promotionPlayoff > 0 && (
                  <span>
                    🔵 Playoff de Ascenso ({currentDivision.promotionDirect + 1}.º al{' '}
                    {currentDivision.promotionDirect + currentDivision.promotionPlayoff}.º)
                  </span>
                )}
                {currentDivision.relegationDirect > 0 && (
                  <span>🔴 {currentDivision.relegationDirect} descensos directos</span>
                )}
                {currentDivision.relegationPlayoff > 0 && (
                  <span>🟠 Playout / Relegation de permanencia</span>
                )}
                {currentDivision.hasGroups && (
                  <span className="text-amber-400 font-semibold">📍 Estructura en grupos geográficos</span>
                )}
              </div>

              {/* SELECTOR DE GRUPOS (SI LA CATEGORÍA TIENE GRUPOS) */}
              {currentDivision.hasGroups && currentDivision.groups && (
                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Grupo Geográfico:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDivision.groups.map((grp) => {
                      const isSel = selectedGroupId === grp.id || (!selectedGroupId && grp.id === currentDivision.groups![0].id);
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => setSelectedGroupId(grp.id)}
                          className={clsx(
                            'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                            isSel
                              ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 ring-1 ring-cyan-500/50'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          )}
                        >
                          {grp.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* PASO 3: SELECCIÓN DE CLUB */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paso 3: Selecciona tu Club ({availableClubs.length} disponibles)
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">
                  Presupuestos y plantillas sin licencia / Blue Lock
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {availableClubs.map((club) => {
                  const isSel = selectedClubId === club.id;
                  const budgetInYen = club.budgetEur * EUR_TO_YEN;

                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => setSelectedClubId(club.id)}
                      className={clsx(
                        'flex flex-col p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden',
                        isSel
                          ? 'border-cyan-400 bg-cyan-950/50 ring-2 ring-cyan-500/50 shadow-lg'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md border border-white/20"
                          style={{ backgroundColor: club.primaryColor, color: club.secondaryColor }}
                        >
                          {club.shortName}
                        </div>
                        <div className="truncate flex-1">
                          <div className="font-black text-white text-sm truncate flex items-center gap-1.5">
                            {club.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Nivel {club.level} · {club.stadiumName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                        <span className="text-slate-400">
                          🏟️ {club.stadiumCapacity.toLocaleString()} cap.
                        </span>
                        <span className="text-cyan-400 font-mono font-bold">
                          {formatMoney(budgetInYen, startCurrency)}
                        </span>
                      </div>

                      {club.starPlayers && club.starPlayers.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex flex-wrap gap-1">
                          {club.starPlayers.slice(0, 3).map((sp) => (
                            <span
                              key={sp.name}
                              className={clsx(
                                'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold',
                                sp.isBlueLock
                                  ? 'bg-blue-900/60 border border-blue-500/40 text-blue-300'
                                  : 'bg-slate-800 text-slate-300'
                              )}
                            >
                              {sp.name} ({sp.position} {sp.overall})
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN DE ACCIÓN FINAL */}
            <div className="pt-4 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80">
              <button
                type="button"
                onClick={() =>
                  startNewGame(
                    selectedCoachName,
                    selectedClubId,
                    startCurrency,
                    selectedCountry,
                    currentDivision.id
                  )
                }
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-black text-sm rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-black" />
                Comenzar Carrera con {activeClubTemplate ? activeClubTemplate.name : 'tu Club'}
              </button>

              <label className="cursor-pointer text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors">
                <FolderUp className="w-4 h-4" />
                Importar partida desde JSON
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        const res = importGameJson(content);
                        if (!res.success) alert(res.message);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. PANTALLA DE DESTITUCIÓN (GAME OVER)
  if (isSacked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black border border-rose-800">
            ✕
          </div>
          <h2 className="text-3xl font-black text-white">HAS SIDO DESTITUIDO</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            La confianza de la directiva y de la afición cayó por debajo de los límites tolerables. Tu aventura en{' '}
            <strong className="text-white">{userClub.name}</strong> ha terminado abruptamente.
          </p>
          <button
            type="button"
            onClick={resetCareerGame}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Comenzar Nueva Partida
          </button>
        </div>
      </div>
    );
  }

  // 3. MAIN DASHBOARD
  const userDivisionInfo = getDivisionById(activeDivisionId);
  const totalRounds = fixtures.length > 0 ? Math.max(...fixtures.map((f) => f.round)) : 46;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Identidad del Club y Liga */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shadow-md border border-white/20 shrink-0"
              style={{ backgroundColor: userClub.primaryColor, color: userClub.secondaryColor }}
            >
              {userClub.shortName}
            </div>
            <div className="min-w-0 truncate">
              <div className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{userClub.name}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden xs:inline">({managerName})</span>
              </div>
              <div className="text-[11px] sm:text-xs text-cyan-400 font-semibold flex items-center gap-1.5 truncate">
                <span className="truncate">{userDivisionInfo?.name || 'Liga'}</span>
                <span className="text-slate-600">·</span>
                <span className="shrink-0">T{currentSeason}</span>
                <span className="text-slate-600">·</span>
                <span className="shrink-0">J{currentRound}/{totalRounds}</span>
              </div>
            </div>
          </div>

          {/* Selector de divisa en móvil compacto */}
          <div className="sm:hidden flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            {(['EUR', 'USD', 'JPY', 'GBP'] as Currency[]).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[9px] font-bold transition-all',
                  selectedCurrency === cur
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {cur === 'EUR' ? '€' : cur === 'USD' ? '$' : cur === 'JPY' ? '¥' : '£'}
              </button>
            ))}
          </div>
        </div>

        {/* Cajas financieras y acciones */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 md:gap-6 text-xs w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Caja</span>
              <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                {formatMoney(userClub.cashYen, selectedCurrency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold">Fichajes</span>
              <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm">
                {formatMoney(userClub.budgetYen, selectedCurrency)}
              </span>
            </div>
            <div className="hidden md:block">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Confianza</span>
              <div className="flex items-center gap-2">
                <div className="w-14 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full transition-all',
                      boardTrust >= 70 ? 'bg-emerald-400' : boardTrust >= 40 ? 'bg-yellow-400' : 'bg-rose-500'
                    )}
                    style={{ width: `${boardTrust}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-white text-[11px]">{boardTrust}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SELECTOR RÁPIDO DE DIVISA (TABLET / DESKTOP) */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              {(['EUR', 'USD', 'JPY', 'GBP'] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  title={`Cambiar divisa a ${cur}`}
                  className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-all',
                    selectedCurrency === cur
                      ? 'bg-cyan-500 text-black shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {cur === 'EUR' ? '€' : cur === 'USD' ? '$' : cur === 'JPY' ? '¥' : '£'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const data = exportGameJson();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bluelock-career-s${currentSeason}-j${currentRound}.json`;
                a.click();
              }}
              title="Descargar Partida (.JSON)"
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
            >
              <FolderDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Reiniciar la partida actual y volver a empezar?')) {
                  resetCareerGame();
                }
              }}
              title="Reiniciar Partida"
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 overflow-x-auto flex gap-1.5 sm:gap-2 py-2 scrollbar-none">
        {[
          { id: 'office', label: 'Despacho', icon: Shield },
          { id: 'squad', label: 'Plantilla', icon: Users },
          { id: 'tactics', label: 'Táctica & Pizarra', icon: Target },
          { id: 'live_match', label: 'Partido en Vivo', icon: Play, alert: !!liveMatch },
          { id: 'table', label: 'Clasificación', icon: Trophy },
          { id: 'calendar', label: 'Calendario', icon: Calendar },
          { id: 'market', label: 'Mercado Fichajes', icon: Search },
          { id: 'training', label: 'Entreno & Cantera', icon: TrendingUp },
          { id: 'finance', label: 'Finanzas', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.alert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6">
        {activeTab === 'office' && <OfficeView leagueTable={leagueTable} />}
        {activeTab === 'squad' && <SquadView />}
        {activeTab === 'tactics' && <TacticsView />}
        {activeTab === 'live_match' && (liveMatch ? <LiveMatchView /> : <OfficeView leagueTable={leagueTable} />)}
        {activeTab === 'table' && <TableView leagueTable={leagueTable} />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'market' && <MarketView />}
        {activeTab === 'training' && <TrainingView />}
        {activeTab === 'finance' && <FinanceView />}
      </main>

      {/* MODAL EMERGENTE DE PARTIDO SIMULADO */}
      {simulatedMatchSummary && (
        <SimulatedMatchModal
          summary={simulatedMatchSummary}
          onClose={clearSimulatedMatchSummary}
        />
      )}
    </div>
  );
}
