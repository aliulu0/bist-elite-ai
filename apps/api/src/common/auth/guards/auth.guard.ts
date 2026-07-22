import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { UserContext, AuthMethod } from '../types';
import { getAnonymousContext } from '../user-context';

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_AUTHENTICATED_KEY = 'isAuthenticated';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      request.userContext = getAnonymousContext();
      return true;
    }

    if (!this.authService.isAuthEnabled) {
      const request = context.switchToHttp().getRequest();
      request.userContext = getAnonymousContext();
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      if (this.authService.isAllowAnonymous) {
        request.userContext = getAnonymousContext();
        return true;
      }
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const user = await this.authService.validateToken(token);
      if (!user) {
        if (this.authService.isAllowAnonymous) {
          request.userContext = getAnonymousContext();
          return true;
        }
        throw new UnauthorizedException('Invalid authentication token');
      }
      request.userContext = user;
      return true;
    } catch (error) {
      if (this.authService.isAllowAnonymous) {
        request.userContext = getAnonymousContext();
        return true;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }
    return undefined;
  }
}
