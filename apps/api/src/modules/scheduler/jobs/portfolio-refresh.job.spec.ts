import { PortfolioRefreshJob } from './portfolio-refresh.job';

describe('PortfolioRefreshJob', () => {
  let job: PortfolioRefreshJob;

  beforeEach(() => {
    job = new PortfolioRefreshJob({
      getPortfolios: jest.fn().mockReturnValue([]),
    } as any);
  });

  it('should execute successfully', async () => {
    const result = await job.execute();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Portfolio data refreshed');
  });

  it('should include timestamp in metadata', async () => {
    const result = await job.execute();
    expect(result.metadata).toHaveProperty('timestamp');
  });
});
