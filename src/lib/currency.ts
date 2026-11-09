export type Currency = 'EUR' | 'USD' | 'JPY' | 'GBP';

export interface CurrencyConfig {
  code: Currency;
  name: string;
  symbol: string;
  rateFromYen: number; // Tasa de conversión respecto al Yen
  symbolPosition: 'prefix' | 'suffix';
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    name: 'Euro (€)',
    symbol: '€',
    rateFromYen: 1 / 160,
    symbolPosition: 'prefix',
  },
  USD: {
    code: 'USD',
    name: 'Dólar Estadounidense ($)',
    symbol: '$',
    rateFromYen: 1 / 150,
    symbolPosition: 'prefix',
  },
  JPY: {
    code: 'JPY',
    name: 'Yen Japonés (¥)',
    symbol: '¥',
    rateFromYen: 1,
    symbolPosition: 'prefix',
  },
  GBP: {
    code: 'GBP',
    name: 'Libra Esterlina (£)',
    symbol: '£',
    rateFromYen: 1 / 190,
    symbolPosition: 'prefix',
  },
};

/**
 * Formatea una cantidad en Yenes a la divisa seleccionada con separadores de miles.
 */
export function formatMoney(amountYen: number, currency: Currency = 'EUR'): string {
  const cfg = CURRENCIES[currency] || CURRENCIES.EUR;
  const isNegative = amountYen < 0;
  const positiveAmount = Math.abs(amountYen);
  const converted = Math.round(positiveAmount * cfg.rateFromYen);

  const formattedNum = converted.toLocaleString('es-ES');
  const sign = isNegative ? '-' : '';

  return cfg.symbolPosition === 'prefix'
    ? `${sign}${cfg.symbol}${formattedNum}`
    : `${sign}${formattedNum} ${cfg.symbol}`;
}

/**
 * Formato compacto abreviado (ej: €1.2M, $850K, ¥150M)
 */
export function formatCompactMoney(amountYen: number, currency: Currency = 'EUR'): string {
  const cfg = CURRENCIES[currency] || CURRENCIES.EUR;
  const isNegative = amountYen < 0;
  const positiveAmount = Math.abs(amountYen);
  const val = positiveAmount * cfg.rateFromYen;
  const sign = isNegative ? '-' : '';

  if (val >= 1_000_000_000) {
    return `${sign}${cfg.symbol}${(val / 1_000_000_000).toFixed(1)}B`;
  }
  if (val >= 1_000_000) {
    return `${sign}${cfg.symbol}${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `${sign}${cfg.symbol}${(val / 1_000).toFixed(0)}K`;
  }
  return `${sign}${cfg.symbol}${Math.round(val).toLocaleString('es-ES')}`;
}

/**
 * Convierte un valor de la divisa seleccionada de vuelta a Yenes (para guardar en BD/store)
 */
export function convertToYen(amountInCurrency: number, currency: Currency = 'EUR'): number {
  const cfg = CURRENCIES[currency] || CURRENCIES.EUR;
  return Math.round(amountInCurrency / cfg.rateFromYen);
}

/**
 * Convierte un valor en Yenes al valor numérico en la divisa seleccionada
 */
export function convertFromYen(amountYen: number, currency: Currency = 'EUR'): number {
  const cfg = CURRENCIES[currency] || CURRENCIES.EUR;
  return Math.round(amountYen * cfg.rateFromYen);
}

/**
 * Convierte cualquier mención de cantidades en Yenes en un texto (ej: "40.000.000 ¥", "120.000.000 ¥", "15.000.000 ¥")
 * a la divisa seleccionada respetando el formato configurado.
 */
export function formatTextWithCurrency(text: string, currency: Currency = 'EUR'): string {
  if (!text) return text;
  // Detecta patrones como:
  // "40.000.000 ¥", "40,000,000 ¥", "40000000 ¥", "¥40.000.000", "¥ 40.000.000"
  return text.replace(/(?:¥\s*([\d\.,]+)|([\d\.,]+)\s*¥)/gi, (match, prefixAmount, suffixAmount) => {
    const rawStr = prefixAmount || suffixAmount;
    const cleanNum = parseInt(rawStr.replace(/[\.,\s]/g, ''), 10);
    if (isNaN(cleanNum)) return match;
    return formatMoney(cleanNum, currency);
  });
}

