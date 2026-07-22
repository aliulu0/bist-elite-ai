import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import { User, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput
> {
  protected readonly modelName = 'user';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: { email } });
  }

  async findActive(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    return this.findMany({ isActive: true }, options);
  }

  async findByRole(role: UserRole, options?: PaginationOptions): Promise<PaginatedResult<User>> {
    return this.findMany({ role }, options);
  }

  async findWithWatchlists(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        watchlists: {
          include: {
            items: { include: { stock: true } },
          },
        },
      },
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.model.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
