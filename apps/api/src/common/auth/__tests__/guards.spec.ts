import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { DevBypassGuard } from '../guards/dev-bypass.guard';
import { AuthService } from '../auth.service';

class MockConfigService {
  private data: Record<string, string> = {
    AUTH_ENABLED: 'false',
    AUTH_DEFAULT_ROLE: 'read_only',
    AUTH_ALLOW_ANONYMOUS: 'true',
    NODE_ENV: 'development',
  };

  get(key: string, defaultValue?: string): string | undefined {
    return this.data[key] ?? defaultValue;
  }
}

describe('Guards', () => {
  let reflector: Reflector;
  let authService: AuthService;

  beforeEach(() => {
    reflector = new Reflector();
    authService = new AuthService(new MockConfigService() as unknown as ConfigService);
  });

  describe('AuthGuard', () => {
    it('allows access when auth is disabled', async () => {
      const guard = new AuthGuard(authService, reflector);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('RolesGuard', () => {
    it('allows access when no roles required', () => {
      const guard = new RolesGuard(authService, reflector);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ userContext: null }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('PermissionsGuard', () => {
    it('allows access when no permissions required', () => {
      const guard = new PermissionsGuard(authService, reflector);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ userContext: null }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('DevBypassGuard', () => {
    it('allows access in development mode', () => {
      const guard = new DevBypassGuard({
        get: (key: string) => (key === 'NODE_ENV' ? 'development' : undefined),
      } as any);

      const req = { userContext: null };
      const context = {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
      expect(req.userContext).toBeDefined();
    });
  });
});
