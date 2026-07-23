#!/bin/bash

echo "Setting up BIST Elite AI development environment..."

# Install pnpm dependencies
echo "Installing dependencies..."
pnpm install

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/database
npx prisma generate
cd ../..

# Create .env from .env.development if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.development..."
    cp .env.development .env
fi

echo "Development environment setup complete!"
echo ""
echo "To start development:"
echo "  docker compose up -d    # Start PostgreSQL & Redis"
echo "  pnpm dev               # Start all apps in dev mode"
