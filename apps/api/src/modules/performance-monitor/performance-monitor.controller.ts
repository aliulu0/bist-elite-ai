import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PerformanceMonitorService } from './performance-monitor.service';
import { MetricCategory } from './performance-monitor.types';
import {
  PerformancePageDto,
  PerformanceHealthPageDto,
  PerformanceCachePageDto,
  PerformanceSystemPageDto,
  PerformanceMetricsPageDto,
  PerformanceCategoryPageDto,
  PerformanceMetricPageDto,
  PerformanceResetResponseDto,
  PerformanceMetricResetResponseDto,
  PerformanceErrorDto,
  CategoryParamDto,
  MetricParamDto,
  VALID_CATEGORIES,
} from './dto';

@ApiTags('Performance Monitor')
@Controller('performance')
export class PerformanceMonitorController {
  constructor(private readonly service: PerformanceMonitorService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full performance snapshot' })
  @ApiResponse({ status: 200, description: 'Full performance snapshot', type: PerformancePageDto })
  getSnapshot(): PerformancePageDto {
    const snapshot = this.service.getSnapshot();
    return {
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get system health' })
  @ApiResponse({ status: 200, description: 'System health check', type: PerformanceHealthPageDto })
  getHealth(): PerformanceHealthPageDto {
    const health = this.service.getHealth();
    return {
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cache metrics' })
  @ApiResponse({ status: 200, description: 'Cache performance metrics', type: PerformanceCachePageDto })
  getCache(): PerformanceCachePageDto {
    const cache = this.service.getCacheMetrics();
    return {
      success: true,
      data: cache,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('system')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System resource metrics', type: PerformanceSystemPageDto })
  getSystem(): PerformanceSystemPageDto {
    const system = this.service.getSystemMetrics();
    return {
      success: true,
      data: system,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all metrics' })
  @ApiResponse({ status: 200, description: 'All metric statistics', type: PerformanceMetricsPageDto })
  getMetrics(): PerformanceMetricsPageDto {
    const metrics = this.service.getAllMetrics();
    return {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('category/:category')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get metrics by category' })
  @ApiParam({ name: 'category', enum: VALID_CATEGORIES, description: 'Metric category' })
  @ApiResponse({ status: 200, description: 'Metrics for the specified category', type: PerformanceCategoryPageDto })
  @ApiBadRequestResponse({ description: 'Invalid category', type: PerformanceErrorDto })
  getCategory(@Param() params: CategoryParamDto): PerformanceCategoryPageDto {
    this.ensureValidCategory(params.category);
    const metrics = this.service.getMetricsByCategory(params.category as MetricCategory);
    return {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metric/:name')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single metric statistics' })
  @ApiParam({ name: 'name', description: 'Metric name' })
  @ApiResponse({ status: 200, description: 'Metric statistics', type: PerformanceMetricPageDto })
  @ApiNotFoundResponse({ description: 'Metric not found', type: PerformanceErrorDto })
  getMetric(@Param() params: MetricParamDto): PerformanceMetricPageDto {
    const stats = this.service.getMetricStats(params.name);
    if (!stats) {
      throw new NotFoundException(`Metric '${params.name}' not found`);
    }
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all metrics' })
  @ApiResponse({ status: 200, description: 'All metrics reset', type: PerformanceResetResponseDto })
  resetAll(): PerformanceResetResponseDto {
    this.service.resetAllMetrics();
    return {
      success: true,
      message: 'All metrics have been reset',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('metric/:name/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a single metric' })
  @ApiParam({ name: 'name', description: 'Metric name' })
  @ApiResponse({ status: 200, description: 'Metric reset', type: PerformanceMetricResetResponseDto })
  @ApiNotFoundResponse({ description: 'Metric not found', type: PerformanceErrorDto })
  resetMetric(@Param() params: MetricParamDto): PerformanceMetricResetResponseDto {
    const reset = this.service.resetMetric(params.name);
    if (!reset) {
      throw new NotFoundException(`Metric '${params.name}' not found`);
    }
    return {
      success: true,
      message: `Metric '${params.name}' has been reset`,
      timestamp: new Date().toISOString(),
    };
  }

  private ensureValidCategory(category: string): void {
    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      throw new BadRequestException(
        `Invalid category '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      );
    }
  }
}
