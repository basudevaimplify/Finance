# Local Development Setup Guide

This guide will help you set up the QRT Closure Agent Platform for local development outside of Replit.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Git

## Installation Steps

### 1. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd qrt-closure-platform
npm install
```

### 2. Database Setup

**Option A: Local PostgreSQL**
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
```

**Option B: Cloud Database (Recommended)**
- Use a cloud PostgreSQL service like Supabase, Neon, or AWS RDS
- Get the connection string from your provider

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Database (replace with your database URL)
DATABASE_URL=postgresql://qrt_user:your_password@localhost:5432/qrt_closure

# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Development settings
NODE_ENV=development
PORT=5000
```

### 4. Database Schema Setup

```bash
# Push the database schema
npm run db:push
```

### 5. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Or production build
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## Features Available

- **Document Upload**: Upload Excel, CSV, and PDF financial documents
- **AI Classification**: Automatic document type detection using OpenAI
- **Journal Entry Generation**: AI-powered journal entry creation
- **Financial Reports**: Trial Balance, P&L, Balance Sheet, Cash Flow
- **Compliance Tracking**: Indian accounting standards compliance
- **Multi-tenant Support**: Secure data isolation

## Development Notes

### Authentication
The current setup uses a simplified authentication system for development. In production, you should implement proper JWT authentication.

### File Storage
Files are stored locally in the `uploads/` directory during development. For production, consider using cloud storage.

### Database Migrations
Use Drizzle ORM for database changes:
```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npm run db:push
```

### API Testing
The application includes comprehensive API endpoints:
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/documents/upload` - Document upload
- `GET /api/documents` - List documents
- `POST /api/journal-entries/generate` - Generate journal entries
- `GET /api/reports/trial-balance` - Trial balance report

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database URL format: `postgresql://user:password@host:port/database`
- Ensure user has proper permissions

### File Upload Issues
- Check upload directory permissions: `chmod 755 uploads/`
- Verify file size limits in configuration
- Ensure proper MIME type handling

### OpenAI API Issues
- Verify API key is valid and has sufficient credits
- Check network connectivity to OpenAI services
- Monitor rate limits and usage

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist/`
- Update dependencies: `npm update`

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