# Auth-Ready Architecture

## Overview

The BIST Elite API implements an auth-ready architecture that ships with authentication **disabled by default**. All endpoints are publicly accessible until auth is enabled via feature flags. This allows the platform to run without any login infrastructure while being fully prepared for enterprise authentication when needed.

## Architecture

### Core Components

```
apps/api/src/common/auth/
├── types.ts              # Role, Permission, UserContext, AuthMethod
├── user-context.ts       # @CurrentUser, @RequireAuth decorators, getAnonymousContext()
├── auth.service.ts       # Central auth service (token validation, permission checks)
├── auth.module.ts        # NestJS module wiring (global, middleware)
├── decorators.ts         # @Public, @Roles, @RequirePermissions, @RequireAllPermissions
├── feature-flags.ts      # Runtime feature flags (auth_enabled, oauth2_google, etc.)
├── guards/
│   ├── auth.guard.ts           # Route-level auth (bypassed when auth disabled)
│   ├── roles.guard.ts          # Role-based access control
│   ├── permissions.guard.ts    # Permission-based access control
│   ├── api-key.guard.ts        # API key authentication
│   └── dev-bypass.guard.ts     # Auto-anonymous in development
├── middleware/
│   ├── auth.middleware.ts          # Extracts auth from request
│   └── user-context.middleware.ts  # Sets x-user-* headers for downstream
├── interceptors/
│   └── audit-log.interceptor.ts    # Logs all authenticated requests
└── __tests__/             # 47 tests
```

### How Auth Works (When Enabled)

1. **Request arrives** → `AuthMiddleware` extracts token/API key
2. **Guards execute** (in order):
   - `AuthGuard` — validates token, sets `request.userContext`
   - `RolesGuard` — checks `@Roles()` metadata
   - `PermissionsGuard` — checks `@RequirePermissions()` metadata
3. **AuditLogInterceptor** — logs request with user context
4. **Controller** — uses `@CurrentUser()` to access user info

### Auth Disabled Mode (Default)

When `AUTH_ENABLED=false` (default):
- All guards pass through
- `DevBypassGuard` injects anonymous context in development
- `getAnonymousContext()` returns read-only permissions
- No token validation occurs
- Swagger shows auth headers but they're optional

## RBAC Model

### Roles (6)

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `operator` | Can run analysis, manage scanner |
| `analyst` | Can view analysis results, create signals |
| `portfolio_manager` | Can manage portfolios |
| `standard_user` | Basic authenticated access |
| `read_only` | View-only access (anonymous default) |

### Permissions (25+)

Permissions follow `resource:action` pattern:
- `dashboard:view`, `dashboard:edit`
- `scanner:view`, `scanner:use`
- `portfolio:view`, `portfolio:manage`
- `users:view`, `users:manage`
- `signals:view`, `signals:create`
- `reports:view`, `reports:export`

### Usage in Controllers

```typescript
import { Public, Roles, RequirePermissions } from '../common/auth/decorators';
import { CurrentUser } from '../common/auth/user-context';
import { Role, Permission } from '../common/auth/types';

@Controller('portfolios')
export class PortfoliosController {
  @Get()
  @Roles(Role.ADMIN, Role.PORTFOLIO_MANAGER)
  findAll(@CurrentUser() user: UserContext) {
    return this.portfolioService.findAll(user.userId);
  }

  @Post()
  @RequirePermissions(Permission.PORTFOLIO_MANAGE)
  create(@CurrentUser() user: UserContext, @Body() dto: CreatePortfolioDto) {
    return this.portfolioService.create(user.userId, dto);
  }

  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }
}
```

## Feature Flags

Runtime feature flags control auth behavior via `FEATURE_FLAGS` env var:

```bash
# Enable auth in production
FEATURE_FLAGS=auth_enabled=true,registration_enabled=true

# Enable Google OAuth2
FEATURE_FLAGS=auth_enabled=true,oauth2_google=true

# Enable API keys
FEATURE_FLAGS=auth_enabled=true,api_keys=true
```

### Available Flags

| Flag | Default | Description |
|------|---------|-------------|
| `auth_enabled` | false | Enable JWT authentication |
| `registration_enabled` | false | Allow new user registration |
| `oauth2_google` | false | Google OAuth2 login |
| `oauth2_github` | false | GitHub OAuth2 login |
| `oauth2_microsoft` | false | Microsoft Entra ID login |
| `api_keys` | false | API key authentication |
| `multi_tenant` | false | Multi-tenant support |
| `audit_logging` | true | Log all requests |
| `rate_limiting` | true | Rate limiting |
| `notification_preferences` | true | Per-user notification prefs |

## Configuration

### Environment Variables

```bash
# Auth
AUTH_ENABLED=false              # Master auth switch
AUTH_DEFAULT_ROLE=read_only     # Default role for new users
AUTH_ALLOW_ANONYMOUS=true       # Allow unauthenticated access
AUTH_SESSION_TIMEOUT=86400      # Session timeout in seconds

# JWT
JWT_SECRET=                     # Secret for JWT signing
JWT_EXPIRES_IN=24h              # Token expiry

# API Keys
API_KEY_HEADER=x-api-key        # Custom header for API keys

# Feature Flags
FEATURE_FLAGS=                  # Comma-separated flag overrides
```

## Testing

All auth components are tested with 47 unit tests:

```bash
cd apps/api
npx jest --testPathPattern="common/auth/__tests__"
```

Tests use manual instantiation (no NestJS DI) to avoid `@nestjs/config` abstract class issues in test environments.

## Migration Path

1. **Phase 1** (Current): Auth disabled, all endpoints public
2. **Phase 2**: Enable `auth_enabled=true`, implement JWT provider
3. **Phase 3**: Add OAuth2 providers (Google, GitHub)
4. **Phase 4**: Enable registration, user management
5. **Phase 5**: Multi-tenant support
