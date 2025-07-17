"""
QRT Closure Agent Platform - Python FastAPI Implementation
A comprehensive financial automation platform for quarterly closure processes
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import os
from datetime import datetime, timedelta
import json

# Import our modules
from app.database import get_db, init_db
from app.models import User, Document, ComplianceCheck, AuditTrail
from app.schemas import (
    UserCreate, UserResponse, DocumentCreate, DocumentResponse,
    OnboardingData, CompanyProfile, UserFlowEntry, CloseCalendar,
    DashboardStats, ComplianceCheckResponse, AuditTrailResponse
)
from app.auth import verify_token, create_access_token, get_current_user
from app.services.document_processor import DocumentProcessor
from app.services.ai_orchestrator import AIOrchestrator
from app.services.compliance_checker import ComplianceChecker
from app.services.financial_reports import FinancialReportsService
from app.config import settings
from app.api.ml_endpoints import router as ml_router
from app.api.mca_filing_endpoints import router as mca_router
from app.api.compliance_tutorial_endpoints import router as compliance_tutorial_router
from app.api.data_source_endpoints import router as data_source_router
from app.api.auth_endpoints import router as auth_router

# Initialize FastAPI app
app = FastAPI(
    title="QRT Closure Agent Platform",
    description="AI-powered financial compliance platform for quarterly closure processes",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize services
document_processor = DocumentProcessor()
ai_orchestrator = AIOrchestrator()
compliance_checker = ComplianceChecker()
financial_reports = FinancialReportsService()

# Include authentication endpoints
app.include_router(auth_router, tags=["Authentication"])

# Include ML endpoints
app.include_router(ml_router, prefix="/api", tags=["Machine Learning"])

# Include MCA filing endpoints
app.include_router(mca_router, prefix="/api", tags=["MCA Filing"])
app.include_router(compliance_tutorial_router)
app.include_router(data_source_router)

# Initialize database
@app.on_event("startup")
async def startup_event():
    await init_db()

# Authentication endpoints
@app.post("/api/auth/login")
async def login(credentials: dict, db: Session = Depends(get_db)):
    """User login endpoint"""
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # For demo purposes, accept any valid email/password combination
    # In production, you'd validate against the database
    if "@" in email and len(password) >= 1:
        # Create a mock user in the database if it doesn't exist
        from app.models import User
        from sqlalchemy.orm import Session
        
        existing_user = db.query(User).filter(User.email == email).first()
        if not existing_user:
            # Create user
            new_user = User(
                id=email.split("@")[0],  # Use email prefix as ID
                email=email,
                first_name="Demo",
                last_name="User"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
        
        access_token = create_access_token(data={"sub": email})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/auth/user", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    return current_user

# Onboarding endpoints
@app.post("/api/onboarding")
async def complete_onboarding(
    onboarding_data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding process"""
    try:
        # Store company profile
        company_profile = CompanyProfile(
            user_id=current_user.id,
            company_data=onboarding_data.company.dict(),
            entities=onboarding_data.entities,
            users=onboarding_data.users,
            calendar=onboarding_data.calendar.dict() if onboarding_data.calendar else None
        )
        
        # Store in database (simplified for demo)
        # In production, you'd have proper models and relationships
        
        # Create audit trail
        audit_entry = AuditTrail(
            user_id=current_user.id,
            action="onboarding_completed",
            entity_type="company",
            entity_id=str(current_user.id),
            details=json.dumps(onboarding_data.dict())
        )
        db.add(audit_entry)
        db.commit()
        
        return {"message": "Onboarding completed successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Onboarding failed: {str(e)}")

@app.get("/api/company")
async def get_company_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get company profile"""
    # Query company profile from database
    # For now, return mock data
    return {
        "name": "Sample Company",
        "pan": "ABCDE1234F",
        "gstin": "09ABCDE1234F1Z5",
        "email": "company@example.com",
        "mobile": "+91-9876543210",
        "address": "123 Business Street, Mumbai, India",
        "industry": "Technology"
    }

# Document management endpoints
@app.post("/api/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Process document
        processed_doc = await document_processor.process_file(file, current_user.id)
        
        # Store in database
        document = Document(
            filename=file.filename,
            file_type=processed_doc["type"],
            file_size=processed_doc["size"],
            uploaded_by=current_user.id,
            status="processing",
            extracted_data=processed_doc["data"]
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Start AI processing workflow
        ai_result = await ai_orchestrator.process_document(document.id, processed_doc)
        
        # Update document status based on AI processing result
        if ai_result.get("status") == "completed":
            document.status = "completed"
        elif ai_result.get("status") == "failed":
            document.status = "failed"
        else:
            # If AI processing succeeded but no explicit status, mark as completed
            document.status = "completed"
        
        db.commit()
        db.refresh(document)
        
        return DocumentResponse.from_orm(document)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/documents", response_model=List[DocumentResponse])
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user documents"""
    documents = db.query(Document).filter(Document.uploaded_by == current_user.id).all()
    return [DocumentResponse.from_orm(doc) for doc in documents]

# Dashboard endpoints
@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    try:
        # Calculate stats
        documents_count = db.query(Document).filter(Document.uploaded_by == current_user.id).count()
        
        # Get compliance checks
        compliance_checks = db.query(ComplianceCheck).filter(
            ComplianceCheck.checked_by == current_user.id
        ).all()
        
        compliance_score = sum(check.score for check in compliance_checks) / len(compliance_checks) if compliance_checks else 0
        
        # Check onboarding status
        company_profile = None  # Query from database
        onboarding_complete = bool(company_profile)
        
        return DashboardStats(
            documentsProcessed=documents_count,
            activeAgents=3,  # Mock value
            validationErrors=0,
            complianceScore=compliance_score,
            onboardingComplete=onboarding_complete,
            currentQuarter=get_current_quarter(),
            nextDueDate=get_next_due_date()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

# Compliance endpoints
@app.get("/api/compliance-checks", response_model=List[ComplianceCheckResponse])
async def get_compliance_checks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get compliance checks"""
    checks = db.query(ComplianceCheck).filter(ComplianceCheck.checked_by == current_user.id).all()
    return [ComplianceCheckResponse.from_orm(check) for check in checks]

@app.post("/api/compliance-checks")
async def create_compliance_check(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create compliance check"""
    try:
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Run compliance check
        compliance_result = await compliance_checker.check_compliance(document)
        
        # Store result
        compliance_check = ComplianceCheck(
            document_id=document_id,
            check_type="automated",
            result=compliance_result["result"],
            score=compliance_result["score"],
            violations=compliance_result["violations"],
            checked_by=current_user.id
        )
        
        db.add(compliance_check)
        db.commit()
        
        return {"message": "Compliance check completed", "result": compliance_result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

# Financial reports endpoints
@app.get("/api/financial-statements")
async def get_financial_statements(
    period: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financial statements"""
    try:
        statements = await financial_reports.get_statements(current_user.id, period)
        return statements
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statements: {str(e)}")

@app.post("/api/financial-statements/generate")
async def generate_financial_statements(
    period: str,
    statement_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate financial statements"""
    try:
        statement = await financial_reports.generate_statement(
            current_user.id, period, statement_type
        )
        return statement
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate statement: {str(e)}")

# Audit trail endpoints
@app.get("/api/audit-trail", response_model=List[AuditTrailResponse])
async def get_audit_trail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit trail"""
    trails = db.query(AuditTrail).filter(AuditTrail.user_id == current_user.id).all()
    return [AuditTrailResponse.from_orm(trail) for trail in trails]

# AI Agent endpoints
@app.get("/api/workflows")
async def get_workflows(
    current_user: User = Depends(get_current_user)
):
    """Get AI workflows"""
    workflows = await ai_orchestrator.get_workflows(current_user.id)
    return workflows

@app.post("/api/workflows/execute")
async def execute_workflow(
    workflow_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Execute AI workflow"""
    try:
        result = await ai_orchestrator.execute_workflow(workflow_id, document_id, current_user.id)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

# User flow tracking endpoints
@app.post("/api/user-flow")
async def track_user_flow(
    flow_entry: UserFlowEntry,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track user flow"""
    try:
        # Store user flow entry
        audit_entry = AuditTrail(
            user_id=current_user.id,
            action="user_flow_tracked",
            entity_type="flow",
            entity_id=flow_entry.step,
            details=json.dumps(flow_entry.dict())
        )
        db.add(audit_entry)
        db.commit()
        
        return {"message": "User flow tracked successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track user flow: {str(e)}")

@app.get("/api/user-flow")
async def get_user_flow(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user flow entries"""
    flows = db.query(AuditTrail).filter(
        AuditTrail.user_id == current_user.id,
        AuditTrail.action == "user_flow_tracked"
    ).all()
    
    return [json.loads(flow.details) for flow in flows]

# Settings endpoints
@app.get("/api/settings")
async def get_settings(
    current_user: User = Depends(get_current_user)
):
    """Get user settings"""
    return {
        "id": f"settings_{current_user.id}",
        "userId": current_user.id,
        "apiKeys": {
            "openai": "••••••••••••••••" if os.getenv("OPENAI_API_KEY") else "",
            "anthropic": "••••••••••••••••" if os.getenv("ANTHROPIC_API_KEY") else "",
            "postgres": "••••••••••••••••" if os.getenv("DATABASE_URL") else "",
        },
        "agentConfigs": {
            "ClassifierBot": {
                "model": "claude-sonnet-4-20250514",
                "temperature": 0.3,
                "maxTokens": 4000,
                "enabled": True,
                "systemPrompt": "You are a specialized document classifier for financial documents..."
            },
            "JournalBot": {
                "model": "claude-sonnet-4-20250514",
                "temperature": 0.2,
                "maxTokens": 6000,
                "enabled": True,
                "systemPrompt": "You are an expert in double-entry bookkeeping and journal entry creation..."
            },
            "GSTValidator": {
                "model": "claude-sonnet-4-20250514",
                "temperature": 0.1,
                "maxTokens": 4000,
                "enabled": True,
                "systemPrompt": "You are a GST compliance validator for Indian tax regulations..."
            }
        }
    }

# Helper functions
def get_current_quarter() -> str:
    """Get current quarter"""
    now = datetime.now()
    month = now.month
    year = now.year
    
    if month < 3:
        return f"Q4_{year - 1}"
    elif month < 6:
        return f"Q1_{year}"
    elif month < 9:
        return f"Q2_{year}"
    else:
        return f"Q3_{year}"

def get_next_due_date() -> str:
    """Get next due date"""
    now = datetime.now()
    next_month = now.replace(day=15) + timedelta(days=32)
    return next_month.strftime("%Y-%m-%d")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )