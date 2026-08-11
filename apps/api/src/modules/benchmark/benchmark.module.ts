import { Module } from '@nestjs/common';
import { BenchmarkEngine } from './benchmark.engine';

@Module({
  providers: [BenchmarkEngine],
  exports: [BenchmarkEngine],
})
export class BenchmarkModule {}
