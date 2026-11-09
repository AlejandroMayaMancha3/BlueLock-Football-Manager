'use client';

import React, { useState } from 'react';
import {
  X,
  Star,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Sparkles,
  Tag,
  Check,
  Flame,
  Award,
  Activity,
  HeartPulse,
  Dumbbell,
  ArrowRightLeft,
  Clock,
  Target,
} from 'lucide-react';
import clsx from 'clsx';
import { useGameStore } from '@/store/game-store';
import { Player, Position, IndividualTrainingFocus } from '@/types/football-manager';
import { checkIsProdigy } from '@/engine/weapon-registry';
import {
  TRAINING_FOCUS_CATALOG,
  ALL_POSITIONS,
  getPositionName,
  calculateConversionWeeks,
} from '@/engine/training-engine';
import { formatMoney, formatWithSpaces, parseNumberFromSpaces, convertToYen } from '@/lib/currency';

interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player: initialPlayer, onClose }) => {
  const {
    clubs,
    userClubId,
    selectedCurrency,
    transferOffers,
    toggleTransferListed,
    acceptSellOffer,
    rejectSellOffer,
    renewPlayerContract,
    setPlayerTrainingFocus,
    startPositionConversion,
    cancelPositionConversion,
    players,
  } = useGameStore();

  // Obtener estado fresco del jugador de la store
  const player = players.find((p) => p.id === initialPlayer.id) || initialPlayer;
  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const playerClub = clubs.find((c) => c.id === player.clubId) || userClub;
  const isUserPlayer = player.clubId === userClubId;

  // Ofertas pendientes para este jugador
  const playerOffer = transferOffers.find((o) => o.playerId === player.id && o.status === 'pending');

  const [activeTab, setActiveTab] = useState<'profile' | 'season' | 'contract' | 'training'>('profile');
  const [trainingFeedback, setTrainingFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Estado del formulario de renovación
  const [renewalYears, setRenewalYears] = useState<number>(2);
  const minWageRequired = Math.round(player.weeklyWageYen * 1.15);
  const [renewalWage, setRenewalWage] = useState<number>(() => {
    // Inicializar en la divisa elegida con ceil para evitar desajustes de redondeo
    const rate = selectedCurrency === 'EUR' ? 160 : selectedCurrency === 'USD' ? 150 : selectedCurrency === 'GBP' ? 190 : 1;
    return Math.ceil(minWageRequired / rate);
  });
  const [renewalFeedback, setRenewalFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const getPositionColor = (pos: Position) => {
    switch (pos) {
      case 'DC':
      case 'EI':
      case 'ED':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'MCO':
      case 'MC':
      case 'MCD':
      case 'MI':
      case 'MD':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'DFC':
      case 'LI':
      case 'LD':
      case 'CAI':
      case 'CAD':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'POR':
        return 'bg-yellow-950 text-yellow-300 border-yellow-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getPotentialTier = (pot: number) => {
    if (pot >= 95) return { label: 'Mundial', color: 'text-amber-300 bg-amber-950/40 border-amber-500/50', icon: '🌟' };
    if (pot >= 90) return { label: 'Élite', color: 'text-purple-300 bg-purple-950/40 border-purple-500/50', icon: '💎' };
    if (pot >= 85) return { label: 'Promesa', color: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/50', icon: '⚡' };
    if (pot >= 80) return { label: 'Desarrollo', color: 'text-blue-300 bg-blue-950/40 border-blue-500/50', icon: '📈' };
    return { label: 'Consolidado', color: 'text-slate-400 bg-slate-900 border-slate-700', icon: '🛡️' };
  };

  const tier = getPotentialTier(player.potential);
  const isExpiring = isUserPlayer && player.contractYears <= 1;

  const handleRenew = () => {
    const wageInYen = convertToYen(renewalWage, selectedCurrency);
    const res = renewPlayerContract(player.id, wageInYen, renewalYears);
    setRenewalFeedback(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col h-[88vh] max-h-[840px] overflow-hidden">

        {/* HEADER SUPERIOR */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-mono text-[11px] font-bold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 fill-cyan-400" />
              Expediente Oficial de Jugador
            </span>
            {isExpiring && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-bold animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                ¡Contrato Expira esta Temporada!
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Cerrar expediente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HERO DEL JUGADOR */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Foto / Iniciales e Identidad */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-2 border-white/20 shrink-0 relative"
                style={{ backgroundColor: playerClub.primaryColor, color: playerClub.secondaryColor }}
              >
                {player.position}
                {player.flowState && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {player.name}
                  </h2>
                  <span className={clsx('px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border', getPositionColor(player.position))}>
                    {player.position}
                  </span>
                  {checkIsProdigy(player) && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/50 flex items-center gap-1 shadow-sm">
                      <span>🔮</span> PRODIGIO
                    </span>
                  )}
                  {player.secondaryPosition && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Sec: {player.secondaryPosition}
                    </span>
                  )}
                  {player.isBanned && (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50 font-bold text-[10px] flex items-center gap-1">
                      🟥 SANCIONADO
                    </span>
                  )}
                  {(player.injuryWeeks || 0) > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 font-bold text-[10px] flex items-center gap-1">
                      🏥 LESIONADO ({player.injuryWeeks} sem)
                    </span>
                  )}
                  {userClub.captainId === player.id && (
                    <span className="px-2 py-0.5 rounded bg-yellow-500 text-black font-black text-[10px]">
                      CAPITÁN
                    </span>
                  )}
                  {userClub.penaltyTakerId === player.id && (
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px]">
                      PENALTIS
                    </span>
                  )}
                  {userClub.freeKickTakerId === player.id && (
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">
                      FALTAS
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{player.age} años</span>
                  <span>·</span>
                  <span>{player.nationality}</span>
                  <span>·</span>
                  <span className="text-slate-300 font-semibold">{playerClub.name}</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas (Poner en venta / Transferibles) */}
            {isUserPlayer && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleTransferListed(player.id)}
                  className={clsx(
                    'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm',
                    player.isTransferListed
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700'
                  )}
                  title={player.isTransferListed ? 'Retirar jugador del mercado de transferencias' : 'Poner en venta para que los clubes hagan ofertas y liberar plaza'}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {player.isTransferListed ? 'En Lista de Transferibles' : 'Poner en Venta'}
                </button>
              </div>
            )}
          </div>

          {/* NOTIFICACIÓN DE OFERTA DE COMPRA PENDIENTE (SI LA HAY) */}
          {playerOffer && isUserPlayer && (
            <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Oferta Formal Recibida de {playerOffer.buyerClubName}
                  </h4>
                  <p className="text-sm font-black font-mono text-white">
                    {formatMoney(playerOffer.offeredFeeYen, selectedCurrency)}
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (Valor est.: {formatMoney(player.marketValueYen, selectedCurrency)})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    acceptSellOffer(playerOffer.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Aceptar Venta
                </button>
                <button
                  type="button"
                  onClick={() => rejectSellOffer(playerOffer.id)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                >
                  Rechazar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'profile', label: 'Ficha Técnica & Atributos', icon: Zap },
            { id: 'season', label: 'Rendimiento & Temporada', icon: Activity },
            ...(isUserPlayer
              ? [
                  {
                    id: 'training',
                    label: 'Desarrollo & Posición',
                    icon: Dumbbell,
                    badge: player.positionConversion
                      ? `🔄 ${player.positionConversion.targetPosition} (${Math.round(
                          (player.positionConversion.weeksElapsed /
                            Math.max(1, player.positionConversion.totalWeeks)) *
                            100
                        )}%)`
                      : undefined,
                    badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
                  },
                ]
              : []),
            {
              id: 'contract',
              label: 'Contrato & Renovación',
              icon: DollarSign,
              badge: isExpiring ? '⚠️ Expira' : `${player.contractYears} años`,
              badgeColor: isExpiring ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.2 rounded-full border',
                      isActive
                        ? 'bg-black/20 text-black border-black/30'
                        : tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 pb-8">

          {/* TAB 1: FICHA TÉCNICA & ATRIBUTOS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Tarjetas métricas clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Media Actual</span>
                  <span className="text-3xl font-black font-mono text-white mt-0.5 block">{player.overall}</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Potencial Máximo</span>
                  <div className="mt-0.5 flex items-center justify-center gap-1.5">
                    <span className="text-3xl font-black font-mono text-cyan-400">{player.potential}</span>
                  </div>
                  <span className={clsx('text-[9px] font-bold px-2 py-0.2 rounded border inline-block mt-1', tier.color)}>
                    {tier.icon} {tier.label}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor de Mercado</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-400 mt-2 block">
                    {formatMoney(player.marketValueYen, selectedCurrency)}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salario Semanal</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-200 mt-2 block">
                    {formatMoney(player.weeklyWageYen, selectedCurrency)}/sem
                  </span>
                </div>
              </div>

              {/* Estado Físico, Moral, Forma y Ego */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Físico / Energía</span>
                    <span className="font-mono text-white font-bold">{player.fitness}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${player.fitness}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Moral</span>
                    <span className="font-mono text-white font-bold">{player.morale}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${player.morale}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Forma Reciente</span>
                    <span className="font-mono text-white font-bold">{player.form}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${player.form}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Ego Rating</span>
                    <span className="font-mono text-purple-300 font-bold">{player.egoRating}/100</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${player.egoRating}%` }} />
                  </div>
                </div>
              </div>

              {/* Atributos Individuales (0-100) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Desglose de Atributos Futbolísticos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                  {[
                    { label: 'Ritmo / Aceleración', val: player.stats.pace, icon: '⚡', color: 'bg-cyan-500' },
                    { label: 'Tiro / Definición', val: player.stats.shooting, icon: '🎯', color: 'bg-rose-500' },
                    { label: 'Pase / Visión', val: player.stats.passing, icon: '🪄', color: 'bg-amber-500' },
                    { label: 'Regate / Técnica', val: player.stats.dribbling, icon: '🌪️', color: 'bg-purple-500' },
                    { label: 'Defensa / Entrada', val: player.stats.defense, icon: '🛡️', color: 'bg-blue-500' },
                    { label: 'Físico / Potencia', val: player.stats.physical, icon: '🏋️', color: 'bg-emerald-500' },
                    ...(player.position === 'POR'
                      ? [{ label: 'Portería / Reflejos', val: player.stats.goalkeeping, icon: '🧤', color: 'bg-yellow-500' }]
                      : []),
                  ].map((attr, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <span>{attr.icon}</span>
                          <span>{attr.label}</span>
                        </span>
                        <span className="font-mono font-bold text-white">{attr.val}</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className={clsx('h-full transition-all', attr.color)} style={{ width: `${attr.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Armas y Habilidades del Ego */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Armas & Habilidades Únicas del Ego
                  </h4>
                  {checkIsProdigy(player) && (
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>🔮</span> Talento Prodigio
                    </span>
                  )}
                </div>

                {checkIsProdigy(player) && (
                  <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
                    <span className="text-base">🔮</span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-purple-300">Prodigio de Blue Lock ({player.age} años · Potencial {player.potential})</p>
                      <p className="text-[11px] text-purple-300/80 leading-relaxed">
                        Despierta su primera arma de Ego tempranamente (a partir de 80 de media) y posee un 40% de probabilidad de forjar una 2ª arma complementaria al consagrarse en el fútbol de élite.
                      </p>
                    </div>
                  </div>
                )}

                {player.weapons && player.weapons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {player.weapons.map((w, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-900/80 border border-purple-500/30 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white flex items-center gap-1.5">
                            <span className="text-purple-400">⚡</span> {w.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Nvl. {w.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{w.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                    <p className="text-xs text-slate-300 font-semibold">
                      Este jugador aún no ha forjado un arma de Ego exclusiva.
                    </p>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p>• <b>Consagración:</b> Despertará su arma garantizada al alcanzar <b>88 de media</b>.</p>
                      {checkIsProdigy(player) ? (
                        <p className="text-purple-300 font-semibold">• <b>Estatus Prodigio:</b> Despertará su primera arma de forma precoz al alcanzar <b>80 de media</b> (o con 94+ potencial).</p>
                      ) : (
                        <p>• <b>Epifanía en Partido:</b> Puede despertar un arma antes de tiempo si logra una actuación estelar (nota ≥ 8.8, doblete o atajadas clave).</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RENDIMIENTO & TEMPORADA */}
          {activeTab === 'season' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estadísticas Acumuladas en la Temporada Regular
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Partidos Jugados</span>
                    <span className="text-2xl font-black font-mono text-white mt-1 block">{player.seasonMatches}</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Minutos Disputados</span>
                    <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">{player.seasonMinutes || 0}&apos;</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Goles Anotados</span>
                    <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">⚽ {player.seasonGoals}</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Asistencias</span>
                    <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">🅰️ {player.seasonAssists}</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Valoración Media ⭐</span>
                    <span className="text-2xl font-black font-mono text-yellow-300 mt-1 block">
                      {player.seasonAverageRating ? player.seasonAverageRating.toFixed(1) : '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarjetas</span>
                    <span className="text-sm font-black font-mono text-slate-300 mt-2 block">
                      🟨 {player.seasonYellowCards} · 🟥 {player.seasonRedCards}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Portería a Cero</span>
                    <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">{player.seasonCleanSheets}</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sin Jugar (Jornadas)</span>
                    <span className={clsx('text-2xl font-black font-mono mt-1 block', (player.consecutiveMatchesWithoutPlaying || 0) >= 3 ? 'text-rose-400' : 'text-slate-300')}>
                      {player.consecutiveMatchesWithoutPlaying || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explicación de desarrollo y minutos */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Efecto de los Minutos en la Progresión del Jugador:
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>
                    <b>Jugadores jóvenes (≤ 23 años):</b> Con cada partido disputado y buenas notas (≥ 7.0), su Media progresa hacia su Potencial máximo.
                  </li>
                  <li>
                    <b>Despertar del Ego:</b> Actuaciones estelares (doblete en Flow o nota ≥ 9.0) pueden elevar su potencial definitivo (+1).
                  </li>
                  <li>
                    <b>Estancamiento:</b> Si encadena 4+ jornadas en el banquillo sin minutos, perderá ritmo y moral; a partir de 6 jornadas, su media y potencial empezarán a degradarse.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRATO & RENOVACIÓN */}
          {activeTab === 'contract' && (
            <div className="space-y-6">
              
              {/* Resumen del contrato actual */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Estado Contractual Vigente
                    </h4>
                    <div className="text-lg font-black text-white mt-1">
                      {player.contractYears} {player.contractYears === 1 ? 'Temporada restante' : 'Temporadas restantes'}
                    </div>
                  </div>

                  {isExpiring ? (
                    <div className="px-3.5 py-2 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>¡Atención! Contrato en último año. Si no renuevas antes del final de temporada, el jugador quedará libre y fichará por otro club.</span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Contrato asegurado</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Salario Semanal Actual</span>
                    <span className="text-lg font-black font-mono text-white mt-1 block">
                      {formatMoney(player.weeklyWageYen, selectedCurrency)}/sem
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mínimo Exigido para Renovar (+15%)</span>
                    <span className="text-lg font-black font-mono text-cyan-400 mt-1 block">
                      {formatMoney(minWageRequired, selectedCurrency)}/sem
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario de Renovación */}
              {isUserPlayer ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    Propuesta de Renovación Contractual
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Años adicionales */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Años Adicionales de Contrato:
                      </label>
                      <select
                        value={renewalYears}
                        onChange={(e) => setRenewalYears(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs focus:border-cyan-500 focus:outline-none"
                      >
                        <option value={1}>+1 Temporada adicional</option>
                        <option value={2}>+2 Temporadas adicionales</option>
                        <option value={3}>+3 Temporadas adicionales</option>
                        <option value={4}>+4 Temporadas adicionales</option>
                        <option value={5}>+5 Temporadas adicionales</option>
                      </select>
                    </div>

                    {/* Nuevo Salario Semanal */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Nuevo Salario Semanal ({selectedCurrency}):
                      </label>
                      <input
                        type="text"
                        value={formatWithSpaces(renewalWage)}
                        onChange={(e) => {
                          const num = parseNumberFromSpaces(e.target.value);
                          setRenewalWage(num);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                        placeholder="Introduce salario semanal"
                      />
                    </div>
                  </div>

                  {renewalFeedback && (
                    <div
                      className={clsx(
                        'p-3 rounded-xl border text-xs font-bold flex items-center gap-2',
                        renewalFeedback.success
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                      )}
                    >
                      {renewalFeedback.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{renewalFeedback.message}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRenew}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs md:text-sm rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
                    >
                      Firmar Renovación de Contrato
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-500 text-center">
                  Solo puedes renovar contratos a futbolistas que pertenezcan a tu plantilla.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DESARROLLO & CAMBIO DE POSICIÓN (ESTILO FIFA) */}
          {activeTab === 'training' && isUserPlayer && (
            <div className="space-y-6 animate-fadeIn">
              {trainingFeedback && (
                <div
                  className={clsx(
                    'p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 shadow',
                    trainingFeedback.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {trainingFeedback.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    <span>{trainingFeedback.message}</span>
                  </div>
                  <button type="button" onClick={() => setTrainingFeedback(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 1. ENFOQUE DE DESARROLLO INDIVIDUAL */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>Plan de Desarrollo Individual de Atributos</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Elige la faceta técnica o física en la que {player.name} enfocará su evolución en los entrenamientos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {TRAINING_FOCUS_CATALOG.map((f) => {
                    const isSelected = (player.trainingFocus || 'balanced') === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setPlayerTrainingFocus(player.id, f.id);
                          setTrainingFeedback({
                            success: true,
                            message: `Plan actualizado: ${player.name} ahora entrena en modo [${f.name}].`,
                          });
                        }}
                        className={clsx(
                          'p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2',
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{f.icon}</span>
                          <span
                            className={clsx(
                              'text-[9px] font-black uppercase px-1.5 py-0.5 rounded',
                              isSelected ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                            )}
                          >
                            {isSelected ? 'ACTIVO' : 'SELECCIONAR'}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-bold text-white text-xs">{f.name}</h5>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                            {f.shortDesc}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                          {f.boostedStats.map((b, i) => (
                            <span key={i} className="text-[9px] font-bold text-cyan-300 bg-cyan-950/80 px-1 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. RECONVERSIÓN DINÁMICA DE POSICIÓN */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    <span>Reconversión Dinámica de Posición (Estilo FIFA)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Posición actual: <b className="text-white font-bold">{player.position}</b> ({getPositionName(player.position)}).
                    El tiempo requerido se calcula dinámicamente según la distancia táctica, la edad ({player.age} años) y los atributos actuales.
                  </p>
                </div>

                {player.positionConversion ? (
                  // PLAN ACTIVO EN CURSO
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/50 space-y-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-cyan-500 text-black font-black text-xs flex items-center justify-center">
                          {player.position}
                        </span>
                        <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                        <span className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-black text-xs flex items-center justify-center">
                          {player.positionConversion.targetPosition}
                        </span>
                        <div className="ml-2">
                          <span className="font-bold text-white text-xs block">
                            Reconvirtiendo a {getPositionName(player.positionConversion.targetPosition)}
                          </span>
                          <span className="text-[11px] text-cyan-300">
                            En progreso hacia nueva demarcación natural
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          cancelPositionConversion(player.id);
                          setTrainingFeedback({
                            success: false,
                            message: `Se ha cancelado la reconversión de posición de ${player.name}.`,
                          });
                        }}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-600/60 text-rose-300 font-bold text-xs rounded-xl transition-all self-start sm:self-auto"
                      >
                        ✕ Cancelar Reconversión
                      </button>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            Jornada {player.positionConversion.weeksElapsed} de {player.positionConversion.totalWeeks}
                            {' · '}
                            Faltan {Math.max(0, player.positionConversion.totalWeeks - player.positionConversion.weeksElapsed)} jornadas
                          </span>
                        </span>
                        <span className="text-cyan-400 font-mono">
                          {Math.min(100, Math.round((player.positionConversion.weeksElapsed / Math.max(1, player.positionConversion.totalWeeks)) * 100))}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((player.positionConversion.weeksElapsed / Math.max(1, player.positionConversion.totalWeeks)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // LISTA DE POSICIONES A LAS QUE CAMBIAR
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">
                      Selecciona la nueva posición que deseas que aprenda:
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {ALL_POSITIONS.filter((pos) => pos !== player.position).map((targetPos) => {
                        const calculation = calculateConversionWeeks(player, targetPos);
                        const isSecondary = player.secondaryPosition === targetPos;

                        return (
                          <div
                            key={targetPos}
                            className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between gap-2 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-7 rounded bg-slate-950 border border-slate-700 flex items-center justify-center text-[11px] font-black text-cyan-300">
                                {targetPos}
                              </span>
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-white text-xs">{getPositionName(targetPos)}</span>
                                  {isSecondary && (
                                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-500/40">
                                      2ª Pos
                                    </span>
                                  )}
                                </div>
                                <span className={clsx('text-[10px] font-bold', calculation.difficultyColor)}>
                                  {calculation.difficultyLabel} · {calculation.weeks} {calculation.weeks === 1 ? 'jornada' : 'jornadas'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                startPositionConversion(player.id, targetPos);
                                setTrainingFeedback({
                                  success: true,
                                  message: `¡Plan iniciado! ${player.name} aprenderá la posición de ${targetPos} en aproximadamente ${calculation.weeks} jornadas.`,
                                });
                              }}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] rounded-lg shadow transition-all shrink-0"
                            >
                              Iniciar ({calculation.weeks} j.)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            Expediente del jugador · Modo Carrera Blue Lock
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            Cerrar Expediente
          </button>
        </div>

      </div>
    </div>
  );
};
