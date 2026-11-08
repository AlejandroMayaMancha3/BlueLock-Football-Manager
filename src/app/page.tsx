'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { Pitch2D } from '@/components/Pitch2D';
import { LiveMatchView } from '@/components/LiveMatchView';
import {
  Trophy,
  Zap,
  Flame,
  Coins,
  Users,
  Target,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  UserPlus,
  Play,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  FolderDown,
  FolderUp,
  Settings,
  DollarSign,
  Activity,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';
import { Player, Club, Formation, TacticalMentalidad, TacticalPresion, TacticalPase } from '@/types/football-manager';
import { computeLeagueTable } from '@/engine/season-engine';

export default function CareerModePage() {
  const {
    hasStarted,
    managerName,
    userClubId,
    currentSeason,
    currentRound,
    clubs,
    players,
    fixtures,
    activeTab,
    liveMatch,
    boardTrust,
    squadMorale,
    trainingPlan,
    activeDecisionEvent,
    transferOffers,
    ledger,
    seasonHistory,
    isSacked,
    isSeasonCompleted,
    startNewGame,
    loadFromStorage,
    saveToStorage,
    setActiveTab,
    startMatchDay,
    updateTactics,
    updateFormation,
    swapStartingPlayer,
    setRole,
    setTrainingPlan,
    promoteYouthPlayer,
    makeBuyOffer,
    acceptSellOffer,
    rejectSellOffer,
    renewPlayerContract,
    answerDecisionEvent,
    proceedToNextSeason,
    exportGameJson,
    importGameJson,
    resetCareerGame,
  } = useGameStore();

  // Local state
  const [selectedCoachName, setSelectedCoachName] = useState('Ego Jinpachi');
  const [selectedClubId, setSelectedClubId] = useState('club-bm');
  const [tacticsSelectedPlayer, setTacticsSelectedPlayer] = useState<Player | null>(null);
  const [marketSearch, setMarketSearch] = useState('');
  const [marketPosFilter, setMarketPosFilter] = useState('ALL');
  const [selectedMarketPlayer, setSelectedMarketPlayer] = useState<Player | null>(null);
  const [offerFee, setOfferFee] = useState<number>(50000000);
  const [offerWage, setOfferWage] = useState<number>(1500000);
  const [offerYears, setOfferYears] = useState<number>(3);
  const [marketFeedback, setMarketFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [canteraFeedback, setCanteraFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Auto-load game from localStorage if available
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const allPlayersMap = players.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Player>);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.clubId === userClubId);
  const leagueTable = clubs.length > 0 && fixtures.length > 0 ? computeLeagueTable(clubs, fixtures) : [];
  const nextUserFixture = fixtures.find(
    (f) => f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)
  );
  const rivalClub = nextUserFixture
    ? clubs.find((c) => c.id === (nextUserFixture.homeClubId === userClubId ? nextUserFixture.awayClubId : nextUserFixture.homeClubId))
    : null;

  // Format Japanese Yen currency
  const fmtYen = (yen: number) => {
    if (yen >= 100000000) {
      return `${(yen / 100000000).toFixed(1)} M¥`;
    }
    if (yen >= 10000) {
      return `${(yen / 10000).toFixed(0)} k¥`;
    }
    return `${yen.toLocaleString('es-ES')} ¥`;
  };

  // 1. PANTALLA INICIAL: NUEVA PARTIDA / CONTINUAR PARTIDA
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 selection:bg-cyan-500 selection:text-black">
        <div className="max-w-4xl w-full space-y-8 my-auto">
          {/* Logo y Encabezado */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
              <Zap className="w-4 h-4 fill-cyan-400" /> Blue Lock: Egoist Football Manager
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
              BLUE <span className="text-cyan-400">LOCK</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Simulador de gestión futbolística completo. Dirige un club en la Neo Egoist League, construye tu once,
              gestiona tácticas y despierta el Flow para dominar la temporada.
            </p>
          </div>

          {/* Formulario de Inicio */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nombre del Entrenador / Mánager:
              </label>
              <input
                type="text"
                value={selectedCoachName}
                onChange={(e) => setSelectedCoachName(e.target.value)}
                placeholder="Tu nombre (ej: Ego Jinpachi)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Selecciona tu Club para la Temporada 1:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {[
                  { id: 'club-bm', name: 'Bastard München', country: 'Alemania', lvl: 87, budget: 850000000, pri: '#c8102e', sec: '#1d252d' },
                  { id: 'club-pxg', name: 'Paris X Gen', country: 'Francia', lvl: 86, budget: 950000000, pri: '#002654', sec: '#ed2939' },
                  { id: 'club-mc', name: 'Manshine City', country: 'Inglaterra', lvl: 84, budget: 900000000, pri: '#6cabdd', sec: '#ffffff' },
                  { id: 'club-ubers', name: 'Ubers', country: 'Italia', lvl: 85, budget: 750000000, pri: '#ffffff', sec: '#111111' },
                  { id: 'club-barcha', name: 'FC Barcha', country: 'España', lvl: 83, budget: 700000000, pri: '#a50044', sec: '#004d98' },
                  { id: 'club-rm', name: 'Real Madrid Juvenil', country: 'España', lvl: 86, budget: 800000000, pri: '#ffffff', sec: '#e0b238' },
                  { id: 'club-inter', name: 'Inter Milán NextGen', country: 'Italia', lvl: 80, budget: 550000000, pri: '#001489', sec: '#000000' },
                  { id: 'club-bvb', name: 'Borussia West', country: 'Alemania', lvl: 79, budget: 500000000, pri: '#fde100', sec: '#000000' },
                  { id: 'club-ars', name: 'Arsenal Academy', country: 'Inglaterra', lvl: 79, budget: 520000000, pri: '#ef0107', sec: '#ffffff' },
                  { id: 'club-ajax', name: 'Ajax Future Stars', country: 'Países Bajos', lvl: 78, budget: 450000000, pri: '#d2122e', sec: '#ffffff' },
                  { id: 'club-scp', name: 'Sporting Lisboa Talents', country: 'Portugal', lvl: 77, budget: 400000000, pri: '#008057', sec: '#ffffff' },
                  { id: 'club-bl11', name: 'Blue Lock Eleven', country: 'Japón', lvl: 81, budget: 600000000, pri: '#0047bb', sec: '#00ffff' },
                ].map((club) => {
                  const isSel = selectedClubId === club.id;
                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => setSelectedClubId(club.id)}
                      className={clsx(
                        'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                        isSel
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/40'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md border border-white/20"
                        style={{ backgroundColor: club.pri, color: club.sec }}
                      >
                        {club.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-white text-sm truncate">{club.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Nivel {club.lvl} · {club.country}
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono">
                          Presupuesto: {fmtYen(club.budget)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Acciones principales */}
            <div className="pt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <button
                type="button"
                onClick={() => startNewGame(selectedCoachName, selectedClubId)}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                Comenzar Carrera (Nueva Partida)
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

  // 2. PANTALLA DE DESTITUCIÓN (SACKED)
  if (isSacked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/50 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
          <h1 className="text-3xl font-black text-white">¡DESTITUIDO DEL CLUB!</h1>
          <p className="text-sm text-slate-400">
            La directiva de {userClub.name} ha perdido por completo la confianza en tu gestión deportiva y económica tras
            los últimos resultados. Tu contrato ha sido rescindido de inmediato.
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

  // 3. NAVEGACIÓN Y PANEL PRINCIPAL (FOOTBALL MANAGER DASHBOARD)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* TOPBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Info del Club y Mánager */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md border border-white/20"
            style={{ backgroundColor: userClub.primaryColor, color: userClub.secondaryColor }}
          >
            {userClub.shortName}
          </div>
          <div>
            <div className="font-black text-sm text-white flex items-center gap-2">
              {userClub.name}
              <span className="text-[10px] text-slate-400 font-mono">({managerName})</span>
            </div>
            <div className="text-xs text-cyan-400 font-semibold">
              Temporada {currentSeason} · Jornada {currentRound}/22
            </div>
          </div>
        </div>

        {/* Indicadores Financieros y Confianza */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Caja Disponible</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{fmtYen(userClub.cashYen)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Presupuesto Fichajes</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{fmtYen(userClub.budgetYen)}</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Confianza Directiva</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all',
                    boardTrust >= 70 ? 'bg-emerald-400' : boardTrust >= 40 ? 'bg-yellow-400' : 'bg-rose-500'
                  )}
                  style={{ width: `${boardTrust}%` }}
                />
              </div>
              <span className="font-mono font-bold text-white">{boardTrust}%</span>
            </div>
          </div>

          {/* Exportar JSON & Guardar */}
          <div className="flex items-center gap-2">
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
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
            >
              <FolderDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Reiniciar la partida actual y volver a empezar?')) {
                  resetCareerGame();
                }
              }}
              title="Reiniciar Partida"
              className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* SUB-NAV TABS */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 overflow-x-auto flex gap-2 py-2">
        {[
          { id: 'office', label: 'Despacho', icon: Shield },
          { id: 'squad', label: 'Plantilla', icon: Users },
          { id: 'tactics', label: 'Táctica & Pizarra', icon: Target },
          { id: 'live_match', label: 'Partido en Vivo', icon: Play, alert: !!liveMatch },
          { id: 'table', label: 'Clasificación', icon: Trophy },
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
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.alert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </button>
          );
        })}
      </nav>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* PESTAÑA: DESPACHO / OFICINA */}
        {activeTab === 'office' && (
          <div className="space-y-6">
            {/* 1. DILEMA / EVENTO NARRATIVO ACTIVO */}
            {activeDecisionEvent && (
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Dilema de Vestuario / Consecuencias
                </div>
                <h3 className="text-xl font-black text-white">{activeDecisionEvent.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{activeDecisionEvent.narrative}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {activeDecisionEvent.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => answerDecisionEvent(idx)}
                      className="p-4 rounded-xl bg-slate-950/80 border border-purple-800/40 hover:border-purple-400 text-left transition-all hover:scale-[1.02] space-y-1"
                    >
                      <div className="font-bold text-white text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. TARJETA DEL PRÓXIMO ENCUENTRO */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" /> Próximo Partido · Jornada {currentRound} de 22
                </h3>
                <span className="text-xs text-slate-500">Neo Egoist League</span>
              </div>

              {rivalClub ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Mi Club */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-2 border-white/20"
                      style={{ backgroundColor: userClub.primaryColor, color: userClub.secondaryColor }}
                    >
                      {userClub.shortName}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">{userClub.name}</h4>
                      <p className="text-xs text-slate-400">Nivel de Fuerza: {userClub.level} · Moral {squadMorale}%</p>
                    </div>
                  </div>

                  {/* VS y Acción de Partido */}
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 font-mono">VS</span>
                    <button
                      type="button"
                      onClick={startMatchDay}
                      className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 animate-pulse"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      Disputar Partido (Jornada {currentRound})
                    </button>
                  </div>

                  {/* Rival */}
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <h4 className="text-2xl font-black text-white">{rivalClub.name}</h4>
                      <p className="text-xs text-slate-400">Nivel de Fuerza: {rivalClub.level} · {rivalClub.country}</p>
                    </div>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-2 border-white/20"
                      style={{ backgroundColor: rivalClub.primaryColor, color: rivalClub.secondaryColor }}
                    >
                      {rivalClub.shortName}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p>Has completado todas las jornadas de la temporada regular.</p>
                  <button
                    type="button"
                    onClick={proceedToNextSeason}
                    className="mt-3 px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-xl"
                  >
                    Avanzar a la Temporada {currentSeason + 1}
                  </button>
                </div>
              )}
            </div>

            {/* 3. RESUMEN DE LA DIRECTIVA Y PLAN SEMANAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Objetivo de la Directiva</h4>
                <div className="text-xl font-black text-white">
                  Objetivo: {userClub.boardExpectation === 1 ? 'Campeón de Liga' : `Top ${userClub.boardExpectation}`}
                </div>
                <p className="text-xs text-slate-400">
                  La directiva exige terminar entre los puestos de honor. Mantén la confianza por encima del 20% para
                  no ser destituido.
                </p>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Confianza</span>
                    <span className="font-bold">{boardTrust}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: `${boardTrust}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan de Entrenamiento</h4>
                <div className="text-xl font-black text-white capitalize">{trainingPlan}</div>
                <p className="text-xs text-slate-400">
                  El plan semanal se aplica tras cada jornada. Recupera fatiga y mejora los atributos de los jugadores.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('training')}
                  className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
                >
                  Cambiar Plan de Entreno <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumen de Clasificación</h4>
                <div className="space-y-1.5">
                  {leagueTable.slice(0, 4).map((row, idx) => (
                    <div key={row.clubId} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500 w-4">{idx + 1}</span>
                        <span className={clsx(row.clubId === userClubId ? 'text-cyan-400 font-bold' : 'text-slate-300')}>
                          {row.clubName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white">{row.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: PLANTILLA */}
        {activeTab === 'squad' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Plantilla del Primer Equipo ({userPlayers.length} jugadores)</h3>
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
                          <tr key={player.id} className={clsx('hover:bg-slate-800/40 transition-colors', isStarter && 'bg-cyan-950/20')}>
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
                                    <span key={idx} className="inline-block bg-purple-950 text-purple-300 border border-purple-800 text-[10px] px-1.5 py-0.5 rounded mr-1">
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
                              <span className={clsx('text-[10px] font-bold', player.morale >= 80 ? 'text-emerald-400' : 'text-yellow-400')}>
                                {player.morale}%
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                              {player.seasonMatches} / <span className="text-emerald-400 font-bold">{player.seasonGoals}</span> / {player.seasonAssists}
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
        )}

        {/* PESTAÑA: TÁCTICA & PIZARRA */}
        {activeTab === 'tactics' && (
          <div className="space-y-6">
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

            {/* Pizarra 2D y Banquillo de Sustitución */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <Pitch2D
                  club={userClub}
                  allPlayersMap={allPlayersMap}
                  selectedPlayerId={tacticsSelectedPlayer?.id}
                  onPlayerClick={(p) => setTacticsSelectedPlayer(p)}
                />
                <p className="text-xs text-slate-400 text-center">
                  💡 Haz clic en cualquier jugador en la pizarra para ver sus detalles o cambiarlo por un suplente.
                </p>
              </div>

              {/* Panel Lateral: Suplentes y Roles */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>Banquillo de Suplentes</span>
                  <span className="text-xs text-slate-400">{userClub.substitutes.length} jugadores</span>
                </h4>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {userClub.substitutes.map((id) => {
                    const p = allPlayersMap[id];
                    if (!p) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.position} · Media {p.overall} · Fit {p.fitness}%
                          </div>
                        </div>

                        {tacticsSelectedPlayer && (
                          <button
                            type="button"
                            onClick={() => {
                              swapStartingPlayer(tacticsSelectedPlayer.id, id);
                              setTacticsSelectedPlayer(null);
                            }}
                            className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-[10px] transition-all"
                          >
                            Meter por {tacticsSelectedPlayer.name.split(' ').pop()}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Asignación de Capitán */}
                {tacticsSelectedPlayer && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Asignar roles a {tacticsSelectedPlayer.name}:
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('captain', tacticsSelectedPlayer.id)}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded text-xs font-bold"
                      >
                        Hacer Capitán
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('penalty', tacticsSelectedPlayer.id)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded text-xs font-bold"
                      >
                        Tirador Penaltis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: PARTIDO EN VIVO */}
        {activeTab === 'live_match' && (
          <div>
            {liveMatch ? (
              <LiveMatchView />
            ) : (
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <Play className="w-12 h-12 text-cyan-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">No hay ningún partido en curso</h3>
                <p className="text-xs text-slate-400">
                  Dirígete a la pestaña Despacho para iniciar la simulación de la Jornada {currentRound}.
                </p>
                <button
                  type="button"
                  onClick={startMatchDay}
                  className="px-6 py-2.5 bg-cyan-500 text-black font-bold rounded-xl"
                >
                  Iniciar Jornada {currentRound}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: CLASIFICACIÓN & CALENDARIO */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Clasificación Neo Egoist League</h3>
                <p className="text-xs text-slate-400">Temporada {currentSeason} · 12 Clubes</p>
              </div>
              {isSeasonCompleted && (
                <button
                  type="button"
                  onClick={proceedToNextSeason}
                  className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs rounded-xl shadow-lg animate-pulse"
                >
                  🏆 Avanzar a Temporada {currentSeason + 1}
                </button>
              )}
            </div>

            {/* TABLA DE POSICIONES */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10">Pos</th>
                    <th className="p-3">Club</th>
                    <th className="p-3 text-center">PJ</th>
                    <th className="p-3 text-center">PG</th>
                    <th className="p-3 text-center">PE</th>
                    <th className="p-3 text-center">PP</th>
                    <th className="p-3 text-center">GF</th>
                    <th className="p-3 text-center">GC</th>
                    <th className="p-3 text-center">DG</th>
                    <th className="p-3 text-center font-bold">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {leagueTable.map((row, idx) => {
                    const isUser = row.clubId === userClubId;
                    const isChampion = idx === 0;
                    const isTopThree = idx < 3;
                    return (
                      <tr key={row.clubId} className={clsx('hover:bg-slate-800/40 transition-colors', isUser && 'bg-cyan-950/30')}>
                        <td className="p-3">
                          <span
                            className={clsx(
                              'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                              isChampion ? 'bg-yellow-500 text-black' : isTopThree ? 'bg-cyan-900 text-cyan-200' : 'text-slate-400'
                            )}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-sans font-bold text-sm text-white flex items-center gap-2">
                          <span className={clsx(isUser && 'text-cyan-400')}>{row.clubName}</span>
                          {isUser && <span className="text-[10px] text-cyan-400 font-mono">(Tú)</span>}
                        </td>
                        <td className="p-3 text-center text-slate-300">{row.played}</td>
                        <td className="p-3 text-center text-emerald-400">{row.won}</td>
                        <td className="p-3 text-center text-slate-400">{row.drawn}</td>
                        <td className="p-3 text-center text-rose-400">{row.lost}</td>
                        <td className="p-3 text-center text-slate-300">{row.goalsFor}</td>
                        <td className="p-3 text-center text-slate-400">{row.goalsAgainst}</td>
                        <td className="p-3 text-center font-bold text-slate-200">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="p-3 text-center font-black text-sm text-yellow-400">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TABLA DE MÁXIMOS GOLEADORES (PICHICHI) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-cyan-400" />
                Tabla de Máximos Goleadores (Pichichi)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...players]
                  .sort((a, b) => b.seasonGoals - a.seasonGoals)
                  .slice(0, 6)
                  .map((p, idx) => {
                    const c = clubs.find((club) => club.id === p.clubId);
                    return (
                      <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-500">{idx + 1}</span>
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{c?.name || 'Club'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-cyan-400">{p.seasonGoals}</span>
                          <span className="text-[10px] text-slate-500 block">goles</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: MERCADO DE FICHAJES */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Mercado de Fichajes y Traspasos</h3>
                <p className="text-xs text-slate-400">
                  Ventana de Fichajes: {currentRound <= 4 || (currentRound >= 11 && currentRound <= 14) ? (
                    <span className="text-emerald-400 font-bold uppercase">ABIERTA</span>
                  ) : (
                    <span className="text-rose-400 font-bold uppercase">CERRADA (Abre J1-4 y J11-14)</span>
                  )}
                </p>
              </div>

              {/* Filtros de Búsqueda */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    placeholder="Buscar jugador..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <select
                  value={marketPosFilter}
                  onChange={(e) => setMarketPosFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ALL">Todas las Posiciones</option>
                  <option value="DC">Delanteros (DC)</option>
                  <option value="EI">Extremos (EI/ED)</option>
                  <option value="MC">Centrocampistas (MC/MCO)</option>
                  <option value="DFC">Defensas (DFC/LI/LD)</option>
                  <option value="POR">Porteros (POR)</option>
                </select>
              </div>
            </div>

            {marketFeedback && (
              <div
                className={clsx(
                  'p-4 rounded-xl text-xs font-bold border',
                  marketFeedback.success ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' : 'bg-rose-950/60 border-rose-500 text-rose-200'
                )}
              >
                {marketFeedback.msg}
              </div>
            )}

            {/* TABLA DE JUGADORES EN EL MERCADO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Pos</th>
                      <th className="p-3">Jugador</th>
                      <th className="p-3">Club Actual</th>
                      <th className="p-3">Edad</th>
                      <th className="p-3">Media</th>
                      <th className="p-3">Valor de Mercado</th>
                      <th className="p-3">Salario</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {players
                      .filter((p) => {
                        if (marketPosFilter !== 'ALL' && p.position !== marketPosFilter) return false;
                        if (marketSearch && !p.name.toLowerCase().includes(marketSearch.toLowerCase())) return false;
                        return true;
                      })
                      .slice(0, 30)
                      .map((p) => {
                        const club = clubs.find((c) => c.id === p.clubId);
                        const isMyPlayer = p.clubId === userClubId;
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-cyan-300">
                                {p.position}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-white text-sm">{p.name}</td>
                            <td className="p-3 text-slate-400">{club?.name || 'Agente Libre'}</td>
                            <td className="p-3 text-slate-300">{p.age} años</td>
                            <td className="p-3 font-bold text-cyan-400 text-sm">{p.overall}</td>
                            <td className="p-3 font-mono text-emerald-400 font-bold">{fmtYen(p.marketValueYen)}</td>
                            <td className="p-3 font-mono text-slate-400">{fmtYen(p.weeklyWageYen)}/sem</td>
                            <td className="p-3 text-right">
                              {!isMyPlayer ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMarketPlayer(p);
                                    setOfferFee(p.marketValueYen);
                                    setOfferWage(Math.round(p.weeklyWageYen * 1.15));
                                    setMarketFeedback(null);
                                  }}
                                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg shadow transition-all"
                                >
                                  Pujar / Ofertar
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-bold">En tu plantilla</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL DE PUJA Y FICHAJE */}
            {selectedMarketPlayer && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Negociar Fichaje: {selectedMarketPlayer.name}</h3>
                    <button type="button" onClick={() => setSelectedMarketPlayer(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                      <div>
                        <span className="text-slate-400 block">Posición / Media:</span>
                        <span className="text-white font-bold">{selectedMarketPlayer.position} · OVR {selectedMarketPlayer.overall}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Valor estimado:</span>
                        <span className="text-emerald-400 font-mono font-bold">{fmtYen(selectedMarketPlayer.marketValueYen)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Oferta de Traspaso al Club (¥):</label>
                      <input
                        type="number"
                        step="1000000"
                        value={offerFee}
                        onChange={(e) => setOfferFee(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Salario Semanal Ofrecido (¥):</label>
                      <input
                        type="number"
                        step="100000"
                        value={offerWage}
                        onChange={(e) => setOfferWage(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Años de Contrato:</label>
                      <select
                        value={offerYears}
                        onChange={(e) => setOfferYears(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                      >
                        <option value={2}>2 Temporadas</option>
                        <option value={3}>3 Temporadas</option>
                        <option value={4}>4 Temporadas</option>
                        <option value={5}>5 Temporadas</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMarketPlayer(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = makeBuyOffer(selectedMarketPlayer.id, offerFee, offerWage, offerYears);
                        setMarketFeedback({ success: res.success, msg: res.message });
                        if (res.success) {
                          setSelectedMarketPlayer(null);
                        }
                      }}
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs shadow-lg"
                    >
                      Enviar Oferta Formal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: ENTRENAMIENTO & CANTERA */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">Centro de Entrenamiento y Academia Wild Card</h3>
              <p className="text-xs text-slate-400">
                Configura el plan semanal para todo el plantel y promueve talentos jóvenes de Japón.
              </p>
            </div>

            {/* SELECCIÓN DE PLANES SEMANALES */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { id: 'equilibrado', title: 'Equilibrado', desc: 'Progreso homogéneo · Recuperación +25% física' },
                { id: 'fisico', title: 'Físico Extremo', desc: 'Aumento de ritmo y resistencia · Recuperación +15% · Riesgo de lesión' },
                { id: 'ofensivo', title: 'Ataque y Definición', desc: 'Mejora de disparo y técnica · Recuperación +25%' },
                { id: 'defensivo', title: 'Pared Táctica', desc: 'Mejora de colocación y defensa · Recuperación +25%' },
                { id: 'descanso', title: 'Descanso Total', desc: 'Máxima recuperación de fatiga (+35%) · Moral +4%' },
              ].map((plan) => {
                const isCurrent = trainingPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={clsx(
                      'p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3',
                      isCurrent ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30' : 'bg-slate-900 border-slate-800'
                    )}
                  >
                    <div>
                      <span className={clsx('text-[10px] font-bold uppercase tracking-wider', isCurrent ? 'text-cyan-400' : 'text-slate-500')}>
                        {isCurrent ? 'PLAN ACTIVO' : 'DISPONIBLE'}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{plan.title}</h4>
                      <p className="text-xs text-slate-400 mt-2">{plan.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTrainingPlan(plan.id as any)}
                      disabled={isCurrent}
                      className={clsx(
                        'w-full py-2 rounded-xl text-xs font-bold transition-all',
                        isCurrent
                          ? 'bg-cyan-500 text-black cursor-default font-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      )}
                    >
                      {isCurrent ? 'Seleccionado' : 'Elegir Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* MÓDULO CANTERA & WILD CARD */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/60 border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase">
                    <UserPlus className="w-4 h-4" /> Scouting de Cantera · Proyecto Wild Card
                  </div>
                  <h4 className="text-2xl font-black text-white mt-1">Promocionar Joven Promesa</h4>
                  <p className="text-xs text-slate-300 max-w-xl mt-1">
                    Incorpora a un talento de 16 años con gran potencial al primer equipo. Coste de formación y ficha
                    médica: 60.000.000 ¥ (1 promoción permitida por temporada).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = promoteYouthPlayer();
                    setCanteraFeedback({ success: res.success, msg: res.message });
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  Promocionar Canterano (60 M¥)
                </button>
              </div>

              {canteraFeedback && (
                <div
                  className={clsx(
                    'p-3 rounded-xl text-xs font-bold border mt-3',
                    canteraFeedback.success ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' : 'bg-rose-950/60 border-rose-500 text-rose-200'
                  )}
                >
                  {canteraFeedback.msg}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: FINANZAS */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">Economía y Finanzas del Club</h3>
              <p className="text-xs text-slate-400">Balance contable, ingresos por taquilla, patrocinios y nóminas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Saldo en Caja</span>
                <span className="font-mono font-black text-2xl text-emerald-400 mt-1 block">{fmtYen(userClub.cashYen)}</span>
                <span className="text-[10px] text-slate-500">Liquidez total disponible</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Presupuesto Fichajes</span>
                <span className="font-mono font-black text-2xl text-cyan-400 mt-1 block">{fmtYen(userClub.budgetYen)}</span>
                <span className="text-[10px] text-slate-500">Límite para traspasos</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gasto Semanal en Salarios</span>
                <span className="font-mono font-black text-2xl text-rose-400 mt-1 block">
                  {fmtYen(userPlayers.reduce((acc, p) => acc + p.weeklyWageYen, 0))}
                </span>
                <span className="text-[10px] text-slate-500">Límite: {fmtYen(userClub.weeklyWageCapYen)}/sem</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estadio y Taquilla</span>
                <span className="font-mono font-black text-2xl text-white mt-1 block">
                  {userClub.stadiumCapacity.toLocaleString()} cap.
                </span>
                <span className="text-[10px] text-slate-500">{userClub.ticketPriceYen.toLocaleString()} ¥/entrada</span>
              </div>
            </div>

            {/* LIBRO DIARIO DE CONTABILIDAD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h4 className="font-bold text-white text-sm">Libro de Entradas y Salidas</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Fecha / Jornada</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {ledger.slice(0, 25).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400 font-sans">{entry.dateStr}</td>
                        <td className="p-3 font-bold text-white font-sans">{entry.concept}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300 uppercase">
                            {entry.type}
                          </span>
                        </td>
                        <td
                          className={clsx(
                            'p-3 text-right font-black',
                            entry.amountYen >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          )}
                        >
                          {entry.amountYen >= 0 ? `+${fmtYen(entry.amountYen)}` : `-${fmtYen(Math.abs(entry.amountYen))}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
