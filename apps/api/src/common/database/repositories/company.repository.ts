import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { Company, Prisma } from '@prisma/client';

@Injectable()
export class CompanyRepository extends BaseRepository<
  Company,
  Prisma.CompanyCreateInput,
  Prisma.CompanyUpdateInput,
  Prisma.CompanyWhereInput
> {
  protected readonly modelName = 'company';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findBySymbol(symbol: string): Promise<Company | null> {
    return this.model.findUnique({ where: { symbol } });
  }

  async findBySector(
    sector: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Company>> {
    return this.findMany({ sector }, options);
  }

  async findActive(options?: PaginationOptions): Promise<PaginatedResult<Company>> {
    return this.findMany({ isActive: true }, options);
  }

  async findByMarketSegment(
    segment: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Company>> {
    return this.findMany({ marketSegment: segment as any }, options);
  }

  async findWithStocks(symbol: string) {
    return this.model.findUnique({
      where: { symbol },
      include: { stocks: true },
    });
  }

  async findWithFinancials(symbol: string, limit = 4) {
    return this.model.findUnique({
      where: { symbol },
      include: {
        financialStatements: { orderBy: { period: 'desc' }, take: limit },
        financialRatios: { orderBy: { period: 'desc' }, take: limit },
      },
    });
  }
}
