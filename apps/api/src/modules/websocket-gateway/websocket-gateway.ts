import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../common/auth/auth.service';
import { UserContext } from '../../common/auth/types';
import { getAnonymousContext } from '../../common/auth/user-context';

function getCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return ['http://localhost:3000', 'http://localhost:5173'];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

@WSGateway({
  namespace: '/pipeline',
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class PipelineGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PipelineGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly authService: AuthService) {}

  afterInit(): void {
    this.logger.log('Pipeline WebSocket gateway initialized');

    this.server.use(async (socket, next) => {
      try {
        const token = this.extractToken(socket);
        const apiKey = this.extractApiKey(socket);

        if (!this.authService.isAuthEnabled) {
          socket.data.userContext = getAnonymousContext();
          next();
          return;
        }

        if (token) {
          const user = await this.authService.validateToken(token);
          if (user && user.isAuthenticated) {
            socket.data.userContext = user;
            next();
            return;
          }
        }

        if (apiKey) {
          const user = await this.authService.validateApiKey(apiKey);
          if (user && user.isAuthenticated) {
            socket.data.userContext = user;
            next();
            return;
          }
        }

        if (this.authService.isAllowAnonymous) {
          socket.data.userContext = getAnonymousContext();
          next();
          return;
        }

        this.logger.warn(`Rejecting socket connection ${socket.id}: missing or invalid credentials`);
        next(new Error('Unauthorized'));
      } catch (error) {
        this.logger.warn(`Socket auth error for ${socket.id}: ${error instanceof Error ? error.message : String(error)}`);
        if (this.authService.isAllowAnonymous) {
          socket.data.userContext = getAnonymousContext();
          next();
          return;
        }
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket): void {
    const user = client.data.userContext as UserContext | undefined;
    this.logger.log(
      `Client connected: ${client.id} (authenticated: ${user?.isAuthenticated ?? false}, roles: ${user?.roles.join(',') ?? 'none'})`,
    );
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(socket: Socket): string | undefined {
    const auth = socket.handshake?.auth as Record<string, unknown> | undefined;
    if (typeof auth?.token === 'string' && auth.token) {
      return auth.token;
    }
    const query = socket.handshake?.query as Record<string, unknown> | undefined;
    if (typeof query?.token === 'string' && query.token) {
      return query.token;
    }
    const header = socket.handshake?.headers?.authorization;
    if (typeof header === 'string') {
      const [type, token] = header.split(' ');
      if (type === 'Bearer' && token) return token;
    }
    return undefined;
  }

  private extractApiKey(socket: Socket): string | undefined {
    const auth = socket.handshake?.auth as Record<string, unknown> | undefined;
    if (typeof auth?.apiKey === 'string' && auth.apiKey) {
      return auth.apiKey;
    }
    const header = socket.handshake?.headers?.['x-api-key'];
    if (typeof header === 'string' && header) {
      return header;
    }
    return undefined;
  }

  emitPipelineRun(data: Record<string, unknown>): void {
    this.server?.emit('pipeline:run', { ...data, timestamp: new Date().toISOString() });
  }

  emitPipelineStep(stepName: string, data: Record<string, unknown>): void {
    this.server?.emit('pipeline:step', { step: stepName, ...data, timestamp: new Date().toISOString() });
  }

  emitRankingUpdate(data: Record<string, unknown>): void {
    this.server?.emit('ranking:update', { ...data, timestamp: new Date().toISOString() });
  }

  emitMacroUpdate(data: Record<string, unknown>): void {
    this.server?.emit('macro:update', { ...data, timestamp: new Date().toISOString() });
  }

  emitAlertUpdate(data: Record<string, unknown>): void {
    this.server?.emit('alert:update', { ...data, timestamp: new Date().toISOString() });
  }

  emitPortfolioUpdate(data: Record<string, unknown>): void {
    this.server?.emit('portfolio:update', { ...data, timestamp: new Date().toISOString() });
  }

  emitSchedulerEvent(jobName: string, data: Record<string, unknown>): void {
    this.server?.emit('scheduler:event', { jobName, ...data, timestamp: new Date().toISOString() });
  }

  emitProviderStatus(data: Record<string, unknown>): void {
    this.server?.emit('provider:status', { ...data, timestamp: new Date().toISOString() });
  }
}
