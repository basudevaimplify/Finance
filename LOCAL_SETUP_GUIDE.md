# Local Development Setup Guide

This guide will help you set up the QRT Closure Agent Platform for local development outside of Replit.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or cloud)
- Git
- OpenAI API key

## 🚀 Quick Start (Local Environment)

### 1. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd qrt-closure-platform
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables (.env):**
```env
# Database - Replace with your PostgreSQL URL
DATABASE_URL=postgresql://username:password@localhost:5432/qrt_closure

# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Development settings
NODE_ENV=development
PORT=5000

# Session secret (change in production)
SESSION_SECRET=your_secret_session_key_here

# File uploads
MAX_FILE_SIZE=104857600
UPLOAD_DIR=uploads

# Authentication mode for local development
AUTH_MODE=simple
```

### 3. Database Setup Options

**Option A: Local PostgreSQL (Recommended for Development)**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE qrt_closure;
CREATE USER qrt_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE qrt_closure TO qrt_user;
\q

# Update your .env file
DATABASE_URL=postgresql://qrt_user:your_password@localhost:5432/qrt_closure
```

**Option B: Cloud Database**
- **Supabase** (Free tier available): https://supabase.com/
- **Neon** (Serverless PostgreSQL): https://neon.tech/
- **Railway** (Simple deployment): https://railway.app/
- **AWS RDS** (Production-ready): https://aws.amazon.com/rds/

**Option C: Docker PostgreSQL**
```bash
# Run PostgreSQL in Docker
docker run --name qrt-postgres \
  -e POSTGRES_DB=qrt_closure \
  -e POSTGRES_USER=qrt_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Update your .env file
DATABASE_URL=postgresql://qrt_user:your_password@localhost:5432/qrt_closure
```

### 4. Database Schema Setup

```bash
# Push the database schema to your database
npm run db:push
```

### 5. Start the Application

**Single Server Mode (Replit-style):**
```bash
# Development with hot reload (recommended)
npm run dev
```
Access at: `http://localhost:5000`

**Dual Server Mode (Separate Frontend/Backend):**
```bash
# Terminal 1: Start backend server
npm run dev:local

# Terminal 2: Start frontend dev server  
npm run dev:frontend
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### 6. Verify Installation

1. **Database Connection**: Check console for "PostgreSQL database connected"
2. **Upload Test**: Try uploading a CSV/Excel file
3. **AI Processing**: Verify OpenAI classification works
4. **Dashboard**: Check that statistics display correctly

## Features Available

- **Document Upload**: Upload Excel, CSV, and PDF financial documents
- **AI Classification**: Automatic document type detection using OpenAI
- **Journal Entry Generation**: AI-powered journal entry creation
- **Financial Reports**: Trial Balance, P&L, Balance Sheet, Cash Flow
- **Compliance Tracking**: Indian accounting standards compliance
- **Multi-tenant Support**: Secure data isolation

## 🛠️ Development Configuration

### Authentication System

**Local Development:**
- Uses simplified JWT-based authentication
- Demo user: `demo@example.com` / any password
- Auto-creates demo tenant and user records

**Replit Environment:**
- Uses Replit's OAuth authentication
- Automatically handles user sessions

### File Storage

**Development:**
- Files stored in local `uploads/` directory
- Automatically created on first upload

**Production:**
- Consider cloud storage (AWS S3, Google Cloud Storage)
- Update file handling in `server/routes.ts`

### Database Operations

```bash
# Create new migration
npx drizzle-kit generate

# Apply schema changes
npm run db:push

# Open database studio (GUI)
npm run db:studio
```

### API Testing
The application includes comprehensive API endpoints:
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/documents/upload` - Document upload
- `GET /api/documents` - List documents
- `POST /api/journal-entries/generate` - Generate journal entries
- `GET /api/reports/trial-balance` - Trial balance report

## 🔧 Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check PostgreSQL status (Linux)
sudo systemctl status postgresql

# Test connection manually
psql "postgresql://username:password@localhost:5432/database_name"

# Verify environment variable
echo $DATABASE_URL
```

**File Upload Issues:**
```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Check disk space
df -h
```

**OpenAI API Errors:**
- Verify API key: https://platform.openai.com/api-keys
- Check quota: https://platform.openai.com/usage
- Test with simple curl:
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

**Build/Runtime Errors:**
```bash
# Clean installation
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
npx tsc --build --clean

# Check Node.js version
node --version  # Should be 18+
```

### Local vs Replit Differences

| Feature | Local Environment | Replit Environment |
|---------|------------------|-------------------|
| Authentication | Simple JWT | Replit OAuth |
| Database | Your PostgreSQL | Environment-provided |
| File Storage | Local uploads/ | Local uploads/ |
| Port | 5000 (configurable) | 5000 (fixed) |
| SSL | Manual setup | Automatic |
| Domains | localhost | *.replit.app |

## Production Deployment

For production deployment, consider:
- Use environment-specific configuration
- Set up proper SSL/TLS certificates
- Configure reverse proxy (nginx/Apache)
- Set up monitoring and logging
- Use cloud storage for file uploads
- Implement proper authentication and authorization
- Set up database backups

## Support

For technical support or questions:
- Check the main README.md for architecture details
- Review the API documentation
- Check console logs for detailed error messages