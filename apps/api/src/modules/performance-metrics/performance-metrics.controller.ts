import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PerformanceMetricsService } from './performance-metrics.service';

@ApiTags('Performance')
@Controller('performance')
export class PerformanceMetricsController {
  constructor(private readonly metrics: PerformanceMetricsService) {}

  @Get('cache')
  @Public()
  @ApiOperation({ summary: 'Cache hit rates and memory usage' })
  getCache(): ReturnType<PerformanceMetricsService['getCacheMetrics']> {
    return this.metrics.getCacheMetrics();
  }

  @Get('indicators')
  @Public()
  @ApiOperation({ summary: 'Indicator calculation savings' })
  getIndicators(): ReturnType<PerformanceMetricsService['getIndicatorMetrics']> {
    return this.metrics.getIndicatorMetrics();
  }

  @Get('dedup')
  @Public()
  @ApiOperation({ summary: 'Deduplication and registry hit rates' })
  getDedup(): ReturnType<PerformanceMetricsService['getDedupMetrics']> {
    return this.metrics.getDedupMetrics();
  }

  @Get('summary')
  @Public()
  @ApiOperation({ summary: 'Aggregate performance summary' })
  getSummary(): ReturnType<PerformanceMetricsService['getSummary']> {
    return this.metrics.getSummary();
  }
}
