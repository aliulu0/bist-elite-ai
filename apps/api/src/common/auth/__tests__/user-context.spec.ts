import { getAnonymousContext } from '../user-context';
import { Role, Permission, AuthMethod } from '../types';

describe('UserContext', () => {
  describe('getAnonymousContext', () => {
    it('returns anonymous context', () => {
      const ctx = getAnonymousContext();
      expect(ctx.userId).toBe('anonymous');
      expect(ctx.isAuthenticated).toBe(false);
      expect(ctx.authMethod).toBe(AuthMethod.NONE);
    });

    it('has read-only permissions', () => {
      const ctx = getAnonymousContext();
      expect(ctx.roles).toContain(Role.READ_ONLY);
      expect(ctx.permissions).toContain(Permission.DASHBOARD_VIEW);
      expect(ctx.permissions).toContain(Permission.SCANNER_VIEW);
    });

    it('does not have write permissions', () => {
      const ctx = getAnonymousContext();
      expect(ctx.permissions).not.toContain(Permission.DASHBOARD_EDIT);
      expect(ctx.permissions).not.toContain(Permission.PORTFOLIO_MANAGE);
      expect(ctx.permissions).not.toContain(Permission.USERS_MANAGE);
    });

    it('has default language and timezone', () => {
      const ctx = getAnonymousContext();
      expect(ctx.language).toBe('tr');
      expect(ctx.timezone).toBe('Europe/Istanbul');
    });
  });
});
