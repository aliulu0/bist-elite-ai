import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { EventBusService } from './event-bus.service';
import {
  EventTypeParamDto,
  HistoryQueryDto,
  EventsByTypeQueryDto,
} from './dto/event-bus-query.dto';
import {
  EventDto,
  EventStatisticsDto,
  EventTypeDto,
  EventHistoryPageDto,
  EventTypesPageDto,
  EventsByTypePageDto,
  EventStatisticsPageDto,
  EventClearResponseDto,
  EventErrorDto,
} from './dto/event-bus-response.dto';

@ApiTags('Events')
@Controller('v1/events')
export class EventBusController {
  constructor(private readonly service: EventBusService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get recent events with pagination' })
  @ApiOkResponse({ type: EventHistoryPageDto })
  @ApiBadRequestResponse({ type: EventErrorDto })
  async getEvents(@Query() query: HistoryQueryDto): Promise<{
    success: boolean;
    data: { events: EventDto[]; total: number; limit: number; offset: number };
    timestamp: string;
  }> {
    if (query.category && !this.service.isCategoryValid(query.category)) {
      return {
        success: false,
        data: { events: [], total: 0, limit: query.limit ?? 50, offset: query.offset ?? 0 },
        timestamp: new Date().toISOString(),
      };
    }

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const { events, total } = this.service.getHistory({
      limit,
      offset,
      category: query.category,
      type: query.type,
    });

    return {
      success: true,
      data: { events, total, limit, offset },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('types')
  @Public()
  @ApiOperation({ summary: 'Get registered event types' })
  @ApiOkResponse({ type: EventTypesPageDto })
  async getEventTypes(): Promise<{
    success: boolean;
    data: EventTypeDto[];
    timestamp: string;
  }> {
    return {
      success: true,
      data: this.service.getEventTypes(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('type/:type')
  @Public()
  @ApiOperation({ summary: 'Get events by type' })
  @ApiOkResponse({ type: EventsByTypePageDto })
  @ApiBadRequestResponse({ type: EventErrorDto })
  async getEventsByType(
    @Param() params: EventTypeParamDto,
    @Query() query: EventsByTypeQueryDto,
  ): Promise<{
    success: boolean;
    data: EventDto[];
    timestamp: string;
  }> {
    return {
      success: true,
      data: this.service.getEventsByType(params.type, {
        limit: query.limit,
        category: query.category,
      }),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('statistics')
  @Public()
  @ApiOperation({ summary: 'Get event bus statistics' })
  @ApiOkResponse({ type: EventStatisticsPageDto })
  async getStatistics(): Promise<{
    success: boolean;
    data: EventStatisticsDto;
    timestamp: string;
  }> {
    return {
      success: true,
      data: this.service.getStatistics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('clear')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear event history' })
  @ApiOkResponse({ type: EventClearResponseDto })
  async clearHistory(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    this.service.clear();
    return {
      success: true,
      message: 'Event history cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
