jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(function (this: any) {
      this.$disconnect = jest.fn().mockResolvedValue(undefined);
      this.$queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
      this.$executeRaw = jest.fn().mockResolvedValue(0);
      this.$transaction = jest.fn().mockImplementation((f: Function) =>
        f({
          $queryRaw: jest.fn().mockResolvedValue([]),
          $executeRaw: jest.fn().mockResolvedValue(0),
        }),
      );
    }),
  };
});

import { PrismaService } from '../common/database/prisma.service';

describe('PrismaService Integration', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  describe('Connection lifecycle', () => {
    it('should be instantiable', () => {
      expect(service).toBeDefined();
    });

    it('should start with deferred connection (not connected)', () => {
      expect(service.isDbConnected()).toBe(false);
    });

    it('should remain disconnected after onModuleInit (deferred mode)', async () => {
      await service.onModuleInit();
      expect(service.isDbConnected()).toBe(false);
    });

    it('should disconnect on module destroy', async () => {
      await service.onModuleDestroy();
      expect((service as any).$disconnect).toHaveBeenCalled();
    });
  });

  describe('Database operations safety', () => {
    it('should throw when cleanDatabase is called in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(service.cleanDatabase()).rejects.toThrow('Cannot clean database in production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should allow cleanDatabase in non-production environments', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      try {
        const result = await service.cleanDatabase();
        expect(Array.isArray(result)).toBe(true);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('PrismaClient inheritance', () => {
    it('should have $queryRaw method', () => {
      expect(typeof service.$queryRaw).toBe('function');
    });

    it('should have $disconnect method', () => {
      expect(typeof service.$disconnect).toBe('function');
    });

    it('should have $transaction method', () => {
      expect(typeof service.$transaction).toBe('function');
    });

    it('should execute $queryRaw successfully', async () => {
      const result = await service.$queryRaw`SELECT 1`;
      expect(result).toEqual([{ '?column?': 1 }]);
    });
  });

  describe('Transaction support', () => {
    it('should execute transactions via $transaction', async () => {
      const callback = jest.fn().mockResolvedValue('done');
      const result = await service.$transaction(callback);
      expect(result).toBe('done');
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Connection recovery simulation', () => {
    it('should handle disconnect gracefully', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect');
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple disconnect calls', async () => {
      await service.onModuleDestroy();
      await service.onModuleDestroy();
      expect((service as any).$disconnect).toHaveBeenCalledTimes(2);
    });
  });
});
