"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# User schemas
class UserBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    filename: str
    file_type: Optional[str] = None
    document_type: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    file_size: Optional[int] = None
    status: str
    extracted_data: Optional[Dict[str, Any]] = None
    uploaded_by: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Onboarding schemas
class CompanyInfo(BaseModel):
    name: str
    pan: str
    gstin: str
    email: str
    mobile: str
    address: str
    industry: str

class EntityInfo(BaseModel):
    id: str
    name: str
    type: str
    gstin: str
    location: str

class UserInfo(BaseModel):
    id: str
    name: str
    email: str
    role: str
    permissions: List[str]

class QuarterInfo(BaseModel):
    name: str
    start_date: str
    end_date: str
    due_date: str

class CalendarInfo(BaseModel):
    fiscal_year: str
    quarters: List[QuarterInfo]

class OnboardingData(BaseModel):
    company: CompanyInfo
    entities: List[EntityInfo]
    users: List[UserInfo]
    calendar: Optional[CalendarInfo] = None

class CompanyProfile(BaseModel):
    user_id: str
    company_data: Dict[str, Any]
    entities: List[EntityInfo]
    users: List[UserInfo]
    calendar: Optional[Dict[str, Any]] = None

# User flow schemas
class UserFlowEntry(BaseModel):
    step: str
    action: str
    metadata: Optional[Dict[str, Any]] = None

class CloseCalendar(BaseModel):
    fiscal_year: str
    quarters: List[QuarterInfo]

# Dashboard schemas
class DashboardStats(BaseModel):
    documentsProcessed: int
    activeAgents: int
    validationErrors: int
    complianceScore: float
    onboardingComplete: bool
    currentQuarter: str
    nextDueDate: str

# Compliance schemas
class ComplianceCheckResponse(BaseModel):
    id: str
    document_id: str
    check_type: str
    result: str
    score: Optional[Decimal] = None
    violations: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Audit trail schemas
class AuditTrailResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Journal entry schemas
class JournalEntryResponse(BaseModel):
    id: str
    document_id: str
    entry_date: datetime
    reference_number: Optional[str] = None
    description: Optional[str] = None
    account_code: str
    account_name: str
    debit_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None
    entity: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Financial statement schemas
class FinancialStatementResponse(BaseModel):
    id: str
    statement_type: str
    period: str
    data: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Agent job schemas
class AgentJobResponse(BaseModel):
    id: str
    document_id: str
    agent_type: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Configuration schemas
class AgentConfig(BaseModel):
    model: str = "claude-sonnet-4-20250514"
    temperature: float = Field(ge=0.0, le=2.0, default=0.3)
    max_tokens: int = Field(ge=100, le=8000, default=4000)
    enabled: bool = True
    system_prompt: str

class SettingsResponse(BaseModel):
    id: str
    userId: str
    apiKeys: Dict[str, str]
    agentConfigs: Dict[str, AgentConfig]