import { Module } from '@nestjs/common';
import { EliteScoreEngine } from './elite-score.engine';

@Module({
  providers: [EliteScoreEngine],
  exports: [EliteScoreEngine],
})
export class EliteScoreModule {}
