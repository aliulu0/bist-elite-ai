# Localization Standard

## Rule
**All user-visible text MUST be Turkish.** No English labels, messages, or UI strings are permitted in the user interface.

## Exceptions (Allowed English)
Only globally accepted technical indicator/brand names may remain in English:
- RSI, MACD, EMA, SMA, ATR, ADX, OBV, VWAP, Bollinger Bands, Ichimoku, Fibonacci
- BIST Elite AI (product name)
- AI Asistan, AI Raporlar (feature brands)
- Sharpe, Alpha, Beta (financial metrics)
- Heap, RSS, GC (runtime terms)
- Min/Max (universal abbreviations)
- Date format tokens (YYYY, MM, DD, HH, mm, ss)
- HTTP status codes, API paths, error codes

## Implementation
- Centralize all display strings in type files (e.g., `diagnostics-types.ts`, `audit-types.ts`, `settings-types.ts`, `analysis-store.ts`)
- Use helper functions for dynamic display: `moduleDisplay(module)`, `moduleDisplay()` returns Turkish label or falls back to key
- Never hardcode English labels in components
- Table headers, tab labels, button text, empty states, error messages, tooltips — all Turkish

## Examples
| English | Turkish |
|---------|---------|
| Workflow | İş Akışı |
| Scheduler | Zamanlayıcı |
| Provider | Sağlayıcı |
| Event Bus | Olay Yolu |
| Dead Letter | Ölü Mektup |
| Node Uptime | Node Çalışma Süresi |
| Cache | Önbellek |
| Backtest | Geri Test |
| Smart Money | Akıllı Para |
| Confluence | Uyum |
| Opportunity | Fırsat |
| Retry | Yeniden Deneme |
| Max Drawdown | Maks. Düşüş |
| Profit Factor | Kâr Faktörü |
| Watchlist | İzleme Listesi |
| Pipeline | İş Hattı |
| Agent Reach | Ajan Ulaşım |
| Evidence | Kanıt |
| Source Classification | Kaynak Sınıflandırma |
| Official | Resmi |
| Reliability Score | Güven Puanı |
| PDF Discovery | PDF Keşfi |
| RSS Discovery | RSS Keşfi |
| Press Release | Basın Açıklaması |
| Investor Relations | Yatırımcı İlişkileri |
| Annual Report | Yıllık Rapor |
| Quarterly Report | Çeyrek Rapor |
| Investor Presentation | Yatırımcı Sunumu |
| Sustainability Report | Sürdürülebilirlik Raporu |
| Governance Document | Yönetim Dokümanı |
| ESG Report | ESG Raporu |
| Verification Engine | Doğrulama Motoru |
| Source Priority | Kaynak Önceliği |
| Verification Status | Doğrulama Durumu |
| Source Confidence Score | Kaynak Güven Skoru |
| Evidence Merging | Kanıt Birleştirme |
| Conflict Detection | Çakışma Tespiti |
| Verification Dashboard | Doğrulama Merkezi |
| Verified Sources | Doğrulanmış Kaynaklar |
| Conflicting Information | Çakışan Bilgiler |
| Coverage | Kapsam |
| Verified | Doğrulanmış |
| Likely | Muhtemel |
| Unverified | Doğrulanmamış |
| Conflicting | Çakışan |
| False | Yanlış |

## Testing
- All vitest assertions must match Turkish labels
- `screen.getByText('İş Akışı')` not `screen.getByText('Workflow')`
- Tests verify Turkish rendering; English strings in tests are failures

## Enforcement
- CI runs `pnpm --filter @bist-elite/web test` — any English assertion fails
- Code review checks for hardcoded English in `.tsx` files
- New components must follow this standard from creation