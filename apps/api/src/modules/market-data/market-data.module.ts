import { Module } from '@nestjs/common';
import { MarketDataService, DATA_PROVIDER } from './market-data.service';
import { MarketDataValidationService } from './market-data-validation.service';
import { MarketDataProviderRegistry } from './market-data.provider-registry';
import { MarketDataController } from './market-data.controller';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { FintablesProvider } from './providers/fintables.provider';

export const FUNDAMENTAL_PROVIDER = 'FUNDAMENTAL_PROVIDER';

const providers = [
  MarketDataValidationService,
  MarketDataProviderRegistry,
  YahooFinanceProvider,
  FintablesProvider,
  {
    provide: DATA_PROVIDER,
    useFactory: (registry: MarketDataProviderRegistry, yahoo: YahooFinanceProvider) => {
      registry.register(yahoo);
      return yahoo;
    },
    inject: [MarketDataProviderRegistry, YahooFinanceProvider],
  },
  {
    provide: FUNDAMENTAL_PROVIDER,
    useExisting: FintablesProvider,
  },
  MarketDataService,
];

@Module({
  controllers: [MarketDataController],
  providers: [...providers],
  exports: [...providers],
})
export class MarketDataModule {}
