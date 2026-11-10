'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import clsx from 'clsx';
import { formatMoney } from '@/lib/currency';
import { TIER_FINANCIAL_BASES } from '@/engine/finance-engine';
import { EUR_TO_YEN } from '@/engine/player-valuation';
import { TierLevel } from '@/types/football-manager';
import {
  TrendingUp,
  TrendingDown,
  Tv,
  Building2,
  Sparkles,
  AlertCircle,
  Coins,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { userClubId, clubs, players, ledger, selectedCurrency, reconcileUserTreasury } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.clubId === userClubId);
  const totalWeeklyWageYen = userPlayers.reduce((acc, p) => acc + p.weeklyWageYen, 0);

  const tier = (userClub.tier || 1) as TierLevel;
  const cfg = TIER_FINANCIAL_BASES[tier] || TIER_FINANCIAL_BASES[1];
  const repFactor = Math.min(1.35, Math.max(0.75, (userClub.reputation || 70) / 75));

  // Cálculos de proyección semanal
  const estHomeAttendance = Math.round(userClub.stadiumCapacity * 0.82);
  const estHomeTicketYen = estHomeAttendance * userClub.ticketPriceYen;
  const estAwayTicketYen = Math.round(cfg.awayMatchStipendEur * repFactor * EUR_TO_YEN);

  const tvPerRoundYen = Math.round(cfg.baseTvPerRoundEur * repFactor * EUR_TO_YEN);
  const sponsorPerRoundYen = Math.round(cfg.baseSponsorPerRoundEur * repFactor * EUR_TO_YEN);

  const homeOperatingYen = Math.round(cfg.baseOperatingCostsEur * EUR_TO_YEN);
  const awayOperatingYen = Math.round((cfg.baseOperatingCostsEur + cfg.baseOperatingCostsEur * 0.5) * EUR_TO_YEN);

  // Totales estimados
  const homeNetWeeklyYen = estHomeTicketYen + tvPerRoundYen + sponsorPerRoundYen - (totalWeeklyWageYen + homeOperatingYen);
  const awayNetWeeklyYen = estAwayTicketYen + tvPerRoundYen + sponsorPerRoundYen - (totalWeeklyWageYen + awayOperatingYen);

  const hasTreasuryImbalance = userClub.cashYen < 0 || userClub.budgetYen > Math.max(0, userClub.cashYen);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Economía y Finanzas del Club
          </h3>
          <p className="text-xs text-slate-400">
            Control de tesorería, presupuesto de fichajes, derechos de TV, patrocinios comerciales y nóminas.
          </p>
        </div>
        {hasTreasuryImbalance && (
          <button
            type="button"
            onClick={reconcileUserTreasury}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg hover:from-emerald-500 hover:to-teal-400 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Saneamiento Directiva
          </button>
        )}
      </div>

      {/* BANNER INFORMATIVO SI EXISTIÓ O EXISTE DESFASE */}
      {userClub.cashYen < 0 && (
        <div className="p-4 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white text-sm">Alerta de Tesorería: Deuda Operativa en Caja</div>
            <p className="text-slate-300">
              El club presenta números rojos en su caja bancaria ({formatMoney(userClub.cashYen, selectedCurrency)}).
              La directiva ha bloqueado compras de jugadores hasta reequilibrar la tesorería. Pulsa en{' '}
              <strong className="text-emerald-400">"Saneamiento Directiva"</strong> para aplicar los fondos de reserva
              y liquidar de inmediato la deuda operativa.
            </p>
          </div>
        </div>
      )}

      {/* TARJETAS PRINCIPALES DE PATRIMONIO Y PRESUPUESTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SALDO EN CAJA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Saldo en Caja</span>
            <span
              className={clsx(
                'font-mono font-black text-2xl mt-1 block truncate',
                userClub.cashYen >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {formatMoney(userClub.cashYen, selectedCurrency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            {userClub.cashYen >= 0 ? 'Liquidez real en cuenta bancaria' : 'Déficit operativo acumulado'}
          </span>
        </div>

        {/* PRESUPUESTO FICHAJES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Presupuesto Fichajes</span>
            <span className="font-mono font-black text-2xl text-cyan-400 mt-1 block truncate">
              {formatMoney(userClub.budgetYen, selectedCurrency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Límite respaldado por liquidez disponible
          </span>
        </div>

        {/* GASTO SEMANAL EN SALARIOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gasto Semanal Salarios</span>
            <span className="font-mono font-black text-2xl text-rose-400 mt-1 block truncate">
              {formatMoney(totalWeeklyWageYen, selectedCurrency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Límite directiva: {formatMoney(userClub.weeklyWageCapYen, selectedCurrency)}/sem
          </span>
        </div>

        {/* ESTADIO Y TAQUILLA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estadio y Taquilla</span>
            <span className="font-mono font-black text-2xl text-white mt-1 block truncate">
              {userClub.stadiumCapacity.toLocaleString()} cap.
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            {formatMoney(userClub.ticketPriceYen, selectedCurrency)} / entrada oficial
          </span>
        </div>
      </div>

      {/* PROYECCIÓN Y BALANCE SEMANAL DETALLADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-black text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Estructura de Ingresos y Gastos Semanales (Por Jornada)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Los contratos televisivos y patrocinios comerciales garantizan el flujo de caja para cubrir las nóminas.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
            Categoría: Tier {tier}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          {/* COLUMNA 1: INGRESOS POR JORNADA */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Ingresos Operativos Semanales
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" /> Derechos de TV (Jornada):
                </span>
                <span className="font-mono font-bold text-white">{formatMoney(tvPerRoundYen, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-yellow-400" /> Patrocinio y Merchandising:
                </span>
                <span className="font-mono font-bold text-white">{formatMoney(sponsorPerRoundYen, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Taquilla estimada (Local):</span>
                <span className="font-mono font-bold text-emerald-300">+{formatMoney(estHomeTicketYen, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Taquilla / Subvención (Visitante):</span>
                <span className="font-mono">+{formatMoney(estAwayTicketYen, selectedCurrency)}</span>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: GASTOS POR JORNADA */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Gastos Operativos Semanales
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nóminas de la Plantilla:</span>
                <span className="font-mono font-bold text-rose-400">-{formatMoney(totalWeeklyWageYen, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mantenimiento de Estadio:</span>
                <span className="font-mono text-slate-300">-{formatMoney(homeOperatingYen, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Logística y Viaje (Visitante):</span>
                <span className="font-mono">-{formatMoney(awayOperatingYen, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400 font-bold">Total Gasto Base:</span>
                <span className="font-mono font-bold text-rose-300">
                  -{formatMoney(totalWeeklyWageYen + homeOperatingYen, selectedCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA 3: BALANCE NETO ESTIMADO */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Balance Neto por Partido
              </span>
              <div className="mt-3 space-y-2.5">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Jugando en Casa:</span>
                  <span
                    className={clsx(
                      'font-mono font-black',
                      homeNetWeeklyYen >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    )}
                  >
                    {homeNetWeeklyYen >= 0 ? '+' : ''}
                    {formatMoney(homeNetWeeklyYen, selectedCurrency)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Jugando Fuera:</span>
                  <span
                    className={clsx(
                      'font-mono font-black',
                      awayNetWeeklyYen >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    )}
                  >
                    {awayNetWeeklyYen >= 0 ? '+' : ''}
                    {formatMoney(awayNetWeeklyYen, selectedCurrency)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">
              Flujo operativo autosostenible mediante ingresos televisivos y comerciales de categoría.
            </p>
          </div>
        </div>
      </div>

      {/* LIBRO DIARIO DE CONTABILIDAD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm">Libro de Entradas y Salidas</h4>
          <span className="text-xs text-slate-500 font-mono">Últimos {Math.min(ledger.length, 30)} registros</span>
        </div>
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
              {ledger.slice(0, 30).map((entry) => {
                const badgeColor =
                  entry.type === 'tv'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : entry.type === 'patrocinio'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    : entry.type === 'taquilla'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : entry.type === 'premios'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                    : entry.type === 'salarios'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    : entry.type === 'rebalanceo'
                    ? 'bg-teal-950 text-teal-300 border border-teal-500/30'
                    : 'bg-slate-800 text-slate-300';

                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400 font-sans">{entry.dateStr}</td>
                    <td className="p-3 font-bold text-white font-sans">{entry.concept}</td>
                    <td className="p-3">
                      <span className={clsx('px-2 py-0.5 rounded font-bold text-[10px] uppercase', badgeColor)}>
                        {entry.type}
                      </span>
                    </td>
                    <td
                      className={clsx(
                        'p-3 text-right font-black',
                        entry.amountYen >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {entry.amountYen >= 0
                        ? `+${formatMoney(entry.amountYen, selectedCurrency)}`
                        : `-${formatMoney(Math.abs(entry.amountYen), selectedCurrency)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
