import { OHLCV } from '../indicator.types';

export function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += values[j];
    }
    result.push(sum / period);
  }
  return result;
}

export function ema(values: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let prev = NaN;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[j];
      prev = sum / period;
      result.push(prev);
      continue;
    }
    prev = (values[i] - prev) * multiplier + prev;
    result.push(prev);
  }
  return result;
}

export function trueRange(data: OHLCV[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i].high - data[i].low);
      continue;
    }
    const prevClose = data[i - 1].close;
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - prevClose),
      Math.abs(data[i].low - prevClose),
    );
    result.push(tr);
  }
  return result;
}

export function rsi(closes: number[], period: number): number[] {
  const result: number[] = [];
  if (closes.length < period + 1) {
    return closes.map(() => NaN);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < period; i++) result.push(NaN);

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsVal = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rsVal));
  }

  return result;
}

export function stdev(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    const mean = sum / period;
    let sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) sqSum += (values[j] - mean) ** 2;
    result.push(Math.sqrt(sqSum / period));
  }
  return result;
}
