#!/bin/sh
set -e

echo "==> Running Prisma migrate deploy..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma || {
  echo "==> Migrate deploy failed (no migrations or DB unreachable), falling back to prisma db push..."
  npx prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate
}

echo "==> Starting Scheduler..."
exec node dist/main-scheduler.js
