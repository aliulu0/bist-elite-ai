export type WorkflowTab = 'overview' | 'queue' | 'workers' | 'history' | 'statistics';

export const WORKFLOW_TABS: Array<{ key: WorkflowTab; label: string }> = [
  { key: 'overview', label: 'Genel' },
  { key: 'queue', label: 'Kuyruk' },
  { key: 'workers', label: 'Çalışanlar' },
  { key: 'history', label: 'Geçmiş' },
  { key: 'statistics', label: 'İstatistikler' },
];

export type WorkflowStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT' | 'RETRYING';

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  PENDING: 'Bekliyor',
  QUEUED: 'Kuyrukta',
  RUNNING: 'Çalışıyor',
  COMPLETED: 'Tamamlandı',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal',
  TIMEOUT: 'Zaman Aşımı',
  RETRYING: 'Yeniden Deniyor',
};

export const STATUS_COLORS: Record<WorkflowStatus, string> = {
  PENDING: 'text-muted-foreground',
  QUEUED: 'text-warning',
  RUNNING: 'text-info',
  COMPLETED: 'text-success',
  FAILED: 'text-destructive',
  CANCELLED: 'text-warning',
  TIMEOUT: 'text-destructive',
  RETRYING: 'text-warning',
};

export const STATUS_BADGE: Record<WorkflowStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  PENDING: 'default',
  QUEUED: 'warning',
  RUNNING: 'info',
  COMPLETED: 'success',
  FAILED: 'danger',
  CANCELLED: 'warning',
  TIMEOUT: 'danger',
  RETRYING: 'warning',
};

export type WorkflowType = 'ANALYSIS' | 'SCANNING' | 'BACKTEST' | 'PORTFOLIO' | 'WATCHLIST' | 'CUSTOM';

export const TYPE_LABELS: Record<WorkflowType, string> = {
  ANALYSIS: 'Analiz',
  SCANNING: 'Tarama',
  BACKTEST: 'Geri Test',
  PORTFOLIO: 'Portföy',
  WATCHLIST: 'İzleme',
  CUSTOM: 'Özel',
};

export type StepStatus = 'completed' | 'running' | 'waiting' | 'skipped' | 'failed';

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  completed: 'Tamamlandı',
  running: 'Çalışıyor',
  waiting: 'Bekliyor',
  skipped: 'Atlandı',
  failed: 'Başarısız',
};

export const STEP_STATUS_COLORS: Record<StepStatus, string> = {
  completed: 'text-success',
  running: 'text-info',
  waiting: 'text-muted-foreground',
  skipped: 'text-warning',
  failed: 'text-destructive',
};

export type QueueJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER';

export const QUEUE_STATUS_LABELS: Record<QueueJobStatus, string> = {
  PENDING: 'Bekliyor',
  RUNNING: 'Çalışıyor',
  COMPLETED: 'Tamamlandı',
  FAILED: 'Başarısız',
  RETRYING: 'Yeniden Deniyor',
  DEAD_LETTER: 'Ölü Mektup',
};

export interface WorkflowItem {
  id: string;
  type: string;
  status: WorkflowStatus;
  symbol: string;
  steps: Array<{
    step: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    error?: string | null;
  }>;
  currentStep: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  createdAt: string;
  worker?: string;
  retryCount?: number;
  priority?: string;
}

export interface QueueJob {
  id: string;
  workflowId: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface WorkerInfo {
  id: string;
  status: 'active' | 'idle' | 'offline';
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  utilization: number;
}

export interface WorkflowStatistics {
  totalCreated: number;
  totalCompleted: number;
  totalFailed: number;
  totalCancelled: number;
  activeWorkflows: number;
  avgDurationMs: number;
  byType: Record<string, { created: number; completed: number; failed: number }>;
}

export interface WorkflowSnapshot {
  workflows: WorkflowItem[];
  queue: QueueJob[];
  queueStatus: { pending: number; running: number; completed: number; failed: number };
  history: WorkflowItem[];
  statistics: WorkflowStatistics;
  workers: WorkerInfo[];
  todayCount: number;
  lastWorkflow: string | null;
  activeCount: number;
}
