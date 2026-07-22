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

function readJsonFile(relativePath) {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
  return JSON.parse(content);
}

function readFileContent(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

describe('Repository Structure', () => {
  describe('Root Files', () => {
    it('should have README.md', () => {
      expect(fileExists('README.md')).toBe(true);
    });

    it('should have CONTRIBUTING.md', () => {
      expect(fileExists('CONTRIBUTING.md')).toBe(true);
    });

    it('should have CODE_OF_CONDUCT.md', () => {
      expect(fileExists('CODE_OF_CONDUCT.md')).toBe(true);
    });

    it('should have SECURITY.md', () => {
      expect(fileExists('SECURITY.md')).toBe(true);
    });

    it('should have ARCHITECTURE.md', () => {
      expect(fileExists('ARCHITECTURE.md')).toBe(true);
    });

    it('should have INSTALLATION.md', () => {
      expect(fileExists('INSTALLATION.md')).toBe(true);
    });

    it('should have TROUBLESHOOTING.md', () => {
      expect(fileExists('TROUBLESHOOTING.md')).toBe(true);
    });

    it('should have ROADMAP.md', () => {
      expect(fileExists('ROADMAP.md')).toBe(true);
    });

    it('should have LICENSE', () => {
      expect(fileExists('LICENSE')).toBe(true);
    });

    it('should have .gitignore', () => {
      expect(fileExists('.gitignore')).toBe(true);
    });

    it('should have .gitattributes', () => {
      expect(fileExists('.gitattributes')).toBe(true);
    });

    it('should have .editorconfig', () => {
      expect(fileExists('.editorconfig')).toBe(true);
    });

    it('should have package.json', () => {
      expect(fileExists('package.json')).toBe(true);
    });

    it('should have turbo.json', () => {
      expect(fileExists('turbo.json')).toBe(true);
    });

    it('should have tsconfig.json', () => {
      expect(fileExists('tsconfig.json')).toBe(true);
    });
  });

  describe('Directory Structure', () => {
    it('should have apps/ directory', () => {
      expect(dirExists('apps')).toBe(true);
    });

    it('should have packages/ directory', () => {
      expect(dirExists('packages')).toBe(true);
    });

    it('should have docs/ directory', () => {
      expect(dirExists('docs')).toBe(true);
    });

    it('should have scripts/ directory', () => {
      expect(dirExists('scripts')).toBe(true);
    });

    it('should have docker/ directory', () => {
      expect(dirExists('docker')).toBe(true);
    });

    it('should have .github/ directory', () => {
      expect(dirExists('.github')).toBe(true);
    });

    it('should have tests/ directory', () => {
      expect(dirExists('tests')).toBe(true);
    });
  });

  describe('Application Structure', () => {
    it('should have apps/api/', () => {
      expect(dirExists('apps/api')).toBe(true);
    });

    it('should have apps/web/', () => {
      expect(dirExists('apps/web')).toBe(true);
    });

    it('should have apps/worker/', () => {
      expect(dirExists('apps/worker')).toBe(true);
    });

    it('should have apps/telegram/', () => {
      expect(dirExists('apps/telegram')).toBe(true);
    });
  });

  describe('Package Structure', () => {
    it('should have packages/shared/', () => {
      expect(dirExists('packages/shared')).toBe(true);
    });

    it('should have packages/ui/', () => {
      expect(dirExists('packages/ui')).toBe(true);
    });

    it('should have packages/config/', () => {
      expect(dirExists('packages/config')).toBe(true);
    });

    it('should have packages/types/', () => {
      expect(dirExists('packages/types')).toBe(true);
    });

    it('should have packages/database/', () => {
      expect(dirExists('packages/database')).toBe(true);
    });
  });
});

describe('Package Configuration', () => {
  it('root package.json should be a monorepo with workspaces', () => {
    const pkg = readJsonFile('package.json');
    expect(pkg.workspaces).toBeDefined();
    expect(pkg.workspaces).toContain('apps/*');
    expect(pkg.workspaces).toContain('packages/*');
    expect(pkg.private).toBe(true);
  });

  it('turbo.json should exist', () => {
    expect(fileExists('turbo.json')).toBe(true);
  });

  it('apps/api/package.json should exist', () => {
    expect(fileExists('apps/api/package.json')).toBe(true);
    const pkg = readJsonFile('apps/api/package.json');
    expect(pkg.name).toBe('@bist-elite/api');
  });

  it('apps/web/package.json should exist', () => {
    expect(fileExists('apps/web/package.json')).toBe(true);
  });

  it('apps/worker should have requirements.txt', () => {
    expect(fileExists('apps/worker/requirements.txt')).toBe(true);
  });
});

describe('Documentation Content', () => {
  it('README.md should have project description', () => {
    const content = readFileContent('README.md');
    expect(content).toContain('BIST Elite AI');
    expect(content).toContain('Architecture');
    expect(content).toContain('Tech Stack');
    expect(content).toContain('Quick Start');
  });

  it('CONTRIBUTING.md should have development workflow', () => {
    const content = readFileContent('CONTRIBUTING.md');
    expect(content).toContain('Branch Naming');
    expect(content).toContain('Commit Messages');
    expect(content).toContain('Pull Requests');
    expect(content).toContain('Code Review');
  });

  it('SECURITY.md should have reporting instructions', () => {
    const content = readFileContent('SECURITY.md');
    expect(content).toContain('Reporting');
    expect(content).toContain('security@');
  });

  it('ARCHITECTURE.md should describe the system', () => {
    const content = readFileContent('ARCHITECTURE.md');
    expect(content).toContain('NestJS');
    expect(content).toContain('Turborepo');
    expect(content).toContain('PostgreSQL');
  });

  it('INSTALLATION.md should have setup instructions', () => {
    const content = readFileContent('INSTALLATION.md');
    expect(content).toContain('Prerequisites');
    expect(content).toContain('pnpm install');
    expect(content).toContain('docker-compose');
  });

  it('TROUBLESHOOTING.md should have common issues', () => {
    const content = readFileContent('TROUBLESHOOTING.md');
    expect(content).toContain('Database');
    expect(content).toContain('Redis');
    expect(content).toContain('Docker');
  });

  it('ROADMAP.md should have version history', () => {
    const content = readFileContent('ROADMAP.md');
    expect(content).toContain('Completed');
    expect(content).toContain('Planned');
    expect(content).toContain('2.6.0');
  });
});

describe('GitHub Configuration', () => {
  it('should have issue templates', () => {
    expect(fileExists('.github/ISSUE_TEMPLATE/bug_report.md')).toBe(true);
    expect(fileExists('.github/ISSUE_TEMPLATE/feature_request.md')).toBe(true);
    expect(fileExists('.github/ISSUE_TEMPLATE/performance_issue.md')).toBe(true);
    expect(fileExists('.github/ISSUE_TEMPLATE/security_report.md')).toBe(true);
    expect(fileExists('.github/ISSUE_TEMPLATE/refactoring_request.md')).toBe(true);
  });

  it('should have issue template config', () => {
    expect(fileExists('.github/ISSUE_TEMPLATE/config.yml')).toBe(true);
  });

  it('should have pull request template', () => {
    expect(fileExists('.github/PULL_REQUEST_TEMPLATE.md')).toBe(true);
  });

  it('should have CODEOWNERS', () => {
    expect(fileExists('.github/CODEOWNERS')).toBe(true);
  });

  it('should have CI/CD workflows', () => {
    expect(fileExists('.github/workflows/ci.yml')).toBe(true);
    expect(fileExists('.github/workflows/test.yml')).toBe(true);
    expect(fileExists('.github/workflows/lint.yml')).toBe(true);
    expect(fileExists('.github/workflows/build.yml')).toBe(true);
    expect(fileExists('.github/workflows/release.yml')).toBe(true);
    expect(fileExists('.github/workflows/security.yml')).toBe(true);
  });
});

describe('API Module Validation', () => {
  it('should have app.module.ts', () => {
    expect(fileExists('apps/api/src/app.module.ts')).toBe(true);
  });

  it('should have main.ts', () => {
    expect(fileExists('apps/api/src/main.ts')).toBe(true);
  });

  it('should have health controller', () => {
    expect(fileExists('apps/api/src/health.controller.ts')).toBe(true);
  });

  it('should have common modules directory', () => {
    expect(dirExists('apps/api/src/common')).toBe(true);
  });

  it('should have CHANGELOG.md', () => {
    expect(fileExists('apps/api/CHANGELOG.md')).toBe(true);
  });

  it('CHANGELOG should have latest version entry', () => {
    const content = readFileContent('apps/api/CHANGELOG.md');
    expect(content).toContain('[2.6.0]');
    expect(content).toContain('Production Readiness');
  });

  it('should have jest.config.ts', () => {
    expect(fileExists('apps/api/jest.config.ts')).toBe(true);
  });

  it('should have tsconfig.json', () => {
    expect(fileExists('apps/api/tsconfig.json')).toBe(true);
  });
});

describe('Security Configuration', () => {
  it('.gitignore should exclude sensitive files', () => {
    const content = readFileContent('.gitignore');
    expect(content).toContain('.env');
    expect(content).toContain('node_modules');
    expect(content).toContain('*.log');
  });

  it('.gitattributes should normalize line endings', () => {
    const content = readFileContent('.gitattributes');
    expect(content).toContain('text=auto');
  });

  it('.editorconfig should set UTF-8', () => {
    const content = readFileContent('.editorconfig');
    expect(content).toContain('utf-8');
  });
});
