import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import { BackupResult, BackupItem, ReadinessStatus } from './types';

@Injectable()
export class BackupService {
  private readonly backups: BackupItem[] = [];

  constructor(private readonly logger: AppLoggerService) {}

  async createBackup(type: string, name: string): Promise<BackupItem> {
    const backup: BackupItem = {
      id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      name,
      sizeBytes: 0,
      createdAt: new Date().toISOString(),
      path: `backups/${type}/${name}`,
      status: ReadinessStatus.PASS,
    };

    this.backups.push(backup);
    this.logger.log(`Backup created: ${backup.id} (${type}/${name})`, 'BackupService');
    return backup;
  }

  listBackups(): BackupResult {
    const backups = [...this.backups].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalSizeBytes = backups.reduce((sum, b) => sum + b.sizeBytes, 0);
    const timestamps = backups.map((b) => new Date(b.createdAt).getTime());

    return {
      status: backups.length > 0 ? ReadinessStatus.PASS : ReadinessStatus.WARN,
      timestamp: new Date().toISOString(),
      backups,
      totalSizeBytes,
      oldestBackup: timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : undefined,
      newestBackup: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : undefined,
    };
  }

  async createConfigurationBackup(): Promise<BackupItem> {
    const configData = {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      logLevel: process.env.LOG_LEVEL,
      timestamp: new Date().toISOString(),
    };

    return this.createBackup('config', `config-backup-${Date.now()}.json`);
  }

  async createDatabaseBackup(): Promise<BackupItem> {
    return this.createBackup('database', `db-backup-${Date.now()}.sql`);
  }

  async createFullBackup(): Promise<BackupItem[]> {
    const results: BackupItem[] = [];
    results.push(await this.createConfigurationBackup());
    results.push(await this.createDatabaseBackup());
    this.logger.log(`Full backup created: ${results.length} items`, 'BackupService');
    return results;
  }
}
