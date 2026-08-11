export interface MarketStructureConfig {
  swingWindow: number;
  structureSensitivity: number;
  zoneTolerance: number;
  minZoneTouches: number;
}

export const DEFAULT_MARKET_STRUCTURE_CONFIG: MarketStructureConfig = {
  swingWindow: 5,
  structureSensitivity: 0.001,
  zoneTolerance: 0.01,
  minZoneTouches: 2,
};
