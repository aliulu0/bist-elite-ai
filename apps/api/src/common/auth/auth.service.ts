import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UserContext,
  Role,
  Permission,
  AuthMethod,
  AuthConfig,
  AuthTokenPayload,
  ApiKeyInfo,
  ROLE_PERMISSIONS,
} from './types';
import { getAnonymousContext } from './user-context';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config: AuthConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      enabled: this.configService.get('AUTH_ENABLED', 'false') === 'true',
      defaultRole: (this.configService.get<string>('AUTH_DEFAULT_ROLE') || 'read_only') as Role,
      providers: [],
      jwtSecret: this.configService.get('JWT_SECRET', ''),
      jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
      apiKeyHeader: this.configService.get('API_KEY_HEADER', 'x-api-key'),
      allowAnonymous: this.configService.get('AUTH_ALLOW_ANONYMOUS', 'true') === 'true',
      sessionTimeout: parseInt(this.configService.get('AUTH_SESSION_TIMEOUT', '86400'), 10),
    };
    this.logger.log(`AuthService initialized: enabled=${this.config.enabled}, allowAnonymous=${this.config.allowAnonymous}`);
  }

  get isAuthEnabled(): boolean {
    return this.config.enabled;
  }

  get isAllowAnonymous(): boolean {
    return this.config.allowAnonymous;
  }

  async validateToken(token: string): Promise<UserContext | null> {
    if (!this.config.enabled) {
      return getAnonymousContext();
    }
    this.logger.warn('validateToken called but auth providers not implemented');
    return null;
  }

  async validateApiKey(apiKey: string): Promise<UserContext | null> {
    if (!this.config.enabled) {
      return getAnonymousContext();
    }
    this.logger.warn('validateApiKey called but auth providers not implemented');
    return null;
  }

  async validateOAuth2(provider: string, code: string): Promise<UserContext | null> {
    if (!this.config.enabled) {
      return getAnonymousContext();
    }
    this.logger.warn(`validateOAuth2 called for ${provider} but not implemented`);
    return null;
  }

  createContextFromToken(payload: AuthTokenPayload): UserContext {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || [this.config.defaultRole],
      permissions: payload.permissions || ROLE_PERMISSIONS[this.config.defaultRole] || [],
      language: 'tr',
      timezone: 'Europe/Istanbul',
      isAuthenticated: true,
      authMethod: AuthMethod.JWT,
    };
  }

  hasPermission(user: UserContext, permission: Permission): boolean {
    if (!user.isAuthenticated && !this.config.allowAnonymous) {
      return false;
    }
    return user.permissions.includes(permission);
  }

  hasAnyPermission(user: UserContext, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(user, p));
  }

  hasAllPermissions(user: UserContext, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(user, p));
  }

  hasRole(user: UserContext, role: Role): boolean {
    return user.roles.includes(role);
  }

  hasAnyRole(user: UserContext, roles: Role[]): boolean {
    return roles.some((r) => this.hasRole(user, r));
  }

  getPermissionsForRole(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  getUserContextFromApiKeyInfo(apiKeyInfo: ApiKeyInfo): UserContext {
    return {
      userId: apiKeyInfo.userId,
      roles: apiKeyInfo.roles,
      permissions: apiKeyInfo.permissions,
      language: 'tr',
      timezone: 'Europe/Istanbul',
      isAuthenticated: true,
      authMethod: AuthMethod.API_KEY,
    };
  }
}
