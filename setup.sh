#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       NexOS — Quick Setup            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
  echo "⚠️  MongoDB not found locally."
  echo "   Option A: Install from https://www.mongodb.com/try/download/community"
  echo "   Option B: Use MongoDB Atlas free tier at https://cloud.mongodb.com"
  echo "   Option C: Run with Docker: docker-compose up mongo -d"
  echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
npm install --workspace=frontend
npm install --workspace=backend

# Setup .env if missing
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo ""
  echo "📝 Created backend/.env — please fill in:"
  echo "   MONGODB_URI  — your MongoDB connection string"
  echo "   JWT_SECRET   — any long random string"
  echo "   ANTHROPIC_API_KEY — from console.anthropic.com"
  echo ""
  echo "   Then run: npm run dev"
else
  echo "✅ backend/.env exists"
  echo ""
  echo "🚀 Starting NexOS..."
  npm run dev
fi
