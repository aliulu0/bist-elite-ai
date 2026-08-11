import { OHLCV } from './indicator.types';

export function generateOHLCV(count: number, startPrice = 100): OHLCV[] {
  const data: OHLCV[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (Math.sin(i * 0.3) * 2 + (Math.random() - 0.5) * 3);
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(1000000 + Math.random() * 500000);
    data.push({
      open,
      high,
      low,
      close,
      volume,
      timestamp: new Date(Date.now() + i * 86400000).toISOString(),
    });
    price = close;
  }
  return data;
}

export function generateUpTrend(count: number, startPrice = 100): OHLCV[] {
  const data: OHLCV[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = open + 1 + Math.random() * 2;
    const high = close + Math.random();
    const low = open - Math.random();
    const volume = Math.floor(1000000 + Math.random() * 500000);
    data.push({
      open, high, low, close, volume,
      timestamp: new Date(Date.now() + i * 86400000).toISOString(),
    });
    price = close;
  }
  return data;
}

export function generateDownTrend(count: number, startPrice = 200): OHLCV[] {
  const data: OHLCV[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = open - 1 - Math.random() * 2;
    const high = open + Math.random();
    const low = close - Math.random();
    const volume = Math.floor(1000000 + Math.random() * 500000);
    data.push({
      open, high, low, close, volume,
      timestamp: new Date(Date.now() + i * 86400000).toISOString(),
    });
    price = close;
  }
  return data;
}

export const sampleData: OHLCV[] = Array.from({ length: 50 }, (_, i) => ({
  open: 100 + Math.sin(i * 0.3) * 5,
  high: 102 + Math.sin(i * 0.3) * 5,
  low: 98 + Math.sin(i * 0.3) * 5,
  close: 100 + Math.sin(i * 0.3) * 5,
  volume: 1000000 + i * 10000,
  timestamp: new Date(Date.now() + i * 86400000).toISOString(),
}));
