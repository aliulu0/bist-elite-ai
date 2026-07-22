import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { MarketRegime, Prisma, Timeframe, MarketRegimeType } from '@prisma/client';

@Injectable()
export class MarketRegimeRepository extends BaseRepository<
  MarketRegime,
  Prisma.MarketRegimeCreateInput,
  Prisma.MarketRegimeUpdateInput,
  Prisma.MarketRegimeWhereInput
> {
  protected readonly modelName = 'marketRegime';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findByDate(
    date: Date,
    timeframe: Timeframe = 'D1',
  ): Promise<MarketRegime | null> {
    return this.model.findUnique({
      where: { date_timeframe: { date, timeframe } },
    });
  }

  async findLatest(timeframe: Timeframe = 'D1'): Promise<MarketRegime | null> {
    return this.model.findFirst({
      where: { timeframe },
      orderBy: { date: 'desc' },
    });
  }

  async findRegimeHistory(
    timeframe: Timeframe = 'D1',
    days = 90,
  ): Promise<MarketRegime[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.model.findMany({
      where: {
        timeframe,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findByType(
    regime: MarketRegimeType,
    timeframe: Timeframe = 'D1',
    limit = 50,
  ): Promise<MarketRegime[]> {
    return this.model.findMany({
      where: { regime, timeframe },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async findHighConfidence(
    minConfidence = 0.8,
    timeframe: Timeframe = 'D1',
  ): Promise<MarketRegime[]> {
    return this.model.findMany({
      where: {
        timeframe,
        confidence: { gte: minConfidence },
      },
      orderBy: { date: 'desc' },
    });
  }
}
