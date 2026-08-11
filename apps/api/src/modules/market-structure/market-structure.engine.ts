import { Injectable, Logger } from '@nestjs/common';
import { OHLCV, Timeframe } from '../indicators/indicator.types';
import {
  MarketStructureConfig,
  DEFAULT_MARKET_STRUCTURE_CONFIG,
} from './market-structure.config';
import {
  MarketStructureResult,
  SwingPoint,
  StructureBreak,
  Zone,
  TrendDirection,
} from './market-structure.types';

@Injectable()
export class MarketStructureEngine {
  private readonly logger = new Logger(MarketStructureEngine.name);
  private readonly config: MarketStructureConfig;

  constructor() {
    this.config = DEFAULT_MARKET_STRUCTURE_CONFIG;
  }

  analyze(data: OHLCV[], timeframe: Timeframe): MarketStructureResult {
    if (data.length < this.config.swingWindow * 2 + 1) {
      return this.emptyResult(timeframe);
    }

    const swingHighs = this.findSwingHighs(data);
    const swingLows = this.findSwingLows(data);
    const allSwings = [...swingHighs, ...swingLows].sort((a, b) => a.index - b.index);

    const structure = this.classifyStructure(allSwings);
    const { bos, choch } = this.detectBreaks(structure, data);
    const trend = this.determineTrend(structure);
    const supportZones = this.findZones(swingLows, data, 'support');
    const resistanceZones = this.findZones(swingHighs, data, 'resistance');

    this.logger.debug(
      `Analyzed ${data.length} candles (${timeframe}): ` +
        `trend=${trend}, swings=${allSwings.length}, bos=${bos.length}, choch=${choch.length}`,
    );

    return {
      timeframe,
      trend,
      structure,
      swingHighs,
      swingLows,
      supportZones,
      resistanceZones,
      breakOfStructure: bos,
      changeOfCharacter: choch,
      metadata: {
        dataLength: data.length,
        config: this.config,
      },
      isValid: true,
    };
  }

  private findSwingHighs(data: OHLCV[]): SwingPoint[] {
    const { swingWindow } = this.config;
    const swings: SwingPoint[] = [];

    for (let i = swingWindow; i < data.length - swingWindow; i++) {
      let isSwingHigh = true;
      for (let j = 1; j <= swingWindow; j++) {
        if (data[i].high <= data[i - j].high || data[i].high <= data[i + j].high) {
          isSwingHigh = false;
          break;
        }
      }
      if (isSwingHigh) {
        swings.push({
          index: i,
          price: data[i].high,
          timestamp: data[i].timestamp,
          type: 'high',
        });
      }
    }
    return swings;
  }

  private findSwingLows(data: OHLCV[]): SwingPoint[] {
    const { swingWindow } = this.config;
    const swings: SwingPoint[] = [];

    for (let i = swingWindow; i < data.length - swingWindow; i++) {
      let isSwingLow = true;
      for (let j = 1; j <= swingWindow; j++) {
        if (data[i].low >= data[i - j].low || data[i].low >= data[i + j].low) {
          isSwingLow = false;
          break;
        }
      }
      if (isSwingLow) {
        swings.push({
          index: i,
          price: data[i].low,
          timestamp: data[i].timestamp,
          type: 'low',
        });
      }
    }
    return swings;
  }

  private classifyStructure(swings: SwingPoint[]): StructureBreak[] {
    const { structureSensitivity } = this.config;
    const structure: StructureBreak[] = [];
    let prevHigh: SwingPoint | null = null;
    let prevLow: SwingPoint | null = null;

    for (const swing of swings) {
      if (swing.type === 'high') {
        if (prevHigh) {
          const pctChange = (swing.price - prevHigh.price) / prevHigh.price;
          if (pctChange > structureSensitivity) {
            structure.push({
              index: swing.index,
              price: swing.price,
              timestamp: swing.timestamp,
              type: 'HH',
              brokenSwing: prevHigh,
            });
          } else if (pctChange < -structureSensitivity) {
            structure.push({
              index: swing.index,
              price: swing.price,
              timestamp: swing.timestamp,
              type: 'LH',
              brokenSwing: prevHigh,
            });
          }
        }
        prevHigh = swing;
      } else {
        if (prevLow) {
          const pctChange = (swing.price - prevLow.price) / prevLow.price;
          if (pctChange > structureSensitivity) {
            structure.push({
              index: swing.index,
              price: swing.price,
              timestamp: swing.timestamp,
              type: 'HL',
              brokenSwing: prevLow,
            });
          } else if (pctChange < -structureSensitivity) {
            structure.push({
              index: swing.index,
              price: swing.price,
              timestamp: swing.timestamp,
              type: 'LL',
              brokenSwing: prevLow,
            });
          }
        }
        prevLow = swing;
      }
    }
    return structure;
  }

  private detectBreaks(structure: StructureBreak[], data: OHLCV[]): { bos: StructureBreak[]; choch: StructureBreak[] } {
    const bos: StructureBreak[] = [];
    const choch: StructureBreak[] = [];
    let currentTrend: 'up' | 'down' | null = null;

    for (const brk of structure) {
      const isBullish = brk.type === 'HH' || brk.type === 'HL';
      const newTrend = isBullish ? 'up' : 'down';

      if (currentTrend !== null && newTrend !== currentTrend) {
        choch.push(brk);
      } else {
        bos.push(brk);
      }

      currentTrend = newTrend;
    }
    return { bos, choch };
  }

  private determineTrend(structure: StructureBreak[]): TrendDirection {
    if (structure.length < 2) return 'sideways';

    let hhCount = 0;
    let llCount = 0;
    for (const brk of structure) {
      if (brk.type === 'HH' || brk.type === 'HL') hhCount++;
      if (brk.type === 'LH' || brk.type === 'LL') llCount++;
    }

    const total = hhCount + llCount;
    if (total === 0) return 'sideways';

    const ratio = hhCount / total;
    if (ratio > 0.6) return 'uptrend';
    if (ratio < 0.4) return 'downtrend';
    return 'sideways';
  }

  private findZones(swings: SwingPoint[], data: OHLCV[], type: 'support' | 'resistance'): Zone[] {
    if (swings.length === 0) return [];

    const zones: Zone[] = [];
    const used = new Set<number>();

    for (let i = 0; i < swings.length; i++) {
      if (used.has(i)) continue;

      const zoneSwings: SwingPoint[] = [swings[i]];
      used.add(i);

      for (let j = i + 1; j < swings.length; j++) {
        if (used.has(j)) continue;
        const pctDiff = Math.abs(swings[j].price - swings[i].price) / swings[i].price;
        if (pctDiff <= this.config.zoneTolerance) {
          zoneSwings.push(swings[j]);
          used.add(j);
        }
      }

      if (zoneSwings.length >= this.config.minZoneTouches) {
        const prices = zoneSwings.map((s) => s.price);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const tolerance = avg * this.config.zoneTolerance;

        zones.push({
          upper: avg + tolerance,
          lower: avg - tolerance,
          startIndex: zoneSwings[0].index,
          endIndex: zoneSwings[zoneSwings.length - 1].index,
          touches: zoneSwings.length,
          timestamps: zoneSwings.map((s) => s.timestamp),
        });
      }
    }

    return zones.sort((a, b) => b.touches - a.touches);
  }

  private emptyResult(timeframe: Timeframe): MarketStructureResult {
    return {
      timeframe,
      trend: 'sideways',
      structure: [],
      swingHighs: [],
      swingLows: [],
      supportZones: [],
      resistanceZones: [],
      breakOfStructure: [],
      changeOfCharacter: [],
      metadata: { dataLength: 0, config: this.config },
      isValid: false,
    };
  }
}
