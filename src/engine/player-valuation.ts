import { Player, Position, Weapon } from '@/types/football-manager';

export const EUR_TO_YEN = 160;

/**
 * Calcula el valor base en Euros según la media (Overall).
 * Sigue una curva exponencial realista de mercado futbolístico internacional.
 */
function getBaseValueEur(ovr: number): number {
  if (ovr <= 50) return Math.max(35000, 35000 + (ovr - 40) * 3500);
  if (ovr <= 58) return 70000 + (ovr - 50) * 15000;         // 55 -> 145k €
  if (ovr <= 65) return 190000 + (ovr - 58) * 85000;        // 60 -> 360k €, 65 -> 785k €
  if (ovr <= 72) return 800000 + (ovr - 65) * 350000;       // 70 -> 2.55M €, 72 -> 3.25M €
  if (ovr <= 78) return 3250000 + (ovr - 72) * 1200000;     // 75 -> 6.85M €, 78 -> 10.45M €
  if (ovr <= 83) return 10500000 + (ovr - 78) * 3800000;    // 80 -> 18.1M €, 83 -> 29.5M €
  if (ovr <= 87) return 30000000 + (ovr - 83) * 9000000;    // 85 -> 48M €, 87 -> 66M €
  if (ovr <= 91) return 66000000 + (ovr - 87) * 15000000;   // 88 -> 81M €, 90 -> 111M €
  if (ovr <= 95) return 126000000 + (ovr - 91) * 25000000;  // 92 -> 151M €, 94 -> 201M €
  return 226000000 + (ovr - 95) * 45000000;                 // 96+ -> 271M+ €
}

export interface ValuationInput {
  overall: number;
  potential: number;
  age: number;
  weapons?: Weapon[];
  egoRating?: number;
  position?: Position;
}

/**
 * Calcula el valor de mercado en Yenes y salario semanal equilibrados
 * teniendo en cuenta:
 * 1. Media (Overall)
 * 2. Potencial (Margen de crecimiento y techo absoluto)
 * 3. Edad (Jóvenes con prima de futuro, veteranos con depreciación de reventa)
 * 4. Armas y Factor Ego
 */
export function calculatePlayerMarketValue(input: ValuationInput): {
  marketValueYen: number;
  weeklyWageYen: number;
  marketValueEur: number;
  weeklyWageEur: number;
} {
  const { overall, potential, age, weapons, egoRating } = input;

  // 1. Valor base por media
  const baseEur = getBaseValueEur(overall);

  // 2. Multiplicador de Potencial y Proyección
  const effectivePot = Math.max(overall, potential);
  const potDiff = effectivePot - overall;
  const growthMultiplier = 1 + potDiff * 0.045; // Cada punto de potencial extra suma +4.5%

  let ceilingBonus = 1.0;
  if (effectivePot >= 95) ceilingBonus = 1.40;
  else if (effectivePot >= 90) ceilingBonus = 1.25;
  else if (effectivePot >= 85) ceilingBonus = 1.15;
  else if (effectivePot >= 80) ceilingBonus = 1.05;

  // 3. Multiplicador de Edad
  let ageMultiplier = 1.0;
  if (age <= 18) {
    ageMultiplier = effectivePot >= 85 ? 1.45 : 1.20;
  } else if (age <= 21) {
    ageMultiplier = effectivePot >= 85 ? 1.30 : 1.15;
  } else if (age <= 25) {
    ageMultiplier = 1.15;
  } else if (age <= 28) {
    ageMultiplier = 1.0; // Prime absoluto
  } else if (age <= 30) {
    ageMultiplier = 0.90;
  } else if (age <= 32) {
    ageMultiplier = 0.72;
  } else if (age <= 34) {
    ageMultiplier = 0.52;
  } else {
    ageMultiplier = 0.32; // Veterano +35
  }

  // 4. Armas y Ego
  let traitsBonus = 1.0;
  if (weapons && weapons.length > 0) traitsBonus += 0.08;
  if (egoRating && egoRating >= 90) traitsBonus += 0.06;

  // Cálculo final en EUR
  const finalEur = Math.round(baseEur * growthMultiplier * ceilingBonus * ageMultiplier * traitsBonus);
  const marketValueEur = Math.max(35000, finalEur);

  // Conversión a Yenes
  const marketValueYen = Math.round(marketValueEur * EUR_TO_YEN);

  // Salario semanal equilibrado (~7% anual del valor de mercado dividido en 52 semanas)
  const baseWeeklyWageEur = Math.max(350, Math.round(marketValueEur / 720));
  const weeklyWageEur = Math.min(Math.round(baseWeeklyWageEur), 450000); // Tope de 450k/semana
  const weeklyWageYen = Math.round(weeklyWageEur * EUR_TO_YEN);

  return {
    marketValueYen,
    weeklyWageYen,
    marketValueEur,
    weeklyWageEur,
  };
}

/**
 * Normaliza y actualiza los valores de mercado y salarios de un conjunto de jugadores
 * aplicando la fórmula equilibrada basada en media, potencial y edad.
 */
export function normalizePlayerValuations(players: Player[]): Player[] {
  return players.map((player) => {
    const { marketValueYen, weeklyWageYen } = calculatePlayerMarketValue({
      overall: player.overall,
      potential: player.potential,
      age: player.age,
      weapons: player.weapons,
      egoRating: player.egoRating,
      position: player.position,
    });

    return {
      ...player,
      marketValueYen,
      weeklyWageYen,
    };
  });
}
