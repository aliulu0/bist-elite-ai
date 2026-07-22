import { Injectable } from '@nestjs/common';
import { DependencyValidationResult, DependencyInfo, ReadinessStatus, ValidationIssue, Severity } from './types';

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const DEPRECATED_PACKAGES = new Set([
  'request', 'node-uuid', 'nomnom', 'optimist', 'mkdirp',
  'nyc', 'istanbul', 'jade',
]);

const KNOWN_DUPLICATES: Record<string, string[]> = {
  'lodash': ['lodash', 'lodash-es'],
  'moment': ['moment', 'moment-timezone'],
  'underscore': ['underscore', 'lodash'],
};

@Injectable()
export class DependencyValidatorService {
  validate(packageJson: PackageJson): DependencyValidationResult {
    const deps: DependencyInfo[] = [];
    const issues: ValidationIssue[] = [];
    let outdated = 0;
    let deprecated = 0;
    let licenseConflicts = 0;

    const allDeps = [
      ...Object.entries(packageJson.dependencies || {}).map(([n, v]) => [n, v, 'production'] as const),
      ...Object.entries(packageJson.devDependencies || {}).map(([n, v]) => [n, v, 'development'] as const),
    ];

    for (const [name, version, type] of allDeps) {
      const dep: DependencyInfo = {
        name,
        version,
        type: type as 'production' | 'development',
        license: 'unknown',
        deprecated: DEPRECATED_PACKAGES.has(name),
        issues: [],
      };

      if (dep.deprecated) {
        deprecated++;
        dep.issues.push(`Package '${name}' is deprecated`);
        issues.push({
          severity: Severity.HIGH,
          category: 'dependency',
          message: `Deprecated package '${name}' is used`,
          recommendation: `Find a modern replacement for '${name}'`,
          impact: 'Security vulnerabilities may not be patched',
        });
      }

      if (version.includes('^') || version.includes('~') || version === '*') {
        dep.issues.push('Version is not pinned');
      }

      deps.push(dep);
    }

    const depNames = allDeps.map(([n]) => n.toLowerCase());
    const duplicates: string[] = [];
    for (const [pkg, aliases] of Object.entries(KNOWN_DUPLICATES)) {
      const found = aliases.filter((a) => depNames.includes(a));
      if (found.length > 1) {
        duplicates.push(pkg);
      }
    }

    if (duplicates.length > 0) {
      issues.push({
        severity: Severity.MEDIUM,
        category: 'dependency',
        message: `Duplicate packages detected: ${duplicates.join(', ')}`,
        recommendation: 'Remove duplicate packages and use a single version',
        impact: 'Increased bundle size and potential version conflicts',
      });
    }

    const totalDependencies = allDeps.length;
    const status = issues.some((i) => i.severity === Severity.CRITICAL)
      ? ReadinessStatus.FAIL
      : issues.some((i) => i.severity === Severity.HIGH)
        ? ReadinessStatus.WARN
        : ReadinessStatus.PASS;

    return {
      status,
      timestamp: new Date().toISOString(),
      totalDependencies,
      outdated,
      deprecated,
      licenseConflicts,
      duplicatePackages: duplicates,
      unusedPackages: [],
      dependencies: deps,
      issues,
    };
  }
}
