import { PipelineGateway } from './websocket-gateway';
import { Server } from 'socket.io';
import { AuthService } from '../../common/auth/auth.service';

function createMockServer(): Server {
  const mockEmit = jest.fn();
  return { emit: mockEmit } as unknown as Server;
}

function createMockAuthService(): AuthService {
  return {
    isAuthEnabled: false,
    isAllowAnonymous: true,
    validateToken: jest.fn(),
    validateApiKey: jest.fn(),
  } as unknown as AuthService;
}

describe('PipelineGateway', () => {
  let gateway: PipelineGateway;
  let mockServer: Server;

  beforeEach(() => {
    gateway = new PipelineGateway(createMockAuthService());
    mockServer = createMockServer();
    (gateway as any).server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should emit pipeline:run event', () => {
    const data = { status: 'completed', totalSteps: 10 };
    gateway.emitPipelineRun(data);
    expect(mockServer.emit).toHaveBeenCalledWith('pipeline:run', expect.objectContaining(data));
    const callArg = (mockServer.emit as jest.Mock).mock.calls[0][1];
    expect(callArg).toHaveProperty('timestamp');
  });

  it('should emit pipeline:step event with step name', () => {
    const data = { status: 'completed' };
    gateway.emitPipelineStep('fetch_market_data', data);
    expect(mockServer.emit).toHaveBeenCalledWith('pipeline:step', expect.objectContaining({ step: 'fetch_market_data', ...data }));
  });

  it('should emit ranking:update event', () => {
    const data = { symbols: ['THYAO', 'GARAN'], count: 2 };
    gateway.emitRankingUpdate(data);
    expect(mockServer.emit).toHaveBeenCalledWith('ranking:update', expect.objectContaining(data));
  });

  it('should emit macro:update event', () => {
    const data = { indicators: ['CPI', 'GDP'], source: 'tcmb' };
    gateway.emitMacroUpdate(data);
    expect(mockServer.emit).toHaveBeenCalledWith('macro:update', expect.objectContaining(data));
  });

  it('should emit alert:update event', () => {
    const data = { alertId: 'alert-1', severity: 'high' };
    gateway.emitAlertUpdate(data);
    expect(mockServer.emit).toHaveBeenCalledWith('alert:update', expect.objectContaining(data));
  });

  it('should emit portfolio:update event', () => {
    const data = { holdings: 5, totalValue: 100000 };
    gateway.emitPortfolioUpdate(data);
    expect(mockServer.emit).toHaveBeenCalledWith('portfolio:update', expect.objectContaining(data));
  });

  it('should emit scheduler:event with jobName', () => {
    const data = { status: 'running' };
    gateway.emitSchedulerEvent('fullPipelineRun', data);
    expect(mockServer.emit).toHaveBeenCalledWith('scheduler:event', expect.objectContaining({ jobName: 'fullPipelineRun', ...data }));
  });

  it('should emit provider:status event', () => {
    const data = { provider: 'fintables', status: 'healthy' };
    gateway.emitProviderStatus(data);
    expect(mockServer.emit).toHaveBeenCalledWith('provider:status', expect.objectContaining(data));
  });

  it('should not throw when server is undefined', () => {
    const gw = new PipelineGateway(createMockAuthService());
    expect(() => gw.emitPipelineRun({})).not.toThrow();
    expect(() => gw.emitPipelineStep('test', {})).not.toThrow();
    expect(() => gw.emitSchedulerEvent('job', {})).not.toThrow();
  });

  it('should add timestamp to every event', () => {
    gateway.emitPipelineRun({});
    const arg = (mockServer.emit as jest.Mock).mock.calls[0][1];
    expect(typeof arg.timestamp).toBe('string');

    gateway.emitMacroUpdate({});
    const arg2 = (mockServer.emit as jest.Mock).mock.calls[1][1];
    expect(typeof arg2.timestamp).toBe('string');
  });
});
