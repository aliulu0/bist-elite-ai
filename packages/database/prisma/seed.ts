import { PrismaClient } from '@prisma/client';
import { seedSystemSettings } from './seeds/system-settings.seed';
import { seedMarketData } from './seeds/market-data.seed';
import { seedRiskProfiles } from './seeds/risk-profiles.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await seedSystemSettings(prisma);
  console.log('  System settings seeded');

  await seedMarketData(prisma);
  console.log('  Market data seeded');

  await seedRiskProfiles(prisma);
  console.log('  Risk profiles seeded');

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
