# Build Errors — R2-007A Research Layer Recovery

Registry of every TypeScript build error for the API (`apps/api`, `nest build`)
that the recovery sprint must eliminate, plus the file/module each one requires.

Command run: `pnpm --filter @bist-elite/api build`
Result: **23 errors** (all TS2307 — dangling imports of missing modules), **15 unique missing files**.

## Missing files (unique) and their required exports

| # | Missing file | Location | Required exports |
|---|--------------|----------|------------------|
| 1 | `research-cache.service.ts` | `modules/research/` | `ResearchCacheService` |
| 2 | `research-repository.service.ts` | `modules/research/` | `ResearchRepository` |
| 3 | `verification-repository.service.ts` | `modules/research/` | `VerificationRepository` |
| 4 | `verification-engine.service.ts` | `modules/research/` | `VerificationEngine` |
| 5 | `news-aggregation.service.ts` | `modules/research/` | `NewsAggregationService` |
| 6 | `research-aggregator.service.ts` | `modules/research/` | `ResearchAggregatorService` |
| 7 | `research-score.service.ts` | `modules/research/` | `ResearchScoreService` |
| 8 | `research-verification.service.ts` | `modules/research/` | `ResearchVerificationService` |
| 9 | `catalyst-detection.service.ts` | `modules/research/` | `CatalystDetectionService` |
| 10 | `research-intelligence.service.ts` | `modules/research/` | `ResearchIntelligenceService` |
| 11 | `research.controller.ts` | `modules/research/` | `ResearchController` |
| 12 | `research-intelligence.controller.ts` | `modules/research/` | `ResearchIntelligenceController` |
| 13 | `catalyst-engine.service.ts` | `modules/research/` | `CatalystEngineService` |
| 14 | `catalyst-repository.service.ts` | `modules/research/` | `CatalystRepository` |
| 15 | `verified-evidence.dto.ts` | `modules/research/` | `ResearchEvidenceDto`, `VerifiedEvidenceDto` |

## Errors by importing file

### `src/modules/research/research.module.ts` (12)
- `:4` → `./research-cache.service` (`ResearchCacheService`)
- `:5` → `./research-repository.service` (`ResearchRepository`)
- `:6` → `./verification-repository.service` (`VerificationRepository`)
- `:7` → `./verification-engine.service` (`VerificationEngine`)
- `:11` → `./news-aggregation.service` (`NewsAggregationService`)
- `:12` → `./research-aggregator.service` (`ResearchAggregatorService`)
- `:13` → `./research-score.service` (`ResearchScoreService`)
- `:14` → `./research-verification.service` (`ResearchVerificationService`)
- `:15` → `./catalyst-detection.service` (`CatalystDetectionService`)
- `:16` → `./research-intelligence.service` (`ResearchIntelligenceService`)
- `:17` → `./research.controller` (`ResearchController`)
- `:18` → `./research-intelligence.controller` (`ResearchIntelligenceController`)

### `src/modules/scheduler/jobs/agent-reach-refresh.job.ts` (1)
- line 3 — `../../research/research-repository.service` (`ResearchRepository`)

### `src/modules/scheduler/jobs/catalyst-refresh.job.ts` (5)
- line 3 — `../../research/catalyst-engine.service` (`CatalystEngineService`)
- line 4 — `../../research/catalyst-repository.service` (`CatalystRepository`)
- line 5 — `../../research/verification-engine.service` (`VerificationEngine`)
- line 8 — `../../research/verified-evidence.dto` (`ResearchEvidenceDto`)
- line 9 — `../../research/verified-evidence.dto` (`VerifiedEvidenceDto`)

### `src/modules/scheduler/jobs/company-research.job.ts` (1)
- line 3 — `../../research/research-intelligence.service` (`ResearchIntelligenceService`)

### `src/modules/scheduler/jobs/research-refresh.job.ts` (1)
- line 3 — `../../research/research-intelligence.service` (`ResearchIntelligenceService`)

### `src/modules/scheduler/jobs/verification-refresh.job.ts` (3)
- line 3 — `../../research/verification-engine.service` (`VerificationEngine`)
- line 4 — `../../research/verification-repository.service` (`VerificationRepository`)
- line 7 — `../../research/verified-evidence.dto` (`ResearchEvidenceDto`)

## Restoration constraints
- Reuse existing DTOs, interfaces, types, providers, scheduler wiring, and repository patterns.
- No duplicate DTOs/services, no TODO/MOCK/PLACEHOLDER, no architecture changes.
- Acceptance: `pnpm build` → zero errors.