# QRT Closure Agent Platform - User Manual (Multitenant Architecture)

## Overview

The QRT Closure Agent Platform is a comprehensive multitenant financial automation platform that enables multiple companies to use the same system while maintaining complete data isolation and security. Built with Python/FastAPI backend and React frontend, the platform provides enhanced AI integration, improved performance, and enterprise-grade scalability for financial automation workflows.

## Getting Started

### System Requirements

**Python Backend:**
- Python 3.11 or higher
- PostgreSQL database
- Redis (optional, for background tasks)
- Anthropic API key (for AI agents)
- OpenAI API key (for alternative AI models)

**Frontend (Unchanged):**
- Node.js 18+ and npm
- Modern web browser
- React 18 compatible environment

### Installation

1. **Install Python Dependencies:**
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic pydantic pydantic-settings
   pip install python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv
   pip install pandas openpyxl PyPDF2 anthropic openai redis celery httpx jinja2 aiofiles
   ```

2. **Set Environment Variables:**
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   export ANTHROPIC_API_KEY="your_anthropic_key"
   export OPENAI_API_KEY="your_openai_key"
   export SECRET_KEY="your_jwt_secret"
   ```

3. **Run Database Migrations:**
   ```bash
   alembic upgrade head
   ```

4. **Start the Python FastAPI Server:**
   ```bash
   python run_python.py
   ```

The API will be available at `http://localhost:8000` with auto-generated documentation at `http://localhost:8000/api/docs`.

## Core Features

### 1. Multitenant Architecture

**Enterprise-Grade Multitenancy:**
- **Complete Data Isolation**: Each company's data is completely segregated
- **Tenant-Specific Access**: Users can only access data within their company
- **Subscription Management**: Support for Basic, Premium, and Enterprise plans
- **Role-Based Access Control**: Tenant-specific roles (admin, finance_manager, finance_exec, auditor, viewer)

**Supported Subscription Tiers:**
- **Basic**: Small businesses with essential features
- **Premium**: Mid-size companies with advanced reporting
- **Enterprise**: Large organizations with full compliance suite

**Company Management:**
- Company registration with CIN, GSTIN, PAN details
- Registered address and location management
- User management within tenant boundaries
- Custom configuration per company

### 2. Authentication System

**JWT-Based Authentication:**
- Secure token-based authentication
- HTTPBearer security scheme
- Session management with configurable expiration
- Password hashing with BCrypt

**Login Process:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
```

### 2. Onboarding Workflow

**4-Step Onboarding Process:**

1. **Company Setup**
   - Company name and basic information
   - PAN and GSTIN registration
   - Contact details and address

2. **Entity Configuration**
   - Multiple entity support
   - Entity-specific GSTIN and locations
   - Hierarchical entity relationships

3. **User Management**
   - Role-based access control
   - User permissions and privileges
   - Department assignments

4. **Calendar Setup**
   - Financial year configuration
   - Quarter definitions and due dates
   - Custom period settings

**API Endpoint:**
```bash
POST /api/onboarding
```

### 3. Document Processing Pipeline

**Supported File Types:**
- PDF documents
- Excel files (.xlsx, .xls)
- CSV files
- File size limit: 100MB

**Processing Workflow:**
1. **File Upload & Validation**
   - File type and size validation
   - Virus scanning (configurable)
   - Metadata extraction

2. **Document Classification**
   - AI-powered document type detection
   - Confidence scoring
   - Manual override options

3. **Data Extraction**
   - Structured data extraction
   - Table and text parsing
   - Financial data identification

4. **Validation & Verification**
   - Data integrity checks
   - Business rule validation
   - Compliance verification

**Upload API:**
```bash
POST /api/documents/upload
Content-Type: multipart/form-data
```

### 4. AI Agent Orchestration

**7 Specialized AI Agents:**

1. **ClassifierBot**
   - Document type classification
   - Confidence scoring and reasoning
   - Support for 8+ document types

2. **DataExtractor**
   - Structured data extraction
   - Table and form parsing
   - Financial data identification

3. **JournalBot**
   - Double-entry journal creation
   - Account code assignment
   - Balance verification

4. **GSTValidator**
   - GST compliance validation
   - GSTIN format checking
   - Tax rate verification

5. **TDSValidator**
   - TDS compliance validation
   - Rate and threshold checking
   - Form 26Q validation

6. **ConsoAI**
   - Financial statement consolidation
   - Inter-company eliminations
   - Multi-entity reporting

7. **AuditAgent**
   - Final audit checks
   - Compliance verification
   - Risk assessment

**Workflow Execution:**
```bash
POST /api/workflows/execute
{
  "workflow_id": "ClassifierBot",
  "document_id": "doc_123"
}
```

### 5. Compliance Engine

**GST Compliance:**
- GSTIN format validation (15-character format)
- HSN/SAC code verification
- Tax rate validation
- Input tax credit eligibility
- GSTR-2A/3B reconciliation

**TDS Compliance:**
- TDS rate verification
- Threshold limit checking
- TAN validation (10-character format)
- Form 26Q structure validation
- Quarterly return compliance

**Compliance Scoring:**
- Automated compliance score calculation
- Violation identification and reporting
- Recommendations for remediation
- Trend analysis and reporting

**API Endpoints:**
```bash
GET /api/compliance-checks
POST /api/compliance-checks
```

### 6. Financial Reporting

**Available Reports:**

1. **Trial Balance**
   - Account-wise debit and credit totals
   - Balance verification
   - Period-wise reporting

2. **Profit & Loss Statement**
   - Revenue and expense categorization
   - Gross profit calculation
   - Net income determination

3. **Balance Sheet**
   - Assets, liabilities, and equity
   - Current and non-current classification
   - Balance verification

4. **Cash Flow Statement**
   - Operating activities
   - Investing activities
   - Financing activities

**Report Generation:**
```bash
GET /api/financial-statements
POST /api/financial-statements/generate
```

### 7. Dashboard & Analytics

**Key Metrics:**
- Documents processed
- Active AI agents
- Validation errors
- Compliance score
- Onboarding completion status

**User Journey Tracking:**
- Step-by-step progress monitoring
- Completion rates
- Time-to-completion metrics
- User behavior analysis

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| GET | `/api/auth/user` | Current user information |

### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents` | List user documents |

### AI Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List available workflows |
| POST | `/api/workflows/execute` | Execute AI workflow |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance-checks` | List compliance checks |
| POST | `/api/compliance-checks` | Run compliance check |

### Financial Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/financial-statements` | List financial statements |
| POST | `/api/financial-statements/generate` | Generate statement |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/audit-trail` | Audit trail |

## Configuration

### AI Agent Configuration

Each AI agent can be individually configured:

```python
{
  "ClassifierBot": {
    "model": "claude-sonnet-4-20250514",
    "temperature": 0.3,
    "max_tokens": 4000,
    "enabled": True,
    "system_prompt": "You are a specialized document classifier..."
  }
}
```

### Database Configuration

SQLAlchemy configuration with connection pooling:

```python
DATABASE_URL = "postgresql://user:password@host:port/database"
```

### Security Configuration

JWT token configuration:

```python
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Validate connection credentials

2. **AI API Issues**
   - Verify ANTHROPIC_API_KEY is set
   - Check OpenAI API key validity
   - Monitor API rate limits

3. **File Upload Issues**
   - Check file size limits (100MB)
   - Verify supported file types
   - Ensure proper multipart encoding

4. **Authentication Issues**
   - Verify JWT token validity
   - Check SECRET_KEY configuration
   - Validate token expiration

### Performance Optimization

1. **Database Optimization**
   - Use connection pooling
   - Implement query optimization
   - Add appropriate indexes

2. **AI Service Optimization**
   - Implement response caching
   - Add rate limiting
   - Use async operations

3. **File Processing**
   - Implement async file operations
   - Add background task processing
   - Use Redis for task queuing

## Migration from Node.js Version

### Key Changes

1. **Authentication**: JWT tokens instead of Replit Auth
2. **Database**: SQLAlchemy instead of Drizzle ORM
3. **AI Integration**: Enhanced multi-model support
4. **File Processing**: Python-based document processing
5. **Performance**: Async FastAPI with better concurrency

### Migration Steps

1. **Export Data**: Export existing data from Node.js version
2. **Database Migration**: Run Alembic migrations
3. **Configuration**: Update environment variables
4. **Testing**: Verify all endpoints functionality
5. **Deployment**: Deploy Python FastAPI version

## Best Practices

### Development

1. **Code Organization**
   - Use proper project structure
   - Implement dependency injection
   - Follow PEP 8 style guide

2. **Testing**
   - Write unit tests for all services
   - Implement integration tests
   - Use pytest for testing framework

3. **Documentation**
   - Maintain API documentation
   - Document configuration options
   - Update user manual regularly

### Production Deployment

1. **Security**
   - Use HTTPS for all endpoints
   - Implement proper CORS policies
   - Regular security audits

2. **Monitoring**
   - Implement logging and monitoring
   - Set up health checks
   - Monitor API performance

3. **Backup**
   - Regular database backups
   - Document backup procedures
   - Test backup restoration

## Support

For technical support and issues:

1. **Check Logs**: Review application logs for errors
2. **API Documentation**: Refer to auto-generated docs at `/api/docs`
3. **Configuration**: Verify all environment variables
4. **Dependencies**: Ensure all Python packages are installed

## Conclusion

The Python/FastAPI refactoring provides enhanced performance, better AI integration, and improved scalability while maintaining all original functionality. The platform is now ready for production deployment with comprehensive features for financial automation and compliance management.