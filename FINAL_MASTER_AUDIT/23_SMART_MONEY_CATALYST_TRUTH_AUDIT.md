# 23 — SMART MONEY & CATALYST TRUTH AUDIT

## Smart Money (R2-024)

- `smart-money` module present; accumulation/distribution + institutional-flow heuristics over candles/volume; composite signals (R2-038).
- Real code + specs.
- Runtime: empty without candles.

## Catalyst (R2-023)

- `catalyst` module: consumes KAP disclosures (works live) + research evidence (SerpAPI if keyed).
- Catalyst definitions (NEW_CONTRACT, MAJOR_INVESTMENT, EXPORT_AGREEMENT, PRODUCT_LAUNCH, etc.) in `data-research-pipeline`.
- **KAP disclosures were the only real live data in prior validation** → catalyst layer can genuinely produce output once API boots.

## Classification

| Item | Status |
|---|---|
| Smart Money logic | REAL_AND_WORKING (unit) / EMPTY live |
| Catalyst logic | REAL_AND_WORKING |
| Catalyst real input (KAP) | REAL (verified earlier) |
| Catalyst with research (SerpAPI) | NOT_CONFIGURED (no key) |

## Verdict

- Smart Money: built. Catalyst: built + **partially live-capable (KAP)**.