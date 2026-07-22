# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within BIST Elite AI, please send an email to security@bist-elite-ai.com. All security vulnerabilities will be promptly addressed.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### What to Include

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Deployment**: Depends on severity (critical: 24-48h, high: 1 week, medium: 2 weeks)

## Security Best Practices

### Environment Variables

- Never commit `.env` files to the repository
- Use `.env.example` as a template
- Rotate secrets regularly
- Use different secrets for development and production

### API Security

- All API endpoints require authentication (when enabled)
- Rate limiting is enforced on all public endpoints
- Input validation is applied via class-validator
- SQL injection protection via Prisma ORM parameterized queries
- CORS is configured for allowed origins only

### Authentication

- JWT tokens with configurable expiration
- OAuth2 support (Google, GitHub, Microsoft)
- API key authentication
- Role-based access control (RBAC)
- Permission-based access control

### Data Protection

- Sensitive data is masked in logs
- Passwords are hashed with bcrypt
- Database connections use SSL in production
- Redis connections use TLS when available

## Scope

This security policy applies to:

- The NestJS API (`apps/api`)
- The Next.js frontend (`apps/web`)
- The Python worker (`apps/worker`)
- The Telegram bot (`apps/telegram`)
- Shared packages (`packages/*`)

## License

This security policy is part of the BIST Elite AI project, licensed under MIT.
