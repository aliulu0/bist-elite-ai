import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';
import { getAnonymousContext } from '../user-context';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(private readonly authService: AuthService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    if (!this.authService.isAuthEnabled) {
      (req as any).userContext = getAnonymousContext();
      next();
      return;
    }

    const token = this.extractToken(req);
    const apiKey = req.headers['x-api-key'] as string;

    if (token || apiKey) {
      this.logger.debug('Auth middleware: token or API key found, deferring to guards');
    }

    next();
  }

  private extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }
    return undefined;
  }
}
