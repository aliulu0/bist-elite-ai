import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Post, Body, Param, Query, BadRequestException, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../health.controller';
import { HealthService, HealthStatus } from '../common/monitoring/health.service';
import { AuthService } from '../common/auth/auth.service';
import { FeatureFlags } from '../common/auth/feature-flags';
import { MetricsService } from '../common/monitoring/metrics.service';
import { AppLoggerService } from '../common/logger/logger.service';

@Controller('test-errors')
class TestErrorController {
  @Get('bad-request')
  badRequest() {
    throw new BadRequestException('Invalid input provided');
  }

  @Get('not-found')
  notFound() {
    throw new NotFoundException('Resource not found');
  }

  @Get('server-error')
  serverError() {
    throw new Error('Unexpected internal error');
  }

  @Post('validate')
  validate(@Body() body: { name: string }) {
    if (!body.name) {
      throw new BadRequestException('Name is required');
    }
    return { received: body.name };
  }

  @Get('query')
  queryTest(@Query('page') page: string) {
    return { page: parseInt(page, 10) || 1 };
  }
}

describe('Controller Error Handling (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController, TestErrorController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            checkHealth: jest.fn().mockResolvedValue({
              status: HealthStatus.HEALTHY,
              version: '1.0.0',
              uptime: 100,
              timestamp: new Date().toISOString(),
              components: [],
            }),
            checkReadiness: jest.fn().mockResolvedValue(true),
            checkLiveness: jest.fn().mockResolvedValue(true),
          },
        },
        { provide: AuthService, useValue: { isAuthEnabled: false, isAllowAnonymous: true } },
        { provide: FeatureFlags, useValue: { getEnabled: () => [] } },
        { provide: MetricsService, useValue: { getSnapshot: () => ({}) } },
        { provide: AppLoggerService, useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app.getHttpServer()).get('/nonexistent');
      expect(res.status).toBe(404);
    });

    it('should return 404 for deeply nested unknown routes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/unknown');
      expect(res.status).toBe(404);
    });

    it('should return 404 for unknown POST routes', async () => {
      const res = await request(app.getHttpServer()).post('/unknown').send({});
      expect(res.status).toBe(404);
    });
  });

  describe('400 Bad Request', () => {
    it('should return 400 for BadRequestException', async () => {
      const res = await request(app.getHttpServer()).get('/test-errors/bad-request');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 for validation failure', async () => {
      const res = await request(app.getHttpServer())
        .post('/test-errors/validate')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('500 Internal Server Error', () => {
    it('should return 500 for unhandled exceptions', async () => {
      const res = await request(app.getHttpServer()).get('/test-errors/server-error');
      expect(res.status).toBe(500);
    });
  });

  describe('200 Success Responses', () => {
    it('should return 200 for valid health endpoint', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('version');
    });

    it('should return 200 for health/ready', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });

    it('should return 200 for health/live', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });

    it('should return 200 for valid query params', async () => {
      const res = await request(app.getHttpServer()).get('/test-errors/query?page=5');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ page: 5 });
    });

    it('should return 201 for valid POST body', async () => {
      const res = await request(app.getHttpServer())
        .post('/test-errors/validate')
        .send({ name: 'test' });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ received: 'test' });
    });
  });

  describe('Response format consistency', () => {
    it('error responses have statusCode and message', async () => {
      const res = await request(app.getHttpServer()).get('/test-errors/bad-request');
      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('message');
    });

    it('404 responses have standard format', async () => {
      const res = await request(app.getHttpServer()).get('/nonexistent');
      expect(res.body).toHaveProperty('statusCode', 404);
      expect(res.body).toHaveProperty('message');
    });
  });
});
