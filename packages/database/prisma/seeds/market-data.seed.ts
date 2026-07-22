import { PrismaClient } from '@prisma/client';

const bist30Companies = [
  { symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'Ulaştırma', industry: 'Havayolu' },
  { symbol: 'GARAN', name: 'Garanti Bankası', sector: 'Finans', industry: 'Banka' },
  { symbol: 'ASELS', name: 'ASELSAN', sector: 'Savunma', industry: 'Savunma Elektroniği' },
  { symbol: 'BIMAS', name: 'BİM Mağazalar', sector: 'Perakende', industry: 'Perakende' },
  { symbol: 'KCHOL', name: 'Koç Holding', sector: 'Holding', industry: 'Yatırım Holding' },
  { symbol: 'EREGL', name: 'Ereğli Demir Çelik', sector: 'Demir-Çelik', industry: 'Demir Çelik' },
  { symbol: 'AKBNK', name: 'Akbank', sector: 'Finans', industry: 'Banka' },
  { symbol: 'SISE', name: 'Şişecam', sector: 'Cam', industry: 'Cam' },
  { symbol: 'BRLSM', name: 'Borusan Mannesmann', sector: 'Metal', industry: 'Metal' },
  { symbol: 'TUPRS', name: 'Tüpraş', sector: 'Enerji', industry: 'Petrol Rafinerisi' },
  { symbol: 'TCELL', name: 'Turkcell', sector: 'Telekomünikasyon', industry: 'Mobil Operatör' },
  { symbol: 'SAHOL', name: 'Sabancı Holding', sector: 'Holding', industry: 'Yatırım Holding' },
  { symbol: 'TOASO', name: 'Tofaş Otomobil', sector: 'Otomotiv', industry: 'Otomobil' },
  { symbol: 'TAVHL', name: 'TAV Havalimanları', sector: 'Ulaştırma', industry: 'Havalimanı İşletme' },
  { symbol: 'YKBNK', name: 'Yapı Kredi Bankası', sector: 'Finans', industry: 'Banka' },
  { symbol: 'EKGYO', name: 'Emlak Konut GYO', sector: 'GYO', industry: 'Gayrimenkul Yatırım' },
  { symbol: 'KONTR', name: 'Kontrolmatik', sector: 'Teknoloji', industry: 'Enerji Teknolojisi' },
  { symbol: 'PGSUS', name: 'Pegasus Hava Yolları', sector: 'Ulaştırma', industry: 'Havayolu' },
  { symbol: 'KOZAL', name: 'Koza Altın', sector: 'Madencilik', industry: 'Altın Madenciliği' },
  { symbol: 'FROTO', name: 'Ford Otomotiv', sector: 'Otomotiv', industry: 'Otomobil' },
  { symbol: 'SASA', name: 'SASA Polyester', sector: 'Kimya', industry: 'Petrokimya' },
  { symbol: 'ENKAI', name: 'Enka İnşaat', sector: 'İnşaat', industry: 'İnşaat' },
  { symbol: 'ODAS', name: 'Odaş Elektrik', sector: 'Enerji', industry: 'Elektrik Üretimi' },
  { symbol: 'TTRAK', name: 'Tümosan', sector: 'Makine', industry: 'Traktör' },
  { symbol: 'ARCLK', name: 'Arçelik', sector: 'Beyaz Eşya', industry: 'Beyaz Eşya' },
  { symbol: 'ISCTR', name: 'İş Bankası', sector: 'Finans', industry: 'Banka' },
  { symbol: 'VESTL', name: 'Vestel Elektronik', sector: 'Teknoloji', industry: 'Elektronik' },
  { symbol: 'PETKM', name: 'Petkim', sector: 'Kimya', industry: 'Petrokimya' },
  { symbol: 'TKFEN', name: 'Tekfen Holding', sector: 'Holding', industry: 'Yatırım Holding' },
  { symbol: 'GOLTS', name: 'Göktaş', sector: 'Gıda', industry: 'Gıda' },
];

export async function seedMarketData(prisma: PrismaClient) {
  for (const company of bist30Companies) {
    const created = await prisma.company.upsert({
      where: { symbol: company.symbol },
      update: {},
      create: {
        symbol: company.symbol,
        name: company.name,
        sector: company.sector,
        industry: company.industry,
        marketSegment: 'MAIN',
        isActive: true,
      },
    });

    await prisma.stock.upsert({
      where: { symbol: company.symbol },
      update: {},
      create: {
        companyId: created.id,
        symbol: company.symbol,
        ticker: company.symbol,
        exchange: 'BIST',
        currency: 'TRY',
        lotSize: 1,
        tickSize: 0.01,
        isActive: true,
      },
    });
  }
}
