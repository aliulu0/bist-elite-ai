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
