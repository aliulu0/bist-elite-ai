import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventDto {
  @ApiProperty({ example: 'evt-1700000000000-abc' })
  id!: string;

  @ApiProperty({ example: 'workflow.created' })
  type!: string;

  @ApiProperty({ example: 1700000000000 })
  timestamp!: number;

  @ApiPropertyOptional({ example: 'corr-123' })
  correlationId!: string | null;

  @ApiProperty({ example: 'workflow-engine' })
  source!: string;

  @ApiProperty({ example: 'info', enum: ['info', 'warning', 'error', 'critical'] })
  severity!: string;

  @ApiProperty({ example: 'system', enum: ['system', 'scheduler', 'scanner', 'analysis', 'opportunity', 'elite_score', 'provider', 'performance', 'backtest'] })
  category!: string;

  @ApiProperty({ type: Object, example: { workflowId: 'wf-1' } })
  payload!: unknown;

  @ApiProperty({ type: Object, example: { source: 'api' } })
  metadata!: Record<string, unknown>;
}

export class EventStatisticsDto {
  @ApiProperty({ example: 150 })
  totalPublished!: number;

  @ApiProperty({ example: 145 })
  totalDelivered!: number;

  @ApiProperty({ example: 5 })
  totalFailed!: number;

  @ApiProperty({ example: 3 })
  activeSubscriptions!: number;

  @ApiProperty({ example: 50 })
  historySize!: number;

  @ApiProperty({ type: Object, example: { system: 20, scheduler: 30 } })
  eventsByCategory!: Record<string, number>;

  @ApiProperty({ type: Object, example: { 'workflow.created': 10, 'workflow.completed': 8 } })
  eventsByType!: Record<string, number>;
}

export class EventTypeDto {
  @ApiProperty({ example: 'workflow.created' })
  type!: string;

  @ApiProperty({ example: 10 })
  count!: number;
}

export class EventHistoryPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: Object })
  data!: { events: EventDto[]; total: number; limit: number; offset: number };

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class EventTypesPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [EventTypeDto] })
  data!: EventTypeDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class EventsByTypePageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [EventDto] })
  data!: EventDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class EventStatisticsPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: EventStatisticsDto })
  data!: EventStatisticsDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class EventClearResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Event history cleared successfully' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class EventErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Invalid event type' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
