import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import {
  ReleaseReadinessResult,
  ReleaseVersion,
  ChangelogEntry,
  MigrationRecord,
  ReadinessStatus,
} from './types';

@Injectable()
export class ReleaseManagementService {
  constructor(private readonly logger: AppLoggerService) {}

  parseVersion(versionStr: string): ReleaseVersion | null {
    const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/);
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
    };
  }

  validateSemver(version: string): boolean {
    return this.parseVersion(version) !== null;
  }

  compareVersions(a: string, b: string): number {
    const va = this.parseVersion(a);
    const vb = this.parseVersion(b);
    if (!va || !vb) return 0;

    if (va.major !== vb.major) return va.major - vb.major;
    if (va.minor !== vb.minor) return va.minor - vb.minor;
    if (va.patch !== vb.patch) return va.patch - vb.patch;

    if (va.prerelease && !vb.prerelease) return -1;
    if (!va.prerelease && vb.prerelease) return 1;
    if (va.prerelease && vb.prerelease) return va.prerelease.localeCompare(vb.prerelease);

    return 0;
  }

  bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
    const v = this.parseVersion(version);
    if (!v) throw new Error(`Invalid version: ${version}`);

    switch (type) {
      case 'major':
        return `${v.major + 1}.0.0`;
      case 'minor':
        return `${v.major}.${v.minor + 1}.0`;
      case 'patch':
        return `${v.major}.${v.minor}.${v.patch + 1}`;
    }
  }

  parseChangelog(content: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    const versionBlocks = content.split(/^## \[/m).slice(1);

    for (const block of versionBlocks) {
      const versionMatch = block.match(/^([\d.]+)\]/);
      if (!versionMatch) continue;

      const dateMatch = block.match(/- (\d{4}-\d{2}-\d{2})/);
      const sections: Array<{ title: string; items: string[] }> = [];

      const sectionRegex = /### (\w[\w\s]*)\n([\s\S]*?)(?=### |\n## |$)/g;
      let sectionMatch;
      while ((sectionMatch = sectionRegex.exec(block)) !== null) {
        const title = sectionMatch[1].trim();
        const items = sectionMatch[2]
          .split('\n')
          .filter((line) => line.startsWith('- '))
          .map((line) => line.slice(2).trim());
        if (items.length > 0) {
          sections.push({ title, items });
        }
      }

      entries.push({
        version: versionMatch[1],
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
        sections,
      });
    }

    return entries;
  }

  validateChangelog(content: string, expectedVersion: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const entries = this.parseChangelog(content);

    if (entries.length === 0) {
      issues.push('No changelog entries found');
      return { valid: false, issues };
    }

    const latest = entries[0];
    if (latest.version !== expectedVersion) {
      issues.push(`Latest changelog version (${latest.version}) does not match expected (${expectedVersion})`);
    }

    if (latest.sections.length === 0) {
      issues.push('Latest changelog entry has no sections');
    }

    const hasAdded = latest.sections.some((s) => s.title === 'Added');
    const hasChanged = latest.sections.some((s) => s.title === 'Changed');
    if (!hasAdded && !hasChanged) {
      issues.push('Latest changelog entry should have Added or Changed sections');
    }

    return { valid: issues.length === 0, issues };
  }

  async checkMigrations(
    appliedMigrations: Array<{ id: string; name: string; appliedAt: string }>,
  ): Promise<{ applied: boolean; records: MigrationRecord[] }> {
    const records: MigrationRecord[] = appliedMigrations.map((m) => ({
      id: m.id,
      name: m.name,
      appliedAt: m.appliedAt,
      status: ReadinessStatus.PASS,
    }));

    return {
      applied: records.length > 0,
      records,
    };
  }

  async checkReleaseReadiness(
    version: string,
    changelogContent: string,
    appliedMigrations: Array<{ id: string; name: string; appliedAt: string }> = [],
  ): Promise<ReleaseReadinessResult> {
    const parsed = this.parseVersion(version);
    const semverCompliant = parsed !== null;

    const changelogResult = this.validateChangelog(changelogContent, version);
    const migrationResult = await this.checkMigrations(appliedMigrations);

    const issues: string[] = [];
    if (!semverCompliant) issues.push('Version does not follow semantic versioning');
    issues.push(...changelogResult.issues);

    const status = issues.length > 0 ? ReadinessStatus.WARN : ReadinessStatus.PASS;

    this.logger.log(
      `Release readiness check for v${version}: ${status}`,
      'ReleaseManagementService',
    );

    return {
      status,
      timestamp: new Date().toISOString(),
      version: parsed || { major: 0, minor: 0, patch: 0 },
      changelogValid: changelogResult.valid,
      changelogIssues: changelogResult.issues,
      migrationsApplied: migrationResult.applied,
      migrationRecords: migrationResult.records,
      rollbackSupported: true,
      semverCompliant,
    };
  }
}
