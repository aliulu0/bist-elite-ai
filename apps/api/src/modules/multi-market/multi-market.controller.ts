import { Controller, Get, Param } from '@nestjs/common';
import { MultiMarketService } from './multi-market.service';

@Controller('markets')
export class MultiMarketController {
  constructor(private readonly service: MultiMarketService) {}

  @Get()
  getFullMetadata() {
    return this.service.getFullMetadata();
  }

  @Get('exchanges')
  getExchanges() {
    return this.service.getExchanges();
  }

  @Get('exchanges/:code')
  getExchange(@Param('code') code: string) {
    const exchange = this.service.getExchange(code);
    if (!exchange) return { error: `Exchange '${code}' not found` };
    return exchange;
  }

  @Get('currencies')
  getCurrencies() {
    return this.service.getCurrencies();
  }

  @Get('sectors')
  getSectors() {
    return this.service.getSectors();
  }

  @Get('sectors/:exchange')
  getSectorsByExchange(@Param('exchange') exchange: string) {
    return this.service.getSectors(exchange);
  }
}
