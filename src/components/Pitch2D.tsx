'use client';

import React from 'react';
import { Club, Player, Formation } from '@/types/football-manager';
import clsx from 'clsx';
import { Zap } from 'lucide-react';
import { calculatePositionalAdaptation } from '@/engine/position-engine';

interface Pitch2DProps {
  club: Club;
  allPlayersMap: Record<string, Player>;
  onPlayerClick?: (player: Player) => void;
  selectedPlayerId?: string | null;
  onPitchClick?: () => void;
}

// Coordinates for formations on a 100x100 pitch
// x: 0 (defensa/portería) to 100 (delantera), y: 0 to 100 (ancho)
const FORMATION_COORDINATES: Record<Formation, Array<{ x: number; y: number; role: string }>> = {
  '4-3-3': [
    { x: 8, y: 50, role: 'POR' },
    { x: 26, y: 15, role: 'LI' },
    { x: 23, y: 38, role: 'DFC' },
    { x: 23, y: 62, role: 'DFC' },
    { x: 26, y: 85, role: 'LD' },
    { x: 48, y: 50, role: 'MCD' },
    { x: 55, y: 28, role: 'MC' },
    { x: 55, y: 72, role: 'MC' },
    { x: 82, y: 18, role: 'EI' },
    { x: 88, y: 50, role: 'DC' },
    { x: 82, y: 82, role: 'ED' },
  ],
  '4-2-3-1': [
    { x: 8, y: 50, role: 'POR' },
    { x: 26, y: 15, role: 'LI' },
    { x: 23, y: 38, role: 'DFC' },
    { x: 23, y: 62, role: 'DFC' },
    { x: 26, y: 85, role: 'LD' },
    { x: 45, y: 35, role: 'MCD' },
    { x: 45, y: 65, role: 'MCD' },
    { x: 68, y: 20, role: 'EI' },
    { x: 68, y: 50, role: 'MCO' },
    { x: 68, y: 80, role: 'ED' },
    { x: 88, y: 50, role: 'DC' },
  ],
  '4-4-2': [
    { x: 8, y: 50, role: 'POR' },
    { x: 26, y: 15, role: 'LI' },
    { x: 23, y: 38, role: 'DFC' },
    { x: 23, y: 62, role: 'DFC' },
    { x: 26, y: 85, role: 'LD' },
    { x: 52, y: 16, role: 'MI' },
    { x: 50, y: 38, role: 'MC' },
    { x: 50, y: 62, role: 'MC' },
    { x: 52, y: 84, role: 'MD' },
    { x: 85, y: 38, role: 'DC' },
    { x: 85, y: 62, role: 'DC' },
  ],
  '3-5-2': [
    { x: 8, y: 50, role: 'POR' },
    { x: 24, y: 25, role: 'DFC' },
    { x: 22, y: 50, role: 'DFC' },
    { x: 24, y: 75, role: 'DFC' },
    { x: 50, y: 12, role: 'CAI' },
    { x: 48, y: 35, role: 'MC' },
    { x: 48, y: 65, role: 'MC' },
    { x: 50, y: 88, role: 'CAD' },
    { x: 66, y: 50, role: 'MCO' },
    { x: 86, y: 38, role: 'DC' },
    { x: 86, y: 62, role: 'DC' },
  ],
  '5-3-2': [
    { x: 8, y: 50, role: 'POR' },
    { x: 26, y: 12, role: 'LI' },
    { x: 22, y: 30, role: 'DFC' },
    { x: 20, y: 50, role: 'DFC' },
    { x: 22, y: 70, role: 'DFC' },
    { x: 26, y: 88, role: 'LD' },
    { x: 50, y: 30, role: 'MC' },
    { x: 48, y: 50, role: 'MCD' },
    { x: 50, y: 70, role: 'MC' },
    { x: 85, y: 38, role: 'DC' },
    { x: 85, y: 62, role: 'DC' },
  ],
};

export const Pitch2D: React.FC<Pitch2DProps> = ({
  club,
  allPlayersMap,
  onPlayerClick,
  selectedPlayerId,
  onPitchClick,
}) => {
  const coords = FORMATION_COORDINATES[club.formation] || FORMATION_COORDINATES['4-3-3'];
  const startingPlayers = club.startingXI.map((id) => allPlayersMap[id]).filter(Boolean);

  return (
    <div
      onClick={() => {
        // Al hacer clic en el césped de la pizarra, deseleccionar
        if (onPitchClick) onPitchClick();
      }}
      className="relative w-full aspect-[1.55] rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl select-none bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 cursor-pointer"
    >
      {/* Césped rayado */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #000 0, #000 10%, transparent 10%, transparent 20%)',
        }}
      />

      {/* Líneas de fútbol en blanco nítido */}
      <div className="absolute inset-3 border-2 border-white/50 rounded-lg pointer-events-none">
        {/* Línea de medio campo */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50 -translate-x-1/2" />
        {/* Círculo central */}
        <div className="absolute left-1/2 top-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 border-2 border-white/50 rounded-full" />
        <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-white/80 rounded-full" />

        {/* Área local (izquierda) */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1/6 border-r-2 border-white/50" />
        <div className="absolute left-0 top-[38%] bottom-[38%] w-[7%] border-r-2 border-white/50" />
        <div className="absolute left-[11%] top-1/2 w-1.5 h-1.5 -translate-y-1/2 bg-white/80 rounded-full" />

        {/* Área visitante (derecha) */}
        <div className="absolute right-0 top-1/4 bottom-1/4 w-1/6 border-l-2 border-white/50" />
        <div className="absolute right-0 top-[38%] bottom-[38%] w-[7%] border-l-2 border-white/50" />
        <div className="absolute right-[11%] top-1/2 w-1.5 h-1.5 -translate-y-1/2 bg-white/80 rounded-full" />
      </div>

      {/* Renderizado de los 11 jugadores en sus posiciones */}
      {startingPlayers.map((player, idx) => {
        const posCoord = coords[idx] || { x: 50, y: 50, role: player.position };
        const adaptation = calculatePositionalAdaptation(player, posCoord.role);
        const hasPenalty = adaptation.penaltyOvr > 0;
        const isSelected = selectedPlayerId === player.id;
        const isCaptain = club.captainId === player.id;
        const isPenalty = club.penaltyTakerId === player.id;
        const isFreeKick = club.freeKickTakerId === player.id;
        const isBanned = player.isBanned;
        const isInjured = (player.injuryWeeks || 0) > 0;
        const hasWeapon = player.weapons && player.weapons.length > 0;

        return (
          <button
            key={player.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onPlayerClick) onPlayerClick(player);
            }}
            style={{
              left: `${posCoord.x}%`,
              top: `${posCoord.y}%`,
            }}
            className={clsx(
              'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-110 z-10',
              isSelected && 'scale-125 z-30'
            )}
            title={`${player.name} (Natural: ${player.position}) · Asignado: ${posCoord.role}\n${adaptation.description}`}
          >
            {/* Chapa del Jugador */}
            <div
              className={clsx(
                'relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-lg border-2 transition-all',
                isBanned
                  ? 'border-rose-500 ring-2 ring-rose-500/80 bg-rose-950'
                  : isInjured
                  ? 'border-amber-500 ring-2 ring-amber-500/80 bg-amber-950'
                  : isSelected
                  ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-105'
                  : adaptation.affinityTier === 'disaster'
                  ? 'border-rose-500 ring-2 ring-rose-500 animate-pulse'
                  : adaptation.affinityTier === 'poor'
                  ? 'border-orange-500 ring-1 ring-orange-500'
                  : adaptation.affinityTier === 'fair'
                  ? 'border-amber-400'
                  : 'border-white/80'
              )}
              style={{
                backgroundColor: isBanned
                  ? '#4c0519'
                  : isInjured
                  ? '#451a03'
                  : (club.primaryColor || '#0047bb'),
                color: club.secondaryColor || '#ffffff',
              }}
            >
              {/* Media efectiva (con bajada proporcional si no es su posición) */}
              <span className={clsx(hasPenalty && 'font-black text-amber-300')}>
                {adaptation.effectiveOvr}
              </span>

              {/* Insignia con la penalización de media */}
              {hasPenalty && (
                <span
                  className={clsx(
                    'absolute -bottom-1 -right-1 text-[8px] font-black rounded px-0.5 border leading-tight shadow-md',
                    adaptation.affinityTier === 'disaster'
                      ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce'
                      : 'bg-amber-950 text-amber-300 border-amber-500'
                  )}
                  title={`Penalización por jugar fuera de posición: -${adaptation.penaltyOvr} OVR`}
                >
                  -{adaptation.penaltyOvr}
                </span>
              )}

              {/* Sanción o Lesión */}
              {isBanned && (
                <span className="absolute -top-1 -left-1 bg-rose-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  🟥
                </span>
              )}
              {!isBanned && isInjured && (
                <span className="absolute -top-1 -left-1 bg-amber-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  🏥
                </span>
              )}

              {/* Insignia de Capitán */}
              {isCaptain && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  C
                </span>
              )}

              {/* Insignia de Penalti */}
              {isPenalty && !isCaptain && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  P
                </span>
              )}

              {/* Insignia de Faltas */}
              {isFreeKick && !isCaptain && !isPenalty && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  F
                </span>
              )}

              {/* Indicador de Arma de Blue Lock */}
              {hasWeapon && (
                <span className="absolute -bottom-1 -left-1 bg-cyan-500 text-black text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 fill-black" />
                </span>
              )}
            </div>

            {/* Etiqueta con Nombre, Posición y Potencial */}
            <div className="mt-1 bg-slate-950/90 backdrop-blur-sm border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] md:text-xs text-center whitespace-nowrap shadow-md max-w-[105px] truncate">
              <div className="flex items-center justify-center gap-1">
                <span className={clsx('font-bold', hasPenalty ? adaptation.affinityColor : 'text-cyan-400')}>
                  {posCoord.role}
                </span>
                <span className="text-white font-medium truncate">{player.name.split(' ').pop()}</span>
              </div>
              <div className="text-[9px] font-mono">
                {hasPenalty ? (
                  <span className={clsx('font-bold', adaptation.affinityColor)}>
                    MED {adaptation.effectiveOvr} <span className="text-[8px] opacity-75">({player.overall})</span>
                  </span>
                ) : (
                  <span className="text-slate-400">
                    MED {player.overall} · <b className="text-cyan-300 font-bold">POT {player.potential}</b>
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
