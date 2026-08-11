import { Injectable } from '@nestjs/common';
import { AnalysisSignal } from './ai-analysis.types';
import { SignalThresholdConfig, DEFAULT_SIGNAL_THRESHOLDS } from './config/ai-analysis.config';

@Injectable()
export class SignalGenerator {
  generate(overallScore: number, thresholds: SignalThresholdConfig = DEFAULT_SIGNAL_THRESHOLDS): AnalysisSignal {
    if (overallScore >= thresholds.strongBuy) return 'STRONG_BUY';
    if (overallScore >= thresholds.buy) return 'BUY';
    if (overallScore >= thresholds.accumulate) return 'ACCUMULATE';
    if (overallScore >= thresholds.reduce) return 'NEUTRAL';
    if (overallScore >= thresholds.sell) return 'REDUCE';
    if (overallScore >= 20) return 'SELL';
    return 'STRONG_SELL';
  }

  getSignalDescription(signal: AnalysisSignal): string {
    const descriptions: Record<AnalysisSignal, string> = {
      STRONG_BUY: 'Strong buying opportunity with high confidence across multiple dimensions',
      BUY: 'Favorable buying opportunity with good fundamentals and technical positioning',
      ACCUMULATE: 'Gradual accumulation recommended; mixed signals but net positive outlook',
      NEUTRAL: 'Hold current positions; balanced risk-reward profile with no clear directional bias',
      REDUCE: 'Consider reducing exposure; emerging weaknesses in key metrics',
      SELL: 'Sell recommendation due to significant fundamental or technical deterioration',
      STRONG_SELL: 'Strong sell signal with critical concerns across multiple analysis dimensions',
    };
    return descriptions[signal];
  }
}
