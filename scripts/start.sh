#!/bin/bash

echo "Starting BIST Elite AI..."

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    docker-compose up --build
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose up --build
else
    echo "Docker not found. Starting in development mode..."
    
    # Ensure dependencies are installed
    pnpm install
    
    # Start API
    echo "Starting API (NestJS)..."
    pnpm --filter @bist-elite/api dev &
    API_PID=$!
    
    # Start Web
    echo "Starting Web (Next.js)..."
    pnpm --filter @bist-elite/web dev &
    WEB_PID=$!
    
    # Start Worker
    echo "Starting Worker (FastAPI)..."
    cd apps/worker
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    WORKER_PID=$!
    cd ../..
    
    echo "Services started!"
    echo "API:     http://localhost:3001"
    echo "Web:     http://localhost:3000"
    echo "Worker:  http://localhost:8000"
    
    # Wait for processes
    wait $API_PID $WEB_PID $WORKER_PID
fi
