import { Module } from '@nestjs/common';
import { CandidateEngine } from './candidate.engine';

@Module({
  providers: [CandidateEngine],
  exports: [CandidateEngine],
})
export class CandidateModule {}
