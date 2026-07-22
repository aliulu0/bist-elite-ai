import { DependencyValidatorService } from '../dependency-validator.service';
import { ReadinessStatus, Severity } from '../types';

describe('DependencyValidatorService', () => {
  let service: DependencyValidatorService;

  beforeEach(() => {
    service = new DependencyValidatorService();
  });

  describe('validate', () => {
    it('should return PASS for clean dependencies', () => {
      const result = service.validate({
        dependencies: {
          '@nestjs/common': '^10.3.0',
          'rxjs': '^7.8.0',
        },
        devDependencies: {
          'jest': '^29.7.0',
        },
      });
      expect(result.status).toBe(ReadinessStatus.PASS);
      expect(result.totalDependencies).toBe(3);
    });

    it('should detect deprecated packages', () => {
      const result = service.validate({
        dependencies: {
          'request': '^2.88.0',
          '@nestjs/common': '^10.3.0',
        },
      });
      expect(result.status).toBe(ReadinessStatus.WARN);
      expect(result.deprecated).toBe(1);
      expect(result.issues.some((i) => i.severity === Severity.HIGH)).toBe(true);
    });

    it('should detect duplicate packages', () => {
      const result = service.validate({
        dependencies: {
          lodash: '^4.17.0',
          'lodash-es': '^4.17.0',
        },
      });
      expect(result.duplicatePackages).toContain('lodash');
    });

    it('should flag unpinned versions', () => {
      const result = service.validate({
        dependencies: {
          'some-pkg': '*',
        },
      });
      const dep = result.dependencies.find((d) => d.name === 'some-pkg');
      expect(dep?.issues).toContain('Version is not pinned');
    });

    it('should handle empty dependencies', () => {
      const result = service.validate({});
      expect(result.totalDependencies).toBe(0);
      expect(result.status).toBe(ReadinessStatus.PASS);
    });

    it('should distinguish production from dev dependencies', () => {
      const result = service.validate({
        dependencies: { express: '^4.18.0' },
        devDependencies: { '@types/express': '^4.17.0' },
      });
      const prodDep = result.dependencies.find((d) => d.name === 'express');
      const devDep = result.dependencies.find((d) => d.name === '@types/express');
      expect(prodDep?.type).toBe('production');
      expect(devDep?.type).toBe('development');
    });

    it('should include timestamp', () => {
      const result = service.validate({});
      expect(result.timestamp).toBeDefined();
    });
  });
});
