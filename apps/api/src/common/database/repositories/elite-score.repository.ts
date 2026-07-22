import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { EliteScore, Prisma, Timeframe } from '@prisma/client';

@Injectable()
export class EliteScoreRepository extends BaseRepository<
  EliteScore,
  Prisma.EliteScoreCreateInput,
  Prisma.EliteScoreUpdateInput,
  Prisma.EliteScoreWhereInput
> {
  protected readonly modelName = 'eliteScore';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findLatestByStock(
    stockId: string,
    timeframe: Timeframe = 'D1',
  ): Promise<EliteScore | null> {
    return this.model.findFirst({
      where: { stockId, timeframe },
      orderBy: { computedAt: 'desc' },
    });
  }

  async findTopScores(
    timeframe: Timeframe = 'D1',
    limit = 50,
    minScore = 0,
  ): Promise<EliteScore[]> {
    return this.model.findMany({
      where: {
        timeframe,
        composite: { gte: minScore },
      },
      orderBy: { composite: 'desc' },
      take: limit,
      include: { stock: { include: { company: true } } },
    });
  }

  async findScoreHistory(
    stockId: string,
    timeframe: Timeframe = 'D1',
    days = 30,
  ): Promise<EliteScore[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.model.findMany({
      where: {
        stockId,
        timeframe,
        computedAt: { gte: startDate },
      },
      orderBy: { computedAt: 'desc' },
    });
  }

  async findOpportunities(
    timeframe: Timeframe = 'D1',
    minScore = 70,
    minConfidence = 0.6,
  ): Promise<EliteScore[]> {
    return this.model.findMany({
      where: {
        timeframe,
        composite: { gte: minScore },
        confidence: { gte: minConfidence },
      },
      orderBy: { composite: 'desc' },
      include: { stock: { include: { company: true } } },
    });
  }

  async findRecentByTimeframe(
    timeframe: Timeframe,
    computedAt: Date,
  ): Promise<EliteScore[]> {
    return this.model.findMany({
      where: {
        timeframe,
        computedAt: { gte: computedAt },
      },
      orderBy: { composite: 'desc' },
      include: { stock: true },
    });
  }
}
