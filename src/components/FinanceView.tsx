'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import clsx from 'clsx';

export const FinanceView: React.FC = () => {
  const { userClubId, clubs, players, ledger } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.clubId === userClubId);

  const fmtYen = (yen: number) => {
    if (yen >= 100000000) return `${(yen / 100000000).toFixed(1)} M¥`;
    if (yen >= 10000) return `${(yen / 10000).toFixed(0)} k¥`;
    return `${yen.toLocaleString('es-ES')} ¥`;
  };

  return (
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
  );
};
