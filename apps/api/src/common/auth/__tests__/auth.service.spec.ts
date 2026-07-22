import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Role, Permission, AuthMethod } from '../types';
import { getAnonymousContext } from '../user-context';

class MockConfigService {
  private data: Record<string, string> = {
    AUTH_ENABLED: 'false',
    AUTH_DEFAULT_ROLE: 'read_only',
    AUTH_ALLOW_ANONYMOUS: 'true',
    JWT_SECRET: '',
    JWT_EXPIRES_IN: '24h',
    API_KEY_HEADER: 'x-api-key',
    AUTH_SESSION_TIMEOUT: '86400',
  };

  get(key: string, defaultValue?: string): string | undefined {
    return this.data[key] ?? defaultValue;
  }
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(new MockConfigService() as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isAuthEnabled', () => {
    it('returns false when auth is disabled', () => {
      expect(service.isAuthEnabled).toBe(false);
    });
  });

  describe('isAllowAnonymous', () => {
    it('returns true when anonymous is allowed', () => {
      expect(service.isAllowAnonymous).toBe(true);
    });
  });

  describe('validateToken', () => {
    it('returns anonymous context when auth is disabled', async () => {
      const ctx = await service.validateToken('some-token');
      expect(ctx).toBeDefined();
      expect(ctx?.isAuthenticated).toBe(false);
    });
  });

  describe('validateApiKey', () => {
    it('returns anonymous context when auth is disabled', async () => {
      const ctx = await service.validateApiKey('some-key');
      expect(ctx).toBeDefined();
      expect(ctx?.isAuthenticated).toBe(false);
    });
  });

  describe('createContextFromToken', () => {
    it('creates authenticated context from token payload', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: [Role.ADMIN],
        permissions: [Permission.DASHBOARD_VIEW, Permission.PORTFOLIO_MANAGE],
        iat: Date.now(),
        exp: Date.now() + 86400,
        iss: 'bist-elite-ai',
        aud: 'bist-elite-ai',
      };

      const ctx = service.createContextFromToken(payload);
      expect(ctx.userId).toBe('user-123');
      expect(ctx.email).toBe('test@example.com');
      expect(ctx.roles).toContain(Role.ADMIN);
      expect(ctx.isAuthenticated).toBe(true);
      expect(ctx.authMethod).toBe(AuthMethod.JWT);
    });
  });

  describe('hasPermission', () => {
    it('returns true for matching permission', () => {
      const ctx = getAnonymousContext();
      expect(service.hasPermission(ctx, Permission.DASHBOARD_VIEW)).toBe(true);
    });

    it('returns false for non-matching permission', () => {
      const ctx = getAnonymousContext();
      expect(service.hasPermission(ctx, Permission.USERS_MANAGE)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when any permission matches', () => {
      const ctx = getAnonymousContext();
      expect(
        service.hasAnyPermission(ctx, [Permission.USERS_MANAGE, Permission.DASHBOARD_VIEW]),
      ).toBe(true);
    });

    it('returns false when no permission matches', () => {
      const ctx = getAnonymousContext();
      expect(
        service.hasAnyPermission(ctx, [Permission.USERS_MANAGE, Permission.PORTFOLIO_MANAGE]),
      ).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('returns true for matching role', () => {
      const ctx = getAnonymousContext();
      expect(service.hasRole(ctx, Role.READ_ONLY)).toBe(true);
    });

    it('returns false for non-matching role', () => {
      const ctx = getAnonymousContext();
      expect(service.hasRole(ctx, Role.ADMIN)).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns permissions for admin', () => {
      const perms = service.getPermissionsForRole(Role.ADMIN);
      expect(perms.length).toBe(Object.values(Permission).length);
    });

    it('returns permissions for read_only', () => {
      const perms = service.getPermissionsForRole(Role.READ_ONLY);
      expect(perms.length).toBeGreaterThan(0);
      for (const p of perms) {
        expect(p).toContain(':view');
      }
    });
  });
});
