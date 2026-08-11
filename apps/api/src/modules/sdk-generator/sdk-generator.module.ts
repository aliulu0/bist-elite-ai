import { Module } from '@nestjs/common';
import { SDKGeneratorEngine } from './sdk-generator.service';

@Module({
  providers: [SDKGeneratorEngine],
  exports: [SDKGeneratorEngine],
})
export class SDKGeneratorModule {}
