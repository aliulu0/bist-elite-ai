import { AlertType, AlertPriority, AlertChannelType, AlertStatus } from '../alerts.types';

export interface CreateAlertDto {
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  symbol: string;
  channels?: AlertChannelType[];
  triggerCondition?: Record<string, unknown>;
  source?: Record<string, unknown>;
  rawData?: Record<string, unknown>;
}

export interface AlertResponseDto {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  symbol: string;
  channels: AlertChannelType[];
  status: AlertStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  dismissedAt: string | null;
  metadata: {
    duplicateSuppressed: boolean;
    cooldownApplied: boolean;
    deliveryAttempts: number;
  };
}

export interface AlertQueryDto {
  type?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  symbol?: string;
  limit?: number;
  offset?: number;
  fromDate?: string;
  toDate?: string;
}

export interface AlertUpdateDto {
  status: AlertStatus;
}

export interface AlertMetricsResponseDto {
  totalAlertsCreated: number;
  totalAlertsDelivered: number;
  totalAlertsFailed: number;
  totalDuplicatesSuppressed: number;
  totalCooldownsApplied: number;
  alertsByType: Record<string, number>;
  alertsByPriority: Record<string, number>;
  alertsByStatus: Record<string, number>;
  averageDeliveryDurationMs: number;
  timestamp: string;
}
