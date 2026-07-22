import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ProductionReadinessOrchestrator } from './orchestrator.service';
import { ConfigValidatorService } from './config-validator.service';
import { ProductionHealthService } from './production-health.service';
import { RecoveryService } from './recovery.service';
import { ResourceMonitorService } from './resource-monitor.service';
import { SecurityValidatorService } from './security-validator.service';
import { PerformanceValidatorService } from './performance-validator.service';
import { DeploymentChecklistService } from './deployment-checklist.service';
import { BackupService } from './backup.service';
import { ReleaseManagementService } from './release-management.service';
import { ChecklistPhase } from './types';

@ApiTags('Production Readiness')
@Controller('production-readiness')
export class ProductionReadinessController {
  constructor(
    private readonly orchestrator: ProductionReadinessOrchestrator,
    private readonly configValidator: ConfigValidatorService,
    private readonly healthService: ProductionHealthService,
    private readonly recoveryService: RecoveryService,
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly securityValidator: SecurityValidatorService,
    private readonly performanceValidator: PerformanceValidatorService,
    private readonly deploymentChecklist: DeploymentChecklistService,
    private readonly backupService: BackupService,
    private readonly releaseManagement: ReleaseManagementService,
  ) {}

  @Get('report')
  @ApiOperation({ summary: 'Full production readiness report' })
  @ApiOkResponse({ description: 'Complete production readiness assessment' })
  async getFullReport() {
    return this.orchestrator.runFullCheck();
  }

  @Get('config')
  @ApiOperation({ summary: 'Validate configuration' })
  @ApiOkResponse({ description: 'Configuration validation result' })
  getConfigValidation() {
    return this.configValidator.validate();
  }

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  @ApiOkResponse({ description: 'System health status' })
  async getHealth() {
    return this.healthService.checkAll();
  }

  @Get('resources')
  @ApiOperation({ summary: 'Resource usage validation' })
  @ApiOkResponse({ description: 'Resource usage snapshot and validation' })
  async getResources() {
    return this.resourceMonitor.validate();
  }

  @Get('security')
  @ApiOperation({ summary: 'Security validation' })
  @ApiOkResponse({ description: 'Security validation result' })
  getSecurity() {
    return this.securityValidator.validate();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Performance validation' })
  @ApiOkResponse({ description: 'Performance benchmarks' })
  getPerformance() {
    return this.performanceValidator.validate();
  }

  @Get('checklist/:phase')
  @ApiOperation({ summary: 'Deployment checklist for a specific phase' })
  @ApiOkResponse({ description: 'Deployment checklist items' })
  getChecklist(@Param('phase') phase: string) {
    const validPhases = ['pre_deployment', 'deployment', 'post_deployment', 'rollback'];
    if (!validPhases.includes(phase)) {
      return { error: `Invalid phase. Valid phases: ${validPhases.join(', ')}` };
    }
    return this.deploymentChecklist.generate(phase as ChecklistPhase);
  }

  @Get('checklist')
  @ApiOperation({ summary: 'All deployment checklists' })
  @ApiOkResponse({ description: 'All deployment checklists' })
  getAllChecklists() {
    return this.deploymentChecklist.generateAll();
  }

  @Get('backups')
  @ApiOperation({ summary: 'List all backups' })
  @ApiOkResponse({ description: 'Backup list and status' })
  getBackups() {
    return this.backupService.listBackups();
  }

  @Post('backup/full')
  @ApiOperation({ summary: 'Create a full backup' })
  @ApiOkResponse({ description: 'Full backup created' })
  async createFullBackup() {
    return this.backupService.createFullBackup();
  }

  @Get('release/:version')
  @ApiOperation({ summary: 'Check release readiness for a version' })
  @ApiOkResponse({ description: 'Release readiness result' })
  async getReleaseReadiness(@Param('version') version: string) {
    return this.releaseManagement.checkReleaseReadiness(version, '');
  }
}
