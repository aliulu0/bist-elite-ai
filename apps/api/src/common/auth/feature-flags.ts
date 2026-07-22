import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  allowedRoles?: string[];
}

const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  auth_enabled: {
    name: 'auth_enabled',
    enabled: false,
    description: 'Enable authentication and authorization',
  },
  registration_enabled: {
    name: 'registration_enabled',
    enabled: false,
    description: 'Enable user registration',
  },
  oauth2_google: {
    name: 'oauth2_google',
    enabled: false,
    description: 'Enable Google OAuth2 login',
  },
  oauth2_github: {
    name: 'oauth2_github',
    enabled: false,
    description: 'Enable GitHub OAuth2 login',
  },
  oauth2_microsoft: {
    name: 'oauth2_microsoft',
    enabled: false,
    description: 'Enable Microsoft Entra ID login',
  },
  api_keys: {
    name: 'api_keys',
    enabled: false,
    description: 'Enable API key authentication',
  },
  multi_tenant: {
    name: 'multi_tenant',
    enabled: false,
    description: 'Enable multi-tenant support',
  },
  audit_logging: {
    name: 'audit_logging',
    enabled: true,
    description: 'Enable audit logging for all requests',
  },
  rate_limiting: {
    name: 'rate_limiting',
    enabled: true,
    description: 'Enable rate limiting',
  },
  notification_preferences: {
    name: 'notification_preferences',
    enabled: true,
    description: 'Enable per-user notification preferences',
  },
};

@Injectable()
export class FeatureFlags {
  private readonly logger = new Logger(FeatureFlags.name);
  private readonly flags: Map<string, FeatureFlag> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.flags = new Map(Object.entries(DEFAULT_FLAGS));

    const envOverrides = this.configService.get<string>('FEATURE_FLAGS', '');
    if (envOverrides) {
      for (const flag of envOverrides.split(',')) {
        const [key, value] = flag.split('=');
        if (key && this.flags.has(key)) {
          const f = this.flags.get(key)!;
          f.enabled = value === 'true';
          this.flags.set(key, f);
        }
      }
    }

    this.logger.log(`FeatureFlags initialized: ${Array.from(this.flags.entries()).map(([k, v]) => `${k}=${v.enabled}`).join(', ')}`);
  }

  isEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    return flag?.enabled ?? false;
  }

  get(flagName: string): FeatureFlag | undefined {
    return this.flags.get(flagName);
  }

  getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getEnabled(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter((f) => f.enabled);
  }

  getDisabled(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter((f) => !f.enabled);
  }
}
