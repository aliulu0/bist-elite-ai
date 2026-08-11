import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

const WORKFLOW_TYPES = ['single_stock_analysis', 'market_scan', 'backtest', 'optimization'] as const;

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Workflow type',
    example: 'single_stock_analysis',
    enum: WORKFLOW_TYPES,
  })
  @IsString()
  @IsIn(WORKFLOW_TYPES, { message: `type must be one of: ${WORKFLOW_TYPES.join(', ')}` })
  type!: string;

  @ApiPropertyOptional({
    description: 'Stock symbol (required for single_stock_analysis)',
    example: 'THYAO',
  })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'manual', priority: 'high' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class WorkflowListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by type', enum: WORKFLOW_TYPES })
  @IsOptional()
  @IsString()
  type?: string;
}

export class WorkflowHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by type', enum: WORKFLOW_TYPES })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Max history entries', example: 50, default: 50, minimum: 1, maximum: 500 })
  @IsOptional()
  limit?: number;
}
