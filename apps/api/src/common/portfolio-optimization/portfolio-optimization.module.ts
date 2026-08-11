import { Module } from '@nestjs/common';
import { PortfolioOptimizationService } from './portfolio-optimization.service';

@Module({
  providers: [PortfolioOptimizationService],
  exports: [PortfolioOptimizationService],
})
export class PortfolioOptimizationModule {}
