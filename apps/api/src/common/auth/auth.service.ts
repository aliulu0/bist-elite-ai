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
import { createJwtToken, verifyJwt } from './jwt.util';

const DEV_JWT_SECRET = 'dev-secret-change-in-production';
const JWT_ISSUER = 'bist-elite-ai';
const JWT_AUDIENCE = 'bist-elite-ai';

interface ConfiguredApiKey {
  key: string;
  role: Role;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config: AuthConfig;
  private readonly apiKeys: ConfiguredApiKey[];

  constructor(private readonly configService: ConfigService) {
    const isProduction = (process.env.NODE_ENV || this.configService.get('NODE_ENV', 'development')) === 'production';
    this.config = {
      enabled: this.configService.get('AUTH_ENABLED', isProduction ? 'true' : 'false') === 'true',
      defaultRole: (this.configService.get<string>('AUTH_DEFAULT_ROLE') || 'read_only') as Role,
      providers: [],
      jwtSecret: this.configService.get('JWT_SECRET', ''),
      jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
      apiKeyHeader: this.configService.get('API_KEY_HEADER', 'x-api-key'),
      allowAnonymous: this.configService.get('AUTH_ALLOW_ANONYMOUS', isProduction ? 'false' : 'true') === 'true',
      sessionTimeout: parseInt(this.configService.get('AUTH_SESSION_TIMEOUT', '86400'), 10),
    };
    this.apiKeys = this.parseConfiguredApiKeys();
    if (this.config.enabled && !this.config.jwtSecret) {
      this.logger.warn('Auth is enabled but JWT_SECRET is empty — JWT validation will reject all tokens');
    }
    if (this.config.enabled && this.config.jwtSecret === DEV_JWT_SECRET) {
      this.logger.warn('Auth is enabled with the development JWT secret — replace JWT_SECRET in production');
    }
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
    const result = verifyJwt(token, this.config.jwtSecret, JWT_AUDIENCE);
    if (!result) {
      this.logger.warn('JWT validation failed');
      return null;
    }
    const payload = result.payload;
    return this.createContextFromToken({
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles as Role[],
      permissions: payload.permissions as Permission[],
      iat: payload.iat,
      exp: payload.exp,
      iss: payload.iss,
      aud: payload.aud,
      jti: payload.jti,
    });
  }

  async validateApiKey(apiKey: string): Promise<UserContext | null> {
    if (!this.config.enabled) {
      return getAnonymousContext();
    }
    if (!apiKey) return null;

    const matched = this.apiKeys.find((entry) => this.safeEqual(entry.key, apiKey));
    if (!matched) {
      this.logger.warn('API key validation failed');
      return null;
    }

    const info: ApiKeyInfo = {
      id: matched.name || matched.email || 'configured-key',
      key: apiKey,
      name: matched.name || 'API Key',
      userId: matched.email || matched.name || 'configured-key',
      roles: [matched.role],
      permissions: this.getPermissionsForRole(matched.role),
      createdAt: new Date(),
      isActive: true,
    };
    return this.getUserContextFromApiKeyInfo(info);
  }

  async validateOAuth2(provider: string, code: string): Promise<UserContext | null> {
    if (!this.config.enabled) {
      return getAnonymousContext();
    }
    this.logger.warn(`validateOAuth2 called for ${provider} but not implemented`);
    return null;
  }

  signToken(claims: { sub: string; email?: string; roles?: Role[]; permissions?: Permission[] }): string {
    return createJwtToken(this.config.jwtSecret, {
      sub: claims.sub,
      email: claims.email,
      roles: claims.roles,
      permissions: claims.permissions,
      expiresIn: this.config.jwtExpiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  getAuthConfigSummary(): { enabled: boolean; allowAnonymous: boolean; jwtConfigured: boolean; apiKeyConfigured: boolean } {
    return {
      enabled: this.config.enabled,
      allowAnonymous: this.config.allowAnonymous,
      jwtConfigured: !!this.config.jwtSecret && this.config.jwtSecret !== DEV_JWT_SECRET,
      apiKeyConfigured: this.apiKeys.length > 0,
    };
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

  private parseConfiguredApiKeys(): ConfiguredApiKey[] {
    const keys: ConfiguredApiKey[] = [];

    const serviceKey = this.configService.get<string>('SERVICE_API_KEY', '');
    if (serviceKey) {
      keys.push({ key: serviceKey, role: Role.ADMIN, name: 'service-account' });
    }

    const raw = this.configService.get<string>('API_KEYS', '');
    if (raw) {
      for (const part of raw.split(',')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const [key, roleOrEmail, email] = trimmed.split(':');
        if (!key) continue;
        const role = this.isRole(roleOrEmail) ? (roleOrEmail as Role) : Role.READ_ONLY;
        keys.push({ key, role, email, name: roleOrEmail });
      }
    }

    return keys;
  }

  private isRole(value?: string): value is Role {
    return !!value && Object.values(Role).includes(value as Role);
  }

  private safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return this.constantTimeEqual(Buffer.from(a), Buffer.from(b));
  }

  private constantTimeEqual(a: Buffer, b: Buffer): boolean {
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
}
