import { PrismaClient } from '@prisma/client';

const defaultProfiles = [
  {
    name: 'Conservative',
    strategy: 'conservative',
    riskLevel: 'LOW' as const,
    maxPositionSize: 0.05,
    maxSectorExposure: 0.2,
    maxCorrelation: 0.5,
    stopLossPercent: 0.05,
    takeProfitRatio: 2.0,
    maxDrawdown: 0.1,
  },
  {
    name: 'Balanced',
    strategy: 'balanced',
    riskLevel: 'MEDIUM' as const,
    maxPositionSize: 0.1,
    maxSectorExposure: 0.3,
    maxCorrelation: 0.6,
    stopLossPercent: 0.08,
    takeProfitRatio: 2.5,
    maxDrawdown: 0.15,
  },
  {
    name: 'Aggressive',
    strategy: 'aggressive',
    riskLevel: 'HIGH' as const,
    maxPositionSize: 0.15,
    maxSectorExposure: 0.4,
    maxCorrelation: 0.7,
    stopLossPercent: 0.1,
    takeProfitRatio: 3.0,
    maxDrawdown: 0.25,
  },
  {
    name: 'Speculative',
    strategy: 'speculative',
    riskLevel: 'VERY_HIGH' as const,
    maxPositionSize: 0.2,
    maxSectorExposure: 0.5,
    maxCorrelation: 0.8,
    stopLossPercent: 0.15,
    takeProfitRatio: 4.0,
    maxDrawdown: 0.35,
  },
];

export async function seedRiskProfiles(prisma: PrismaClient) {
  let portfolio = await prisma.portfolio.findFirst({
    where: { isDefault: true },
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        name: 'Default Portfolio',
        description: 'Default portfolio for development and testing',
        strategy: 'balanced',
        isDefault: true,
      },
    });
  }

  for (const profile of defaultProfiles) {
    await prisma.riskProfile.upsert({
      where: {
        portfolioId_riskLevel: {
          portfolioId: portfolio.id,
          riskLevel: profile.riskLevel,
        },
      },
      update: {},
      create: {
        portfolioId: portfolio.id,
        riskLevel: profile.riskLevel,
        maxPositionSize: profile.maxPositionSize,
        maxSectorExposure: profile.maxSectorExposure,
        maxCorrelation: profile.maxCorrelation,
        stopLossPercent: profile.stopLossPercent,
        takeProfitRatio: profile.takeProfitRatio,
        maxDrawdown: profile.maxDrawdown,
      },
    });
  }
}
