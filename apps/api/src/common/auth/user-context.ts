import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserContext, Role, Permission, AuthMethod } from './types';

const ANONYMOUS_CONTEXT: UserContext = {
  userId: 'anonymous',
  roles: [Role.READ_ONLY],
  permissions: [
    Permission.DASHBOARD_VIEW,
    Permission.SCANNER_VIEW,
    Permission.WATCHLIST_VIEW,
    Permission.PORTFOLIO_VIEW,
    Permission.BACKTEST_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SIGNALS_VIEW,
    Permission.ELITE_VIEW,
  ],
  language: 'tr',
  timezone: 'Europe/Istanbul',
  isAuthenticated: false,
  authMethod: AuthMethod.NONE,
};

export function getAnonymousContext(): UserContext {
  return { ...ANONYMOUS_CONTEXT };
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): UserContext | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContext = request.userContext || ANONYMOUS_CONTEXT;

    if (data) {
      return (user as unknown as Record<string, unknown>)[data];
    }
    return user;
  },
);

export const RequireAuth = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContext = request.userContext;

    if (!user || !user.isAuthenticated) {
      throw new UnauthorizedException('Authentication required');
    }

    if (data) {
      return (user as unknown as Record<string, unknown>)[data] as UserContext;
    }
    return user;
  },
);
