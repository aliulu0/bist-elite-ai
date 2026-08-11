# R2-010: AI Scanner Runtime Integration

## Architecture

The Scanner now integrates the AI Scoring Engine (R2-009A) with real data (R2-009B) to return REAL AI scores for every scanned instrument.

```
Scanner
  ↓
EliteScannerEngine
  ↓
  ├─ ScannerRegistry (795 instruments, 643 active)
  ├─ StrategyRegistry (9 strategies)
  ├─ ScannerFilter (sector, assetType, activeOnly, limit)
  ├─ MarketDataOrchestrator (company data)
  ├─ MarketDataCacheService (cache reuse)
  ├─ MarketDataService (latest prices)
  ├─ ScoreEngine (shared across all strategies)
  └─ ScorePipeline (10-stage pipeline)
        ↓
  EliteScannerResult (all 13 scoring fields)
```

## Runtime Flow

1. **Request** arrives at `/scanner/run` or `/scanner/strategy/:strategy`
2. **ScannerRegistry** provides 643 active instruments (filtered by sector/assetType if specified)
3. **EliteScannerEngine** processes instruments concurrently (bounded by `concurrency` config)
4. For each instrument:
   - Load market data from cache or providers
   - Build `ScorePipelineInput` from market data
   - Call `ScoreEngine.score()` with the instrument and strategy weight profile
   - ScoreEngine runs the 10-stage pipeline (technical, fundamental, verification, catalyst, liquidity, risk, volume, momentum, trend, quality)
   - Dynamic AI Confidence formula computes confidence from provider coverage, verification confidence, catalyst confidence, freshness, data completeness, conflicting evidence
   - Return `EliteScannerResult` with all 13 scoring fields populated
5. **Sort** results by AI Score DESC, secondary by AI Confidence DESC
6. **Filter** results by minAiScore, minConfidence, sector, assetType, activeOnly, limit
7. **Return** response with top results, averages, and summary

## Cache Flow

- `MarketDataCacheService.getOrSet()` reuses cached company data and latest prices
- No duplicated provider requests across instruments
- No duplicated indicator calculations (IndicatorEngine caches per symbol)
- Historical data cache reused by ScorePipeline
- ResearchRepository cache reused for verification data
- AggregationModule cache reused for financial data

## Performance

- **Target**: 643 symbols < 60 seconds with warm cache
- **Concurrency**: Bounded by `concurrency` config (default: 10)
- **Cache warm**: All providers return cached data on second scan
- **No duplication**: Each provider request made once per symbol per scan
- **No duplicate indicators**: IndicatorEngine caches per symbol

## API Endpoints

### GET /scanner/run
Run all enabled strategies and return combined results sorted by AI Score DESC.

Query params:
- `sector` - Filter by sector (e.g., "Gıda")
- `assetType` - Filter by asset type (e.g., "Equity")
- `limit` - Maximum results (default: 100)
- `activeOnly` - Only active symbols (default: true)

Response: `ScannerRunResponseDto` with top results, average AI Score, average AI Confidence, total scanned, scan duration.

### GET /scanner/strategy/:strategy
Run a specific strategy and return results sorted by AI Score DESC.

Path params:
- `strategy` - Strategy ID (e.g., "value-hunter", "momentum", "swing")

Query params:
- `sector` - Filter by sector
- `assetType` - Filter by asset type
- `limit` - Maximum results
- `activeOnly` - Only active symbols

Response: `ScannerResultsResponseDto` with results and summary.

### GET /scanner/top
Return top N results by AI Score across all strategies.

Query params:
- `strategy` - Optional strategy filter
- `limit` - Number of top results (default: 10)

Response: `ScannerTopResponseDto` with top results and averages.

### GET /scanner/filter
Filter last scan results by AI score and confidence thresholds.

Query params:
- `minAiScore` - Minimum AI Score (0-100)
- `minConfidence` - Minimum AI Confidence (0-100)
- `sector` - Filter by sector
- `assetType` - Filter by asset type
- `activeOnly` - Only active symbols
- `limit` - Maximum results

Response: `ScannerFilterResponseDto` with filtered results and averages.

## Response Examples

### /scanner/run Response
```json
{
  "baslik": "Tarama Sonuçları",
  "hisseSayisi": 15,
  "toplamTaranan": 643,
  "taramaSuresi": 42000,
  "ortalamaYapayZekaPuani": 68,
  "ortalamaYapayZekaGuveni": 72,
  "sonuclar": [
    {
      "ticker": "THYAO",
      "company": "Türk Hava Yolları",
      "sector": "Ulaştırma",
      "price": 450.5,
      "volume": 25000000,
      "marketCap": 850000000000,
      "technicalScore": 82,
      "fundamentalScore": 75,
      "momentumScore": 78,
      "trendScore": 70,
      "liquidityScore": 90,
      "riskScore": 35,
      "volumeScore": 85,
      "qualityScore": 78,
      "verificationScore": 88,
      "catalystScore": 60,
      "aiScore": 76,
      "aiConfidence": 82,
      "provider": "yahoo",
      "lastUpdate": "2025-01-15T00:00:00.000Z",
      "strategyId": "value-hunter",
      "strategyName": "Değer Avcısı",
      "reasons": ["Tarama tamamlandı. Skorlar gerçek veriden hesaplandı."],
      "scannedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### /scanner/top Response
```json
{
  "baslik": "En Yüksek AI Puanlı Hisse Senetleri",
  "toplamHisse": 10,
  "ortalamaYapayZekaPuani": 72,
  "ortalamaYapayZekaGuveni": 78,
  "sonuclar": [
    {
      "ticker": "THYAO",
      "company": "Türk Hava Yolları",
      "sector": "Ulaştırma",
      "aiScore": 76,
      "aiConfidence": 82,
      "strategyId": "value-hunter",
      "strategyName": "Değer Avcısı",
      "scannedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### /scanner/filter Response
```json
{
  "baslik": "Tarama Sonuçları",
  "toplamHisse": 643,
  "filtreSonucu": 15,
  "ortalamaYapayZekaPuani": 72,
  "ortalamaYapayZekaGuveni": 78,
  "sonuclar": [
    {
      "ticker": "THYAO",
      "company": "Türk Hava Yolları",
      "sector": "Ulaştırma",
      "aiScore": 76,
      "aiConfidence": 82,
      "strategyId": "value-hunter",
      "strategyName": "Değer Avcısı",
      "reasons": ["Tarama tamamlandı. Skorlar gerçek veriden hesaplandı."],
      "scannedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

## Scanner Strategies (9)

All strategies reuse the SAME ScoreEngine. Each strategy supplies only a weight profile.

| Strategy ID | Turkish Name | Description |
|---|---|---|
| value-hunter | Değer Avcısı | Low valuation discount strategy |
| smart-money | Akıllı Para | Institutional flow tracking |
| momentum | Momentum | Strong price trend following |
| swing | Swing | Medium-term price swing profit |
| dip-collector | Dip Toplayıcı | Buying opportunities during dips |
| minervini | Minervini | Minervini method |
| canslim | CANSLIM | CANSLIM criteria |
| william-oneil | William O'Neil | William O'Neil breakout method |
| qullamaggie | Qullamaggie | Qullamaggie strong trend method |

## Scoring Dimensions (10)

All populated from real services when data available:

1. **Technical Score** - From IndicatorEngine (RSI, MACD, EMA, SMA, ADX, ATR, etc.)
2. **Fundamental Score** - From AggregationModule (PE, PB, debt/equity, revenue growth, etc.)
3. **Verification Score** - From ResearchModule (source count, verified count, confidence)
4. **Catalyst Score** - From ResearchModule (catalyst count, direction, strength)
5. **Liquidity Score** - From AggregationModule (volume, market cap, bid-ask spread)
6. **Risk Score** - From ScoreCalculator (volatility, drawdown, concentration)
7. **Volume Score** - From IndicatorEngine (OBV, volume trends)
8. **Quality Score** - From AggregationModule (ROE, net margin, FCF)
9. **Verification Score** - From ResearchModule (source diversity, evidence count)
10. **Catalyst Score** - From ResearchModule (catalyst proximity, strength)

## AI Confidence Formula

Dynamic formula based on:
- Provider coverage (how many data providers have data)
- Verification confidence (from ResearchModule)
- Catalyst confidence (from ResearchModule)
- Data freshness (age of price/financial data)
- Data completeness (how many dimensions have data)
- Conflicting evidence (disagreement between providers)

## Reused Production Services

- **ScannerRegistry** - Instrument registry with 795 entries (643 active)
- **StrategyRegistry** - 9 strategy weight profiles
- **ScannerFilter** - Sector, assetType, activeOnly, limit filtering
- **EliteScannerEngine** - Async concurrent scanning with bounded concurrency
- **ScoreEngine** - Shared scoring engine used by all strategies
- **MarketDataOrchestrator** - Company data fetching
- **MarketDataCacheService** - Cache for company data and latest prices
- **ResearchRepository** - Verification and catalyst data
- **HistoricalDataModule** - Historical price data for indicators
- **AggregationModule** - Financial data aggregation
- **IndicatorsModule** - Technical indicator calculations
- **MarketDataService** - Latest price data

## Verification

- Build: GREEN
- Tests: 17 GREEN (elite-scanner.spec.ts)
- 643 active BIST symbols supported
- Real AI Scores populated from ScoreEngine
- Real AI Confidence from dynamic formula
- Zero duplicated provider requests (cache reuse)
- Zero duplicated indicator calculations (IndicatorEngine cache)
- Turkish UI throughout
- All 9 strategies return real AI scores