# Agent Reach Research Engine

## Overview

The Agent Reach Research Engine (R2-005) collects structured research evidence for BIST-listed companies without AI hallucination or opinion. It uses the SerpAPI integration (R2-004C) to discover and classify sources across multiple categories.

## Architecture

### Components

- **AgentReachProvider** (`apps/api/src/modules/research/providers/agent-reach.provider.ts`) — Core provider extending `BaseResearchProvider`. Uses SerpAPI to discover company sources, PDFs, RSS feeds, press releases, and news.
- **ResearchRepository** (`apps/api/src/modules/research/research-repository.service.ts`) — 24h caching layer for agent reach results. Uses `ResearchCacheService` with TTL-based expiration.
- **AgentReachRefreshJob** (`apps/api/src/modules/scheduler/jobs/agent-reach-refresh.job.ts`) — 24h scheduled job that refreshes company research for all active symbols.
- **ResearchEvidenceDto** (`apps/api/src/modules/research/dto/research-evidence.dto.ts`) — DTOs for agent reach API responses.

### Source Classification

Sources are classified into categories:

| Classification | Description |
|---------------|-------------|
| Official | KAP, government, regulatory filings |
| Government | Government sources (.gov.tr) |
| Company | Company website, IR pages |
| Exchange | Borsa Istanbul, exchange sources |
| News | News outlets, media |
| Research | Analyst reports, research firms |
| Unknown | Unclassified sources |

### Evidence Categories

- **PDFs**: Annual reports, quarterly reports, investor presentations, sustainability reports, governance documents, ESG reports
- **RSS**: Company RSS feeds, sector RSS feeds
- **Press Releases**: Official company press releases
- **News**: News articles about the company

## API Endpoints

### Get Company Agent Reach Research

```
GET /research/intelligence/:ticker/agent-reach
```

Returns structured research evidence for a company including PDFs, RSS feeds, press releases, and news sources.

### Search Agent Reach

```
GET /research/intelligence/search?q=<query>
```

Searches for research evidence by keyword.

### Get Sector Agent Reach Research

```
GET /research/intelligence/sector/:sector
```

Returns agent reach research for all companies in a sector.

## Caching

- Company research: 24h TTL
- Search results: 1h TTL
- Sector results: 12h TTL

## Scheduling

The `agentReachRefresh` job runs every 24 hours and refreshes company research for all active symbols. It includes retry logic with exponential backoff and automatic disabling after 5 consecutive failures.

## Turkish Localization

All user-visible text in the agent reach research system is in Turkish, following the localization standard in `docs/LOCALIZATION_STANDARD.md`.