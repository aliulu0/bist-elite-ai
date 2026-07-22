# Branching Strategy

## Overview

BIST Elite AI uses a **Git Flow** branching strategy with feature branches.

## Branch Types

| Branch | Purpose | Lifetime | Merges Into |
|--------|---------|----------|-------------|
| `main` | Production-ready code | Permanent | — |
| `develop` | Integration branch | Permanent | `main` |
| `feature/*` | New features | Temporary | `develop` |
| `bugfix/*` | Bug fixes | Temporary | `develop` |
| `hotfix/*` | Critical production fixes | Temporary | `main` + `develop` |
| `release/*` | Release preparation | Temporary | `main` + `develop` |
| `experiment/*` | Experimental work | Temporary | None (deleted) |
| `docs/*` | Documentation updates | Temporary | `develop` |

## Branch Naming

```
feature/123-add-elite-score-api
bugfix/456-fix-cache-invalidation
hotfix/789-fix-security-vulnerability
release/v1.0.0
experiment/ml-model-testing
docs/update-api-documentation
```

Format: `<type>/<ticket-number>-<short-description>`

## Workflow

### Feature Development
1. Create feature branch from `develop`
2. Implement changes
3. Write tests
4. Create PR to `develop`
5. Code review
6. Merge to `develop`

### Bug Fix
1. Create bugfix branch from `develop`
2. Fix the bug
3. Write regression test
4. Create PR to `develop`
5. Code review
6. Merge to `develop`

### Hotfix
1. Create hotfix branch from `main`
2. Fix the critical issue
3. Write tests
4. Create PR to `main`
5. Code review
6. Merge to `main`
7. Cherry-pick to `develop`

### Release
1. Create release branch from `develop`
2. Bump version
3. Update CHANGELOG
4. Final testing
5. Create PR to `main`
6. Merge to `main`
7. Tag release
8. Merge to `develop`
