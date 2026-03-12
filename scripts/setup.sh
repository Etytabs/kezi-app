#!/bin/bash

echo "🚀 Setting up Kezi App..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install mobile dependencies
echo "📦 Installing mobile dependencies..."
cd mobile
npm install
cd ..

# Create .env if missing
if [ ! -f .env ]; then
  echo "📄 Creating .env from template..."
  cp .env.example .env
else
  echo "✅ .env already exists"
fi

# Start PostgreSQL if script exists
if [ -f backend/scripts/start-db.sh ]; then
  echo "🗄 Starting PostgreSQL..."
  bash backend/scripts/start-db.sh
fi

# Run database migrations
echo "🧱 Running database migrations..."
cd backend
npx drizzle-kit push
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1️⃣ Configure your .env"
echo "2️⃣ Start backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3️⃣ Start mobile app:"
echo "   cd mobile && npm start"