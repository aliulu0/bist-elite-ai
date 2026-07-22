# Code Review Guidelines

## Review Checklist

### Code Quality
- [ ] Code follows style guidelines
- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Variable names are descriptive
- [ ] No magic numbers/strings

### Testing
- [ ] Unit tests included
- [ ] Tests cover edge cases
- [ ] Tests are readable
- [ ] All tests pass

### Security
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] SQL injection prevented
- [ ] XSS protection implemented
- [ ] Authentication/authorization correct

### Performance
- [ ] No N+1 queries
- [ ] Caching implemented where needed
- [ ] No memory leaks
- [ ] Database indexes optimized

### Documentation
- [ ] Code comments for complex logic
- [ ] API documentation updated
- [ ] README updated if needed

## Merge Requirements

1. **Minimum 1 approval** from code owner
2. **All CI checks passing**
3. **No unresolved conversations**
4. **Tests passing locally**
5. **Documentation updated**

## Review Process

1. Author creates PR
2. Automated checks run
3. Reviewer assigned
4. Review comments addressed
5. Approve and merge

## Approval Policy

- **Bug fixes**: 1 approval required
- **Features**: 2 approvals required
- **Breaking changes**: 3 approvals required
- **Security fixes**: 2 approvals + security review
