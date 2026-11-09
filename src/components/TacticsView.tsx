'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { Pitch2D } from '@/components/Pitch2D';
import { Formation, TacticalMentalidad, TacticalPresion, TacticalPase, Player } from '@/types/football-manager';

export const TacticsView: React.FC = () => {
  const {
    userClubId,
    clubs,
    players,
    updateTactics,
    updateFormation,
    swapStartingPlayer,
    setRole,
  } = useGameStore();

  const [tacticsSelectedPlayer, setTacticsSelectedPlayer] = useState<Player | null>(null);

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const allPlayersMap = players.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Player>);

  return (
    <div className="space-y-6">
      {/* Controles de Formación y Mentalidad */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Formación:</label>
          <select
            value={userClub.formation}
            onChange={(e) => updateFormation(e.target.value as Formation)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="4-3-3">4-3-3 Ofensiva</option>
            <option value="4-2-3-1">4-2-3-1 Equilibrada</option>
            <option value="4-4-2">4-4-2 Clásica</option>
            <option value="3-5-2">3-5-2 Posesión</option>
            <option value="5-3-2">5-3-2 Contragolpe</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Mentalidad:</label>
          <select
            value={userClub.mentalidad}
            onChange={(e) => updateTactics(e.target.value as TacticalMentalidad, userClub.presion, userClub.estiloPase)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="muy_defensiva">Muy Defensiva</option>
            <option value="defensiva">Defensiva</option>
            <option value="equilibrada">Equilibrada</option>
            <option value="ofensiva">Ofensiva</option>
            <option value="ultra_ofensiva">Ultra Ofensiva (All-in)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Presión:</label>
          <select
            value={userClub.presion}
            onChange={(e) => updateTactics(userClub.mentalidad, e.target.value as TacticalPresion, userClub.estiloPase)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="baja">Baja (Repliegue)</option>
            <option value="media">Media (Zona media)</option>
            <option value="alta">Alta (Gegenpressing)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Estilo de Pase:</label>
          <select
            value={userClub.estiloPase}
            onChange={(e) => updateTactics(userClub.mentalidad, userClub.presion, e.target.value as TacticalPase)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
          >
            <option value="posesion">Posesión Corta</option>
            <option value="directo">Pase Directo / Al Hueco</option>
            <option value="contraataque">Contraataque Veloz</option>
          </select>
        </div>
      </div>

      {/* Pizarra 2D y Banquillo de Sustitución */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Pitch2D
            club={userClub}
            allPlayersMap={allPlayersMap}
            selectedPlayerId={tacticsSelectedPlayer?.id}
            onPlayerClick={(p) => setTacticsSelectedPlayer(p)}
          />
          <p className="text-xs text-slate-400 text-center">
            💡 Haz clic en cualquier jugador en la pizarra para ver sus detalles o cambiarlo por un suplente.
          </p>
        </div>

        {/* Panel Lateral: Suplentes y Roles */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-white text-sm flex items-center justify-between">
            <span>Banquillo de Suplentes</span>
            <span className="text-xs text-slate-400">{userClub.substitutes.length} jugadores</span>
          </h4>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {userClub.substitutes.map((id) => {
              const p = allPlayersMap[id];
              if (!p) return null;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {p.position} · Media {p.overall} · Fit {p.fitness}%
                    </div>
                  </div>

                  {tacticsSelectedPlayer && (
                    <button
                      type="button"
                      onClick={() => {
                        swapStartingPlayer(tacticsSelectedPlayer.id, id);
                        setTacticsSelectedPlayer(null);
                      }}
                      className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded text-[10px] transition-all"
                    >
                      Meter por {tacticsSelectedPlayer.name.split(' ').pop()}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Asignación de Capitán */}
          {tacticsSelectedPlayer && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Asignar roles a {tacticsSelectedPlayer.name}:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('captain', tacticsSelectedPlayer.id)}
                  className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded text-xs font-bold"
                >
                  Hacer Capitán
                </button>
                <button
                  type="button"
                  onClick={() => setRole('penalty', tacticsSelectedPlayer.id)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded text-xs font-bold"
                >
                  Tirador Penaltis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
