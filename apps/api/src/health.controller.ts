import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/auth/decorators';
import { AuthService } from './common/auth/auth.service';
import { FeatureFlags } from './common/auth/feature-flags';
import { HealthService } from './common/monitoring/health.service';
import { MetricsService } from './common/monitoring/metrics.service';
import { AppLoggerService } from './common/logger/logger.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly authService: AuthService,
    private readonly featureFlags: FeatureFlags,
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
    private readonly logger: AppLoggerService,
  ) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Full health check with dependency status' })
  async check() {
    this.logger.log('Health check requested', 'HealthController');
    const result = await this.healthService.checkHealth();
    return result;
  }

  @Get('health/ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check' })
  async readiness() {
    const ready = await this.healthService.checkReadiness();
    return {
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/live')
  @Public()
  @ApiOperation({ summary: 'Liveness check' })
  async liveness() {
    const alive = await this.healthService.checkLiveness();
    return {
      status: alive ? 'alive' : 'dead',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('auth/status')
  @Public()
  @ApiOperation({ summary: 'Authentication status' })
  authStatus() {
    const config = this.authService.getAuthConfigSummary();
    return {
      authEnabled: this.authService.isAuthEnabled,
      allowAnonymous: this.authService.isAllowAnonymous,
      jwtConfigured: config.jwtConfigured,
      apiKeyConfigured: config.apiKeyConfigured,
      featureFlags: this.featureFlags.getEnabled().map((f) => f.name),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Application metrics' })
  metrics() {
    return this.metricsService.getSnapshot();
  }
}
