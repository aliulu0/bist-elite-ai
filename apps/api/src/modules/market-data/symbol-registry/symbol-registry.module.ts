import { Global, Module } from '@nestjs/common';
import { SymbolRegistryService } from './symbol-registry.service';

@Global()
@Module({
  providers: [SymbolRegistryService],
  exports: [SymbolRegistryService],
})
export class SymbolRegistryModule {}
