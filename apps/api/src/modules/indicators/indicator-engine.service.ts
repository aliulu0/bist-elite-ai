import { Injectable, Logger } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from './indicator.types';
import { SmaIndicator } from './trend/sma.indicator';
import { EmaIndicator } from './trend/ema.indicator';
import { IchimokuIndicator } from './trend/ichimoku.indicator';
import { RsiIndicator } from './momentum/rsi.indicator';
import { StochasticRsiIndicator } from './momentum/stochastic-rsi.indicator';
import { MacdIndicator } from './momentum/macd.indicator';
import { RocIndicator } from './momentum/roc.indicator';
import { MomentumOscillatorIndicator } from './momentum/momentum-oscillator.indicator';
import { VolumeSmaIndicator } from './volume/volume-sma.indicator';
import { RelativeVolumeIndicator } from './volume/relative-volume.indicator';
import { VolumeSpikeIndicator } from './volume/volume-spike.indicator';
import { ObvIndicator } from './volume/obv.indicator';
import { AtrIndicator } from './volatility/atr.indicator';
import { BollingerBandsIndicator } from './volatility/bollinger-bands.indicator';
import { AdxIndicator } from './trend-strength/adx.indicator';
import { MfiIndicator } from './money-flow/mfi.indicator';
import { CmfIndicator } from './money-flow/cmf.indicator';
import { AdlIndicator } from './money-flow/adl.indicator';
import { CompressionIndicator } from './compression/compression.indicator';

@Injectable()
export class IndicatorEngine {
  private readonly logger = new Logger(IndicatorEngine.name);

  constructor(
    private readonly sma: SmaIndicator,
    private readonly ema: EmaIndicator,
    private readonly ichimoku: IchimokuIndicator,
    private readonly rsi: RsiIndicator,
    private readonly stochRsi: StochasticRsiIndicator,
    private readonly macd: MacdIndicator,
    private readonly roc: RocIndicator,
    private readonly momentumOsc: MomentumOscillatorIndicator,
    private readonly volumeSma: VolumeSmaIndicator,
    private readonly relativeVolume: RelativeVolumeIndicator,
    private readonly volumeSpike: VolumeSpikeIndicator,
    private readonly obv: ObvIndicator,
    private readonly atr: AtrIndicator,
    private readonly bollingerBands: BollingerBandsIndicator,
    private readonly adx: AdxIndicator,
    private readonly mfi: MfiIndicator,
    private readonly cmf: CmfIndicator,
    private readonly adl: AdlIndicator,
    private readonly compression: CompressionIndicator,
  ) {}

  calculateAll(data: OHLCV[], timeframe: Timeframe): IndicatorResult[] {
    const results: IndicatorResult[] = [];

    results.push(...this.sma.calculate(data, timeframe));
    results.push(...this.ema.calculate(data, timeframe));
    results.push(...this.ichimoku.calculate(data, timeframe));
    results.push(this.rsi.calculate(data, timeframe));
    results.push(this.stochRsi.calculate(data, timeframe));
    results.push(this.macd.calculate(data, timeframe));
    results.push(this.roc.calculate(data, timeframe));
    results.push(this.momentumOsc.calculate(data, timeframe));
    results.push(this.volumeSma.calculate(data, timeframe));
    results.push(this.relativeVolume.calculate(data, timeframe));
    results.push(this.volumeSpike.calculate(data, timeframe));
    results.push(this.obv.calculate(data, timeframe));
    results.push(this.atr.calculate(data, timeframe));
    results.push(this.bollingerBands.calculate(data, timeframe));
    results.push(this.adx.calculate(data, timeframe));
    results.push(this.mfi.calculate(data, timeframe));
    results.push(this.cmf.calculate(data, timeframe));
    results.push(this.adl.calculate(data, timeframe));
    results.push(this.compression.calculate(data, timeframe));

    this.logger.debug(
      `Calculated ${results.length} indicators for ${data.length} data points (${timeframe})`,
    );

    return results;
  }
}
