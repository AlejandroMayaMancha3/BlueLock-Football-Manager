'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import clsx from 'clsx';
import { formatMoney } from '@/lib/currency';
import { TROPHIES_CATALOG, TrophyDefinition } from '@/engine/data/trophies-catalog';
import { COUNTRIES_CATALOG, getDivisionById } from '@/engine/data/divisions-catalog';
import {
  Trophy,
  Award,
  Crown,
  Shield,
  Star,
  Globe2,
  Calendar,
  Sparkles,
  Building,
  Users,
  Compass,
  ArrowRight,
  ChevronRight,
  Info,
} from 'lucide-react';

export const MyClubView: React.FC = () => {
  const {
    userClubId,
    clubs,
    players,
    currentSeason,
    selectedCurrency,
    clubTrophies = [],
    seasonHistory = [],
  } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userPlayers = players.filter((p) => p.clubId === userClubId);
  const divInfo = getDivisionById(userClub.divisionId || userClub.league);
  const countryMeta = COUNTRIES_CATALOG.find((c) => c.id === userClub.country) || COUNTRIES_CATALOG[0];

  const [activeSubTab, setActiveSubTab] = useState<'cabinet' | 'uefa_guide' | 'history'>('cabinet');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'europe' | 'leagues' | 'cups'>('all');

  // Filtrado de trofeos ganados
  const filteredTrophies = clubTrophies.filter((t) => {
    if (selectedFilter === 'europe') return ['ucl', 'uel', 'uecl'].includes(t.trophyType);
    if (selectedFilter === 'leagues') return ['league_t1', 'league_t2', 'league_t3', 'league_t4'].includes(t.trophyType);
    if (selectedFilter === 'cups') return ['cup_main', 'cup_secondary'].includes(t.trophyType);
    return true;
  });

  const totalTitles = clubTrophies.length;
  const europeTitles = clubTrophies.filter((t) => ['ucl', 'uel', 'uecl'].includes(t.trophyType)).length;
  const leagueTitles = clubTrophies.filter((t) => ['league_t1', 'league_t2', 'league_t3', 'league_t4'].includes(t.trophyType)).length;
  const cupTitles = clubTrophies.filter((t) => ['cup_main', 'cup_secondary'].includes(t.trophyType)).length;

  return (
    <div className="space-y-6">
      {/* 1. HERO INSTITUCIONAL: IDENTIDAD DEL CLUB */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div
          className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: userClub.primaryColor || '#00d66c' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Escudo representativo grande */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-2xl border-2 shrink-0 transition-transform hover:scale-105"
              style={{
                backgroundColor: userClub.primaryColor || '#0f172a',
                color: userClub.secondaryColor || '#ffffff',
                borderColor: userClub.secondaryColor || '#38bdf8',
              }}
            >
              {userClub.shortName}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-white">{userClub.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {countryMeta.flag} {countryMeta.nameEs}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/40">
                  Tier {userClub.tier || divInfo?.tier || 1} • {divInfo?.name || '1.ª División'}
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {userClub.stadiumName} ({userClub.stadiumCapacity.toLocaleString()} espectadores)
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  Reputación {userClub.reputation}/100 • OVR {userClub.level}
                </span>
              </p>

              <div className="text-[11px] text-slate-500 font-mono pt-1">
                Plantilla: <strong className="text-slate-300">{userPlayers.length} jugadores</strong> • Valor total:{' '}
                <strong className="text-emerald-400">
                  {formatMoney(
                    userPlayers.reduce((sum, p) => sum + p.marketValueYen, 0),
                    selectedCurrency
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* CONTADORES RÁPIDOS DE PALMARÉS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800/80 shrink-0">
            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Trofeos</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-amber-400" /> {totalTitles}
              </span>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Europa</span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-0.5 block flex items-center justify-center gap-1">
                <Globe2 className="w-4 h-4 text-cyan-400" /> {europeTitles}
              </span>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Ligas</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block flex items-center justify-center gap-1">
                <Crown className="w-4 h-4 text-emerald-400" /> {leagueTitles}
              </span>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Copas</span>
              <span className="text-2xl font-black text-purple-400 font-mono mt-0.5 block flex items-center justify-center gap-1">
                <Award className="w-4 h-4 text-purple-400" /> {cupTitles}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTOR DE SUBPESTAÑAS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('cabinet')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeSubTab === 'cabinet'
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Vitrina de Trofeos ({totalTitles})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('uefa_guide')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeSubTab === 'uefa_guide'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>Competiciones UEFA & Copas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeSubTab === 'history'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Historial Temporadas ({seasonHistory.length})</span>
        </button>
      </div>

      {/* SUBPESTAÑA 1: SALA / VITRINA DE TROFEOS OFICIAL */}
      {activeSubTab === 'cabinet' && (
        <div className="space-y-6">
          {/* Barra de Filtros de la Vitrina */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              {[
                { id: 'all', label: 'Todos los Trofeos' },
                { id: 'europe', label: 'Europa (UEFA)' },
                { id: 'leagues', label: 'Ligas Nacionales' },
                { id: 'cups', label: 'Copas Nacionales' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                    selectedFilter === f.id
                      ? 'bg-slate-800 text-amber-300 shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Temporada actual en juego: <strong>Temporada {currentSeason}</strong>
            </span>
          </div>

          {/* LISTADO DE TROFEOS GANADOS */}
          {filteredTrophies.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-3">
              <Trophy className="w-12 h-12 mx-auto text-slate-700 animate-pulse" />
              <h4 className="text-base font-black text-white">Vitrina a la espera de sus primeros trofeos</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tu club aún no ha conquistado títulos en esta categoría. Gana tu liga quedando en primer puesto, o
                clasifícate a la UEFA Champions League, Europa League o Conference League para coronarte campeón.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrophies.map((trophy) => {
                const isUcl = trophy.trophyType === 'ucl';
                const isUel = trophy.trophyType === 'uel';
                const isUecl = trophy.trophyType === 'uecl';
                const isLeague = ['league_t1', 'league_t2', 'league_t3', 'league_t4'].includes(trophy.trophyType);

                return (
                  <div
                    key={trophy.id}
                    className={clsx(
                      'relative overflow-hidden p-5 rounded-3xl border transition-all shadow-xl flex flex-col justify-between group hover:scale-[1.02]',
                      isUcl
                        ? 'bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950 border-blue-500/40 shadow-blue-500/10'
                        : isUel
                        ? 'bg-gradient-to-br from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40 shadow-amber-500/10'
                        : isUecl
                        ? 'bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    {/* Brillo de fondo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:border-amber-400/50 transition-colors">
                          {isUcl ? (
                            <span className="text-2xl">🏆</span>
                          ) : isUel ? (
                            <span className="text-2xl">🥈</span>
                          ) : isUecl ? (
                            <span className="text-2xl">🥉</span>
                          ) : isLeague ? (
                            <Crown className="w-6 h-6 text-amber-400" />
                          ) : (
                            <Award className="w-6 h-6 text-purple-400" />
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-slate-950 border border-slate-800 text-amber-400">
                          {trophy.dateStr}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-black text-white text-sm leading-tight">
                          {trophy.officialName}
                        </h5>
                        {trophy.popularName && (
                          <span className="text-xs font-bold text-amber-300 block mt-0.5">
                            "{trophy.popularName}"
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium block mt-1">
                          Competición: {trophy.competitionName}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono relative z-10">
                      <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Campeón Oficial
                      </span>
                      <span>Club: {userClub.shortName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VITRINA DE TROFEOS CONTINENTALES Y NACIONALES EN DISPUTA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="font-black text-white text-base flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              Trofeos Oficiales a Conquistar (Palmarés Europeo y Nacional)
            </h4>
            <p className="text-xs text-slate-400">
              Guía de los trofeos oficiales que puedes ganar según tu rendimiento liguero y clasificación europea.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {TROPHIES_CATALOG.filter((t) => t.country === 'Europe' || t.country === userClub.country).map((t) => {
                const userHasIt = clubTrophies.some((ct) => ct.trophyKey === t.key);
                return (
                  <div
                    key={t.key}
                    className={clsx(
                      'p-4 rounded-2xl border text-xs flex flex-col justify-between gap-3 transition-all',
                      userHasIt
                        ? 'bg-slate-950 border-amber-500/40 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs">{t.competitionName}</span>
                        {userHasIt ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black">
                            ✓ En Vitrina
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            Por Ganar
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-black text-amber-300 mt-1">{t.officialName}</div>
                      {t.popularName && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">"{t.popularName}"</div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Prestigio: {t.prestigeScore}/100</span>
                      <span className="capitalize">{t.country}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBPESTAÑA 2: GUÍA OFICIAL COMPETICIONES UEFA Y COPAS NACIONALES */}
      {activeSubTab === 'uefa_guide' && (
        <div className="space-y-6">
          {/* FORMATO SUIZO UEFA DE 36 EQUIPOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                Formato UEFA: 36 Equipos y Fase de Liga Única
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                La nueva era de las competiciones de clubes de la UEFA sustituye la antigua fase de grupos por una gran
                liga de 36 equipos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm">UEFA Champions League</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-bold">
                    36 Equipos
                  </span>
                </div>
                <div className="text-xs text-amber-300 font-bold">
                  Trofeo: Copa de Clubes Campeones Europeos ("La Orejona")
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside pt-1">
                  <li>8 partidos en fase de liga (4 casa, 4 fuera) contra 8 rivales distintos.</li>
                  <li>Puestos 1 al 8: Clasificados directos a Octavos de Final (cabezas de serie).</li>
                  <li>Puestos 9 al 24: Play-off de dieciseisavos a doble partido.</li>
                  <li>Puestos 25 al 36: Eliminación directa sin descenso.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm">UEFA Europa League</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                    36 Equipos
                  </span>
                </div>
                <div className="text-xs text-amber-300 font-bold">Trofeo: Copa de la UEFA (UEFA Cup)</div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside pt-1">
                  <li>8 partidos en fase de liga (4 casa, 4 fuera) contra 8 rivales distintos.</li>
                  <li>Mismo sistema de eliminación: 1-8 a Octavos, 9-24 Play-off a doble partido.</li>
                  <li>El campeón clasifica directamente a la fase de liga de la próxima Champions.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm">UEFA Conference League</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                    36 Equipos
                  </span>
                </div>
                <div className="text-xs text-emerald-300 font-bold">Trofeo: Trofeo de la UEFA Conference League</div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside pt-1">
                  <li>6 partidos en fase de liga (3 casa, 3 fuera) contra 6 rivales distintos.</li>
                  <li>1 al 8 directos a Octavos; 9 al 24 Play-off a doble partido.</li>
                  <li>El campeón clasifica a la siguiente fase de liga de la UEFA Europa League.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ASIGNACIÓN DE PLAZAS Y EFECTO ARRASTRE DE COPAS EN LAS 5 GRANDES LIGAS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Asignación de Plazas Europeas y Efecto Arrastre de Copas
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Reglamento oficial UEFA para el reparto de cupos y corrimiento de plazas cuando el campeón de copa ya está
                clasificado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* REGLA GENERAL DE ARRASTRE */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] block">
                  Regla de Arrastre Continental
                </span>
                <p className="text-slate-300 leading-relaxed">
                  La plaza europea que otorga el título de Copa Nacional <strong>NUNCA pasa al subcampeón</strong>.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Si el campeón de Copa ya clasifica a Champions League o Europa League a través de su posición en liga:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>
                    Su cupo de <strong>Europa League</strong> se traslada al equipo mejor posicionado en liga sin plaza
                    directa (habitualmente el <strong>6.º clasificado</strong>).
                  </li>
                  <li>
                    La plaza de <strong>Conference League</strong> se desplaza al siguiente clasificado (habitualmente el{' '}
                    <strong>7.º puesto</strong>).
                  </li>
                </ul>
              </div>

              {/* PARTICULARIDAD INGLESA */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] block">
                  Particularidad Inglesa (FA Cup y EFL Cup)
                </span>
                <ul className="list-disc list-inside text-slate-300 space-y-1.5">
                  <li>
                    1.º al 4.º de Premier League: <strong>Champions League</strong>.
                  </li>
                  <li>
                    5.º de Premier + Campeón de FA Cup: <strong>Europa League</strong>.
                  </li>
                  <li>
                    Campeón de EFL Cup (Carabao): <strong>Conference League</strong>.
                  </li>
                  <li>
                    Si el campeón de FA Cup va a Champions/Europa por liga: el <strong>6.º de Premier</strong> va a Europa
                    League.
                  </li>
                  <li>
                    Si el campeón de EFL Cup ya va a Europa por Premier o FA Cup: el cupo de Conference pasa al{' '}
                    <strong>7.º de Premier</strong> (o al 8.º si se combinan ambos arrastres).
                  </li>
                </ul>
              </div>
            </div>

            {/* PLAZAS DE RENDIMIENTO EUROPEO (EPS) */}
            <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-cyan-950/40 rounded-2xl border border-cyan-500/30 flex items-start gap-3 text-xs">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white text-sm block">
                  European Performance Spots (Plazas de Rendimiento Extra)
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Las 2 federaciones nacionales cuyos clubes obtengan el mejor coeficiente UEFA medio en la última temporada
                  reciben una <strong>plaza directa extra a la fase de liga de la Champions League</strong>, que se otorga
                  al <strong>5.º clasificado</strong> de su liga doméstica.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBPESTAÑA 3: HISTORIAL TEMPORADA A TEMPORADA */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Historial de Temporadas Disputadas
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Registro histórico de resultados, posiciones finales y títulos conseguidos en cada campaña.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
              {seasonHistory.length} Campañas registradas
            </span>
          </div>

          {seasonHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Aún te encuentras en tu primera temporada. Al finalizar la jornada 46 se archivará tu primer balance
              histórico.
            </div>
          ) : (
            <div className="space-y-3">
              {seasonHistory.map((h) => {
                const isChampion = h.userOutcome === 'champion' || h.userPosition === 1;
                const isPromoted = h.userOutcome === 'promoted';
                const isRelegated = h.userOutcome === 'relegated';

                return (
                  <div
                    key={h.seasonNumber}
                    className={clsx(
                      'p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md',
                      isChampion
                        ? 'bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40'
                        : isPromoted
                        ? 'bg-slate-950 border-emerald-500/40'
                        : isRelegated
                        ? 'bg-slate-950 border-rose-500/40'
                        : 'bg-slate-950 border-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-white shrink-0">
                        S{h.seasonNumber}
                      </span>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Temporada {h.seasonNumber}</span>
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                              isChampion
                                ? 'bg-amber-400 text-black'
                                : isPromoted
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : isRelegated
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-300'
                            )}
                          >
                            Puesto {h.userPosition}.º {isChampion ? '🏆 CAMPEÓN' : isPromoted ? '⬆ ASCENSO' : isRelegated ? '⬇ DESCENSO' : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {h.divisionName || 'Liga Nacional'} • Campeón de la liga: <strong>{h.championClubName}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Premio de Clasificación</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatMoney(h.prizeMoneyYen, selectedCurrency)}
                        </span>
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-[10px] text-slate-500 uppercase block">Pichichi de Liga</span>
                        <span className="text-slate-300 font-medium">
                          {h.topScorerName} ({h.topScorerGoals} goles)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
