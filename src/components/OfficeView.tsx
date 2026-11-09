'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  Calendar,
  Play,
  Sparkles,
  ArrowRight,
  Shield,
  FastForward,
  FileText,
  DollarSign,
  Check,
  X,
  UserCheck,
  Tag,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { LeagueTableRow, Player } from '@/types/football-manager';
import { formatMoney, formatTextWithCurrency } from '@/lib/currency';
import { PlayerDetailModal } from './PlayerDetailModal';
import { getDivisionById } from '@/engine/data/divisions-catalog';

interface OfficeViewProps {
  leagueTable: LeagueTableRow[];
}

export const OfficeView: React.FC<OfficeViewProps> = ({ leagueTable }) => {
  const {
    currentSeason,
    currentRound,
    userClubId,
    clubs,
    players,
    boardTrust,
    squadMorale,
    trainingPlan,
    activeDecisionEvent,
    selectedCurrency,
    fixtures,
    selectedDivisionId,
    lastMatchSummary,
    lastSeasonTransitionReport,
    clearSeasonTransitionReport,
    transferOffers,
    acceptSellOffer,
    rejectSellOffer,
    openLastMatchSummary,
    startMatchDay,
    simulateFullMatchDay,
    answerDecisionEvent,
    proceedToNextSeason,
    setActiveTab,
  } = useGameStore();

  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const activeDivisionId = userClub?.divisionId || userClub?.league || selectedDivisionId || 'es_laliga';
  const divisionInfo = getDivisionById(activeDivisionId);
  const divisionName = divisionInfo?.name || 'Liga';
  const totalRounds = fixtures.length > 0 ? Math.max(...fixtures.map((f) => f.round)) : 46;

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

  // Ofertas de compra recibidas por jugadores del usuario que están pendientes
  const receivedOffers = transferOffers.filter(
    (o) => o.sellerClubId === userClubId && o.status === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* 0. REPORTE OFICIAL DE CIERRE DE TEMPORADA, ASCENSOS Y DESCENSOS */}
      {lastSeasonTransitionReport && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-cyan-500/60 rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">
                  Boletín Oficial · Fin de Temporada {lastSeasonTransitionReport.seasonNumber}
                </span>
                <h3 className="text-xl font-black text-white">
                  Balance Oficial de Ascensos y Descensos
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={clearSeasonTransitionReport}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Comenzar Temporada {currentSeason} →
            </button>
          </div>

          {/* Veredicto del Club del Usuario */}
          <div
            className={clsx(
              'p-4 rounded-2xl border flex items-center justify-between gap-4',
              lastSeasonTransitionReport.userOutcome === 'champion' && 'bg-yellow-950/40 border-yellow-500/60 text-yellow-200',
              lastSeasonTransitionReport.userOutcome === 'promoted' && 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200',
              lastSeasonTransitionReport.userOutcome === 'relegated' && 'bg-rose-950/40 border-rose-500/60 text-rose-200',
              lastSeasonTransitionReport.userOutcome === 'stayed' && 'bg-slate-950 border-slate-800 text-slate-300'
            )}
          >
            <div className="flex items-center gap-3">
              {lastSeasonTransitionReport.userOutcome === 'champion' && <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />}
              {lastSeasonTransitionReport.userOutcome === 'promoted' && <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />}
              {lastSeasonTransitionReport.userOutcome === 'relegated' && <TrendingDown className="w-6 h-6 text-rose-400 shrink-0" />}
              {lastSeasonTransitionReport.userOutcome === 'stayed' && <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0" />}
              <div>
                <div className="font-black text-sm">
                  {lastSeasonTransitionReport.userOutcome === 'champion' && '¡CAMPEÓN DE LIGA! Tu club conquista el título.'}
                  {lastSeasonTransitionReport.userOutcome === 'promoted' && `¡ASCENSO LOGRADO! Tu club asciende a ${lastSeasonTransitionReport.userNewDivisionName}.`}
                  {lastSeasonTransitionReport.userOutcome === 'relegated' && `DESCENSO CONFIRMADO: Tu club competirá en ${lastSeasonTransitionReport.userNewDivisionName}.`}
                  {lastSeasonTransitionReport.userOutcome === 'stayed' && `PERMANENCIA ASEGURADA: Puesto ${lastSeasonTransitionReport.userPosition}.º en ${lastSeasonTransitionReport.userNewDivisionName}.`}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  Premio económico ingresado: +{formatMoney(lastSeasonTransitionReport.prizeMoneyYen, selectedCurrency)}.
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-black/40 border border-white/10 shrink-0">
              {lastSeasonTransitionReport.userPosition}.º puesto
            </span>
          </div>

          {/* Campeones de las 4 Categorías */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              🏆 Campeones de las 4 Divisiones
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {lastSeasonTransitionReport.champions.map((champ) => (
                <div key={champ.divisionName} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
                  <div className="text-[10px] text-yellow-400 font-bold uppercase truncate">{champ.divisionName}</div>
                  <div className="font-black text-white text-sm truncate mt-0.5">{champ.clubName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Listado de Ascensos y Descensos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Ascensos */}
            <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Movimientos de Ascenso ({lastSeasonTransitionReport.promotions.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {lastSeasonTransitionReport.promotions.map((p) => (
                  <div key={p.clubId} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{p.clubName}</span>
                      {p.type === 'promotion_playoff' && (
                        <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-500/40 px-1 py-0.2 rounded font-bold">
                          Playoff
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {p.fromDivisionName} → {p.toDivisionName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Descensos */}
            <div className="p-4 bg-slate-950/80 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <TrendingDown className="w-4 h-4" /> Movimientos de Descenso ({lastSeasonTransitionReport.relegations.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {lastSeasonTransitionReport.relegations.map((r) => (
                  <div key={r.clubId} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <span className="font-bold text-white">{r.clubName}</span>
                    <span className="text-[11px] text-rose-400 font-mono">
                      {r.fromDivisionName} → {r.toDivisionName}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                * Recordatorio: En las 4.ª divisiones no hay descensos, solo ascensos hacia la 3.ª división.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* 1. NOTIFICACIONES DE OFERTAS DE COMPRA RECIBIDAS (TEMPORALES HASTA ACEPTAR O RECHAZAR) */}
      {receivedOffers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-4 h-4" /> Ofertas de Compra Recibidas en Despacho ({receivedOffers.length})
            </div>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full inline-block">
              Mercado Activo · Temporal
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Clubes rivales han presentado ofertas oficiales de compra por jugadores de tu plantilla.
            Al aceptar una venta, el jugador se incorporará al club comprador, liberarás una plaza de las 25 reglamentarias y el 80% del importe se sumará a tu presupuesto de fichajes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {receivedOffers.map((offer) => {
              const player = players.find((p) => p.id === offer.playerId);
              const buyer = clubs.find((c) => c.id === offer.buyerClubId);

              return (
                <div
                  key={offer.id}
                  className="p-4 bg-slate-950/90 border border-amber-500/40 hover:border-amber-400/80 rounded-xl flex flex-col justify-between gap-3 shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {buyer && (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow border border-white/20 shrink-0"
                          style={{ backgroundColor: buyer.primaryColor, color: buyer.secondaryColor }}
                        >
                          {buyer.shortName}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => player && setInspectingPlayer(player)}
                            className="text-white font-black text-sm hover:text-cyan-400 underline-offset-2 hover:underline transition-colors text-left"
                            title="Ver expediente del jugador"
                          >
                            {offer.playerName}
                          </button>
                          {player && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                              {player.position} · OVR {player.overall}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Interés formal de <span className="text-slate-200 font-semibold">{offer.buyerClubName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Oferta</div>
                      <div className="text-base font-black font-mono text-emerald-400">
                        {formatMoney(offer.offeredFeeYen, selectedCurrency)}
                      </div>
                      {player && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Val: {formatMoney(player.marketValueYen, selectedCurrency)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    {player && (
                      <button
                        type="button"
                        onClick={() => setInspectingPlayer(player)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Ver Expediente
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => acceptSellOffer(offer.id)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg shadow transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aceptar Venta
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectSellOffer(offer.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold text-xs rounded-lg border border-slate-700 transition-all"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DILEMA NARRATIVO ACTIVO */}
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

      {/* 3. TARJETA DEL PRÓXIMO ENCUENTRO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> Próximo Partido · Jornada {currentRound} de {totalRounds}
          </h3>
          <span className="text-xs text-cyan-400 font-bold font-mono">{divisionName}</span>
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

              {lastMatchSummary && (
                <button
                  type="button"
                  onClick={openLastMatchSummary}
                  className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                  title="Volver a abrir el informe y resumen completo del último partido disputado o simulado"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Ver Acta de la Jornada {lastMatchSummary.round}
                </button>
              )}
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

      {/* 4. RESUMEN DE LA DIRECTIVA Y PLAN SEMANAL */}
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
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumen de Clasificación · {divisionName}</h4>
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

      {/* MODAL EXPEDIENTE SI SE PULSA DESDE OFERTAS EN DESPACHO */}
      {inspectingPlayer && (
        <PlayerDetailModal
          player={inspectingPlayer}
          onClose={() => setInspectingPlayer(null)}
        />
      )}
    </div>
  );
};
