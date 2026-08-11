import { Module } from '@nestjs/common';
import { HistoricalDatasetValidator } from './backtest-validation.validator';

@Module({
  providers: [HistoricalDatasetValidator],
  exports: [HistoricalDatasetValidator],
})
export class BacktestValidationModule {}
