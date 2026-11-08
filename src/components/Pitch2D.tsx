'use client';

import React from 'react';
import { Club, Player, Formation } from '@/types/football-manager';
import clsx from 'clsx';
import { Shield, Star, Award, Zap } from 'lucide-react';

interface Pitch2DProps {
  club: Club;
  allPlayersMap: Record<string, Player>;
  onPlayerClick?: (player: Player) => void;
  selectedPlayerId?: string | null;
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
}) => {
  const coords = FORMATION_COORDINATES[club.formation] || FORMATION_COORDINATES['4-3-3'];
  const startingPlayers = club.startingXI.map((id) => allPlayersMap[id]).filter(Boolean);

  return (
    <div className="relative w-full aspect-[1.55] rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl select-none bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900">
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
        const isSelected = selectedPlayerId === player.id;
        const isCaptain = club.captainId === player.id;
        const isPenalty = club.penaltyTakerId === player.id;
        const hasWeapon = player.weapons && player.weapons.length > 0;

        return (
          <button
            key={player.id}
            type="button"
            onClick={() => onPlayerClick && onPlayerClick(player)}
            style={{
              left: `${posCoord.x}%`,
              top: `${posCoord.y}%`,
            }}
            className={clsx(
              'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-110 z-10',
              isSelected && 'scale-125 z-30'
            )}
          >
            {/* Chapa del Jugador */}
            <div
              className={clsx(
                'relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-lg border-2 transition-all',
                isSelected
                  ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-105'
                  : 'border-white/80'
              )}
              style={{
                backgroundColor: club.primaryColor || '#0047bb',
                color: club.secondaryColor || '#ffffff',
              }}
            >
              {player.overall}

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

              {/* Indicador de Arma de Blue Lock */}
              {hasWeapon && (
                <span className="absolute -bottom-1 -left-1 bg-cyan-500 text-black text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 fill-black" />
                </span>
              )}
            </div>

            {/* Etiqueta con Nombre y Posición */}
            <div className="mt-1 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] md:text-xs text-center whitespace-nowrap shadow-md max-w-[85px] truncate">
              <span className="text-cyan-400 font-bold mr-1">{posCoord.role}</span>
              <span className="text-white font-medium">{player.name.split(' ').pop()}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
