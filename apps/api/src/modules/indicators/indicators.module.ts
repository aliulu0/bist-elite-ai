import { Module } from '@nestjs/common';
import { IndicatorEngine } from './indicator-engine.service';
import { SmaIndicator, EmaIndicator, IchimokuIndicator } from './trend';
import { RsiIndicator, StochasticRsiIndicator, MacdIndicator, RocIndicator, MomentumOscillatorIndicator } from './momentum';
import { VolumeSmaIndicator, RelativeVolumeIndicator, VolumeSpikeIndicator, ObvIndicator } from './volume';
import { AtrIndicator, BollingerBandsIndicator } from './volatility';
import { AdxIndicator } from './trend-strength';
import { MfiIndicator, CmfIndicator, AdlIndicator } from './money-flow';
import { CompressionIndicator } from './compression';

const indicators = [
  SmaIndicator,
  EmaIndicator,
  IchimokuIndicator,
  RsiIndicator,
  StochasticRsiIndicator,
  MacdIndicator,
  RocIndicator,
  MomentumOscillatorIndicator,
  VolumeSmaIndicator,
  RelativeVolumeIndicator,
  VolumeSpikeIndicator,
  ObvIndicator,
  AtrIndicator,
  BollingerBandsIndicator,
  AdxIndicator,
  MfiIndicator,
  CmfIndicator,
  AdlIndicator,
  CompressionIndicator,
];

const providers = [...indicators, IndicatorEngine];

@Module({
  providers,
  exports: providers,
})
export class IndicatorsModule {}
