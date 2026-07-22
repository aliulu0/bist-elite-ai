import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getAnonymousContext } from '../user-context';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UserContextMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction): void {
    if (!(req as any).userContext) {
      (req as any).userContext = getAnonymousContext();
    }

    const ctx = (req as any).userContext;
    req.headers['x-user-id'] = ctx.userId;
    req.headers['x-user-lang'] = ctx.language;
    req.headers['x-user-timezone'] = ctx.timezone;

    next();
  }
}
