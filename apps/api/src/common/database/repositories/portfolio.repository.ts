import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { Portfolio, Prisma } from '@prisma/client';

@Injectable()
export class PortfolioRepository extends BaseRepository<
  Portfolio,
  Prisma.PortfolioCreateInput,
  Prisma.PortfolioUpdateInput,
  Prisma.PortfolioWhereInput
> {
  protected readonly modelName = 'portfolio';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findDefault(): Promise<Portfolio | null> {
    return this.model.findFirst({ where: { isDefault: true } });
  }

  async findWithPositions(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        positions: {
          where: { exitDate: null },
          include: { stock: { include: { company: true } } },
        },
      },
    });
  }

  async findWithSnapshots(id: string, limit = 30) {
    return this.model.findUnique({
      where: { id },
      include: {
        snapshots: {
          orderBy: { date: 'desc' },
          take: limit,
        },
      },
    });
  }

  async findWithRiskProfiles(id: string) {
    return this.model.findUnique({
      where: { id },
      include: { riskProfiles: true },
    });
  }

  async findComplete(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        positions: {
          where: { exitDate: null },
          include: { stock: { include: { company: true } } },
        },
        snapshots: { orderBy: { date: 'desc' }, take: 30 },
        riskProfiles: true,
      },
    });
  }
}
