import { Module } from '@nestjs/common';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EliteScoreEngine } from './elite-score.engine';
import { EliteScoreRegistry } from './elite-score.registry';
import { EliteScoreService } from './elite-score.service';
import { EliteScoreController } from './elite-score.controller';

@Module({
  imports: [OpportunityModule],
  controllers: [EliteScoreController],
  providers: [EliteScoreEngine, EliteScoreRegistry, EliteScoreService],
  exports: [EliteScoreEngine, EliteScoreRegistry, EliteScoreService],
})
export class EliteScoreModule {}
