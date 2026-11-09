'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { Player } from '@/types/football-manager';
import { PlayerDetailModal } from './PlayerDetailModal';
import {
  formatMoney,
  convertFromYen,
  convertToYen,
  formatWithSpaces,
  parseNumberFromSpaces,
  CURRENCIES,
} from '@/lib/currency';

export const MarketView: React.FC = () => {
  const { currentRound, userClubId, clubs, players, selectedCurrency, makeBuyOffer } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId);
  const currencyCfg = CURRENCIES[selectedCurrency] || CURRENCIES.EUR;

  const [marketSearch, setMarketSearch] = useState('');
  const [marketPosFilter, setMarketPosFilter] = useState('ALL');
  const [selectedMarketPlayer, setSelectedMarketPlayer] = useState<Player | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [offerFee, setOfferFee] = useState<number>(0);
  const [offerWage, setOfferWage] = useState<number>(0);
  const [offerYears, setOfferYears] = useState<number>(3);
  const [marketFeedback, setMarketFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const isWindowOpen = currentRound <= 4 || (currentRound >= 11 && currentRound <= 14);

  const getPotentialTier = (pot: number) => {
    if (pot >= 95) return { label: 'Mundial', color: 'text-amber-300 bg-amber-950/40 border-amber-500/50', icon: '🌟' };
    if (pot >= 90) return { label: 'Élite', color: 'text-purple-300 bg-purple-950/40 border-purple-500/50', icon: '💎' };
    if (pot >= 85) return { label: 'Promesa', color: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/50', icon: '⚡' };
    if (pot >= 80) return { label: 'Desarrollo', color: 'text-blue-300 bg-blue-950/40 border-blue-500/50', icon: '📈' };
    return { label: 'Consolidado', color: 'text-slate-400 bg-slate-900 border-slate-700', icon: '🛡️' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white">Mercado de Fichajes y Traspasos</h3>
          <p className="text-xs text-slate-400">
            Ventana de Fichajes:{' '}
            {isWindowOpen ? (
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
            <option value="MC">Centrocampistas (MC/MCO/MCD/MI/MD)</option>
            <option value="DFC">Defensas (DFC/LI/LD/CAI/CAD)</option>
            <option value="POR">Porteros (POR)</option>
          </select>
        </div>
      </div>

      {marketFeedback && (
        <div
          className={clsx(
            'p-4 rounded-xl text-xs font-bold border',
            marketFeedback.success
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500 text-rose-200'
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
                <th className="p-3 text-center">Potencial</th>
                <th className="p-3">Valor de Mercado</th>
                <th className="p-3">Salario</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {players
                .filter((p) => {
                  if (marketPosFilter !== 'ALL') {
                    if (marketPosFilter === 'EI') {
                      if (p.position !== 'EI' && p.position !== 'ED') return false;
                    } else if (marketPosFilter === 'MC') {
                      if (!['MC', 'MCO', 'MCD', 'MI', 'MD'].includes(p.position)) return false;
                    } else if (marketPosFilter === 'DFC') {
                      if (!['DFC', 'LI', 'LD', 'CAI', 'CAD'].includes(p.position)) return false;
                    } else if (p.position !== marketPosFilter) {
                      return false;
                    }
                  }
                  if (marketSearch && !p.name.toLowerCase().includes(marketSearch.toLowerCase())) return false;
                  return true;
                })
                .slice(0, 35)
                .map((p) => {
                  const club = clubs.find((c) => c.id === p.clubId);
                  const isMyPlayer = p.clubId === userClubId;
                  const tier = getPotentialTier(p.potential);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-cyan-300">
                          {p.position}
                        </span>
                      </td>
                      <td className="p-3">
                        <div>
                          <button
                            type="button"
                            onClick={() => setInspectingPlayer(p)}
                            className="font-bold text-white text-sm hover:text-cyan-400 cursor-pointer text-left transition-colors hover:underline"
                            title={`Abrir expediente de ${p.name}`}
                          >
                            {p.name}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400">{p.nationality}</div>
                      </td>
                      <td className="p-3 text-slate-400">{club?.name || 'Agente Libre'}</td>
                      <td className="p-3 text-slate-300">{p.age} años</td>
                      <td className="p-3 font-bold text-white text-sm">{p.overall}</td>
                      <td className="p-3 text-center">
                        <span className={clsx('px-2 py-0.5 rounded border text-xs font-black inline-flex items-center gap-1', tier.color)}>
                          <span>{tier.icon}</span>
                          <span>{p.potential}</span>
                        </span>
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">
                        {formatMoney(p.marketValueYen, selectedCurrency)}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {formatMoney(p.weeklyWageYen, selectedCurrency)}/sem
                      </td>
                      <td className="p-3 text-right">
                        {!isMyPlayer ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMarketPlayer(p);
                              const initialFee = convertFromYen(p.marketValueYen, selectedCurrency);
                              const initialWage = convertFromYen(Math.round(p.weeklyWageYen * 1.15), selectedCurrency);
                              setOfferFee(initialFee);
                              setOfferWage(initialWage);
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
              <button
                type="button"
                onClick={() => setSelectedMarketPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block">Posición / Media:</span>
                  <span className="text-white font-bold">
                    {selectedMarketPlayer.position} · OVR {selectedMarketPlayer.overall}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block">Potencial Máx:</span>
                  <span className="text-cyan-400 font-black">
                    {selectedMarketPlayer.potential}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Valor estimado:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatMoney(selectedMarketPlayer.marketValueYen, selectedCurrency)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 block font-bold text-xs">
                    Oferta de Traspaso al Club (en {currencyCfg.name}):
                  </label>
                  {userClub && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Presupuesto: <strong className="text-cyan-400">{formatMoney(userClub.budgetYen, selectedCurrency)}</strong>
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-cyan-400 font-bold font-mono text-sm pointer-events-none select-none">
                    {currencyCfg.symbol}
                  </span>
                  <input
                    type="text"
                    value={formatWithSpaces(offerFee)}
                    onChange={(e) => {
                      const num = parseNumberFromSpaces(e.target.value);
                      setOfferFee(num);
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-sm tracking-widest transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 block font-bold text-xs">
                    Salario Semanal Ofrecido (en {currencyCfg.name}/semana):
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Actual: <strong className="text-yellow-400">{formatMoney(selectedMarketPlayer.weeklyWageYen, selectedCurrency)}/sem</strong>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-yellow-400 font-bold font-mono text-sm pointer-events-none select-none">
                    {currencyCfg.symbol}
                  </span>
                  <input
                    type="text"
                    value={formatWithSpaces(offerWage)}
                    onChange={(e) => {
                      const num = parseNumberFromSpaces(e.target.value);
                      setOfferWage(num);
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-sm tracking-widest transition-all"
                  />
                </div>
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
                  const feeYen = convertToYen(offerFee, selectedCurrency);
                  const wageYen = convertToYen(offerWage, selectedCurrency);
                  const res = makeBuyOffer(selectedMarketPlayer.id, feeYen, wageYen, offerYears);
                  setMarketFeedback({ success: res.success, msg: res.message });
                  if (res.success) setSelectedMarketPlayer(null);
                }}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs shadow-lg"
              >
                Enviar Oferta Formal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPEDIENTE DEL JUGADOR AL CLICAR SU NOMBRE */}
      {inspectingPlayer && (
        <PlayerDetailModal
          player={inspectingPlayer}
          onClose={() => setInspectingPlayer(null)}
        />
      )}
    </div>
  );
};
