import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderByOption {
  field: string;
  direction: 'asc' | 'desc';
}

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {}

  protected get model() {
    return this.prisma[this.modelName] as any;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } }) as Promise<T | null>;
  }

  async findFirst(where: WhereInput): Promise<T | null> {
    return this.model.findFirst({ where }) as Promise<T | null>;
  }

  async findMany(
    where: WhereInput,
    options?: PaginationOptions & { orderBy?: OrderByOption[]; include?: any; select?: any },
  ): Promise<PaginatedResult<T>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy = options?.orderBy?.map((o) => ({ [o.field]: o.direction })) ?? [{ createdAt: 'desc' as const }];

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: options?.include,
        select: options?.select,
      }) as Promise<T[]>,
      this.model.count({ where }) as Promise<number>,
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: CreateInput): Promise<T> {
    return this.model.create({ data }) as Promise<T>;
  }

  async createMany(data: CreateInput[]): Promise<{ count: number }> {
    return this.model.createMany({ data, skipDuplicates: true });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({ where: { id }, data }) as Promise<T>;
  }

  async upsert(
    where: { id: string } | Record<string, any>,
    create: CreateInput,
    update: UpdateInput,
  ): Promise<T> {
    return this.model.upsert({ where, create, update }) as Promise<T>;
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } }) as Promise<T>;
  }

  async count(where?: WhereInput): Promise<number> {
    return this.model.count({ where }) as Promise<number>;
  }

  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }
}
