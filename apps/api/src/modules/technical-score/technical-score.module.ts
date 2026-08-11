import { Module } from '@nestjs/common';
import { TechnicalScoreEngine } from './technical-score.engine';

@Module({
  providers: [TechnicalScoreEngine],
  exports: [TechnicalScoreEngine],
})
export class TechnicalScoreModule {}
