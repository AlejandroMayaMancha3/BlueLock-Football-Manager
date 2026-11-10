import { Club, ClubLedgerEntry, TierLevel } from '@/types/football-manager';
import { EUR_TO_YEN } from './player-valuation';

export interface MatchdayFinancialReport {
  ticketRevenueYen: number;
  tvRevenueYen: number;
  sponsorRevenueYen: number;
  operatingCostsYen: number;
  totalIncomeYen: number;
  totalExpensesYen: number;
  netWeeklyYen: number;
  attendance: number;
  ledgerEntries: ClubLedgerEntry[];
}

/**
 * Coeficientes financieros realistas por categoría (Tier 1 a 4)
 * Escalan según el nivel competitivo, derechos de TV internacionales y patrocinadores.
 */
export const TIER_FINANCIAL_BASES: Record<
  TierLevel,
  {
    baseTvPerRoundEur: number;
    baseSponsorPerRoundEur: number;
    awayMatchStipendEur: number;
    baseOperatingCostsEur: number;
    seasonSponsorRenewalEur: number;
    championPrizeEur: number;
    lastPlacePrizeEur: number;
  }
> = {
  1: {
    // 1.ª División (LaLiga, Premier League, Bundesliga, Serie A, Ligue 1)
    baseTvPerRoundEur: 2200000,        // ~2.2M € por jornada
    baseSponsorPerRoundEur: 1200000,   // ~1.2M € comercial semanal
    awayMatchStipendEur: 320000,       // Porcentaje de taquilla / subvención visitante
    baseOperatingCostsEur: 180000,     // Mantenimiento de instalaciones
    seasonSponsorRenewalEur: 38000000, // Patrocinio principal anual
    championPrizeEur: 80000000,        // 80M € al campeón
    lastPlacePrizeEur: 7000000,        // 7M € al 24.º
  },
  2: {
    // 2.ª División (Hypermotion, Championship, 2. Bundesliga, Serie B, Ligue 2)
    baseTvPerRoundEur: 420000,
    baseSponsorPerRoundEur: 220000,
    awayMatchStipendEur: 60000,
    baseOperatingCostsEur: 40000,
    seasonSponsorRenewalEur: 8500000,
    championPrizeEur: 18000000,
    lastPlacePrizeEur: 2000000,
  },
  3: {
    // 3.ª Categoría (Primera RFEF, League One, 3. Liga, Serie C, National)
    baseTvPerRoundEur: 75000,
    baseSponsorPerRoundEur: 42000,
    awayMatchStipendEur: 12000,
    baseOperatingCostsEur: 9000,
    seasonSponsorRenewalEur: 1600000,
    championPrizeEur: 3500000,
    lastPlacePrizeEur: 450000,
  },
  4: {
    // 4.ª Categoría (Segunda RFEF, League Two, Regionalliga, etc.)
    baseTvPerRoundEur: 18000,
    baseSponsorPerRoundEur: 11000,
    awayMatchStipendEur: 3000,
    baseOperatingCostsEur: 2500,
    seasonSponsorRenewalEur: 380000,
    championPrizeEur: 850000,
    lastPlacePrizeEur: 100000,
  },
};

/**
 * Calcula la tabla completa de premios de liga (24 puestos) para un Tier específico
 */
export function getTierPrizePoolYen(tier: TierLevel): number[] {
  const cfg = TIER_FINANCIAL_BASES[tier] || TIER_FINANCIAL_BASES[1];
  const champEur = cfg.championPrizeEur;
  const lastEur = cfg.lastPlacePrizeEur;

  // Curva decreciente suave para las 24 posiciones
  const pool: number[] = [];
  for (let pos = 1; pos <= 24; pos++) {
    // Interpolación no lineal (los primeros puestos tienen premios significativamente más altos)
    const factor = Math.pow((24 - pos) / 23, 1.45);
    const posEur = Math.round(lastEur + (champEur - lastEur) * factor);
    pool.push(Math.round(posEur * EUR_TO_YEN));
  }
  return pool;
}

/**
 * Calcula la renovación de patrocinio principal para una nueva temporada
 */
export function getSeasonRenewalSponsorYen(tier: TierLevel, reputation: number): number {
  const cfg = TIER_FINANCIAL_BASES[tier] || TIER_FINANCIAL_BASES[1];
  const repFactor = Math.min(1.4, Math.max(0.7, (reputation || 70) / 75));
  const sponsorEur = Math.round(cfg.seasonSponsorRenewalEur * repFactor);
  return Math.round(sponsorEur * EUR_TO_YEN);
}

/**
 * Calcula todos los ingresos y gastos de una jornada de liga (Taquilla, Derechos TV, Patrocinios y Operativa)
 */
export function calculateMatchdayFinances(
  club: Club,
  isHome: boolean,
  round: number,
  season: number,
  totalWeeklyWageYen: number
): MatchdayFinancialReport {
  const tier = (club.tier || 1) as TierLevel;
  const cfg = TIER_FINANCIAL_BASES[tier] || TIER_FINANCIAL_BASES[1];
  const repFactor = Math.min(1.35, Math.max(0.75, (club.reputation || 70) / 75));

  // 1. Ingresos por Taquilla (Local vs Visitante)
  let attendance = 0;
  let ticketRevenueYen = 0;

  if (isHome) {
    attendance = Math.round(club.stadiumCapacity * (0.75 + Math.random() * 0.23));
    ticketRevenueYen = attendance * club.ticketPriceYen;
  } else {
    // Porcentaje de taquilla compartida / subsidio de visitante
    const awayStipendEur = Math.round(cfg.awayMatchStipendEur * repFactor);
    ticketRevenueYen = Math.round(awayStipendEur * EUR_TO_YEN);
  }

  // 2. Derechos de Televisión por jornada (Recibidos en todas las jornadas retransmitidas)
  const tvEur = Math.round(cfg.baseTvPerRoundEur * repFactor);
  const tvRevenueYen = Math.round(tvEur * EUR_TO_YEN);

  // 3. Patrocinio Comercial y Merchandising semanal
  const sponsorEur = Math.round(cfg.baseSponsorPerRoundEur * repFactor);
  const sponsorRevenueYen = Math.round(sponsorEur * EUR_TO_YEN);

  // 4. Costes operativos del estadio y logística
  const travelCostEur = isHome ? 0 : Math.round(cfg.baseOperatingCostsEur * 0.5);
  const operatingCostsEur = cfg.baseOperatingCostsEur + travelCostEur;
  const operatingCostsYen = Math.round(operatingCostsEur * EUR_TO_YEN);

  // Totales
  const totalIncomeYen = ticketRevenueYen + tvRevenueYen + sponsorRevenueYen;
  const totalExpensesYen = totalWeeklyWageYen + operatingCostsYen;
  const netWeeklyYen = totalIncomeYen - totalExpensesYen;

  // Asientos del Libro de Contabilidad
  const ledgerEntries: ClubLedgerEntry[] = [];
  const dateStr = `Jornada ${round}`;

  // Taquilla
  if (isHome) {
    ledgerEntries.push({
      id: `led-t-${round}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      season,
      round,
      type: 'taquilla',
      concept: `Taquilla J${round} (${attendance.toLocaleString()} espectadores)`,
      amountYen: ticketRevenueYen,
      dateStr,
    });
  } else if (ticketRevenueYen > 0) {
    ledgerEntries.push({
      id: `led-t-away-${round}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      season,
      round,
      type: 'taquilla',
      concept: `Liquidación Taquilla y Desplazamiento Visitante J${round}`,
      amountYen: ticketRevenueYen,
      dateStr,
    });
  }

  // Derechos de TV
  ledgerEntries.push({
    id: `led-tv-${round}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    season,
    round,
    type: 'tv',
    concept: `Derechos de Retransmisión Televisiva J${round}`,
    amountYen: tvRevenueYen,
    dateStr,
  });

  // Patrocinio y Tienda
  ledgerEntries.push({
    id: `led-sp-${round}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    season,
    round,
    type: 'patrocinio',
    concept: `Patrocinio Comercial y Ventas de Merchandising J${round}`,
    amountYen: sponsorRevenueYen,
    dateStr,
  });

  // Salarios
  ledgerEntries.push({
    id: `led-w-${round}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    season,
    round,
    type: 'salarios',
    concept: `Pago de Salarios Semanales (Plantilla)`,
    amountYen: -totalWeeklyWageYen,
    dateStr,
  });

  return {
    ticketRevenueYen,
    tvRevenueYen,
    sponsorRevenueYen,
    operatingCostsYen,
    totalIncomeYen,
    totalExpensesYen,
    netWeeklyYen,
    attendance,
    ledgerEntries,
  };
}

/**
 * RECONCILIACIÓN ESTRICTA DE TESORERÍA (Soluciona el desfase entre saldo en caja y presupuesto de fichajes)
 *
 * En el fútbol real y en Football Manager:
 * 1. El presupuesto de fichajes NUNCA puede ser superior a la liquidez real disponible en caja.
 * 2. Si el club tiene saldo negativo en caja pero tiene saldo en transferencias, la directiva
 *    absorbe inmediatamente la deuda operativa con los fondos no gastados de fichajes.
 * 3. Si la caja queda en números rojos y no hay fondos de fichajes, el presupuesto para fichar
 *    se congela en 0 (la directiva no permite gastar dinero inexistente).
 */
export function reconcileClubTreasury(club: Club): {
  reconciledClub: Club;
  wasAdjusted: boolean;
  adjustmentLedgerEntry?: ClubLedgerEntry;
} {
  let cashYen = club.cashYen;
  let budgetYen = club.budgetYen;
  let wasAdjusted = false;
  let adjustmentLedgerEntry: ClubLedgerEntry | undefined;

  // CASO 1: Saldo en caja negativo (deuda operativa), pero el club tiene fondos acumulados en fichajes
  if (cashYen < 0 && budgetYen > 0) {
    const debtYen = Math.abs(cashYen);
    const netPoolYen = budgetYen - debtYen;

    if (netPoolYen > 0) {
      // Los fondos de fichajes cubren la totalidad de la deuda y sobra dinero
      // La directiva deja la caja saneada y el presupuesto de fichajes acorde a la liquidez real
      cashYen = netPoolYen;
      budgetYen = Math.round(cashYen * 0.75); // 75% para fichar, 25% para colchón de caja
    } else {
      // Los fondos de fichajes se agotan para reducir la deuda al mínimo
      cashYen = netPoolYen; // Quedará cerca de 0 o un remanente
      budgetYen = 0;
    }

    wasAdjusted = true;
    adjustmentLedgerEntry = {
      id: `led-reconcile-${Date.now()}-${club.id}`,
      season: 1,
      round: 1,
      type: 'rebalanceo',
      concept: `Reajuste de Tesorería Directiva: Liquidación de deuda operativa con fondos de reserva`,
      amountYen: debtYen,
      dateStr: 'Intervención Directiva',
    };
  } else if (cashYen <= 0) {
    // Si la caja sigue en números rojos sin fondos para cubrirla, congelar fichajes
    if (budgetYen > 0) {
      budgetYen = 0;
      wasAdjusted = true;
    }
  } else {
    // CASO 2: El saldo en caja es positivo, pero el presupuesto de fichajes supera la liquidez total en el banco
    if (budgetYen > cashYen) {
      budgetYen = Math.round(cashYen * 0.85);
      wasAdjusted = true;
    }
  }

  const reconciledClub: Club = {
    ...club,
    cashYen,
    budgetYen,
  };

  return { reconciledClub, wasAdjusted, adjustmentLedgerEntry };
}
