'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import { Calendar, Play, Sparkles, ArrowRight, Shield, FastForward } from 'lucide-react';
import clsx from 'clsx';
import { LeagueTableRow } from '@/types/football-manager';
import { formatTextWithCurrency } from '@/lib/currency';

interface OfficeViewProps {
  leagueTable: LeagueTableRow[];
}

export const OfficeView: React.FC<OfficeViewProps> = ({ leagueTable }) => {
  const {
    currentSeason,
    currentRound,
    userClubId,
    clubs,
    boardTrust,
    squadMorale,
    trainingPlan,
    activeDecisionEvent,
    selectedCurrency,
    fixtures,
    startMatchDay,
    simulateFullMatchDay,
    answerDecisionEvent,
    proceedToNextSeason,
    setActiveTab,
  } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const nextUserFixture = fixtures.find(
    (f) => f.round === currentRound && (f.homeClubId === userClubId || f.awayClubId === userClubId)
  );
  const rivalClub = nextUserFixture
    ? clubs.find(
        (c) =>
          c.id ===
          (nextUserFixture.homeClubId === userClubId
            ? nextUserFixture.awayClubId
            : nextUserFixture.homeClubId)
      )
    : null;

  return (
    <div className="space-y-6">
      {/* 1. DILEMA NARRATIVO ACTIVO */}
      {activeDecisionEvent && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Dilema de Vestuario / Consecuencias
          </div>
          <h3 className="text-xl font-black text-white">{formatTextWithCurrency(activeDecisionEvent.title, selectedCurrency)}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{formatTextWithCurrency(activeDecisionEvent.narrative, selectedCurrency)}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {activeDecisionEvent.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => answerDecisionEvent(idx)}
                className="p-4 rounded-xl bg-slate-950/80 border border-purple-800/40 hover:border-purple-400 text-left transition-all hover:scale-[1.02] space-y-1"
              >
                <div className="font-bold text-white text-sm">{formatTextWithCurrency(opt.label, selectedCurrency)}</div>
                <div className="text-xs text-slate-400">{formatTextWithCurrency(opt.description, selectedCurrency)}</div>
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
                <p className="text-xs text-slate-400">
                  Nivel de Fuerza: {userClub.level} · Moral {squadMorale}%
                </p>
              </div>
            </div>

            {/* VS y Acción de Partido */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-500 font-mono">VS</span>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={startMatchDay}
                  className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs md:text-sm rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 animate-pulse"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Disputar en Vivo (2D)
                </button>
                <button
                  type="button"
                  onClick={simulateFullMatchDay}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-400 text-slate-200 font-bold text-xs md:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                  title="Simular instantáneamente los 90 minutos con sustituciones tácticas, minutos de juego y evolución de potencial y media"
                >
                  <FastForward className="w-4 h-4 text-yellow-400" />
                  Simular Partido Completo
                </button>
              </div>
            </div>

            {/* Rival */}
            <div className="flex items-center gap-4 text-right">
              <div>
                <h4 className="text-2xl font-black text-white">{rivalClub.name}</h4>
                <p className="text-xs text-slate-400">
                  Nivel de Fuerza: {rivalClub.level} · {rivalClub.country}
                </p>
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
            La directiva exige terminar entre los puestos de honor. Mantén la confianza por encima del 20% para no ser
            destituido.
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
  );
};
