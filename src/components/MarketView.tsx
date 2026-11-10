'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Player, Position } from '@/types/football-manager';
import { DIVISIONS_CATALOG, COUNTRIES_CATALOG } from '@/engine/data/divisions-catalog';
import { PlayerDetailModal } from './PlayerDetailModal';
import {
  formatMoney,
  convertFromYen,
  convertToYen,
  formatWithSpaces,
  parseNumberFromSpaces,
  CURRENCIES,
} from '@/lib/currency';

type SortOption =
  | 'ovr_desc'
  | 'pot_desc'
  | 'price_asc'
  | 'price_desc'
  | 'growth_desc'
  | 'age_asc'
  | 'name_asc';

export const MarketView: React.FC = () => {
  const { currentRound, userClubId, clubs, players, selectedCurrency, makeBuyOffer, isSeasonCompleted, recentTransfers = [], fixtures = [] } = useGameStore();

  const userClub = clubs.find((c) => c.id === userClubId);
  const currencyCfg = CURRENCIES[selectedCurrency] || CURRENCIES.EUR;

  const userLeaguePlayed = fixtures.filter(
    (f) => (f.competitionType === 'league' || !f.competitionType) && (f.homeClubId === userClubId || f.awayClubId === userClubId) && f.isPlayed
  ).length;
  const currentLeagueMatchday = Math.min(46, userLeaguePlayed + 1);

  // Subpestañas del Mercado: Catálogo de Jugadores / Movimientos de Clubes Rivales
  const [marketSubTab, setMarketSubTab] = useState<'catalog' | 'rival_feed'>('catalog');

  // Estado de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [posCategory, setPosCategory] = useState<'ALL' | 'DEL' | 'MED' | 'DEF' | 'POR'>('ALL');
  const [exactPosition, setExactPosition] = useState<string>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [clubFilter, setClubFilter] = useState<string>('ALL');
  const [ovrRange, setOvrRange] = useState<string>('ALL');
  const [potRange, setPotRange] = useState<string>('ALL');
  const [ageRange, setAgeRange] = useState<string>('ALL');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [onlyWithWeapons, setOnlyWithWeapons] = useState(false);
  const [onlyTransferListed, setOnlyTransferListed] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Ordenación y Paginación
  const [sortBy, setSortBy] = useState<SortOption>('ovr_desc');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modales
  const [selectedMarketPlayer, setSelectedMarketPlayer] = useState<Player | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [offerFee, setOfferFee] = useState<number>(0);
  const [offerWage, setOfferWage] = useState<number>(0);
  const [offerYears, setOfferYears] = useState<number>(3);
  const [marketFeedback, setMarketFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const isWindowOpen = isSeasonCompleted || currentLeagueMatchday <= 6 || (currentLeagueMatchday >= 22 && currentLeagueMatchday <= 28);

  // Cantidad de filtros avanzados activos
  const activeAdvancedFiltersCount = useMemo(() => {
    let count = 0;
    if (exactPosition !== 'ALL') count++;
    if (countryFilter !== 'ALL') count++;
    if (divisionFilter !== 'ALL') count++;
    if (clubFilter !== 'ALL') count++;
    if (ovrRange !== 'ALL') count++;
    if (potRange !== 'ALL') count++;
    if (ageRange !== 'ALL') count++;
    if (onlyAffordable) count++;
    if (onlyWithWeapons) count++;
    if (onlyTransferListed) count++;
    return count;
  }, [exactPosition, countryFilter, divisionFilter, clubFilter, ovrRange, potRange, ageRange, onlyAffordable, onlyWithWeapons, onlyTransferListed]);

  // Insignia de Potencial
  const getPotentialTier = (pot: number) => {
    if (pot >= 95) return { label: 'Mundial', color: 'text-amber-300 bg-amber-950/60 border-amber-500/60', icon: '🌟' };
    if (pot >= 90) return { label: 'Élite', color: 'text-purple-300 bg-purple-950/60 border-purple-500/60', icon: '💎' };
    if (pot >= 85) return { label: 'Promesa', color: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/60', icon: '⚡' };
    if (pot >= 80) return { label: 'Desarrollo', color: 'text-blue-300 bg-blue-950/60 border-blue-500/60', icon: '📈' };
    return { label: 'Consolidado', color: 'text-slate-400 bg-slate-900 border-slate-700', icon: '🛡️' };
  };

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

  // Mapa rápido de Clubes para búsqueda rápida
  const clubsMap = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  // Lista de clubes filtrable para el select
  const availableClubsForFilter = useMemo(() => {
    return clubs
      .filter((c) => {
        if (countryFilter !== 'ALL' && c.country !== countryFilter) return false;
        if (divisionFilter !== 'ALL' && (c.divisionId || c.league) !== divisionFilter) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs, countryFilter, divisionFilter]);

  // Reset de Filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setPosCategory('ALL');
    setExactPosition('ALL');
    setDivisionFilter('ALL');
    setCountryFilter('ALL');
    setClubFilter('ALL');
    setOvrRange('ALL');
    setPotRange('ALL');
    setAgeRange('ALL');
    setOnlyAffordable(false);
    setOnlyWithWeapons(false);
    setOnlyTransferListed(false);
    setSortBy('ovr_desc');
    setCurrentPage(1);
  };

  // Filtrado de futbolistas
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // 1. Buscador por texto (nombre, club o nacionalidad)
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const club = clubsMap.get(p.clubId);
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesClub = club ? club.name.toLowerCase().includes(query) : false;
        const matchesNat = p.nationality.toLowerCase().includes(query);
        if (!matchesName && !matchesClub && !matchesNat) return false;
      }

      // 2. Filtro de Categoría Posicional
      if (posCategory !== 'ALL') {
        if (posCategory === 'DEL' && !['DC', 'EI', 'ED'].includes(p.position)) return false;
        if (posCategory === 'MED' && !['MC', 'MCO', 'MCD', 'MI', 'MD'].includes(p.position)) return false;
        if (posCategory === 'DEF' && !['DFC', 'LI', 'LD', 'CAI', 'CAD'].includes(p.position)) return false;
        if (posCategory === 'POR' && p.position !== 'POR') return false;
      }

      // 3. Demarcación exacta
      if (exactPosition !== 'ALL' && p.position !== exactPosition) {
        return false;
      }

      // 4. País / Liga
      const club = clubsMap.get(p.clubId);
      if (countryFilter !== 'ALL' && club?.country !== countryFilter) {
        return false;
      }
      if (divisionFilter !== 'ALL' && (club?.divisionId || club?.league) !== divisionFilter) {
        return false;
      }

      // 5. Club exacto
      if (clubFilter !== 'ALL' && p.clubId !== clubFilter) {
        return false;
      }

      // 6. Rango de Media (OVR)
      if (ovrRange !== 'ALL') {
        if (ovrRange === '88+' && p.overall < 88) return false;
        if (ovrRange === '83-87' && (p.overall < 83 || p.overall > 87)) return false;
        if (ovrRange === '78-82' && (p.overall < 78 || p.overall > 82)) return false;
        if (ovrRange === '70-77' && (p.overall < 70 || p.overall > 77)) return false;
        if (ovrRange === '<70' && p.overall >= 70) return false;
      }

      // 7. Rango de Potencial (POT)
      if (potRange !== 'ALL') {
        if (potRange === '90+' && p.potential < 90) return false;
        if (potRange === '85+' && p.potential < 85) return false;
        if (potRange === '80+' && p.potential < 80) return false;
        if (potRange === '<80' && p.potential >= 80) return false;
      }

      // 8. Rango de Edad
      if (ageRange !== 'ALL') {
        if (ageRange === 'u21' && p.age > 21) return false;
        if (ageRange === '22-25' && (p.age < 22 || p.age > 25)) return false;
        if (ageRange === '26-29' && (p.age < 26 || p.age > 29)) return false;
        if (ageRange === '30+' && p.age < 30) return false;
      }

      // 9. Solo asequibles con presupuesto
      if (onlyAffordable && userClub) {
        if (p.marketValueYen > userClub.budgetYen) return false;
      }

      // 10. Solo con Armas / Blue Lock
      if (onlyWithWeapons) {
        if (!p.weapons || p.weapons.length === 0) return false;
      }

      // 11. Solo transferibles
      if (onlyTransferListed && !p.isTransferListed) {
        return false;
      }

      return true;
    });
  }, [
    players,
    searchTerm,
    posCategory,
    exactPosition,
    countryFilter,
    divisionFilter,
    clubFilter,
    ovrRange,
    potRange,
    ageRange,
    onlyAffordable,
    onlyWithWeapons,
    onlyTransferListed,
    clubsMap,
    userClub,
  ]);

  // Ordenación
  const sortedPlayers = useMemo(() => {
    const list = [...filteredPlayers];
    switch (sortBy) {
      case 'ovr_desc':
        return list.sort((a, b) => b.overall - a.overall || b.potential - a.potential);
      case 'pot_desc':
        return list.sort((a, b) => b.potential - a.potential || b.overall - a.overall);
      case 'price_asc':
        return list.sort((a, b) => a.marketValueYen - b.marketValueYen);
      case 'price_desc':
        return list.sort((a, b) => b.marketValueYen - a.marketValueYen);
      case 'growth_desc':
        return list.sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall));
      case 'age_asc':
        return list.sort((a, b) => a.age - b.age || b.potential - a.potential);
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [filteredPlayers, sortBy]);

  // Paginación
  const totalItems = sortedPlayers.length;
  const effectivePageSize = pageSize === -1 ? totalItems : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / (effectivePageSize || 1)));

  // Ajustar página actual si excede totalPages
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPlayers = useMemo(() => {
    if (pageSize === -1) return sortedPlayers;
    const start = (validCurrentPage - 1) * effectivePageSize;
    return sortedPlayers.slice(start, start + effectivePageSize);
  }, [sortedPlayers, validCurrentPage, effectivePageSize, pageSize]);

  return (
    <div className="space-y-6">
      {/* 1. CABECERA Y RESUMEN FINANCIERO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-black text-white">Mercado Global de Fichajes y Traspasos</h3>
            {isWindowOpen ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                ● Ventana Abierta
              </span>
            ) : (
              <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-500/50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                ● Ventana Cerrada (Abierta en J1-6 y J22-28)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explora las plantillas y futbolistas de todas las divisiones con valoraciones de mercado calibradas según media, edad y potencial.
          </p>
        </div>

        {userClub && (
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Presupuesto Fichajes:</span>
              <span className="text-sm font-black text-cyan-400 font-mono">
                {formatMoney(userClub.budgetYen, selectedCurrency)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Fondos Disponibles:</span>
              <span
                className={clsx(
                  'text-sm font-black font-mono',
                  userClub.cashYen >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {formatMoney(userClub.cashYen, selectedCurrency)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK DE OFERTAS */}
      {marketFeedback && (
        <div
          className={clsx(
            'p-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 shadow-lg animate-fadeIn',
            marketFeedback.success
              ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/70 text-rose-200'
          )}
        >
          <div className="flex items-center gap-2">
            {marketFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{marketFeedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setMarketFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SELECTOR DE SUBPESTAÑAS: CATÁLOGO / MOVIMIENTOS RIVALES */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setMarketSubTab('catalog')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
            marketSubTab === 'catalog'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Catálogo de Jugadores ({totalItems})</span>
        </button>
        <button
          type="button"
          onClick={() => setMarketSubTab('rival_feed')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
            marketSubTab === 'rival_feed'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fichajes de Clubes Rivales</span>
          {recentTransfers.length > 0 && (
            <span
              className={clsx(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold',
                marketSubTab === 'rival_feed' ? 'bg-black text-cyan-400' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              )}
            >
              {recentTransfers.length}
            </span>
          )}
        </button>
      </div>

      {marketSubTab === 'catalog' && (
        <>
          {/* 2. PANEL COMPLETO DE FILTROS CÓMODOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Fila 1: Buscador y Categorías de Posición */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por futbolista, club o país..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorías Rápidas de Posición */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold shrink-0 overflow-x-auto">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'DEL', label: 'Delanteros' },
              { id: 'MED', label: 'Medios' },
              { id: 'DEF', label: 'Defensas' },
              { id: 'POR', label: 'Porteros' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setPosCategory(cat.id as any);
                  setExactPosition('ALL');
                  setCurrentPage(1);
                }}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap',
                  posCategory === cat.id ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botón Móvil para Desplegar / Ocultar Filtros Avanzados */}
        <div className="sm:hidden pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={clsx(
              'w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all',
              showMobileFilters || activeAdvancedFiltersCount > 0
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            )}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showMobileFilters ? 'Ocultar Filtros Avanzados' : 'Desplegar Filtros Avanzados'}</span>
            </div>
            {activeAdvancedFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-black font-black text-[10px]">
                {activeAdvancedFiltersCount} activos
              </span>
            )}
          </button>
        </div>

        {/* CONTENEDOR DE FILTROS AVANZADOS: SIEMPRE VISIBLE EN PC (sm:block), COLAPSABLE EN MÓVIL */}
        <div className={clsx('space-y-4', !showMobileFilters && 'hidden sm:block')}>
          {/* Fila 2: Filtros Selectores (Demarcación exacta, País, Liga/División, Club) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Demarcación Exacta */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Posición Exacta:
              </label>
              <select
                value={exactPosition}
                onChange={(e) => {
                  setExactPosition(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Cualquiera</option>
                <option value="POR">POR · Portero</option>
                <option value="DFC">DFC · Central</option>
                <option value="LI">LI · Lateral Izquierdo</option>
                <option value="LD">LD · Lateral Derecho</option>
                <option value="CAI">CAI · Carrilero Izquierdo</option>
                <option value="CAD">CAD · Carrilero Derecho</option>
                <option value="MCD">MCD · Pivote Defensivo</option>
                <option value="MC">MC · Centrocampista</option>
                <option value="MI">MI · Medio Izquierdo</option>
                <option value="MD">MD · Medio Derecho</option>
                <option value="MCO">MCO · Mediapunta</option>
                <option value="EI">EI · Extremo Izquierdo</option>
                <option value="ED">ED · Extremo Derecho</option>
                <option value="DC">DC · Delantero Centro</option>
              </select>
            </div>

            {/* País */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                País / Liga:
              </label>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setDivisionFilter('ALL');
                  setClubFilter('ALL');
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">🌍 Todos los Países</option>
                {COUNTRIES_CATALOG.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.nameEs}
                  </option>
                ))}
              </select>
            </div>

            {/* División Específica */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Categoría / División:
              </label>
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value);
                  setClubFilter('ALL');
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Todas las Categorías</option>
                {DIVISIONS_CATALOG.filter(
                  (d) => countryFilter === 'ALL' || d.country === countryFilter
                ).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.flag} {d.name} ({d.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Club */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Club Específico:
              </label>
              <select
                value={clubFilter}
                onChange={(e) => {
                  setClubFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Todos los Clubes ({availableClubsForFilter.length})</option>
                {availableClubsForFilter.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Filtros de Rendimiento (Media, Potencial, Edad) y Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            {/* Rango de Media */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Nivel de Media (OVR):
              </label>
              <select
                value={ovrRange}
                onChange={(e) => {
                  setOvrRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Cualquier Media</option>
                <option value="88+">🔥 88+ Superestrellas Mundiales</option>
                <option value="83-87">⭐ 83-87 Élite Europea</option>
                <option value="78-82">🔷 78-82 Primera División</option>
                <option value="70-77">🔸 70-77 Segunda / Tercera</option>
                <option value="<70">🌱 Menor de 70 (Base/Cantera)</option>
              </select>
            </div>

            {/* Rango de Potencial */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Techo de Potencial (POT):
              </label>
              <select
                value={potRange}
                onChange={(e) => {
                  setPotRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Cualquier Potencial</option>
                <option value="90+">🌟 90+ Prodigio Mundial</option>
                <option value="85+">💎 85+ Promesa Élite</option>
                <option value="80+">⚡ 80+ Alto Desarrollo</option>
                <option value="<80">🛡️ Menor de 80 Consolidado</option>
              </select>
            </div>

            {/* Rango de Edad */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Rango de Edad:
              </label>
              <select
                value={ageRange}
                onChange={(e) => {
                  setAgeRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Cualquier Edad</option>
                <option value="u21">🌱 Sub-21 (Jóvenes Promesas)</option>
                <option value="22-25">⚡ 22 a 25 años (En ascenso)</option>
                <option value="26-29">👑 26 a 29 años (Prime absoluto)</option>
                <option value="30+">🛡️ 30+ años (Veteranos con oficio)</option>
              </select>
            </div>

            {/* Botón Restablecer */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          </div>

          {/* Fila 4: Toggles y Checkboxes rápidos */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => {
                setOnlyAffordable(!onlyAffordable);
                setCurrentPage(1);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5',
                onlyAffordable
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Asequibles para mi presupuesto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyWithWeapons(!onlyWithWeapons);
                setCurrentPage(1);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5',
                onlyWithWeapons
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Solo con Armas Blue Lock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyTransferListed(!onlyTransferListed);
                setCurrentPage(1);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5',
                onlyTransferListed
                  ? 'bg-amber-950 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Solo Transferibles (Puestos en venta)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE ORDENACIÓN, TAMAÑO DE PÁGINA Y CONTADOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3">
        {/* Contador de resultados */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-xl">
            {totalItems} futbolistas
          </span>
          <span className="text-slate-400">
            {totalItems > 0 ? (
              <>
                Mostrando <strong className="text-white">{(validCurrentPage - 1) * effectivePageSize + 1}</strong> -{' '}
                <strong className="text-white">
                  {Math.min(validCurrentPage * effectivePageSize, totalItems)}
                </strong>
              </>
            ) : (
              'Ningún resultado'
            )}
          </span>
        </div>

        {/* Controles de orden y cantidad por página */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold text-[11px]">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
            >
              <option value="ovr_desc">Mayor Media (OVR) ↓</option>
              <option value="pot_desc">Mayor Potencial (POT) ↓</option>
              <option value="price_asc">Menor Precio (Ganga) ↑</option>
              <option value="price_desc">Mayor Precio (Estrellas) ↓</option>
              <option value="growth_desc">Mayor Margen de Crecimiento ↓</option>
              <option value="age_asc">Más Jóvenes ↑</option>
              <option value="name_asc">Nombre A-Z</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold text-[11px]">Ver:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
            >
              <option value={25}>25 por pág</option>
              <option value={50}>50 por pág</option>
              <option value={100}>100 por pág</option>
              <option value={-1}>Todos ({totalItems})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLA DE JUGADORES EN EL MERCADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* VISTA ESCRITORIO (PC) - 100% INTACTA */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-2.5 sm:p-3.5 w-10 sm:w-12">Pos</th>
                <th className="p-2.5 sm:p-3.5 min-w-[130px] sm:min-w-[180px]">Futbolista</th>
                <th className="p-3.5 hidden sm:table-cell">Club / Liga</th>
                <th className="p-3.5 hidden sm:table-cell text-center">Edad</th>
                <th className="p-2.5 sm:p-3.5 text-center">Media</th>
                <th className="p-2.5 sm:p-3.5 text-center">Potencial</th>
                <th className="p-2.5 sm:p-3.5">Valor Mercado</th>
                <th className="p-3.5 hidden md:table-cell">Salario Est.</th>
                <th className="p-2.5 sm:p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 text-xs">
                    No se han encontrado futbolistas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((p) => {
                  const club = clubsMap.get(p.clubId);
                  const isMyPlayer = p.clubId === userClubId;
                  const tier = getPotentialTier(p.potential);
                  const canAfford = userClub ? userClub.budgetYen >= p.marketValueYen : true;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Posición */}
                      <td className="p-2.5 sm:p-3.5">
                        <span className={clsx('px-1.5 sm:px-2 py-0.5 rounded border font-bold text-[9px] sm:text-[10px]', getPositionColor(p.position))}>
                          {p.position}
                        </span>
                      </td>

                      {/* Nombre y Nacionalidad */}
                      <td className="p-2.5 sm:p-3.5">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setInspectingPlayer(p)}
                            className="font-bold text-white text-xs sm:text-sm hover:text-cyan-400 cursor-pointer text-left transition-colors hover:underline truncate max-w-[130px] sm:max-w-none"
                            title={`Abrir expediente de ${p.name}`}
                          >
                            {p.name}
                          </button>
                          {p.weapons && p.weapons.length > 0 && (
                            <span
                              className="text-[9px] sm:text-[10px] text-cyan-400 bg-cyan-950 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold inline-flex items-center gap-0.5"
                              title={`Arma: ${p.weapons[0].name}`}
                            >
                              ⚡ <span className="hidden sm:inline">{p.weapons[0].name}</span>
                            </span>
                          )}
                          {p.isTransferListed && (
                            <span className="text-[8px] sm:text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                              En Venta
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{p.nationality}</span>
                          <span className="sm:hidden text-slate-300 font-semibold">· {club?.shortName || club?.name || 'Libre'}</span>
                          {p.secondaryPosition && (
                            <span className="hidden sm:inline">· 2ª: {p.secondaryPosition}</span>
                          )}
                        </div>
                      </td>

                      {/* Club y División */}
                      <td className="p-3.5 hidden sm:table-cell">
                        <div className="font-bold text-slate-200">{club?.name || 'Agente Libre'}</div>
                        <div className="text-[10px] text-slate-400">
                          {club?.country ? `${club.country} · T${club.tier || 1}` : 'Sin equipo'}
                        </div>
                      </td>

                      {/* Edad */}
                      <td className="p-3.5 text-center font-mono text-slate-300 hidden sm:table-cell">
                        {p.age} <span className="text-[10px] text-slate-500">años</span>
                      </td>

                      {/* Media (OVR) */}
                      <td className="p-2.5 sm:p-3.5 text-center">
                        <span className="font-mono font-black text-white text-xs sm:text-sm bg-slate-950 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl border border-slate-800">
                          {p.overall}
                        </span>
                      </td>

                      {/* Potencial (POT) */}
                      <td className="p-2.5 sm:p-3.5 text-center">
                        <span className={clsx('px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border text-[11px] sm:text-xs font-black inline-flex items-center gap-1', tier.color)}>
                          <span>{tier.icon}</span>
                          <span>{p.potential}</span>
                        </span>
                      </td>

                      {/* Valor de Mercado */}
                      <td className="p-2.5 sm:p-3.5 font-mono font-black text-emerald-400 text-xs sm:text-sm">
                        {formatMoney(p.marketValueYen, selectedCurrency)}
                      </td>

                      {/* Salario */}
                      <td className="p-3.5 font-mono text-slate-400 text-xs hidden md:table-cell">
                        {formatMoney(p.weeklyWageYen, selectedCurrency)}/sem
                      </td>

                      {/* Acción */}
                      <td className="p-2.5 sm:p-3.5 text-right">
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
                            className={clsx(
                              'px-2.5 sm:px-3.5 py-1.5 font-bold text-xs rounded-xl shadow transition-all',
                              canAfford
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            )}
                          >
                            <span className="hidden sm:inline">Pujar / Ofertar</span>
                            <span className="sm:hidden">Pujar</span>
                          </button>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold bg-slate-950 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-slate-800">
                            En plantilla
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL (PANTALLAS PEQUEÑAS) - TARJETAS DETALLADAS Y CÓMODAS */}
        <div className="sm:hidden divide-y divide-slate-800/80">
          {paginatedPlayers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No se han encontrado futbolistas que coincidan con los filtros seleccionados.
            </div>
          ) : (
            paginatedPlayers.map((p) => {
              const club = clubsMap.get(p.clubId);
              const isMyPlayer = p.clubId === userClubId;
              const tier = getPotentialTier(p.potential);
              const canAfford = userClub ? userClub.budgetYen >= p.marketValueYen : true;

              return (
                <div key={p.id} className="p-3.5 space-y-3 bg-slate-900/60 hover:bg-slate-800/30 transition-colors">
                  {/* Encabezado: Posición, Nombre completo sin truncar, Ficha */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={clsx('px-2 py-0.5 rounded border font-bold text-[10px] shrink-0 mt-0.5', getPositionColor(p.position))}>
                        {p.position}
                      </span>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setInspectingPlayer(p)}
                          className="font-bold text-white text-sm hover:text-cyan-400 text-left transition-colors break-words leading-snug"
                        >
                          {p.name}
                        </button>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{p.nationality}</span>
                          <span className="text-slate-300 font-medium">· {club?.name || 'Agente Libre'}</span>
                          <span className="text-slate-500 font-mono">· {p.age} años</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingPlayer(p)}
                      className="text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-2 py-1 rounded-lg shrink-0 font-bold hover:bg-cyan-900/60"
                    >
                      Ficha
                    </button>
                  </div>

                  {/* Armas Blue Lock o En Venta si corresponde */}
                  {((p.weapons && p.weapons.length > 0) || p.isTransferListed) && (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      {p.weapons && p.weapons.length > 0 && (
                        <span className="text-[10px] text-cyan-400 bg-cyan-950 border border-cyan-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                          ⚡ {p.weapons[0].name}
                        </span>
                      )}
                      {p.isTransferListed && (
                        <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold">
                          🔥 En Venta
                        </span>
                      )}
                    </div>
                  )}

                  {/* Métricas clave: Media, Potencial, Crecimiento */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans">Media</span>
                      <span className="font-black text-white text-base">{p.overall}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans">Potencial</span>
                      <span className={clsx('text-[11px] font-black px-1.5 py-0.5 rounded border inline-block mt-0.5', tier.color)}>
                        {tier.icon} {p.potential}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans">Margen</span>
                      <span className="font-bold text-xs text-emerald-400 block mt-0.5">
                        +{p.potential - p.overall} pts
                      </span>
                    </div>
                  </div>

                  {/* Fila Financiera y Botón de Acción */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Valor de Mercado</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {formatMoney(p.marketValueYen, selectedCurrency)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {formatMoney(p.weeklyWageYen, selectedCurrency)}/sem
                      </span>
                    </div>

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
                        className={clsx(
                          'px-4 py-2 font-black text-xs rounded-xl shadow-lg transition-all',
                          canAfford
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        )}
                      >
                        Pujar / Ofertar
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        En tu plantilla
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. CONTROLES DE PAGINACIÓN */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-center sm:text-left">
              Página <strong className="text-white">{validCurrentPage}</strong> de{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center justify-center gap-1 flex-wrap">
              {/* Primera página */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 hidden sm:inline-flex"
                title="Primera Página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Anterior */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Ant</span>
              </button>

              {/* Números de página */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (validCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (validCurrentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = validCurrentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={clsx(
                        'w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono text-xs font-bold transition-all',
                        validCurrentPage === pageNum
                          ? 'bg-cyan-500 text-black'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Siguiente */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 font-bold flex items-center gap-1"
              >
                <span>Sig</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Última página */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 hidden sm:inline-flex"
                title="Última Página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* VISTA DE MOVIMIENTOS Y FICHAJES DE CLUBES RIVALES */}
      {marketSubTab === 'rival_feed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Mercado de Fichajes de Clubes Rivales
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Movimientos oficiales entre clubes, inversiones de equipos ascendidos y sustituciones urgentes por traspasos.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full self-start sm:self-auto font-bold">
              {recentTransfers.length} Operaciones registradas
            </span>
          </div>

          {recentTransfers.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Sparkles className="w-10 h-10 mx-auto text-slate-700 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">Aún no hay traspasos entre clubes registrados en esta temporada</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Los equipos rivales salen a fichar activamente durante las ventanas de mercado abiertas (J1-6, J22-28 y al comenzar pretemporada tras los ascensos).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentTransfers.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    'p-4 rounded-2xl border transition-all text-xs flex flex-col justify-between gap-3 shadow-md',
                    item.isImportant
                      ? 'bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 border-cyan-500/40 hover:border-cyan-400/70'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-1 rounded-lg bg-slate-800 text-cyan-400 font-mono font-black text-xs shrink-0">
                        {item.playerPosition}
                      </span>
                      <div>
                        <div className="font-black text-white text-sm flex items-center gap-2 flex-wrap">
                          <span>{item.playerName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                            OVR {item.playerOverall}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-300 font-medium">{item.fromClubName}</span>
                          <span className="text-cyan-400 font-bold">→</span>
                          <span className="font-bold text-emerald-400">{item.toClubName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-yellow-400">
                        {formatMoney(item.feeYen, selectedCurrency)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.dateStr}</div>
                    </div>
                  </div>

                  {item.isImportant && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        ⭐ Refuerzo Destacado de Categoría
                      </span>
                      <span className="text-slate-400 italic">Traspaso Oficial</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL DE PUJA Y FICHAJE */}
      {selectedMarketPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-fadeIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block font-mono">
                  Negociación Oficial
                </span>
                <h3 className="text-lg font-black text-white">Fichar a {selectedMarketPlayer.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMarketPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Posición / Media:</span>
                  <span className="text-white font-black text-sm">
                    {selectedMarketPlayer.position} · OVR {selectedMarketPlayer.overall}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Potencial:</span>
                  <span className="text-cyan-400 font-mono font-black text-sm">
                    {selectedMarketPlayer.potential}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Valor de Mercado:</span>
                  <span className="text-emerald-400 font-mono font-black text-sm">
                    {formatMoney(selectedMarketPlayer.marketValueYen, selectedCurrency)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 block font-bold text-xs">
                    Oferta de Traspaso al Club ({currencyCfg.name}):
                  </label>
                  {userClub && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tu Presupuesto: <strong className="text-cyan-400">{formatMoney(userClub.budgetYen, selectedCurrency)}</strong>
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-cyan-400 font-bold font-mono text-sm pointer-events-none select-none">
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-sm tracking-widest transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 block font-bold text-xs">
                    Salario Semanal Ofrecido ({currencyCfg.name}/sem):
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Sueldo actual: <strong className="text-yellow-400">{formatMoney(selectedMarketPlayer.weeklyWageYen, selectedCurrency)}/sem</strong>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-yellow-400 font-bold font-mono text-sm pointer-events-none select-none">
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-sm tracking-widest transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Años de Contrato Ofrecidos:</label>
                <select
                  value={offerYears}
                  onChange={(e) => setOfferYears(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
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
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black rounded-xl text-xs shadow-lg transition-all"
              >
                Enviar Oferta Formal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DE EXPEDIENTE DEL JUGADOR */}
      {inspectingPlayer && (
        <PlayerDetailModal
          player={inspectingPlayer}
          onClose={() => setInspectingPlayer(null)}
        />
      )}
    </div>
  );
};
