'use client';

import React, { useState } from 'react';
import { useCareerStore } from '@/store/career-store';
import {
  Trophy,
  Zap,
  Flame,
  Eye,
  Coins,
  Users,
  Target,
  Activity,
  Shield,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  Search,
  UserPlus,
  Play,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';

export default function CareerModePage() {
  const {
    currentWeek,
    userClubId,
    clubs,
    players,
    youthProspects,
    contractBids,
    lastSimulation,
    lastEgoCritique,
    isSimulating,
    setUserClub,
    runMatchSimulation,
    scoutProspect,
    signProspect,
    resetCareer,
  } = useCareerStore();

  const [activeTab, setActiveTab] = useState<
    'match' | 'squad' | 'ego' | 'auction' | 'wildcard'
  >('match');
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('22222222-2222-2222-2222-222222222222'); // Paris X Gen default
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.club_id === userClubId);
  const opponents = clubs.filter((c) => c.id !== userClubId);

  const handleSimulate = async () => {
    try {
      setSimulationError(null);
      await runMatchSimulation(selectedOpponentId);
    } catch (err: any) {
      setSimulationError(err?.message || 'Error simulando el partido');
    }
  };

  const formatYen = (amount: number) => {
    if (amount >= 100000000) {
      return `¥${(amount / 100000000).toFixed(1)}B`;
    }
    return `¥${(amount / 1000000).toFixed(0)}M`;
  };

  const getWeaponBadgeColor = (type: string) => {
    switch (type) {
      case 'vision':
        return 'border-bl-cyan text-bl-cyan bg-cyan-950/30';
      case 'shooting':
      case 'finishing':
        return 'border-bl-crimson text-bl-crimson bg-rose-950/30';
      case 'speed':
      case 'acceleration':
        return 'border-bl-gold text-bl-gold bg-amber-950/30';
      case 'flow':
        return 'border-purple-400 text-purple-400 bg-purple-950/30';
      default:
        return 'border-bl-blue text-bl-blue bg-blue-950/30';
    }
  };

  return (
    <main className="min-h-screen bg-bl-dark text-slate-100 pb-16">
      {/* Top Bar / Global Header */}
      <header className="border-b border-bl-card-border bg-bl-dark/95 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-bl-blue via-bl-cyan to-indigo-700 flex items-center justify-center font-black text-black tracking-tighter text-xl shadow-lg shadow-blue-500/20">
              BL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-wider uppercase text-white">
                  Blue Lock: Egoist Career Mode
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-bl-blue/20 text-bl-cyan px-2 py-0.5 rounded border border-bl-cyan/30">
                  NEL Era
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Football Manager Engine × Ego Jinpachi Tactical Architecture
              </p>
            </div>
          </div>

          {/* Club & Career Meta Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-bl-card px-3 py-1.5 rounded-md border border-bl-card-border">
              <span className="text-slate-400">Club Activo:</span>
              <select
                value={userClubId}
                onChange={(e) => setUserClub(e.target.value)}
                className="bg-transparent font-bold text-bl-cyan outline-none cursor-pointer"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id} className="bg-bl-card text-white">
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-bl-card px-3 py-1.5 rounded-md border border-bl-card-border">
              <span className="text-slate-400">Jornada:</span>
              <span className="font-bold text-white">Semana {currentWeek}</span>
            </div>

            <div className="flex items-center gap-2 bg-bl-card px-3 py-1.5 rounded-md border border-bl-card-border">
              <Coins className="h-3.5 w-3.5 text-bl-gold" />
              <span className="text-slate-400">Presupuesto:</span>
              <span className="font-extrabold text-bl-gold">
                {formatYen(userClub.budget_yen)}
              </span>
            </div>

            <button
              onClick={resetCareer}
              title="Reiniciar Modo Carrera"
              className="p-1.5 rounded-md bg-bl-card border border-bl-card-border text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        {/* Navigation Tabs */}
        <nav className="flex space-x-2 border-b border-bl-card-border pb-3 overflow-x-auto">
          {[
            { id: 'match', label: 'Jornada NEL (Simulador)', icon: Trophy },
            { id: 'squad', label: 'Plantilla & Armas', icon: Users },
            { id: 'ego', label: 'Auditoría Jinpachi Ego', icon: Cpu },
            { id: 'auction', label: 'Subastas NEL (¥)', icon: Coins },
            { id: 'wildcard', label: 'Cantera & Wild Card', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-bl-blue text-white shadow-lg shadow-blue-600/30'
                    : 'bg-bl-card text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-bl-card-border'
                )}
              >
                <Icon className={clsx('h-4 w-4', isActive ? 'text-bl-cyan' : 'text-slate-400')} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* TAB 1: MATCH DAY & DETERMINISTIC SIMULATOR                                */}
        {/* ========================================================================= */}
        {activeTab === 'match' && (
          <div className="mt-6 space-y-6">
            {/* Match Setup Hero */}
            <div className="bg-bl-card rounded-xl border border-bl-card-border p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-bl-blue/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Home Club */}
                <div className="flex-1 text-center md:text-left">
                  <span className="text-xs font-bold text-bl-cyan tracking-widest uppercase">
                    Equipo Local
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">{userClub.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 italic">
                    {userClub.tactical_style}
                  </p>
                  <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      Reputación: {userClub.reputation}/100
                    </span>
                    <span className="text-[11px] bg-blue-950 text-bl-cyan px-2 py-0.5 rounded border border-blue-800">
                      {userPlayers.length} Egoístas
                    </span>
                  </div>
                </div>

                {/* Match Center / Action */}
                <div className="flex flex-col items-center">
                  <div className="text-xs uppercase font-extrabold text-slate-500 tracking-widest mb-2">
                    Neo Egoist League · Jornada {currentWeek}
                  </div>
                  <div className="flex items-center gap-4 text-3xl font-black text-slate-300">
                    <span>{lastSimulation ? lastSimulation.homeScore : '-'}</span>
                    <span className="text-bl-cyan text-lg font-light">VS</span>
                    <span>{lastSimulation ? lastSimulation.awayScore : '-'}</span>
                  </div>

                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className={clsx(
                      'mt-4 flex items-center gap-2 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-wider text-black transition-all shadow-xl',
                      isSimulating
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-bl-cyan via-blue-400 to-bl-neon hover:scale-105 active:scale-95 shadow-cyan-500/25'
                    )}
                  >
                    <Play className="h-4 w-4 fill-black" />
                    {isSimulating ? 'Simulando Duelos...' : 'Simular Partido (Turn-Engine)'}
                  </button>
                </div>

                {/* Away Club */}
                <div className="flex-1 text-center md:text-right">
                  <span className="text-xs font-bold text-bl-crimson tracking-widest uppercase">
                    Rival NEL
                  </span>
                  <div className="mt-1">
                    <select
                      value={selectedOpponentId}
                      onChange={(e) => setSelectedOpponentId(e.target.value)}
                      className="bg-bl-dark border border-bl-card-border text-white font-black text-xl rounded px-3 py-1 outline-none text-right cursor-pointer"
                    >
                      {opponents.map((opp) => (
                        <option key={opp.id} value={opp.id} className="bg-bl-card text-white">
                          {opp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(() => {
                    const opp = clubs.find((c) => c.id === selectedOpponentId);
                    return (
                      <>
                        <p className="text-xs text-slate-400 mt-1 italic">
                          {opp?.tactical_style}
                        </p>
                        <div className="flex items-center gap-2 mt-2 justify-center md:justify-end">
                          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            Reputación: {opp?.reputation}/100
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Error banner if any */}
            {simulationError && (
              <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs">
                {simulationError}
              </div>
            )}

            {/* Simulation Highlights Timeline & Stats */}
            {lastSimulation && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Event Highlights Timeline */}
                <div className="lg:col-span-2 bg-bl-card rounded-xl border border-bl-card-border p-5">
                  <div className="flex items-center justify-between border-b border-bl-card-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-bl-cyan" />
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                        Crónica de Duelos y Reacciones Químicas
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      {lastSimulation.events.length} Eventos Clave
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                    {lastSimulation.events.map((evt, idx) => {
                      const isGoal = evt.type === 'goal';
                      const isChem = evt.type === 'chemical_reaction';
                      const isFlow = evt.type === 'flow_trigger';
                      const isSave = evt.type === 'save';

                      return (
                        <div
                          key={idx}
                          className={clsx(
                            'p-3 rounded-lg border text-xs transition-all',
                            isGoal
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                              : isChem
                              ? 'bg-blue-950/40 border-bl-cyan/60 text-cyan-200'
                              : isFlow
                              ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                              : isSave
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                              : 'bg-bl-dark/60 border-bl-card-border text-slate-300'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-[11px] text-bl-cyan">
                              {evt.minute}&apos;
                            </span>
                            <span
                              className={clsx(
                                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                                isGoal
                                  ? 'bg-emerald-500 text-black'
                                  : isChem
                                  ? 'bg-bl-cyan text-black'
                                  : isFlow
                                  ? 'bg-purple-500 text-white'
                                  : isSave
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-slate-800 text-slate-300'
                              )}
                            >
                              {evt.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="leading-relaxed">{evt.description}</p>
                          {evt.weapon_used && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-bl-gold">
                              <Target className="h-3 w-3" />
                              <span>Arma Ejecutada: {evt.weapon_used}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Match Summary Panel */}
                <div className="space-y-6">
                  {/* Man of the Match Card */}
                  <div className="bg-bl-card rounded-xl border border-bl-card-border p-5">
                    <div className="flex items-center gap-2 text-bl-gold text-xs font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="h-4 w-4" />
                      Jugador del Partido (MVP)
                    </div>

                    <div className="bg-bl-dark/80 rounded-lg p-4 border border-bl-card-border">
                      <h5 className="font-black text-lg text-white">
                        {lastSimulation.summary.manOfTheMatch.name}
                      </h5>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-400">
                          Valoración:{' '}
                          <span className="font-bold text-bl-cyan">
                            {lastSimulation.summary.manOfTheMatch.rating.toFixed(1)}
                          </span>
                        </span>
                        <span className="text-slate-400">
                          Goles:{' '}
                          <span className="font-bold text-emerald-400">
                            {lastSimulation.summary.manOfTheMatch.goals}
                          </span>
                        </span>
                        <span className="text-slate-400">
                          Asistencias:{' '}
                          <span className="font-bold text-bl-gold">
                            {lastSimulation.summary.manOfTheMatch.assists}
                          </span>
                        </span>
                      </div>

                      {lastSimulation.summary.manOfTheMatch.flowActivated && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 font-bold bg-purple-950/40 p-2 rounded border border-purple-800">
                          <Flame className="h-3.5 w-3.5" />
                          <span>¡Despertó el Estado Flow en este encuentro!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generated Bids in Yen */}
                  <div className="bg-bl-card rounded-xl border border-bl-card-border p-5">
                    <div className="flex items-center gap-2 text-bl-cyan text-xs font-bold uppercase tracking-wider mb-3">
                      <Coins className="h-4 w-4 text-bl-gold" />
                      Pujas Generadas tras el Partido
                    </div>

                    <div className="space-y-2.5">
                      {lastSimulation.summary.bidsGenerated.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Ningún ojeador europeo presentó ofertas estelares en este turno.
                        </p>
                      ) : (
                        lastSimulation.summary.bidsGenerated.slice(0, 4).map((bid, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-bl-dark/60 rounded border border-bl-card-border text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-white">{bid.playerName}</div>
                              <div className="text-[11px] text-slate-400">
                                {bid.biddingClub} · {bid.reason}
                              </div>
                            </div>
                            <div className="font-black text-bl-gold">
                              {formatYen(bid.offerYen)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SQUAD & WEAPON ARSENAL                                             */}
        {/* ========================================================================= */}
        {activeTab === 'squad' && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase text-white">
                  Arsenal de Egoístas ({userClub.name})
                </h3>
                <p className="text-xs text-slate-400">
                  Modelado de Armamento: Metavisión, Direct Shot, Predator Eye, Kaiser Impact y Flow
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {userPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-bl-card rounded-xl border border-bl-card-border p-5 relative overflow-hidden transition-all hover:border-bl-blue/50"
                >
                  {/* Flow State Aura Banner */}
                  {player.flow_state && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-transparent text-[10px] font-black uppercase tracking-wider text-white px-4 py-1">
                      Flow Active
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-bl-blue/20 text-bl-cyan border border-bl-cyan/30">
                          {player.position}
                        </span>
                        <h4 className="font-black text-base text-white">{player.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {player.age} años · Potencial: {player.potential}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-bl-cyan">{player.overall}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        OVR
                      </div>
                    </div>
                  </div>

                  {/* Ego Meter */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Flame className="h-3 w-3 text-bl-crimson" />
                        Medidor de Ego
                      </span>
                      <span className="font-mono font-bold text-white">
                        {player.ego_rating}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={clsx(
                          'h-full transition-all duration-500',
                          player.ego_rating >= 90
                            ? 'bg-gradient-to-r from-bl-crimson to-purple-500'
                            : 'bg-gradient-to-r from-bl-blue to-bl-cyan'
                        )}
                        style={{ width: `${player.ego_rating}%` }}
                      />
                    </div>
                  </div>

                  {/* Weapons Section */}
                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Armas Especiales
                    </span>
                    <div className="space-y-1.5">
                      {player.weapons.map((w, i) => (
                        <div
                          key={i}
                          className={clsx(
                            'p-2 rounded border text-xs flex items-center justify-between',
                            getWeaponBadgeColor(w.type)
                          )}
                        >
                          <div>
                            <span className="font-bold">{w.name}</span>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {w.description}
                            </p>
                          </div>
                          <span className="font-mono font-black text-xs">{w.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Market Value in Yen */}
                  <div className="mt-4 pt-3 border-t border-bl-card-border flex items-center justify-between text-xs">
                    <span className="text-slate-400">Valoración Subasta:</span>
                    <span className="font-black text-bl-gold">
                      {formatYen(player.market_value_yen)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: JINPACHI EGO TACTICAL AUDIT                                        */}
        {/* ========================================================================= */}
        {activeTab === 'ego' && (
          <div className="mt-6 space-y-6">
            <div className="bg-bl-card rounded-xl border border-bl-card-border p-6 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Ego Avatar / Monitor Aesthetic */}
                <div className="w-full lg:w-72 shrink-0 bg-bl-dark rounded-xl border border-cyan-500/30 p-5 flex flex-col items-center text-center glow-cyan">
                  <div className="h-28 w-28 rounded-full border-2 border-bl-cyan/60 bg-gradient-to-b from-slate-800 to-black flex items-center justify-center relative mb-4">
                    <Eye className="h-12 w-12 text-bl-cyan animate-pulse" />
                    <div className="absolute inset-0 rounded-full border border-bl-cyan/20 animate-ping pointer-events-none" />
                  </div>

                  <h4 className="font-black text-lg text-white">Ego Jinpachi</h4>
                  <span className="text-[11px] font-bold text-bl-cyan tracking-widest uppercase mt-0.5">
                    Director Blue Lock Project
                  </span>

                  <div className="mt-4 w-full pt-3 border-t border-slate-800 text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estado Conexión:</span>
                      <span className="text-bl-neon font-bold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> En Vivo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Modo Narrativo:</span>
                      <span className="text-slate-200 font-mono text-[11px]">
                        {lastEgoCritique?.isAiGenerated ? 'Groq Cloud' : 'Procedural (Offline)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Critique Terminal Content */}
                <div className="flex-1 space-y-4">
                  {lastEgoCritique ? (
                    <>
                      <div className="flex items-center justify-between border-b border-bl-card-border pb-3">
                        <div>
                          <span className="text-xs uppercase font-extrabold text-bl-cyan tracking-wider">
                            Evaluación Oficial
                          </span>
                          <h3 className="text-xl font-black text-white mt-0.5">
                            {lastEgoCritique.title}
                          </h3>
                        </div>

                        <span className="text-xs font-bold uppercase tracking-widest bg-bl-crimson/20 text-bl-crimson border border-bl-crimson/40 px-3 py-1 rounded">
                          {lastEgoCritique.evaluatedPlayerRatingTitle}
                        </span>
                      </div>

                      <div className="p-4 bg-bl-dark/90 rounded-lg border border-bl-card-border font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                        {lastEgoCritique.critique}
                      </div>

                      <div className="p-4 bg-gradient-to-r from-bl-blue/10 via-bl-cyan/10 to-transparent border-l-4 border-bl-cyan rounded-r-lg">
                        <span className="text-xs font-bold text-bl-cyan uppercase tracking-wider block mb-1">
                          Directiva Táctica de Jinpachi
                        </span>
                        <p className="text-sm font-semibold text-white italic">
                          {lastEgoCritique.egoAdvice}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <Cpu className="h-3 w-3" />
                        <span>Motor: {lastEgoCritique.modelUsed}</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      <Eye className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-300">
                        Ningún partido simulado en la jornada actual
                      </p>
                      <p className="text-xs mt-1">
                        Ve a la pestaña &quot;Jornada NEL&quot; y simula un encuentro para recibir la
                        auditoría táctica de Jinpachi Ego.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NEL AUCTION & BIDS BOARD                                           */}
        {/* ========================================================================= */}
        {activeTab === 'auction' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white">
                  Ranking de Pujas Neo Egoist League (NEL)
                </h3>
                <p className="text-xs text-slate-400">
                  Ofertas anuales en Yenes (¥) presentadas por los grandes clubes de Europa tras cada jornada
                </p>
              </div>
            </div>

            {/* Auction Bids Table */}
            <div className="bg-bl-card rounded-xl border border-bl-card-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bl-dark border-b border-bl-card-border text-slate-400 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-4">Club Propietario</th>
                      <th className="py-3.5 px-4">Arma Primaria</th>
                      <th className="py-3.5 px-4">Oferta Anual (¥)</th>
                      <th className="py-3.5 px-4">Elegible Japón Sub-20</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bl-card-border">
                    {[...players]
                      .sort((a, b) => b.market_value_yen - a.market_value_yen)
                      .map((p, idx) => {
                        const club = clubs.find((c) => c.id === p.club_id);
                        const primaryWeapon = p.weapons[0]?.name || 'N/A';

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-black text-slate-400">
                              #{idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-white text-sm">{p.name}</span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                ({p.position})
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {club ? club.name : 'Agente Libre / World 11'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-bl-cyan">
                              {primaryWeapon}
                            </td>
                            <td className="py-3 px-4 font-black text-bl-gold text-sm">
                              {formatYen(p.market_value_yen)}
                            </td>
                            <td className="py-3 px-4">
                              {p.is_national_eligible ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" /> Convocable
                                </span>
                              ) : (
                                <span className="text-slate-500">Extranjero</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CANTERA JAPONESA & WILD CARD FACILITY                              */}
        {/* ========================================================================= */}
        {activeTab === 'wildcard' && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-black uppercase text-white">
                Scouting Escolar y Proyecto Wild Card
              </h3>
              <p className="text-xs text-slate-400">
                Recluta jóvenes promesas de institutos de Japón o activa el experimento secreto de Kunigami
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {youthProspects.map((prospect) => {
                const isWildCard = prospect.status === 'wild_card';
                return (
                  <div
                    key={prospect.id}
                    className={clsx(
                      'rounded-xl border p-5 relative overflow-hidden transition-all',
                      isWildCard
                        ? 'bg-gradient-to-br from-rose-950/40 via-bl-card to-bl-card border-bl-crimson glow-crimson'
                        : 'bg-bl-card border-bl-card-border'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {isWildCard && (
                            <span className="bg-bl-crimson text-black font-black text-[10px] uppercase px-2 py-0.5 rounded">
                              Wild Card
                            </span>
                          )}
                          <h4 className="font-black text-base text-white">
                            {prospect.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {prospect.high_school} · {prospect.age} años
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-bl-cyan">
                          Pot. {prospect.potential}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          Estimación
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 bg-bl-dark/80 rounded border border-bl-card-border text-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Arma Detectada por Ojeadores
                      </span>
                      <span className="font-bold text-bl-gold">
                        {prospect.scouted_weapon}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-bl-card-border">
                      <div className="text-xs">
                        <span className="text-slate-400">Coste de Operación: </span>
                        <span className="font-bold text-white">
                          {formatYen(prospect.scouting_cost_yen)}
                        </span>
                      </div>

                      {prospect.status === 'signed' ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> En el Primer Equipo
                        </span>
                      ) : (
                        <button
                          onClick={() => signProspect(prospect.id)}
                          className={clsx(
                            'px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all',
                            isWildCard
                              ? 'bg-bl-crimson text-white hover:bg-rose-600'
                              : 'bg-bl-blue text-white hover:bg-blue-600'
                          )}
                        >
                          Incorporar al Club
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
