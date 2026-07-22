import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BIST_STOCKS = [
  { symbol: 'THYAO', name: 'Turk Hava Yollari', sector: 'aviation' },
  { symbol: 'GARAN', name: 'Garanti Bankasi', sector: 'banking' },
  { symbol: 'ASELS', name: 'Aselsan Elektronik', sector: 'defense' },
  { symbol: 'SISE', name: 'Sisecam', sector: 'glass' },
  { symbol: 'EREGL', name: 'Eregli Demir Celik', sector: 'steel' },
  { symbol: 'KCHOL', name: 'Koc Holding', sector: 'holding' },
  { symbol: 'BIMAS', name: 'BIM Magazalar', sector: 'retail' },
  { symbol: 'AKBNK', name: 'Akbank', sector: 'banking' },
  { symbol: 'TUPRS', name: 'Turk Petrol Rafinerileri', sector: 'energy' },
  { symbol: 'SAHOL', name: 'Sabanci Holding', sector: 'holding' },
];

async function seed() {
  console.log('Seeding database...');
  for (const stock of BIST_STOCKS) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: stock,
    });
  }
  console.log(`Seeded ${BIST_STOCKS.length} stocks`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());