import { Module } from '@nestjs/common';
import { ConfluenceEngine } from './confluence.engine';

@Module({
  providers: [ConfluenceEngine],
  exports: [ConfluenceEngine],
})
export class ConfluenceModule {}
