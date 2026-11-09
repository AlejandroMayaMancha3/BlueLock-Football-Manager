'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  UserPlus,
  Dumbbell,
  Target,
  ArrowRightLeft,
  Search,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { formatMoney } from '@/lib/currency';
import { Player, Position, IndividualTrainingFocus } from '@/types/football-manager';
import {
  TRAINING_FOCUS_CATALOG,
  ALL_POSITIONS,
  getPositionName,
  getPositionCategory,
  calculateConversionWeeks,
} from '@/engine/training-engine';

export const TrainingView: React.FC = () => {
  const {
    trainingPlan,
    selectedCurrency,
    players,
    userClubId,
    setTrainingPlan,
    promoteYouthPlayer,
    setPlayerTrainingFocus,
    startPositionConversion,
    cancelPositionConversion,
  } = useGameStore();

  const [canteraFeedback, setCanteraFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [conversionFeedback, setConversionFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'POR' | 'DEF' | 'MED' | 'DEL'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);

  // Filtrar exclusivamente futbolistas del club del usuario
  const clubPlayers = players.filter((p) => p.clubId === userClubId);
  const activeConversionsCount = clubPlayers.filter((p) => p.positionConversion).length;

  const filteredPlayers = clubPlayers.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || getPositionCategory(p.position) === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div>
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-cyan-400" />
          <span>Centro de Entrenamiento y Academia Wild Card</span>
        </h3>
        <p className="text-xs text-slate-400">
          Configura el plan semanal del equipo, los planes de desarrollo individual y las reconversiones de posición de tus futbolistas (estilo FIFA / EA FC).
        </p>
      </div>

      {/* FEEDBACK DE ACCIONES DE ENTRENAMIENTO */}
      {conversionFeedback && (
        <div
          className={clsx(
            'p-3.5 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 animate-fadeIn shadow-lg',
            conversionFeedback.success
              ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/70 text-rose-200'
          )}
        >
          <div className="flex items-center gap-2">
            {conversionFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{conversionFeedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setConversionFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECCIÓN 1: PLANES SEMANALES COLECTIVOS */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>Plan de Carga Semanal del Plantel</span>
          <span className="text-[10px] text-cyan-400 font-normal">(Afecta a la recuperación física y moral)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                    ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
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
                  <h5 className="font-bold text-white text-sm mt-1">{plan.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-1.5">{plan.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setTrainingPlan(plan.id as any)}
                  disabled={isCurrent}
                  className={clsx(
                    'w-full py-1.5 rounded-xl text-xs font-bold transition-all',
                    isCurrent
                      ? 'bg-cyan-500 text-black cursor-default font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  )}
                >
                  {isCurrent ? '✓ Activo' : 'Elegir Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: PLANES DE DESARROLLO PERSONAL Y CAMBIO DE POSICIÓN (FUTBOLISTAS DEL CLUB) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        {/* Cabecera y Controles de Filtro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h4 className="font-black text-white text-base">
                Planes de Desarrollo Individual y Cambio de Posición
              </h4>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                {activeConversionsCount} en reconversión
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personaliza el enfoque de entrenamiento de cada futbolista de tu plantilla o reconviértelo a una nueva demarcación (el tiempo es dinámico según distancia táctica, edad y atributos).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar futbolista..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
              />
            </div>

            {/* Categorías */}
            <div className="flex bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-xs font-bold">
              {[
                { id: 'all', label: `Todos (${clubPlayers.length})` },
                { id: 'DEL', label: 'DEL' },
                { id: 'MED', label: 'MED' },
                { id: 'DEF', label: 'DEF' },
                { id: 'POR', label: 'POR' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all',
                    selectedCategory === cat.id ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LISTADO DE FUTBOLISTAS */}
        <div className="space-y-3">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No se han encontrado futbolistas en tu plantilla con los filtros seleccionados.
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const conversion = player.positionConversion;
              const isConverting = !!conversion;
              const currentFocus = player.trainingFocus || 'balanced';
              const focusDetail =
                TRAINING_FOCUS_CATALOG.find((f) => f.id === currentFocus) || TRAINING_FOCUS_CATALOG[0];

              const progressPercent = isConverting
                ? Math.min(100, Math.round((conversion.weeksElapsed / Math.max(1, conversion.totalWeeks)) * 100))
                : 0;

              const remainingWeeks = isConverting
                ? Math.max(0, conversion.totalWeeks - conversion.weeksElapsed)
                : 0;

              return (
                <div
                  key={player.id}
                  className={clsx(
                    'p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4',
                    isConverting
                      ? 'bg-gradient-to-r from-cyan-950/30 via-slate-950 to-slate-950 border-cyan-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  )}
                >
                  {/* Info Básica del Jugador */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0 shadow">
                      <span className="font-mono font-black text-white text-base leading-none">
                        {player.overall}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 mt-0.5">
                        POT {player.potential}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                          {player.position}
                        </span>
                        {player.secondaryPosition && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[9px]"
                            title="Posición secundaria"
                          >
                            2ª: {player.secondaryPosition}
                          </span>
                        )}
                        <span className="font-bold text-white text-sm">{player.name}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{player.age} años</span>
                        <span>·</span>
                        <span className="text-slate-300">
                          {player.weapons?.length ? `⚡ ${player.weapons[0].name}` : 'Sin arma activa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ENFOQUE DE ENTRENAMIENTO PERSONAL */}
                  <div className="flex-1 max-w-xs">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Plan de Desarrollo Individual:
                    </label>
                    <select
                      value={currentFocus}
                      onChange={(e) => {
                        setPlayerTrainingFocus(player.id, e.target.value as IndividualTrainingFocus);
                        setConversionFeedback({
                          success: true,
                          msg: `Plan de desarrollo actualizado para ${player.name}: ahora entrena en modo [${TRAINING_FOCUS_CATALOG.find((f) => f.id === e.target.value)?.name}].`,
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      {TRAINING_FOCUS_CATALOG.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.icon} {f.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 truncate" title={focusDetail.shortDesc}>
                      {focusDetail.shortDesc}
                    </p>
                  </div>

                  {/* ESTADO DE CONVERSIÓN DE POSICIÓN */}
                  <div className="flex-1 lg:max-w-md">
                    {isConverting ? (
                      <div className="space-y-1.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-cyan-300 flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            <span>
                              Reconvirtiendo: {player.position} → {conversion.targetPosition}
                            </span>
                          </span>
                          <span className="text-white font-mono text-[11px]">
                            {progressPercent}%
                          </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>
                              Jornada {conversion.weeksElapsed} de {conversion.totalWeeks} ({remainingWeeks === 1 ? '1 jornada restante' : `${remainingWeeks} jornadas restantes`})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              cancelPositionConversion(player.id);
                              setConversionFeedback({
                                success: false,
                                msg: `Se ha cancelado la reconversión de posición de ${player.name}.`,
                              });
                            }}
                            className="text-rose-400 hover:text-rose-300 font-bold transition-colors"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between lg:justify-end gap-3">
                        <span className="text-xs text-slate-500 italic hidden sm:inline">
                          Sin reconversión activa
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalPlayer(player)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-cyan-500 hover:text-black text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Cambiar Posición...</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL VENTANA EMERGENTE PARA ELEGIR NUEVA POSICIÓN */}
      {modalPlayer && (
        <div
          onClick={() => setModalPlayer(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-cyan-500/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col"
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-sm">
                  {modalPlayer.overall}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Plan de Reconversión de Posición · {modalPlayer.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Posición Actual: <b className="text-cyan-300 font-bold">{modalPlayer.position}</b> ({getPositionName(modalPlayer.position)}) · {modalPlayer.age} años
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPlayer(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aviso informativo de dinamismo estilo FIFA */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              💡 <b>Sistema Dinámico Estilo FIFA:</b> El tiempo de reconversión depende de la distancia táctica, la edad del futbolista ({modalPlayer.age} años) y sus atributos actuales. Posiciones afines o bandas simétricas tardan muy poco; cruces opuestos o arquero tardan un tiempo considerable.
            </div>

            {/* Selector de Posiciones Candidatas */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {ALL_POSITIONS.filter((pos) => pos !== modalPlayer.position).map((targetPos) => {
                const calculation = calculateConversionWeeks(modalPlayer, targetPos);
                const isSecondary = modalPlayer.secondaryPosition === targetPos;

                return (
                  <div
                    key={targetPos}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/60 rounded-xl flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-black text-cyan-300">
                        {targetPos}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{getPositionName(targetPos)}</span>
                          {isSecondary && (
                            <span className="bg-emerald-950/80 text-emerald-300 text-[9px] px-1 font-bold rounded border border-emerald-500/40">
                              Ya es 2ª posición
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] flex items-center gap-2 mt-0.5">
                          <span className="text-slate-400">Dificultad:</span>
                          <span className={clsx('font-bold', calculation.difficultyColor)}>
                            {calculation.difficultyLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-white text-xs block">
                          ⏱ {calculation.weeks} {calculation.weeks === 1 ? 'jornada' : 'jornadas'}
                        </span>
                        <span className="text-[9px] text-slate-500">Tiempo estimado</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          startPositionConversion(modalPlayer.id, targetPos);
                          setConversionFeedback({
                            success: true,
                            msg: `¡Plan de reconversión iniciado! ${modalPlayer.name} comenzará su entrenamiento para pasar de ${modalPlayer.position} a ${targetPos} (duración estimada: ${calculation.weeks} jornadas).`,
                          });
                          setModalPlayer(null);
                        }}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl shadow transition-all"
                      >
                        Iniciar Plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pie del Modal */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setModalPlayer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: MÓDULO CANTERA & WILD CARD (Totalmente intacto según requerimiento) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/60 border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase">
              <UserPlus className="w-4 h-4" /> Scouting de Cantera · Proyecto Wild Card
            </div>
            <h4 className="text-2xl font-black text-white mt-1">Promocionar Joven Promesa</h4>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Incorpora a un talento de 16 años con gran potencial al primer equipo. Coste de formación y ficha médica:
              {' '}{formatMoney(60000000, selectedCurrency)} (1 promoción permitida por temporada).
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
            Promocionar Canterano ({formatMoney(60000000, selectedCurrency)})
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
