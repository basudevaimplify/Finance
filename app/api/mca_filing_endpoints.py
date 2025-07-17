"""
MCA Filing API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import os
from datetime import datetime, date
import logging
from pydantic import BaseModel, Field
from decimal import Decimal

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.models import (
    MCAFiling, MCAFilingDocument, MCAComplianceCheck, CompanyMaster,
    DirectorMaster, ShareholdingPattern, MCAFilingTemplate, MCAFilingHistory,
    MCADeadline, MCAFeeMaster
)
from app.services.mca_filing_generator import (
    MCAFilingGenerator, FilingType, CompanyInfo, DirectorInfo,
    FinancialData, ShareholdingData, SubsidiaryData
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize MCA filing generator
mca_generator = MCAFilingGenerator()

# Pydantic Models
class CompanyInfoRequest(BaseModel):
    cin: str = Field(..., description="Company Identification Number")
    company_name: str = Field(..., description="Company Name")
    registration_number: str = Field(..., description="Registration Number")
    date_of_incorporation: date = Field(..., description="Date of Incorporation")
    registered_address: str = Field(..., description="Registered Address")
    pin_code: str = Field(..., description="PIN Code")
    phone: str = Field(..., description="Phone Number")
    email: str = Field(..., description="Email Address")
    website: Optional[str] = Field(None, description="Website URL")
    authorized_capital: Decimal = Field(..., description="Authorized Capital")
    paid_up_capital: Decimal = Field(..., description="Paid Up Capital")
    category: str = Field(default="Company limited by shares", description="Company Category")
    sub_category: str = Field(default="Indian Non-Government Company", description="Sub Category")

class DirectorInfoRequest(BaseModel):
    din: str = Field(..., description="Director Identification Number")
    name: str = Field(..., description="Director Name")
    designation: str = Field(..., description="Designation")
    appointment_date: date = Field(..., description="Appointment Date")
    nationality: str = Field(..., description="Nationality")
    qualification: str = Field(..., description="Qualification")
    experience: str = Field(..., description="Experience")
    pan: Optional[str] = Field(None, description="PAN Number")
    is_independent: bool = Field(default=False, description="Is Independent Director")
    is_woman_director: bool = Field(default=False, description="Is Woman Director")

class FinancialDataRequest(BaseModel):
    financial_year: str = Field(..., description="Financial Year")
    revenue: Decimal = Field(..., description="Revenue")
    profit_before_tax: Decimal = Field(..., description="Profit Before Tax")
    profit_after_tax: Decimal = Field(..., description="Profit After Tax")
    total_assets: Decimal = Field(..., description="Total Assets")
    total_liabilities: Decimal = Field(..., description="Total Liabilities")
    reserves_surplus: Decimal = Field(..., description="Reserves and Surplus")
    dividend_paid: Decimal = Field(..., description="Dividend Paid")
    retained_earnings: Decimal = Field(..., description="Retained Earnings")
    borrowings: Decimal = Field(..., description="Borrowings")
    investments: Decimal = Field(..., description="Investments")

class ShareholdingDataRequest(BaseModel):
    category: str = Field(..., description="Shareholder Category")
    no_of_shares: int = Field(..., description="Number of Shares")
    percentage: Decimal = Field(..., description="Percentage")
    voting_rights: Decimal = Field(..., description="Voting Rights")
    change_during_year: int = Field(default=0, description="Change During Year")

class SubsidiaryDataRequest(BaseModel):
    name: str = Field(..., description="Subsidiary Name")
    cin: str = Field(..., description="Subsidiary CIN")
    holding_percentage: Decimal = Field(..., description="Holding Percentage")
    country: str = Field(..., description="Country")
    turnover: Decimal = Field(..., description="Turnover")
    net_worth: Decimal = Field(..., description="Net Worth")
    investment: Decimal = Field(..., description="Investment")

class AOC4Request(BaseModel):
    company_info: CompanyInfoRequest
    financial_data: FinancialDataRequest
    directors: List[DirectorInfoRequest]
    subsidiaries: Optional[List[SubsidiaryDataRequest]] = None
    associates: Optional[List[SubsidiaryDataRequest]] = None

class MGT7Request(BaseModel):
    company_info: CompanyInfoRequest
    financial_data: FinancialDataRequest
    directors: List[DirectorInfoRequest]
    shareholding: List[ShareholdingDataRequest]
    board_meetings: int
    agm_date: date

class FilingStatusUpdate(BaseModel):
    status: str = Field(..., description="Filing Status")
    comments: Optional[str] = Field(None, description="Comments")

@router.post("/mca/filings/aoc4/generate")
async def generate_aoc4_filing(
    request: AOC4Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AOC-4 form data"""
    
    try:
        # Convert request to service objects
        company_info = CompanyInfo(**request.company_info.dict())
        financial_data = FinancialData(**request.financial_data.dict())
        directors = [DirectorInfo(**d.dict()) for d in request.directors]
        subsidiaries = [SubsidiaryData(**s.dict()) for s in (request.subsidiaries or [])]
        associates = [SubsidiaryData(**a.dict()) for a in (request.associates or [])]
        
        # Generate form data
        form_data = mca_generator.generate_aoc4_form(
            company_info, financial_data, directors, subsidiaries, associates
        )
        
        # Validate form data
        validation_errors = mca_generator.validate_form_data(form_data, FilingType.AOC_4)
        
        # Generate XML
        xml_content = mca_generator.export_to_xml(form_data, FilingType.AOC_4)
        
        # Save to database
        filing = MCAFiling(
            company_id=current_user.id,
            form_type="AOC-4",
            financial_year=request.financial_data.financial_year,
            status="draft",
            form_data=form_data,
            xml_content=xml_content,
            validation_errors=validation_errors,
            created_by=current_user.id
        )
        
        db.add(filing)
        db.commit()
        db.refresh(filing)
        
        # Add to history
        history = MCAFilingHistory(
            filing_id=filing.id,
            action="created",
            description="AOC-4 filing generated",
            new_status="draft",
            performed_by=current_user.id
        )
        db.add(history)
        db.commit()
        
        return {
            "filing_id": filing.id,
            "form_type": "AOC-4",
            "status": "draft",
            "validation_errors": validation_errors,
            "has_errors": len(validation_errors) > 0,
            "xml_preview": xml_content[:500] + "..." if len(xml_content) > 500 else xml_content
        }
        
    except Exception as e:
        logger.error(f"Error generating AOC-4 filing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Filing generation failed: {str(e)}")

@router.post("/mca/filings/mgt7/generate")
async def generate_mgt7_filing(
    request: MGT7Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate MGT-7 form data"""
    
    try:
        # Convert request to service objects
        company_info = CompanyInfo(**request.company_info.dict())
        financial_data = FinancialData(**request.financial_data.dict())
        directors = [DirectorInfo(**d.dict()) for d in request.directors]
        shareholding = [ShareholdingData(**s.dict()) for s in request.shareholding]
        
        # Generate form data
        form_data = mca_generator.generate_mgt7_form(
            company_info, financial_data, directors, shareholding,
            request.board_meetings, request.agm_date
        )
        
        # Validate form data
        validation_errors = mca_generator.validate_form_data(form_data, FilingType.MGT_7)
        
        # Generate XML
        xml_content = mca_generator.export_to_xml(form_data, FilingType.MGT_7)
        
        # Save to database
        filing = MCAFiling(
            company_id=current_user.id,
            form_type="MGT-7",
            financial_year=request.financial_data.financial_year,
            status="draft",
            form_data=form_data,
            xml_content=xml_content,
            validation_errors=validation_errors,
            created_by=current_user.id
        )
        
        db.add(filing)
        db.commit()
        db.refresh(filing)
        
        # Add to history
        history = MCAFilingHistory(
            filing_id=filing.id,
            action="created",
            description="MGT-7 filing generated",
            new_status="draft",
            performed_by=current_user.id
        )
        db.add(history)
        db.commit()
        
        return {
            "filing_id": filing.id,
            "form_type": "MGT-7",
            "status": "draft",
            "validation_errors": validation_errors,
            "has_errors": len(validation_errors) > 0,
            "xml_preview": xml_content[:500] + "..." if len(xml_content) > 500 else xml_content
        }
        
    except Exception as e:
        logger.error(f"Error generating MGT-7 filing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Filing generation failed: {str(e)}")

@router.get("/mca/filings")
async def get_filings(
    form_type: Optional[str] = None,
    status: Optional[str] = None,
    financial_year: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get MCA filings"""
    
    query = db.query(MCAFiling).filter(MCAFiling.company_id == current_user.id)
    
    if form_type:
        query = query.filter(MCAFiling.form_type == form_type)
    
    if status:
        query = query.filter(MCAFiling.status == status)
    
    if financial_year:
        query = query.filter(MCAFiling.financial_year == financial_year)
    
    filings = query.order_by(MCAFiling.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        {
            "id": filing.id,
            "form_type": filing.form_type,
            "financial_year": filing.financial_year,
            "status": filing.status,
            "filing_date": filing.filing_date.isoformat() if filing.filing_date else None,
            "due_date": filing.due_date.isoformat() if filing.due_date else None,
            "validation_errors": filing.validation_errors,
            "has_errors": bool(filing.validation_errors),
            "submission_reference": filing.submission_reference,
            "created_at": filing.created_at.isoformat()
        }
        for filing in filings
    ]

@router.get("/mca/filings/{filing_id}")
async def get_filing(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific MCA filing"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    return {
        "id": filing.id,
        "form_type": filing.form_type,
        "financial_year": filing.financial_year,
        "status": filing.status,
        "filing_date": filing.filing_date.isoformat() if filing.filing_date else None,
        "due_date": filing.due_date.isoformat() if filing.due_date else None,
        "form_data": filing.form_data,
        "validation_errors": filing.validation_errors,
        "submission_reference": filing.submission_reference,
        "fees_paid": float(filing.fees_paid) if filing.fees_paid else None,
        "created_at": filing.created_at.isoformat()
    }

@router.get("/mca/filings/{filing_id}/xml")
async def get_filing_xml(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get XML content for filing"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    return {
        "filing_id": filing.id,
        "form_type": filing.form_type,
        "xml_content": filing.xml_content
    }

@router.post("/mca/filings/{filing_id}/validate")
async def validate_filing(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate MCA filing"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    # Validate form data
    filing_type = FilingType.AOC_4 if filing.form_type == "AOC-4" else FilingType.MGT_7
    validation_errors = mca_generator.validate_form_data(filing.form_data, filing_type)
    
    # Update filing with validation results
    filing.validation_errors = validation_errors
    filing.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "filing_id": filing.id,
        "validation_errors": validation_errors,
        "has_errors": len(validation_errors) > 0,
        "is_valid": len(validation_errors) == 0
    }

@router.post("/mca/filings/{filing_id}/status")
async def update_filing_status(
    filing_id: str,
    request: FilingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update filing status"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    old_status = filing.status
    filing.status = request.status
    filing.updated_at = datetime.utcnow()
    
    if request.status == "submitted":
        filing.filing_date = datetime.utcnow()
    
    # Add to history
    history = MCAFilingHistory(
        filing_id=filing.id,
        action="status_updated",
        description=request.comments or f"Status updated to {request.status}",
        old_status=old_status,
        new_status=request.status,
        performed_by=current_user.id
    )
    
    db.add(history)
    db.commit()
    
    return {
        "filing_id": filing.id,
        "old_status": old_status,
        "new_status": request.status,
        "message": "Status updated successfully"
    }

@router.get("/mca/filings/{filing_id}/checklist")
async def get_filing_checklist(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get filing checklist"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    filing_type = FilingType.AOC_4 if filing.form_type == "AOC-4" else FilingType.MGT_7
    checklist = mca_generator.generate_filing_checklist(filing_type)
    
    return {
        "filing_id": filing.id,
        "form_type": filing.form_type,
        "checklist": checklist
    }

@router.post("/mca/filings/{filing_id}/documents")
async def upload_filing_document(
    filing_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload document for filing"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    # Create upload directory if it doesn't exist
    upload_dir = f"uploads/mca_filings/{filing_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create document record
    document = MCAFilingDocument(
        filing_id=filing.id,
        document_type=document_type,
        document_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id
    )
    
    db.add(document)
    db.commit()
    
    return {
        "document_id": document.id,
        "filing_id": filing.id,
        "document_type": document_type,
        "filename": file.filename,
        "file_size": len(content),
        "upload_date": document.upload_date.isoformat()
    }

@router.get("/mca/filings/{filing_id}/documents")
async def get_filing_documents(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get documents for filing"""
    
    filing = db.query(MCAFiling).filter(
        MCAFiling.id == filing_id,
        MCAFiling.company_id == current_user.id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    documents = db.query(MCAFilingDocument).filter(
        MCAFilingDocument.filing_id == filing.id
    ).all()
    
    return [
        {
            "id": doc.id,
            "document_type": doc.document_type,
            "document_name": doc.document_name,
            "file_size": doc.file_size,
            "mime_type": doc.mime_type,
            "is_required": doc.is_required,
            "upload_date": doc.upload_date.isoformat()
        }
        for doc in documents
    ]

@router.get("/mca/deadlines")
async def get_filing_deadlines(
    form_type: Optional[str] = None,
    financial_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get filing deadlines"""
    
    query = db.query(MCADeadline).filter(MCADeadline.is_active == True)
    
    if form_type:
        query = query.filter(MCADeadline.form_type == form_type)
    
    if financial_year:
        query = query.filter(MCADeadline.financial_year == financial_year)
    
    deadlines = query.order_by(MCADeadline.due_date).all()
    
    return [
        {
            "id": deadline.id,
            "form_type": deadline.form_type,
            "company_category": deadline.company_category,
            "financial_year": deadline.financial_year,
            "due_date": deadline.due_date.isoformat(),
            "description": deadline.description,
            "penalty_amount": float(deadline.penalty_amount) if deadline.penalty_amount else None
        }
        for deadline in deadlines
    ]

@router.get("/mca/company-master")
async def get_company_master(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get company master data"""
    
    company = db.query(CompanyMaster).filter(
        CompanyMaster.user_id == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company.id,
        "cin": company.cin,
        "company_name": company.company_name,
        "registration_number": company.registration_number,
        "date_of_incorporation": company.date_of_incorporation.isoformat() if company.date_of_incorporation else None,
        "registered_address": company.registered_address,
        "pin_code": company.pin_code,
        "phone": company.phone,
        "email": company.email,
        "website": company.website,
        "authorized_capital": float(company.authorized_capital) if company.authorized_capital else None,
        "paid_up_capital": float(company.paid_up_capital) if company.paid_up_capital else None,
        "category": company.category,
        "sub_category": company.sub_category,
        "roc_code": company.roc_code,
        "activity_description": company.activity_description
    }

@router.post("/mca/company-master")
async def create_company_master(
    company_data: CompanyInfoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update company master data"""
    
    # Check if company already exists
    existing_company = db.query(CompanyMaster).filter(
        CompanyMaster.user_id == current_user.id
    ).first()
    
    if existing_company:
        # Update existing company
        for field, value in company_data.dict().items():
            setattr(existing_company, field, value)
        existing_company.updated_at = datetime.utcnow()
        db.commit()
        return {"message": "Company updated successfully", "company_id": existing_company.id}
    else:
        # Create new company
        company = CompanyMaster(
            user_id=current_user.id,
            **company_data.dict()
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        return {"message": "Company created successfully", "company_id": company.id}