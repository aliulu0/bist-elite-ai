const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function dirExists(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function readFileContent(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

describe('Deployment Infrastructure', () => {
  describe('Deploy Scripts', () => {
    it('should have setup-server.sh', () => {
      expect(fileExists('deploy/setup-server.sh')).toBe(true);
    });

    it('should have install.sh', () => {
      expect(fileExists('deploy/install.sh')).toBe(true);
    });

    it('should have health-check.sh', () => {
      expect(fileExists('deploy/health-check.sh')).toBe(true);
    });

    it('should have backup.sh', () => {
      expect(fileExists('deploy/backup.sh')).toBe(true);
    });
  });

  describe('Systemd Services', () => {
    it('should have bist-api.service', () => {
      expect(fileExists('deploy/systemd/bist-api.service')).toBe(true);
    });

    it('should have bist-web.service', () => {
      expect(fileExists('deploy/systemd/bist-web.service')).toBe(true);
    });

    it('should have bist-worker.service', () => {
      expect(fileExists('deploy/systemd/bist-worker.service')).toBe(true);
    });

    it('should have bist-telegram.service', () => {
      expect(fileExists('deploy/systemd/bist-telegram.service')).toBe(true);
    });
  });

  describe('Nginx Configuration', () => {
    it('should have nginx config', () => {
      expect(fileExists('deploy/nginx/bist-elite-ai.conf')).toBe(true);
    });

    it('should configure rate limiting', () => {
      const content = readFileContent('deploy/nginx/bist-elite-ai.conf');
      expect(content).toContain('limit_req_zone');
    });

    it('should configure security headers', () => {
      const content = readFileContent('deploy/nginx/bist-elite-ai.conf');
      expect(content).toContain('X-Frame-Options');
      expect(content).toContain('X-Content-Type-Options');
      expect(content).toContain('Strict-Transport-Security');
    });

    it('should configure gzip compression', () => {
      const content = readFileContent('deploy/nginx/bist-elite-ai.conf');
      expect(content).toContain('gzip on');
    });

    it('should proxy all service ports', () => {
      const content = readFileContent('deploy/nginx/bist-elite-ai.conf');
      expect(content).toContain('3001'); // API
      expect(content).toContain('3000'); // Web
      expect(content).toContain('8000'); // Worker
    });
  });

  describe('Log Rotation', () => {
    it('should have logrotate config', () => {
      expect(fileExists('deploy/logrotate/bist-elite-ai')).toBe(true);
    });

    it('should configure daily rotation', () => {
      const content = readFileContent('deploy/logrotate/bist-elite-ai');
      expect(content).toContain('daily');
    });

    it('should configure compression', () => {
      const content = readFileContent('deploy/logrotate/bist-elite-ai');
      expect(content).toContain('compress');
    });
  });

  describe('Systemd Service Configuration', () => {
    it('api service should set memory limit', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('MemoryMax=512M');
    });

    it('api service should set CPU quota', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('CPUQuota=80%');
    });

    it('api service should have restart policy', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('Restart=on-failure');
    });

    it('api service should load env file', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('EnvironmentFile=');
    });

    it('api service should depend on postgresql', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('After=network.target postgresql.service');
    });

    it('worker service should set memory limit', () => {
      const content = readFileContent('deploy/systemd/bist-worker.service');
      expect(content).toContain('MemoryMax=512M');
    });

    it('telegram service should set memory limit', () => {
      const content = readFileContent('deploy/systemd/bist-telegram.service');
      expect(content).toContain('MemoryMax=256M');
    });
  });

  describe('Security Configuration', () => {
    it('setup-server.sh should configure firewall', () => {
      const content = readFileContent('deploy/setup-server.sh');
      expect(content).toContain('ufw');
    });

    it('setup-server.sh should configure fail2ban', () => {
      const content = readFileContent('deploy/setup-server.sh');
      expect(content).toContain('fail2ban');
    });

    it('setup-server.sh should create swap', () => {
      const content = readFileContent('deploy/setup-server.sh');
      expect(content).toContain('swapfile');
    });

    it('install.sh should generate secrets', () => {
      const content = readFileContent('deploy/install.sh');
      expect(content).toContain('openssl rand');
    });

    it('systemd services should use NoNewPrivileges', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('NoNewPrivileges=true');
    });

    it('systemd services should use ProtectSystem', () => {
      const content = readFileContent('deploy/systemd/bist-api.service');
      expect(content).toContain('ProtectSystem=strict');
    });
  });

  describe('Backup Configuration', () => {
    it('backup.sh should backup database', () => {
      const content = readFileContent('deploy/backup.sh');
      expect(content).toContain('pg_dump');
    });

    it('backup.sh should backup configuration', () => {
      const content = readFileContent('deploy/backup.sh');
      expect(content).toContain('config');
    });

    it('backup.sh should cleanup old backups', () => {
      const content = readFileContent('deploy/backup.sh');
      expect(content).toContain('RETENTION_DAYS');
    });

    it('install.sh should set up cron backup', () => {
      const content = readFileContent('deploy/install.sh');
      expect(content).toContain('cron.d/bist-backup');
    });
  });

  describe('Deployment Documentation', () => {
    it('should have deployment guide', () => {
      expect(fileExists('docs/deployment-guide.md')).toBe(true);
    });

    it('should have server setup guide', () => {
      expect(fileExists('docs/server-setup.md')).toBe(true);
    });

    it('should have operations manual', () => {
      expect(fileExists('docs/operations-manual.md')).toBe(true);
    });

    it('should have backup guide', () => {
      expect(fileExists('docs/backup-guide.md')).toBe(true);
    });

    it('should have disaster recovery guide', () => {
      expect(fileExists('docs/disaster-recovery.md')).toBe(true);
    });

    it('deployment guide should cover both Docker and native', () => {
      const content = readFileContent('docs/deployment-guide.md');
      expect(content).toContain('Docker');
      expect(content).toContain('Native');
    });

    it('disaster recovery should have RTO/RPO', () => {
      const content = readFileContent('docs/disaster-recovery.md');
      expect(content).toContain('RTO');
      expect(content).toContain('RPO');
    });
  });

  describe('Resource Estimation', () => {
    it('total systemd memory limits should fit in 2GB', () => {
      const api = readFileContent('deploy/systemd/bist-api.service');
      const web = readFileContent('deploy/systemd/bist-web.service');
      const worker = readFileContent('deploy/systemd/bist-worker.service');
      const telegram = readFileContent('deploy/systemd/bist-telegram.service');

      const extractMemory = (content) => {
        const match = content.match(/MemoryMax=(\d+)M/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const total = extractMemory(api) + extractMemory(web) + extractMemory(worker) + extractMemory(telegram);
      expect(total).toBeLessThanOrEqual(1700); // 1.7GB for apps, leaving room for OS + swap
    });
  });
});
