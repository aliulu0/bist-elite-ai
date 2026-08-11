import { Test, TestingModule } from '@nestjs/testing';
import { VerificationController } from './verification-ai.controller';
import { VerificationAIService } from './verification-ai.service';
import { VerificationResult } from './verification-ai.types';

const makeResult = (ticker: string): VerificationResult => ({
  ticker,
  verified: 'TRUE',
  verificationScore: 85,
  evidenceCount: 4,
  sourceCount: 4,
  trustedSources: ['KAP', 'TCMB'],
  conflictingSources: [],
  lastVerified: new Date().toISOString(),
  verificationReason: '4 kanıt, 4 güvenilir kaynak ile doğrulandı (güven skoru 85).',
  claims: [],
  rawSources: [],
});

describe('VerificationController', () => {
  let controller: VerificationController;
  let service: VerificationAIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [
        {
          provide: VerificationAIService,
          useValue: {
            getVerification: jest.fn().mockResolvedValue(makeResult('THYAO.IS')),
            getReport: jest.fn().mockResolvedValue({
              ticker: 'THYAO.IS',
              summary: { verified: 'TRUE', verificationScore: 85, evidenceCount: 4, sourceCount: 4, trustedSources: ['KAP'], conflictingSources: [] },
              claims: [],
              generatedAt: new Date().toISOString(),
            }),
            refreshVerification: jest.fn().mockResolvedValue(makeResult('THYAO.IS')),
          },
        },
      ],
    }).compile();

    controller = module.get(VerificationController);
    service = module.get(VerificationAIService);
  });

  it('returns a verification DTO for a ticker', async () => {
    const result = await controller.getVerification('THYAO.IS');

    expect(result.ticker).toBe('THYAO.IS');
    expect(result.verified).toBe('TRUE');
    expect(result.verificationScore).toBe(85);
    expect(service.getVerification).toHaveBeenCalledWith('THYAO.IS');
  });

  it('returns a report DTO for a ticker', async () => {
    const report = await controller.getReport('THYAO.IS');

    expect(report.ticker).toBe('THYAO.IS');
    expect(report.summary.verified).toBe('TRUE');
    expect(service.getReport).toHaveBeenCalledWith('THYAO.IS');
  });

  it('forces a refresh for a ticker', async () => {
    const result = await controller.refresh('THYAO.IS');

    expect(result.ticker).toBe('THYAO.IS');
    expect(result.result.verificationScore).toBe(85);
    expect(service.refreshVerification).toHaveBeenCalledWith('THYAO.IS');
  });
});
