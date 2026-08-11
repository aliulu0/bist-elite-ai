import { Injectable, Logger } from '@nestjs/common';
import { IndicatorResult, Timeframe } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';
import {
  TechnicalRulesConfig,
  DEFAULT_TECHNICAL_RULES_CONFIG,
} from './technical-rules.config';
import {
  TechnicalRuleResult,
  TechnicalRulesOutput,
  RuleStatus,
  RuleCategory,
} from './technical-rules.types';

@Injectable()
export class TechnicalRulesEngine {
  private readonly logger = new Logger(TechnicalRulesEngine.name);
  private readonly config: TechnicalRulesConfig;

  constructor() {
    this.config = DEFAULT_TECHNICAL_RULES_CONFIG;
  }

  evaluate(
    indicators: IndicatorResult[],
    structure: MarketStructureResult,
    smartMoney: SmartMoneyResult,
    timeframe: Timeframe,
  ): TechnicalRulesOutput {
    const rules: TechnicalRuleResult[] = [];

    rules.push(...this.evaluateTrend(indicators, structure));
    rules.push(...this.evaluateMomentum(indicators));
    rules.push(...this.evaluateVolume(indicators));
    rules.push(...this.evaluateVolatility(indicators));
    rules.push(...this.evaluateMoneyFlow(indicators));
    rules.push(...this.evaluateMarketStructure(structure));
    rules.push(...this.evaluateSmartMoney(smartMoney));

    this.logger.debug(
      `Technical Rules (${timeframe}): ${rules.length} rules evaluated, ` +
        `${rules.filter((r) => r.status === 'PASS').length} PASS, ` +
        `${rules.filter((r) => r.status === 'WARNING').length} WARNING, ` +
        `${rules.filter((r) => r.status === 'FAIL').length} FAIL`,
    );

    return {
      timeframe,
      rules,
      isValid: true,
    };
  }

  private evaluateTrend(
    indicators: IndicatorResult[],
    structure: MarketStructureResult,
  ): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.emaAlignment(indicators));
    rules.push(this.smaAlignment(indicators));
    rules.push(this.ichimokuTrend(indicators));

    return rules;
  }

  private evaluateMomentum(indicators: IndicatorResult[]): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.rsiRule(indicators));
    rules.push(this.stochasticRsiRule(indicators));
    rules.push(this.macdRule(indicators));
    rules.push(this.rocRule(indicators));

    return rules;
  }

  private evaluateVolume(indicators: IndicatorResult[]): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.relativeVolumeRule(indicators));
    rules.push(this.volumeSpikeRule(indicators));
    rules.push(this.obvConfirmationRule(indicators));

    return rules;
  }

  private evaluateVolatility(indicators: IndicatorResult[]): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.atrRule(indicators));
    rules.push(this.compressionRule(indicators));

    return rules;
  }

  private evaluateMoneyFlow(indicators: IndicatorResult[]): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.mfiRule(indicators));
    rules.push(this.cmfRule(indicators));

    return rules;
  }

  private evaluateMarketStructure(structure: MarketStructureResult): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.hhRule(structure));
    rules.push(this.hlRule(structure));
    rules.push(this.bosRule(structure));
    rules.push(this.chochRule(structure));

    return rules;
  }

  private evaluateSmartMoney(smartMoney: SmartMoneyResult): TechnicalRuleResult[] {
    const rules: TechnicalRuleResult[] = [];

    rules.push(this.accumulationRule(smartMoney));
    rules.push(this.institutionalParticipationRule(smartMoney));

    return rules;
  }

  private emaAlignment(indicators: IndicatorResult[]): TechnicalRuleResult {
    const ema9 = this.findIndicatorValue(indicators, 'EMA_9');
    const ema20 = this.findIndicatorValue(indicators, 'EMA_20');
    const ema50 = this.findIndicatorValue(indicators, 'EMA_50');

    if (ema9 === null || ema20 === null || ema50 === null) {
      return this.notAvailable('EMA_ALIGNMENT', 'trend', 'EMA alignment data not available');
    }

    if (typeof ema9 !== 'number' || typeof ema20 !== 'number' || typeof ema50 !== 'number') {
      return this.notAvailable('EMA_ALIGNMENT', 'trend', 'EMA values are not numbers');
    }

    const bullish = ema9 > ema20 && ema20 > ema50;
    const bearish = ema9 < ema20 && ema20 < ema50;

    if (bullish) {
      return this.pass('EMA_ALIGNMENT', 'trend', 'Bullish EMA alignment', { ema9, ema20, ema50 });
    }
    if (bearish) {
      return this.fail('EMA_ALIGNMENT', 'trend', 'Bearish EMA alignment', { ema9, ema20, ema50 });
    }
    return this.warning('EMA_ALIGNMENT', 'trend', 'Mixed EMA alignment', { ema9, ema20, ema50 });
  }

  private smaAlignment(indicators: IndicatorResult[]): TechnicalRuleResult {
    const sma20 = this.findIndicatorValue(indicators, 'SMA_20');
    const sma50 = this.findIndicatorValue(indicators, 'SMA_50');
    const sma200 = this.findIndicatorValue(indicators, 'SMA_200');

    if (sma20 === null || sma50 === null || sma200 === null) {
      return this.notAvailable('SMA_ALIGNMENT', 'trend', 'SMA alignment data not available');
    }

    if (typeof sma20 !== 'number' || typeof sma50 !== 'number' || typeof sma200 !== 'number') {
      return this.notAvailable('SMA_ALIGNMENT', 'trend', 'SMA values are not numbers');
    }

    const bullish = sma20 > sma50 && sma50 > sma200;
    const bearish = sma20 < sma50 && sma50 < sma200;

    if (bullish) {
      return this.pass('SMA_ALIGNMENT', 'trend', 'Bullish SMA alignment', { sma20, sma50, sma200 });
    }
    if (bearish) {
      return this.fail('SMA_ALIGNMENT', 'trend', 'Bearish SMA alignment', { sma20, sma50, sma200 });
    }
    return this.warning('SMA_ALIGNMENT', 'trend', 'Mixed SMA alignment', { sma20, sma50, sma200 });
  }

  private ichimokuTrend(indicators: IndicatorResult[]): TechnicalRuleResult {
    const ichimoku = this.findIndicator(indicators, 'ICHIMOKU');
    if (!ichimoku || ichimoku.value === null) {
      return this.notAvailable('ICHIMOKU_TREND', 'trend', 'Ichimoku data not available');
    }

    const val = ichimoku.value as Record<string, number>;
    if (typeof val.tenkan !== 'number' || typeof val.kijun !== 'number') {
      return this.notAvailable('ICHIMOKU_TREND', 'trend', 'Ichimoku values incomplete');
    }

    const bullish = val.tenkan > val.kijun;
    if (bullish) {
      return this.pass('ICHIMOKU_TREND', 'trend', 'Bullish Ichimoku cross', val);
    }
    return this.fail('ICHIMOKU_TREND', 'trend', 'Bearish Ichimoku cross', val);
  }

  private rsiRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const rsi = this.findIndicatorValue(indicators, 'RSI');
    if (rsi === null || typeof rsi !== 'number') {
      return this.notAvailable('RSI', 'momentum', 'RSI data not available');
    }

    if (rsi >= this.config.rsi.overbought) {
      return this.fail('RSI', 'momentum', `RSI overbought at ${rsi.toFixed(1)}`, { rsi });
    }
    if (rsi <= this.config.rsi.oversold) {
      return this.pass('RSI', 'momentum', `RSI oversold at ${rsi.toFixed(1)}`, { rsi });
    }
    return this.warning('RSI', 'momentum', `RSI neutral at ${rsi.toFixed(1)}`, { rsi });
  }

  private stochasticRsiRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const stochRsi = this.findIndicator(indicators, 'STOCHASTIC_RSI');
    if (!stochRsi || stochRsi.value === null) {
      return this.notAvailable('STOCHASTIC_RSI', 'momentum', 'Stochastic RSI data not available');
    }

    const val = stochRsi.value as Record<string, number>;
    if (typeof val.k !== 'number') {
      return this.notAvailable('STOCHASTIC_RSI', 'momentum', 'Stochastic RSI K value not available');
    }

    if (val.k >= this.config.stochasticRsi.overbought) {
      return this.fail('STOCHASTIC_RSI', 'momentum', `StochRSI overbought at ${val.k.toFixed(1)}`, val);
    }
    if (val.k <= this.config.stochasticRsi.oversold) {
      return this.pass('STOCHASTIC_RSI', 'momentum', `StochRSI oversold at ${val.k.toFixed(1)}`, val);
    }
    return this.warning('STOCHASTIC_RSI', 'momentum', `StochRSI neutral at ${val.k.toFixed(1)}`, val);
  }

  private macdRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const macd = this.findIndicator(indicators, 'MACD');
    if (!macd || macd.value === null) {
      return this.notAvailable('MACD', 'momentum', 'MACD data not available');
    }

    const val = macd.value as Record<string, number>;
    if (typeof val.histogram !== 'number' || typeof val.macd !== 'number' || typeof val.signal !== 'number') {
      return this.notAvailable('MACD', 'momentum', 'MACD values incomplete');
    }

    if (val.macd > val.signal && val.histogram > 0) {
      return this.pass('MACD', 'momentum', 'MACD bullish crossover', val);
    }
    if (val.macd < val.signal && val.histogram < 0) {
      return this.fail('MACD', 'momentum', 'MACD bearish crossover', val);
    }
    return this.warning('MACD', 'momentum', 'MACD neutral', val);
  }

  private rocRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const roc = this.findIndicatorValue(indicators, 'ROC');
    if (roc === null || typeof roc !== 'number') {
      return this.notAvailable('ROC', 'momentum', 'ROC data not available');
    }

    if (roc > this.config.roc.bullishThreshold) {
      return this.pass('ROC', 'momentum', `ROC positive at ${roc.toFixed(2)}`, { roc });
    }
    if (roc < this.config.roc.bearishThreshold) {
      return this.fail('ROC', 'momentum', `ROC negative at ${roc.toFixed(2)}`, { roc });
    }
    return this.warning('ROC', 'momentum', `ROC neutral at ${roc.toFixed(2)}`, { roc });
  }

  private relativeVolumeRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const relVol = this.findIndicatorValue(indicators, 'RELATIVE_VOLUME');
    if (relVol === null || typeof relVol !== 'number') {
      return this.notAvailable('RELATIVE_VOLUME', 'volume', 'Relative volume data not available');
    }

    if (relVol >= this.config.volume.relativeVolumeHigh) {
      return this.pass('RELATIVE_VOLUME', 'volume', `High relative volume at ${relVol.toFixed(2)}x`, { relVol });
    }
    if (relVol <= this.config.volume.relativeVolumeLow) {
      return this.fail('RELATIVE_VOLUME', 'volume', `Low relative volume at ${relVol.toFixed(2)}x`, { relVol });
    }
    return this.warning('RELATIVE_VOLUME', 'volume', `Normal relative volume at ${relVol.toFixed(2)}x`, { relVol });
  }

  private volumeSpikeRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const volSpike = this.findIndicatorValue(indicators, 'VOLUME_SPIKE');
    if (volSpike === null || typeof volSpike !== 'number') {
      return this.notAvailable('VOLUME_SPIKE', 'volume', 'Volume spike data not available');
    }

    if (volSpike >= this.config.volume.relativeVolumeHigh) {
      return this.pass('VOLUME_SPIKE', 'volume', `Volume spike detected at ${volSpike.toFixed(2)}x`, { volSpike });
    }
    return this.warning('VOLUME_SPIKE', 'volume', `No significant volume spike at ${volSpike.toFixed(2)}x`, { volSpike });
  }

  private obvConfirmationRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const obv = this.findIndicator(indicators, 'OBV');
    if (!obv || !Array.isArray(obv.value) || obv.value.length < 3) {
      return this.notAvailable('OBV_CONFIRMATION', 'volume', 'OBV data not available');
    }

    const obvArr = obv.value as number[];
    const recent = obvArr.slice(-3);
    const rising = recent[2] > recent[1] && recent[1] > recent[0];
    const falling = recent[2] < recent[1] && recent[1] < recent[0];

    if (rising) {
      return this.pass('OBV_CONFIRMATION', 'volume', 'OBV confirming uptrend', { obv: recent });
    }
    if (falling) {
      return this.fail('OBV_CONFIRMATION', 'volume', 'OBV confirming downtrend', { obv: recent });
    }
    return this.warning('OBV_CONFIRMATION', 'volume', 'OBV direction unclear', { obv: recent });
  }

  private atrRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const atr = this.findIndicatorValue(indicators, 'ATR');
    if (atr === null || typeof atr !== 'number') {
      return this.notAvailable('ATR', 'volatility', 'ATR data not available');
    }

    if (atr > 0) {
      return this.pass('ATR', 'volatility', `ATR at ${atr.toFixed(2)}`, { atr });
    }
    return this.warning('ATR', 'volatility', `ATR at ${atr.toFixed(2)}`, { atr });
  }

  private compressionRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const comp = this.findIndicator(indicators, 'COMPRESSION');
    if (!comp || comp.value === null) {
      return this.notAvailable('COMPRESSION', 'volatility', 'Compression data not available');
    }

    const val = comp.value as Record<string, number | boolean>;
    if (typeof val.isSqueezing !== 'boolean') {
      return this.notAvailable('COMPRESSION', 'volatility', 'Compression state unknown');
    }

    if (val.isSqueezing) {
      return this.pass('COMPRESSION', 'volatility', 'Compression squeeze detected', val);
    }
    return this.warning('COMPRESSION', 'volatility', 'No active squeeze', val);
  }

  private mfiRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const mfi = this.findIndicatorValue(indicators, 'MFI');
    if (mfi === null || typeof mfi !== 'number') {
      return this.notAvailable('MFI', 'money_flow', 'MFI data not available');
    }

    if (mfi >= this.config.mfi.overbought) {
      return this.fail('MFI', 'money_flow', `MFI overbought at ${mfi.toFixed(1)}`, { mfi });
    }
    if (mfi <= this.config.mfi.oversold) {
      return this.pass('MFI', 'money_flow', `MFI oversold at ${mfi.toFixed(1)}`, { mfi });
    }
    return this.warning('MFI', 'money_flow', `MFI neutral at ${mfi.toFixed(1)}`, { mfi });
  }

  private cmfRule(indicators: IndicatorResult[]): TechnicalRuleResult {
    const cmf = this.findIndicatorValue(indicators, 'CMF');
    if (cmf === null || typeof cmf !== 'number') {
      return this.notAvailable('CMF', 'money_flow', 'CMF data not available');
    }

    if (cmf > this.config.cmf.bullishThreshold) {
      return this.pass('CMF', 'money_flow', `CMF bullish at ${cmf.toFixed(3)}`, { cmf });
    }
    if (cmf < this.config.cmf.bearishThreshold) {
      return this.fail('CMF', 'money_flow', `CMF bearish at ${cmf.toFixed(3)}`, { cmf });
    }
    return this.warning('CMF', 'money_flow', `CMF neutral at ${cmf.toFixed(3)}`, { cmf });
  }

  private hhRule(structure: MarketStructureResult): TechnicalRuleResult {
    const hh = structure.structure.filter((s) => s.type === 'HH');
    if (hh.length > 0) {
      return this.pass('HH', 'market_structure', `Higher Highs detected (${hh.length})`, { count: hh.length });
    }
    if (!structure.isValid) {
      return this.notAvailable('HH', 'market_structure', 'Market structure data not available');
    }
    return this.warning('HH', 'market_structure', 'No Higher Highs detected');
  }

  private hlRule(structure: MarketStructureResult): TechnicalRuleResult {
    const hl = structure.structure.filter((s) => s.type === 'HL');
    if (hl.length > 0) {
      return this.pass('HL', 'market_structure', `Higher Lows detected (${hl.length})`, { count: hl.length });
    }
    if (!structure.isValid) {
      return this.notAvailable('HL', 'market_structure', 'Market structure data not available');
    }
    return this.warning('HL', 'market_structure', 'No Higher Lows detected');
  }

  private bosRule(structure: MarketStructureResult): TechnicalRuleResult {
    if (structure.breakOfStructure.length > 0) {
      return this.pass('BOS', 'market_structure', `Break of Structure detected (${structure.breakOfStructure.length})`, { count: structure.breakOfStructure.length });
    }
    if (!structure.isValid) {
      return this.notAvailable('BOS', 'market_structure', 'Market structure data not available');
    }
    return this.warning('BOS', 'market_structure', 'No Break of Structure detected');
  }

  private chochRule(structure: MarketStructureResult): TechnicalRuleResult {
    if (structure.changeOfCharacter.length > 0) {
      return this.fail('CHOCH', 'market_structure', `Change of Character detected (${structure.changeOfCharacter.length})`, { count: structure.changeOfCharacter.length });
    }
    if (!structure.isValid) {
      return this.notAvailable('CHOCH', 'market_structure', 'Market structure data not available');
    }
    return this.pass('CHOCH', 'market_structure', 'No Change of Character detected');
  }

  private accumulationRule(smartMoney: SmartMoneyResult): TechnicalRuleResult {
    if (!smartMoney.isValid) {
      return this.notAvailable('ACCUMULATION', 'smart_money', 'Smart money data not available');
    }

    if (smartMoney.accumulationScore >= this.config.smartMoney.accumulationThreshold) {
      return this.pass('ACCUMULATION', 'smart_money', `Accumulation score ${smartMoney.accumulationScore.toFixed(2)}`, { score: smartMoney.accumulationScore });
    }
    if (smartMoney.distributionScore >= this.config.smartMoney.distributionThreshold) {
      return this.fail('ACCUMULATION', 'smart_money', `Distribution detected with score ${smartMoney.distributionScore.toFixed(2)}`, { score: smartMoney.distributionScore });
    }
    return this.warning('ACCUMULATION', 'smart_money', `Neutral smart money activity`);
  }

  private institutionalParticipationRule(smartMoney: SmartMoneyResult): TechnicalRuleResult {
    if (!smartMoney.isValid) {
      return this.notAvailable('INSTITUTIONAL_PARTICIPATION', 'smart_money', 'Smart money data not available');
    }

    if (smartMoney.smartMoneyConfidence >= this.config.smartMoney.institutionalThreshold) {
      return this.pass('INSTITUTIONAL_PARTICIPATION', 'smart_money', `Institutional confidence ${smartMoney.smartMoneyConfidence.toFixed(2)}`, { confidence: smartMoney.smartMoneyConfidence });
    }
    return this.warning('INSTITUTIONAL_PARTICIPATION', 'smart_money', `Low institutional confidence ${smartMoney.smartMoneyConfidence.toFixed(2)}`, { confidence: smartMoney.smartMoneyConfidence });
  }

  private findIndicator(indicators: IndicatorResult[], name: string): IndicatorResult | undefined {
    return indicators.find((ind) => ind.indicator === name);
  }

  private findIndicatorValue(indicators: IndicatorResult[], name: string): number | number[] | Record<string, number | boolean> | null | undefined {
    const ind = this.findIndicator(indicators, name);
    return ind?.value;
  }

  private pass(rule: string, category: RuleCategory, description: string, value: unknown = null): TechnicalRuleResult {
    return { rule, category, status: 'PASS', description, value, metadata: {} };
  }

  private warning(rule: string, category: RuleCategory, description: string, value: unknown = null): TechnicalRuleResult {
    return { rule, category, status: 'WARNING', description, value, metadata: {} };
  }

  private fail(rule: string, category: RuleCategory, description: string, value: unknown = null): TechnicalRuleResult {
    return { rule, category, status: 'FAIL', description, value, metadata: {} };
  }

  private notAvailable(rule: string, category: RuleCategory, description: string): TechnicalRuleResult {
    return { rule, category, status: 'NOT_AVAILABLE', description, value: null, metadata: {} };
  }
}
