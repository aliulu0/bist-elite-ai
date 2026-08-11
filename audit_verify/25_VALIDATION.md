# 25. VALIDATION

> Complements `17_CONFIGURATION.md` (env validation) and `11_API_SURFACE.md` (DTO validation).

## 25.1 Layers

1. **HTTP DTO validation** — global `ValidationPipe` `{ whitelist, transform, forbidNonWhitelisted }`; `disableErrorMessages` in prod.
2. **Zod schemas** — `packages/shared` ships zod schemas; shared DTOs (DecisionDto, OpportunityDto, etc.) validated by Zod in engines/services.
3. **Env validation** — required-vars validation at boot.
4. **Business rules** — `financial-rules`, `contract-validator`, `rule-analytics`, `technical-rules`, `strategy-validation` modules enforce domain invariants.

## 25.2 Findings

1. **Two validation systems in parallel (class-validator + Zod):** both used; the boundary is not documented → a field change can require edits in both. Medium maintainability cost.
2. **Zod schemas in `shared` are the source of truth for engine DTOs** — good; HTTP layer re-declares with class-validator → duplication.
3. **`forbidNonWhitelisted`** means unknown query/body fields are rejected — good, strict.
4. **Production `disableErrorMessages`** hides validation reasons from clients (intended security posture but makes debugging harder; no error codes → M4 interplay).
5. **No schema versioning for SDK-generated types** vs Zod schemas — SDK generator emits types from Swagger, which can drift from Zod sources.

## 25.3 Verdict

Validation is strong at both transport and domain layers; the cost is dual-system duplication and drift risk between Swagger-generated SDK types and Zod truth.
