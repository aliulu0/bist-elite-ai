import { Injectable } from '@nestjs/common';
import { BacktestResult } from '../backtest.types';
import { ScoreWeights, ScoreDimension } from '../../scoring/scoring-types';
import { DEFAULT_SCORE_WEIGHTS } from '../../scoring/score-weights';
import { EliteScoreWeightDeltaDto } from '../dto/strategy-ranking.dto';

const DIMENSIONS: ScoreDimension[] = [
  'technical',
  'fundamental',
  'verification',
  'catalyst',
  'liquidity',
  'risk',
  'volume',
  'momentum',
  'trend',
  'quality',
];

@Injectable()
export class EliteScoreWeightAdapter {
  computeDeltas(result: BacktestResult): Record<ScoreDimension, number> {
    const p = result.performance;
    const r = result.risk;
    const momentum = p.cagr > 0 ? Math.min(1, Math.abs(p.cagr) / 50) : 0;
    const trend = Number.isFinite(r.sharpeRatio) ? Math.max(0, Math.min(2, r.sharpeRatio)) / 2 : 0;
    const quality = p.winRate / 100;
    const risk = 1 - (r.maxDrawdown > 0 ? Math.min(1, r.maxDrawdown / 30) : 0);
    const technical = Number.isFinite(r.sharpeRatio) ? Math.max(0, Math.min(2, r.sharpeRatio)) / 2 : 0;
    const volume = p.exposure / 100;
    return {
      technical: Math.round(technical * 100) / 100,
      fundamental: 0,
      verification: 0,
      catalyst: 0,
      liquidity: 0,
      risk: Math.round(risk * 100) / 100,
      volume: Math.round(volume * 100) / 100,
      momentum: Math.round(momentum * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      quality: Math.round(quality * 100) / 100,
    };
  }

  merge(current: ScoreWeights, delta: Record<ScoreDimension, number>): ScoreWeights {
    const merged: ScoreWeights = { ...DEFAULT_SCORE_WEIGHTS };
    for (const dim of DIMENSIONS) {
      merged[dim] = Math.max(0, Math.min(100, current[dim] + (delta[dim] ?? 0)));
    }
    return merged;
  }

  apply(symbol: string, result: BacktestResult): EliteScoreWeightDeltaDto {
    const delta = this.computeDeltas(result);
    return { symbol, weightDelta: delta, updatedAt: new Date().toISOString() };
  }
}
