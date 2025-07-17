# QRT Closure Agent Platform - Local Setup Guide

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone/Download the Project

If you have Git access to this repository:
```bash
git clone <repository-url>
cd qrt-closure-platform
```

Or download the project files directly and extract them to your desired folder.

## Step 2: Install Dependencies

Navigate to the project directory and install all required packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`.

## Step 3: Database Setup

### 3.1 Create PostgreSQL Database

1. Start PostgreSQL service on your system
2. Create a new database:

```sql
CREATE DATABASE qrt_closure_platform;
CREATE USER qrt_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE qrt_closure_platform TO qrt_user;
```

### 3.2 Update Database Configuration

Edit the `.env` file and update the database URL:

```env
DATABASE_URL=postgresql://qrt_user:your_password@localhost:5432/qrt_closure_platform
```

## Step 4: Environment Configuration

### 4.1 Configure .env File

The `.env` file contains all necessary configuration. Update these values:

```env
# Database Configuration
DATABASE_URL=postgresql://qrt_user:your_password@localhost:5432/qrt_closure_platform

# AI Service API Keys (Required for AI features)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NODE_ENV=development
PORT=5000

# Security Configuration
SESSION_SECRET=your_random_session_secret_here
JWT_SECRET=your_random_jwt_secret_here

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_DIR=./uploads

# AI Configuration
DEFAULT_AI_MODEL=claude-3-sonnet-20240229
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=4000

# Feature Flags
ENABLE_AI_CLASSIFICATION=true
ENABLE_AI_JOURNAL_GENERATION=true
ENABLE_AI_ANOMALY_DETECTION=true
ENABLE_AI_COMPLIANCE_VALIDATION=true

# Logging
LOG_LEVEL=info
```

### 4.2 Get API Keys

**For OpenAI API Key (Required):**
1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Click "Create new secret key"
4. Replace `your_openai_api_key_here` with your actual key

**Note:** The platform now uses GPT-4 as the primary AI model instead of Anthropic's Claude, so you only need the OpenAI API key.

## Step 5: Database Migration

The platform is now configured to use Supabase PostgreSQL database instead of local PostgreSQL. No local database installation is required.

Run the database migrations to create all necessary tables:

```bash
npm run db:push
```

This will create all required tables in your Supabase database.

## Step 6: Create Upload Directory

Create the directory for file uploads:

```bash
mkdir uploads
```

## Step 7: Start the Application

Run the development server:

```bash
npm run dev
```

This will start both the backend server and frontend development server.

## Step 8: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api (if available)

## Step 9: Initial Setup

### 9.1 Create Test User

The application will automatically create a test user with these credentials:
- **Email**: testuser@example.com
- **Password**: TestPassword123!

### 9.2 Verify Setup

1. Login with the test credentials
2. Upload a sample document to test the system
3. Check that all features are working properly

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run db:push

# Generate database types
npm run db:generate

# Run tests (if available)
npm test
```

## Project Structure

```
qrt-closure-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Node.js backend
│   ├── services/           # Business logic
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── db.ts              # Database connection
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
├── uploads/               # File upload directory
├── .env                   # Environment configuration
├── package.json           # Dependencies
└── README.md              # Project documentation
```

## Features Available

✅ **Document Management** - Upload, classify, and process financial documents
✅ **AI Processing** - Automatic document classification and journal generation
✅ **Financial Reports** - Trial balance, P&L, balance sheet, cash flow
✅ **Compliance Checking** - GST and TDS compliance validation
✅ **Multi-tenant Support** - Multiple company support with data isolation
✅ **Authentication** - JWT-based secure authentication
✅ **Audit Trail** - Complete activity logging and tracking

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database and user exist

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill any existing process on port 5000

3. **Missing Dependencies**
   - Run `npm install` again
   - Delete node_modules and package-lock.json, then reinstall

4. **AI Features Not Working**
   - Verify API keys are correctly set in .env
   - Check API key permissions and quotas

### Getting Help

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check that PostgreSQL is running and accessible

## Production Deployment

For production deployment, you'll need to:
1. Set NODE_ENV=production
2. Configure a production database
3. Set up proper SSL certificates
4. Configure reverse proxy (nginx/apache)
5. Set up monitoring and logging

The application is ready for deployment on platforms like:
- Heroku
- AWS
- Google Cloud Platform
- DigitalOcean
- Vercel (frontend) + Railway (backend)

## Security Considerations

- Never commit .env file to version control
- Use strong, unique secrets for JWT_SECRET and SESSION_SECRET
- Regularly rotate API keys
- Enable HTTPS in production
- Set up proper database backup procedures
- Configure firewall rules for database access

## Support

For technical support or questions about the platform, refer to the project documentation or contact the development team.