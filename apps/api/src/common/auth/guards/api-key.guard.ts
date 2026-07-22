import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { getAnonymousContext } from '../user-context';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authService.isAuthEnabled) {
      const request = context.switchToHttp().getRequest();
      request.userContext = getAnonymousContext();
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      if (this.authService.isAllowAnonymous) {
        request.userContext = getAnonymousContext();
        return true;
      }
      throw new UnauthorizedException('Missing API key');
    }

    try {
      const user = await this.authService.validateApiKey(apiKey);
      if (!user) {
        if (this.authService.isAllowAnonymous) {
          request.userContext = getAnonymousContext();
          return true;
        }
        throw new UnauthorizedException('Invalid API key');
      }
      request.userContext = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException && !this.authService.isAllowAnonymous) {
        throw error;
      }
      request.userContext = getAnonymousContext();
      return true;
    }
  }
}
