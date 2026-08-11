import { HistoricalPricePoint, FinancialSnapshot, IndicatorSnapshot, VerificationSnapshot, CatalystSnapshot } from '../scoring/scoring-types';

export interface StrategyBars {
  closes: number[];
  highs: number[];
  lows: number[];
  volumes: number[];
}

export function toBars(prices: HistoricalPricePoint[]): StrategyBars {
  const closes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const volumes: number[] = [];
  for (const p of prices) {
    closes.push(p.close);
    highs.push(p.high ?? p.close);
    lows.push(p.low ?? p.close);
    volumes.push(p.volume);
  }
  return { closes, highs, lows, volumes };
}

export function smaLast(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function emaLast(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let prev = seed;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
  }
  return prev;
}

export function rsiLast(closes: number[], period: number = 14): number | null {
  if (closes.length <= period) return null;
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  const slice = changes.slice(-period);
  let gains = 0;
  let losses = 0;
  for (const c of slice) {
    if (c >= 0) gains += c;
    else losses += -c;
  }
  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

export function macdLast(closes: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
  if (closes.length < 35) return { macd: null, signal: null, histogram: null };
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdValues: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] == null || ema26[i] == null) {
      macdValues.push(NaN);
    } else {
      macdValues.push(ema12[i]! - ema26[i]!);
    }
  }
  const validMacd = macdValues.map((v) => (isNaN(v) ? null : v));
  const macd = validMacd[validMacd.length - 1] ?? null;
  const signalValues = emaFromSeries(validMacd, 9);
  const signal = signalValues[signalValues.length - 1] ?? null;
  const histogram = macd != null && signal != null ? macd - signal : null;
  return { macd, signal, histogram };
}

function emaSeries(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (values.length < period) return result;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  let prev = seed / period;
  result.push(...Array(period - 1).fill(null), prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function emaFromSeries(values: (number | null)[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let prev: number | null = null;
  let seed: number | null = null;
  const k = 2 / (period + 1);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) {
      result.push(null);
      continue;
    }
    if (seed == null) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const vj = values[j];
        if (vj == null) {
          result.push(null);
          prev = null;
          seed = null;
          break;
        }
        sum += vj;
      }
      if (prev === null && seed === null) {
        seed = 0;
        prev = sum / period;
        result.push(prev);
      }
    } else if (prev !== null) {
      prev = v * k + prev * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

export function rocLast(closes: number[], period: number = 12): number | null {
  if (closes.length <= period) return null;
  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - period];
  if (past === 0) return null;
  return (current - past) / past * 100;
}

export function atrLast(bars: StrategyBars, period: number = 14): number | null {
  if (bars.closes.length < 2) return null;
  const trs: number[] = [];
  for (let i = 1; i < bars.closes.length; i++) {
    const h = bars.highs[i];
    const l = bars.lows[i];
    const pc = bars.closes[i - 1];
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  if (trs.length < period) return null;
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function bollingerLast(
  closes: number[],
  period: number = 20,
  stdDev: number = 2,
): { upper: number | null; middle: number | null; lower: number | null } {
  if (closes.length < period) return { upper: null, middle: null, lower: null };
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - middle) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return { upper: middle + stdDev * sd, middle, lower: middle - stdDev * sd };
}

export function williamsRLast(bars: StrategyBars, period: number = 14): number | null {
  if (bars.closes.length < period) return null;
  const slice = bars.closes.slice(-period);
  const highs = bars.highs.slice(-period);
  const lows = bars.lows.slice(-period);
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const close = slice[slice.length - 1];
  if (highestHigh === lowestLow) return -50;
  return -100 * (highestHigh - close) / (highestHigh - lowestLow);
}

export function obvLast(bars: StrategyBars): number | null {
  if (bars.closes.length < 2) return null;
  let obv = 0;
  for (let i = 1; i < bars.closes.length; i++) {
    if (bars.closes[i] > bars.closes[i - 1]) obv += bars.volumes[i];
    else if (bars.closes[i] < bars.closes[i - 1]) obv -= bars.volumes[i];
  }
  return obv;
}

export function mfiLast(bars: StrategyBars, period: number = 14): number | null {
  if (bars.closes.length <= period) return null;
  const start = bars.closes.length - period;
  let positiveFlow = 0;
  let negativeFlow = 0;
  for (let i = start; i < bars.closes.length; i++) {
    const typicalPrice = (bars.highs[i] + bars.lows[i] + bars.closes[i]) / 3;
    const prevTypical = i > 0 ? (bars.highs[i - 1] + bars.lows[i - 1] + bars.closes[i - 1]) / 3 : typicalPrice;
    const moneyFlow = typicalPrice * bars.volumes[i];
    if (typicalPrice > prevTypical) positiveFlow += moneyFlow;
    else if (typicalPrice < prevTypical) negativeFlow += moneyFlow;
  }
  if (negativeFlow === 0) return 100;
  const ratio = positiveFlow / negativeFlow;
  return 100 - 100 / (1 + ratio);
}

export function cmfLast(bars: StrategyBars, period: number = 20): number | null {
  if (bars.closes.length < period) return null;
  const start = bars.closes.length - period;
  let moneyFlowVolume = 0;
  let totalVolume = 0;
  for (let i = start; i < bars.closes.length; i++) {
    const h = bars.highs[i];
    const l = bars.lows[i];
    const c = bars.closes[i];
    const range = h - l;
    const mfm = range > 0 ? ((c - l) - (h - c)) / range : 0;
    const v = bars.volumes[i];
    moneyFlowVolume += mfm * v;
    totalVolume += v;
  }
  if (totalVolume === 0) return 0;
  return moneyFlowVolume / totalVolume;
}

export function avgVolumeLast(bars: StrategyBars, period: number = 20): number | null {
  if (bars.volumes.length < 1) return null;
  const slice = bars.volumes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function high52(bars: StrategyBars): number | null {
  if (bars.highs.length === 0) return null;
  const slice = bars.highs.slice(-252);
  return Math.max(...slice);
}

export function low52(bars: StrategyBars): number | null {
  if (bars.lows.length === 0) return null;
  const slice = bars.lows.slice(-252);
  return Math.min(...slice);
}

export function adxLast(bars: StrategyBars, period: number = 14): number | null {
  if (bars.closes.length < period * 2) return null;
  const dxValues: number[] = [];
  for (let i = 1; i < bars.closes.length; i++) {
    const highDiff = bars.highs[i] - bars.highs[i - 1];
    const lowDiff = bars.lows[i - 1] - bars.lows[i];
    const plusDM = highDiff > 0 && highDiff > lowDiff ? highDiff : 0;
    const minusDM = lowDiff > 0 && lowDiff > highDiff ? lowDiff : 0;
    const tr = Math.max(
      bars.highs[i] - bars.lows[i],
      Math.abs(bars.highs[i] - bars.closes[i - 1]),
      Math.abs(bars.lows[i] - bars.closes[i - 1]),
    );
    if (tr === 0) continue;
    const plusDI = 100 * plusDM / tr;
    const minusDI = 100 * minusDM / tr;
    const sum = plusDI + minusDI;
    if (sum === 0) continue;
    dxValues.push(100 * Math.abs(plusDI - minusDI) / sum);
  }
  if (dxValues.length < period) return null;
  const slice = dxValues.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function pegRatio(financials: FinancialSnapshot): number | null {
  const { peRatio, revenueGrowth } = financials;
  if (peRatio == null || revenueGrowth == null || revenueGrowth <= 0) return null;
  return peRatio / (revenueGrowth * 100);
}

export function evEbitda(financials: FinancialSnapshot, marketCap: number | null): number | null {
  if (financials.ebitda == null || financials.ebitda <= 0) return null;
  const ev = (marketCap ?? 0) + (financials.totalDebt ?? 0);
  return ev / financials.ebitda;
}

export interface TechnicalContext {
  bars: StrategyBars;
  sma20: number | null;
  sma50: number | null;
  sma150: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  roc: number | null;
  atr: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  williamsR: number | null;
  obv: number | null;
  mfi: number | null;
  cmf: number | null;
  avgVolume: number | null;
  high52: number | null;
  low52: number | null;
  adx: number | null;
}

export function buildTechnicalContext(prices: HistoricalPricePoint[], indicators?: IndicatorSnapshot): TechnicalContext {
  const bars = toBars(prices);
  const closes = bars.closes;
  return {
    bars,
    sma20: smaLast(closes, 20),
    sma50: smaLast(closes, 50),
    sma150: smaLast(closes, 150),
    sma200: smaLast(closes, 200),
    ema12: emaLast(closes, 12),
    ema26: emaLast(closes, 26),
    rsi: rsiLast(closes),
    macd: indicators?.macd ?? macdLast(closes).macd,
    macdSignal: indicators?.macdSignal ?? macdLast(closes).signal,
    macdHistogram: indicators?.macdHistogram ?? macdLast(closes).histogram,
    roc: indicators?.roc ?? rocLast(closes),
    atr: indicators?.atr ?? atrLast(bars),
    bollingerUpper: indicators?.bollingerUpper ?? bollingerLast(closes).upper,
    bollingerMiddle: indicators?.bollingerMiddle ?? bollingerLast(closes).middle,
    bollingerLower: indicators?.bollingerLower ?? bollingerLast(closes).lower,
    williamsR: indicators?.williamsR ?? williamsRLast(bars),
    obv: indicators?.obv ?? obvLast(bars),
    mfi: indicators?.mfi ?? mfiLast(bars),
    cmf: cmfLast(bars),
    avgVolume: avgVolumeLast(bars),
    high52: high52(bars),
    low52: low52(bars),
    adx: indicators?.adx ?? adxLast(bars),
  };
}

export function relativeStrength52(tc: TechnicalContext): number | null {
  if (tc.high52 == null || tc.bars.closes.length === 0) return null;
  const current = tc.bars.closes[tc.bars.closes.length - 1];
  if (tc.high52 === 0) return null;
  return current / tc.high52 * 100;
}

export function verificationConfidence(v: VerificationSnapshot | undefined): number {
  if (!v) return 0;
  return v.confidence ?? 0;
}

export function catalystSignal(c: CatalystSnapshot | undefined): number {
  if (!c) return 0;
  const { bullishCount, bearishCount, count } = c;
  if (count === 0) return 0;
  return (bullishCount - bearishCount) / count;
}
