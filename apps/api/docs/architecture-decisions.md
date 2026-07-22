# Architecture Decisions

## Sprint 7: Auth-Ready Architecture (Prompt 40)

### ADR-040-1: Auth Disabled by Default

**Decision**: Ship with authentication disabled. All endpoints publicly accessible.

**Rationale**:
- Developer experience: No login required during development
- Incremental adoption: Enable auth when ready, not before
- Backward compatible: Existing code works unchanged
- Security by default: Anonymous gets read-only permissions

**Tradeoffs**:
- + Zero friction for new developers
- + Can demo without auth setup
- - Must remember to enable in production
- - No protection by default (mitigated by feature flags)

### ADR-040-2: NestJS Global AuthModule

**Decision**: AuthModule is `@Global()` with middleware applied to all routes.

**Rationale**:
- Every route may need auth context
- Guards need AuthService available everywhere
- Middleware must run before any controller

**Implementation**:
```typescript
@Global()
@Module({
  providers: [AuthService, FeatureFlags, ...GUARDS, ...INTERCEPTORS],
  exports: [AuthService, FeatureFlags, ...GUARDS, ...INTERCEPTORS],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware, UserContextMiddleware).forRoutes('*');
  }
}
```

### ADR-040-3: Manual Test Instantiation

**Decision**: Tests instantiate services directly, bypassing NestJS DI.

**Rationale**:
- `ConfigService` from `@nestjs/config` is abstract
- NestJS DI in tests requires complex module setup
- Direct instantiation is faster and more reliable
- Mock `ConfigService` as `{ get: (key, default) => ... }` is sufficient

### ADR-040-4: Decorator-Based RBAC

**Decision**: Use NestJS decorators (`@Roles`, `@RequirePermissions`) with guards.

**Rationale**:
- Standard NestJS pattern
- Composable: combine multiple decorators
- Type-safe: TypeScript enums for roles/permissions
- Works with Swagger for documentation

### ADR-040-5: Feature Flags for Gradual Rollout

**Decision**: Auth activation controlled by runtime feature flags, not compile-time.

**Rationale**:
- No redeployment needed to enable auth
- Can test auth in production without blocking
- Per-feature control (OAuth2, API keys, registration)
- Environment variable override for quick toggles
