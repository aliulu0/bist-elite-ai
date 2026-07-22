# Release Process

## Release Stages

### 1. Alpha (Internal Testing)
- Branch: `release/vX.Y.Z-alpha.N`
- Purpose: Internal team testing
- Duration: 1-2 weeks
- Exit Criteria: All critical bugs fixed

### 2. Beta (External Testing)
- Branch: `release/vX.Y.Z-beta.N`
- Purpose: External user testing
- Duration: 2-4 weeks
- Exit Criteria: All reported bugs fixed

### 3. Release Candidate (RC)
- Branch: `release/vX.Y.Z-rc.N`
- Purpose: Final validation
- Duration: 1 week
- Exit Criteria: No known critical bugs

### 4. Production
- Branch: `main`
- Purpose: Stable release
- Trigger: RC passes all tests

## Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Database migrations ready
- [ ] Security review completed
- [ ] Performance benchmarks acceptable
- [ ] Deployment scripts tested
- [ ] Rollback plan documented

## Deployment

### Development
```bash
git push origin develop
# Auto-deploys to dev environment
```

### Staging
```bash
git push origin release/vX.Y.Z
# Auto-deploys to staging environment
```

### Production
```bash
git tag vX.Y.Z
git push origin vX.Y.Z
# Auto-deploys to production environment
```

## Rollback

1. Revert to previous tag
2. Revert database migrations if needed
3. Notify team
4. Document incident
