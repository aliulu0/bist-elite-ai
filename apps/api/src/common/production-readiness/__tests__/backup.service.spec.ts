import { BackupService } from '../backup.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ReadinessStatus } from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    service = new BackupService(new AppLoggerService(null as never));
  });

  describe('createBackup', () => {
    it('should create a backup', async () => {
      const backup = await service.createBackup('config', 'test-backup.json');
      expect(backup.id).toContain('backup-');
      expect(backup.type).toBe('config');
      expect(backup.name).toBe('test-backup.json');
      expect(backup.status).toBe(ReadinessStatus.PASS);
    });

    it('should have valid timestamp', async () => {
      const backup = await service.createBackup('database', 'db.sql');
      expect(new Date(backup.createdAt).getTime()).toBeGreaterThan(0);
    });
  });

  describe('listBackups', () => {
    it('should return WARN when no backups exist', () => {
      const result = service.listBackups();
      expect(result.status).toBe(ReadinessStatus.WARN);
      expect(result.backups).toHaveLength(0);
    });

    it('should list created backups', async () => {
      await service.createBackup('config', 'a.json');
      await service.createBackup('database', 'b.sql');

      const result = service.listBackups();
      expect(result.backups.length).toBe(2);
      expect(result.status).toBe(ReadinessStatus.PASS);
    });

    it('should sort backups by creation date descending', async () => {
      await service.createBackup('config', 'first.json');
      await new Promise((r) => setTimeout(r, 10));
      await service.createBackup('config', 'second.json');

      const result = service.listBackups();
      expect(result.backups[0].name).toBe('second.json');
      expect(result.backups[1].name).toBe('first.json');
    });

    it('should track oldest and newest backups', async () => {
      await service.createBackup('config', 'old.json');
      await new Promise((r) => setTimeout(r, 10));
      await service.createBackup('config', 'new.json');

      const result = service.listBackups();
      expect(result.oldestBackup).toBeDefined();
      expect(result.newestBackup).toBeDefined();
    });
  });

  describe('createFullBackup', () => {
    it('should create config and database backups', async () => {
      const backups = await service.createFullBackup();
      expect(backups.length).toBe(2);
      expect(backups.some((b) => b.type === 'config')).toBe(true);
      expect(backups.some((b) => b.type === 'database')).toBe(true);
    });
  });
});
