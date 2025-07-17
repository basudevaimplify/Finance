#!/bin/bash

# QRT Closure Platform - Local Setup Script
# This script helps you set up the project on your local machine

echo "🚀 QRT Closure Platform - Local Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL from https://www.postgresql.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your configuration."
    echo "📝 See LOCAL_SETUP_GUIDE.md for detailed instructions."
    exit 1
fi

echo "✅ Dependencies installed successfully!"

# Database setup instructions
echo ""
echo "🗄️  Database Setup:"
echo "1. Database pre-configured for Supabase (no local PostgreSQL needed)"
echo "2. DATABASE_URL already set in .env file"
echo "3. Run: npm run db:push"
echo ""

# API Keys setup
echo "🔑 API Keys Setup Required:"
echo "1. Get OpenAI API key from https://platform.openai.com/"
echo "2. Add the key to .env file"
echo "3. Platform now uses GPT-4 instead of Anthropic Claude"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo "Next steps:"
echo "1. Configure your .env file (see LOCAL_SETUP_GUIDE.md)"
echo "2. Database is pre-configured for Supabase"
echo "3. Run: npm run db:push"
echo "4. Run: npm run dev"
echo ""
echo "📖 For detailed instructions, see LOCAL_SETUP_GUIDE.md"