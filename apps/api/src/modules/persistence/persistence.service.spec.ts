import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceService } from './persistence.service';
import { PrismaService } from '../../common/database/prisma.service';
import { EventBusEngine } from '../event-bus/event-bus.engine';
import { AuditLogEngine } from '../audit-log/audit-log.engine';
import { PerformanceMonitorEngine } from '../performance-monitor/performance-monitor.engine';
import { AnalysisResult } from '../analysis-pipeline/analysis-pipeline.types';
import { MarketScannerResult } from '../market-scanner/market-scanner.types';
import { ProviderHealthSnapshot } from '../provider-health-monitor/provider-health-monitor.types';

const mockPrismaService = {
  isDbConnected: jest.fn().mockReturnValue(true),
  analysisResult: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  scannerRun: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  scannerSymbolResult: {
    create: jest.fn(),
  },
  backtestPipelineRun: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  providerHealthRecord: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  schedulerJobRun: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const mockEventBus = {
  publish: jest.fn(),
};

const mockAuditLog = {
  record: jest.fn(),
};

const mockPerformanceMonitor = {
  recordTiming: jest.fn(),
};

const mockAnalysisResult: AnalysisResult = {
  symbol: 'THYAO',
  timeframe: '1d',
  indicators: [],
  marketStructure: {
    timeframe: '1d',
    trend: 'uptrend',
    structure: [],
    swingHighs: [],
    swingLows: [],
    supportZones: [],
    resistanceZones: [],
    breakOfStructure: [],
    changeOfCharacter: [],
    metadata: {},
    isValid: true,
  },
  smartMoney: {
    timeframe: '1d',
    accumulationScore: 0.5,
    distributionScore: 0.2,
    institutionalActivity: 'accumulating',
    smartMoneyConfidence: 0.7,
    trendAlignment: 'uptrend',
    signals: [],
    metadata: {},
    isValid: true,
  },
  technicalRules: { timeframe: '1d', rules: [], isValid: true },
  technicalScore: {
    timeframe: '1d',
    score: 75,
    grade: 'B',
    confidence: 0.8,
    ruleBreakdown: [],
    metadata: {},
    isValid: true,
  },
  technicalSummary: {
    timeframe: '1d',
    summary: 'Test summary',
    overallOpinion: 'Bullish',
    strengths: [],
    weaknesses: [],
    risks: [],
    recommendations: [],
    metadata: {},
    isValid: true,
  },
  financialRules: { symbol: 'THYAO', rules: [] },
  financialScore: {
    symbol: 'THYAO',
    score: 80,
    grade: 'B',
    passedRules: 3,
    warningRules: 1,
    failedRules: 0,
    confidence: 0.85,
    breakdown: { items: [], totalWeight: 1 },
  },
  financialSummary: {
    summary: 'Good fundamentals',
    strengths: [],
    weaknesses: [],
    risks: [],
    positives: [],
    overallOpinion: 'Strong',
  },
  confluence: {
    confluenceScore: 72,
    agreement: 'HIGH',
    financialAlignment: { score: 80, direction: 'bullish', confidence: 0.85, factors: [] },
    technicalAlignment: { score: 75, direction: 'bullish', confidence: 0.8, factors: [] },
    smartMoneyAlignment: { score: 60, direction: 'bullish', confidence: 0.7, factors: [] },
    trendAlignment: { score: 70, direction: 'bullish', confidence: 0.75, factors: [] },
    confidence: 0.78,
    metadata: {},
    isValid: true,
  },
  candidate: {
    candidate: true,
    candidateScore: 85,
    priority: 'HIGH',
    reasons: [],
    confidence: 0.8,
    metadata: {},
    isValid: true,
  },
  opportunity: {
    opportunityScore: 78,
    earlyOpportunity: false,
    opportunityLevel: 'HIGH',
    confidence: 0.75,
    strengths: [],
    riskFactors: [],
    reasons: [],
    metadata: {},
    isValid: true,
  },
  eliteScore: {
    eliteScore: 82,
    rating: 'A',
    priority: 'HIGH',
    confidence: 0.8,
    earlyOpportunity: false,
    summary: 'Strong elite score',
    breakdown: {
      financial: { score: 80, weight: 0.25, contribution: 20 },
      technical: { score: 75, weight: 0.25, contribution: 18.75 },
      opportunity: { score: 78, weight: 0.2, contribution: 15.6 },
      confluence: { score: 72, weight: 0.15, contribution: 10.8 },
      candidate: { score: 85, weight: 0.15, contribution: 12.75 },
    },
    metadata: {},
    isValid: true,
  },
  pipelineSteps: [],
  metadata: { analyzedAt: new Date().toISOString() },
  isValid: true,
};

const mockScannerResult: MarketScannerResult = {
  topCandidates: [
    {
      symbol: 'THYAO',
      status: 'TOP_CANDIDATE',
      eliteScore: 82,
      eliteRating: 'A',
      opportunityLevel: 'HIGH',
      candidateScore: 85,
      compositeScore: 83,
      rank: 1,
      reasons: [],
    },
  ],
  watchlist: [],
  rejected: [
    {
      symbol: 'GARAN',
      status: 'REJECTED',
      eliteScore: 45,
      eliteRating: 'C',
      opportunityLevel: 'LOW',
      candidateScore: 30,
      compositeScore: 38,
      rank: 1,
      reasons: [],
    },
  ],
  statistics: {
    totalSymbols: 2,
    topCandidateCount: 1,
    watchlistCount: 0,
    rejectedCount: 1,
    avgEliteScore: 63.5,
    avgOpportunityScore: 50,
    avgCandidateScore: 57.5,
    scoreDistribution: {},
  },
  metadata: {},
};

const mockProviderHealthSnapshot: ProviderHealthSnapshot = {
  providers: [
    {
      provider: 'yahoo_finance',
      status: 'healthy',
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      timeoutCount: 1,
      consecutiveFailures: 0,
      lastFailureTime: null,
      lastSuccessTime: Date.now(),
      lastRequestTime: Date.now(),
      recoveryTimeMs: null,
      avgLatencyMs: 150,
      p50LatencyMs: 120,
      p95LatencyMs: 300,
      p99LatencyMs: 500,
      reliabilityScore: 95,
      successRate: 95,
      errorRate: 5,
      uptime: 86400000,
    },
    {
      provider: 'fintables',
      status: 'degraded',
      totalRequests: 50,
      successfulRequests: 40,
      failedRequests: 10,
      timeoutCount: 3,
      consecutiveFailures: 2,
      lastFailureTime: Date.now(),
      lastSuccessTime: Date.now() - 60000,
      lastRequestTime: Date.now(),
      recoveryTimeMs: null,
      avgLatencyMs: 500,
      p50LatencyMs: 400,
      p95LatencyMs: 1200,
      p99LatencyMs: 2000,
      reliabilityScore: 70,
      successRate: 80,
      errorRate: 20,
      uptime: 86400000,
    },
  ],
  overallStatus: 'degraded',
  totalProviders: 2,
  healthyCount: 1,
  degradedCount: 1,
  unhealthyCount: 0,
  timestamp: new Date().toISOString(),
};

describe('PersistenceService', () => {
  let service: PersistenceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.isDbConnected.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistenceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventBusEngine, useValue: mockEventBus },
        { provide: AuditLogEngine, useValue: mockAuditLog },
        { provide: PerformanceMonitorEngine, useValue: mockPerformanceMonitor },
      ],
    }).compile();

    service = module.get<PersistenceService>(PersistenceService);
  });

  describe('saveAnalysisResult', () => {
    it('should save analysis result and return record', async () => {
      const mockRecord = { id: 'test-id', symbol: 'THYAO', timeframe: '1d', createdAt: new Date() };
      mockPrismaService.analysisResult.create.mockResolvedValue(mockRecord);

      const result = await service.saveAnalysisResult({ result: mockAnalysisResult });

      expect(result).toBeDefined();
      expect(result?.symbol).toBe('THYAO');
      expect(result?.timeframe).toBe('1d');
      expect(mockPrismaService.analysisResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            symbol: 'THYAO',
            timeframe: '1d',
            eliteScore: 82,
            eliteRating: 'A',
            elitePriority: 'HIGH',
          }),
        }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'persistence.analysis_result.saved',
        'analysis',
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockAuditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'analysis_pipeline',
          entity: 'analysis_result',
          action: 'CREATED',
        }),
      );
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.saveAnalysisResult({ result: mockAnalysisResult });

      expect(result).toBeNull();
      expect(mockPrismaService.analysisResult.create).not.toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      mockPrismaService.analysisResult.create.mockRejectedValue(new Error('DB error'));

      const result = await service.saveAnalysisResult({ result: mockAnalysisResult });

      expect(result).toBeNull();
      expect(mockAuditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'analysis_pipeline',
          action: 'FAILED',
          severity: 'ERROR',
        }),
      );
    });
  });

  describe('getLatestAnalysisResult', () => {
    it('should return latest analysis result', async () => {
      const mockRecord = { id: 'test-id', symbol: 'THYAO', timeframe: '1d' };
      mockPrismaService.analysisResult.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getLatestAnalysisResult('THYAO', '1d');

      expect(result).toBeDefined();
      expect(result?.symbol).toBe('THYAO');
      expect(mockPrismaService.analysisResult.findFirst).toHaveBeenCalledWith({
        where: { symbol: 'THYAO', timeframe: '1d' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.getLatestAnalysisResult('THYAO', '1d');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockPrismaService.analysisResult.findFirst.mockRejectedValue(new Error('DB error'));

      const result = await service.getLatestAnalysisResult('THYAO', '1d');

      expect(result).toBeNull();
    });
  });

  describe('getAnalysisHistory', () => {
    it('should return analysis history with filters', async () => {
      const mockRecords = [{ id: '1', symbol: 'THYAO' }, { id: '2', symbol: 'THYAO' }];
      mockPrismaService.analysisResult.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAnalysisHistory({
        symbol: 'THYAO',
        timeframe: '1d',
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(mockPrismaService.analysisResult.findMany).toHaveBeenCalled();
    });

    it('should return empty array when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.getAnalysisHistory({});

      expect(result).toEqual([]);
    });
  });

  describe('saveScannerRun', () => {
    it('should save scanner run and symbol results', async () => {
      const mockRun = { id: 'run-1', scanType: 'marketOpenScan', createdAt: new Date() };
      const mockSymbolRecords = [
        { id: 's1', scannerRunId: 'run-1', symbol: 'THYAO', status: 'TOP_CANDIDATE' },
        { id: 's2', scannerRunId: 'run-1', symbol: 'GARAN', status: 'REJECTED' },
      ];
      mockPrismaService.scannerRun.create.mockResolvedValue(mockRun);
      mockPrismaService.scannerSymbolResult.create
        .mockResolvedValueOnce(mockSymbolRecords[0])
        .mockResolvedValueOnce(mockSymbolRecords[1]);

      const result = await service.saveScannerRun({
        scanType: 'marketOpenScan',
        result: mockScannerResult,
      });

      expect(result).toBeDefined();
      expect(result?.scanType).toBe('marketOpenScan');
      expect(result?.symbols).toHaveLength(2);
      expect(mockPrismaService.scannerRun.create).toHaveBeenCalled();
      expect(mockPrismaService.scannerSymbolResult.create).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'persistence.scanner_run.saved',
        'scanner',
        expect.objectContaining({
          scanType: 'marketOpenScan',
          totalSymbols: 2,
        }),
        expect.any(Object),
      );
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.saveScannerRun({
        scanType: 'marketOpenScan',
        result: mockScannerResult,
      });

      expect(result).toBeNull();
    });
  });

  describe('saveBacktestPipelineRun', () => {
    it('should save backtest pipeline run', async () => {
      const mockRecord = { id: 'bt-1', createdAt: new Date(), completionStatus: 'completed' };
      mockPrismaService.backtestPipelineRun.create.mockResolvedValue(mockRecord);

      const result = await service.saveBacktestPipelineRun({
        symbolsProcessed: 5,
        symbolsSucceeded: 4,
        symbolsFailed: 1,
        totalTrades: 20,
        winRate: 60,
        avgReturn: 2.5,
        maxDrawdown: -15,
        profitFactor: 1.5,
        benchmarkAlpha: 3.2,
        benchmarkBeta: 0.8,
        perSymbolResults: [],
        benchmarkReturns: null,
        metadata: {},
        status: 'completed',
        error: null,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(result).toBeDefined();
      expect(result?.completionStatus).toBe('completed');
      expect(mockPrismaService.backtestPipelineRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            symbolsProcessed: 5,
            symbolsSucceeded: 4,
            totalTrades: 20,
          }),
        }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'persistence.backtest_pipeline_run.saved',
        'backtest',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.saveBacktestPipelineRun({
        symbolsProcessed: 0,
        symbolsSucceeded: 0,
        symbolsFailed: 0,
        totalTrades: 0,
        winRate: null,
        avgReturn: null,
        maxDrawdown: null,
        profitFactor: null,
        benchmarkAlpha: null,
        benchmarkBeta: null,
        perSymbolResults: null,
        benchmarkReturns: null,
        metadata: null,
        status: 'completed',
        error: null,
        startedAt: new Date(),
        completedAt: null,
      });

      expect(result).toBeNull();
    });
  });

  describe('saveProviderHealth', () => {
    it('should save provider health records for all providers', async () => {
      mockPrismaService.providerHealthRecord.create
        .mockResolvedValueOnce({ id: 'ph1' })
        .mockResolvedValueOnce({ id: 'ph2' });

      const result = await service.saveProviderHealth({
        snapshot: mockProviderHealthSnapshot,
      });

      expect(result).toHaveLength(2);
      expect(mockPrismaService.providerHealthRecord.create).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'persistence.provider_health.saved',
        'provider',
        expect.objectContaining({
          providerCount: 2,
          overallStatus: 'degraded',
        }),
        expect.any(Object),
      );
    });

    it('should return empty array when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.saveProviderHealth({
        snapshot: mockProviderHealthSnapshot,
      });

      expect(result).toEqual([]);
    });
  });

  describe('saveJobRun', () => {
    it('should save scheduler job run', async () => {
      const mockRecord = { id: 'jr-1', createdAt: new Date(), jobName: 'marketOpenScan' };
      mockPrismaService.schedulerJobRun.create.mockResolvedValue(mockRecord);

      const result = await service.saveJobRun({
        jobName: 'marketOpenScan',
        status: 'completed',
        symbolsProcessed: 28,
        symbolsSucceeded: 25,
        symbolsFailed: 3,
        durationMs: 45000,
        error: null,
        metadata: {},
        startedAt: new Date(),
        completedAt: new Date(),
      });

      expect(result).toBeDefined();
      expect(result?.jobName).toBe('marketOpenScan');
      expect(mockPrismaService.schedulerJobRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobName: 'marketOpenScan',
            status: 'completed',
            symbolsProcessed: 28,
          }),
        }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'persistence.job_run.saved',
        'scheduler',
        expect.objectContaining({
          jobName: 'marketOpenScan',
          status: 'completed',
        }),
        expect.any(Object),
      );
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.saveJobRun({
        jobName: 'marketOpenScan',
        status: 'completed',
        symbolsProcessed: 0,
        symbolsSucceeded: 0,
        symbolsFailed: 0,
        durationMs: null,
        error: null,
        metadata: null,
        startedAt: new Date(),
        completedAt: null,
      });

      expect(result).toBeNull();
    });
  });

  describe('getJobHistory', () => {
    it('should return job history filtered by job name', async () => {
      const mockRecords = [
        { id: '1', jobName: 'marketOpenScan' },
        { id: '2', jobName: 'marketOpenScan' },
      ];
      mockPrismaService.schedulerJobRun.findMany.mockResolvedValue(mockRecords);

      const result = await service.getJobHistory({
        jobName: 'marketOpenScan',
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(mockPrismaService.schedulerJobRun.findMany).toHaveBeenCalled();
    });

    it('should return empty array when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.getJobHistory({});

      expect(result).toEqual([]);
    });
  });

  describe('getLatestJobRun', () => {
    it('should return latest job run for a specific job', async () => {
      const mockRecord = { id: 'jr-1', jobName: 'nightlyBacktest' };
      mockPrismaService.schedulerJobRun.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getLatestJobRun('nightlyBacktest');

      expect(result).toBeDefined();
      expect(result?.jobName).toBe('nightlyBacktest');
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.getLatestJobRun('nightlyBacktest');

      expect(result).toBeNull();
    });
  });

  describe('getPersistenceStats', () => {
    it('should return persistence statistics', async () => {
      mockPrismaService.analysisResult.count.mockResolvedValue(100);
      mockPrismaService.scannerRun.count.mockResolvedValue(50);
      mockPrismaService.backtestPipelineRun.count.mockResolvedValue(10);
      mockPrismaService.providerHealthRecord.count.mockResolvedValue(200);
      mockPrismaService.schedulerJobRun.count.mockResolvedValue(300);

      const result = await service.getPersistenceStats();

      expect(result).toEqual({
        analysisResults: 100,
        scannerRuns: 50,
        backtestPipelineRuns: 10,
        providerHealthRecords: 200,
        schedulerJobRuns: 300,
      });
    });

    it('should return empty object when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.getPersistenceStats();

      expect(result).toEqual({});
    });
  });

  describe('getLatestBacktestPipelineRun', () => {
    it('should return latest backtest pipeline run', async () => {
      const mockRecord = { id: 'bt-1', completionStatus: 'completed' };
      mockPrismaService.backtestPipelineRun.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getLatestBacktestPipelineRun();

      expect(result).toBeDefined();
      expect(result?.completionStatus).toBe('completed');
    });

    it('should return null when DB is unavailable', async () => {
      mockPrismaService.isDbConnected.mockReturnValue(false);

      const result = await service.getLatestBacktestPipelineRun();

      expect(result).toBeNull();
    });
  });

  describe('getBacktestHistory', () => {
    it('should return backtest history', async () => {
      const mockRecords = [{ id: 'bt-1' }, { id: 'bt-2' }];
      mockPrismaService.backtestPipelineRun.findMany.mockResolvedValue(mockRecords);

      const result = await service.getBacktestHistory(5);

      expect(result).toHaveLength(2);
    });
  });

  describe('getLatestScannerRun', () => {
    it('should return latest scanner run', async () => {
      const mockRecord = { id: 'run-1', scanType: 'marketOpenScan', symbols: [] };
      mockPrismaService.scannerRun.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getLatestScannerRun('marketOpenScan');

      expect(result).toBeDefined();
      expect(result?.scanType).toBe('marketOpenScan');
    });
  });

  describe('getScannerHistory', () => {
    it('should return scanner history', async () => {
      const mockRecords = [{ id: 'run-1', scanType: 'marketOpenScan', symbols: [] }];
      mockPrismaService.scannerRun.findMany.mockResolvedValue(mockRecords);

      const result = await service.getScannerHistory({ scanType: 'marketOpenScan', limit: 5 });

      expect(result).toHaveLength(1);
    });
  });

  describe('getProviderHealthHistory', () => {
    it('should return provider health history', async () => {
      const mockRecords = [{ id: 'ph1', provider: 'yahoo_finance' }];
      mockPrismaService.providerHealthRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.getProviderHealthHistory({
        provider: 'yahoo_finance',
        limit: 10,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('getLatestProviderHealth', () => {
    it('should return latest provider health', async () => {
      const mockRecords = [
        { id: 'ph1', provider: 'yahoo_finance' },
        { id: 'ph2', provider: 'fintables' },
      ];
      mockPrismaService.providerHealthRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.getLatestProviderHealth();

      expect(result).toHaveLength(2);
    });
  });
});
