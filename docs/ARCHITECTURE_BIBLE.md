# ARCHITECTURE BIBLE

# Part I — Foundations

---

# Chapter 1 — Vision

## Purpose

The Architecture Bible defines the technical architecture of the BIST Elite AI platform.

It serves as the primary reference for how the system is organized, how its components interact, and how future development should evolve.

Unlike the Developer Handbook, this document focuses on system structure rather than engineering processes.

---

## Project Vision

BIST Elite AI is a personal AI-powered investment analysis platform designed to help its user analyze Borsa İstanbul companies more efficiently.

The platform combines financial data, AI-assisted analysis, portfolio management, and explainable insights into a single modular application.

The primary objective is to provide reliable analytical support rather than automated investment decisions.

---

## Architectural Goals

The architecture is designed to achieve the following goals:

* Simplicity
* Maintainability
* Modularity
* Performance
* Security
* AI-first development
* Easy future expansion

---

## Guiding Principles

Every architectural decision should support at least one of the following principles:

* Keep components loosely coupled.
* Prefer composition over complexity.
* Minimize unnecessary dependencies.
* Build independent modules.
* Design for maintainability.
* Optimize only when necessary.

---

## Scope

This document describes:

* system architecture,
* software components,
* technology choices,
* integration strategy,
* deployment structure,
* future architectural evolution.

It intentionally excludes coding standards, testing procedures, and development workflows, which are documented separately.

---

## Summary

The Architecture Bible is the technical blueprint of the BIST Elite AI platform.

Its purpose is to ensure that every architectural decision contributes to a clean, scalable, and maintainable system while keeping the project focused on its primary goal: delivering a high-quality AI-assisted investment analysis platform.
# Chapter 2 — Design Principles

## Purpose

This chapter defines the architectural principles that guide the design and evolution of the BIST Elite AI platform.

Every significant technical decision should align with these principles.

---

# Principle 1 — Simplicity First

Prefer the simplest solution that satisfies the current requirement.

Avoid introducing frameworks, services, or abstractions before they provide clear value.

---

# Principle 2 — Modular Architecture

The platform should be organized into independent modules with clearly defined responsibilities.

Examples include:

* AI Engine
* Portfolio Engine
* Market Data
* User Interface
* Authentication
* Settings

Modules should communicate through well-defined interfaces.

---

# Principle 3 — Separation of Concerns

Each layer of the system should have a single primary responsibility.

Examples:

* UI handles presentation.
* Backend handles business logic.
* Database stores data.
* AI Engine generates insights.
* External services provide market and AI data.

---

# Principle 4 — AI as an Assistant

Artificial Intelligence enhances the platform but does not control it.

Business rules, calculations, filtering logic, and portfolio management remain part of the application.

AI supports analysis and explanation rather than replacing deterministic logic.

---

# Principle 5 — Explainability

Users should understand why an analysis or recommendation was produced.

Where practical, AI-generated insights should be accompanied by supporting data or reasoning.

---

# Principle 6 — Maintainability

The architecture should remain easy to understand and modify.

New features should integrate into existing modules without requiring widespread changes.

---

# Principle 7 — Security by Default

Security should be considered during system design.

Sensitive information, API credentials, and financial data should be protected throughout the platform.

---

# Principle 8 — Performance Where It Matters

Optimize the parts of the system that directly affect user experience, such as:

* market data retrieval,
* AI request handling,
* portfolio calculations,
* dashboard responsiveness.

Avoid premature optimization elsewhere.

---

# Principle 9 — Future Growth

Although BIST Elite AI is intended for personal use, the architecture should allow future expansion without major redesign.

Examples include:

* additional AI providers,
* new market data sources,
* extra analysis modules,
* optional multi-user support.

These capabilities should remain optional rather than mandatory.

---

# Architecture Decision Record

**ADR-035**

**Title:** Core Design Principles

**Status:** Accepted

**Decision**

Adopt a modular, maintainable, AI-assisted architecture guided by simplicity, clear responsibilities, and practical scalability.

**Rationale**

These principles support long-term maintainability while avoiding unnecessary architectural complexity for a personal-use platform.

---

# Summary

The architecture of BIST Elite AI should remain simple, modular, secure, and easy to evolve.

Every future architectural decision should be evaluated against the principles defined in this chapter.
# Chapter 3 — High-Level Architecture

## Purpose

This chapter provides a high-level overview of the BIST Elite AI system architecture.

It describes the major layers, core modules, and their interactions without focusing on implementation details.

The objective is to establish a clear architectural blueprint that supports maintainability, modularity, and future growth.

---

# Architectural Overview

BIST Elite AI follows a layered architecture.

Each layer has a clearly defined responsibility and communicates only with adjacent layers whenever possible.

```text
Presentation Layer
        │
        ▼
Application Layer
        │
        ▼
Core Services
        │
        ▼
Infrastructure Layer
```

---

# Presentation Layer

The Presentation Layer is responsible for user interaction.

Responsibilities include:

* Dashboard
* Charts
* Portfolio views
* Stock screening interface
* Settings
* AI insight display

Business logic should not exist in this layer.

---

# Application Layer

The Application Layer coordinates application workflows.

Responsibilities include:

* Request handling
* Feature orchestration
* Validation
* Authorization
* API endpoints

This layer connects the user interface with the underlying business services.

---

# Core Services

Core Services contain the business logic of the platform.

The initial version of BIST Elite AI consists of the following modules:

## Market Data

Responsible for:

* retrieving market information,
* normalizing provider data,
* caching responses,
* exposing clean financial datasets.

---

## AI Analysis

Responsible for:

* generating AI-powered insights,
* summarizing financial information,
* explaining screening results,
* assisting portfolio analysis.

AI does not replace deterministic business logic.

---

## Portfolio

Responsible for:

* portfolio management,
* performance tracking,
* watchlists,
* investment history.

---

## Stock Screening

Responsible for:

* filtering companies,
* applying investment criteria,
* ranking candidates,
* generating opportunity lists.

---

## Notifications

Responsible for:

* price alerts,
* screening alerts,
* portfolio notifications,
* AI event notifications.

---

## Settings

Responsible for:

* user preferences,
* AI provider selection,
* application configuration,
* personalization.

---

# Infrastructure Layer

The Infrastructure Layer provides technical services required by the platform.

Examples include:

* PostgreSQL
* Redis (optional)
* External AI providers
* Financial data providers
* Logging
* File storage

Infrastructure should remain replaceable without affecting business logic.

---

# Module Communication

Modules should communicate through clearly defined interfaces.

Avoid direct dependencies between unrelated modules.

This reduces coupling and simplifies future maintenance.

---

# Future Expansion

Additional modules may be introduced when justified by new requirements.

Examples include:

* Backtesting
* News Analysis
* Risk Analysis
* Strategy Builder

These modules are intentionally excluded from the initial architecture to keep the system focused and maintainable.

---

# Architecture Decision Record

**ADR-036**

**Title:** High-Level System Architecture

**Status:** Accepted

**Decision**

Adopt a layered architecture with six independent core service modules.

**Rationale**

This architecture provides sufficient modularity for future growth while remaining simple enough for efficient personal development.

---

# Summary

The BIST Elite AI architecture is based on clear responsibilities, independent business modules, and replaceable infrastructure.

The design emphasizes simplicity, maintainability, and incremental evolution over unnecessary complexity.
# Chapter 4 — Backend Architecture

## Purpose

This chapter defines the backend architecture of the BIST Elite AI platform.

The backend is responsible for business logic, AI orchestration, portfolio management, market data processing, and communication with external services.

The architecture prioritizes simplicity, modularity, and maintainability.

---

# Architectural Style

The backend follows a simplified Clean Architecture.

```text
API Layer
    │
    ▼
Application Layer
    │
    ▼
Domain Layer
    │
    ▼
Infrastructure Layer
```

Each layer has a clearly defined responsibility.

Dependencies always point inward.

---

# API Layer

The API Layer exposes functionality to the frontend.

Responsibilities include:

* HTTP endpoints
* Request validation
* Authentication
* Authorization
* Response formatting

This layer should not contain business logic.

---

# Application Layer

The Application Layer coordinates use cases.

Responsibilities include:

* orchestrating workflows,
* calling domain services,
* handling application-specific rules,
* coordinating external providers.

Examples:

* Analyze Stock
* Update Portfolio
* Run Screener
* Generate AI Analysis

---

# Domain Layer

The Domain Layer contains the business rules of BIST Elite AI.

Examples include:

* stock screening logic,
* portfolio calculations,
* investment rules,
* scoring models,
* financial metrics.

This layer should remain independent of frameworks, databases, and external APIs.

---

# Infrastructure Layer

The Infrastructure Layer contains technical implementations.

Examples:

* PostgreSQL repositories
* AI providers
* Market data providers
* Redis cache (optional)
* Logging
* File storage

Infrastructure can change without affecting business logic.

---

# Dependency Rule

Higher layers should depend only on abstractions.

Lower layers provide implementations.

This reduces coupling and simplifies future maintenance.

---

# Error Handling

Errors should be:

* logged internally,
* translated into meaningful responses,
* handled consistently,
* free of sensitive implementation details.

---

# Folder Organization

A recommended backend structure:

```text
backend/
├── api/
├── application/
├── domain/
├── infrastructure/
├── shared/
└── tests/
```

Each directory should contain a single architectural responsibility.

---

# Architecture Decision Record

**ADR-037**

**Title:** Backend Architecture

**Status:** Accepted

**Decision**

Adopt a simplified Clean Architecture with four layers:

* API
* Application
* Domain
* Infrastructure

**Rationale**

This structure keeps business logic independent from frameworks and external services while remaining simple enough for a personal AI-powered financial platform.

---

# Summary

The backend architecture separates business logic from technical implementation.

This improves maintainability, testability, and flexibility while avoiding unnecessary complexity.
# Chapter 5 — Frontend Architecture

## Purpose

This chapter defines the frontend architecture of the BIST Elite AI platform.

The frontend is responsible for presenting financial information, AI insights, portfolio management, and screening results through a responsive and maintainable user interface.

The architecture emphasizes feature-based organization, modularity, and scalability.

---

# Architectural Style

The frontend follows a feature-based architecture.

Each feature owns its components, hooks, services, and types.

This keeps related code together and simplifies long-term maintenance.

---

# Core Features

The initial frontend consists of the following features:

* Dashboard
* Screener
* Portfolio
* AI Analysis
* Notifications
* Settings

Additional features should be introduced only when required.

---

# Feature Structure

Each feature should follow a consistent internal structure.

Example:

```text
features/
└── portfolio/
    ├── components/
    ├── hooks/
    ├── services/
    ├── types/
    ├── pages/
    └── index.ts
```

Each feature should remain as independent as possible.

---

# Shared Resources

Reusable functionality should be placed in shared directories.

Examples include:

* common UI components,
* utility functions,
* shared hooks,
* constants,
* theme configuration.

Shared resources should not contain feature-specific logic.

---

# State Management

State should be managed at the lowest practical level.

Recommendations:

* Local component state for UI interactions.
* Shared application state only when multiple features require access.
* Server state should be managed separately from UI state.

Avoid unnecessary global state.

---

# Routing

Application routes should map directly to features.

Examples:

* /dashboard
* /screener
* /portfolio
* /settings

Each feature manages its own internal UI organization.

---

# UI Components

Components should remain:

* small,
* reusable,
* predictable,
* focused on presentation.

Business logic belongs in services or hooks rather than visual components.

---

# Communication with Backend

The frontend communicates exclusively through backend APIs.

It should never access databases or external financial providers directly.

All AI requests should also pass through backend services.

---

# Architecture Decision Record

**ADR-038**

**Title:** Frontend Architecture

**Status:** Accepted

**Decision**

Adopt a feature-based frontend architecture with reusable shared resources and isolated feature modules.

**Rationale**

Feature organization improves maintainability, simplifies AI-assisted development, and supports incremental growth without increasing complexity.

---

# Summary

The frontend architecture organizes functionality around business features rather than technical file types.

This approach keeps related code together, improves developer productivity, and aligns naturally with AI-assisted software development.
# Chapter 6 — AI Engine

## Purpose

The AI Engine provides intelligent analysis and natural language explanations for the BIST Elite AI platform.

It enhances financial analysis but does not replace deterministic business logic or investment rules.

---

# Architectural Role

The AI Engine is a supporting service.

Its responsibilities include:

* explaining screening results,
* summarizing financial information,
* interpreting technical indicators,
* generating portfolio insights,
* answering user questions.

Final business decisions remain under application control.

---

# Internal Components

The AI Engine consists of four internal services.

## AI Provider Manager

Responsible for:

* selecting the active AI provider,
* managing provider configuration,
* handling retries and failover,
* isolating provider-specific implementations.

Supported providers may include:

* OpenAI
* Anthropic
* Google Gemini

The rest of the application should never depend on provider-specific APIs.

---

## Prompt Manager

Responsible for:

* storing system prompts,
* managing reusable prompt templates,
* injecting application context,
* separating system instructions from user input.

Prompt definitions should remain outside business logic whenever practical.

---

## Response Validator

Responsible for:

* validating AI responses,
* checking required fields,
* verifying expected formats,
* rejecting malformed outputs.

No AI response should be trusted automatically.

---

## Insight Generator

Responsible for transforming validated AI responses into user-facing insights.

Examples include:

* stock summaries,
* screening explanations,
* portfolio observations,
* risk commentary,
* educational descriptions.

---

# AI Request Flow

A typical request follows this sequence:

```text
Market Data
      │
      ▼
Business Logic
      │
      ▼
Prompt Manager
      │
      ▼
AI Provider
      │
      ▼
Response Validator
      │
      ▼
Insight Generator
      │
      ▼
Frontend
```

This ensures that business logic always precedes AI analysis.

---

# Error Handling

If the AI provider fails:

* return a meaningful message,
* log the failure,
* avoid exposing internal details,
* keep the application operational.

AI failures should never prevent core platform functionality.

---

# Extensibility

Future enhancements may include:

* multiple providers,
* provider benchmarking,
* prompt versioning,
* structured JSON outputs,
* local LLM support.

These enhancements should integrate without affecting other modules.

---

# Architecture Decision Record

**ADR-039**

**Title:** AI Engine Architecture

**Status:** Accepted

**Decision**

Implement the AI Engine as a supporting analysis layer composed of Provider Management, Prompt Management, Response Validation, and Insight Generation services.

**Rationale**

Separating these responsibilities improves reliability, portability, and maintainability while ensuring that deterministic financial logic remains outside the AI layer.

---

# Summary

The AI Engine enhances user understanding of financial data through secure, validated, and explainable analysis.

It supports the platform but does not replace its core business logic.
# Chapter 7 — Data & Opportunity Pipeline

## Purpose

This chapter describes how market data flows through the BIST Elite AI platform, from external providers to actionable investment opportunities.

The pipeline transforms raw financial data into structured insights that can be explained by the AI Engine and presented to the user.

---

# Pipeline Philosophy

The platform is built around a continuous analysis pipeline rather than a traditional CRUD application.

Each stage performs one responsibility before passing the result to the next stage.

---

# Pipeline Overview

```text
External Providers
        │
        ▼
Data Collection
        │
        ▼
Data Normalization
        │
        ▼
Opportunity Engine
        │
        ▼
AI Engine
        │
        ▼
Portfolio & Dashboard
```

---

# Stage 1 — Data Collection

Responsible for retrieving information from external providers.

Examples:

* Borsa İstanbul market data
* Financial statements
* Company ratios
* Price history
* Trading volume

The collection layer should not contain business logic.

---

# Stage 2 — Data Normalization

Different providers often expose different formats.

Normalization converts all incoming data into a common internal structure.

This ensures that downstream modules remain independent of individual providers.

---

# Stage 3 — Opportunity Engine

This is the core of BIST Elite AI.

Responsibilities include:

* applying screening rules,
* calculating financial metrics,
* computing opportunity scores,
* ranking candidates,
* identifying potential investments.

The Opportunity Engine should remain deterministic and independent of AI providers.

---

# Stage 4 — AI Engine

The AI Engine enhances the pipeline by:

* explaining why companies passed screening,
* summarizing financial strengths,
* highlighting potential risks,
* producing readable investment insights.

AI never replaces deterministic calculations.

---

# Stage 5 — Portfolio & Dashboard

Validated results are presented through:

* screening pages,
* portfolio views,
* dashboards,
* watchlists,
* alerts.

Only processed and verified information reaches the user interface.

---

# Caching

Where appropriate, intermediate results may be cached to improve responsiveness and reduce unnecessary external requests.

Caching should remain transparent to business logic.

---

# Future Expansion

Future pipeline stages may include:

* news analysis,
* sentiment scoring,
* macroeconomic indicators,
* strategy simulation,
* backtesting.

These stages should integrate without disrupting the existing pipeline.

---

# Architecture Decision Record

**ADR-040**

**Title:** Data & Opportunity Pipeline

**Status:** Accepted

**Decision**

Adopt a pipeline architecture that transforms external market data into ranked investment opportunities before AI-assisted interpretation.

**Rationale**

The primary value of BIST Elite AI lies in identifying opportunities through deterministic analysis. AI is used to explain and enrich those results rather than generate them.

---

# Summary

The Data & Opportunity Pipeline is the central workflow of the BIST Elite AI platform.

It converts raw financial information into structured, explainable investment opportunities through a sequence of modular processing stages.
# Chapter 8 — External Integrations

## Purpose

This chapter defines how BIST Elite AI communicates with external services.

All third-party integrations must be isolated behind adapters so that providers can be replaced without affecting the core business logic.

---

# Integration Principles

* The core application must never depend directly on a third-party provider.
* Every external service should have a dedicated adapter.
* Business logic must communicate through internal interfaces.
* Replacing a provider should require changes only inside the Infrastructure layer.

---

# Market Data Providers

The platform may support multiple market data providers.

Examples:

* Finnhub
* Financial Modeling Prep (FMP)
* Alpha Vantage
* Twelve Data
* Borsa İstanbul data sources

Only one provider (or a defined fallback strategy) should be active for a given request.

---

# AI Providers

AI services are interchangeable.

Supported providers may include:

* OpenAI
* Anthropic
* Google Gemini

The AI Provider Manager selects the configured provider and hides provider-specific APIs from the rest of the application.

---

# Provider Adapters

Each external provider should implement a common interface.

Example responsibilities:

* Authentication
* Request formatting
* Response parsing
* Error handling
* Rate-limit handling

This keeps the rest of the application provider-agnostic.

---

# Failure Strategy

External integrations are expected to fail occasionally.

The platform should:

* handle timeouts,
* retry when appropriate,
* log failures,
* return meaningful errors,
* continue operating whenever possible.

Failures in one provider should not crash the entire application.

---

# Configuration

Provider settings should be configurable through environment variables.

Examples:

* API keys
* Base URLs
* Timeouts
* Retry limits

No provider credentials should be hardcoded.

---

# Future Expansion

New providers should be added by implementing the required adapter interface rather than modifying existing business logic.

This keeps integrations modular and minimizes regression risk.

---

# Architecture Decision Record

**ADR-041**

**Title:** External Integration Architecture

**Status:** Accepted

**Decision**

Use an adapter-based integration layer for all third-party services.

**Rationale**

This approach isolates external dependencies, simplifies provider replacement, and protects the core application from API-specific changes.

---

# Summary

External services are replaceable implementation details.

The business logic of BIST Elite AI must remain independent of any specific AI or market data provider.
# Chapter 9 — Operations

## Purpose

This chapter defines how the BIST Elite AI platform is operated after development.

It covers security, deployment, configuration, logging, backups, and monitoring from an operational perspective.

The objective is to keep the platform reliable while remaining simple enough for a personal-use application.

---

# Security

Operational security includes:

* protecting API keys,
* securing database credentials,
* using HTTPS where applicable,
* validating external input,
* restricting access to sensitive functionality.

Security rules are defined in the Developer Handbook and applied during operation.

---

# Deployment

The initial deployment target is a single local or self-hosted environment.

The application should be deployable with minimal manual steps.

A typical deployment includes:

* Frontend
* Backend API
* PostgreSQL database

Additional services should remain optional.

---

# Configuration

Runtime configuration should be provided through environment variables.

Examples:

* database connection,
* AI provider keys,
* market data provider keys,
* logging level,
* application environment.

No sensitive configuration should be hardcoded.

---

# Logging

The platform should log:

* startup events,
* application errors,
* AI provider failures,
* external API failures,
* unexpected exceptions.

Sensitive information must never appear in logs.

---

# Monitoring

Operational monitoring should focus on:

* application availability,
* AI request failures,
* external provider failures,
* database connectivity.

The objective is early detection of issues rather than enterprise-grade observability.

---

# Backup

Regular backups should include:

* PostgreSQL database,
* user configuration,
* important application settings.

Backup procedures should be simple, documented, and periodically verified.

---

# Recovery

The platform should support recovery after:

* database corruption,
* accidental deletion,
* provider outages,
* configuration errors.

Recovery should prioritize restoring normal operation quickly.

---

# Architecture Decision Record

**ADR-042**

**Title:** Operational Architecture

**Status:** Accepted

**Decision**

Adopt a lightweight operational model suitable for a personal AI-powered financial platform.

**Rationale**

Simple operational practices provide sufficient reliability without introducing unnecessary infrastructure complexity.

---

# Summary

Operational excellence is achieved through simple, reliable practices.

Security, deployment, configuration, logging, monitoring, and backups should remain practical and easy to maintain.
# Chapter 10 — Future Evolution

## Purpose

This chapter outlines the planned evolution of the BIST Elite AI platform.

Its purpose is to document potential future capabilities while protecting the simplicity of the initial architecture.

Features should be introduced only when they provide clear value.

---

# MVP Scope

The first version of BIST Elite AI focuses on the essential capabilities.

Included in the MVP:

* Market data integration
* Opportunity Engine
* AI-assisted analysis
* Portfolio management
* Stock screening
* Watchlists
* Notifications
* Dashboard

These features define the minimum complete product.

---

# Version 2 Candidates

Potential future enhancements include:

* Backtesting
* News analysis
* Sentiment analysis
* Strategy templates
* Advanced portfolio analytics
* Multi-provider AI comparison
* Enhanced chart analysis

These features should be implemented only after the MVP is stable.

---

# Optional Features

The following ideas may be valuable in the future but are not required.

Examples:

* Mobile application
* Local LLM support
* Voice interaction
* Broker integrations
* Multi-user support
* Cloud synchronization

They remain optional and should not influence the initial architecture.

---

# Design Philosophy

Future growth should follow three rules:

1. Preserve simplicity.
2. Reuse existing modules whenever possible.
3. Avoid introducing unnecessary complexity.

Every new feature should integrate into the current architecture instead of forcing a redesign.

---

# Technical Evolution

The architecture should support:

* replacing AI providers,
* replacing market data providers,
* adding new analysis modules,
* expanding the Opportunity Engine,
* introducing new UI features.

These changes should require minimal impact on existing modules.

---

# Long-Term Vision

BIST Elite AI should evolve through small, incremental improvements.

The platform should remain understandable by a single developer while being flexible enough to support future ideas.

Architectural stability is more valuable than rapid expansion.

---

# Architecture Decision Record

**ADR-043**

**Title:** Future Evolution Strategy

**Status:** Accepted

**Decision**

Adopt an incremental evolution strategy that prioritizes simplicity, maintainability, and modular expansion over large architectural redesigns.

**Rationale**

A personal platform benefits more from steady improvement than from premature complexity.

---

# Summary

The future of BIST Elite AI is guided by disciplined growth.

The platform should evolve only when new capabilities provide meaningful value without compromising the existing architecture.
# Chapter 11 — Market Data Layer

## Purpose

This chapter defines the unified Market Data Layer architecture.

Every engine in the system consumes market data through one abstraction — the `MarketDataOrchestrator`.

No engine may know which provider supplied the data.

---

# Provider Architecture

The Market Data Layer supports five independent providers:

* Fintables (priority 1)
* Finnhub (priority 2)
* KAP (priority 3)
* MKK (priority 4)
* TCMB (priority 5)

Each provider is an independent adapter implementing `IUnifiedMarketDataProvider`.

Providers are registered in `MarketDataModule` and managed by `MarketDataOrchestrator`.

Each provider supports:

* `connect()` / `disconnect()` lifecycle
* `health()` check
* `fetchCompany()`, `fetchFinancials()`, `fetchBalanceSheet()`, `fetchIncomeStatement()`, `fetchCashFlow()`, `fetchSector()`, `fetchDisclosures()`
* `normalize()` for response normalization

---

# Normalization Flow

Every provider returns different JSON structures.

Adapters normalize all responses into internal domain models:

* `Company`
* `FinancialStatement`
* `UnifiedBalanceSheet`
* `UnifiedIncomeStatement`
* `CashFlow`
* `Sector`
* `Disclosure`
* `MarketDataResult<T>`

No engine should require provider-specific parsing.

---

# Fallback Strategy

When a provider fails or returns null:

1. The orchestrator attempts the next provider by priority.
2. If all providers fail, the orchestrator returns null.
3. Failures are recorded in the circuit breaker.

The fallback loop is: priority-ordered providers, filtered by enabled status and circuit breaker state.

---

# Retry Strategy

Every provider call supports:

* Exponential backoff
* Maximum 3 retries (configurable per provider)
* Jitter to prevent thundering herd
* Configurable timeout (default 15 seconds)

Retry is handled by `BaseProviderAdapter.withRetry()`.

Retry never blocks unrelated providers.

---

# Circuit Breaker

Provider-level circuit breaker with three states:

* `CLOSED` — normal operation
* `OPEN` — provider blocked after 3 consecutive failures
* `HALF_OPEN` — verification request after 5 minutes

If verification succeeds, circuit returns to `CLOSED`.

If verification fails, circuit returns to `OPEN`.

Implemented in `CircuitBreakerService`.

---

# Caching Strategy

The `MarketDataCacheService` wraps the existing `CacheService` with domain-specific TTLs:

| Data Type | TTL |
|---|---|
| Company | 12 hours |
| Financial Statements | 24 hours |
| Balance Sheet | 24 hours |
| Income Statement | 24 hours |
| Cash Flow | 24 hours |
| Sector | 24 hours |
| KAP Disclosures | 15 minutes |

Cache keys follow: `{provider}:{type}:{symbol}`

---

# Provider Priority

Providers are sorted by configurable priority.

Default priority:

* Fintables: 1
* Finnhub: 2
* KAP: 3
* MKK: 4
* TCMB: 5

Priority is configurable through environment variables.

---

# Configuration

Each provider supports:

* `enabled` — toggle provider on/off
* `priority` — selection order
* `timeout` — request timeout in ms
* `retries` — max retry count
* `apiKey` — authentication key
* `baseUrl` — API endpoint

All configuration comes from environment variables:

* `FINTABLES_ENABLED`, `FINTABLES_PRIORITY`, `FINTABLES_API_KEY`, etc.
* `FINNHUB_ENABLED`, `FINNHUB_PRIORITY`, `FINNHUB_API_KEY`, etc.
* `KAP_ENABLED`, `KAP_PRIORITY`, `KAP_API_KEY`, etc.
* `MKK_ENABLED`, `MKK_PRIORITY`, `MKK_API_KEY`, etc.
* `TCMB_ENABLED`, `TCMB_PRIORITY`, `TCMB_API_KEY`, etc.

No secrets are hardcoded.

---

# Health

Each provider exposes `health()`.

The orchestrator automatically ignores unhealthy providers.

Existing `ProviderHealthMonitorEngine` is reused for production health tracking.

---

# Architecture Decision Record

**ADR-044**

**Title:** Unified Market Data Layer

**Status:** Accepted

**Decision**

Implement a unified Market Data Layer with provider adapters, circuit breaker, caching, retry, and fallback managed by a single orchestrator.

**Rationale**

This ensures all engines consume market data through one abstraction, provider switching requires no engine changes, and infrastructure concerns (retry, circuit breaker, caching) are centralized.

---

# Summary

The Market Data Layer provides a single, production-grade abstraction for retrieving market and company data from multiple providers.

It handles provider selection, fallback, retry, circuit breaker, caching, and normalization — keeping business logic clean and provider-agnostic.

---

# Chapter 12 — Data Aggregation & Quality Engine

## Purpose

This chapter defines the Aggregation and Quality Engine — the second layer of the Market Data system.

While Chapter 11 describes how data is fetched from individual providers, this chapter describes how data from multiple providers is **merged**, **validated**, **quality-scored**, and **conflict-resolved** into a single authoritative result.

---

# Aggregation Flow

The `AggregationEngine` sits on top of `MarketDataOrchestrator` and adds multi-provider intelligence:

1. **Parallel Fetch** — Query all available providers simultaneously
2. **Validation** — Each provider response is validated against domain rules
3. **Merge** — Conflicting field values are resolved using a strategy chain
4. **Quality Scoring** — A 0–100 score is computed from provider signals
5. **Caching** — Aggregated results are cached with domain-appropriate TTLs
6. **Metadata** — Full provenance is recorded (providers used, conflicts, warnings)

---

# Quality Scoring

The `QualityScorer` computes a 0–100 quality score from weighted components:

| Component | Weight | Description |
|---|---|---|
| Provider Agreement | 25% | Fields returned vs expected across all providers |
| Field Completeness | 25% | Best provider's completeness ratio |
| Provider Priority | 20% | Inverse of lowest priority among responding providers |
| Provider Health | 15% | Fraction of healthy providers |
| Staleness | 15% | Freshness of responses (decays over 24 hours) |

**Penalties:**
- Each `error`-severity validation warning: -5 points
- Each `warning`-severity validation warning: -2 points
- Each `info`-severity validation warning: -0.5 points
- Each conflict: -2 points (capped at -15)

Final score is clamped to [0, 100].

---

# Conflict Resolution

The `ConflictResolver` resolves field-level disagreements between providers using a priority chain:

1. **Majority Vote** — If more than 50% of providers agree on a value, that value wins
2. **Latest Timestamp** — If no majority, the value with the most recent `lastUpdated` wins
3. **Highest Priority** — If timestamps are tied, the provider with the lowest priority number (highest priority) wins
4. **Average** (numeric only) — If no majority for numeric fields, the arithmetic mean is used (rounded to 2 decimal places)
5. **Deduplication** (list fields) — For array fields like disclosures, items are deduplicated by composite key (e.g., `title:date`) and ordered by provider priority

Conflict records are stored in `AggregationMetadata.conflicts` for auditability.

---

# Validation Rules

The `DataValidator` enforces domain rules per data type:

| Type | Rules |
|---|---|
| Company | symbol required (error), name required (warning), negative marketCap (error), Unknown sector (info), future/invalid lastUpdated (warning/error) |
| Financial Statement | symbol required (error), negative revenue (error), netIncome > 2× revenue (warning) |
| Balance Sheet | symbol required (error), negative totalAssets (error), equity > 2× totalAssets (warning) |
| Income Statement | symbol required (error), negative revenue (error), netProfit > 2× revenue (warning) |
| Cash Flow | symbol required (error) |
| Sector | symbol required (error), sector required (error), Unknown sector (info) |

Deduplication methods:
- `deduplicateDisclosures` — by `title:date` composite key
- `deduplicateFinancialStatements` — by `symbol:period` composite key

---

# Provider Confidence

Each provider receives a confidence score (0–100) based on:

* Base: 50 points
* Healthy: +25 points
* Latency < 1 second: +15 points
* Latency < 5 seconds: +5 points
* Priority ≤ 2: +10 points

Confidence scores are stored in `AggregationMetadata.providerConfidence`.

---

# Metadata Structure

Every aggregated result includes `AggregationMetadata`:

```typescript
interface AggregationMetadata {
  providersQueried: string[];      // All providers attempted
  providersUsed: string[];         // Providers that returned valid data
  providersFailed: string[];       // Providers that returned null or threw
  providerConfidence: Record<string, number>; // Per-provider confidence
  qualityScore: number;            // 0–100 quality score
  lastUpdated: string;             // ISO timestamp
  cacheStatus: 'hit' | 'miss';    // Cache hit/miss
  aggregationDurationMs: number;   // Total time
  validationWarnings: ValidationWarning[];
  conflictCount: number;
  conflicts: ConflictRecord[];
}
```

---

# Caching

Aggregated results are cached with domain TTLs:

| Data Type | TTL |
|---|---|
| Company | 12 hours |
| Financial Statements | 24 hours |
| Balance Sheet | 24 hours |
| Income Statement | 24 hours |
| Cash Flow | 24 hours |
| Sector | 24 hours |
| Disclosures | 15 minutes |

Cache keys: `aggregated:{type}:{symbol}`

---

# Module Structure

```
aggregation/
├── aggregation.types.ts          # ProviderContribution, ConflictRecord, AggregatedResult, etc.
├── quality-scorer.service.ts     # Quality score calculation
├── conflict-resolver.service.ts  # Conflict resolution strategies
├── data-validator.service.ts     # Domain validation rules
├── aggregation-engine.service.ts # Main orchestrator for aggregation
├── aggregation.module.ts         # NestJS module wiring
└── index.ts                      # Public API exports
```

---

# Architecture Decision Record

**ADR-045**

**Title:** Data Aggregation & Quality Engine

**Status:** Accepted

**Decision**

Implement a dedicated aggregation layer on top of the Market Data Orchestrator that merges, validates, quality-scores, and conflict-resolves multi-provider data.

**Rationale**

Real-world market data is inconsistent across providers. Aggregating from multiple sources increases accuracy, while quality scoring gives downstream consumers confidence in the data. Conflict resolution and validation ensure only trustworthy data reaches engines.

---

# Summary

The Aggregation and Quality Engine transforms raw multi-provider data into a single, validated, quality-scored result with full provenance metadata.

It handles parallel fetching, merge conflicts, field validation, quality scoring, and caching — ensuring downstream engines always work with the best available data.

---

# Chapter 13 — AI Analysis Pipeline

## Overview

The AI Analysis Pipeline is a modular, explainable scoring system that receives aggregated market data (`PipelineInput`) and produces a comprehensive `AnalysisResult` with an Overall Score, Confidence, Signal, Recommendation, Strengths, Weaknesses, Risks, Warnings, and Explanation.

Unlike the existing OHLCV-based `analysis-pipeline` module (Chapter 10), the AI Analysis Pipeline operates on aggregated multi-provider data and produces a different result type optimized for explainable AI-assisted analysis.

---

## Architecture

```
PipelineInput ──► AiAnalysisPipeline
                    ├── Parallel Module Execution (Promise.allSettled)
                    │   ├── TechnicalAnalysisHandler
                    │   ├── FundamentalAnalysisHandler
                    │   ├── FinancialHealthHandler
                    │   ├── GrowthAnalysisHandler
                    │   ├── MomentumAnalysisHandler
                    │   ├── RiskAnalysisHandler
                    │   ├── LiquidityAnalysisHandler
                    │   ├── VolatilityAnalysisHandler
                    │   ├── TrendAnalysisHandler
                    │   └── ValuationAnalysisHandler
                    │
                    ├── ScoreAggregator      ──► overallScore
                    ├── ConfidenceCalculator ──► confidenceScore
                    ├── SignalGenerator      ──► signal / recommendation
                    └── ExplanationBuilder   ──► strengths, weaknesses, risks, warnings, explanation
                    │
                    └── AnalysisResult
```

---

## Module System

### IAnalysisModule Interface

Every analysis module implements the common `IAnalysisModule` interface:

| Property     | Type            | Description                     |
|-------------|----------------|---------------------------------|
| `name`      | `string`       | Module identifier               |
| `weight`    | `number`       | Weight in score aggregation     |
| `enabled`   | `boolean`      | Whether module is active        |
| `analyze()` | `Promise<ModuleResult>` | Core analysis logic     |

### Module Weights

| Module           | Weight | Category        |
|-----------------|--------|-----------------|
| Technical        | 12     | Market/Price    |
| Fundamental      | 12     | Financial       |
| Financial Health | 10     | Financial       |
| Growth           | 10     | Financial       |
| Momentum         | 10     | Performance     |
| Risk             | 10     | Risk            |
| Liquidity        | 8      | Risk            |
| Volatility       | 8      | Risk            |
| Trend            | 10     | Market/Price    |
| Valuation        | 10     | Financial       |

---

## Score Formula

### Weighted Overall Score

```
overallScore = Σ(moduleScore[i] × weight[i]) / Σ(weight[i])
```

Where `i` iterates over all enabled modules that returned valid results.

### Confidence Score

```
confidenceScore =
  aggregationQuality × 0.25 +
  providerAgreement × 0.20 +
  dataFreshness × 0.15 +
  moduleConfidenceAverage × 0.25 -
  missingDataPenalty × 0.10 -
  validationWarningPenalty × 0.05
```

Factors:
- **aggregationQuality**: From `AggregationMetadata.qualityScore` (0–100)
- **providerAgreement**: `providersUsed.length / providersQueried.length × 100`
- **dataFreshness**: Score based on max age of data sources (< 1 day = 100, < 7 days = 80, < 30 days = 60, < 90 days = 40, else 20)
- **moduleConfidenceAverage**: Average of all module confidence scores
- **missingDataPenalty**: Penalty for missing income statement, balance sheet, or cash flow
- **validationWarningPenalty**: 10 points per validation warning (max 100)

---

## Signal Thresholds

| Signal      | Score Range |
|-------------|-------------|
| STRONG_BUY  | ≥ 80        |
| BUY         | ≥ 65        |
| ACCUMULATE  | ≥ 55        |
| NEUTRAL     | ≥ 45        |
| REDUCE      | ≥ 35        |
| SELL        | ≥ 20        |
| STRONG_SELL | < 20        |

---

## Parallel Execution & Failure Handling

Modules execute concurrently via `Promise.allSettled`. Individual module failures produce a zero-score `ModuleResult` with a warning — the pipeline continues with remaining modules. The overall score degrades gracefully rather than failing entirely.

---

## Explainability

The `ExplanationBuilder` collects:
- **Strengths**: Unique positive observations from all modules (max 10)
- **Weaknesses**: Unique negative observations (max 10)
- **Risks**: Unique risk factors (max 10)
- **Warnings**: Unique data quality warnings (max 10)
- **Explanation**: Natural language summary combining score description, top strengths, weaknesses, and risks
- **Supporting Metrics**: Named metrics with values, descriptions, and source modules

---

## File Structure

```
ai-analysis/
├── ai-analysis.types.ts              # AnalysisSignal, PipelineInput, ModuleResult, AnalysisResult
├── ai-analysis.config.ts             # ModuleWeightConfig, SignalThresholdConfig, defaults
├── ai-analysis-pipeline.service.ts   # Main orchestrator
├── ai-analysis.module.ts             # NestJS module wiring
├── index.ts                          # Public exports
├── interfaces/
│   └── analysis-module.interface.ts  # IAnalysisModule interface
├── modules/
│   ├── technical-analysis.handler.ts
│   ├── fundamental-analysis.handler.ts
│   ├── financial-health.handler.ts
│   ├── growth-analysis.handler.ts
│   ├── momentum-analysis.handler.ts
│   ├── risk-analysis.handler.ts
│   ├── liquidity-analysis.handler.ts
│   ├── volatility-analysis.handler.ts
│   ├── trend-analysis.handler.ts
│   └── valuation-analysis.handler.ts
├── score-aggregator.service.ts       # Weighted score calculation
├── confidence-calculator.service.ts  # Separate confidence calculation
├── signal-generator.service.ts       # Rule-based signal generation
└── explanation-builder.service.ts    # Explainable recommendations
```

---

# Architecture Decision Record

**ADR-046**

**Title:** AI Analysis Pipeline — Modular Scoring Architecture

**Status:** Accepted

**Decision**

Implement a modular, parallel-analysis pipeline that receives aggregated market data and produces explainable scores, signals, and recommendations using 10 independent analysis modules.

**Rationale**

A modular architecture provides:
1. **Isolation**: Each analysis dimension is independent; failures don't cascade
2. **Extensibility**: New modules can be added without modifying existing ones
3. **Explainability**: Each module produces its own strengths/weaknesses/risks, enabling transparent recommendations
4. **Parallelism**: `Promise.allSettled` enables concurrent execution with graceful degradation
5. **Configurability**: Weights, thresholds, and module enable/disable are all configurable

---

# Summary

The AI Analysis Pipeline transforms aggregated multi-provider market data into a comprehensive, explainable analysis result. Ten independent modules evaluate technical, fundamental, financial health, growth, momentum, risk, liquidity, volatility, trend, and valuation dimensions in parallel. Results are aggregated using configurable weights, and the pipeline produces a signal, recommendation, confidence score, and detailed explanation with supporting metrics.

---

# Chapter 14 — Opportunity Detection Engine

## Overview

The Opportunity Detection Engine is the core intelligence of BIST Elite AI. It receives `AnalysisResult` from the AI Analysis Pipeline and produces an `OpportunityResult` that determines whether a stock is becoming interesting *before* the opportunity becomes obvious.

Its responsibility is NOT to analyse a stock — the AI Analysis Pipeline already does that. Its responsibility is to detect *early opportunities* using 20 independent detection modules, score them, prioritise them, track their lifecycle, and provide explainable recommendations.

---

## Architecture

```
AnalysisResult ──► OpportunityDetectionEngine
                     ├── 20 Detection Modules (sequential execution)
                     │   ├── PriceStructure
                     │   ├── VolumeBehaviour
                     │   ├── MomentumShift
                     │   ├── TrendTransition
                     │   ├── MovingAverageStructure
                     │   ├── RSIBehaviour
                     │   ├── MACDBehaviour
                     │   ├── ATRExpansion
                     │   ├── VolatilityCompression
                     │   ├── LiquidityImprovement
                     │   ├── RelativeStrength
                     │   ├── SectorStrength
                     │   ├── FundamentalChange
                     │   ├── ValuationDiscount
                     │   ├── FinancialQuality
                     │   ├── CashFlowImprovement
                     │   ├── DebtImprovement
                     │   ├── GrowthAcceleration
                     │   ├── InstitutionalInterest
                     │   └── CompositeOpportunity
                     │
                     ├── ScoreCalculator        ──► opportunityScore
                     ├── PenaltyEngine          ──► penalties
                     ├── ConfirmationEngine     ──► confirmationLevel
                     ├── PriorityEngine         ──► priority
                     ├── AgeTracker             ──► age
                     ├── DuplicateDetector      ──► duplicateCount
                     ├── ExplanationEngine      ──► reasons, strengths, weaknesses
                     └── MetricsCollector       ──► observability metrics
                     │
                     └── OpportunityResult
```

---

## Scoring

### Opportunity Score (0–100)

The Opportunity Score measures *future potential*, NOT current quality. It is deliberately distinct from the Analysis Score.

```
opportunityScore = Σ(moduleScore[i] × weight[i]) / Σ(weight[i]) - penalties + confirmationBonus
```

### Module Weights

| Module                     | Weight | Category     |
|---------------------------|--------|-------------|
| CompositeOpportunity      | 10     | Composite   |
| MomentumShift             | 7      | Technical   |
| FundamentalChange         | 7      | Fundamental |
| PriceStructure            | 6      | Technical   |
| VolumeBehaviour           | 6      | Volume      |
| TrendTransition           | 6      | Trend       |
| ValuationDiscount         | 6      | Valuation   |
| MovingAverageStructure    | 5      | Technical   |
| RSIBehaviour              | 5      | Technical   |
| MACDBehaviour             | 5      | Technical   |
| VolatilityCompression     | 5      | Volatility  |
| LiquidityImprovement      | 5      | Liquidity   |
| RelativeStrength          | 5      | Relative    |
| FinancialQuality          | 5      | Financial   |
| CashFlowImprovement       | 5      | Financial   |
| GrowthAcceleration        | 5      | Growth      |
| SectorStrength            | 4      | Sector      |
| ATRExpansion              | 4      | Volatility  |
| DebtImprovement           | 4      | Financial   |
| InstitutionalInterest     | 4      | Institutional |

---

## Opportunity Levels

| Level          | Score Range |
|---------------|-------------|
| SUPPORT       | 0–14        |
| NONE          | 15–29       |
| WATCH         | 30–44       |
| INTERESTING   | 45–59       |
| EMERGING      | 60–71       |
| STRONG        | 72–81       |
| VERY_STRONG   | 82–89       |
| EXCEPTIONAL   | ≥ 90        |

---

## Opportunity Types

| Type                        | Trigger                                      |
|---------------------------|----------------------------------------------|
| MOMENTUM_BREAKOUT          | Momentum module > 65                         |
| VOLUME_EXPANSION           | Volume module > 65                           |
| TREND_REVERSAL             | Trend module > 65                            |
| FUNDAMENTAL_IMPROVEMENT    | Fundamental module > 65                      |
| UNDERVALUATION             | Valuation module > 65                        |
| SECTOR_ROTATION            | Sector module > 65                           |
| INSTITUTIONAL_ACCUMULATION | Institutional module > 65                    |
| EARNINGS_OPPORTUNITY       | Signal is BUY or STRONG_BUY                  |
| MULTI_FACTOR               | ≥ 3 factors aligned                          |
| CUSTOM                     | Default fallback                             |

---

## Priority Engine

Priority depends on composite score from opportunity score, confidence, risk, freshness, and age factor.

| Priority  | Composite Range |
|-----------|----------------|
| CRITICAL  | ≥ 85           |
| HIGH      | ≥ 70           |
| MEDIUM    | ≥ 50           |
| LOW       | ≥ 30           |
| IGNORE    | < 30           |

### Composite Formula

```
composite =
  opportunityScore × 0.40 +
  confidence × 0.20 +
  (100 - risk) × 0.15 +
  freshness × 0.15 +
  ageFactor × 0.10
```

---

## Penalty System

| Penalty Type                | Amount | Trigger                                     |
|---------------------------|--------|--------------------------------------------|
| LOW_AGGREGATION_QUALITY    | 8      | Aggregation quality < 50%                   |
| LOW_PROVIDER_CONFIDENCE    | 10     | Provider confidence < 50%                   |
| MISSING_FUNDAMENTALS       | 12     | No fundamental data available               |
| CONTRADICTING_INDICATORS   | 15     | Both positive and negative signals present  |
| WEAK_CONFIRMATIONS         | 5      | Fewer than 2 confirming modules             |
| HIGH_VOLATILITY            | 6      | Average volatility score > 75               |

---

## Confirmation Engine

Modules with score ≥ 60 and confidence > 50 are counted as confirmations.

| Level   | Min Confirmations |
|---------|-------------------|
| NONE    | 0                 |
| SINGLE  | 2                 |
| DOUBLE  | 4                 |
| TRIPLE  | 5                 |
| MULTI   | 6+                |

Confirmation score is added to the opportunity score with a 20% factor.

---

## Opportunity Lifecycle (Age)

| Age Status | Duration / Condition |
|-----------|---------------------|
| NEW       | < 24 hours           |
| GROWING   | Score increasing     |
| STABLE    | < 7 days             |
| WEAKENING | Score decreasing     |
| EXPIRED   | > 30 days since last update |

---

## Duplicate Prevention

The `DuplicateDetector` compares the current score against recent history entries within a 1-hour time window. Scores within 10 points of an existing entry are flagged as duplicates. History is capped at 50 entries per symbol.

---

## False Positive Reduction

Penalties reduce the opportunity score when conditions are unfavourable:
- Low aggregation quality or provider confidence
- Missing fundamental data
- Contradicting positive/negative indicators
- Weak confirmation count
- High volatility

---

## File Structure

```
opportunity-detection/
├── opportunity-detection.types.ts              # All type definitions
├── opportunity-detection.config.ts             # All configurable settings
├── opportunity-detection-engine.service.ts     # Main orchestrator
├── opportunity-detection.module.ts             # NestJS module wiring
├── index.ts                                    # Public exports
├── interfaces/
│   └── detection-module.interface.ts           # IDetectionModule interface
├── modules/
│   ├── price-structure.detector.ts
│   ├── volume-behaviour.detector.ts
│   ├── momentum-shift.detector.ts
│   ├── trend-transition.detector.ts
│   ├── moving-average-structure.detector.ts
│   ├── rsi-behaviour.detector.ts
│   ├── macd-behaviour.detector.ts
│   ├── atr-expansion.detector.ts
│   ├── volatility-compression.detector.ts
│   ├── liquidity-improvement.detector.ts
│   ├── relative-strength.detector.ts
│   ├── sector-strength.detector.ts
│   ├── fundamental-change.detector.ts
│   ├── valuation-discount.detector.ts
│   ├── financial-quality.detector.ts
│   ├── cash-flow-improvement.detector.ts
│   ├── debt-improvement.detector.ts
│   ├── growth-acceleration.detector.ts
│   ├── institutional-interest.detector.ts
│   └── composite-opportunity.detector.ts
└── services/
    ├── score-calculator.service.ts
    ├── priority-engine.service.ts
    ├── age-tracker.service.ts
    ├── duplicate-detector.service.ts
    ├── confirmation-engine.service.ts
    ├── penalty-engine.service.ts
    ├── explanation-engine.service.ts
    └── metrics-collector.service.ts
```

---

# Architecture Decision Record

**ADR-047**

**Title:** Opportunity Detection Engine — Early Detection Architecture

**Status:** Accepted

**Decision**

Implement a dedicated Opportunity Detection Engine that receives `AnalysisResult` from the AI Analysis Pipeline and produces explainable `OpportunityResult` using 20 independent detection modules with penalty-based false positive reduction, confirmation counting, priority grading, and lifecycle tracking.

**Rationale**

1. **Separation of concerns**: Analysis evaluates current quality; detection evaluates future potential — they are fundamentally different operations
2. **Early detection**: 20 modules specifically target pre-breakout conditions (volatility compression, momentum shifts, volume expansion) rather than current state
3. **Explainability**: Every detection produces reasons, strengths, weaknesses, and penalties — no unexplained scores
4. **False positive reduction**: Penalty engine systematically reduces scores for low-quality data, contradicting indicators, and weak confirmations
5. **Lifecycle management**: Age tracking and duplicate prevention avoid stale or repeated alerts
6. **Priority grading**: Multi-factor priority (score, confidence, risk, freshness, age) ensures the most actionable opportunities surface first

---

# Summary

The Opportunity Detection Engine transforms AI Analysis Results into actionable opportunity assessments. Twenty independent detection modules evaluate technical, fundamental, volume, trend, volatility, liquidity, sector, valuation, financial quality, growth, and institutional dimensions. Results are penalty-adjusted, confirmation-validated, priority-graded, and lifecycle-tracked, producing explainable recommendations ready for the Scanner Engine (F13-005).

---

# Chapter 15 — Smart Scanner Engine

## Overview

The Scanner Engine is the final intelligence layer before the Ranking Engine (F14-001). It receives `OpportunityResult` from the Opportunity Detection Engine and produces the final candidate list that determines which opportunities deserve attention.

The Scanner Engine is responsible for: filtering, ranking, sorting, grouping, categorizing, duplicate handling, history tracking, watchlist management, and observability metrics.

---

## Architecture

```
OpportunityResult[]
      │
      ▼
ScannerEngine (orchestrator)
      │
      ├── DuplicateMerger     ──► deduplicated results + history
      ├── FilterEngine        ──► filter by score/confidence/risk/type/etc.
      ├── Ranker              ──► composite scanner score (0–100)
      ├── SortEngine          ──► configurable sort modes
      ├── Categorizer         ──► category assignment
      ├── Grouper             ──► group by sector/type/risk/priority/etc.
      ├── HistoryTracker      ──► first seen, last seen, score deltas
      ├── WatchlistManager    ──► 10+ named watchlists with filters
      └── ScannerMetricsCollector ──► observability
      │
      ▼
ScannerResult[] + Groups + Metrics
```

---

## Scanner Score

The Scanner Score (0–100) is independent from the Opportunity Score. It answers: "Should this stock appear in the final list?"

### Formula

```
scannerScore =
  opportunityScore × 0.25 +
  confidence × 0.15 +
  (100 - risk) × 0.10 +
  freshness × 0.08 +
  ageFactor × 0.05 +
  providerConfidence × 0.07 +
  aggregationQuality × 0.05 +
  aiAnalysisScore × 0.08 +
  financialQuality × 0.04 +
  trendStrength × 0.04 +
  momentum × 0.04 +
  liquidity × 0.02 +
  sectorStrength × 0.02 +
  valuation × 0.01 -
  penaltyScore × 0.01 -
  duplicatePenalty × 0.02
```

### Weight Rationale

| Component | Weight | Purpose |
|-----------|--------|---------|
| Opportunity Score | 0.25 | Core opportunity signal |
| Confidence | 0.15 | Data reliability |
| Risk (inverted) | 0.10 | Risk aversion |
| Freshness | 0.08 | Recent data preferred |
| AI Analysis Score | 0.08 | Current quality assessment |
| Provider Confidence | 0.07 | Provider reliability |
| Aggregation Quality | 0.05 | Data quality signal |
| Age Factor | 0.05 | Lifecycle position |
| Financial Quality | 0.04 | Fundamental health |
| Trend Strength | 0.04 | Trend alignment |
| Momentum | 0.04 | Price momentum |
| Liquidity | 0.02 | Tradeability |
| Sector Strength | 0.02 | Sector tailwind |
| Valuation | 0.01 | Valuation support |
| Penalties | -0.01 | False positive reduction |
| Duplicate Penalty | -0.02 | Repeated signal reduction |

---

## Filtering

The FilterEngine evaluates every opportunity against configurable thresholds. Opportunities that fail any filter are rejected with a specific rejection reason.

### Default Filters

| Filter | Default Value |
|--------|--------------|
| Min Opportunity Score | 30 |
| Max Opportunity Score | 100 |
| Min Confidence | 40 |
| Max Risk | 80 |
| Allowed Opportunity Types | (empty = all) |
| Allowed Sectors | (empty = all) |
| Min Liquidity | 0 |
| Min Market Cap | 0 |
| Max Volatility | 100 |
| Min Quality Score | 0 |
| Min Aggregation Confidence | 0 |
| Min Confirmation Count | 0 |
| Allowed Priority Levels | CRITICAL, HIGH, MEDIUM, LOW |
| Allowed Age Statuses | NEW, GROWING, STABLE |
| Allowed Confirmation Levels | NONE, SINGLE, DOUBLE, TRIPLE, MULTI |

---

## Sorting

| Sort Mode | Description |
|-----------|-------------|
| SCORE_DESC | Highest scanner score first |
| CONFIDENCE_DESC | Highest confidence first |
| RISK_ASC | Lowest risk first |
| NEWEST | Most recent timestamp first |
| SECTOR | By sector name alphabetically, then score |
| ALPHABETICAL | By symbol A→Z |
| CUSTOM | Default fallback |

---

## Categories

Categories are assigned by the Categorizer based on score, opportunity types, age, priority, and risk profile.

| Category | Primary Trigger |
|----------|----------------|
| HOT | Priority CRITICAL + Score ≥ 85 |
| MOMENTUM | MOMENTUM_BREAKOUT type + Score ≥ 65 |
| RECOVERY | TREND_REVERSAL type + Score ≥ 55 |
| UNDERVALUED | UNDERVALUATION type + Score ≥ 50 |
| GROWTH | FUNDAMENTAL_IMPROVEMENT type + Score ≥ 60 |
| TRENDING | INSTITUTIONAL_ACCUMULATION type + Score ≥ 75 |
| EMERGING | Age NEW + Score ≥ 60 |
| DEFENSIVE | Low risk + ≤ 1 weakness + Score ≥ 35 |
| INCOME | Score ≥ 45 + ≤ 2 risks |
| SPECULATIVE | Score ≥ 40 (fallback) |
| CUSTOM | Default fallback |

---

## Grouping

The Grouper supports 8 grouping strategies:

| GroupBy | Groups |
|---------|--------|
| SECTOR | By sector metric value |
| INDUSTRY | By industry metric value |
| OPPORTUNITY_TYPE | By primary opportunity type |
| RISK | LOW_RISK (< 25), MEDIUM_RISK (25–49), HIGH_RISK (50–74), VERY_HIGH_RISK (≥ 75) |
| PRIORITY | By priority level |
| AGE | By age status |
| SIGNAL_STRENGTH | STRONG (≥ 80), MODERATE (60–79), WEAK (< 60) |
| CATEGORY | By assigned category |
| NONE | All results in a single group |

Groups are sorted internally by scanner score descending. Maximum group size is configurable (default: 50).

---

## Watchlists

The WatchlistManager supports 10+ named watchlists:

| Watchlist | Filters |
|-----------|---------|
| ALL | (no filters) |
| TOP_OPPORTUNITIES | Score ≥ 70, Priority HIGH/CRITICAL |
| BREAKOUT_WATCH | MOMENTUM_BREAKOUT or VOLUME_EXPANSION types |
| UNDERVALUED | UNDERVALUATION type |
| MOMENTUM | MOMENTUM_BREAKOUT type |
| TREND_REVERSAL | TREND_REVERSAL type |
| GROWTH | FUNDAMENTAL_IMPROVEMENT type |
| INSTITUTIONAL_INTEREST | INSTITUTIONAL_ACCUMULATION type |
| LOW_RISK | Risk ≤ 30, Confidence ≥ 60 |
| HIGH_CONFIDENCE | Confidence ≥ 75 |

Custom watchlists can be added via `addCustomWatchlist()`.

---

## Duplicate Handling

The DuplicateMerger merges duplicate opportunities using three strategies:

| Strategy | Behavior |
|----------|----------|
| HIGHEST | Keep the opportunity with the highest score |
| AVERAGE | Average scores and confidence |
| MOST_RECENT | Keep the most recent opportunity |

History is maintained per symbol with a configurable maximum (default: 50 entries).

---

## History Tracking

The HistoryTracker maintains per-symbol scan history:

| Field | Description |
|-------|-------------|
| First Seen | Timestamp of first scan |
| Last Seen | Timestamp of most recent scan |
| Score Delta | Change from previous scan |
| Priority Delta | Priority change |
| Category Delta | Category change |
| Status | NEW, ACTIVE, DECLINING, EXPIRED, REMOVED |

---

## Scan Modes

| Mode | Description |
|------|-------------|
| FULL | Complete scan of all opportunities |
| INCREMENTAL | Scan only changed opportunities |
| SECTOR | Filter by sector-specific types |
| SINGLE | Scan a single stock |
| WATCHLIST | Scan filtered by watchlist criteria |

---

## Performance

Target performance:

| Metric | Target |
|--------|--------|
| Full scan (28 stocks) | < 2 seconds |
| Incremental scan | < 500 ms |
| Single stock scan | < 50 ms |
| Filter evaluation | < 1 ms per stock |
| Sorting | < 10 ms per 100 stocks |

---

## File Structure

```
scanner/
├── scanner.types.ts                    # All type definitions
├── scanner.config.ts                   # All configurable settings
├── scanner-engine.service.ts           # Main orchestrator
├── scanner.module.ts                   # NestJS module wiring
├── index.ts                            # Public exports
├── interfaces/
│   └── scanner-module.interface.ts     # ISorter, ICategorizer, IGrouper
├── services/
│   ├── filter-engine.service.ts        # Configurable filtering
│   ├── ranker.service.ts               # Composite ranking formula
│   ├── sort-engine.service.ts          # Multiple sort modes
│   ├── categorizer.service.ts          # Category assignment
│   ├── grouper.service.ts              # Grouping strategy
│   ├── duplicate-merger.service.ts     # Duplicate detection + merge
│   ├── history-tracker.service.ts      # Scan history tracking
│   ├── watchlist-manager.service.ts    # Watchlist management
│   └── scanner-metrics-collector.service.ts  # Observability
└── __tests__/
    ├── test-helpers.ts                 # Shared builders
    ├── services.spec.ts                # Service-level tests
    └── scanner-engine.spec.ts          # Engine integration tests
```

---

# Architecture Decision Record

**ADR-048**

**Title:** Smart Scanner Engine — Candidate Selection Architecture

**Status:** Accepted

**Decision**

Implement a dedicated Scanner Engine that receives `OpportunityResult` from the Opportunity Detection Engine and produces filtered, ranked, sorted, categorized, and grouped `ScannerResult` candidates with watchlist support, history tracking, and observability metrics.

**Rationale**

1. **Separation of concerns**: Detection finds opportunities; the Scanner decides which deserve attention — they serve different purposes
2. **Configurable filtering**: 15 configurable filter dimensions allow precise control over what passes through
3. **Multi-factor ranking**: The Scanner Score combines opportunity score, confidence, risk, freshness, age, provider confidence, aggregation quality, and analysis quality into a single actionable metric
4. **Categorization**: Automatic category assignment enables downstream systems to present opportunities by theme
5. **Grouping**: Multiple grouping strategies enable flexible dashboard organization
6. **Watchlists**: Named watchlists with independent filters support different user strategies
7. **History tracking**: Score deltas, priority changes, and lifecycle status enable trend analysis
8. **Duplicate handling**: Three merge strategies prevent repeated alerts while preserving the best signal

---

# Summary

The Scanner Engine transforms opportunity detection results into actionable candidate lists. It filters by 15 configurable dimensions, ranks using a 16-factor composite score, sorts by 7 modes, categorizes into 11 categories, groups by 8 strategies, manages 10+ named watchlists, tracks history per symbol, merges duplicates, and collects observability metrics — producing the final candidate list ready for the Ranking Engine (F14-001).

---

# Chapter 16 — Intelligent Ranking Engine

## Overview

The Ranking Engine is the final intelligence layer before the Alert Engine (F14-002). It receives `ScannerResult[]` from the Scanner Engine and produces `RankedOpportunity[]` — the definitive ranked investment candidates.

The Ranking Engine decides: "What should the user look at first?"

It is responsible for: scoring, normalizing, grading, recommending, stabilizing, comparing, and explaining every investment candidate.

---

## Architecture

```
ScannerResult[]
      │
      ▼
RankingEngine (orchestrator)
      │
      ├── RankingCalculator   ──► 18 ranking factors
      ├── Normalizer          ──► percentile/z-score/min-max normalization
      ├── GradeAssigner       ──► investment grade (AAA → REJECT)
      ├── RecommendationEngine──► recommendation (STRONG_BUY → AVOID)
      ├── TieBreaker          ──► deterministic tie resolution
      ├── RankingStabilizer   ──► hysteresis-based stability
      ├── RankingHistory      ──► rank history tracking
      ├── RankingComparator   ──► comparison views
      └── RankingMetricsCollector ──► observability
      │
      ▼
RankedOpportunity[]
```

---

## Ranking Score

The Ranking Score (0–100) is independent from the Scanner Score. It answers: "How attractive is this investment overall?"

### Formula

```
rankingScore = Σ(factor[i].normalizedValue × factor[i].weight)
```

### Factor Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Opportunity Score | 0.18 | Core opportunity signal |
| Scanner Score | 0.15 | Scanner composite signal |
| Confidence | 0.12 | Data and analysis confidence |
| Risk (inverted) | 0.10 | Risk aversion |
| Trend Strength | 0.06 | Trend alignment |
| Momentum | 0.06 | Price momentum |
| Financial Quality | 0.05 | Financial health |
| Sector Strength | 0.04 | Sector tailwind |
| Growth | 0.04 | Growth potential |
| Provider Confidence | 0.04 | Provider reliability |
| Liquidity | 0.03 | Tradeability |
| Valuation | 0.03 | Valuation attractiveness |
| Aggregation Quality | 0.03 | Data quality signal |
| Freshness | 0.03 | Data recency |
| Confirmation | 0.02 | Confirmation level strength |
| Historical Consistency | 0.02 | Ranking consistency over time |
| Age | 0.01 | Lifecycle position |
| Duplicate Penalty | -0.01 | Repeated signal reduction |

---

## Normalization

Three normalization modes are supported:

| Mode | Description |
|------|-------------|
| PERCENTILE | Rank each factor as a percentile within the dataset |
| Z_SCORE | Standardize using mean and standard deviation, then scale to 0–100 |
| MIN_MAX | Linear scaling to 0–100 based on min and max values |

Default mode: PERCENTILE.

Normalization ensures no single metric dominates the ranking.

---

## Investment Grades

| Grade | Score Range | Description |
|-------|-------------|-------------|
| AAA | ≥ 90 | Exceptional — highest conviction |
| AA | ≥ 80 | Very strong — high conviction |
| A | ≥ 70 | Strong — above average conviction |
| BBB | ≥ 60 | Good — moderate conviction |
| BB | ≥ 50 | Fair — lower conviction |
| B | ≥ 40 | Speculative — limited conviction |
| C | ≥ 0 | Highly speculative — minimal conviction |
| REJECT | < threshold | Does not meet minimum criteria |

---

## Recommendations

| Recommendation | Trigger |
|---------------|---------|
| STRONG_BUY | Score ≥ 85, Risk < 40, Confidence > 70 |
| BUY | Score ≥ 70 |
| WATCH | Score ≥ 55 |
| NEUTRAL | Score ≥ 40 |
| REDUCE | Score ≥ 25 |
| AVOID | Score < 25 or Grade REJECT |

Every recommendation includes an explanation — no unexplained scores.

---

## Tie Breaking

When two candidates have equal ranking scores, ties are broken by:

1. Confidence (higher wins)
2. Risk (lower wins)
3. Freshness (more recent wins)
4. Ticker (alphabetical)

---

## Stability

The RankingStabilizer uses hysteresis to prevent constant reordering from small score fluctuations:

- **Hysteresis threshold**: Score change must exceed threshold (default: 3 points)
- **Minimum rank change**: Rank must change by at least 2 positions (default)
- **Stability window**: Recent history considered for trend detection (default: 5 entries)

---

## History

Per-symbol ranking history tracks:

| Field | Description |
|-------|-------------|
| Previous Rank | Rank from previous ranking cycle |
| Best Rank | Lowest rank ever achieved |
| Worst Rank | Highest rank ever achieved |
| Average Rank | Mean rank across all entries |
| Ranking Trend | IMPROVING, STABLE, DECLINING, or NEW |

---

## Comparison Views

| View | Description |
|------|-------------|
| TOP_GAINERS | Candidates with improved rank |
| TOP_LOSERS | Candidates with declined rank |
| MOST_IMPROVED | Candidates with IMPROVING trend |
| MOST_CONSISTENT | Candidates with smallest rank spread |
| HIGHEST_CONFIDENCE | Sorted by confidence descending |
| LOWEST_RISK | Sorted by risk ascending |
| HIGHEST_GROWTH | Sorted by growth factor |
| HIGHEST_VALUE | Sorted by valuation factor |

---

## Risk/Reward

Each ranked candidate includes:

- **Expected Return Estimate**: `rankingScore × 0.6 - risk × 0.3`
- **Risk/Reward Ratio**: `(100 - risk) / risk × rankingScore`

---

## File Structure

```
ranking/
├── ranking.types.ts                    # All type definitions
├── ranking.config.ts                   # All configurable settings
├── ranking-engine.service.ts           # Main orchestrator
├── ranking.module.ts                   # NestJS module wiring
├── index.ts                            # Public exports
├── services/
│   ├── normalizer.service.ts           # Percentile/z-score/min-max normalization
│   ├── ranking-calculator.service.ts   # 18-factor composite calculation
│   ├── grade-assigner.service.ts       # Investment grade assignment
│   ├── recommendation-engine.service.ts# Recommendation logic
│   ├── tie-breaker.service.ts          # Tie breaking logic
│   ├── ranking-stabilizer.service.ts   # Hysteresis stability
│   ├── ranking-history.service.ts      # Rank history tracking
│   ├── ranking-comparator.service.ts   # Comparison views
│   └── ranking-metrics-collector.service.ts # Observability
└── __tests__/
    ├── test-helpers.ts                 # Shared builders
    ├── services.spec.ts                # Service-level tests
    └── ranking-engine.spec.ts          # Engine integration tests
```

---

# Architecture Decision Record

**ADR-049**

**Title:** Intelligent Ranking Engine — Final Candidate Ranking Architecture

**Status:** Accepted

**Decision**

Implement a dedicated Ranking Engine that receives `ScannerResult[]` from the Scanner Engine and produces `RankedOpportunity[]` with investment grades, recommendations, normalized scores, tie breaking, stability, history tracking, comparison views, and observability metrics.

**Rationale**

1. **Separation of concerns**: The Scanner selects candidates; the Ranking Engine determines their final order — they serve different purposes
2. **Multi-factor scoring**: 18 configurable factors ensure no single metric dominates
3. **Normalization**: Percentile/z-score/min-max modes ensure fair comparison across diverse metrics
4. **Grading**: Letter grades provide intuitive investment quality signals
5. **Recommendations**: Every recommendation includes an explanation — no unexplained actions
6. **Stability**: Hysteresis prevents constant reordering from minor score fluctuations
7. **History**: Rank tracking enables trend analysis and comparison views
8. **Tie breaking**: Deterministic tie resolution ensures consistent rankings

---

# Summary

The Ranking Engine transforms scanner candidates into the definitive ranked investment list. It scores using 18 normalized factors, assigns investment grades (AAA → REJECT), generates explainable recommendations (STRONG_BUY → AVOID), breaks ties deterministically, stabilizes rankings with hysteresis, tracks rank history, supports 8 comparison views, and collects observability metrics — producing the final candidate list ready for the Alert Engine (F14-002).

---

# Chapter 17 — Professional Alert & Notification Engine

## Overview

The Alert Engine is the final output layer of the investment pipeline (F14-002). It consumes `RankedOpportunity[]` from the Ranking Engine and produces enterprise-grade alerts delivered through multiple channels with duplicate prevention, cooldown management, history tracking, and observability.

The Alert Engine decides: "What should the user be notified about, and how?"

It is responsible for: trigger evaluation, alert creation, channel delivery (Telegram, WebSocket, Application), cooldown enforcement, duplicate suppression, watchlist management, and metrics collection.

---

## Architecture

```
RankedOpportunity[]
       │
       ▼
AlertEngine (orchestrator)
       │
       ├── TriggerEvaluator    ──► evaluate 12 alert types against triggers
       ├── CooldownEngine      ──► per-type/per-symbol/per-channel cooldown
       ├── DuplicatePrevention ──► deduplicate by type+symbol+content
       ├── AlertHistory        ──► history with pagination and status updates
       ├── AlertMetricsCollector ──► observability counters and distributions
       ├── WatchlistManager    ──► 7 default + custom watchlists
       │
       ├── IAlertChannel ──► Channel Interface (plugin architecture)
       │   ├── TelegramService    ──► Markdown, emoji, buttons, rate limiting
       │   ├── WebSocketPublisher ──► alert.created/updated/dismissed events
       │   └── ApplicationChannel ──► in-app notification (future: Email, SMS, Push, Discord, Slack)
       │
       ▼
AlertEvent[] (delivered to user)
```

---

## Alert Types

| Type | Description | Default Cooldown |
|------|-------------|-----------------|
| OPPORTUNITY | New opportunity detected | 30 min |
| RANKING_CHANGE | Rank moves into Top N or increases by X positions | 15 min |
| STRONG_BUY | Strong Buy recommendation generated | 60 min |
| STRONG_SELL | Reduce/Avoid recommendation generated | 60 min |
| CONFIDENCE_INCREASE | Confidence exceeds threshold | 30 min |
| CONFIDENCE_DROP | Confidence falls below threshold | 15 min |
| WATCHLIST | Watchlist stock receives new signal | 5 min |
| PRICE_BREAKOUT | Price breakout pattern detected | 30 min |
| VOLUME_SPIKE | Unusual volume detected | 15 min |
| RISK | Critical risk level detected | 5 min |
| PORTFOLIO | Portfolio-level notification | 60 min |
| SCHEDULER | Scheduled report delivery | 5 min |

---

## Alert Priority

| Priority | Condition | Channels |
|----------|-----------|----------|
| CRITICAL | STRONG_BUY, priority CRITICAL, or trigger score ≥ 90 | TELEGRAM + WEBSOCKET + APPLICATION |
| HIGH | priority HIGH or trigger score ≥ 70 | TELEGRAM + WEBSOCKET + APPLICATION |
| NORMAL | trigger score ≥ 40 | WEBSOCKET + APPLICATION |
| LOW | trigger score < 40 | APPLICATION + WEBSOCKET |

---

## Alert Lifecycle

```
ACTIVE ──► ACKNOWLEDGED
  │
  ├──► DISMISSED
  │
  └──► EXPIRED (based on expiresAt)
```

- **ACTIVE**: Alert is live and visible
- **ACKNOWLEDGED**: User has seen and acknowledged
- **DISMISSED**: User has dismissed
- **EXPIRED**: Alert has passed its expiration time

Status changes are propagated via WebSocket (`alert.updated`, `alert.dismissed`).

---

## Trigger Conditions

| Condition | Parameters | Description |
|-----------|-----------|-------------|
| Rank Top N | `rankTopN` | Alert when rank enters top N positions |
| Rank Increase | `rankPositionIncrease` | Alert when rank improves by X positions |
| New Entry | `previousRank === null` | Alert when symbol first appears in rankings |
| Confidence Threshold | `minConfidence` | Alert when confidence crosses threshold |
| Opportunity Threshold | `minOpportunityScore` | Alert when opportunity score exceeds threshold |
| Strong Buy | `strongBuyOnly` | Alert only when recommendation is STRONG_BUY |
| Critical Risk | `criticalRiskOnly` | Alert when risk ≥ 80 |
| Watchlist | `watchlistOnly` | Alert for watchlist symbols |

---

## Channel Architecture

The Alert Engine uses a plugin-channel architecture via `IAlertChannel` interface:

```typescript
interface IAlertChannel {
  readonly channelType: AlertChannelType;
  send(alert: AlertEvent): Promise<ChannelDeliveryStatus>;
  isAvailable(): boolean;
  getRateLimitRemaining(): number;
}
```

This design allows adding Email, SMS, Push, Discord, and Slack channels without modifying the engine — each implements `IAlertChannel` and registers itself in the engine's channel map.

### Telegram

- **Format**: Markdown with emoji indicators for priority levels
- **Buttons**: Inline keyboard with Acknowledge/Dismiss actions
- **Rate Limiting**: Token bucket (20 msg/min default) with auto-refresh
- **Retry**: 3 attempts with 2s delay between failures
- **Priority Emoji**: 🔥 CRITICAL, ⚡ HIGH, 💡 NORMAL, ℹ️ LOW

### WebSocket

- **Events**: `alert.created`, `alert.updated`, `alert.dismissed`
- **Subscriber pattern**: Multiple handlers via `subscribe()`/`unsubscribe()`
- **Rate Limiting**: Token bucket (60 events/min default)
- **Payload**: Full alert data with timestamps

### Application (in-app notification)

Placeholder for future implementation — channel interface ready.

---

## Cooldown Engine

Configurable cooldown per alert type, symbol, and channel:

- **Default**: 15 minutes
- **Per-type overrides**: STRONG_BUY=60min, OPPORTUNITY=30min, WATCHLIST=5min, RISK=5min
- **Symbol isolation**: Different symbols have independent cooldowns
- **Channel isolation**: Each channel has independent cooldown tracking
- **Key format**: `{alertType}:{symbol}:{channel}`

---

## Duplicate Prevention

Prevents identical alerts within a 5-minute window:

- **Key**: `{alertType}:{symbol}:{title}`
- **Window**: 5 minutes (configurable)
- **Tracking**: Stores previous alert ID for reference
- **Metrics**: Records duplicate suppression count

---

## Watchlist Manager

Seven default watchlists pre-initialized:

| Name | Purpose |
|------|---------|
| FAVORITES | User's favorite stocks |
| PORTFOLIO | Current portfolio holdings |
| LONG_TERM | Long-term investment candidates |
| SHORT_TERM | Short-term trading candidates |
| GROWTH | Growth stock candidates |
| DIVIDEND | Dividend stock candidates |
| CUSTOM | User-defined custom watchlist |

Supports add, remove, check membership, get all symbols, create custom, and delete non-default lists.

---

## Alert Metrics

| Metric | Description |
|--------|-------------|
| totalAlertsCreated | Total alerts generated |
| totalAlertsDelivered | Total alerts delivered successfully |
| totalAlertsFailed | Total delivery failures |
| totalDuplicatesSuppressed | Duplicates prevented |
| totalCooldownsApplied | Cooldowns enforced |
| alertsByType | Distribution across alert types |
| alertsByPriority | Distribution across priority levels |
| alertsByStatus | Distribution across lifecycle statuses |
| channelDeliveryStats | Per-channel attempt/success/failure counts |
| averageDeliveryDurationMs | Mean delivery latency |

---

## Scheduler Integration

The Alert Engine does NOT create schedulers. It exposes `processRankedOpportunities(RankedOpportunity[])` which existing schedulers (marketOpenScan, incrementalScan) call after ranking completes. The Ranking Engine and Scanner Engine already run on their own schedules — Alert Engine is called at the end of the pipeline.

---

## File Structure

```
alerts/
├── alerts.types.ts                    # All type definitions
├── alerts.config.ts                   # All configurable settings
├── alerts.module.ts                   # NestJS module wiring
├── index.ts                           # Public exports
├── engine/
│   └── alert-engine.service.ts        # Main orchestrator
├── services/
│   ├── cooldown.service.ts            # Cooldown management
│   ├── duplicate-prevention.service.ts# Duplicate alert suppression
│   ├── alert-history.service.ts       # History tracking with pagination
│   ├── alert-metrics.service.ts       # Observability counters
│   ├── telegram.service.ts            # Professional Telegram integration
│   ├── websocket.service.ts           # WebSocket event publishing
│   ├── watchlist-manager.service.ts   # Watchlist management
│   └── trigger-evaluator.service.ts   # Trigger condition evaluation
├── interfaces/
│   └── alert-channel.interface.ts     # Plugin channel interface
├── dto/
│   └── alert.dto.ts                   # Data transfer objects
└── __tests__/
    ├── test-helpers.ts                # Shared builders
    ├── services.spec.ts               # 70 service-level tests
    └── alert-engine.spec.ts           # 27 engine integration tests
```

---

# Architecture Decision Record

**ADR-050**

**Title:** Professional Alert & Notification Engine — Enterprise Alert Delivery Architecture

**Status:** Accepted

**Decision**

Implement a dedicated Alert Engine that consumes `RankedOpportunity[]` from the Ranking Engine and delivers enterprise-grade alerts through Telegram, WebSocket, and Application channels with 12 alert types, 4 priority levels, configurable trigger conditions, cooldown enforcement, duplicate prevention, watchlist management, history tracking, and observability metrics.

**Rationale**

1. **Separation of concerns**: Alert delivery is distinct from candidate ranking — they serve different purposes
2. **Plugin channel architecture**: `IAlertChannel` interface enables adding Email, SMS, Push, Discord, Slack without engine modifications
3. **Cooldown management**: Prevents notification fatigue with per-type/per-symbol/per-channel configurable cooldowns
4. **Duplicate prevention**: Same-type/same-symbol/same-content alerts are suppressed within configurable windows
5. **Watchlist integration**: Users receive alerts only for symbols they care about, across unlimited watchlists
6. **Trigger flexibility**: 12 alert types with configurable thresholds cover the full investment pipeline spectrum
7. **Professional Telegram**: Markdown formatting, priority emoji, inline action buttons, rate limiting with token bucket, retry with backoff
8. **WebSocket events**: Real-time push of alert lifecycle events (`created`, `updated`, `dismissed`)
9. **Observability**: Full metrics coverage for monitoring alert health and delivery performance
10. **Scheduler agnostic**: Called by existing schedulers — no duplicate scheduling infrastructure

---

# Chapter 18 — Professional Portfolio Engine

## Purpose

The Portfolio Engine is a comprehensive, multi-portfolio management system serving as the single source of truth for all portfolio calculations. It supports multiple portfolio types (MAIN, GROWTH, DIVIDEND, LONG_TERM, TRADING, PAPER, CUSTOM) with position management, allocation, risk, performance, reports, exports, and full transaction history.

## File Structure

```
apps/api/src/modules/portfolio/
  types/portfolio.types.ts           — All type definitions
  config/portfolio.config.ts         — Default config and risk limits
  interfaces/portfolio-repository.interface.ts — Repository contracts
  repositories/
    portfolio.repository.ts          — In-memory portfolio CRUD
    position.repository.ts           — In-memory position CRUD
    transaction.repository.ts        — In-memory transaction CRUD
    snapshot.repository.ts           — In-memory snapshot CRUD
  services/
    position-manager.service.ts      — Buy/sell execution, avg cost, weights
    portfolio-calculator.service.ts  — Summary, cost basis, daily return
    allocation-engine.service.ts     — Sector/industry/market-cap/risk/cash allocation
    risk-calculator.service.ts       — Portfolio risk, VaR, drawdown, diversification
    performance-calculator.service.ts — Period performance, Sharpe, alpha, max drawdown
    portfolio-history.service.ts     — Transaction and snapshot recording
    report-generator.service.ts      — Full portfolio report synthesis
    export.service.ts                — CSV/JSON/Excel export
    portfolio-metrics.service.ts     — Cross-portfolio observability
    benchmark.service.ts             — Benchmark tracking and comparison
  engine/
    portfolio-engine.service.ts      — Main orchestrator facade
  dto/portfolio.dto.ts               — Validation DTOs
  __tests__/                         — 8 test files, 43 tests
  index.ts                           — Module barrel exports
  portfolio.module.ts                — NestJS module definition
```

## Key Design Decisions

1. **Repository pattern**: All data access goes through interfaces (`IPortfolioRepository`, `IPositionRepository`, `ITransactionRepository`, `ISnapshotRepository`) with in-memory implementations. Persistence can be swapped to a database later.

2. **Service separation**: Each service has a single responsibility — position execution, allocation, risk, performance, history, reporting, export, metrics, benchmarks. The `PortfolioEngine` orchestrates them.

3. **Position manager**: Handles average cost calculation on buy (`(totalCost + newTotal) / (quantity + newQuantity)`) and partial sell (`remaining cost basis = totalCost * (1 - sellRatio)`) with realized P&L tracking.

4. **Allocation engine**: Computes allocation breakdowns by sector, industry, market cap, risk tier, and cash/stock split. Each breakdown returns percentage-weighted entries sorted by weight.

5. **Risk calculator**: Calculates portfolio-level risk score, sector concentration, largest position %, cash ratio, diversification score, drawdown (current and max), and volatility. Includes configurable risk limit checks.

6. **Performance calculator**: Supports DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, and SINCE_INCEPTION periods. Computes absolute/percent return, Sharpe ratio, max drawdown, best/worst day, win/loss counts, and alpha vs benchmark.

7. **Report generator**: Aggregates summary + allocation + performance + risk + recent transactions + risk warnings into a single `PortfolioReport`.

8. **Export service**: Converts any report or position/transaction array to CSV, JSON, or Excel-flavored CSV.

9. **Benchmark service**: Registers and tracks benchmark data points, computes total and annualized returns.

10. **Observability**: Cross-portfolio metrics (total portfolios, positions, avg size, largest gain/loss, avg holding time, avg allocation) available via `PortfolioMetricsService`.

---

## ADR-051: Portfolio Engine

**Status**: Accepted (2025-07-28)  
**Applies to**: F14-003

### Context

The platform needed a unified portfolio management system that could handle multiple portfolios, position tracking, allocation analysis, risk assessment, performance measurement, reporting, and export — all while integrating with existing Ranking, Scanner, Alert, and Opportunity engines.

### Decision

Build a dedicated `PortfolioModule` with four in-memory repositories, ten focused services, and a single orchestrating engine. Key decisions:

1. **Average cost method**: Use simple average cost (total cost / total quantity) for position tracking. Realized P&L on sell = `sellTotal - (totalCost * sellRatio)`.

2. **Risk score**: Composite of volatility (2x weight) and inverse diversification score (0.5x weight), clamped to [0, 100].

3. **Diversification score**: Weighted formula: position count (40%), inverse sector concentration (30%), inverse largest position (30%).

4. **Volatility**: Standard deviation of daily snapshot returns, annualized.

5. **Drawdown**: Peak-to-trough decline tracking from historical snapshots. Both current and max drawdown computed.

6. **Sharpe ratio**: Uses 15% annual risk-free rate, daily excess returns, annualized with sqrt(365).

7. **Allocation types**: Sector, industry, market cap, risk tier, cash/stock — each computed independently for flexible consumption.

8. **Export formats**: CSV (header row + data rows), JSON (pretty-printed), Excel (UTF-8 BOM + CSV) — designed for PDF extensibility.

9. **Benchmark data**: Manual registration and price update — not auto-fetched (market data layer integration is future work).

10. **Snapshot history**: Recorded on every portfolio creation and explicit `recordSnapshot()` call. Retention pruning available via `pruneOldSnapshots()`.

### Consequences

- **Positive**: Full portfolio management capability with 43 unit tests, clean separation of concerns, easy to extend with new allocation/risk/performance features, integrates cleanly with NestJS DI.
- **Negative**: In-memory storage only (no persistence across restarts), no auto-snapshot scheduling (caller must invoke `recordSnapshot`).
- **Migration path**: Replace repository implementations with DB-backed versions when persistence is needed. Add a cron/scheduler call to `recordSnapshot()` for automatic daily snapshots.

---

# Chapter 19 — Professional Dashboard Platform

## Purpose

The Dashboard Platform is the frontend presentation layer that consumes all existing backend engines (Market Data, AI Analysis, Opportunity, Scanner, Ranking, Alert, Portfolio) and renders them as interactive, real-time visual dashboards. It performs zero business logic — it is purely a visualization and interaction layer.

## File Structure

```
frontend/src/
  types/dashboard.ts                        — Dashboard-specific type definitions
  services/dashboard.ts                     — 18 API service functions (fetch wrappers)
  hooks/
    use-dashboard.ts                        — 16 React Query hooks
    index.ts                                — Barrel export
  components/
    charts/                                 — 7 recharts-based chart components
    widgets/                                — 8 dashboard widget components
    ranking/                                — RankingTable, RankingFilters
    alerts/                                 — AlertList, AlertFilters
    opportunities/                          — OpportunityList
    watchlists/                             — WatchlistManager, WatchlistSelector
    scanner/                                — ScannerFilters, ScannerResultsList
    portfolio/                              — PortfolioView, AllocationSection, PerformanceSection
    stock-detail/                           — StockDetailContent
  app/
    page.tsx                                — Rebuilt dashboard homepage (8 widgets)
    ranking/page.tsx                        — Full ranking page
    scanner/page.tsx                        — Full scanner page
    alerts/page.tsx                         — Full alerts page
    opportunities/page.tsx                  — Full opportunities page
    watchlists/page.tsx                     — Full watchlists page
    stocks/[symbol]/page.tsx                — Stock detail page
    portfolio/page.tsx                      — Enhanced portfolio page
```

## Component Architecture

### Charts Layer (`components/charts/`)

Seven recharts-based chart components, all accepting typed props and rendered with dark-theme styling consistent with the existing design system:

| Component | Chart Type | Data Prop |
|-----------|-----------|-----------|
| LineChart | Recharts Line | `data: {name: string, value: number}[]` |
| BarChart | Recharts Bar | `data: {name: string, value: number}[]` |
| PieChart | Recharts Pie | `data: {name: string, value: number}[]` |
| AllocationChart | Pie (donut) | `data: AllocationEntry[]` |
| PerformanceChart | Line (multi-series) | `data: PerformanceEntry[]` |
| RankingDistributionChart | Bar (histogram) | `data: {range: string, count: number}[]` |
| SectorDistributionChart | Pie | `data: {name: string, percentage: number}[]` |

Each chart includes: `title` prop, dark theme (v7-dark background), responsive container, loading skeleton, empty state ("No data available"), and optional `height`/`className`.

### Widgets Layer (`components/widgets/`)

Eight dashboard widgets, each consuming a React Query hook and rendering a card with header + content area:

| Widget | Hook | Display |
|--------|------|---------|
| PortfolioSummary | `usePortfolioSummary` | 4 KPI cards (invested capital, market value, P&L, cash/stock split) |
| TopRanked | `useRankedStocks` | Top 10 ranked stocks with score bars |
| LatestOpportunities | `useLatestOpportunities` | List of recent opportunities with confidence badges |
| ActiveAlerts | `useActiveAlerts` | Active alerts list with priority icons |
| Watchlists | `useWatchlists` | Watchlist count + recent stocks |
| MarketStatus | `useMarketStatus` | Market open/closed + major indices |
| AIRecommendations | `useAIRecommendations` | AI buy/sell/hold calls |
| PerformanceOverview | `usePortfolioPerformance` | Mini performance chart (last 30 periods) |

Each widget implements: loading skeleton (`<div className="animate-pulse ...">`), error state (text-muted message), empty state, and optional `onViewAll` link.

### Domain Components

- **RankingTable**: Sortable table with columns (rank, ticker, score, change, target price), client-side search, pagination (50/page).
- **RankingFilters**: Five filter selects (sector, market cap, risk tier, min score, max score) with "Apply Filters" button.
- **AlertList**: Grouped by priority (Critical/High/Medium/Low), each with acknowledge and dismiss buttons.
- **AlertFilters**: Status (all/active/acknowledged/dismissed) and priority (all/critical/high/medium/low) selects.
- **OpportunityList**: Fetches and displays opportunities with filter by minimum confidence, pagination 20/page.
- **WatchlistManager**: Full CRUD — create watchlist, rename, delete, add stock (modal with ticker input), remove stock.
- **WatchlistSelector**: Dropdown select of all watchlists for filtering/navigation.
- **ScannerFilters**: Five filter selects (sector, market cap, risk tier, min score, max score).
- **ScannerResultsList**: Server-filtered results table (ticker, name, score, change, target price).
- **PortfolioView**: 4 summary KPI cards + controlled tab interface (Allocation, Performance, Positions, Risk).
- **AllocationSection**: Renders AllocationChart + SectorDistributionChart in a grid.
- **PerformanceSection**: Renders PerformanceChart with period selector.
- **StockDetailContent**: Comprehensive stock detail — ranking snapshot, financials, technicals, AI analysis, portfolio position, opportunity history, alert history. Sections rendered with TabContent + panel layout.

## Data Flow

```
Backend REST API → services/dashboard.ts (fetch) → hooks/use-dashboard.ts (React Query) → Components
```

1. **Services layer** (`services/dashboard.ts`): 18 functions that call backend endpoints (e.g., `fetchRankedStocks()`, `fetchScannerResults()`, `fetchPortfolioSummary()`). Each returns typed data.
2. **Hooks layer** (`hooks/use-dashboard.ts`): 16 React Query hooks that wrap service calls with `useQuery` / `useMutation`, providing `data`, `isLoading`, `error`, and `refetch`.
3. **Components layer**: Each component/hook/page calls the appropriate hook and renders the data.

**Key pattern**: No data transformation in the frontend. Backend engines serve pre-computed results; the dashboard only formats and displays them.

## Page Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | 8-widget grid layout |
| `/ranking` | RankingPage | Full ranking table + filters |
| `/scanner` | ScannerPage | Scanner filters + results |
| `/alerts` | AlertsPage | Alert list + filters |
| `/opportunities` | OpportunitiesPage | Opportunity list + filter |
| `/watchlists` | WatchlistsPage | Watchlist selector + manager |
| `/stocks/[symbol]` | StockDetailPage | Full stock detail view |
| `/portfolio` | PortfolioPage | Enhanced portfolio view |

## State Management

- **Server state**: All data fetching via React Query v5 (caching, refetching, stale-while-revalidate).
- **Client state**: Only local component state (`useState` for tab values, search inputs, filter selections, pagination). No Zustand or Redux — each page is self-contained.
- **Form state**: TODO — future optimization with URL search params for filter persistence.

## Testing

Test files are co-located in `__tests__/` directories alongside their components. The test suite uses Vitest with React Testing Library. Tests cover:

- Chart rendering (bar, line, pie — snapshot + prop verification)
- Widget display (portfolio-summary, top-ranked, active-alerts — mock hook + render)
- Component interaction (ranking-table with sort, opportunity-list with filters)

---

## ADR-052: Professional Dashboard Platform

**Status**: Accepted (2025-07-29)  
**Applies to**: F14-004

### Context

The platform had seven backend engines (Market Data, AI Analysis, Opportunity, Scanner, Ranking, Alert, Portfolio) each with REST APIs but no frontend visualization. Users needed a professional dashboard to view rankings, scan results, alerts, opportunities, watchlists, portfolio data, and stock details — all in one unified interface.

### Decision

Build a frontend-only Dashboard Platform at `frontend/src/` with the following architecture decisions:

1. **Zero business logic**: All calculations remain in backend engines. The dashboard only fetches, formats, and displays pre-computed data. This enforces strict separation of concerns.

2. **React Query for server state**: All data fetching uses TanStack React Query v5 hooks. No Zustand/Redux for server state — avoid dual-source-of-truth problems. Stale-while-revalidate caching provides instant navigation.

3. **Controlled Tabs**: The portfolio page's tab interface uses controlled state (`value` + `onValueChange`) instead of `defaultValue`, matching the existing `Tabs` component API.

4. **Recharts for charts**: Chosen for its React-native integration, dark theme support, and no external CSS dependency. Seven chart components wrapping Recharts primitives.

5. **Co-located test files**: Each `__tests__/` directory lives next to its component. Tests mock React Query hooks via direct mock of the hook module.

6. **Pagination on the client**: Ranking table and opportunity list implement client-side pagination for simplicity. Server-side pagination can replace when data exceeds 200+ items.

7. **No URL search params**: Filter state is component-local (`useState`). Future work may add URL search param synchronization for shareable filter URLs.

8. **TypeScript strict mode**: All dashboard types defined in `types/dashboard.ts`. Components consume typed data from hooks. No `any` casts.

### Consequences

- **Positive**: Complete frontend coverage for all seven engines in a single sprint. Clean separation — backend can change independently. 8 new pages with consistent dark-theme design. Reusable chart and widget components.
- **Negative**: No server-side pagination (client-side only). No URL search param persistence for filters. Some pre-existing npm dependency issues prevent test runner execution (magic-string, tailwind-merge, @testing-library/react).
- **Migration path**: Add URL search params to filter components for shareable state. Move pagination to server-side when data volume grows. Fix pre-existing npm dependency issues (`npm install @testing-library/react tailwind-merge`, resolve magic-string `es.mjs` export).

---

# Chapter 20 — Live Market Integration & Provider Flow

## Purpose

The Live Market Integration layer connects the existing BIST Elite AI platform to real market data through a unified provider abstraction. It ensures all data providers follow a consistent interface with health monitoring, circuit breakers, retry logic, and metrics collection — without modifying any existing provider implementations.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Provider Health Monitor                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Finnhub  │  │   KAP    │  │   MKK    │  │  TCMB    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│  ┌────▼─────────────▼─────────────▼─────────────▼─────┐     │
│  │            BaseProviderAdapter                      │     │
│  │  reconnect() | getStatus() | recordMetrics()       │     │
│  │  withRetry() | circuitBreaker | timeout            │     │
│  └─────────────────────┬──────────────────────────────┘     │
│                        │                                    │
│  ┌─────────────────────▼──────────────────────────────┐     │
│  │          Callers (pipeline, services)              │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **No redesign**: Existing provider implementations remain untouched. The `BaseProviderAdapter` is enhanced with `reconnect()`, `getStatus()`, and `recordMetrics()` — all optional overrides.

2. **ProviderStatus** (`provider-health-monitor.types.ts:6`): Rich status object with 12 fields — `name`, `connected`, `circuitState`, `consecutiveFailures`, `lastSuccessTime`, `lastFailureTime`, `uptimeMs`, `totalRequests`, `successfulRequests`, `failedRequests`, `avgLatencyMs`, `lastHealthCheck`.

3. **Circuit breaker**: Three states (closed/open/half-open). Opens after 5 consecutive failures. Half-open allows 1 probe request. Re-closes on success.

4. **Provider metrics**: `recordMetrics()` tracks latency per request. `getStatus()` reports `avgLatencyMs`. Used by health monitor dashboard.

5. **Provider health check job** (`provider-health-check.job.ts`): Iterates all 4 unified providers, calls `getStatus()`, updates health monitor. Runs every 5 minutes.

## File Structure

```
apps/api/src/modules/
  market-data/providers/unified/
    base-provider.adapter.ts          — Enhanced with reconnect(), getStatus(), recordMetrics()
  provider-health-monitor/
    provider-health-monitor.types.ts  — ProviderName updated with 4 providers
    provider-health-monitor.config.ts — DEFAULT_PROVIDER_HEALTH_CONFIG updated
    provider-health-monitor.engine.ts — Circuit breaker logic
    provider-health-monitor.service.ts — Snapshot aggregation
    scheduler/jobs/
      provider-health-check.job.ts    — Updated PROVIDER_NAME_MAP
```

---

## ADR-053: Live Market Integration & Provider Health Monitoring

**Status**: Accepted (2025-07-29)
**Applies to**: F14-005

### Context

The platform had multiple data providers (Fintables, Finnhub, KAP, MKK, TCMB) each with different interfaces, error handling, and no unified health monitoring. Production deployment required circuit breakers, automatic reconnection, latency tracking, and a centralized health dashboard. The constraint: no redesign or modification of existing provider implementations.

### Decision

1. **Enhance BaseProviderAdapter, not replace it**: Add `reconnect()`, `getStatus()`, `recordMetrics()` as optional methods with default no-op implementations. Existing providers automatically gain health monitoring without code changes.

2. **ProviderStatus as universal health object**: A single 12-field interface used by health monitor, dashboard, alert system, and the scheduler. Every provider reports the same shape.

3. **Circuit breaker in health monitor engine**: Centralized in `ProviderHealthMonitorEngine`, not per-provider. Tracks consecutive failures globally per provider name.

4. **Provider name alignment**: Updated `ProviderName` type in `provider-health-monitor.types.ts` to use the same 4 names as the unified provider layer (`finnhub`, `kap`, `mkk`, `tcmb`). `PROVIDER_NAME_MAP` in the health check job provides backward mapping.

### Consequences

- **Positive**: All 4 unified providers now support health checks, circuit breakers, reconnection, and latency metrics. No existing provider code was modified. Health monitor dashboard shows per-provider status with circuit breaker state.
- **Negative**: The `PROVIDER_NAME_MAP` in the health check job is a maintenance burden when adding new providers.
- **Migration path**: Remove `PROVIDER_NAME_MAP` when all providers use identical names across the system.

---

# Chapter 21 — Macro Intelligence Engine

## Purpose

The Macro Intelligence Engine provides independent macroeconomic analysis that complements the existing Elite Score and Ranking Score without interfering with them. It processes 17 macro data sources, performs central bank NLP, market regime classification, macro scoring, sector impact estimation, and produces a Combined Confidence score (visualization only).

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Macro Intelligence Engine                 │
│                                                               │
│  MacroDataService                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 17 data source fetchers → MacroDataSnapshot             │  │
│  │ (tcmb, fed, ecb, us10y, us2y, dxy, vix, brent, gold,   │  │
│  │  usdtry, eurusd, turkey_cds, pmi, inflation, bist,     │  │
│  │  tcmb_decision_text, fomc_statement)                    │  │
│  └─────────────────────┬───────────────────────────────────┘  │
│                        │                                      │
│  ┌─────────────────────▼───────────────────────────────────┐  │
│  │              MacroAnalysisService                       │  │
│  │  Orchestrates: data → 5 engines → combined output      │  │
│  └──┬──────┬──────┬──────┬──────┬──────────────────────────┘  │
│     │      │      │      │      │                             │
│  ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──────────┐                │
│  │ NLP ││Regm ││Score││Sect ││Combined      │                │
│  │Eng  ││Eng  ││Eng  ││Imp  ││Confidence    │                │
│  └─────┘└─────┘└─────┘└─────┘└──────────────┘                │
│                                                               │
│  MacroService (facade) → MacroController (8 REST endpoints)  │
└───────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Independent from Elite Score**: Macro Score (0–100) is stored separately, computed from 5 weighted components (monetaryPolicy 25%, globalRisk 25%, domesticRisk 20%, growth 15%, liquidity 15%). Never overwrites Elite Score or Ranking Score.

2. **Combined Confidence is visualization-only**: The legacy `CombinedConfidenceEngine` computes `eliteScore * weightElite + macroScore * weightMacro` (default 60/40) and powers `GET /api/macro/combined-confidence` and opportunities. Since R1-002B FINAL, `CombinedConfidenceService` merges confidence only (Elite confidence + Macro confidence, 0–100, default 50/50 weights) and powers `GET /api/macro/confidence` and the dashboard bundle. Scores are never merged; nothing is stored or used for ranking.

3. **Central Bank NLP is keyword-based**: No ML model. `CentralBankNlpEngine` uses 22 keywords across 4 categories (hawkish, dovish, hawkish_leaning, dovish_leaning) plus regex for inflation/growth extraction. Output is JSON-only — no chatbot, no news summarization.

4. **Market Regime is rules-based**: `MarketRegimeEngine` classifies into risk_on/neutral/risk_off/extreme_risk using VIX, DXY, US10Y, CDS, liquidity impact, and momentum impact thresholds. All configurable via `DEFAULT_MACRO_CONFIG`.

5. **Macro Data Service consumes the Market Data Layer**: Since R1-002A/B, `MacroDataService` fetches every indicator exclusively through `MarketDataOrchestrator.fetchMacroIndicators()` — real adapters only (Fintables, Finnhub, TCMB/EVDS; KAP and MKK for company/disclosure/ownership data). No fallback constants remain. A 30-minute macro-indicator cache plus a stale-cache fallback feeds `MacroDataSnapshot`; sources with no value are marked `pending`. R1-002B FINAL adds `MarketDataOrchestrator.fetchTcmbInterestDecisions()` (6-hour TCMB cache, circuit-breaker protected) feeding the TCMB decision capture flow.

6. **Macro Elite Score is a derived, independent score**: `MacroEliteScoreService` computes a 0–100 score as base macro score + TCMB decision adjustment (sentiment delta scaled by analyzer confidence) + yield-curve adjustment (US10Y–US2Y spread), clamped 0–100. It adds confidence (0.7 × data + 0.3 × decision), a trend (score delta or decision sentiment), a risk assessment (VIX/CDS/score/decision), and a recommendation (opportunistic ≥70, selective, defensive, cash under extreme risk). Macro remains fully independent — it never modifies Scanner, Ranking, AI Analysis, or the Elite Score.

## File Structure

```
apps/api/src/modules/macro/
  macro.types.ts                    — 20+ types/interfaces
  macro.config.ts                   — DEFAULT_MACRO_CONFIG
  macro-data.service.ts             — 17 data source fetchers
  macro-analysis.service.ts         — Orchestrator (consumes TCMB decision store)
  macro.service.ts                  — Facade + alerts + elite/trend/confidence/dashboard
  macro.controller.ts               — 15 REST endpoints (R1-002B FINAL)
  macro.module.ts                   — Module imports (incl. DECISION_NOTIFIER token)
  index.ts                          — Barrel exports
  engines/
    central-bank-nlp.engine.ts      — TCMB/FED/ECB keyword NLP
    market-regime.engine.ts         — Regime classifier
    macro-score.engine.ts           — 5-component weighted score
    sector-impact.engine.ts         — 10-sector impact estimator
    combined-confidence.engine.ts   — Legacy weighted Elite + Macro (scores)
    tcmb-decision-analyzer.ts       — Rule-based Turkish TCMB decision NLP
  macro-elite-score.service.ts      — Macro Elite Score (0-100) + trend/risk/recommendation + observability
  combined-confidence.service.ts    — Confidence-only combination (never merges scores)
  tcmb-decision-capture.service.ts  — TCMB decision capture flow (fetch → analyze → store → notify)
  tcmb-decision-store.service.ts    — In-memory TCMB decision store
  decision-notifier.ts              — IDecisionNotifier + DECISION_NOTIFIER token
  macro-elite.types.ts              — Macro Elite/observability/combined-confidence types
  dto/macro-dashboard.dto.ts        — Dashboard bundle + card DTOs
  dto/macro-elite.dto.ts            — Elite/trend/confidence/observability DTOs + query validation
  __tests__/                        — Macro Elite, combined confidence, decision flow, DTO, swagger, integration tests
```

---

## ADR-054: Macro Intelligence Engine Architecture

**Status**: Accepted (2025-07-29)
**Applies to**: F14-005

### Context

The platform had no macroeconomic analysis capability. Users needed to see how macro conditions (interest rates, inflation, global risk, central bank policy) affect BIST stocks. The Elite Score and Ranking Score were already established and must remain untouched. No external ML APIs could be introduced.

### Decision

1. **New module at `apps/api/src/modules/macro/`**: Completely independent from AI Analysis, Ranking, and all other existing engines. No shared state, no cross-module dependencies.

2. **Two-layer service architecture**: `MacroDataService` handles data fetching (currently mock), `MacroAnalysisService` orchestrates 5 engines. `MacroService` is the public facade. `MacroController` exposes 8 endpoints.

3. **Keyword NLP over ML**: Avoids external API costs, no training data needed, deterministic and testable. Sufficient for single-user analysis. Upgrade path: replace engine with ML model when needed.

4. **Separate alert system**: `MacroService.getAlerts()` generates alerts for extreme risk, risk_off, hawkish central bank, VIX spike, CDS spike. These flow through the existing Alert system and Telegram.

5. **17 data sources as baseline**: Covers all major asset classes (rates, FX, equities, commodities) and all 3 central banks (TCMB, FED, ECB). Additional sources can be added by extending `MacroDataSource` type.

### Consequences

- **Positive**: Complete macro analysis layer (30 suites, 411 macro + market-data tests). No impact on existing scores. NLP is testable and deterministic. 10 sector impact estimates. Since R1-002B the data layer uses real providers: TCMB/EVDS (policy rate, CPI, USD/TRY, EUR/TRY), Fintables, Finnhub, plus a rule-based Turkish TCMB decision analyzer. R1-002B FINAL adds the Macro Elite Score (0–100), the TCMB decision capture flow, confidence-only combined confidence, observability, and dashboard DTOs.
- **Negative**: Decision NLP is keyword-based (no semantic understanding). MKK ownership data requires credentials (MKK_USERNAME/MKK_PASSWORD) and degrades to null otherwise. No historical macro data storage (trend is derived from consecutive in-memory calculations). No UI yet consumes the dashboard bundle.
- **Migration path**: Wire the frontend to the new dashboard bundle (`GET /api/macro/dashboard`). Add embedding-based NLP for semantic understanding. Add time-series storage for macro trend analysis.

---

# Chapter 22 — Market Regime & Central Bank NLP

## Purpose

Two specialized engines within the Macro Intelligence Engine: Market Regime classifies current market conditions into four risk levels using global indicators; Central Bank NLP analyzes TCMB, FED, and ECB decision texts for tone, confidence, and sector impact.

## Market Regime Engine

### Classification Logic

| Component | Input | Low Impact | Medium Impact | High Impact |
|-----------|-------|-----------|---------------|-------------|
| VIX | Volatility Index | ≤15 (0.0) | 15–25 (0.2–0.4) | >25 (0.6–0.9) |
| DXY | Dollar Index | ≤100 (0.1) | 100–106 (0.3–0.5) | >106 (0.7) |
| US10Y | 10Y Yield | ≤3% (0.0) | 3–5% (0.2–0.5) | >5% (0.8) |
| CDS | Turkey CDS | ≤200 (0.0) | 200–400 (0.3–0.5) | >400 (0.8) |
| Liquidity | US10Y-based | ≤3% (0.1) | 3–5.5% (0.3–0.6) | >5.5% (0.8) |
| Momentum | Reserved | — | — | — |

### Regime Thresholds

| Avg Impact | Regime |
|-----------|--------|
| ≤0.25 | Risk On |
| 0.26–0.45 | Neutral |
| 0.46–0.65 | Risk Off |
| >0.65 | Extreme Risk |

## Central Bank NLP Engine

### Keyword Categories

| Tone | Keywords |
|------|----------|
| Hawkish | tighten, hike, inflation risk, overheating, restrictive, withdraw liquidity |
| Dovish | cut, ease, accommodative, support growth, stimulus, loosen |
| Hawkish Leaning | cautious, gradual, monitor, data-dependent, measured |
| Dovish Leaning | patient, flexible, optionality, wait-and-see, accommodate |

### Decision Flow

```
Input text → Count keywords by category → Determine tone
  → Compute confidence (keyword ratio + length factor)
  → Map tone to market impact (hawkish=negative, dovish=positive)
  → Extract inflation/growth via regex
  → Determine sector impacts (15 sector keywords)
  → Output structured JSON
```

### Sector Impact Mapping

| Sector | Interest Sensitivity | Currency Sensitivity | Growth Sensitivity | Risk Sensitivity |
|--------|---------------------|--------------------|--------------------|-----------------|
| Banking | 0.9 | 0.3 | 0.5 | 0.8 |
| Industrial | 0.4 | 0.3 | 0.7 | 0.3 |
| Export | 0.2 | 0.8 | 0.6 | 0.4 |
| Construction | 0.8 | 0.2 | 0.6 | 0.5 |
| Technology | 0.5 | 0.2 | 0.8 | 0.6 |
| Energy | 0.3 | 0.6 | 0.4 | 0.5 |
| Food & Beverage | 0.4 | 0.4 | 0.5 | 0.3 |
| Telecom | 0.5 | 0.3 | 0.4 | 0.3 |
| Real Estate | 0.9 | 0.2 | 0.5 | 0.7 |
| Defense | 0.2 | 0.2 | 0.3 | 0.2 |

---

# Chapter 23 — Production-Ready Scheduler & Workflow

## Purpose

The Scheduler manages periodic job execution with market-aware timing, retry logic, execution history, and observability. The Workflow system orchestrates multi-step pipelines. Both were enhanced for production readiness.

## Scheduler Enhancements (F14-005)

### New Job Types

| Job | Interval | Description |
|-----|----------|-------------|
| `macroRefresh` | 15 min | Refreshes all 17 macro data sources, recalculates macro score and regime |
| `portfolioRefresh` | 15 min | Placeholder for portfolio data refresh |
| `alertRefresh` | 5 min | Generates macro alerts (regime changes, central bank tone, VIX/CDS spikes) |
| `retryFailedJobs` | 1 hour | Retries failed jobs from scheduler execution history |

### Job Architecture

```
SchedulerEngine
  → registerJob(name, instance)
  → start(): begins interval-based execution
  → executeJob(name): immediate one-shot execution
  → getStatus(): returns all jobs with status, metrics, history

Each job implements IJob:
  execute(ctx?: JobContext): Promise<JobResult>
    { success: boolean, message: string, metadata: Record<string, unknown> }
```

### Execution History

- `maxHistoryPerJob` configurable (default 100)
- Each execution recorded with timestamp, duration, success/failure, metadata
- `retryFailedJobs` iterates failed entries and re-executes

## Workflow Enhancements

### full_pipeline Workflow Type

A new `full_pipeline` workflow type with 10 sequential steps:

| Order | Step | Timeout | Optional |
|-------|------|---------|----------|
| 1 | fetch_market_data | 10 min | No |
| 2 | normalize | 5 min | No |
| 3 | aggregate | 5 min | No |
| 4 | ai_analysis | 10 min | No |
| 5 | opportunity_detection | 5 min | No |
| 6 | scanner | 5 min | No |
| 7 | ranking | 5 min | No |
| 8 | alerts | 5 min | Yes |
| 9 | portfolio_refresh | 5 min | Yes |
| 10 | macro_refresh | 5 min | Yes |

Total timeout: 1 hour. Last 3 steps are optional — skipped gracefully if no handler registered.

---

## ADR-055: Scheduler & Workflow Production Readiness

**Status**: Accepted (2025-07-29)
**Applies to**: F14-005

### Context

The scheduler existed but lacked macro-aware jobs, portfolio refresh, alert generation, and failed-job retry capability. The workflow system had no `full_pipeline` type for end-to-end market analysis. Production deployment required automated recovery from transient failures.

### Decision

1. **4 new job types**: Macro refresh (15 min), portfolio refresh (15 min), alert refresh (5 min), retry failed jobs (1 hour). All implement the existing `IJob` interface — no engine changes needed.

2. **full_pipeline workflow**: 10 steps covering the complete analysis chain from data fetch to macro refresh. Last 3 steps optional to allow partial execution. 1-hour total timeout.

3. **WorkflowType enum extended**: Added `'full_pipeline'` to the union type. Required updating `byType` stats accumulator in `WorkflowEngine.getStats()`.

4. **Existing tests continue passing**: 7 new workflow tests + 10 new scheduler job tests. All previous scheduler and workflow tests unchanged.

### Consequences

- **Positive**: Production-ready scheduler with automated recovery. Full end-to-end pipeline as a single workflow type. No breaking changes to existing job/workflow infrastructure.
- **Negative**: Portfolio refresh is still a placeholder. Retry logic depends on scheduler execution history accuracy.
- **Migration path**: Implement actual portfolio refresh logic. Add telemetry to retry-failed-jobs for better observability.

---

# Chapter 24 — Dashboard Extensions & Macro Visualization

## Purpose

Extend the existing Dashboard Platform (Chapter 19) with 6 new pages, 6 new widget components, macro-specific data types, React Query hooks, and API service functions — all following the same patterns established in F14-004.

## New Pages

| Route | Page | Description |
|-------|------|-------------|
| `/macro-intelligence` | MacroIntelligencePage | 6-widget grid (Macro Score, Market Regime, Central Bank Tone, Risk Appetite, Global Markets, Sector Impact) |
| `/macro-opportunities` | MacroOpportunitiesPage | Elite Score + Macro Score + Combined Confidence side-by-side |
| `/macro-risk` | MacroRiskPage | Risk cards + macro alerts list |
| `/market-regime` | MarketRegimePage | Regime display + component impact breakdown |
| `/macro-timeline` | MacroTimelinePage | Latest macro data table with timestamps |
| `/central-bank-analysis` | CentralBankAnalysisPage | TCMB/FED/ECB analysis cards |

## New Widgets

| Widget | Hook | Display |
|--------|------|---------|
| MacroScoreWidget | `useMacroScore` | Score number + 5 component breakdown |
| MarketRegimeWidget | `useMarketRegime` | Regime label + signals list |
| CentralBankToneWidget | `useCentralBankAnalysis` | TCMB/FED/ECB tone indicators |
| RiskAppetiteWidget | `useMarketRegime` | Risk level label (High/Moderate/Low/Extreme) |
| GlobalMarketsWidget | `useMacroData` | Key market data points (VIX, DXY, US10Y, Gold, Brent, USDTRY, CDS) |
| SectorImpactWidget | `useSectorImpacts` | 10 sectors with impact/score |

## Data Layer

```
types/dashboard.ts:
  10 new types: MacroDataPoint, MacroDataSnapshot, CentralBankAnalysis,
  MarketRegimeAnalysis, MacroScoreResult, SectorImpact, CombinedConfidence,
  MacroAlertEvent, MacroFullAnalysis, CentralBankTone, MarketImpact, MarketRegimeType

services/dashboard.ts:
  8 new functions: fetchMacroFullAnalysis, fetchMacroData, fetchMacroScore,
  fetchMarketRegime, fetchCentralBankAnalysis, fetchCombinedConfidence,
  fetchSectorImpacts, fetchMacroAlerts

hooks/use-dashboard.ts:
  8 new hooks: useMacroFullAnalysis, useMacroData, useMacroScore,
  useMarketRegime, useCentralBankAnalysis, useCombinedConfidence,
  useSectorImpacts, useMacroAlerts
```

## Navigation

6 new sidebar items added with icons:
- Macro Intelligence (`Globe`)
- Macro Opportunities (`LineChart`)
- Macro Risk (`AlertTriangle`)
- Market Regime (`Activity`)
- Central Bank Analysis (`BarChart3`)

## Locales

6 new keys added to both `en.json` and `tr.json` for navigation labels.

---

## ADR-056: Dashboard Extensions for Macro Intelligence

**Status**: Accepted (2025-07-29)
**Applies to**: F14-005

### Context

The Dashboard Platform (F14-004) covered 7 backend engines but had no macro visualization. Users needed to see macro scores, market regime, central bank analysis, and risk indicators alongside existing stock analysis. Architecture constraint: zero business logic in frontend, all data from REST APIs.

### Decision

1. **Same patterns as F14-004**: Types → Services → Hooks → Components. No new patterns, no business logic in frontend. All macro data flows through `services/dashboard.ts` and `hooks/use-dashboard.ts`.

2. **6 new pages, 6 new widgets**: Each page is a composition of existing UI components (PageHeader, card layout) and new macro widgets. Widgets follow the same loading/error/empty state patterns as existing dashboard widgets.

3. **No chart components needed**: Macro data is displayed as cards, labels, and tables — no Recharts required. Reuses existing `PageHeader` and card layout components.

4. **Sidebar integration**: Macro pages added to the existing `navItems` array with new Lucide icons. New locale entries for both languages.

### Consequences

- **Positive**: Macro intelligence fully visualized with 6 new pages. All data flows through existing patterns. No business logic in frontend. 81 backend tests + frontend structure ready.
- **Negative**: Two pages (macro-timeline, central-bank-analysis) use placeholder data. No Recharts integration for macro visualization yet.
- **Migration path**: Replace placeholder pages with live data. Add charts for macro trends over time. Add URL search params for filter persistence.

---

# Chapter 25 — Production Dashboard & Macro Intelligence UI (Final)

## Purpose

Complete the Production Dashboard (F14-005C) with 3 new pages, 2 enhanced macro pages, a homepage macro overview, a backend Pipeline Orchestrator controller, additional data types/hooks/services, and full test coverage — all without modifying any existing engine, scoring, or ranking logic.

## New Pages

| Route | Page | Description |
|-------|------|-------------|
| `/global-indicators` | GlobalIndicatorsPage | Categorized macro data viewer (Risk, Commodities, Currency, Macro) with cards per data source |
| `/pipeline-status` | PipelineStatusPage | Pipeline metrics (uptime, runs, success rate) + step-duration bars + Run/Reset buttons |
| `/production-observability` | ProductionObservabilityPage | Combined view: Pipeline Health, Macro Score, Market Regime, Data Sources, Active Alerts, System Status |

## Enhanced Pages

| Route | Enhancement |
|-------|-------------|
| `/macro-opportunities` | Added opportunity table with macro score, combined confidence, priority, and sector-impact columns |
| `/macro-risk` | Added risk-breakdown table by ticker (risk-type, severity, macro-score) alongside existing alert panel |

## Homepage Dashboard

The homepage (`page.tsx`) gained a "Macro Intelligence Overview" row with three widgets:
- **MacroScoreWidget** — current macro score (0–100) + 5-component breakdown
- **MarketRegimeWidget** — risk_on/neutral/risk_off/extreme_risk label
- **RiskAppetiteWidget** — High/Moderate/Low/Extreme label

These widgets use existing hooks (`useMacroScore`, `useMarketRegime`) — no new backend endpoints.

## Pipeline Orchestrator Controller

New controller at `apps/api/src/modules/pipeline-orchestrator/pipeline-orchestrator.controller.ts` with 4 endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pipeline/status` | Pipeline status (uptime, runs, success rate, steps) |
| GET | `/api/pipeline/metrics` | Pipeline metrics per step (avg duration, success count, failure count) |
| POST | `/api/pipeline/run` | Trigger pipeline execution |
| POST | `/api/pipeline/reset` | Reset pipeline state |

Registered in `pipeline-orchestrator.module.ts`. No changes to the scheduler, workflow, or any backend engine.

## New Types (`types/dashboard.ts`)

| Type | Purpose |
|------|---------|
| `MacroOpportunity` | Opportunity with ticker, name, macro-score, combined-confidence, priority, sector, sector-impact |
| `MacroRiskItem` | Risk item with ticker, risk-type, severity, macro-score, description |
| `PipelineMetrics` | Metrics per step (step name, avg duration, last duration, success count, failure count) |
| `PipelineStepRecord` | Individual step record (name, duration, status, timestamp) |
| `PipelineContext` | Pipeline context (id, started at, completed at, status, current step, steps) |
| `PipelineStatusResponse` | Status response (isRunning, uptime, totalRuns, successfulRuns, failedRuns, successRate, lastRunAt, steps) |

## New Service Functions (`services/dashboard.ts`)

| Function | Endpoint |
|----------|----------|
| `fetchMacroOpportunities()` | GET `/api/macro/opportunities` |
| `fetchMacroRisk()` | GET `/api/macro/risk` |
| `fetchPipelineStatus()` | GET `/api/pipeline/status` |
| `fetchPipelineMetrics()` | GET `/api/pipeline/metrics` |
| `runPipeline()` | POST `/api/pipeline/run` |
| `resetPipeline()` | POST `/api/pipeline/reset` |

## New Hooks (`hooks/use-dashboard.ts`)

| Hook | Query Type | Key |
|------|-----------|-----|
| `useMacroOpportunities` | `useQuery` | `['macro-opportunities']` |
| `useMacroRisk` | `useQuery` | `['macro-risk']` |
| `usePipelineStatus` | `useQuery` | `['pipeline-status']`, refetch 15s |
| `usePipelineMetrics` | `useQuery` | `['pipeline-metrics']`, refetch 30s |
| `useRunPipeline` | `useMutation` | invalidates `['pipeline-status']` |
| `useResetPipeline` | `useMutation` | invalidates `['pipeline-status']` |

All hooks re-exported from `hooks/index.ts`.

## Sidebar Navigation

3 new items added to `sidebar.tsx`:

| Label | Route | Icon |
|-------|-------|------|
| Global Indicators | `/global-indicators` | `Globe` |
| Pipeline Status | `/pipeline-status` | `Activity` |
| Production Observability | `/production-observability` | `Monitor` |

## Test Coverage

10 new test files (all passing):

- **Widget tests (6)**: macro-score, market-regime, sector-impact, global-markets, central-bank-tone, risk-appetite
- **Page tests (4)**: macro-intelligence, global-indicators, pipeline-status, production-observability

Test runner: `pnpm test` (npm is broken on this machine — SemVer dedupe bug).

## Package Manager

Switched from npm to pnpm due to an unpatched npm SemVer dedupe bug causing infinite resolution loops. All dependency scripts use `pnpm` exclusively.

## File Manifest

### New Backend
- `apps/api/src/modules/pipeline-orchestrator/pipeline-orchestrator.controller.ts`
- `apps/api/src/modules/pipeline-orchestrator/pipeline-orchestrator.module.ts`

### New Frontend Pages
- `frontend/src/app/global-indicators/page.tsx`
- `frontend/src/app/pipeline-status/page.tsx`
- `frontend/src/app/production-observability/page.tsx`

### Enhanced Frontend Pages
- `frontend/src/app/macro-opportunities/page.tsx`
- `frontend/src/app/macro-risk/page.tsx`
- `frontend/src/app/page.tsx`

### Data Layer
- `frontend/src/types/dashboard.ts` — 6 new types
- `frontend/src/services/dashboard.ts` — 6 new functions
- `frontend/src/hooks/use-dashboard.ts` — 6 new hooks

### Navigation
- `frontend/src/components/layout/sidebar.tsx` — 3 new routes

### Tests (10)
- `frontend/src/components/widgets/macro/__tests__/macro-score-widget.test.tsx`
- `frontend/src/components/widgets/macro/__tests__/market-regime-widget.test.tsx`
- `frontend/src/components/widgets/macro/__tests__/sector-impact-widget.test.tsx`
- `frontend/src/components/widgets/macro/__tests__/global-markets-widget.test.tsx`
- `frontend/src/components/widgets/macro/__tests__/central-bank-tone-widget.test.tsx`
- `frontend/src/components/widgets/macro/__tests__/risk-appetite-widget.test.tsx`
- `frontend/src/app/macro-intelligence/__tests__/page.test.tsx`
- `frontend/src/app/global-indicators/__tests__/page.test.tsx`
- `frontend/src/app/pipeline-status/__tests__/page.test.tsx`
- `frontend/src/app/production-observability/__tests__/page.test.tsx`

---

## ADR-057: Production Dashboard & Macro Intelligence UI Finalization

**Status**: Accepted (2025-07-29)
**Applies to**: F14-005C

### Context

The Production Dashboard needed three additional pages (Global Indicators, Pipeline Status, Production Observability), enhanced macro pages with opportunity/risk tables, a homepage macro overview, a backend Pipeline Orchestrator controller, and test coverage — all without modifying existing engines, scoring, ranking, or folder structure.

### Decision

1. **No engine modifications**: All new features are frontend pages, widgets, hooks, services, types, and a single new backend controller. No existing backend engine was changed.

2. **Pipeline Orchestrator as controller only**: The new controller exposes 4 endpoints for pipeline observability (status, metrics, run, reset). It does not replace or modify the existing Scheduler or Workflow systems.

3. **PageHeader import fix**: All macro pages import `PageHeader` from `@/components` (barrel re-export) instead of the non-existent `@/components/ui/page-header`. This fixes a pre-existing import path error.

4. **pnpm adoption**: npm's SemVer dedupe bug (unpatched) causes infinite resolution loops on this machine. pnpm provides compatible dependency resolution without workarounds.

### Consequences

- **Positive**: Complete Production Dashboard with 10 passing tests. No regressions in existing engines. All macro pages have correct imports. Pipeline observability available via 4 REST endpoints. Sidebar navigation for all new pages.
- **Negative**: Pipeline endpoints return mock data until the full pipeline implementation connects. 7 pre-existing test files still fail (unrelated Recharts/stock-detail/portfolio-summary tests).
- **Migration path**: Connect Pipeline Orchestrator to the real Workflow pipeline. Fix pre-existing test failures (Recharts rendering in jsdom, stock mock service, portfolio text matching).

---

# Chapter 26 — Production Runtime Integration (F14-FINAL)

## Purpose

Connect every finished engine into one continuous, observable, real-time pipeline. The PipelineOrchestratorService orchestrates all 10 stages (market data → normalize → aggregate → AI analysis → opportunity detection → scanner → ranking → alerts → portfolio → macro) with graceful fallback when services are unavailable. WebSocket provides real-time event streaming to the frontend. Scheduler jobs are registered once in `onModuleInit`. The frontend has a Socket.IO client hook that bridges pipeline events to Zustand stores and notification toasts.

## Architecture

```
Scheduler (cron)
    │
    ▼
FullPipelineRunJob ──► PipelineOrchestratorService.runFullPipeline()
    │                       │
    │                       ├── fetch_market_data      ──► MarketDataService (optional │ fallback)
    │                       ├── normalize              ──► fallback
    │                       ├── aggregate              ──► AggregationEngine (optional │ fallback)
    │                       ├── ai_analysis            ──► AnalysisService + AiAnalysisPipeline (optional │ fallback)
    │                       ├── opportunity_detection   ──► OpportunityDetectionEngine (optional │ fallback)
    │                       ├── scanner                ──► ScannerEngine (optional │ fallback)
    │                       ├── ranking                ──► RankingEngine (optional │ fallback)
    │                       ├── alerts                 ──► AlertEngine (optional │ fallback)
    │                       ├── portfolio_refresh      ──► PortfolioEngine (optional │ fallback)
    │                       └── macro_refresh          ──► MacroService (optional │ fallback)
    │
    ▼
PipelineGateway (Socket.IO /pipeline namespace)
    │
    ├── pipeline:run         ──► RealtimeProvider (frontend)
    ├── pipeline:step        ──► useNotificationStore
    ├── ranking:update       ──► useEventsStore
    ├── macro:update         ──► NotificationToast
    ├── alert:update         ──► Zustand stores
    ├── portfolio:update
    ├── scheduler:event
    └── provider:status
```

## Backend Integration

### PipelineOrchestratorService

Injects 11 real services via optional `@Inject(Optional())` with graceful fallback:

| Service | Token | Fallback Behavior |
|---------|-------|------------------|
| MarketDataService | `MarketDataService` | Returns empty `Map` |
| AggregationEngine | `AggregationEngine` | Returns bare `AggregatedData` |
| AnalysisService | `AnalysisService` | Returns bare `AnalysisResult` |
| AiAnalysisPipeline | `AiAnalysisPipeline` | Returns bare `AiAnalysisResult` |
| OpportunityDetectionEngine | `OpportunityDetectionEngine` | Returns empty `OpportunityResult[]` |
| ScannerEngine | `ScannerEngine` | Returns empty `ScannerResult[]` |
| RankingEngine | `RankingEngine` | Returns empty `RankedOpportunity[]` |
| AlertEngine | `AlertEngine` | No-op |
| PortfolioEngine | `PortfolioEngine` | No-op |
| MacroService | `MacroService` | No-op |
| PipelineGateway | `PipelineGateway` | Events silently dropped |

Service resolution: `@Inject(Optional()) private readonly marketDataService?: MarketDataService`.

### PipelineOrchestratorModule

Imports 10 modules — one for each service it may inject:

`MarketDataModule`, `AnalysisPipelineModule`, `AiAnalysisModule`, `OpportunityDetectionModule`, `ScannerModule`, `RankingModule`, `AlertsModule`, `MacroModule`, `PortfolioModule`, `WebSocketGatewayModule`.

### FullPipelineRunJob

Scheduler job registered as `fullPipelineRun` in `scheduler.config.ts`:
- **Interval**: `0 0 * * * *` (every hour)
- **Enabled**: `true`
- **Description**: `Full pipeline: market data → normalize → aggregate → AI analysis → opportunity detection → scanner → ranking → alerts → portfolio refresh → macro refresh`

Executed by `FullPipelineRunJob.execute()` which calls `PipelineOrchestratorService.runFullPipeline()`.

### WebSocket Gateway (PipelineGateway)

Socket.IO gateway on `/pipeline` namespace with CORS `*`. Emits 8 event types:

| Method | Event | Payload |
|--------|-------|---------|
| `emitPipelineRun` | `pipeline:run` | `{status, totalSteps, durationMs, timestamp}` |
| `emitPipelineStep` | `pipeline:step` | `{step, status, durationMs, timestamp}` |
| `emitRankingUpdate` | `ranking:update` | `{symbols, count, timestamp}` |
| `emitMacroUpdate` | `macro:update` | `{indicators, source, timestamp}` |
| `emitAlertUpdate` | `alert:update` | `{alertId, severity, message, timestamp}` |
| `emitPortfolioUpdate` | `portfolio:update` | `{holdings, totalValue, timestamp}` |
| `emitSchedulerEvent` | `scheduler:event` | `{jobName, status, timestamp}` |
| `emitProviderStatus` | `provider:status` | `{provider, status, timestamp}` |

All events include an ISO timestamp. Gateway gracefully handles missing `server` reference.

### Scheduler Job Registration Fix

`SchedulerModule.onModuleInit()` now calls `engine.registerJob(name, job)` for all 13 jobs using `ModuleRef.get()`:

`marketOpenScan`, `incrementalScan`, `nightlyBacktest`, `benchmark`, `ruleAnalytics`, `weightOptimization`, `cacheRefresh`, `providerHealthCheck`, `macroRefresh`, `portfolioRefresh`, `alertRefresh`, `retryFailedJobs`, `fullPipelineRun`.

Previously, jobs were only registered if the `SchedulerController` was hit — now they register on module init, ensuring production execution.

### AppModule Final Structure

All 16 modules registered once in dependency order:

1. LoggerModule, ConfigModule — Infrastructure
2. PrismaModule, CacheModule, PersistenceModule — Data
3. MarketDataModule, ProviderHealthMonitorModule — Providers
4. AnalysisPipelineModule, AiAnalysisModule — Analysis
5. OpportunityDetectionModule, ScannerModule, RankingModule — Core Engines
6. AlertsModule — Output
7. PipelineOrchestratorModule — Pipeline
8. WorkflowModule, SchedulerModule — Orchestration
9. MacroModule, PortfolioModule — Domain
10. EventBusModule, PerformanceMonitorModule, AuditLogModule — Observability
11. WebSocketGatewayModule — Real-time

## Frontend Integration

### Dependencies

- `socket.io-client` ^4.8.3 (added to `apps/web/package.json`)
- Vite proxy configured for `/socket.io` → `http://localhost:3001` with `ws: true`

### useWebSocket Hook

Located at `apps/web/src/hooks/useWebSocket.ts`. Manages:

- **Connection**: `io('/pipeline')` with `transports: ['websocket', 'polling']`
- **Reconnection**: 10 attempts, 2s delay, auto-reconnect
- **State**: `isConnected` boolean reactive state
- **Subscribe**: `subscribe(event, callback)` returns unsubscribe function
- **Lifecycle**: Connects on mount, disconnects on unmount

### RealtimeProvider Component

Located at `apps/web/src/components/realtime/realtime-provider.tsx`. Wires all 8 WebSocket events to:

| Event | Notification | EventStore Entry |
|-------|-------------|-----------------|
| `pipeline:run` | `Pipeline Completed` | `pipeline` category |
| `pipeline:step` | `Pipeline Step: {step}` | `pipeline` category |
| `ranking:update` | `Rankings Updated` | `scanner` category |
| `macro:update` | `Macro Data Updated` | `macro` category |
| `alert:update` | `Alert Triggered` | `alerts` category |
| `portfolio:update` | `Portfolio Updated` | `portfolio` category |
| `scheduler:event` | `Scheduler: {jobName}` | `scheduler` category |
| `provider:status` | `Provider Status Update` | `providers` category |

Uses `useNotificationStore.addNotification()` for toast alerts and `useEventsStore.addEvent()` for event history (capped at 500 entries).

Wrapped in `App.tsx` inside `QueryClientProvider`:
```tsx
<QueryClientProvider client={queryClient}>
  <RealtimeProvider>
    <BrowserRouter>...</BrowserRouter>
  </RealtimeProvider>
</QueryClientProvider>
```

### EventsStore Enhancement

Added `addEvent(event: EventItem)` to `useEventsStore` for incremental event appending (previously only supported `setEvents` bulk replacement). Events are prepended with a cap of 500 entries.

## Vite Proxy Configuration

```ts
'/socket.io': {
  target: 'http://localhost:3001',
  ws: true,
  changeOrigin: true,
}
```

This allows the frontend dev server to proxy Socket.IO connections (both HTTP long-polling and WebSocket upgrade) to the NestJS backend.

## Test Coverage

### New Integration Tests

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `pipeline-orchestrator.integration.spec.ts` | 10 | Sequential/concurrent runs, metrics validation, reset, per-step durations, error handling |
| `websocket-gateway.spec.ts` | 10 | All 8 emit methods, timestamp injection, graceful undefined server |
| `scheduler.integration.spec.ts` | 8 | Module compilation, config validation, job registration, enable/disable, status, start/stop |

### Updated Tests

- `scheduler-integration.spec.ts` (pre-existing): Updated `toHaveLength(12)` → `Object.keys(DEFAULT_SCHEDULER_CONFIG.jobs).length` to account for `fullPipelineRun` job

### Build Verification

- `pnpm build` succeeds with 0 TypeScript errors across all 8 packages
- `pnpm --filter=@bist-elite/api test` — all pipeline-orchestrator, websocket-gateway, and scheduler integration tests pass

## Known Limitations

- **MacroDataService**: Since R1-002B it consumes the real Market Data Layer via `MarketDataOrchestrator.fetchMacroIndicators()` — Fintables, Finnhub, and TCMB/EVDS. No fallback constants remain. MKK ownership data requires credentials and degrades to null otherwise. Since R1-002B FINAL the orchestrator also exposes `fetchTcmbInterestDecisions()` (cached 6h, circuit-breaker protected) feeding the TCMB decision capture flow.
- **Dashboard Data Refresh**: WebSocket events add notifications and event log entries but do not auto-refresh dashboard KPI cards. Pages must still call REST endpoints for full data refresh.
- **Frontend WebSocket Test Coverage**: No unit tests for `useWebSocket` or `RealtimeProvider`. These require Socket.IO server mocking.

## File Manifest

### New Backend
- `apps/api/src/modules/pipeline-orchestrator/pipeline-orchestrator.service.ts` (rewritten with 11 service injections)
- `apps/api/src/modules/pipeline-orchestrator/pipeline-orchestrator.module.ts` (10 module imports)
- `apps/api/src/modules/websocket-gateway/websocket-gateway.ts` (PipelineGateway, 8 emit methods)
- `apps/api/src/modules/websocket-gateway/websocket-gateway.module.ts` (standalone module)
- `apps/api/src/modules/scheduler/jobs/full-pipeline-run.job.ts` (hourly pipeline execution)

### New Frontend
- `apps/web/src/hooks/useWebSocket.ts` (Socket.IO connection hook)
- `apps/web/src/components/realtime/realtime-provider.tsx` (WebSocket → Zustand bridge)

### New Tests (28)
- `apps/api/src/modules/pipeline-orchestrator/__tests__/pipeline-orchestrator.integration.spec.ts` — 10 tests
- `apps/api/src/modules/websocket-gateway/websocket-gateway.spec.ts` — 10 tests
- `apps/api/src/modules/scheduler/__tests__/scheduler.integration.spec.ts` — 8 tests

### Modified Files
- `apps/api/src/modules/scheduler/scheduler.module.ts` — `onModuleInit` job registration
- `apps/api/src/modules/scheduler/jobs/portfolio-refresh.job.ts` — injects `PortfolioEngine`
- `apps/api/src/modules/scheduler/jobs/alert-refresh.job.ts` — uses `AlertEngine` + pipeline-ranked opportunities
- `apps/api/src/modules/scheduler/scheduler.config.ts` — `fullPipelineRun` job config
- `apps/api/src/modules/workflow-integration/workflow-integration.config.ts` — added `full_pipeline: 'HIGH'`
- `apps/api/src/app.module.ts` — full 16-module list
- `apps/web/src/hooks/useWebSocket.ts` — created
- `apps/web/src/components/realtime/realtime-provider.tsx` — created
- `apps/web/src/App.tsx` — wrapped RealtimeProvider
- `apps/web/src/stores/events-store.ts` — added `addEvent`
- `apps/web/vite.config.ts` — `/socket.io` proxy with `ws: true`

---

## ADR-058: Production Runtime Integration

**Status**: Accepted (2025-07-30)
**Applies to**: F14-FINAL

### Context

All individual engines (Market Data, Analysis, Opportunity Detection, Scanner, Ranking, Alerts, Portfolio, Macro) were implemented and tested in isolation. The Scheduler ran jobs but had a bug where jobs were never registered in production (only on controller hit). The frontend had no real-time data path. MacroDataService returned mock data. Build had TypeScript errors. AppModule was missing 6 modules.

### Decision

1. **Pipeline Orchestrator as sequential coordinator**: A single `PipelineOrchestratorService.runFullPipeline()` calls each engine in order (market data → normalize → aggregate → AI analysis → opportunity detection → scanner → ranking → alerts → portfolio → macro). All services are injected as optional with type-safe fallbacks. No new engine logic — pure orchestration.

2. **WebSocket as real-time event bus**: A single `PipelineGateway` on `/pipeline` namespace emits structured events for all 8 pipeline/scheduler/provider state changes. Frontend connects via Socket.IO client with auto-reconnect, subscribes to all events, and dispatches to Zustand stores.

3. **Scheduler registration in onModuleInit**: `SchedulerModule.onModuleInit()` registers all 13 jobs via `ModuleRef.get()` + `engine.registerJob()`. This is the only correct place for production job registration — controller endpoints are for manual triggers only.

4. **Frontend WebSocket hook with subscribe pattern**: `useWebSocket` returns `{isConnected, subscribe, connect, disconnect}`. Subscribe accepts event name + callback and returns an unsubscribe function. `RealtimeProvider` wires all 8 events to `useNotificationStore` (toast) and `useEventsStore` (event log).

5. **EventsStore addEvent method**: Added incremental event prepend with 500-entry cap. Previously only supported bulk replacement via `setEvents`.

6. **Vite proxy for Socket.IO**: `/socket.io` proxied with `ws: true` so the frontend dev server handles both HTTP and WS upgrades transparently.

7. **No engine modifications**: Pipeline, WebSocket, and frontend changes are integration-only. No existing engine, scoring, ranking, or folder structure was modified.

### Consequences

- **Positive**: Complete end-to-end pipeline with real-time frontend visibility. 13 scheduler jobs register in production. WebSocket provides real-time updates for all pipeline events. 28 new integration tests. Build succeeds with 0 TypeScript errors. Existing tests continue passing.
- **Negative**: MacroDataService still uses `Math.random()` (no real provider adapters connected). Frontend KPI cards not auto-refreshed on WebSocket events (require REST calls for full data). No WebSocket unit tests on frontend.
- **Migration path**: Connect MacroDataService to real adapters (Fintables, Finnhub, KAP, TCMB, Yahoo Finance, MKK). Add WebSocket-driven React Query invalidation for automatic dashboard refresh. Add frontend WebSocket hook unit tests with Socket.IO testing utilities.

---

# Chapter 27 — Production Deployment (F15-PRODUCTION)

## Purpose

Prepare the entire BIST Elite AI platform for production deployment using free cloud infrastructure. The goal is a one-command deploy from `git push` to running HTTPS service with monitoring, backups, CI/CD, and zero-touch rollback.

## Target Stack (Free Tier)

| Component | Service | Free Tier Limits |
|-----------|---------|------------------|
| Frontend | Cloudflare Pages or Vercel | 100k req/day, 500 builds/mo |
| Backend API | Railway or Render | 512 MB RAM, 15 GB bandwidth |
| Scheduler | Railway / Render background worker | Same as API |
| Database | Supabase PostgreSQL | 500 MB, 5 GB bandwidth |
| Redis | Upstash Redis | 100 MB, 10k commands/day |
| Monitoring | UptimeRobot | 50 monitors, 5 min interval |
| CI/CD | GitHub Actions | 2000 min/mo, 500 MB storage |
| Container Registry | GitHub Container Registry (ghcr.io) | 500 MB free, public images |
| Domain | Cloudflare DNS + SSL | Free plan with Universal SSL |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub                               │
│   push main ──► CI (lint, typecheck, test, build)       │
│                    │                                    │
│                    ▼                                    │
│   CD (Docker build + push to ghcr.io)                    │
│                    │                                    │
│                    ▼                                    │
│   Deploy Hook ──► Render / Railway                      │
│                    │                                    │
│                    ▼                                    │
│   Service starts ──► entrypoint.sh ──► migrate ──► api  │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
   Supabase PostgreSQL       Upstash Redis
   (connection pooling)      (TLS required)
```

## Startup Validation

A new startup validation step was introduced in `apps/api/src/common/validation/env-validator.ts`. On `main.ts` bootstrap, `validateEnvVars()` runs **before** the NestJS application is created, ensuring:

| Variable | Validation | Error on |
|----------|-----------|----------|
| `DATABASE_URL` | Non-empty string, matches `postgresql://...` pattern | Missing or invalid format |
| `REDIS_URL` | Non-empty string, matches `redis://...` pattern | Missing or invalid format |
| `JWT_SECRET` | Length >= 32 characters | Too short |
| `CORS_ORIGINS` | Non-empty string | Missing |
| `PORT` | Positive integer | Missing or non-numeric |
| `NODE_ENV` | One of `development`, `production`, `test` | Invalid value |
| `LOG_LEVEL` | One of `trace`, `debug`, `info`, `warn`, `error`, `fatal` | Invalid value |
| `SCHEDULER_ENABLED` | One of `true`, `false` | Invalid value |

Failure prints a descriptive error and exits the process immediately.

## Redis Production Configuration

The Redis client (`ioredis`) was reconfigured for production reliability:

| Setting | Before | After |
|---------|--------|-------|
| `retryStrategy` | `() => null` (no reconnect) | Exponential backoff: `min(attempt * 500, 5000)` — 10 attempts |
| `lazyConnect` | Not set (connect on instantiation) | `true` (explicit `client.connect()` after health check) |
| `reconnectOnError` | Not set | Retries on `READONLY` errors (failover) |
| `maxRetriesPerRequest` | Not set | `3` |

If `REDIS_URL` is unset, Redis is skipped entirely with an info log — the application continues without caching.

## Health Monitoring

The health endpoint (`/health`) now reports on 6 subsystems:

### HealthService Checks

| Check ID | Type | Statuses | Degraded When |
|----------|------|----------|---------------|
| `database` | `HealthCheckDatabase` | healthy / unhealthy | Query fails |
| `redis` | `HealthCheckRedis` | healthy / degraded | Ping fails or disabled |
| `memory` | `HealthCheckMemory` | healthy / degraded / unhealthy | Heap > 200 MB (degraded), > 500 MB (unhealthy) |
| `pipeline` | `HealthCheckPipeline` | healthy / degraded | Error rate > 10% (degraded), no jobs (degraded) |
| `scheduler` | `HealthCheckScheduler` | healthy / degraded | Any job failed or disabled (degraded) |
| `websocket` | `HealthCheckWebSocket` | healthy | Gateway not available (healthy — non-critical) |

All checks implement `HealthCheck` interface with `getStatus(): Promise<HealthStatus>`.

### Endpoints

| Endpoint | Purpose | Checks |
|----------|---------|--------|
| `GET /health` | Full system health | All 6 subsystems |
| `GET /health/ready` | Readiness probe | database, redis, pipeline, scheduler (all must be healthy) |
| `GET /health/live` | Liveness probe | memory, websocket (basic process health) |

## Security Hardening

### Existing (unchanged, already configured)

| Layer | Configuration |
|-------|--------------|
| Helmet | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| CORS | Whitelist from `CORS_ORIGINS` env var |
| Rate Limiting | NGINX: 30 req/s API, 60 req/s web, burst 50/100 |
| SSL | Cloudflare Universal SSL + NGINX certbot auto-renewal |
| Security Headers | NGINX: `X-XSS-Protection`, `X-Content-Type-Options`, `Strict-Transport-Security` |

### New in F15

| Change | File | Purpose |
|--------|------|---------|
| Compression middleware | `apps/api/src/main.ts` | Gzip API responses (`compression` package) |
| Startup env validation | `apps/api/src/common/validation/env-validator.ts` | Fail fast on missing/invalid config |
| Redis retry strategy | `apps/api/src/main.ts` | Exponential backoff reconnect |
| Redis lazy connect | `apps/api/src/main.ts` | Don't connect until explicitly needed |
| Health check registration | `apps/api/src/main.ts` | All 6 health checks registered programmatically |
| Pipeline/scheduler/WS health | `apps/api/src/common/monitoring/health.service.ts` | New `createPipelineHealthCheck`, `createSchedulerHealthCheck`, `createWebSocketHealthCheck` generators |

## CI/CD Pipeline

### Workflows

| Workflow | File | Trigger | Actions |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push/PR to main, develop | Lint, typecheck, build, unit tests |
| Deploy | `.github/workflows/deploy.yml` | Push to main | Docker build/push to ghcr.io → Render deploy hooks |
| Docker | `.github/workflows/docker.yml` | Push/PR to main, develop | Docker compose validation |
| Integration | `.github/workflows/integration.yml` | Push/PR to main, develop | Integration tests, smoke tests |
| Security | `.github/workflows/security.yml` | Push/PR + weekly | `pnpm audit`, secret scan, CodeQL |
| Release | `.github/workflows/release.yml` | Tag `v*` | GitHub release + changelog |

### Deploy Flow (deploy.yml)

1. **Build & Test** — pnpm install, Prisma generate, typecheck, lint, build, unit tests
2. **Docker Build & Publish** — Matrix build for `api`, `web`, `scheduler` images → pushed to `ghcr.io` with SHA + branch + latest tags
3. **Deploy to Cloud** — Triggers Render deploy hooks (API, Web, Scheduler) via HTTP POST

## Deployment Configuration

### New/Modified Files

| File | Status | Purpose |
|------|--------|---------|
| `apps/api/src/common/validation/env-validator.ts` | **New** | Startup environment validation |
| `apps/api/src/main.ts` | Modified | Compression, Redis retry, health checks, startup validation |
| `apps/api/src/common/monitoring/health.service.ts` | Modified | Pipeline, scheduler, WebSocket health check generators |
| `docs/DEPLOYMENT.md` | **New** | Complete deployment guide |
| `.github/workflows/deploy.yml` | **New** | CI/CD deploy workflow |

### Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `compression` | ^1.7.5 | Gzip response compression |
| `@types/compression` | ^1.7.5 | Type definitions |

## Rollback Procedure

1. **Render**: Dashboard → Deploys → select previous deploy → "Deploy existing image"
2. **Docker**: `docker pull ghcr.io/org/repo-api:sha-XXXXX` then re-tag and deploy
3. **Database**: `pg_restore` from `deploy/backup.sh` daily dump (30-day retention)
4. **Failed health checks**: Automatic — Render/Railway health probes restart unhealthy instances

## Known Limitations

- **No auto-scaling**: Free tier services have fixed resources. Horizontal scaling requires paid plans.
- **Redis connection limits**: Upstash free tier allows 20 concurrent connections — sufficient for single-instance.
- **Backup frequency**: Daily, not real-time. For lower RPO, upgrade to Supabase Pro (point-in-time recovery).
- **No CDN for API**: Static assets served via Cloudflare Pages with cache; API responses served directly.

## File Manifest

### New
- `apps/api/src/common/validation/env-validator.ts` — 8-variable startup validation
- `docs/DEPLOYMENT.md` — Full deployment guide with Render, Railway, Cloudflare Pages, Supabase, Upstash
- `.github/workflows/deploy.yml` — 3-stage CI/CD: build → Docker → deploy hooks

### Modified
- `apps/api/src/main.ts` — compression, env validation, Redis retry + lazyConnect + reconnectOnError, 6 health checks
- `apps/api/src/common/monitoring/health.service.ts` — 3 new health check generators

### Infrastructure (all pre-existing, no changes)
- `docker/Dockerfile.api` — multi-stage NestJS build
- `docker/Dockerfile.web` — multi-stage Vite build with nginx
- `docker/Dockerfile.scheduler` — standalone node runner
- `docker-compose.yml` — postgres + redis + api + scheduler + web
- `docker/nginx/nginx.conf` — SSL, rate limiting, security headers, compression, reverse proxy
- `deploy/backup.sh` — daily PostgreSQL + config + log backup
- `deploy/systemd/` — systemd service files for API, scheduler, worker
- `.github/workflows/` — 9 existing workflows (ci, docker, integration, security, release, etc.)

---

## ADR-059: Production Deployment

**Status**: Accepted (2025-07-30)
**Applies to**: F15-PRODUCTION

### Context

The BIST Elite AI platform had all engines implemented, integrated via pipeline, and wired to a real-time WebSocket frontend. However, the application was not deployable to production cloud infrastructure:

1. No startup validation — missing env vars would fail at random points or not at all.
2. Redis `retryStrategy` was `() => null` — first connection failure would permanently disconnect.
3. No health checks for pipeline, scheduler, or WebSocket subsystems.
4. No Gzip compression on API responses.
5. No CI/CD deployment workflow — Docker images were built but never published or deployed.
6. No deployment documentation — new operators had no guide for cloud setup.

### Decision

1. **Startup env validation**: A standalone `validateEnvVars()` function runs before `NestFactory.create()`. Validates format and presence of 8 critical variables. Fails fast with descriptive error messages. No dependency on NestJS — works even if DI fails.

2. **Redis with exponential backoff retry**: `retryStrategy` uses `min(attempt * 500, 5000)` for 10 attempts with `lazyConnect: true` (connect on first use) and `reconnectOnError` for `READONLY` errors (handles Redis failover). If `REDIS_URL` is unset, Redis is skipped cleanly.

3. **6 health checks**: Database, Redis, memory, pipeline, scheduler, WebSocket — all registered in `main.ts` via `healthService.registerCheck()`. Pipeline and scheduler checks created via generator functions in `HealthService` accepting optional status data arrays.

4. **Compression middleware**: `compression()` from npm `compression` package added to API middleware stack. Reduces JSON response size by ~70%.

5. **CI/CD deploy workflow**: 3-job workflow (build → Docker → deploy) triggered on push to main. Docker images pushed to `ghcr.io` with SHA + `latest` tags. Render deploy hooks called via `curl` POST for each service.

6. **Deployment documentation**: `docs/DEPLOYMENT.md` covers the full free-tier stack with step-by-step setup for Supabase, Upstash, Render/Railway, Cloudflare Pages, Cloudflare DNS, GitHub Actions, UptimeRobot, security, performance, and troubleshooting.

7. **No existing infra changes**: Dockerfiles, docker-compose.yml, NGINX config, systemd services, backup scripts, and 9 existing GitHub Actions workflows were left unchanged. All F15 changes are additive (new files) or minimal modifications (main.ts, health.service.ts).

### Consequences

- **Positive**: One-command deploy from `git push main`. Fail-fast startup catches misconfiguration immediately. Redis reconnects after transient failures. Health reporting covers all subsystems. API responses are compressed. Full deployment guide for new operators.
- **Negative**: No auto-scaling (free tier limitation). No multi-region redundancy. No paid monitoring (Sentry, DataDog). Redis connection retry adds ~25 seconds max delay before giving up.
- **Migration path**: Upgrade to paid Render/Railway plans for auto-scaling. Add Sentry for error tracking. Add DataDog or Prometheus for metrics. Replace UptimeRobot with Grafana Cloud.

---

# Chapter 28 — Final Product Completion

---

## Purpose

Chapter 28 documents the final product completion phase (F16-FINAL) of the BIST Elite AI platform. This phase added AI-powered user-facing features — chat assistant, investment reports, portfolio advisor, portfolio optimization — plus multi-market exchange metadata, frontend code splitting, consistent loading/error states, and final documentation.

All 10 core engines from F10–F14 remain unchanged. F16 changes are purely additive.

---

## New Modules

### 1. AI Assistant Module (`apps/api/src/modules/ai-assistant/`)

A natural language query engine that routes user questions to the appropriate analytical engine.

**Endpoints:**
- `POST /ai/chat` — Submit a question, get an AI-generated answer
- `GET /ai/suggestions` — Get suggested questions for the chat UI

**Architecture:**
```
User Question
     │
     ▼
QuestionAnalyzerService
     ├── Keyword matching (13+ keywords: rsi, momentum, portföy, sektör, makro, etc.)
     ├── Intent classification (analysis, portfolio, macro, opportunity, scanner, ranking, alert)
     └── Entity extraction (symbol, sector, metric)
     │
     ▼
AiAssistantService
     ├── Routes to ScannerEngine (scanner results)
     ├── Routes to RankingEngine (ranked opportunities)
     ├── Routes to PortfolioEngine (portfolio metrics)
     ├── Routes to MacroIntelligenceService (macro analysis)
     └── Routes to DataAggregationService (price/indicator analysis)
     │
     ▼
Markdown-formatted answer with:
  - Confidence score (0–100%)
  - Source engine name
  - Relevant data tables
  - Context (date, symbol, metric)
```

**Key design decisions:**
- Engines are injected via `@Optional()` decorator — if an engine is not in the module, the chat gracefully skips it rather than crashing.
- Keyword routing is simple but effective: 13 keywords map to 7 intents across 5 engines.
- Responses are markdown-formatted for both API consumers and direct frontend rendering.

### 2. Investment Report Service (`apps/api/src/modules/ai-assistant/`)

Generates structured investment reports for a given stock symbol and timeframe.

**Report sections:**
1. **Company Summary** — Basic company info (name, sector, market cap)
2. **Technical Analysis** — Trend analysis (MA40, MA100, BB), RSI, momentum assessment
3. **Financial Analysis** — Revenue, P/E, market cap, growth rate
4. **Opportunity Assessment** — Elite Score, signal count, opportunity grade
5. **Confluence Analysis** — Multi-timeframe consensus (1h, 4h, 1d, 1w)
6. **Macro Overview** — Market regime, sector sentiment
7. **Recommendation** — Rating-meter (Strong Buy → Strong Sell) with reasoning

**Key design decisions:**
- Reports are generated on-demand (no caching) — ensures fresh data for each query
- Generated as markdown with consistent sectioning for easy frontend rendering
- Confluence analysis uses the existing MacroEngine for multi-timeframe consensus signals
- Rating follows a 5-level scale: Strong Buy → Buy → Hold → Sell → Strong Sell

### 3. Portfolio Advisor Service (`apps/api/src/common/portfolio-optimization/`)

Analyzes portfolio health and provides actionable recommendations.

**Analysis dimensions:**
- **Concentration risk**: Top-holding concentration (% of total), threshold-based flags (>25% = high)
- **Sector imbalance**: Sector allocation vs diversification target, biggest over/under weights
- **Correlation analysis**: Pairwise correlation matrix of holdings, average portfolio correlation
- **Cash ratio**: Cash percentage vs target, drift detection
- **Volatility assessment**: Portfolio volatility metrics
- **Risk score**: Composite 0–100 risk score with classification (low/moderate/high/very high)

**Position-level recommendations:**
| Type | Trigger |
|------|---------|
| Reduce | >15% portfolio weight |
| Increase | <3% portfolio weight |
| Watch | >30% volatility |
| Hold | Default |
| Rebalance | Sector overconcentration |

### 4. Portfolio Optimization Service (`apps/api/src/common/portfolio-optimization/`)

Provides quantitative optimization metrics for portfolio construction.

**Metrics:**
- **Diversification Score** (0–100): Based on inverse of HHI (Herfindahl-Hirschman Index)
- **Sector Exposure**: Current allocation with suggested target allocation per sector
- **Risk Contribution**: Per-position risk contribution to total portfolio (position weight × volatility)
- **Expected Return**: Weighted average of position expected returns
- **Expected Volatility**: Portfolio volatility based on weighted position volatilities
- **Cash Ratio**: Suggested cash allocation based on risk score and market regime

### 5. Multi Market Module (`apps/api/src/modules/multi-market/`)

Exchange metadata for global market context.

**Endpoints:**
- `GET /markets/bist` — BIST exchange metadata (UTC+3, TRY, 100-lot multiples)
- `GET /markets/nasdaq` — NASDAQ metadata (UTC-5/UTC-4, USD, 1-lot)
- `GET /markets/nyse` — NYSE metadata (UTC-5/UTC-4, USD, 1-lot)

**Metadata per exchange:**
- Name, code, country, currency, timezone
- Trading hours (open/close with DST handling)
- Lot size (share multiples for BIST vs single shares for US)
- `isOpen` calculation based on current time vs trading hours
- Corporate actions: dividend yield, ex-dividend date, split history, buyback info
- Sector/industry classification lists
- Top companies by market cap

---

## Frontend Changes

### Code Splitting (`apps/web/src/App.tsx`)

All 17 routes + not-found page use `React.lazy()`:

```typescript
const Home = lazy(() => import('./pages/home'));
const Login = lazy(() => import('./pages/login'));
const Register = lazy(() => import('./pages/register'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Portfolio = lazy(() => import('./pages/portfolio'));
const Watchlist = lazy(() => import('./pages/watchlist'));
const Alerts = lazy(() => import('./pages/alerts'));
const Scanner = lazy(() => import('./pages/scanner'));
const Ranking = lazy(() => import('./pages/ranking'));
const Markets = lazy(() => import('./pages/markets'));
const AiAssistant = lazy(() => import('./pages/ai-assistant'));
const AiReports = lazy(() => import('./pages/ai-reports'));
const Reports = lazy(() => import('./pages/reports'));
const Backtest = lazy(() => import('./pages/backtest'));
const Settings = lazy(() => import('./pages/settings'));
const NotFound = lazy(() => import('./pages/not-found'));
```

All wrapped in `<Suspense fallback={<PageLoader />}>` with a centered spinner.

**Performance impact:**
- Initial bundle: ~396 kB (main chunk)
- Per-page chunks: 2–37 kB each (e.g., portfolio-DsD3om3e.js = 37 kB, watchlist-a_zXZFNs.js = 24 kB)
- 18 separate chunks, loaded on demand

### Loading States

**SkeletonCard** — Added to Portfolio and Watchlist pages:
- Displays when data is loading (simulated 300ms delay)
- 3-card skeleton grid + table skeleton for Portfolio
- 3-card skeleton grid for Watchlist
- Uses `animate-pulse` Tailwind class

**ErrorCard** — Added to Portfolio and Watchlist pages:
- Displays on fetch error with error message
- Retry button to re-trigger data fetch
- Red-tinted card with destructive icon

### Breadcrumb Route Labels

Added to `apps/web/src/components/layout/breadcrumb.tsx`:
- `/portfolio` → "Portföy"
- `/watchlist` → "İzleme Listesi"
- `/alerts` → "Uyarılar"
- `/ai-assistant` → "AI Asistan"
- `/ai-reports` → "AI Raporları"

### Bug Fix

**Alerts page** (`apps/web/src/pages/alerts.tsx`):
- Fixed: `useMemo` was used to trigger a side effect (calling `fetchAlerts()`)
- Fixed to: `useEffect` with proper dependency array
- Root cause: `useMemo` should be pure; side effects belong in `useEffect`

### CSS

Added `animate-fade-in` animation to page containers for smooth page transitions.

---

## ADR-060: Final Product Architecture

**Status**: Accepted (2026-07-30)
**Applies to**: F16-FINAL

### Context

The BIST Elite AI platform had all 10 core engines implemented (F10–F15) but was missing:
1. No AI-powered chat assistant for natural language queries.
2. No structured investment report generation.
3. No portfolio advisor with risk analysis and recommendations.
4. No portfolio optimization with diversification scoring and allocation suggestions.
5. No multi-market support (BIST only — no NASDAQ/NYSE metadata).
6. Frontend pages lacked consistent loading/error/empty states.
7. No code splitting — all pages loaded in a single bundle.
8. No final product documentation or release notes.
9. ESLint was not installed in any package — linting was unavailable.
10. Portfolio and Watchlist pages used raw demo data without loading states.

### Decision

1. **AI Chat Assistant**: `AiAssistantModule` with `QuestionAnalyzerService` (keyword/intent routing), `AiAssistantService` (routes to 5 engines), and REST controller at `POST /ai/chat`, `GET /ai/suggestions`. React chat UI with message history, typing indicator, suggestion chips.

2. **AI Investment Reports**: `InvestmentReportService` generating structured 7-section markdown reports. Frontend page with symbol/timeframe inputs and markdown export.

3. **AI Portfolio Advisor**: `PortfolioAdvisorService` analyzing concentration risk, sector imbalance, correlation, cash ratio, volatility, risk score with position-level recommendations. React UI with risk cards, recommendation list, sector breakdown.

4. **Multi Market Support**: `MultiMarketService` with exchange metadata for BIST, NASDAQ, NYSE — trading hours, timezone, currency, lot sizes, `isOpen` calculations.

5. **Portfolio Optimization**: `PortfolioOptimizationService` with diversification score, sector exposure, correlation matrix, risk contribution, suggested allocation, expected return/volatility, cash ratio suggestions. React UI with metric cards and sector comparison bars.

6. **Code splitting**: All 18 frontend routes use `React.lazy()` with per-page chunks. Each page loads on demand with centered spinner fallback.

7. **Consistent loading states**: `SkeletonCard` + `ErrorCard` for Portfolio and Watchlist. Fixed `useMemo` side-effect bug in Alerts page.

8. **Breadcrumb routes**: 5 missing route labels added.

9. **Documentation**: `docs/FINAL_RELEASE.md`, `docs/ADR-060-final-product-architecture.md`, Chapter 28. Updated `README.md` and `DEPLOYMENT.md`.

10. **No engine modifications**: All F16 changes are additive — no existing engine, scoring, ranking, pipeline, or scheduler logic was changed.

### Consequences

- **Positive**: Complete AI feature set. Multi-market metadata. Code splitting reduces initial page load. Consistent UI states. Full documentation. Build succeeds with 0 TypeScript errors. Existing tests continue passing.
- **Negative**: Portfolio/Watchlist still use demo data. ESLint not installed. Chat assistant skips missing engines gracefully. No i18n.
- **Migration path**: Connect portfolio/watchlist to real PortfolioEngine API. Install ESLint. Add WebSocket-driven React Query invalidation. Add multi-language support.

---

## Architecture Diagram (Final)

```
┌─────────────────────────────────────────────────────────────┐
│                     BIST Elite AI Platform                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │   WEB    │  │   API    │  │ TELEGRAM │  │   WORKER    │ │
│  │  (Vite)  │  │ (NestJS) │  │ (grammY) │  │  (FastAPI)  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
│       │             │             │               │         │
│       └─────────────┼─────────────┼───────────────┘         │
│                     │             │                         │
│                     ▼             ▼                         │
│            ┌──────────────────────────────┐                 │
│            │       API Gateway (NestJS)    │                │
│            └──────────────┬───────────────┘                 │
│                           │                                 │
│          ┌────────────────┼────────────────────┐            │
│          ▼                ▼                    ▼            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │  Core        │ │  F16 AI      │ │  Infrastructure  │   │
│  │  Engines     │ │  Modules     │ │                  │   │
│  │              │ │              │ │  Scheduler       │   │
│  │  Scanner     │ │  Chat       │ │  Pipeline        │   │
│  │  Ranking     │ │  Reports    │ │  WebSocket       │   │
│  │  Alert       │ │  Advisor    │ │  Health          │   │
│  │  Portfolio   │ │  Optimizer  │ │  Cache (Redis)   │   │
│  │  Macro       │ │  MultiMarket│ │  Rate Limiter    │   │
│  │  Analysis    │ │              │ │                  │   │
│  │  Aggregation │ │              │ │  PostgreSQL      │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Build & Test Status (F16 Final)

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 (all 5 packages) |
| Test suites (shared) | 77/77 PASS |
| API integration tests | All suites pass |
| Frontend unit tests | Pass |
| Code splitting | 18 chunks, ~396 kB main |
| Linting | ESLint not installed |
| Docker compose | Verified |

---

## File Manifest (F16)

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/ai-assistant/ai-assistant.module.ts` | Module definition |
| `apps/api/src/modules/ai-assistant/ai-assistant.service.ts` | Core routing logic |
| `apps/api/src/modules/ai-assistant/ai-assistant.controller.ts` | REST endpoints |
| `apps/api/src/modules/ai-assistant/question-analyzer.service.ts` | Intent/keyword routing |
| `apps/api/src/modules/ai-assistant/question-analyzer.service.spec.ts` | Unit tests |
| `apps/api/src/modules/ai-assistant/investment-report.service.ts` | Report generation |
| `apps/api/src/modules/ai-assistant/investment-report.service.spec.ts` | Unit tests |
| `apps/api/src/modules/ai-assistant/dto/chat-request.dto.ts` | Chat DTO |
| `apps/api/src/modules/ai-assistant/dto/chat-response.dto.ts` | Response DTO |
| `apps/api/src/modules/ai-assistant/dto/suggestions-response.dto.ts` | Suggestions DTO |
| `apps/api/src/modules/multi-market/multi-market.module.ts` | Module definition |
| `apps/api/src/modules/multi-market/multi-market.service.ts` | Exchange metadata |
| `apps/api/src/modules/multi-market/multi-market.controller.ts` | REST endpoints |
| `apps/api/src/common/portfolio-optimization/portfolio-optimization.service.ts` | Optimization logic |
| `apps/api/src/common/portfolio-optimization/portfolio-advisor.service.ts` | Advisor logic |
| `apps/api/src/common/portfolio-optimization/portfolio-optimization.service.spec.ts` | Unit tests |
| `apps/api/src/common/portfolio-optimization/portfolio-advisor.service.spec.ts` | Unit tests |
| `apps/web/src/pages/ai-assistant.tsx` | Chat page |
| `apps/web/src/pages/ai-reports.tsx` | Reports page |
| `apps/web/src/components/ai-assistant/chat-input.tsx` | Chat input component |
| `apps/web/src/components/ai-assistant/chat-message.tsx` | Message bubble component |
| `apps/web/src/components/ai-assistant/suggestion-chips.tsx` | Suggestion chips |
| `apps/web/src/components/portfolio/portfolio-advisor.tsx` | Advisor UI |
| `apps/web/src/components/portfolio/portfolio-optimization.tsx` | Optimization UI |
| `apps/web/src/components/ui/skeleton-card.tsx` | Loading skeleton |
| `apps/web/src/components/ui/error-card.tsx` | Error card |
| `docs/FINAL_RELEASE.md` | Final release document |
| `docs/ADR-060-final-product-architecture.md` | Architecture decision record |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Added AiAssistantModule, MultiMarketModule |
| `apps/web/src/App.tsx` | React.lazy code splitting for all routes |
| `apps/web/src/components/layout/sidebar.tsx` | AI Assistant, AI Reports nav items |
| `apps/web/src/components/layout/breadcrumb.tsx` | 5 new route labels |
| `apps/web/src/pages/portfolio.tsx` | SkeletonCard, ErrorCard states |
| `apps/web/src/pages/watchlist.tsx` | SkeletonCard, ErrorCard states |
| `apps/web/src/pages/alerts.tsx` | useMemo → useEffect fix |
| `apps/web/src/lib/sdk.ts` | SDK methods for new endpoints |
| `apps/web/src/pages/index.ts` | Page exports for lazy loading |
| `README.md` | Updated architecture, AI features |
| `docs/DEPLOYMENT.md` | Updated services, AI endpoints |

---

## Known Limitations (Final)

1. **Provider coverage is real but partial**: Macro indicators come from real adapters (Fintables, Finnhub, TCMB/EVDS). KAP (company, sector, disclosures) and MKK (ownership, credential-gated) are real integrations. Historical price data flows through Fintables/Finnhub. R1-002B FINAL delivers the Macro Elite Score, TCMB decision flow, confidence-only combined confidence, and dashboard DTOs — the frontend does not yet consume the dashboard bundle.
2. **Portfolio & Watchlist demo data**: Frontend pages use hardcoded examples rather than real PortfolioEngine API.
3. **No auto-scaling**: Free tier deployment has fixed resources.
4. **No WebSocket-driven auto-refresh**: Frontend requires manual REST calls.
5. **No multi-language**: UI is Turkish-only; codebase comments in English.
6. **No PWA**: No service worker, offline support, or mobile app.
7. **ESLint not installed**: Linting binaries missing from all packages — pre-existing issue, not introduced by F16.

---

*End of Architecture Bible — F16 FINAL*
