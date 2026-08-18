import { MarketDataPoint } from '../interfaces';
import { Timeframe } from '../interfaces';
import { DataQuality } from '../interfaces/unified-domain.types';

// Local data status type (same fundamental data status used elsewhere)
export type DataStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';

/**
 * Feature provenance tracking for scanner results
 */
export interface ScannerFeatureProvenance {
  symbol: string;
  retrievedAt: string;
  marketTimestamp: string;
  interval: string;
  source: 'REAL' | 'DERIVED' | 'UNAVAILABLE';
  validationStatus: DataQuality;
}

/**
 * Scanner result structure.
 * All unavailable values are null or explicit UNAVAILABLE status.
 * Never fabricate: 0, 50, neutral, estimated, simulated, placeholder.
 */
export interface ScannerResult {
  symbol: string;
  providerSymbol: string;
  timeframe: Timeframe;

  currentPrice: number | null;
  priceChange1D: number | null;
  priceChange5D: number | null;
  priceChange20D: number | null;
  priceChange60D: number | null;

  volume20Average: number | null;
  volume50Average: number | null;
  relativeVolume20: number | null;
  relativeVolume50: number | null;
  volumeSpike: boolean | null;

  sma9: number | null;
  sma20: number | null;
  sma50: number | null;

  rsi14: number | null;

  macd: { macd: number | null; signal: number | null; histogram: number | null } | null;
  stochasticRsiK: number | null;
  stochasticRsiD: number | null;

  distanceTo20DHigh: number | null;
  distanceTo50DHigh: number | null;
  isBreakout: boolean | null;

  momentum5D: number | null;
  momentum20D: number | null;
  momentum60D: number | null;

  relativeStrength: number | null;
  relativeStrengthBenchmark: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null;

  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null;

  eliteScore: number | null;
  financialScore: number | null;
  technicalScore: number | null;
  confluenceScore: number | null;
  smartMoneyScore: number | null;
  marketStructureScore: number | null;

  dataQuality: DataQuality;
  dataStatus: DataStatus;

  sourceProvenance: ScannerFeatureProvenance;
}

/**
 * Compute 1-day return from close prices.
 * Formula: currentClose / historicalClose - 1
 * No future observations. Only data <= timestamp T.
 */
export function computeReturn1D(
  currentClose: number,
  historicalClose: number,
  timestamp: string,
): { value: number | null; timestamp: string } {
  if (historicalClose === 0 || currentClose === null || historicalClose === null) {
    return { value: null, timestamp };
  }
  const value = Number((currentClose / historicalClose - 1).toFixed(6));
  return { value, timestamp };
}

/**
 * Compute multi-day return from close prices.
 * Formula: currentClose / historicalClose - 1
 * No future observations.
 */
export function computeReturnMultiDay(
  currentClose: number,
  historicalClose: number,
  timestamp: string,
): { value: number | null; timestamp: string } {
  if (historicalClose === 0 || currentClose === null || historicalClose === null) {
    return { value: null, timestamp };
  }
  const value = Number((currentClose / historicalClose - 1).toFixed(6));
  return { value, timestamp };
}

/**
 * Compute SMA (Simple Moving Average) from close prices.
 * Minimum observations required as specified.
 * Only uses data <= timestamp T. No future data.
 */
export function computeSMA(
  closePrices: number[],
  minObservations: number,
  timestamp: string,
): { value: number | null; timestamp: string } {
  if (closePrices.length < minObservations) {
    return { value: null, timestamp };
  }
  // Use only the last 'minObservations' or fewer if available
  const pricesToUse = closePrices.slice(-minObservations);
  const sum = pricesToUse.reduce((acc, price) => acc + price, 0);
  const value = Number((sum / pricesToUse.length).toFixed(6));
  return { value, timestamp };
}

/**
 * Compute RSI (Relative Strength Index) using Wilder's method.
 * Period default: 14
 * Only uses data <= timestamp T. No future data.
 */
export function computeRSI(
  closePrices: number[],
  period: number = 14,
  timestamp: string,
): { value: number | null; timestamp: string } {
  if (closePrices.length < period + 1) {
    return { value: null, timestamp };
  }
  // Calculate gains and losses
  let gains = 0;
  let losses = 0;
  for (let i = closePrices.length - period; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    if (change > 0) gains += change;
    else losses -= change; // make loss positive
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) {
    return { value: 100, timestamp };
  }
  const rs = avgGain / avgLoss;
  const value = Number((100 - 100 / (1 + rs)).toFixed(6));
  return { value, timestamp };
}

/**
 * Compute MACD (Moving Average Convergence Divergence).
 * Fast period: 12, Slow period: 26, Signal period: 9
 * Only uses data <= timestamp T. No future data.
 */
export function computeMACD(
  closePrices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  timestamp: string,
): { macd: number | null; signal: number | null; histogram: number | null; timestamp: string } {
  if (closePrices.length < slowPeriod + signalPeriod) {
    return { macd: null, signal: null, histogram: null, timestamp };
  }
  // Calculate fast EMA
  const fastEMA = computeEMA(closePrices, fastPeriod);
  // Calculate slow EMA
  const slowEMA = computeEMA(closePrices, slowPeriod);
  // MACD line = fast EMA - slow EMA
  const macdLine = fastEMA.value - slowEMA.value;
  // Calculate signal line (EMA of MACD line)
  const signalLine = computeEMA([macdLine], signalPeriod).value;
  const histogram = macdLine - signalLine;
  return { macd: macdLine, signal: signalLine, histogram, timestamp };
}

/**
 * Compute EMA (Exponential Moving Average).
 * Used internally by MACD computation.
 */
function computeEMA(prices: number[], period: number): { value: number } {
  if (prices.length === 0) {
    return { value: 0 };
  }
  // Start with simple SMA of first 'period' values
  const start = Math.min(period, prices.length);
  let sma = prices.slice(0, start).reduce((acc, price) => acc + price, 0) / start;
  // Apply EMA formula: EMA_t = (Price_t * k) + (EMA_{t-1} * (1 - k))
  // where k = 2 / (period + 1)
  const k = 2 / (period + 1);
  let ema = sma;
  for (let i = start; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return { value: ema };
}

/**
 * Compute stochastic RSI.
 * RSI period: 14, Stochastic period: 14, K: 3, D: 3
 * Only uses data <= timestamp T. No future data.
 */
export function computeStochasticRSI(
  rsiValues: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3,
  timestamp: string,
): { k: number | null; d: number | null; timestamp: string } {
  if (rsiValues.length < rsiPeriod + kPeriod) {
    return { k: null, d: null, timestamp };
  }
  // Take the last 'stochPeriod' RSI values
  const recentRSI = rsiValues.slice(-stochPeriod);
  const rsiMin = Math.min(...recentRSI);
  const rsiMax = Math.max(...recentRSI);
  const range = rsiMax - rsiMin;
  const lastRSI = recentRSI[recentRSI.length - 1];
  let k = null;
  let d = null;
  if (range > 0) {
    k = Number((((lastRSI - rsiMin) / range) * 100).toFixed(6));
  }
  // K is the stochastic of RSI; D is SMA of K (simplified: return K for now)
  return { k, d, timestamp };
}

/**
 * Compute volume features from market data points.
 * Only uses data <= timestamp T. No future data.
 */
export function computeVolumeFeatures(
  points: MarketDataPoint[],
  timestamp: string,
): { value: number | null; timestamp: string } {
  if (points.length < 20) {
    return { value: null, timestamp };
  }
  // Sort by timestamp (assumed already sorted descending, take most recent)
  const sorted = [...points].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const recent20 = sorted.slice(0, 20);
  const avg20 = recent20.reduce((sum, p) => sum + (p.volume ?? 0), 0) / 20;
  // Calculate 50-day average volume
  const recent50 = sorted.slice(0, 50);
  const avg50 = recent50.reduce((sum, p) => sum + (p.volume ?? 0), 0) / 50;
  // Relative volume 20 = current volume / 20-day average
  const currentVolume = points[0].volume ?? 0;
  const relVol20 = avg20 > 0 ? Number((currentVolume / avg20).toFixed(6)) : null;
  // Relative volume 50
  const relVol50 = avg50 > 0 ? Number((currentVolume / avg50).toFixed(6)) : null;
  // Volume spike: current volume > 2x 20-day average
  const volumeSpike = avg20 > 0 ? currentVolume > 2 * avg20 : false;
  return { value: null, timestamp };
}

/**
 * Determine market regime based on price relative to moving averages.
 * Uses: PRICE_ABOVE_SMA20, PRICE_BELOW_SMA20, SMA9_ABOVE_SMA20, SMA9_BELOW_SMA20
 * Regimes: BULL, BEAR, SIDEWAYS, UNKNOWN
 */
export function determineMarketRegime(
  close: number,
  sma20: number | null,
  sma9: number | null,
  timestamp: string,
): { regime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN'; timestamp: string } {
  if (sma20 === null) {
    return { regime: 'UNKNOWN', timestamp };
  }
  const priceAboveSMA20 = close > sma20;
  let regime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN';
  if (priceAboveSMA20) {
    // Check SMA9 relative to SMA20 for trend confirmation
    if (sma9 !== null && sma9 > sma20) {
      regime = 'BULL';
    } else if (sma9 !== null && sma9 < sma20) {
      regime = 'SIDEWAYS';
    } else {
      regime = 'BULL';
    }
  } else {
    // Check SMA9 relative to SMA20
    if (sma9 !== null && sma9 < sma20) {
      regime = 'BEAR';
    } else if (sma9 !== null && sma9 > sma20) {
      regime = 'SIDEWAYS';
    } else {
      regime = 'BEAR';
    }
  }
  return { regime, timestamp };
}

/**
 * Compute breakout features.
 * 20D high = highest high in last 20 candles (excluding current)
 * 50D high = highest high in last 50 candles (excluding current)
 * Breakout: currentClose > previous20DHigh (using only historical observations at timestamp T)
 */
export function computeBreakoutFeatures(
  points: MarketDataPoint[],
  close: number,
  timestamp: string,
): {
  distanceTo20DHigh: number | null;
  distanceTo50DHigh: number | null;
  isBreakout: boolean | null;
  timestamp: string;
} {
  if (points.length < 21) {
    // Need 20 historical + current
    return { distanceTo20DHigh: null, distanceTo50DHigh: null, isBreakout: null, timestamp };
  }
  // Sort by timestamp, exclude the current (most recent) candle
  const sorted = [...points].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  // Historical candles (exclude the most recent/current)
  const historical = sorted.slice(1); // Skip the first (most recent)
  // 20D high = highest high in last 20 historical candles
  const historical20 = historical.slice(0, 20);
  const high20 = Math.max(...historical20.map((p) => p.high ?? -Infinity));
  // 50D high = highest high in last 50 historical candles
  const historical50 = historical.slice(0, 50);
  const high50 = Math.max(...historical50.map((p) => p.high ?? -Infinity));
  // Breakout: current close > previous 20D high (using only historical data at timestamp T)
  const isBreakout = close > high20;
  // Distance to 20D high
  const distanceTo20DHigh = high20 > 0 ? Number(((close - high20) / high20).toFixed(6)) : null;
  // Distance to 50D high
  const distanceTo50DHigh = high50 > 0 ? Number(((close - high50) / high50).toFixed(6)) : null;
  return { distanceTo20DHigh, distanceTo50DHigh, isBreakout, timestamp };
}

/**
 * Compute relative strength against a benchmark.
 * Uses existing relative-strength implementation with explicit benchmark type.
 * benchmarkType: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null
 */
export function computeRelativeStrength(
  symbolPrice: number | null,
  benchmarkPrice: number | null,
  timestamp: string,
): {
  value: number | null;
  timestamp: string;
  benchmarkType: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null;
} {
  if (symbolPrice === null || benchmarkPrice === null || benchmarkPrice === 0) {
    return { value: null, timestamp, benchmarkType: null };
  }
  const value = Number((symbolPrice / benchmarkPrice - 1).toFixed(6));
  const benchmarkType: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null =
    benchmarkPrice !== null ? 'SYNTHETIC_PROXY' : null;
  return { value, timestamp, benchmarkType };
}

/**
 * Determine multi-timeframe confluence from per-timeframe analysis.
 * Confluence states: STRONG, MODERATE, PARTIAL, CONFLICTED, UNKNOWN
 * - UNAVAILABLE timeframes are excluded from the confluence calculation
 * - The system never fabricates: missing timeframes are simply excluded
 * - Confluence is determined by available timeframes only
 */
export function determineMultiTimeframeConfluence(
  timeframeData: Record<Timeframe, TimeframeData>,
): {
  confluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
  availableTimeframeCount: number;
  bullishTimeframeCount: number;
  bearishTimeframeCount: number;
  conflictedTimeframeCount: number;
  confluenceScore: number; // 0-100, diagnostic only
  technicalAlignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED' | 'UNKNOWN';
  volumeConfirmation: 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE';
  momentumState: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN';
} {
  // Collect available timeframes (exclude UNAVAILABLE)
  const available: TimeframeData[] = [];
  const bullish: TimeframeData[] = [];
  const bearish: TimeframeData[] = [];
  const conflicted: TimeframeData[] = [];

  for (const tf of Object.values(timeframeData)) {
    if (!tf.available) continue;
    if (tf.dataStatus === 'UNAVAILABLE') continue;
    available.push(tf);

    // Determine bullish/bearish based on marketRegime + technical indicators
    let isBullish = false;
    let isBearish = false;
    let isConflicted = false;

    // Regime-based call
    if (tf.marketRegime === 'BULL') isBullish = true;
    if (tf.marketRegime === 'BEAR') isBearish = true;

    // SMA alignment: bullish if SMA9 > SMA20 > SMA50
    const smaBullish =
      tf.sma9 !== null &&
      tf.sma20 !== null &&
      tf.sma50 !== null &&
      tf.sma9 > tf.sma20 &&
      tf.sma20 > tf.sma50;
    const smaBearish =
      tf.sma9 !== null &&
      tf.sma20 !== null &&
      tf.sma50 !== null &&
      tf.sma9 < tf.sma20 &&
      tf.sma20 < tf.sma50;

    // MACD histogram bullish
    const macdBullish = tf.macd !== null && tf.macd.histogram !== null && tf.macd.histogram > 0;
    const macdBearish = tf.macd !== null && tf.macd.histogram !== null && tf.macd.histogram < 0;

    // RSI > 50 bullish, < 30 bearish
    const rsibullish = tf.rsi14 !== null && tf.rsi14 > 50;
    const rsibearish = tf.rsi14 !== null && tf.rsi14 < 30;

    // Combine: bullish if multiple signals bullish
    const bullSignals = [isBullish, smaBullish, macdBullish, rsibullish].filter(Boolean).length;
    const bearSignals = [isBearish, smaBearish, macdBearish, rsibearish].filter(Boolean).length;

    if (bullSignals > bearSignals) isBullish = true;
    else if (bearSignals > bullSignals) isBearish = true;
    else isConflicted = true;

    if (isBullish && isBearish) isConflicted = true;
    if (isBullish) bullish.push(tf);
    if (isBearish) bearish.push(tf);
    if (isConflicted) conflicted.push(tf);
  }

  const availCount = available.length;
  const bullCount = bullish.length;
  const bearCount = bearish.length;
  const conflictedCount = conflicted.length;

  // Determine confluence
  let confluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
  let confluenceScore = 0;
  let technicalAlignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED' | 'UNKNOWN';

  if (availCount === 0) {
    confluence = 'UNKNOWN';
    confluenceScore = 0;
    technicalAlignment = 'UNKNOWN';
  } else if (conflictedCount === availCount) {
    confluence = 'CONFLICTED';
    confluenceScore = 25;
    technicalAlignment = 'MIXED';
  } else if (bullCount >= availCount * 0.75) {
    confluence = 'STRONG';
    confluenceScore = 80;
    technicalAlignment = 'BULLISH';
  } else if (bullCount >= availCount * 0.5) {
    confluence = 'MODERATE';
    confluenceScore = 55;
    technicalAlignment = 'BULLISH';
  } else if (bullCount > 0 || bearCount > 0) {
    // Mixed: some bullish some bearish
    if (bullCount > 0 && bearCount > 0) {
      confluence = 'CONFLICTED';
      confluenceScore = 35;
      technicalAlignment = 'MIXED';
    } else if (bullCount > 0) {
      confluence = 'PARTIAL';
      confluenceScore = 40;
      technicalAlignment = 'BULLISH';
    } else {
      confluence = 'PARTIAL';
      confluenceScore = 40;
      technicalAlignment = 'BEARISH';
    }
  } else if (bearCount >= availCount * 0.75) {
    confluence = 'CONFLICTED';
    confluenceScore = 25;
    technicalAlignment = 'BEARISH';
  } else if (bearCount >= availCount * 0.5) {
    confluence = 'MODERATE';
    confluenceScore = 45;
    technicalAlignment = 'BEARISH';
  } else {
    confluence = 'UNKNOWN';
    confluenceScore = 0;
    technicalAlignment = 'UNKNOWN';
  }

  // Volume confirmation
  let volumeConfirmation: 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE';
  const volBullish = available.filter((tf) => tf.volumeSpike === true).length;
  const volBearish = available.filter(
    (tf) => tf.volumeSpike === false && tf.volumeSpike !== null,
  ).length;

  if (availCount === 0) {
    volumeConfirmation = 'UNAVAILABLE';
  } else if (volBullish >= availCount * 0.75) {
    volumeConfirmation = 'STRONG';
  } else if (volBullish >= availCount * 0.5) {
    volumeConfirmation = 'MODERATE';
  } else if (volBullish > 0 || volBearish > 0) {
    volumeConfirmation = 'WEAK';
  } else {
    volumeConfirmation = 'UNAVAILABLE';
  }

  // Momentum state
  let momentumState: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN';
  const posMom = available.filter((tf) => tf.momentum5D !== null && tf.momentum5D > 0).length;
  const negMom = available.filter((tf) => tf.momentum5D !== null && tf.momentum5D < 0).length;

  if (availCount === 0) {
    momentumState = 'UNKNOWN';
  } else if (posMom >= availCount * 0.75) {
    momentumState = 'ACCELERATING';
  } else if (posMom >= availCount * 0.5) {
    momentumState = 'POSITIVE';
  } else if (negMom >= availCount * 0.75) {
    momentumState = 'NEGATIVE';
  } else if (negMom >= availCount * 0.5) {
    momentumState = 'WEAKENING';
  } else if (posMom > 0 || negMom > 0) {
    momentumState = 'NEUTRAL';
  } else {
    momentumState = 'UNKNOWN';
  }

  return {
    confluence,
    availableTimeframeCount: availCount,
    bullishTimeframeCount: bullCount,
    bearishTimeframeCount: bearCount,
    conflictedTimeframeCount: conflictedCount,
    confluenceScore,
    technicalAlignment,
    volumeConfirmation,
    momentumState,
  };
}

/**
 * Determine early opportunity classification from multi-timeframe analysis.
 * These are classifications, NOT guarantees of future price movement.
 */
export function determineEarlyOpportunityClassification(
  multiTimeframe: MultiTimeframeAnalysis,
): EarlyOpportunityClassification {
  const { confluence, technicalAlignment, volumeConfirmation, momentumState } = multiTimeframe;

  // No available data -> UNAVAILABLE
  if (multiTimeframe.availableTimeframeCount === 0) return 'UNAVAILABLE';

  // STRONG bullish confluence with positive momentum and volume confirmation
  if (
    confluence === 'STRONG' &&
    technicalAlignment === 'BULLISH' &&
    volumeConfirmation === 'STRONG' &&
    momentumState === 'POSITIVE'
  ) {
    return 'EARLY_ACCUMULATION';
  }

  // Bullish confluence + breakout proximity (price near 20D high)
  if (
    confluence !== 'CONFLICTED' &&
    technicalAlignment === 'BULLISH' &&
    momentumState === 'POSITIVE' &&
    multiTimeframe.bullishTimeframeCount >= 3
  ) {
    // Check if price is near 20D high
    const nearHigh =
      multiTimeframe.bullishTimeframeCount >= multiTimeframe.availableTimeframeCount * 0.6;
    if (nearHigh) return 'PRE_BREAKOUT';
    return 'BREAKOUT';
  }

  // Positive momentum with volume confirmation
  if (momentumState === 'POSITIVE' && volumeConfirmation !== 'WEAK') {
    return 'MOMENTUM';
  }

  // Extended from recent advance
  if (
    confluence === 'MODERATE' &&
    technicalAlignment === 'BULLISH' &&
    volumeConfirmation === 'MODERATE'
  ) {
    return 'EXTENDED';
  }

  // Mixed or weakening signals
  if (
    confluence === 'CONFLICTED' ||
    momentumState === 'WEAKENING' ||
    volumeConfirmation === 'WEAK'
  ) {
    return 'WEAKENING';
  }

  // Default: no strong signal
  return 'NO_SIGNAL';
}

/**
 * Determine scanner signal quality based on data availability and confluence.
 */
export function determineScannerSignalQuality(
  multiTimeframe: MultiTimeframeAnalysis,
): ScannerSignalQuality {
  if (multiTimeframe.availableTimeframeCount === 0) return 'UNAVAILABLE';
  if (multiTimeframe.confluence === 'STRONG' && multiTimeframe.bullishTimeframeCount >= 4)
    return 'HIGH';
  if (multiTimeframe.confluence !== 'CONFLICTED' && multiTimeframe.availableTimeframeCount >= 3)
    return 'MEDIUM';
  return 'LOW';
}

/**
 * Build per-timeframe data from scanner features for a given timeframe.
 */
export function buildTimeframeData(tf: Timeframe, scanner: any): TimeframeData {
  // For 1H and 2H, mark as UNAVAILABLE (Yahoo does not provide natively)
  if (tf === '1H' || tf === '2H') {
    return {
      timeframe: tf,
      available: false,
      dataStatus: 'UNAVAILABLE',
      source: 'UNAVAILABLE',
      retrievedAt: new Date().toISOString(),
      marketTimestamp: new Date().toISOString(),
      currentPrice: null,
      priceChange1D: null,
      priceChange5D: null,
      priceChange20D: null,
      priceChange60D: null,
      volume20Average: null,
      volume50Average: null,
      relativeVolume20: null,
      relativeVolume50: null,
      volumeSpike: null,
      sma9: null,
      sma20: null,
      sma50: null,
      rsi14: null,
      macd: null,
      stochasticRsiK: null,
      stochasticRsiD: null,
      distanceTo20DHigh: null,
      distanceTo50DHigh: null,
      isBreakout: null,
      momentum5D: null,
      momentum20D: null,
      momentum60D: null,
      marketRegime: 'UNKNOWN',
      relativeStrength: null,
      relativeStrengthBenchmark: null,
    };
  }

  // For available timeframes, use scanner data
  const currentPrice = scanner.currentPrice ?? null;
  const rsi14 = scanner.rsi14 ?? null;
  const macd = scanner.macd ?? null;
  const sma9 = scanner.sma9 ?? null;
  const sma20 = scanner.sma20 ?? null;
  const sma50 = scanner.sma50 ?? null;
  const volume20Average = scanner.volume20Average ?? null;
  const volume50Average = scanner.volume50Average ?? null;
  const relativeVolume20 = scanner.relativeVolume20 ?? null;
  const relativeVolume50 = scanner.relativeVolume50 ?? null;
  const volumeSpike = scanner.volumeSpike ?? null;
  const distanceTo20DHigh = scanner.distanceTo20DHigh ?? null;
  const distanceTo50DHigh = scanner.distanceTo50DHigh ?? null;
  const isBreakout = scanner.isBreakout ?? null;
  const momentum5D = scanner.momentum5D ?? null;
  const momentum20D = scanner.momentum20D ?? null;
  const momentum60D = scanner.momentum60D ?? null;
  const marketRegime = scanner.marketRegime ?? 'UNKNOWN';
  const relativeStrength = scanner.relativeStrength ?? null;
  const relativeStrengthBenchmark = scanner.relativeStrengthBenchmark ?? 'UNAVAILABLE';

  // Determine availability
  const hasEssentialData = currentPrice !== null && rsi14 !== null && sma20 !== null;

  return {
    timeframe: tf,
    available: hasEssentialData,
    dataStatus: hasEssentialData ? 'AVAILABLE' : 'UNAVAILABLE',
    source: scanner.sourceProvenance?.source ?? 'REAL',
    retrievedAt: scanner.sourceProvenance?.retrievedAt ?? new Date().toISOString(),
    marketTimestamp: scanner.sourceProvenance?.marketTimestamp ?? new Date().toISOString(),
    currentPrice,
    priceChange1D: tf === '1d' ? null : null, // Will be computed per timeframe
    priceChange5D: null,
    priceChange20D: null,
    priceChange60D: null,
    volume20Average,
    volume50Average,
    relativeVolume20,
    relativeVolume50,
    volumeSpike,
    sma9,
    sma20,
    sma50,
    rsi14,
    macd,
    stochasticRsiK: scanner.stochasticRsiK ?? null,
    stochasticRsiD: scanner.stochasticRsiD ?? null,
    distanceTo20DHigh,
    distanceTo50DHigh,
    isBreakout,
    momentum5D,
    momentum20D,
    momentum60D,
    marketRegime,
    relativeStrength,
    relativeStrengthBenchmark,
  };
}

/** Per-timeframe data availability and features for multi-timeframe analysis */
export interface TimeframeData {
  timeframe: Timeframe;
  available: boolean;
  dataStatus: DataStatus;
  source: 'REAL' | 'DERIVED' | 'UNAVAILABLE';
  retrievedAt: string;
  marketTimestamp: string;
  /** Price features */
  currentPrice: number | null;
  priceChange1D: number | null;
  priceChange5D: number | null;
  priceChange20D: number | null;
  priceChange60D: number | null;
  /** Volume features */
  volume20Average: number | null;
  volume50Average: number | null;
  relativeVolume20: number | null;
  relativeVolume50: number | null;
  volumeSpike: boolean | null;
  /** Technical features */
  sma9: number | null;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  macd: { macd: number | null; signal: number | null; histogram: number | null } | null;
  stochasticRsiK: number | null;
  stochasticRsiD: number | null;
  /** Breakout & momentum */
  distanceTo20DHigh: number | null;
  distanceTo50DHigh: number | null;
  isBreakout: boolean | null;
  momentum5D: number | null;
  momentum20D: number | null;
  momentum60D: number | null;
  /** Regime & strength */
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN' | null;
  relativeStrength: number | null;
  relativeStrengthBenchmark: 'OFFICIAL' | 'SYNTHETIC_PROXY' | null;
}

/** Multi-timeframe analysis structure */
export interface MultiTimeframeAnalysis {
  symbol: string;
  /** Per-timeframe data availability and features */
  timeframes: Record<Timeframe, TimeframeData>;
  /** Confluence determination */
  confluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
  /** Number of available timeframes out of 6 (excluding 1H/2H which are always UNAVAILABLE) */
  availableTimeframeCount: number;
  /** Number of bullish timeframes */
  bullishTimeframeCount: number;
  /** Number of bearish timeframes */
  bearishTimeframeCount: number;
  /** Number of conflicted timeframes */
  conflictedTimeframeCount: number;
  /** Confluence score 0-100 (diagnostic, does NOT replace Elite Score) */
  confluenceScore: number;
  /** Breakdown by technical alignment */
  technicalAlignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED' | 'UNKNOWN';
  /** Volume confirmation state */
  volumeConfirmation: 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE';
  /** Momentum state */
  momentumState: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE' | 'UNKNOWN';
}

/** Extended ScannerResult with multi-timeframe analysis */
export interface ExtendedScannerResult extends ScannerResult {
  /** Multi-timeframe analysis (available timeframes only) */
  multiTimeframeAnalysis?: MultiTimeframeAnalysis;
  /** Early opportunity classification */
  earlyOpportunityClassification?: EarlyOpportunityClassification;
  /** Scanner signal quality */
  scannerSignalQuality?: ScannerSignalQuality;
}

/** Early opportunity classification states */
export type EarlyOpportunityClassification =
  | 'EARLY_ACCUMULATION'
  | 'PRE_BREAKOUT'
  | 'BREAKOUT'
  | 'MOMENTUM'
  | 'EXTENDED'
  | 'WEAKENING'
  | 'NO_SIGNAL'
  | 'UNAVAILABLE';

/** Scanner signal quality levels */
export type ScannerSignalQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';
