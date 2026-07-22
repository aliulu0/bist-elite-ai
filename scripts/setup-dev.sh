#!/bin/bash

echo "Setting up BIST Elite AI development environment..."

# Backend setup
echo "Setting up backend..."
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Development environment setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
