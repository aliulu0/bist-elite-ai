# R2-063: Real BIST Universe + Historical Market Data Foundation

## 1. Current State

### 1.1 Existing Data Sources (per R2-056 through R2-062)

| Provider                           | BIST Capability                                                                                                          | Status                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **Yahoo Finance**                  | Real-time price for 6/6 BIST symbols (THYAO=305.25, AKBNK=68.80, ASELS=387.50, BIMAS=374.75, TUPRS=361.75, GARAN=131.00) | VERIFIED                      |
| **SerpAPI / Google Finance**       | Research layer only; `fetchGoogleFinance()` returns `null` when no price (rate-limited 429)                              | UNAVAILABLE for market data   |
| **Finnhub**                        | ENDPOINT_UNSUPPORTED for BIST                                                                                            | NOT AVAILABLE                 |
| **Alpha Vantage**                  | ENDPOINT_UNSUPPORTED for BIST                                                                                            | NOT AVAILABLE                 |
| **Fintables**                      | DISABLED (no credentials in .env)                                                                                        | NOT CONFIGURED                |
| **KAP**                            | Disclosure/source files only                                                                                             | AUTHORITATIVE disclosure      |
| **TCMB**                           | Macro source (USD/TRY, EUR/TRY policy rates)                                                                             | MACRO only                    |
| **official BIST100/BIST30 index**  | Runtime unavailable (no official BIST API access)                                                                        | UNAVAILABLE                   |
| **synthetic BIST100/BIST30 proxy** | Computed from 10/30 Yahoo constituents, type=`SYNTHETIC_PROXY`                                                           | AVAILABLE as derived          |
| **6 test symbols universe**        | THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN                                                                                 | TEST/VALIDATION universe ONLY |
| **117/117 macro tests**            | All PASS, regression-free                                                                                                | PRESERVED                     |

### 1.2 Key Findings from R2-062

- Synthetic indices are explicitly typed `SYNTHETIC_PROXY`, NOT `OFFICIAL`
- `BIST100`/`BIST30` official data unavailable at runtime
- 6 test symbols are a TEST/FIXTURE universe, NOT the BIST production universe
- No fake production data in any path (R2-059 guarantees maintained)
- Market breadth, relative strength, volume intelligence all have explicit `coverage: "PARTIAL"` semantics
- All new features return `null`/`UNAVAILABLE` when data absent
- 117/117 macro test suites regression-free preserved

### 1.3 Current Universe Limitations

```text
6 test symbols (THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN)
  ↓
TEST / VALIDATION universe only
  ↓
NOT the production BIST universe
  ↓
NO official BIST100/BIST30 index data at runtime
  ↓
NO historical OHLCV foundation established
  ↓
NO sector metadata from authoritative source
  ↓
NO instrument type classification
  ↓
NO market segment data
```

## 2. Objective

R2-063 researches and establishes the **real BIST symbol universe** with **real historical OHLCV market data foundation**, enabling the system to move beyond the 6 test symbols toward a production-capable opportunity universe.

**Absolute foundation principles:**

- `REAL DATA` — only traceable to real sources
- `CORRECT SEMANTICS` — explicit official/synthetic distinction, coverage semantics
- `NO FABRICATION` — no fake prices, no invented universes, no hardcoded financial values

**This sprint does NOT create new scoring systems.** The foundation must be solid first.

### 2.1 Research Hierarchy (Priority Order)

1. **Borsa İstanbul resmi kaynakları** — Official BIST data sources (if machine-readable API exists)
2. **Yetkili public market-data source** — Authoritative public providers with BIST coverage
3. **Yahoo Finance** — Real BIST prices for 6 symbols (primary, already verified)
4. **KAP / MKK metadata** — Corporate disclosure and market data
5. **Diğer doğrulanabilir kaynaklar** — Other verifiable public sources

**Critical:** Web sayfası bulunması API erişimi olduğu anlamına gelmez.
**Runtime / machine-readable erişim doğrulanmalıdır.**

## 3. First Step — Repository Audit

### 3.1 Files to Audit

Search the repository for these patterns:

```
symbols
universe
stocks
instruments
securities
tickers
constituents
BIST30
BIST50
BIST100
sector
industry
market-data
historical
OHLCV
candles
price-history
```

### 3.2 Existing Implementation Review

- **No manual hardcoded stock lists** in production code (R2-059 enforced)
- **Symbol normalization** already partially in place (`symbol-normalizer.service.ts`)
- **Market-data pipeline** already orchestrated via `MarketDataOrchestrator` with priority-based sorting
- **Cache service** already established (`MarketDataCacheService`)
- **No second pipeline** — all features use existing orchestrator infrastructure
- **117/117 macro tests** — all passing, no regression

### 3.3 Gap Analysis

| Capability                 | Current Status              | Required Action                               |
| -------------------------- | --------------------------- | --------------------------------------------- |
| Real BIST universe         | TEST symbols only (6)       | Research authoritative source                 |
| Historical OHLCV           | Yahoo Finance for 6 symbols | Establish foundation, research expansion      |
| Sector metadata            | Not implemented             | Research from KAP/MKT or authoritative source |
| Instrument type            | Not implemented             | Add to symbol model                           |
| Market segments            | Not implemented             | Research BIST segment structure               |
| 4H/Weekly/Monthly data     | Not researched              | Provider capability research                  |
| Technical indicators       | R2-061 types available      | Add when data foundation ready                |
| Universe coverage metadata | `coverage: "PARTIAL"`       | Establish real coverage percentages           |

## 4. Real BIST Universe Research

### 4.1 Research Hierarchy Implementation

```text
1. Borsa İstanbul resmi kaynakları
   ↓
2. Yetkili public market-data source
   ↓
3. Yahoo Finance (verified: 6/6 symbols)
   ↓
4. KAP / MKK metadata
   ↓
5. Diğer doğrulanabilir kaynaklar
```

### 4.2 Universe Source Semantics

Universe source must be explicitly tracked:

```text
sourceType:
  OFFICIAL    → BIST official data source
  PUBLIC_PROVIDER  → Authoritative public provider
  RESEARCH     → Research/yahoofinance-derived
  DERIVED      → Computed from available data
```

If official BIST universe unavailable:

```text
UNAVAILABLE
```

or `PARTIAL` with explicit coverage percentage and source tracking.

### 4.3 No Manual Stock List

**Production universe için elle yazılmış uzun symbol listesi CREATEMEZ.**

- Test fixture dışı hardcoded universe YASAK
- Gerçek provider'dan veya authoritative metadata source'tan gelmelidir
- Symbol listesi provider-aware ve dynamic olmalıdır

### 4.4 Symbol Normalization

Provider symbol → internal symbol mapping must be deterministic:

```text
providerSymbol: THYAO.IS
internalSymbol: THYAO
exchange: BIST
currency: TRY
```

Normalization source-aware olmalı - farklı provider'lar farklı sembol formatları kullanabilir.

### 4.5 Instrument Model

Existing architecture'a uygun instrument/security model create/g genişlet:

```text
symbol: THYAO
providerSymbol: THYAO.IS
name: Turkiye Halk Bankasi A.S.
exchange: BIST
currency: TRY
instrumentType: equity
sector: Banking
industry: Banking
source: Yahoo Finance
timestamp: 2026-08-16T14:30:00Z
status: AVAILABLE
```

Sadece gerçekten bilinen alanları doldur. Bilinmeyen: `null`.

### 4.5 Market Segments

BIST segment bilgileri gerçekten erişilebiliyorsa araştır:

```text
Yıldız Pazar
Ana Pazar
Alt Pazar
```

Ama hardcode etme. Kaynak yoksa: `marketSegment = null`.

### 4.6 Sector Metadata

Sector mapping gerçek kaynaktan elde edilebiliyorsa ekle:

```text
THYAO → Transportation (or appropriate sector)
```

Elle oluşturma. Sector data source + timestamp korunmalı.

## 5. Historical OHLCV

### 5.1 Yahoo Finance Research

Yahoo Finance veya başka gerçek provider üzerinden historical OHLCV erişimini araştır.

Minimum alanlar:

```
timestamp
open
high
low
close
volume
```

Normalize et. Adjusted close varsa ayrıca:

```text
adjustedClose
```

sakla. Close ile adjustedClose birbirine karıştırılmamalıdır.

### 5.2 Date Range

Historical data API'sinin gerçekten desteklediği range'i tespit et.

Örneğin:

```
1D
5D
1M
3M
6M
1Y
5Y
MAX
```

API ne sağlıyorsa onu kullan. Desteklenmeyen historical range için fake data üretme.

### 5.3 Daily Data

BIST ELITE AI'nin primary historical timeframe'ı:

```
DAILY
```

olmalıdır. Her candle:

```text
timestamp-aware
```

olmalıdır.

### 5.4 4-Hour Data

Kullanıcının istediği 4H timeframe'i araştır.

Provider gerçekten 4H BIST historical data sağlıyor mu?

Sağlamıyorsa:

```text
4H = UNAVAILABLE
```

de. Daily candles'tan sahte 4H candle üretme.

### 5.5 Weekly Data

Provider weekly data sağlıyorsa kullan. Sağlamıyorsa:

```text
UNAVAILABLE
```

Daily → weekly aggregation yapılacaksa bunun:

```text
DERIVED
```

olduğunu açıkça belirt.

### 5.6 Monthly Data

Aynı şekilde monthly. Provider native monthly data ile derived monthly aggregation birbirinden ayrılmalıdır.

### 5.7 Historical Data Quality

Her dataset:

```text
source
retrievedAt
marketTimestamp
interval
coverage
rowCount
status
```

metadata'sına sahip olmalı.

### 5.8 Market Holidays

Eksik candle:

```text
"price = 0"
```

şeklinde doldurulamaz. Market kapalı gün:

```text
NO_DATA_EXPECTED
```

veya mevcut uygun state ile temsil edilmelidir.

### 5.9 Zero Values

Aşağıdakiler gerçek veri olarak kabul edilmemelidir:

```text
price = 0
volume = 0
```

Eğer provider gerçekten 0 döndürüyorsa response validation yap. Invalid olarak sınıflandır.

### 5.10 OHLC Validation

Valid candle için:

```text
open > 0
high > 0
low > 0
close > 0
```

ve:

```text
high >= max(open, close)
low <= min(open, close)
```

kontrol edilebilir. Provider anomalisi varsa candle:

```text
INVALID
```

olarak işaretlenmeli. Sessizce düzeltilmemeli.

### 5.11 Duplicate Data

Aynı:

```text
symbol
timestamp
interval
```

için birden fazla candle gelirse:

```text
source priority
```

veya deterministic deduplication kullanılmalı. Rastgele seçim yapma.

### 5.12 Historical Cache

Mevcut cache system kullanılmalı. Yeni cache engine createMEZ.

Historical cache:

```text
symbol
interval
date range
```

ile key'lenebilir. Mevcut cache convention'a uy.

### 5.13 Provider Budget

R2-050C provider budget sistemi korunmalı. Bütün BIST universe için uncontrolled parallel requests YASAK. Rate-limit-aware batching kullan.

### 5.14 Concurrency

Örneğin:

```text
1000 symbol × 5 request
```

şeklinde kontrolsüz request gönderme. Mevcut provider budget/concurrency limitlerini kullan.

### 5.15 Partial Universe

Provider 600 symbol'den 450'sini veriyorsa:

```text
coverage = PARTIAL
```

olmalıdır. 450 symbol'ı:

```text
FULL BIST
```

olarak gösterme.

### 5.16 Symbol Failures

Bir sembolün data fetch'i başarısızsa tüm universe fail olmamalıdır.

Per-symbol status:

```text
AVAILABLE
UNAVAILABLE
INVALID
RATE_LIMITED
```

domain state ile tutulabilir.

## 6. Historical Feature Foundation

### 6.1 Feature Creation Order

Historical data hazır olduktan sonra yalnızca deterministic raw features oluştur.

Örneğin:

```text
return1D
return5D
return20D
return60D
return120D
return252D
```

Ancak yeterli historical sample yoksa:

```text
null
```

### 6.2 Moving Averages

Kullanıcının istediği:

```text
SMA9
SMA20
SMA50
```

hesaplanabilir. Ancak minimum sample size:

```text
SMA9 → >=9
SMA20 → >=20
SMA50 → >=50
```

olmalı. Eksik sample:

```text
null
```

### 6.2 RSI

RSI gerçekten historical close data üzerinden hesaplanabiliyorsa ekle.

RSI:

- deterministic
- documented
- tested

Fake RSI YASAK.

### 6.3 MACD

MACD:

12/26/9

veya mevcut project convention ne ise onu kullan. Convention documentation zorunlu.

Historical sample yetersizse: null.

### 6.4 Stochastic RSI

Stochastic RSI ancak RSI foundation güvenilir olduktan sonra oluşturulmalı.

No shortcut. No hardcoded values.

### 6.5 Volume Features

Historical volume üzerinden:

```text
averageVolume20
averageVolume50
relativeVolume
```

hesaplanabilir. Ama sample yoksa: null.

### 6.6 Return Features

Return hesaplamalarında:

```text
future data
```

kullanma. Özellikle backtest compatibility korunmalı.

### 6.7 Look-Ahead Bias

Historical feature:

```text
timestamp T
```

için yalnızca:

```text
T ve öncesindeki data'yı kullanabilir.
```

T+1 bilgisi T feature'ına giremez. Bu kritik.

## 7. Opportunity Engine

Bu sprintte opportunity scoring'i değiştirme.

Yeni features mevcut engine'e hemen weight olarak eklenmemeli.

Önce:

```text
data foundation
+ feature correctness
```

tamamlanmalı.

## 8. Backtest Compatibility

Historical features timestamped olmalı. Gelecekte R2-064/R2-065 backtest'e bağlanabilecek şekilde tasarla.

## 9. Frontend

Frontend'e yalnızca gerçekten hazır data göster.

Örneğin:

```text
Historical:
1Y
252 sessions
Source: Yahoo Finance
```

gibi. Data unavailable ise:

```text
"Historical data unavailable"
```

göster. Fake chart YASAK.

## 10. Chart Data

Chart component:

```text
empty dataset
```

durumunu desteklemeli. No:

```text
flat line
0 line
random candles
fallback.
```

## 11. Tests

Minimum 30 testler:

1. Universe source validation
2. Symbol normalization
3. Instrument type
4. Historical OHLCV valid
5. Historical OHLCV unavailable
6. Invalid OHLC
7. Duplicate candle
8. Future timestamp
9. Missing candle
10. Daily interval
11. 4H availability
12. Weekly availability
13. Monthly availability
14. SMA9
15. SMA20
16. SMA50
17. RSI
18. MACD
19. Stochastic RSI
20. Relative volume
21. 1D return
22. 20D return
23. 60D return
24. 252D return
25. Partial universe
26. Rate limited provider
27. Cache hit
28. Cache miss
29. Look-ahead protection
30. 117/117 macro regression

## 12. Fake Data Audit

Repository-wide search:

```text
historical
candles
ohlcv
sma
rsi
macd
stoch
volume
returns
universe
```

Hardcoded financial values bul.

Her birini:

```text
REAL
TEST
MOCK
CONFIG
FAKE
```

olarak sınıflandır.

Production fake data:

```text
ZERO TOLERANCE.
```

## 13. Documentation

Oluştur:

```text
docs/R2-063_STATUS_REPORT.md
```

ve:

```text
docs/R2-063_REAL_BIST_UNIVERSE_MATRIX.json
```

Matrix:

```text
source
feature
status
coverage
frequency
timestamp
confidence
notes
```

alanlarını içermeli.

## 13. Runtime Verification

Localhost üzerinde:

- universe discovery
- 6 existing test symbols
- historical OHLCV
- daily data
- 4H availability
- weekly
- monthly
- SMA
- RSI
- MACD
- volume

Gerçek runtime sonuçlarını raporla.

## 14. Build

TypeScript typecheck PASS.

NestJS build PASS.

## 15. Regression

117/117 macro tests PASS.

No regression.

## 16. Git

Changes inspect.

No secrets.

No .env commit.

Commit:

```text
R2-063: Build real BIST universe and historical market data foundation
```

origin/main push.

Commit hash report.

## 17. Final Report

Açıkça cevapla:

1. Gerçek BIST universe elde edilebildi mi? Kaç symbol?
2. Source? Coverage?
3. Historical OHLCV çalışıyor mu? Daily? 4H? Weekly? Monthly?
4. SMA9? SMA20? SMA50?
5. RSI? MACD? Stochastic RSI?
6. Relative volume?
7. Look-ahead protection?
8. Cache?
9. Rate limit?
10. Fake data?
11. TypeScript?
12. NestJS?
13. 117/117?
14. Runtime?
15. Git commit?
16. R2-064 recommendation?

## 17. Absolute Rules

- REAL DATA OR EXPLICIT ABSENCE.
- Fake stock universe YASAK.
- Fake OHLCV YASAK.
- Fake candle YASAK.
- Fake indicator YASAK.
- Fake volume YASAK.
- Fake sector YASAK.
- Hardcoded financial values YASAK.
- Second market-data pipeline YASAK.
- Second cache YASAK.
- Look-ahead bias YASAK.
- Future data leakage YASAK.

- TEST SYMBOLS ARE NOT THE BIST UNIVERSE.
- PRODUCTION DATA MUST ALWAYS BE TRACEABLE TO A REAL SOURCE.

## 18. Final Principle

BIST ELITE AI artık:

```text
6 TEST STOCKS
```

seviyesinden:

```text
REAL BIST UNIVERSE
```

seviyesine geçmelidir. Ancak universe gerçekten erişilebilir değilse bunu açıkça:

```text
UNAVAILABLE / PARTIAL
```

olarak raporla. Hiçbir durumda eksik universe'ı elle doldurma.

REAL DATA.

CORRECT SEMANTICS.

NO FABRICATION.
