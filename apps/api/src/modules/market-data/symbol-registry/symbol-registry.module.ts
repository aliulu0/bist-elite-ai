import { Global, Module } from '@nestjs/common';
import { SymbolRegistryService } from './symbol-registry.service';
import { SymbolRegistryController } from './symbol-registry.controller';

@Global()
@Module({
  controllers: [SymbolRegistryController],
  providers: [SymbolRegistryService],
  exports: [SymbolRegistryService],
})
export class SymbolRegistryModule {}
