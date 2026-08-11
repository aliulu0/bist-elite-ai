import { Module } from '@nestjs/common';
import { ContractValidatorEngine } from './contract-validator.service';

@Module({
  providers: [ContractValidatorEngine],
  exports: [ContractValidatorEngine],
})
export class ContractValidatorModule {}
