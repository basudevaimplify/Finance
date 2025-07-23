# 🏦 QRT Closure Finance Platform

A comprehensive, AI-powered financial document processing and accounting system with automated journal generation.

## ⚡ Quick Start

### 1. **One-Command Setup**
```bash
# Run initial setup (first time only)
python3 setup.py
```

### 2. **Start the Application**
```bash
# Start both backend and frontend
python3 start.py

# Or start backend only
python3 start.py --backend-only
```

### 3. **Access the Application**
- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health
- **Frontend**: http://localhost:3000 (if started)

## 🎯 What This Platform Does

### 📄 **Document Processing**
- Upload PDF, Excel, CSV financial documents
- AI-powered data extraction using OpenAI
- Automatic document type detection
- Support for Indian GST compliance

### 📊 **Data Management**
- Structured storage in PostgreSQL
- Vendor invoices, sales register, purchase register
- Bank statement processing
- Real-time data validation

### 📝 **Journal Generation**
- Automated double-entry bookkeeping
- Indian chart of accounts
- GST input/output tax handling
- Journal validation and balancing

## 🧪 Testing the Platform

### Upload a Document
1. Go to http://localhost:8000/api/docs
2. Find **POST /api/documents/upload**
3. Click "Try it out"
4. Upload a sample file from `data/` directory
5. Check the response for document ID

### Generate Journal Entries
```bash
# Generate journal entries from uploaded documents
curl -X POST \
  -H "Authorization: Bearer demo-token" \
  http://localhost:8000/api/journal-entries/generate
```

### View Extracted Data
```bash
# View all extracted data
curl -H "Authorization: Bearer demo-token" \
  http://localhost:8000/api/extracted-data/
```

## 📁 Project Structure

```
finance-platform/
├── 🚀 start.py              # Start the application
├── ⚙️ setup.py              # Initial setup script
├── 🌐 main.py               # FastAPI application
├── 📊 app/                  # Backend application
│   ├── api/                 # API endpoints
│   ├── services/            # Business logic
│   └── middleware/          # Security & logging
├── 🎨 client/               # React frontend
├── 🗄️ shared/               # Database schema
├── 🧪 tests/                # Test files
├── 📋 migrations/           # Database migrations
└── 📄 data/                 # Sample test files
```

## 🔧 Configuration

### Environment Variables (`.env`)
```env
# Database
DATABASE_URL=postgresql://qrt_user:1@localhost:5432/qrt_closure

# Security
SECRET_KEY=qrt-finance-super-secret-key-2025
DEBUG=true
ENVIRONMENT=development

# AI Services (optional)
OPENAI_API_KEY=your-openai-api-key-here
```

## 🛠️ Manual Setup (if automated setup fails)

### 1. Install Dependencies
```bash
# System packages (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib python3-pip

# Python packages
pip3 install -r requirements.txt
```

### 2. Setup Database
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE qrt_closure;
CREATE USER qrt_user WITH PASSWORD '1';
GRANT ALL PRIVILEGES ON DATABASE qrt_closure TO qrt_user;
\q

# Run migrations
psql -U qrt_user -d qrt_closure -f migrations/add_financial_tables.sql
```

### 3. Start Application
```bash
# Start backend
python3 main.py

# Or with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🧪 Sample Data

The setup script creates sample files in the `data/` directory:
- `sample_sales_register.csv` - Sample sales data
- `sample_purchase_register.csv` - Sample purchase data

Use these files to test document upload and processing.

## 🔍 API Endpoints

### Document Management
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents/` - List documents
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete document

### Data Extraction
- `GET /api/extracted-data/` - Get extracted data
- `GET /api/extracted-data/summary/stats` - Extraction statistics
- `POST /api/extracted-data/{id}/reprocess` - Reprocess document

### Journal Entries
- `POST /api/journal-entries/generate` - Generate journal entries
- `GET /api/journal-entries/` - List journal entries
- `POST /api/journal-entries/validate` - Validate entries
- `DELETE /api/journal-entries/` - Delete all entries

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

**Port Already in Use**
```bash
# Kill process on port 8000
sudo lsof -t -i tcp:8000 | xargs kill -9
```

**Module Import Errors**
```bash
# Install dependencies
pip3 install -r requirements.txt
```

**Permission Errors**
```bash
# Fix upload directory permissions
chmod 755 uploads/
```

### Check Logs
```bash
# Application logs
tail -f logs/app.log

# System logs
journalctl -f
```

## 🚀 Production Deployment

For production deployment:
```bash
# Use the production deployment script
python3 deploy.py --environment production

# Or follow the detailed guide
cat PRODUCTION_DEPLOYMENT.md
```

## 📚 Documentation

- **API Documentation**: http://localhost:8000/api/docs (when running)
- **Production Deployment**: `PRODUCTION_DEPLOYMENT.md`
- **Project Summary**: `PROJECT_SUMMARY.md`

## 🆘 Need Help?

1. **Check Health**: http://localhost:8000/api/health
2. **View Logs**: `tail -f logs/app.log`
3. **Run Tests**: `python3 test_finance_platform.py`
4. **API Docs**: http://localhost:8000/api/docs

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ Health check returns "healthy" status
- ✅ API documentation loads at `/api/docs`
- ✅ Sample file uploads successfully
- ✅ Journal entries generate from uploaded data
- ✅ No errors in application logs

---

**Ready to process financial documents with AI! 🚀**
# test-
