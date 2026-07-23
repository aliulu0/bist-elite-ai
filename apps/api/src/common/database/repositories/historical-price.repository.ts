import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { HistoricalPrice, Prisma, Timeframe } from '@prisma/client';

@Injectable()
export class HistoricalPriceRepository extends BaseRepository<
  HistoricalPrice,
  Prisma.HistoricalPriceCreateInput,
  Prisma.HistoricalPriceUpdateInput,
  Prisma.HistoricalPriceWhereInput
> {
  protected readonly modelName = 'historicalPrice';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findByStockAndDateRange(
    stockId: string,
    startDate: Date,
    endDate: Date,
    timeframe: Timeframe = 'D1',
  ): Promise<HistoricalPrice[]> {
    return this.model.findMany({
      where: {
        stockId,
        timeframe,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findLatestByStock(
    stockId: string,
    timeframe: Timeframe = 'D1',
    limit = 100,
  ): Promise<HistoricalPrice[]> {
    return this.model.findMany({
      where: { stockId, timeframe },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async findLatestByStockSymbol(
    symbol: string,
    timeframe: Timeframe = 'D1',
    limit = 100,
  ): Promise<HistoricalPrice[]> {
    return this.model.findMany({
      where: {
        stock: { symbol },
        timeframe,
      },
      orderBy: { date: 'desc' },
      take: limit,
      include: { stock: true },
    });
  }

  async upsertPrice(
    stockId: string,
    date: Date,
    timeframe: Timeframe,
    data: Omit<Prisma.HistoricalPriceCreateInput, 'stock'>,
  ): Promise<HistoricalPrice> {
    return this.model.upsert({
      where: {
        stockId_date_timeframe: { stockId, date, timeframe },
      },
      create: {
        stockId,
        timeframe,
        ...data,
        date,
      },
      update: {
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        adjustedClose: data.adjustedClose,
        volume: data.volume,
        turnover: data.turnover,
        changePercent: data.changePercent,
      },
    });
  }

  async bulkUpsert(
    stockId: string,
    timeframe: Timeframe,
    prices: Array<{
      date: Date;
      open: Prisma.Decimal;
      high: Prisma.Decimal;
      low: Prisma.Decimal;
      close: Prisma.Decimal;
      adjustedClose: Prisma.Decimal;
      volume: bigint;
      turnover?: Prisma.Decimal;
      changePercent?: Prisma.Decimal;
    }>,
  ): Promise<{ count: number }> {
    const results = await Promise.all(
      prices.map((price) =>
        this.upsertPrice(stockId, price.date, timeframe, {
          date: price.date,
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          adjustedClose: price.adjustedClose,
          volume: price.volume,
          turnover: price.turnover,
          changePercent: price.changePercent,
        }),
      ),
    );
    return { count: results.length };
  }

  async findMissingDates(
    stockId: string,
    startDate: Date,
    endDate: Date,
    timeframe: Timeframe = 'D1',
  ): Promise<Date[]> {
    const existingDates = await this.model.findMany({
      where: {
        stockId,
        timeframe,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true },
    });

    const existingSet = new Set(existingDates.map((d: any) => d.date.toISOString()));
    const missing: Date[] = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      if (!existingSet.has(current.toISOString())) {
        missing.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return missing;
  }
}
