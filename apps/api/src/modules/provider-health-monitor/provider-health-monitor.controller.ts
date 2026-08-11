import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { ProviderHealthMonitorService } from './provider-health-monitor.service';
import { ProviderName } from './provider-health-monitor.types';
import {
  ProviderParamDto,
  HistoryQueryDto,
  VALID_PROVIDERS,
  ProviderSnapshotPageDto,
  ProviderStatePageDto,
  ProviderHistoryPageDto,
  ProviderResetResponseDto,
  ProviderResetSingleResponseDto,
  ProviderErrorDto,
} from './dto';

@ApiTags('Provider Health Monitor')
@Controller('providers')
export class ProviderHealthMonitorController {
  constructor(private readonly service: ProviderHealthMonitorService) {}

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get overall provider health snapshot' })
  @ApiResponse({ status: 200, description: 'Provider health snapshot', type: ProviderSnapshotPageDto })
  getSnapshot(): ProviderSnapshotPageDto {
    const snapshot = this.service.getSnapshot();
    return {
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single provider health' })
  @ApiParam({ name: 'provider', enum: VALID_PROVIDERS, description: 'Provider name' })
  @ApiResponse({ status: 200, description: 'Provider health state', type: ProviderStatePageDto })
  @ApiBadRequestResponse({ description: 'Invalid provider name', type: ProviderErrorDto })
  getProvider(@Param() params: ProviderParamDto): ProviderStatePageDto {
    this.ensureValidProvider(params.provider);
    const state = this.service.getProviderState(params.provider as ProviderName);
    return {
      success: true,
      data: state,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('history/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get provider request history' })
  @ApiParam({ name: 'provider', enum: VALID_PROVIDERS, description: 'Provider name' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max history entries (default 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination (default 0)' })
  @ApiResponse({ status: 200, description: 'Provider request history', type: ProviderHistoryPageDto })
  @ApiBadRequestResponse({ description: 'Invalid provider name', type: ProviderErrorDto })
  getHistory(
    @Param() params: ProviderParamDto,
    @Query() query: HistoryQueryDto,
  ): ProviderHistoryPageDto {
    this.ensureValidProvider(params.provider);
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const { requests, total } = this.service.getRequestHistory(
      params.provider as ProviderName,
      limit,
      offset,
    );
    return {
      success: true,
      data: { requests, total, limit, offset },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all provider statistics' })
  @ApiResponse({ status: 200, description: 'All providers reset', type: ProviderResetResponseDto })
  resetAll(): ProviderResetResponseDto {
    this.service.resetAll();
    return {
      success: true,
      message: 'All provider statistics have been reset',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset single provider statistics' })
  @ApiParam({ name: 'provider', enum: VALID_PROVIDERS, description: 'Provider name' })
  @ApiResponse({ status: 200, description: 'Provider reset', type: ProviderResetSingleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid provider name', type: ProviderErrorDto })
  resetProvider(@Param() params: ProviderParamDto): ProviderResetSingleResponseDto {
    this.ensureValidProvider(params.provider);
    this.service.resetProvider(params.provider as ProviderName);
    return {
      success: true,
      message: `Provider '${params.provider}' statistics have been reset`,
      timestamp: new Date().toISOString(),
    };
  }

  private ensureValidProvider(provider: string): void {
    if (!(VALID_PROVIDERS as readonly string[]).includes(provider)) {
      throw new BadRequestException(
        `Invalid provider '${provider}'. Valid providers: ${VALID_PROVIDERS.join(', ')}`,
      );
    }
  }
}
