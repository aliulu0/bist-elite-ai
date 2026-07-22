import { Role, Permission, ROLE_PERMISSIONS, AuthMethod } from '../types';

describe('Auth Types', () => {
  describe('Role enum', () => {
    it('has all expected roles', () => {
      expect(Role.ADMIN).toBe('admin');
      expect(Role.OPERATOR).toBe('operator');
      expect(Role.ANALYST).toBe('analyst');
      expect(Role.PORTFOLIO_MANAGER).toBe('portfolio_manager');
      expect(Role.STANDARD_USER).toBe('standard_user');
      expect(Role.READ_ONLY).toBe('read_only');
    });
  });

  describe('Permission enum', () => {
    it('has dashboard permissions', () => {
      expect(Permission.DASHBOARD_VIEW).toBe('dashboard:view');
      expect(Permission.DASHBOARD_EDIT).toBe('dashboard:edit');
    });

    it('has scanner permissions', () => {
      expect(Permission.SCANNER_VIEW).toBe('scanner:view');
      expect(Permission.SCANNER_USE).toBe('scanner:use');
    });

    it('has portfolio permissions', () => {
      expect(Permission.PORTFOLIO_VIEW).toBe('portfolio:view');
      expect(Permission.PORTFOLIO_MANAGE).toBe('portfolio:manage');
    });

    it('has user management permissions', () => {
      expect(Permission.USERS_VIEW).toBe('users:view');
      expect(Permission.USERS_MANAGE).toBe('users:manage');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('admin has all permissions', () => {
      const adminPerms = ROLE_PERMISSIONS[Role.ADMIN];
      const allPerms = Object.values(Permission);
      expect(adminPerms).toEqual(allPerms);
    });

    it('read_only has only view permissions', () => {
      const readOnlyPerms = ROLE_PERMISSIONS[Role.READ_ONLY];
      for (const perm of readOnlyPerms) {
        expect(perm).toContain(':view');
      }
    });

    it('every role has at least one permission', () => {
      for (const role of Object.values(Role)) {
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });

    it('analyst cannot manage users', () => {
      const analystPerms = ROLE_PERMISSIONS[Role.ANALYST];
      expect(analystPerms).not.toContain(Permission.USERS_MANAGE);
    });

    it('portfolio manager can manage portfolio', () => {
      const pmPerms = ROLE_PERMISSIONS[Role.PORTFOLIO_MANAGER];
      expect(pmPerms).toContain(Permission.PORTFOLIO_MANAGE);
    });
  });

  describe('AuthMethod enum', () => {
    it('has all methods', () => {
      expect(AuthMethod.NONE).toBe('none');
      expect(AuthMethod.JWT).toBe('jwt');
      expect(AuthMethod.OAUTH2).toBe('oauth2');
      expect(AuthMethod.API_KEY).toBe('api_key');
      expect(AuthMethod.SERVICE_ACCOUNT).toBe('service_account');
    });
  });
});
