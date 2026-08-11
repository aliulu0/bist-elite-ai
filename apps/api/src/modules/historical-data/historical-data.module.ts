import { Module } from '@nestjs/common';
import { HistoricalDataPipeline } from './historical-data.pipeline';

@Module({
  providers: [HistoricalDataPipeline],
  exports: [HistoricalDataPipeline],
})
export class HistoricalDataModule {}
