export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  ANALYST = 'analyst',
  PORTFOLIO_MANAGER = 'portfolio_manager',
  STANDARD_USER = 'standard_user',
  READ_ONLY = 'read_only',
}

export enum Permission {
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_EDIT = 'dashboard:edit',
  SCANNER_VIEW = 'scanner:view',
  SCANNER_USE = 'scanner:use',
  WATCHLIST_VIEW = 'watchlist:view',
  WATCHLIST_MANAGE = 'watchlist:manage',
  PORTFOLIO_VIEW = 'portfolio:view',
  PORTFOLIO_MANAGE = 'portfolio:manage',
  BACKTEST_VIEW = 'backtest:view',
  BACKTEST_RUN = 'backtest:run',
  REPORTS_VIEW = 'reports:view',
  REPORTS_GENERATE = 'reports:generate',
  REPORTS_EXPORT = 'reports:export',
  SIGNALS_VIEW = 'signals:view',
  ELITE_VIEW = 'elite:view',
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',
  USERS_VIEW = 'users:view',
  USERS_MANAGE = 'users:manage',
  API_KEYS_MANAGE = 'api_keys:manage',
  NOTIFICATIONS_VIEW = 'notifications:view',
  NOTIFICATIONS_MANAGE = 'notifications:manage',
  SYSTEM_VIEW = 'system:view',
  SYSTEM_MANAGE = 'system:manage',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.OPERATOR]: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_EDIT,
    Permission.SCANNER_VIEW,
    Permission.SCANNER_USE,
    Permission.WATCHLIST_VIEW,
    Permission.WATCHLIST_MANAGE,
    Permission.PORTFOLIO_VIEW,
    Permission.PORTFOLIO_MANAGE,
    Permission.BACKTEST_VIEW,
    Permission.BACKTEST_RUN,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
    Permission.REPORTS_EXPORT,
    Permission.SIGNALS_VIEW,
    Permission.ELITE_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
  ],
  [Role.ANALYST]: [
    Permission.DASHBOARD_VIEW,
    Permission.SCANNER_VIEW,
    Permission.SCANNER_USE,
    Permission.WATCHLIST_VIEW,
    Permission.PORTFOLIO_VIEW,
    Permission.BACKTEST_VIEW,
    Permission.BACKTEST_RUN,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
    Permission.SIGNALS_VIEW,
    Permission.ELITE_VIEW,
    Permission.NOTIFICATIONS_VIEW,
  ],
  [Role.PORTFOLIO_MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.SCANNER_VIEW,
    Permission.SCANNER_USE,
    Permission.WATCHLIST_VIEW,
    Permission.WATCHLIST_MANAGE,
    Permission.PORTFOLIO_VIEW,
    Permission.PORTFOLIO_MANAGE,
    Permission.BACKTEST_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SIGNALS_VIEW,
    Permission.ELITE_VIEW,
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
  ],
  [Role.STANDARD_USER]: [
    Permission.DASHBOARD_VIEW,
    Permission.SCANNER_VIEW,
    Permission.WATCHLIST_VIEW,
    Permission.WATCHLIST_MANAGE,
    Permission.PORTFOLIO_VIEW,
    Permission.BACKTEST_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SIGNALS_VIEW,
    Permission.ELITE_VIEW,
    Permission.NOTIFICATIONS_VIEW,
  ],
  [Role.READ_ONLY]: [
    Permission.DASHBOARD_VIEW,
    Permission.SCANNER_VIEW,
    Permission.WATCHLIST_VIEW,
    Permission.PORTFOLIO_VIEW,
    Permission.BACKTEST_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SIGNALS_VIEW,
    Permission.ELITE_VIEW,
  ],
};

export interface UserContext {
  userId: string;
  email?: string;
  displayName?: string;
  roles: Role[];
  permissions: Permission[];
  language: string;
  timezone: string;
  portfolioId?: string;
  isAuthenticated: boolean;
  authMethod: AuthMethod;
  sessionId?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}

export enum AuthMethod {
  NONE = 'none',
  JWT = 'jwt',
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  SERVICE_ACCOUNT = 'service_account',
}

export interface AuthTokenPayload {
  sub: string;
  email?: string;
  roles: Role[];
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti?: string;
}

export interface ApiKeyInfo {
  id: string;
  key: string;
  name: string;
  userId: string;
  roles: Role[];
  permissions: Permission[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AuthProviderConfig {
  enabled: boolean;
  provider: AuthProvider;
  config: Record<string, unknown>;
}

export enum AuthProvider {
  LOCAL = 'local',
  JWT = 'jwt',
  OAUTH2_GOOGLE = 'oauth2_google',
  OAUTH2_GITHUB = 'oauth2_github',
  OAUTH2_MICROSOFT = 'oauth2_microsoft',
  OPENID_CONNECT = 'openid_connect',
  API_KEY = 'api_key',
}

export interface AuthConfig {
  enabled: boolean;
  defaultRole: Role;
  providers: AuthProviderConfig[];
  jwtSecret: string;
  jwtExpiresIn: string;
  apiKeyHeader: string;
  allowAnonymous: boolean;
  sessionTimeout: number;
}
