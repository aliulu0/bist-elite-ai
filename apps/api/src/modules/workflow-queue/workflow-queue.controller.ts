import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { WorkflowQueueService } from './workflow-queue.service';
import { JobIdParamDto, JobsQueryDto } from './dto/workflow-queue-query.dto';
import {
  QueueSnapshotResponseDto,
  QueueStatisticsResponseDto,
  QueuePageDto,
  QueueJobResponseDto,
  QueueActionResponseDto,
  QueueErrorDto,
} from './dto/workflow-queue-response.dto';

@ApiTags('Workflow Queue')
@Controller('v1/queue')
export class WorkflowQueueController {
  constructor(private readonly service: WorkflowQueueService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get queue snapshot' })
  @ApiOkResponse({ type: QueueSnapshotResponseDto })
  async getSnapshot(): Promise<{
    success: boolean;
    data: ReturnType<WorkflowQueueService['getSnapshot']>;
    timestamp: string;
  }> {
    return {
      success: true,
      data: this.service.getSnapshot(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('statistics')
  @Public()
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiOkResponse({ type: QueueStatisticsResponseDto })
  async getStatistics(): Promise<{
    success: boolean;
    data: ReturnType<WorkflowQueueService['getStatistics']>;
    timestamp: string;
  }> {
    return {
      success: true,
      data: this.service.getStatistics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('jobs')
  @Public()
  @ApiOperation({ summary: 'Get all jobs with filtering and pagination' })
  @ApiOkResponse({ type: QueuePageDto })
  @ApiBadRequestResponse({ type: QueueErrorDto })
  async getJobs(@Query() query: JobsQueryDto): Promise<{
    success: boolean;
    data: { jobs: ReturnType<WorkflowQueueService['getAllJobs']>['jobs']; total: number; limit: number; offset: number };
    timestamp: string;
  }> {
    if (query.state && !this.service.isStateValid(query.state)) {
      return {
        success: false,
        data: { jobs: [], total: 0, limit: query.limit ?? 50, offset: query.offset ?? 0 },
        timestamp: new Date().toISOString(),
      };
    }

    if (query.priority && !this.service.isPriorityValid(query.priority)) {
      return {
        success: false,
        data: { jobs: [], total: 0, limit: query.limit ?? 50, offset: query.offset ?? 0 },
        timestamp: new Date().toISOString(),
      };
    }

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const { jobs, total } = this.service.getAllJobs({ limit, offset, state: query.state, priority: query.priority });

    return {
      success: true,
      data: { jobs, total, limit, offset },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('job/:id')
  @Public()
  @ApiOperation({ summary: 'Get single job by ID' })
  @ApiOkResponse({ type: QueueJobResponseDto })
  @ApiNotFoundResponse({ type: QueueErrorDto })
  async getJob(@Param() params: JobIdParamDto): Promise<{
    success: boolean;
    data?: ReturnType<WorkflowQueueService['getJob']>;
    message?: string;
    timestamp: string;
  }> {
    const job = this.service.getJob(params.id);
    if (!job) {
      return {
        success: false,
        message: `Job not found: ${params.id}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: job,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('start')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the queue' })
  @ApiOkResponse({ type: QueueActionResponseDto })
  async startQueue(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    this.service.start();
    return {
      success: true,
      message: 'Queue started successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('stop')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop the queue' })
  @ApiOkResponse({ type: QueueActionResponseDto })
  async stopQueue(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    this.service.stop();
    return {
      success: true,
      message: 'Queue stopped successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('job/:id/retry')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed or dead-lettered job' })
  @ApiOkResponse({ type: QueueActionResponseDto })
  @ApiNotFoundResponse({ type: QueueErrorDto })
  @ApiBadRequestResponse({ type: QueueErrorDto })
  async retryJob(@Param() params: JobIdParamDto): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    const job = this.service.getJob(params.id);
    if (!job) {
      return {
        success: false,
        message: `Job not found: ${params.id}`,
        timestamp: new Date().toISOString(),
      };
    }

    if (job.state !== 'FAILED' && job.state !== 'DEAD_LETTER') {
      return {
        success: false,
        message: `Job cannot be retried in state: ${job.state}`,
        timestamp: new Date().toISOString(),
      };
    }

    const result = this.service.retryJob(params.id);
    return {
      success: result,
      message: result ? 'Job queued for retry' : 'Failed to retry job',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('job/:id/cancel')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiOkResponse({ type: QueueActionResponseDto })
  @ApiNotFoundResponse({ type: QueueErrorDto })
  @ApiBadRequestResponse({ type: QueueErrorDto })
  async cancelJob(@Param() params: JobIdParamDto): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    const job = this.service.getJob(params.id);
    if (!job) {
      return {
        success: false,
        message: `Job not found: ${params.id}`,
        timestamp: new Date().toISOString(),
      };
    }

    if (job.state === 'COMPLETED' || job.state === 'FAILED' || job.state === 'CANCELLED' || job.state === 'DEAD_LETTER') {
      return {
        success: false,
        message: `Job cannot be cancelled in state: ${job.state}`,
        timestamp: new Date().toISOString(),
      };
    }

    const result = this.service.cancelJob(params.id);
    return {
      success: result,
      message: result ? 'Job cancelled successfully' : 'Failed to cancel job',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('clear')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the entire queue' })
  @ApiOkResponse({ type: QueueActionResponseDto })
  async clearQueue(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    this.service.clear();
    return {
      success: true,
      message: 'Queue cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
