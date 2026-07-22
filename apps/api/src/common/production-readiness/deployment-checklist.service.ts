import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import {
  DeploymentChecklistResult,
  ChecklistItem,
  ChecklistPhase,
  ReadinessStatus,
} from './types';

@Injectable()
export class DeploymentChecklistService {
  constructor(private readonly logger: AppLoggerService) {}

  generate(phase: ChecklistPhase = ChecklistPhase.PRE_DEPLOYMENT): DeploymentChecklistResult {
    const items = this.getItemsForPhase(phase);
    const completedItems = items.filter((i) => i.completed).length;
    const mandatoryItems = items.filter((i) => i.mandatory).length;
    const completedMandatory = items.filter((i) => i.mandatory && i.completed).length;

    const status = mandatoryItems === completedMandatory
      ? ReadinessStatus.PASS
      : completedMandatory > mandatoryItems * 0.8
        ? ReadinessStatus.WARN
        : ReadinessStatus.FAIL;

    return {
      status,
      timestamp: new Date().toISOString(),
      phase,
      items,
      totalItems: items.length,
      completedItems,
      mandatoryItems,
      completedMandatory,
    };
  }

  generateAll(): Record<ChecklistPhase, DeploymentChecklistResult> {
    return {
      [ChecklistPhase.PRE_DEPLOYMENT]: this.generate(ChecklistPhase.PRE_DEPLOYMENT),
      [ChecklistPhase.DEPLOYMENT]: this.generate(ChecklistPhase.DEPLOYMENT),
      [ChecklistPhase.POST_DEPLOYMENT]: this.generate(ChecklistPhase.POST_DEPLOYMENT),
      [ChecklistPhase.ROLLBACK]: this.generate(ChecklistPhase.ROLLBACK),
    };
  }

  private getItemsForPhase(phase: ChecklistPhase): ChecklistItem[] {
    const allItems: ChecklistItem[] = [
      { id: 'pre-1', description: 'All environment variables configured', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'config' },
      { id: 'pre-2', description: 'Database migrations applied', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'database' },
      { id: 'pre-3', description: 'Dependencies updated and audited', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'dependencies' },
      { id: 'pre-4', description: 'Unit tests passing', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'testing' },
      { id: 'pre-5', description: 'Integration tests passing', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'testing' },
      { id: 'pre-6', description: 'Security scan completed', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: false, category: 'security' },
      { id: 'pre-7', description: 'Performance benchmarks validated', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: false, category: 'performance' },
      { id: 'pre-8', description: 'Backup created', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'backup' },
      { id: 'pre-9', description: 'Rollback plan documented', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'rollback' },
      { id: 'pre-10', description: 'CHANGELOG updated', phase: ChecklistPhase.PRE_DEPLOYMENT, completed: false, mandatory: true, category: 'documentation' },

      { id: 'dep-1', description: 'Build successful', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: true, category: 'build' },
      { id: 'dep-2', description: 'Application started successfully', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: true, category: 'deployment' },
      { id: 'dep-3', description: 'Health checks passing', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: true, category: 'health' },
      { id: 'dep-4', description: 'Database connectivity verified', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: true, category: 'database' },
      { id: 'dep-5', description: 'Redis connectivity verified', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: false, category: 'cache' },
      { id: 'dep-6', description: 'API endpoints responding', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: true, category: 'api' },
      { id: 'dep-7', description: 'SSL/TLS certificates valid', phase: ChecklistPhase.DEPLOYMENT, completed: false, mandatory: true, category: 'security' },

      { id: 'post-1', description: 'Smoke tests passing', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: true, category: 'testing' },
      { id: 'post-2', description: 'Error rates within acceptable limits', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: true, category: 'monitoring' },
      { id: 'post-3', description: 'Response times within SLA', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: true, category: 'performance' },
      { id: 'post-4', description: 'Memory usage stable', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: false, category: 'monitoring' },
      { id: 'post-5', description: 'Database performance acceptable', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: false, category: 'database' },
      { id: 'post-6', description: 'Deployment logged in CHANGELOG', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: true, category: 'documentation' },
      { id: 'post-7', description: 'Monitoring alerts reviewed', phase: ChecklistPhase.POST_DEPLOYMENT, completed: false, mandatory: false, category: 'monitoring' },

      { id: 'rb-1', description: 'Previous version backup available', phase: ChecklistPhase.ROLLBACK, completed: false, mandatory: true, category: 'backup' },
      { id: 'rb-2', description: 'Database rollback script ready', phase: ChecklistPhase.ROLLBACK, completed: false, mandatory: true, category: 'database' },
      { id: 'rb-3', description: 'Rollback procedure documented', phase: ChecklistPhase.ROLLBACK, completed: false, mandatory: true, category: 'documentation' },
      { id: 'rb-4', description: 'Team notified of rollback', phase: ChecklistPhase.ROLLBACK, completed: false, mandatory: false, category: 'communication' },
      { id: 'rb-5', description: 'Rollback tested in staging', phase: ChecklistPhase.ROLLBACK, completed: false, mandatory: false, category: 'testing' },
    ];

    return allItems.filter((i) => i.phase === phase);
  }
}
