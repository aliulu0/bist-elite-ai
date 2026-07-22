# Contributing to BIST Elite AI

Thank you for your interest in contributing to BIST Elite AI!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Code Review](#code-review)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)

## Code of Conduct

Be respectful, inclusive, and professional.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Start infrastructure: `docker-compose up -d postgres redis`
5. Run migrations: `pnpm --filter @bist-elite/database prisma:migrate`
6. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

### 1. Pick an Issue
- Check GitHub Issues
- Comment on the issue
- Wait for assignment

### 2. Create Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/123-your-feature
```

### 3. Make Changes
- Write code
- Write tests
- Update documentation

### 4. Test Locally
```bash
pnpm lint
pnpm test
pnpm build
```

### 5. Create Pull Request
- Fill PR template
- Link related issues
- Request review

### 6. Address Feedback
- Respond to comments
- Make requested changes
- Push updates

### 7. Merge
- Squash and merge
- Delete feature branch

## Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/<ticket>-<desc>` | `feature/123-add-scanner` |
| Bug Fix | `bugfix/<ticket>-<desc>` | `bugfix/456-fix-cache` |
| Hot Fix | `hotfix/<ticket>-<desc>` | `hotfix/789-security-patch` |
| Release | `release/v<X.Y.Z>` | `release/v1.0.0` |
| Docs | `docs/<desc>` | `docs/update-api` |

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `docs`: Documentation
- `style`: Code style (formatting)
- `test`: Adding tests
- `build`: Build system
- `ci`: CI/CD changes
- `chore`: Maintenance
- `revert`: Revert commit

### Examples
```
feat(api): add elite score endpoint
fix(web): fix chart rendering issue
docs: update API documentation
test(api): add unit tests for scoring
```

## Pull Requests

### Requirements
- Clear description
- Link related issues
- Tests passing
- Documentation updated
- Code reviewed

### PR Template
```markdown
## Description
Brief description

## Changes
- Change 1
- Change 2

## Testing
- [ ] Tests pass
- [ ] Manual testing done

## Related Issues
Closes #123
```

## Code Review

- Minimum 1 approval required
- Address all comments
- No unresolved conversations
- CI checks passing

See [Code Review Guidelines](./docs/code-review.md).

## Style Guidelines

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- 2 spaces indentation
- Single quotes
- Semicolons

## Testing

- Write unit tests for new code
- Maintain >95% coverage
- Test edge cases
- Use descriptive test names

```bash
pnpm test              # Run all tests
pnpm --filter @bist-elite/api test  # Run API tests
```

## Questions?

- Open a GitHub Issue
- Start a GitHub Discussion
- Contact maintainers
