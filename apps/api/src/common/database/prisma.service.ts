import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  private dbConnected = false;

  async onModuleInit() {
    this.dbConnected = false;
    this.logger.warn('Database connection deferred. Continuing without DB.', 'PrismaService');
  }

  isDbConnected(): boolean {
    return this.dbConnected;
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter((key) => {
      const k = typeof key === 'string' ? key : key.toString();
      return k[0] !== '_';
    });

    return Promise.all(
      models.map((modelKey) => {
        const model = (this as any)[modelKey as string];
        if (typeof model?.deleteMany === 'function') {
          return model.deleteMany();
        }
        return Promise.resolve();
      }),
    );
  }
}
