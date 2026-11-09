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
} from 'lucide-react';
import clsx from 'clsx';
import { computeLeagueTable } from '@/engine/season-engine';
import { Currency } from '@/types/football-manager';
import { formatMoney } from '@/lib/currency';

// Componentes modulares
import { OfficeView } from '@/components/OfficeView';
import { SquadView } from '@/components/SquadView';
import { TacticsView } from '@/components/TacticsView';
import { LiveMatchView } from '@/components/LiveMatchView';
import { TableView } from '@/components/TableView';
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
  const [selectedClubId, setSelectedClubId] = useState('club-bm');
  const [startCurrency, setStartCurrency] = useState<Currency>('EUR');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const leagueTable = clubs.length > 0 && fixtures.length > 0 ? computeLeagueTable(clubs, fixtures) : [];

  // 1. PANTALLA INICIAL
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 selection:bg-cyan-500 selection:text-black">
        <div className="max-w-4xl w-full space-y-8 my-auto">
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

            {/* SELECCIÓN DE DIVISA ECONÓMICA */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                Divisa Monetaria del Modo Carrera:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { code: 'EUR', label: 'Euros (€)', desc: '1€ = ¥160 (Recomendado)', symbol: '€' },
                  { code: 'USD', label: 'Dólares ($)', desc: '$1 = ¥150 (Internacional)', symbol: '$' },
                  { code: 'JPY', label: 'Yenes (¥)', desc: '¥1 (Anime / NEL Original)', symbol: '¥' },
                  { code: 'GBP', label: 'Libras (£)', desc: '£1 = ¥190 (Estilo Inglés)', symbol: '£' },
                ].map((cur) => {
                  const isSel = startCurrency === cur.code;
                  return (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => setStartCurrency(cur.code as Currency)}
                      className={clsx(
                        'p-3 rounded-xl border text-left transition-all',
                        isSel
                          ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-500/50 shadow-md'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xl text-white">{cur.symbol}</span>
                        <span className="text-[10px] uppercase font-bold text-cyan-400">{cur.code}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">{cur.label}</div>
                      <div className="text-[10px] text-slate-400">{cur.desc}</div>
                    </button>
                  );
                })}
              </div>
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
                        <div className="text-[10px] text-cyan-400 font-mono font-bold">
                          Presupuesto: {formatMoney(club.budget, startCurrency)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <button
                type="button"
                onClick={() => startNewGame(selectedCoachName, selectedClubId, startCurrency)}
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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Caja Disponible</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {formatMoney(userClub.cashYen, selectedCurrency)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Presupuesto Fichajes</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">
              {formatMoney(userClub.budgetYen, selectedCurrency)}
            </span>
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

          {/* SELECTOR RÁPIDO DE DIVISA */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'office' && <OfficeView leagueTable={leagueTable} />}
        {activeTab === 'squad' && <SquadView />}
        {activeTab === 'tactics' && <TacticsView />}
        {activeTab === 'live_match' && (liveMatch ? <LiveMatchView /> : <OfficeView leagueTable={leagueTable} />)}
        {activeTab === 'table' && <TableView leagueTable={leagueTable} />}
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
