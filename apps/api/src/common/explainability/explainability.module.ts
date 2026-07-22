import { Module, Global } from '@nestjs/common';
import { ExplainabilityService } from './explainability.service';
import { ConfidenceCalculator } from './confidence.service';
import { RiskAnalyzer } from './risk.service';
import { MultiTimeframeAnalyzer } from './multi-timeframe.service';
import { MarketInterpreter } from './market-interpreter.service';

const confidenceCalculatorProvider = {
  provide: ConfidenceCalculator,
  useFactory: () => new ConfidenceCalculator(),
};

const riskAnalyzerProvider = {
  provide: RiskAnalyzer,
  useFactory: () => new RiskAnalyzer(),
};

const multiTimeframeAnalyzerProvider = {
  provide: MultiTimeframeAnalyzer,
  useFactory: () => new MultiTimeframeAnalyzer(),
};

const marketInterpreterProvider = {
  provide: MarketInterpreter,
  useFactory: () => new MarketInterpreter(),
};

@Global()
@Module({
  providers: [
    ExplainabilityService,
    confidenceCalculatorProvider,
    riskAnalyzerProvider,
    multiTimeframeAnalyzerProvider,
    marketInterpreterProvider,
  ],
  exports: [
    ExplainabilityService,
    ConfidenceCalculator,
    RiskAnalyzer,
    MultiTimeframeAnalyzer,
    MarketInterpreter,
  ],
})
export class ExplainabilityModule {}
