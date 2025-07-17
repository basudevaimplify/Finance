"""
Database models for MCA filing system
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, JSON, DECIMAL, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

from app.database import Base

class MCAFiling(Base):
    __tablename__ = "mca_filings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("users.id"))
    form_type = Column(String, nullable=False)  # AOC-4, MGT-7
    financial_year = Column(String, nullable=False)
    filing_date = Column(DateTime)
    due_date = Column(DateTime)
    status = Column(String, default="draft")  # draft, submitted, approved, rejected
    form_data = Column(JSON)
    xml_content = Column(Text)
    validation_errors = Column(JSON)
    submission_reference = Column(String)
    fees_paid = Column(DECIMAL(precision=10, scale=2))
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("User", foreign_keys=[company_id])
    creator = relationship("User", foreign_keys=[created_by])
    documents = relationship("MCAFilingDocument", back_populates="filing")
    compliance_checks = relationship("MCAComplianceCheck", back_populates="filing")

class MCAFilingDocument(Base):
    __tablename__ = "mca_filing_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filing_id = Column(String, ForeignKey("mca_filings.id"))
    document_type = Column(String, nullable=False)  # financial_statement, directors_report, etc.
    document_name = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    is_required = Column(Boolean, default=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String, ForeignKey("users.id"))

    # Relationships
    filing = relationship("MCAFiling", back_populates="documents")
    uploader = relationship("User")

class MCAComplianceCheck(Base):
    __tablename__ = "mca_compliance_checks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filing_id = Column(String, ForeignKey("mca_filings.id"))
    check_type = Column(String, nullable=False)
    check_name = Column(String)
    description = Column(Text)
    status = Column(String, default="pending")  # pending, passed, failed, warning
    result_data = Column(JSON)
    error_message = Column(Text)
    checked_at = Column(DateTime, default=datetime.utcnow)
    checked_by = Column(String, ForeignKey("users.id"))

    # Relationships
    filing = relationship("MCAFiling", back_populates="compliance_checks")
    checker = relationship("User")

class CompanyMaster(Base):
    __tablename__ = "company_master"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    cin = Column(String, unique=True, nullable=False)
    company_name = Column(String, nullable=False)
    registration_number = Column(String)
    date_of_incorporation = Column(Date)
    registered_address = Column(Text)
    pin_code = Column(String)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    authorized_capital = Column(DECIMAL(precision=15, scale=2))
    paid_up_capital = Column(DECIMAL(precision=15, scale=2))
    category = Column(String)
    sub_category = Column(String)
    roc_code = Column(String)
    activity_description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    directors = relationship("DirectorMaster", back_populates="company")
    shareholding = relationship("ShareholdingPattern", back_populates="company")

class DirectorMaster(Base):
    __tablename__ = "director_master"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("company_master.id"))
    din = Column(String, nullable=False)
    name = Column(String, nullable=False)
    designation = Column(String)
    appointment_date = Column(Date)
    cessation_date = Column(Date)
    nationality = Column(String)
    qualification = Column(String)
    experience = Column(Text)
    pan = Column(String)
    aadhaar_masked = Column(String)
    is_independent = Column(Boolean, default=False)
    is_woman_director = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("CompanyMaster", back_populates="directors")

class ShareholdingPattern(Base):
    __tablename__ = "shareholding_pattern"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("company_master.id"))
    shareholder_category = Column(String, nullable=False)
    shareholder_name = Column(String)
    no_of_shares = Column(Integer)
    percentage = Column(DECIMAL(precision=5, scale=2))
    voting_rights = Column(DECIMAL(precision=5, scale=2))
    par_value = Column(DECIMAL(precision=10, scale=2))
    as_on_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("CompanyMaster", back_populates="shareholding")

class MCAFilingTemplate(Base):
    __tablename__ = "mca_filing_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    form_type = Column(String, nullable=False)
    template_name = Column(String)
    template_data = Column(JSON)
    is_default = Column(Boolean, default=False)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User")

class MCAFilingHistory(Base):
    __tablename__ = "mca_filing_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filing_id = Column(String, ForeignKey("mca_filings.id"))
    action = Column(String, nullable=False)
    description = Column(Text)
    old_status = Column(String)
    new_status = Column(String)
    performed_by = Column(String, ForeignKey("users.id"))
    performed_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)

    # Relationships
    filing = relationship("MCAFiling")
    performer = relationship("User")

class MCADeadline(Base):
    __tablename__ = "mca_deadlines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    form_type = Column(String, nullable=False)
    company_category = Column(String)
    financial_year = Column(String)
    due_date = Column(Date, nullable=False)
    description = Column(Text)
    penalty_amount = Column(DECIMAL(precision=10, scale=2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MCAFeeMaster(Base):
    __tablename__ = "mca_fee_master"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    form_type = Column(String, nullable=False)
    company_category = Column(String)
    authorized_capital_min = Column(DECIMAL(precision=15, scale=2))
    authorized_capital_max = Column(DECIMAL(precision=15, scale=2))
    base_fee = Column(DECIMAL(precision=10, scale=2))
    additional_fee = Column(DECIMAL(precision=10, scale=2))
    penalty_per_day = Column(DECIMAL(precision=10, scale=2))
    maximum_penalty = Column(DECIMAL(precision=10, scale=2))
    is_active = Column(Boolean, default=True)
    effective_from = Column(Date)
    effective_to = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)