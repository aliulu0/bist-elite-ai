import { ReleaseManagementService } from '../release-management.service';
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

describe('ReleaseManagementService', () => {
  let service: ReleaseManagementService;

  beforeEach(() => {
    service = new ReleaseManagementService(new AppLoggerService(null as never));
  });

  describe('parseVersion', () => {
    it('should parse valid semver', () => {
      const v = service.parseVersion('2.5.0');
      expect(v).not.toBeNull();
      if (v) {
        expect(v.major).toBe(2);
        expect(v.minor).toBe(5);
        expect(v.patch).toBe(0);
      }
    });

    it('should parse semver with prerelease', () => {
      const v = service.parseVersion('2.5.0-beta.1');
      expect(v).not.toBeNull();
      expect(v?.prerelease).toBe('beta.1');
    });

    it('should return null for invalid version', () => {
      expect(service.parseVersion('invalid')).toBeNull();
      expect(service.parseVersion('1.2')).toBeNull();
      expect(service.parseVersion('')).toBeNull();
    });
  });

  describe('validateSemver', () => {
    it('should validate correct semver', () => {
      expect(service.validateSemver('1.0.0')).toBe(true);
      expect(service.validateSemver('2.10.3')).toBe(true);
    });

    it('should reject invalid semver', () => {
      expect(service.validateSemver('abc')).toBe(false);
      expect(service.validateSemver('1.2')).toBe(false);
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions', () => {
      expect(service.compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(service.compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions', () => {
      expect(service.compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
    });

    it('should compare patch versions', () => {
      expect(service.compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
    });

    it('should treat prerelease as lower', () => {
      expect(service.compareVersions('1.0.0-beta', '1.0.0')).toBeLessThan(0);
    });

    it('should return 0 for equal versions', () => {
      expect(service.compareVersions('1.2.3', '1.2.3')).toBe(0);
    });
  });

  describe('bumpVersion', () => {
    it('should bump patch', () => {
      expect(service.bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
    });

    it('should bump minor', () => {
      expect(service.bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('should bump major', () => {
      expect(service.bumpVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('should throw for invalid version', () => {
      expect(() => service.bumpVersion('invalid', 'patch')).toThrow();
    });
  });

  describe('parseChangelog', () => {
    it('should parse changelog entries', () => {
      const content = `# Changelog

## [2.5.0] - 2026-07-22

### Added
- Feature A
- Feature B

### Changed
- Updated B

## [2.4.0] - 2026-07-21

### Added
- Feature C
`;
      const entries = service.parseChangelog(content);
      expect(entries.length).toBe(2);
      expect(entries[0].version).toBe('2.5.0');
      expect(entries[0].sections.length).toBe(2);
    });

    it('should handle empty changelog', () => {
      const entries = service.parseChangelog('# Changelog\n');
      expect(entries.length).toBe(0);
    });
  });

  describe('validateChangelog', () => {
    it('should validate matching version', () => {
      const content = '# Changelog\n\n## [2.5.0] - 2026-07-22\n\n### Added\n- Feature\n- Feature B\n\n### Changed\n- Updated B\n';
      const result = service.validateChangelog(content, '2.5.0');
      expect(result.valid).toBe(true);
    });

    it('should detect version mismatch', () => {
      const content = '# Changelog\n\n## [2.4.0] - 2026-07-22\n\n### Added\n- Feature\n';
      const result = service.validateChangelog(content, '2.5.0');
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('does not match'))).toBe(true);
    });

    it('should detect empty changelog', () => {
      const result = service.validateChangelog('# Changelog\n', '2.5.0');
      expect(result.valid).toBe(false);
    });
  });

  describe('checkReleaseReadiness', () => {
    it('should return PASS for valid release', async () => {
      const result = await service.checkReleaseReadiness('2.5.0', '## [2.5.0]\n### Added\n- Feature');
      expect(result.status).toBe(ReadinessStatus.PASS);
      expect(result.semverCompliant).toBe(true);
      expect(result.changelogValid).toBe(true);
    });

    it('should return WARN for invalid version', async () => {
      const result = await service.checkReleaseReadiness('invalid', '');
      expect(result.semverCompliant).toBe(false);
    });
  });
});
