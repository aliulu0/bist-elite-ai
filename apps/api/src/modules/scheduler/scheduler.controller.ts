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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { SchedulerService } from './scheduler.service';
import { JobName } from './scheduler.types';
import {
  SchedulerStatusResponseDto,
  ExecuteJobResponseDto,
  JobStateDto,
  JobExecutionDto,
  SchedulerErrorDto,
} from './dto';

const VALID_JOB_NAMES: JobName[] = [
  'marketOpenScan', 'incrementalScan', 'nightlyBacktest', 'benchmark',
  'ruleAnalytics', 'weightOptimization', 'cacheRefresh', 'providerHealthCheck',
  'macroRefresh', 'portfolioRefresh', 'alertRefresh', 'retryFailedJobs',
  'fullPipelineRun', 'researchRefresh', 'companyResearch', 'agentReachRefresh',
  'verificationRefresh',
];

@ApiTags('Scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full scheduler status' })
  @ApiResponse({ status: 200, description: 'Scheduler status', type: SchedulerStatusResponseDto })
  getStatus(): SchedulerStatusResponseDto {
    const status = this.schedulerService.getStatus();
    return {
      success: true,
      running: status.running,
      jobs: status.jobs,
      uptime: status.uptime,
      totalExecutions: status.totalExecutions,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':jobName')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific job state' })
  @ApiParam({ name: 'jobName', enum: VALID_JOB_NAMES })
  @ApiResponse({ status: 200, description: 'Job state', type: JobStateDto })
  @ApiResponse({ status: 404, description: 'Job not found', type: SchedulerErrorDto })
  getJobState(@Param('jobName') jobName: string): JobStateDto {
    this.ensureValidJob(jobName);
    const state = this.schedulerService.getJobState(jobName as JobName);
    if (!state) {
      throw new NotFoundException(`Job '${jobName}' not found`);
    }
    return state;
  }

  @Post(':jobName/execute')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually execute a job' })
  @ApiParam({ name: 'jobName', enum: VALID_JOB_NAMES })
  @ApiResponse({ status: 200, description: 'Execution result', type: ExecuteJobResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid job name', type: SchedulerErrorDto })
  async executeJob(@Param('jobName') jobName: string): Promise<ExecuteJobResponseDto> {
    this.ensureValidJob(jobName);
    const execution = await this.schedulerService.executeJob(jobName as JobName);
    return {
      success: true,
      jobName: execution.jobName,
      executionSuccess: execution.success,
      durationMs: execution.durationMs,
      error: execution.error,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('start')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the scheduler' })
  @ApiResponse({ status: 200, description: 'Scheduler started' })
  start() {
    const result = this.schedulerService.startScheduler();
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('stop')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop the scheduler' })
  @ApiResponse({ status: 200, description: 'Scheduler stopped' })
  stop() {
    const result = this.schedulerService.stopScheduler();
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':jobName/enable')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a job' })
  @ApiParam({ name: 'jobName', enum: VALID_JOB_NAMES })
  @ApiResponse({ status: 200, description: 'Job enabled', type: JobStateDto })
  @ApiResponse({ status: 400, description: 'Invalid job name', type: SchedulerErrorDto })
  enable(@Param('jobName') jobName: string): JobStateDto {
    this.ensureValidJob(jobName);
    const state = this.schedulerService.enableJob(jobName as JobName);
    if (!state) {
      throw new NotFoundException(`Job '${jobName}' not found`);
    }
    return state;
  }

  @Post(':jobName/disable')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a job' })
  @ApiParam({ name: 'jobName', enum: VALID_JOB_NAMES })
  @ApiResponse({ status: 200, description: 'Job disabled', type: JobStateDto })
  @ApiResponse({ status: 400, description: 'Invalid job name', type: SchedulerErrorDto })
  disable(@Param('jobName') jobName: string): JobStateDto {
    this.ensureValidJob(jobName);
    const state = this.schedulerService.disableJob(jobName as JobName);
    if (!state) {
      throw new NotFoundException(`Job '${jobName}' not found`);
    }
    return state;
  }

  @Get(':jobName/history')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get job execution history' })
  @ApiParam({ name: 'jobName', enum: VALID_JOB_NAMES })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max history entries (default 50)' })
  @ApiResponse({ status: 200, description: 'Job history', type: [JobExecutionDto] })
  @ApiResponse({ status: 400, description: 'Invalid job name', type: SchedulerErrorDto })
  getHistory(
    @Param('jobName') jobName: string,
    @Query('limit') limit?: number,
  ): JobExecutionDto[] {
    this.ensureValidJob(jobName);
    return this.schedulerService.getJobHistory(jobName as JobName, limit ?? 50);
  }

  private ensureValidJob(jobName: string): void {
    if (!VALID_JOB_NAMES.includes(jobName as JobName)) {
      throw new BadRequestException(
        `Invalid job name '${jobName}'. Valid names: ${VALID_JOB_NAMES.join(', ')}`,
      );
    }
  }
}
