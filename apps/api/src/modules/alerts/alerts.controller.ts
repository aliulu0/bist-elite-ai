import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { AlertEngine } from './engine/alert-engine.service';

@ApiTags('Alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertEngine: AlertEngine) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get alert history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  getAlerts(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const history = this.alertEngine.getHistory(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
    return {
      success: true,
      data: {
        alerts: history.map((entry) => ({
          ...entry.alert,
          deliveredChannels: entry.channelsSent,
          failedChannels: entry.channelsFailed,
          deliveredAt: entry.timestamp,
          durationMs: entry.durationMs,
        })),
        total: this.alertEngine.getHistory().length,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get alert metrics' })
  getMetrics() {
    return {
      success: true,
      data: this.alertEngine.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/acknowledge')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiParam({ name: 'id', type: String })
  async acknowledge(@Param('id') id: string) {
    const ok = await this.alertEngine.acknowledgeAlert(id);
    return {
      success: ok,
      message: ok ? 'Alert acknowledged' : 'Alert not found',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/dismiss')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiParam({ name: 'id', type: String })
  async dismiss(@Param('id') id: string) {
    const ok = await this.alertEngine.dismissAlert(id);
    return {
      success: ok,
      message: ok ? 'Alert dismissed' : 'Alert not found',
      timestamp: new Date().toISOString(),
    };
  }
}
