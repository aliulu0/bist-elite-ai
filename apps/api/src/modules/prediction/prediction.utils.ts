import { PREDICTION_TIMEFRAMES, PredictionTimeframe } from './prediction.types';

export function isPredictionTimeframe(value: string): value is PredictionTimeframe {
  return (PREDICTION_TIMEFRAMES as readonly string[]).includes(value);
}
