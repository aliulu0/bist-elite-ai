# Environment Configuration Guide

## Environment Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.example` | Template with placeholder values | Yes |
| `.env.development` | Development defaults | Yes |
| `.env.production` | Production template | Yes |
| `.env` | Local overrides (gitignored) | No |
| `.env.local` | Local secrets (gitignored) | No |

## Priority Order

Environment variables are loaded in this order (last wins):

1. System environment variables
2. `.env` (root)
3. `.env.local` (root)
4. `.env.development` / `.env.production`
5. Application-specific `.env` files

## Required Variables

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `bist_elite_ai` | Database name |
| `DATABASE_URL` | `postgresql://...` | Full connection URL |

### Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | - | Secret for JWT tokens (REQUIRED) |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | Environment name |
| `APP_DEBUG` | `true` | Debug mode |
| `APP_LOG_LEVEL` | `info` | Log level |
| `PORT` | `3001` | API port |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API URL (client-side) |

### Worker

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKER_HOST` | `0.0.0.0` | Worker bind host |
| `WORKER_PORT` | `8000` | Worker port |

### Telegram (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | - | Bot token from @BotFather |

## Creating Your `.env` File

```powershell
# From development defaults
Copy-Item .env.development .env

# Edit with your values
notepad .env
```

## Security Rules

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Never use production secrets in development**
3. **Generate strong passwords for production**
4. **Rotate secrets regularly**
5. **Use different secrets per environment**

### Generating Secrets

```powershell
# Generate random JWT secret
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Environment-Specific Configurations

### Development

```env
APP_ENV=development
APP_DEBUG=true
APP_LOG_LEVEL=debug
POSTGRES_PASSWORD=postgres
JWT_SECRET=dev-secret-not-for-production
```

### Production

```env
APP_ENV=production
APP_DEBUG=false
APP_LOG_LEVEL=warning
POSTGRES_PASSWORD=<strong-random-password>
JWT_SECRET=<strong-random-64-char-string>
REDIS_PASSWORD=<strong-random-password>
```

## Docker Environment Variables

Docker containers use environment variables from:

1. `docker-compose.yml` (defaults)
2. `.env` file (overrides)
3. System environment variables (highest priority)

### Overriding in Docker

```powershell
# Override specific variable
$env:POSTGRES_PASSWORD="mypassword"; docker compose up -d

# Or use .env file
echo "POSTGRES_PASSWORD=mypassword" >> .env
docker compose up -d
```

## Validation

The application validates required environment variables at startup:

- Missing required variables will cause startup failure
- Invalid values will cause clear error messages
- Check logs if application fails to start

## Troubleshooting

### "DATABASE_URL not set"

```powershell
# Check if .env exists
Test-Path .env

# Copy from template
Copy-Item .env.development .env
```

### "JWT_SECRET is required"

```powershell
# Add to .env
echo "JWT_SECRET=$(python -c 'import secrets; print(secrets.token_urlsafe(64))')" >> .env
```

### Environment Variable Not Taking Effect

1. Check variable name (case-sensitive)
2. Check which `.env` file it's in
3. Restart the service
4. Check Docker: `docker compose exec api env`
