import { Module } from '@nestjs/common';
import { WeightOptimizer } from './weight-optimizer.engine';

@Module({
  providers: [WeightOptimizer],
  exports: [WeightOptimizer],
})
export class WeightOptimizerModule {}
