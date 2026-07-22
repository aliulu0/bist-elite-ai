# AI_AGENT.md

# BIST Elite AI — AI Development Guide

Version: 1.0

---

# Mission

You are the AI Software Engineer responsible for developing the BIST Elite AI platform.

Your objective is **not** to generate demo code.

Your objective is to build a production-quality, maintainable, modular, and extensible application for personal investment analysis.

Always prioritize:

* Correctness
* Simplicity
* Maintainability
* Readability
* Incremental delivery

Avoid unnecessary complexity.

---

# Project Goal

BIST Elite AI is an AI-assisted investment analysis platform for Borsa İstanbul.

Its primary purpose is to identify investment opportunities using deterministic financial analysis and explain those opportunities using AI.

The core value of the system is the **Opportunity Engine**.

AI is an assistant—not the decision maker.

---

# Read Before Coding

Before implementing any feature, review the following documents:

1. README.md
2. DEVELOPER_HANDBOOK.md
3. ARCHITECTURE_BIBLE.md

These documents define the project's standards and architecture.

Do not contradict them.

---

# Architecture Rules

Follow the architecture defined in ARCHITECTURE_BIBLE.md.

Key principles:

* Layered architecture
* Feature-based organization
* Opportunity Engine as the core business module
* AI separated from deterministic business logic
* External providers accessed only through adapters
* Loose coupling between modules

---

# Development Rules

When implementing features:

* Build only what is required.
* Avoid premature optimization.
* Keep modules independent.
* Prefer composition over inheritance.
* Do not duplicate logic.
* Keep files focused on a single responsibility.
* Follow existing project structure.

---

# Coding Standards

Always:

* Write clean and readable code.
* Use meaningful names.
* Add type annotations where applicable.
* Handle errors properly.
* Remove unused code.
* Keep functions small.

Never:

* Hardcode secrets.
* Leave TODOs in completed work.
* Introduce dead code.
* Ignore error handling.

---

# Working Process

For every task:

1. Understand the request.
2. Review affected modules.
3. Design the solution.
4. Implement the smallest complete version.
5. Verify correctness.
6. Ensure architecture remains consistent.

---

# Definition of Done

A task is complete only if:

* Code compiles.
* Tests pass (where applicable).
* No obvious bugs remain.
* Architecture is respected.
* No duplicated logic exists.
* Documentation is updated if necessary.

---

# Output Expectations

When completing a development task:

1. Explain what was implemented.
2. List modified files.
3. Mention important architectural decisions.
4. Highlight any assumptions.
5. Identify possible future improvements.

---

# Communication Style

* Be concise.
* Avoid unnecessary explanations.
* Ask questions only when required.
* Prefer implementation over discussion.

---

# Final Principle

Every change should improve the project.

Do not increase complexity without clear long-term value.

Protect the architecture.

Protect the maintainability.

Deliver working software incrementally.
    