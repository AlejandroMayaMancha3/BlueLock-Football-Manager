'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { UserPlus } from 'lucide-react';
import clsx from 'clsx';

export const TrainingView: React.FC = () => {
  const { trainingPlan, setTrainingPlan, promoteYouthPlayer } = useGameStore();
  const [canteraFeedback, setCanteraFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  return (
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
                isCurrent
                  ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900 border-slate-800'
              )}
            >
              <div>
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider',
                    isCurrent ? 'text-cyan-400' : 'text-slate-500'
                  )}
                >
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
              Incorpora a un talento de 16 años con gran potencial al primer equipo. Coste de formación y ficha médica:
              60.000.000 ¥ (1 promoción permitida por temporada).
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
              canteraFeedback.success
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500 text-rose-200'
            )}
          >
            {canteraFeedback.msg}
          </div>
        )}
      </div>
    </div>
  );
};
