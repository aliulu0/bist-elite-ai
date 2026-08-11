import { Test, TestingModule } from '@nestjs/testing';
import { SignalsController } from './signals.controller';
import { EarlySignalScannerService } from './early-signal-scanner.service';
import { EarlySignalScannerResult } from './early-signal.types';

const makeScanResult = (ticker: string): EarlySignalScannerResult => {
  const sig = {
    id: `${ticker}:SMART_MONEY:accumulation`,
    ticker,
    category: 'SMART_MONEY' as const,
    type: 'accumulation',
    phase: 'EARLY' as const,
    strength: 78,
    strengthLabel: 'Strong' as const,
    priority: 'MEDIUM' as const,
    description: 'Kurumsal birikim 78/100.',
    sourceFields: ['smartMoney.accumulationScore'],
    detectedAt: new Date().toISOString(),
  };
  return {
    ticker,
    company: 'Test Holding',
    sector: 'Ulaştırma',
    signals: [sig],
    convergence: {
      convergenceScore: 72,
      totalSignals: 1,
      strongSignalCount: 1,
      earlyCount: 1,
      confirmedCount: 0,
      categoryCoverage: 1,
      avgStrength: 78,
      confirmedShare: 0,
      strongestSignals: [sig],
    },
    dataQualityStatus: 'DATA_VERIFIED',
    scannedAt: new Date().toISOString(),
  };
};

describe('SignalsController', () => {
  let controller: SignalsController;
  let scanner: EarlySignalScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalsController],
      providers: [
        {
          provide: EarlySignalScannerService,
          useValue: {
            scan: jest.fn().mockResolvedValue(makeScanResult('THYAO')),
            scanTop: jest.fn().mockResolvedValue([makeScanResult('THYAO')]),
          },
        },
      ],
    }).compile();

    controller = module.get(SignalsController);
    scanner = module.get(EarlySignalScannerService);
  });

  it('exposes deterministic signals for a single ticker', async () => {
    const result = await controller.scan('THYAO');
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('THYAO');
    expect(result!.signals).toHaveLength(1);
    expect(result!.signals[0].category).toBe('SMART_MONEY');
    expect(result!.convergence.convergenceScore).toBe(72);
    expect(result!.convergence.strongSignalCount).toBe(1);
    expect(scanner.scan).toHaveBeenCalledWith('THYAO');
  });

  it('returns null for a ticker with no data', async () => {
    (scanner.scan as jest.Mock).mockResolvedValue(null);
    const result = await controller.scan('UNKNOWN');
    expect(result).toBeNull();
  });

  it('returns top signals ranked by convergence with limit', async () => {
    const result = await controller.scanTop('5');
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('THYAO');
    expect(scanner.scanTop).toHaveBeenCalledWith(5, expect.any(Object));
  });

  it('forwards signal filters to scanTop', async () => {
    await controller.scanTop('10', '70', '60', 'SMART_MONEY', 'accumulation', 'true', undefined);
    expect(scanner.scanTop).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        minSignalStrength: 70,
        minSignalConvergence: 60,
        signalCategory: 'SMART_MONEY',
        signalType: 'accumulation',
        earlyOnly: true,
      }),
    );
  });

  it('produces a deterministic Turkish explanation', async () => {
    const result = await controller.explain('THYAO');
    expect(result.ticker).toBe('THYAO');
    expect(result.explanation).toContain('THYAO');
    expect(result.explanation).toContain('72/100');
    expect(result.explanation).toContain('erken');
  });

  it('returns a null explanation when no data exists', async () => {
    (scanner.scan as jest.Mock).mockResolvedValue(null);
    const result = await controller.explain('UNKNOWN');
    expect(result.explanation).toBeNull();
  });
});
