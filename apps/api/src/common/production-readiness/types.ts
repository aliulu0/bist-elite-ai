// ============================================================
// Production Readiness & Release Management — Types
// ============================================================

export enum ReadinessStatus {
  PASS = 'pass',
  WARN = 'warn',
  FAIL = 'fail',
  SKIP = 'skip',
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum ReadinessLevel {
  PRODUCTION_READY = 'production_ready',
  MOSTLY_READY = 'mostly_ready',
  NEEDS_WORK = 'needs_work',
  NOT_READY = 'not_ready',
}

// ---------- Config Validation ----------

export interface ConfigItem {
  key: string;
  present: boolean;
  required: boolean;
  valid: boolean;
  sensitive: boolean;
  defaultValue?: string;
  resolvedValue?: string;
  validationMessage?: string;
}

export interface ConfigValidationResult {
  status: ReadinessStatus;
  timestamp: string;
  environment: string;
  items: ConfigItem[];
  totalRequired: number;
  totalPresent: number;
  totalValid: number;
  issues: ValidationIssue[];
}

// ---------- Dependency Validation ----------

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development';
  license: string;
  deprecated: boolean;
  issues: string[];
}

export interface DependencyValidationResult {
  status: ReadinessStatus;
  timestamp: string;
  totalDependencies: number;
  outdated: number;
  deprecated: number;
  licenseConflicts: number;
  duplicatePackages: string[];
  unusedPackages: string[];
  dependencies: DependencyInfo[];
  issues: ValidationIssue[];
}

// ---------- System Health ----------

export enum ComponentType {
  DATABASE = 'database',
  REDIS = 'redis',
  QUEUE = 'queue',
  WORKER = 'worker',
  TELEGRAM_BOT = 'telegram_bot',
  API = 'api',
  MEMORY = 'memory',
  CPU = 'cpu',
  DISK = 'disk',
}

export interface ComponentHealthDetail {
  component: ComponentType;
  status: ReadinessStatus;
  latencyMs: number;
  message: string;
  metadata?: Record<string, unknown>;
  lastChecked: string;
}

export interface SystemHealthResult {
  status: ReadinessStatus;
  level: ReadinessLevel;
  timestamp: string;
  uptime: number;
  components: ComponentHealthDetail[];
  healthyCount: number;
  warnCount: number;
  failCount: number;
}

// ---------- Recovery ----------

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export interface CircuitBreakerState {
  name: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: string;
  nextAttemptTime?: string;
}

export interface RecoveryAction {
  name: string;
  status: ReadinessStatus;
  message: string;
  executedAt?: string;
  durationMs?: number;
}

export interface RecoveryResult {
  status: ReadinessStatus;
  timestamp: string;
  actions: RecoveryAction[];
  circuitBreakers: CircuitBreakerState[];
}

// ---------- Resource Validation ----------

export interface ResourceSnapshot {
  timestamp: string;
  memoryUsageMb: number;
  memoryTotalMb: number;
  memoryPercent: number;
  cpuUsagePercent: number;
  diskUsageMb: number;
  diskTotalMb: number;
  diskPercent: number;
  heapUsedMb: number;
  heapTotalMb: number;
  activeHandles: number;
  activeRequests: number;
  eventLoopLagMs: number;
}

export interface ResourceThresholds {
  memoryPercentWarn: number;
  memoryPercentCritical: number;
  cpuPercentWarn: number;
  cpuPercentCritical: number;
  diskPercentWarn: number;
  diskPercentCritical: number;
  eventLoopLagWarnMs: number;
  eventLoopLagCriticalMs: number;
}

export interface ResourceValidationResult {
  status: ReadinessStatus;
  timestamp: string;
  snapshot: ResourceSnapshot;
  breaches: ResourceBreach[];
}

export interface ResourceBreach {
  resource: string;
  current: number;
  threshold: number;
  severity: Severity;
  message: string;
}

// ---------- Security Validation ----------

export interface SecurityCheckItem {
  name: string;
  status: ReadinessStatus;
  category: string;
  message: string;
  recommendation?: string;
}

export interface SecurityValidationResult {
  status: ReadinessStatus;
  timestamp: string;
  score: number;
  checks: SecurityCheckItem[];
  criticalIssues: number;
  warnings: number;
}

// ---------- Performance Validation ----------

export interface PerformanceBenchmark {
  name: string;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  samples: number;
  thresholdMs: number;
  status: ReadinessStatus;
}

export interface PerformanceValidationResult {
  status: ReadinessStatus;
  timestamp: string;
  benchmarks: PerformanceBenchmark[];
  overallScore: number;
}

// ---------- Deployment Checklist ----------

export enum ChecklistPhase {
  PRE_DEPLOYMENT = 'pre_deployment',
  DEPLOYMENT = 'deployment',
  POST_DEPLOYMENT = 'post_deployment',
  ROLLBACK = 'rollback',
}

export interface ChecklistItem {
  id: string;
  description: string;
  phase: ChecklistPhase;
  completed: boolean;
  mandatory: boolean;
  category: string;
  notes?: string;
}

export interface DeploymentChecklistResult {
  status: ReadinessStatus;
  timestamp: string;
  phase: ChecklistPhase;
  items: ChecklistItem[];
  totalItems: number;
  completedItems: number;
  mandatoryItems: number;
  completedMandatory: number;
}

// ---------- Backup ----------

export interface BackupItem {
  id: string;
  type: string;
  name: string;
  sizeBytes: number;
  createdAt: string;
  path: string;
  status: ReadinessStatus;
}

export interface BackupResult {
  status: ReadinessStatus;
  timestamp: string;
  backups: BackupItem[];
  totalSizeBytes: number;
  oldestBackup?: string;
  newestBackup?: string;
}

// ---------- Release Management ----------

export interface ReleaseVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection[];
}

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface MigrationRecord {
  id: string;
  name: string;
  appliedAt: string;
  status: ReadinessStatus;
}

export interface ReleaseReadinessResult {
  status: ReadinessStatus;
  timestamp: string;
  version: ReleaseVersion;
  changelogValid: boolean;
  changelogIssues: string[];
  migrationsApplied: boolean;
  migrationRecords: MigrationRecord[];
  rollbackSupported: boolean;
  semverCompliant: boolean;
}

// ---------- Orchestrator ----------

export interface ProductionReadinessReport {
  timestamp: string;
  overallStatus: ReadinessStatus;
  overallLevel: ReadinessLevel;
  overallScore: number;
  configValidation: ConfigValidationResult;
  dependencyValidation: DependencyValidationResult;
  systemHealth: SystemHealthResult;
  recovery: RecoveryResult;
  resourceValidation: ResourceValidationResult;
  securityValidation: SecurityValidationResult;
  performanceValidation: PerformanceValidationResult;
  deploymentChecklist: DeploymentChecklistResult;
  backupStatus: BackupResult;
  releaseReadiness: ReleaseReadinessResult;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  severity: Severity;
  category: string;
  message: string;
  recommendation: string;
  impact: string;
}

// ---------- Config Defaults ----------

export interface ProductionReadinessConfig {
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  resourceThresholds: ResourceThresholds;
  retryPolicy: RetryPolicy;
  healthCheckTimeoutMs: number;
  performanceThresholds: Record<string, number>;
}
