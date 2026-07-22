#!/bin/bash

echo "Starting BIST Elite AI..."

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    docker-compose up --build
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose up --build
else
    echo "Docker is not installed. Starting in development mode..."
    
    # Start backend
    echo "Starting backend..."
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    echo "Starting frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo "Services started!"
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:3000"
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
fi
