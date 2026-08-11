import { Injectable } from '@nestjs/common';

export interface ExchangeInfo {
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  tradingHours: {
    open: string;
    close: string;
    timezone: string;
  };
  tradingDays: string[];
  lotSize: number;
  decimalPlaces: number;
  isOpen: boolean;
}

export interface MarketMetadata {
  exchanges: ExchangeInfo[];
  currencies: CurrencyInfo[];
  sectors: Record<string, string[]>;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

@Injectable()
export class MultiMarketService {
  private readonly exchanges: ExchangeInfo[] = [
    {
      code: 'BIST',
      name: 'Borsa İstanbul',
      country: 'Türkiye',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
      tradingHours: { open: '10:00', close: '18:00', timezone: 'Europe/Istanbul' },
      tradingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      lotSize: 1,
      decimalPlaces: 2,
      isOpen: this.checkIfOpen('Europe/Istanbul', '10:00', '18:00'),
    },
    {
      code: 'NASDAQ',
      name: 'NASDAQ Stock Exchange',
      country: 'United States',
      currency: 'USD',
      timezone: 'America/New_York',
      tradingHours: { open: '09:30', close: '16:00', timezone: 'America/New_York' },
      tradingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      lotSize: 1,
      decimalPlaces: 2,
      isOpen: this.checkIfOpen('America/New_York', '09:30', '16:00'),
    },
    {
      code: 'NYSE',
      name: 'New York Stock Exchange',
      country: 'United States',
      currency: 'USD',
      timezone: 'America/New_York',
      tradingHours: { open: '09:30', close: '16:00', timezone: 'America/New_York' },
      tradingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      lotSize: 1,
      decimalPlaces: 2,
      isOpen: this.checkIfOpen('America/New_York', '09:30', '16:00'),
    },
  ];

  private readonly currencies: CurrencyInfo[] = [
    { code: 'TRY', name: 'Türk Lirası', symbol: '₺', decimals: 2 },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  ];

  private readonly sectors: Record<string, string[]> = {
    BIST: [
      'Bankacılık', 'Teknoloji', 'Savunma', 'Otomotiv', 'Enerji', 'Gıda', 'Perakende',
      'İnşaat', 'Kimya', 'İlaç', 'Telekom', 'Demir-Çelik', 'Havacılık', 'Holding',
      'Sigorta', 'GYO', 'Spor', 'Lojistik', 'Madencilik', 'Turizm',
    ],
    NASDAQ: [
      'Technology', 'Biotechnology', 'Pharmaceuticals', 'Software', 'Internet',
      'Semiconductors', 'Telecommunications', 'Media', 'Healthcare', 'Financial Services',
    ],
    NYSE: [
      'Financial', 'Energy', 'Healthcare', 'Consumer Goods', 'Industrial',
      'Utilities', 'Real Estate', 'Transportation', 'Insurance', 'Mining',
    ],
  };

  getExchanges(): ExchangeInfo[] {
    return this.exchanges.map((e) => ({
      ...e,
      isOpen: this.checkIfOpen(e.timezone, e.tradingHours.open, e.tradingHours.close),
    }));
  }

  getExchange(code: string): ExchangeInfo | undefined {
    const exchange = this.exchanges.find((e) => e.code === code.toUpperCase());
    if (exchange) {
      return {
        ...exchange,
        isOpen: this.checkIfOpen(exchange.timezone, exchange.tradingHours.open, exchange.tradingHours.close),
      };
    }
    return undefined;
  }

  getCurrencies(): CurrencyInfo[] {
    return this.currencies;
  }

  getSectors(exchange?: string): Record<string, string[]> {
    if (exchange) {
      const upper = exchange.toUpperCase();
      if (this.sectors[upper]) {
        return { [upper]: this.sectors[upper] };
      }
      return {};
    }
    return this.sectors;
  }

  getFullMetadata(): MarketMetadata {
    return {
      exchanges: this.getExchanges(),
      currencies: this.currencies,
      sectors: this.sectors,
    };
  }

  private checkIfOpen(timezone: string, openTime: string, closeTime: string): boolean {
    try {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
      if (day === 'Saturday' || day === 'Sunday') return false;

      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: timezone });
      const currentMinutes = this.toMinutes(timeStr);
      const openMinutes = this.toMinutes(openTime);
      const closeMinutes = this.toMinutes(closeTime);

      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } catch {
      return false;
    }
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
