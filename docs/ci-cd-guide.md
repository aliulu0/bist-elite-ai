# CI/CD Guide

## Overview

BIST Elite AI uses GitHub Actions for automated CI/CD pipelines.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Trigger**: Push to `main`/`develop`, Pull Requests

| Job | Purpose |
|-----|---------|
| Lint & Format | ESLint, Prettier validation |
| Type Check | TypeScript compilation |
| Unit Tests | API + Web test suites |
| Worker Tests | Python worker tests |
| Build | Full build verification |
| Quality Gate | Final validation |

### 2. Security (`security.yml`)

**Trigger**: Push, Pull Requests, Weekly schedule

| Job | Purpose |
|-----|---------|
| Dependency Audit | npm/pnpm audit |
| Secret Scan | TruffleHog scanning |
| License Check | License compliance |
| CodeQL Analysis | GitHub code scanning |

### 3. Docker (`docker.yml`)

**Trigger**: Push to `main`/`develop`, Tags, Pull Requests

| Job | Purpose |
|-----|---------|
| Docker Build | Image build validation (PRs) |
| Docker Publish | Build & push to GHCR (main) |
| Docker Compose Test | Full stack validation |

### 4. Release (`release.yml`)

**Trigger**: Version tags (`v*`)

| Job | Purpose |
|-----|---------|
| Validate | Version + CHANGELOG check |
| Build | Full build + test |
| Release | GitHub Release creation |

### 5. Label Sync (`label-sync.yml`)

**Trigger**: Push to `main` (labels.yml changes)

Syncs GitHub labels from configuration.

## Quality Gates

The CI pipeline enforces these quality gates:

| Gate | Requirement |
|------|-------------|
| Lint | Zero ESLint errors |
| Format | Prettier compliance |
| TypeCheck | Zero TypeScript errors |
| Tests | All tests pass |
| Build | Successful compilation |
| Security | No high/critical vulnerabilities |

## Branch Protection Rules

### `main` Branch

| Rule | Setting |
|------|---------|
| Require pull request | Yes |
| Required approvals | 1 |
| Require status checks | Yes |
| Required checks | `ci.yml / Quality Gate` |
| Require branches up to date | Yes |
| Require conversation resolution | Yes |
| Require linear history | Yes |
| Include administrators | Yes |

### `develop` Branch

| Rule | Setting |
|------|---------|
| Require pull request | Yes |
| Required approvals | 1 |
| Require status checks | Yes |
| Required checks | `ci.yml / Quality Gate` |

## Workflow Details

### Running Locally

```bash
# Lint
pnpm lint

# Format check
pnpm exec prettier --check "**/*.{ts,tsx,md}"

# Type check
pnpm --filter @bist-elite/api exec tsc --noEmit
pnpm --filter @bist-elite/web exec tsc --noEmit

# Tests
pnpm test

# Build
pnpm build
```

### Docker Build

```bash
# Build all images
docker compose build

# Build specific image
docker build -f docker/Dockerfile.api -t bist-api .

# Validate compose
docker compose config
```

### Security Scans

```bash
# npm audit
pnpm audit

# Secret scan (requires trufflehog)
trufflehog filesystem --only-verified .
```

## Artifacts

### Build Artifacts

- `apps/api/dist/` - Compiled API
- `apps/web/.next/` - Next.js build

### Test Reports

- API test results
- Web test results
- Coverage reports (7-day retention)

### Docker Images

Published to GitHub Container Registry:
- `ghcr.io/{owner}/bist-elite/api`
- `ghcr.io/{owner}/bist-elite/web`
- `ghcr.io/{owner}/bist-elite/worker`

## Troubleshooting

### CI Fails on Lint

```bash
# Auto-fix lint issues
pnpm lint --fix

# Check formatting
pnpm exec prettier --write "**/*.{ts,tsx,md}"
```

### CI Fails on TypeCheck

```bash
# Check types
pnpm --filter @bist-elite/api exec tsc --noEmit

# Regenerate Prisma client
pnpm --filter @bist-elite/database generate
```

### CI Fails on Tests

```bash
# Run tests locally
pnpm --filter @bist-elite/api test
pnpm --filter @bist-elite/web test

# Run with coverage
pnpm --filter @bist-elite/api test:cov
```

### Docker Build Fails

```bash
# Clean build
docker compose build --no-cache

# Check Docker Desktop resources
# Settings > Resources > Advanced > Memory: 4GB+
```

### Security Scan Fails

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix

# Force fix (may break things)
pnpm audit fix --force
```

## Adding New Workflows

1. Create `.github/workflows/new-workflow.yml`
2. Define triggers and jobs
3. Test on feature branch
4. Merge to develop, then main

## Best Practices

1. **Keep workflows fast** - Use caching, parallel jobs
2. **Fail fast** - Run critical checks first
3. **Use concurrency** - Cancel outdated runs
4. **Cache dependencies** - Use pnpm/action-setup cache
5. **Upload artifacts** - Save test results and coverage
6. **Use shields** - Add status badges to README
