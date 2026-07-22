import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { Stock, Prisma } from '@prisma/client';

@Injectable()
export class StockRepository extends BaseRepository<
  Stock,
  Prisma.StockCreateInput,
  Prisma.StockUpdateInput,
  Prisma.StockWhereInput
> {
  protected readonly modelName = 'stock';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findBySymbol(symbol: string): Promise<Stock | null> {
    return this.model.findUnique({ where: { symbol } });
  }

  async findByTicker(ticker: string, exchange = 'BIST'): Promise<Stock | null> {
    return this.model.findUnique({
      where: { ticker_exchange: { ticker, exchange } },
    });
  }

  async findActive(options?: PaginationOptions): Promise<PaginatedResult<Stock>> {
    return this.findMany({ isActive: true }, options);
  }

  async findWithCompany(symbol: string) {
    return this.model.findUnique({
      where: { symbol },
      include: { company: true },
    });
  }

  async findWithLatestPrice(symbol: string) {
    return this.model.findUnique({
      where: { symbol },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });
  }

  async searchBySymbol(query: string, options?: PaginationOptions): Promise<PaginatedResult<Stock>> {
    return this.findMany(
      {
        OR: [
          { symbol: { contains: query, mode: 'insensitive' } },
          { ticker: { contains: query, mode: 'insensitive' } },
        ],
      },
      options,
    );
  }
}
