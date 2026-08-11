# Verification Intelligence Layer

## Overview

The Verification Intelligence Layer (R2-006) verifies every important research finding using evidence-based analysis without LLM or hallucinations. It implements source priority ranking, confidence scoring, evidence merging, and conflict detection.

## Architecture

### Components

- **VerificationEngine** (`apps/api/src/modules/research/verification-engine.service.ts`) — Core verification engine that processes research evidence and produces verified results.
- **VerificationRepository** (`apps/api/src/modules/research/verification-repository.service.ts`) — 24h caching layer for verification results.
- **VerificationRefreshJob** (`apps/api/src/modules/scheduler/jobs/verification-refresh.job.ts`) — 12h scheduled job that verifies all active companies.
- **VerifiedEvidenceDto** (`apps/api/src/modules/research/verified-evidence.dto.ts`) — DTOs for verification API responses.

### Verification Flow

1. **Input**: `ResearchEvidenceDto` from AgentReachProvider
2. **Source Priority Ranking**: Each source is ranked by priority (Official Company Website → KAP → Investor Relations → TCMB → MKK → Google Finance → Google Search → Google News → RSS → Other)
3. **Confidence Scoring**: Each evidence receives a 0-100 confidence score based on:
   - Official Source (+25)
   - Authority Score (0-50)
   - Freshness (0-15)
4. **Evidence Merging**: Duplicate evidence is detected and merged by normalized title/URL key
5. **Conflict Detection**: Conflicting information is detected by comparing sentiment of common keywords across sources
6. **Status Assignment**: Each evidence receives a status: Verified, Likely, Unverified, Conflicting, or False
7. **Output**: `VerifiedEvidenceDto` with merged evidence, conflicts, and confidence scores

### Source Priority Ranking

| Rank | Source | Weight |
|------|--------|--------|
| 1 | Official Company Website | 100 |
| 2 | KAP | 95 |
| 3 | Investor Relations | 90 |
| 4 | TCMB | 85 |
| 5 | MKK | 80 |
| 6 | Google Finance | 70 |
| 7 | Google Search | 60 |
| 8 | Google News | 50 |
| 9 | RSS | 40 |
| 10 | Other | 20 |

### Verification Status

| Status | Description |
|--------|-------------|
| Verified | High-priority sources confirm the finding |
| Likely | At least one high-priority source supports the finding |
| Unverified | No sufficient evidence found |
| Conflicting | Sources contradict each other |
| False | Evidence contradicts the finding |

### Confidence Score Calculation

The confidence score (0-100) is calculated based on:

- **Official Source**: +25 points if the source is official or government
- **Authority Score**: 0-50 points based on source classification
- **Freshness**: +15 for <1 day, +10 for <7 days, +5 for <30 days, -10 for >30 days

Grade thresholds:
- A: 90-100
- B: 70-89
- C: 50-69
- D: 30-49
- F: 0-29

### Conflict Detection

Conflicts are detected by:
1. Grouping evidence by topic (normalized title/keywords)
2. Comparing sentiment of items with common keywords
3. Flagging items where positive sentiment contradicts negative sentiment

## API Endpoints

### Get Company Verification

```
GET /research/intelligence/:ticker/verification
```

Returns verification results for a specific company.

### Refresh Verification

```
POST /research/intelligence/verification/refresh
```

Triggers verification for all active companies.

### Get Verification Dashboard

```
GET /research/intelligence/verification/dashboard
```

Returns the verification dashboard with aggregated statistics.

## Scheduling

The `verificationRefresh` job runs every 12 hours and verifies all active companies. It includes retry logic with exponential backoff and automatic disabling after 5 consecutive failures.

## Turkish Localization

All user-visible text in the verification system is in Turkish, following the localization standard in `docs/LOCALIZATION_STANDARD.md`.