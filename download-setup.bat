@echo off
echo.
echo 🚀 QRT Closure Platform - Local Setup
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL from https://www.postgresql.org/
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version

REM Create uploads directory
echo 📁 Creating uploads directory...
if not exist "uploads" mkdir uploads

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found. Please create it with your configuration.
    echo 📝 See LOCAL_SETUP_GUIDE.md for detailed instructions.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!

REM Database setup instructions
echo.
echo 🗄️  Database Setup:
echo 1. Database pre-configured for Supabase (no local PostgreSQL needed)
echo 2. DATABASE_URL already set in .env file
echo 3. Run: npm run db:push
echo.

REM API Keys setup
echo 🔑 API Keys Setup Required:
echo 1. Get OpenAI API key from https://platform.openai.com/
echo 2. Add the key to .env file
echo 3. Platform now uses GPT-4 instead of Anthropic Claude
echo.

REM Final instructions
echo 🎉 Setup Complete!
echo Next steps:
echo 1. Configure your .env file (see LOCAL_SETUP_GUIDE.md)
echo 2. Database is pre-configured for Supabase
echo 3. Run: npm run db:push
echo 4. Run: npm run dev
echo.
echo 📖 For detailed instructions, see LOCAL_SETUP_GUIDE.md
pause