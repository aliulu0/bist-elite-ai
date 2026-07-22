import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAnonymousContext } from '../user-context';

@Injectable()
export class DevBypassGuard implements CanActivate {
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get('NODE_ENV', 'development') === 'development';
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.isDev) {
      const request = context.switchToHttp().getRequest();
      if (!request.userContext) {
        request.userContext = getAnonymousContext();
      }
      return true;
    }
    return true;
  }
}
