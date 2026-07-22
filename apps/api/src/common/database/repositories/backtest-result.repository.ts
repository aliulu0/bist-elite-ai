import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { BacktestResult, Prisma, Timeframe, BacktestStatus } from '@prisma/client';

@Injectable()
export class BacktestResultRepository extends BaseRepository<
  BacktestResult,
  Prisma.BacktestResultCreateInput,
  Prisma.BacktestResultUpdateInput,
  Prisma.BacktestResultWhereInput
> {
  protected readonly modelName = 'backtestResult';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findByStockAndStrategy(
    stockId: string,
    strategyName: string,
    timeframe: Timeframe = 'D1',
  ): Promise<BacktestResult[]> {
    return this.model.findMany({
      where: { stockId, strategyName, timeframe },
      orderBy: { computedAt: 'desc' },
    });
  }

  async findBestByStrategy(
    strategyName: string,
    timeframe: Timeframe = 'D1',
    limit = 50,
  ): Promise<BacktestResult[]> {
    return this.model.findMany({
      where: {
        strategyName,
        timeframe,
        status: 'COMPLETED',
      },
      orderBy: { sharpeRatio: 'desc' },
      take: limit,
      include: { stock: { include: { company: true } } },
    });
  }

  async findRecentCompleted(
    limit = 20,
  ): Promise<BacktestResult[]> {
    return this.model.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { computedAt: 'desc' },
      take: limit,
      include: { stock: true },
    });
  }

  async findByStatus(
    status: BacktestStatus,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<BacktestResult>> {
    return this.findMany({ status }, options);
  }

  async findWithWalkForward(id: string) {
    return this.model.findUnique({
      where: { id },
      include: { walkForwardResults: { orderBy: { windowIndex: 'asc' } } },
    });
  }

  async findWithMonteCarlo(id: string) {
    return this.model.findUnique({
      where: { id },
      include: { monteCarloResults: true },
    });
  }

  async findComplete(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        stock: true,
        walkForwardResults: { orderBy: { windowIndex: 'asc' } },
        monteCarloResults: true,
      },
    });
  }
}
