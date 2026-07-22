import { Module } from '@nestjs/common';
import { ConfigValidatorService } from './config-validator.service';
import { DependencyValidatorService } from './dependency-validator.service';
import { ProductionHealthService } from './production-health.service';
import { RecoveryService } from './recovery.service';
import { ResourceMonitorService } from './resource-monitor.service';
import { SecurityValidatorService } from './security-validator.service';
import { PerformanceValidatorService } from './performance-validator.service';
import { DeploymentChecklistService } from './deployment-checklist.service';
import { BackupService } from './backup.service';
import { ReleaseManagementService } from './release-management.service';
import { ProductionReadinessOrchestrator } from './orchestrator.service';
import { ProductionReadinessController } from './production-readiness.controller';

@Module({
  providers: [
    ConfigValidatorService,
    DependencyValidatorService,
    ProductionHealthService,
    RecoveryService,
    ResourceMonitorService,
    SecurityValidatorService,
    PerformanceValidatorService,
    DeploymentChecklistService,
    BackupService,
    ReleaseManagementService,
    ProductionReadinessOrchestrator,
  ],
  controllers: [ProductionReadinessController],
  exports: [
    ConfigValidatorService,
    DependencyValidatorService,
    ProductionHealthService,
    RecoveryService,
    ResourceMonitorService,
    SecurityValidatorService,
    PerformanceValidatorService,
    DeploymentChecklistService,
    BackupService,
    ReleaseManagementService,
    ProductionReadinessOrchestrator,
  ],
})
export class ProductionReadinessModule {}
