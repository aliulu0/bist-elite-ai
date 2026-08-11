import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { WorkflowService } from './workflow.service';
import { WorkflowType, WorkflowStatus } from './workflow.types';
import {
  CreateWorkflowDto,
  WorkflowListQueryDto,
  WorkflowHistoryQueryDto,
  CreateWorkflowResponseDto,
  WorkflowPageDto,
  WorkflowStatisticsDto,
  WorkflowActionResponseDto,
  WorkflowErrorDto,
  WorkflowInstanceDto,
} from './dto';

const VALID_WORKFLOW_TYPES: WorkflowType[] = [
  'single_stock_analysis',
  'market_scan',
  'backtest',
  'optimization',
];

const VALID_STATUSES: WorkflowStatus[] = [
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'timeout',
  'cancelled',
];

@ApiTags('Workflows')
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all workflows with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: VALID_STATUSES })
  @ApiQuery({ name: 'type', required: false, enum: VALID_WORKFLOW_TYPES })
  @ApiResponse({ status: 200, description: 'List of workflows', type: WorkflowPageDto })
  listWorkflows(@Query() query: WorkflowListQueryDto): WorkflowPageDto {
    const filters: { status?: WorkflowStatus; type?: WorkflowType } = {};

    if (query.status) {
      this.ensureValidStatus(query.status);
      filters.status = query.status as WorkflowStatus;
    }
    if (query.type) {
      this.ensureValidType(query.type);
      filters.type = query.type as WorkflowType;
    }

    const workflows = this.workflowService.listWorkflows(filters);
    return {
      data: workflows,
      total: workflows.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('active')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active (pending/queued/running) workflows' })
  @ApiResponse({ status: 200, description: 'Active workflows', type: WorkflowPageDto })
  getActiveWorkflows(): WorkflowPageDto {
    const workflows = this.workflowService.getActiveWorkflows();
    return {
      data: workflows,
      total: workflows.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('history')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get completed workflow history' })
  @ApiQuery({ name: 'type', required: false, enum: VALID_WORKFLOW_TYPES })
  @ApiQuery({ name: 'status', required: false, enum: VALID_STATUSES })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max entries (default 50)' })
  @ApiResponse({ status: 200, description: 'Workflow history', type: WorkflowPageDto })
  getHistory(@Query() query: WorkflowHistoryQueryDto): WorkflowPageDto {
    const filters: { type?: WorkflowType; status?: WorkflowStatus; limit?: number } = {};

    if (query.type) {
      this.ensureValidType(query.type);
      filters.type = query.type as WorkflowType;
    }
    if (query.status) {
      this.ensureValidStatus(query.status);
      filters.status = query.status as WorkflowStatus;
    }
    if (query.limit) {
      filters.limit = query.limit;
    }

    const history = this.workflowService.getHistory(filters);
    return {
      data: history,
      total: history.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('statistics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get workflow execution statistics' })
  @ApiResponse({ status: 200, description: 'Workflow statistics', type: WorkflowStatisticsDto })
  getStatistics(): WorkflowStatisticsDto {
    const stats = this.workflowService.getStatistics();
    return {
      success: true,
      totalCreated: stats.totalCreated,
      totalCompleted: stats.totalCompleted,
      totalFailed: stats.totalFailed,
      totalCancelled: stats.totalCancelled,
      totalTimedOut: stats.totalTimedOut,
      activeWorkflows: stats.activeWorkflows,
      avgDurationMs: stats.avgDurationMs,
      byType: stats.byType,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific workflow by ID' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow details', type: WorkflowInstanceDto })
  @ApiResponse({ status: 404, description: 'Workflow not found', type: WorkflowErrorDto })
  getWorkflow(@Param('id') id: string): WorkflowInstanceDto {
    const workflow = this.workflowService.getWorkflow(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow '${id}' not found`);
    }
    return workflow;
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created', type: CreateWorkflowResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: WorkflowErrorDto })
  createWorkflow(@Body() dto: CreateWorkflowDto): CreateWorkflowResponseDto {
    this.ensureValidType(dto.type);

    if (dto.type === 'single_stock_analysis' && !dto.symbol) {
      throw new BadRequestException('symbol is required for single_stock_analysis workflow');
    }

    const workflow = this.workflowService.createWorkflow(
      dto.type as WorkflowType,
      dto.symbol,
      dto.metadata ?? {},
    );

    return {
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/start')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow started', type: WorkflowActionResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found', type: WorkflowErrorDto })
  @ApiResponse({ status: 409, description: 'Workflow cannot be started', type: WorkflowErrorDto })
  async startWorkflow(@Param('id') id: string): Promise<WorkflowActionResponseDto> {
    const existing = this.workflowService.getWorkflow(id);
    if (!existing) {
      throw new NotFoundException(`Workflow '${id}' not found`);
    }

    if (existing.status !== 'pending' && existing.status !== 'queued') {
      throw new ConflictException(
        `Workflow '${id}' cannot be started in status: ${existing.status}`,
      );
    }

    const workflow = await this.workflowService.startWorkflow(id);
    return {
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/cancel')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow cancelled', type: WorkflowActionResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found', type: WorkflowErrorDto })
  @ApiResponse({ status: 409, description: 'Workflow cannot be cancelled', type: WorkflowErrorDto })
  cancelWorkflow(@Param('id') id: string): WorkflowActionResponseDto {
    const existing = this.workflowService.getWorkflow(id);
    if (!existing) {
      throw new NotFoundException(`Workflow '${id}' not found`);
    }

    if (existing.status === 'completed' || existing.status === 'failed' || existing.status === 'timeout' || existing.status === 'cancelled') {
      throw new ConflictException(
        `Workflow '${id}' cannot be cancelled in status: ${existing.status}`,
      );
    }

    const cancelled = this.workflowService.cancelWorkflow(id);
    if (!cancelled) {
      throw new ConflictException(`Failed to cancel workflow '${id}'`);
    }

    const updated = this.workflowService.getWorkflow(id);
    return {
      success: true,
      data: updated!,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/retry')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed/completed workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'New workflow started', type: WorkflowActionResponseDto })
  @ApiResponse({ status: 404, description: 'Workflow not found', type: WorkflowErrorDto })
  @ApiResponse({ status: 409, description: 'Workflow cannot be retried', type: WorkflowErrorDto })
  async retryWorkflow(@Param('id') id: string): Promise<WorkflowActionResponseDto> {
    const existing = this.workflowService.getWorkflow(id);
    if (!existing) {
      throw new NotFoundException(`Workflow '${id}' not found`);
    }

    if (existing.status !== 'completed' && existing.status !== 'failed' && existing.status !== 'timeout') {
      throw new ConflictException(
        `Workflow '${id}' cannot be retried in status: ${existing.status}`,
      );
    }

    const workflow = await this.workflowService.retryWorkflow(id);
    return {
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    };
  }

  private ensureValidType(type: string): void {
    if (!VALID_WORKFLOW_TYPES.includes(type as WorkflowType)) {
      throw new BadRequestException(
        `Invalid workflow type '${type}'. Valid types: ${VALID_WORKFLOW_TYPES.join(', ')}`,
      );
    }
  }

  private ensureValidStatus(status: string): void {
    if (!VALID_STATUSES.includes(status as WorkflowStatus)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Valid statuses: ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
}
