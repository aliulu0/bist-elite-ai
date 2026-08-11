import { Timeframe } from '../indicators/indicator.types';

export type TrendDirection = 'uptrend' | 'downtrend' | 'sideways';

export interface SwingPoint {
  index: number;
  price: number;
  timestamp: string;
  type: 'high' | 'low';
}

export interface StructureBreak {
  index: number;
  price: number;
  timestamp: string;
  type: 'HH' | 'HL' | 'LH' | 'LL';
  brokenSwing: SwingPoint;
}

export interface Zone {
  upper: number;
  lower: number;
  startIndex: number;
  endIndex: number;
  touches: number;
  timestamps: string[];
}

export interface MarketStructureResult {
  timeframe: Timeframe;
  trend: TrendDirection;
  structure: StructureBreak[];
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];
  supportZones: Zone[];
  resistanceZones: Zone[];
  breakOfStructure: StructureBreak[];
  changeOfCharacter: StructureBreak[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}
