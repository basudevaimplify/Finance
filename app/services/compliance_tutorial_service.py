"""
Contextual Micro Tutorial Service for Complex Compliance Workflows
Provides intelligent, step-by-step guidance for regulatory compliance processes
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, date
from enum import Enum
import json
from dataclasses import dataclass, asdict
from app.models import User, Document, ComplianceCheck

class WorkflowType(Enum):
    MCA_FILING = "mca_filing"
    GST_COMPLIANCE = "gst_compliance"
    TDS_COMPLIANCE = "tds_compliance"
    QUARTERLY_CLOSURE = "quarterly_closure"
    AUDIT_PREPARATION = "audit_preparation"
    FINANCIAL_REPORTING = "financial_reporting"

class StepStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"

@dataclass
class TutorialStep:
    id: str
    title: str
    description: str
    category: str
    estimated_time: int  # in minutes
    prerequisites: List[str]
    instructions: List[str]
    validation_criteria: List[str]
    documents_required: List[str]
    status: StepStatus = StepStatus.PENDING
    completion_percentage: int = 0
    notes: Optional[str] = None
    helpful_links: List[str] = None
    common_errors: List[str] = None
    ai_assistance_available: bool = True

@dataclass
class WorkflowContext:
    user_id: str
    workflow_type: WorkflowType
    company_category: str
    financial_year: str
    due_date: Optional[date] = None
    current_step: int = 0
    total_steps: int = 0
    completion_percentage: int = 0
    last_updated: datetime = None
    user_preferences: Dict[str, Any] = None

class ComplianceTutorialService:
    def __init__(self):
        self.workflows = {
            WorkflowType.MCA_FILING: self._create_mca_filing_workflow(),
            WorkflowType.GST_COMPLIANCE: self._create_gst_compliance_workflow(),
            WorkflowType.TDS_COMPLIANCE: self._create_tds_compliance_workflow(),
            WorkflowType.QUARTERLY_CLOSURE: self._create_quarterly_closure_workflow(),
            WorkflowType.AUDIT_PREPARATION: self._create_audit_preparation_workflow(),
            WorkflowType.FINANCIAL_REPORTING: self._create_financial_reporting_workflow()
        }
    
    def start_workflow(self, user_id: str, workflow_type: WorkflowType, 
                      company_category: str, financial_year: str) -> WorkflowContext:
        """Initialize a new compliance workflow tutorial"""
        workflow_steps = self.workflows[workflow_type]
        
        context = WorkflowContext(
            user_id=user_id,
            workflow_type=workflow_type,
            company_category=company_category,
            financial_year=financial_year,
            total_steps=len(workflow_steps),
            last_updated=datetime.now(),
            user_preferences=self._get_user_preferences(user_id)
        )
        
        return context
    
    def get_current_step(self, context: WorkflowContext) -> TutorialStep:
        """Get the current step in the workflow"""
        workflow_steps = self.workflows[context.workflow_type]
        if context.current_step < len(workflow_steps):
            step = workflow_steps[context.current_step]
            return self._contextualize_step(step, context)
        return None
    
    def get_next_steps(self, context: WorkflowContext, count: int = 3) -> List[TutorialStep]:
        """Get the next few steps for planning"""
        workflow_steps = self.workflows[context.workflow_type]
        next_steps = []
        
        for i in range(context.current_step + 1, min(context.current_step + count + 1, len(workflow_steps))):
            step = self._contextualize_step(workflow_steps[i], context)
            next_steps.append(step)
        
        return next_steps
    
    def complete_step(self, context: WorkflowContext, step_id: str, 
                     completion_notes: Optional[str] = None) -> bool:
        """Mark a step as completed and advance workflow"""
        workflow_steps = self.workflows[context.workflow_type]
        current_step = workflow_steps[context.current_step]
        
        if current_step.id == step_id:
            current_step.status = StepStatus.COMPLETED
            current_step.completion_percentage = 100
            current_step.notes = completion_notes
            
            context.current_step += 1
            context.completion_percentage = int((context.current_step / context.total_steps) * 100)
            context.last_updated = datetime.now()
            
            return True
        return False
    
    def get_contextual_help(self, context: WorkflowContext, query: str) -> Dict[str, Any]:
        """Provide contextual help based on current step and query"""
        current_step = self.get_current_step(context)
        
        help_response = {
            "current_step": current_step.title if current_step else "Workflow Complete",
            "specific_guidance": self._generate_specific_guidance(current_step, query, context),
            "relevant_documents": self._get_relevant_documents(current_step, context),
            "common_issues": self._get_common_issues(current_step, context),
            "ai_suggestions": self._get_ai_suggestions(current_step, query, context)
        }
        
        return help_response
    
    def _create_mca_filing_workflow(self) -> List[TutorialStep]:
        """Create MCA filing workflow steps"""
        return [
            TutorialStep(
                id="mca_01",
                title="Prepare Company Information",
                description="Gather and verify all required company details for MCA filing",
                category="preparation",
                estimated_time=30,
                prerequisites=[],
                instructions=[
                    "Verify CIN (Corporate Identification Number)",
                    "Confirm registered office address",
                    "Check authorized and paid-up capital figures",
                    "Validate director details and DIN numbers",
                    "Ensure ROC (Registrar of Companies) jurisdiction is correct"
                ],
                validation_criteria=[
                    "CIN format is valid (L/U followed by 8 digits, state code, year, type, 6 digits)",
                    "All director DIN numbers are 8 digits",
                    "Financial figures match last filed returns",
                    "Address matches registered office details"
                ],
                documents_required=[
                    "Certificate of Incorporation",
                    "Memorandum and Articles of Association",
                    "Previous year's annual return",
                    "Board resolution for filing authorization"
                ],
                helpful_links=[
                    "https://www.mca.gov.in/content/mca/global/en/home.html",
                    "https://www.mca.gov.in/content/mca/global/en/data-and-reports/statistical-reports.html"
                ],
                common_errors=[
                    "Incorrect CIN format",
                    "Outdated director information",
                    "Mismatched financial figures"
                ]
            ),
            TutorialStep(
                id="mca_02",
                title="Generate Financial Statements",
                description="Create and validate annual financial statements",
                category="documentation",
                estimated_time=120,
                prerequisites=["mca_01"],
                instructions=[
                    "Prepare Balance Sheet as per Schedule III",
                    "Create Profit & Loss Statement",
                    "Generate Cash Flow Statement",
                    "Prepare Notes to Accounts",
                    "Ensure compliance with applicable accounting standards"
                ],
                validation_criteria=[
                    "Balance Sheet totals match (Assets = Liabilities + Equity)",
                    "P&L figures align with Balance Sheet movements",
                    "Cash flow statement reconciles with balance sheet",
                    "All mandatory disclosures are included"
                ],
                documents_required=[
                    "Trial Balance",
                    "Bank statements",
                    "Depreciation schedule",
                    "Inventory valuation",
                    "Debtors and creditors aging"
                ],
                common_errors=[
                    "Balance sheet not balancing",
                    "Missing mandatory disclosures",
                    "Incorrect accounting standard application"
                ]
            ),
            TutorialStep(
                id="mca_03",
                title="Prepare Board's Report",
                description="Draft comprehensive Board's Report with all mandatory disclosures",
                category="documentation",
                estimated_time=90,
                prerequisites=["mca_02"],
                instructions=[
                    "Review operations and financial performance",
                    "Include mandatory disclosures under Companies Act 2013",
                    "Add details of board meetings and attendance",
                    "Disclose related party transactions",
                    "Include CSR activities report if applicable"
                ],
                validation_criteria=[
                    "All mandatory disclosures are complete",
                    "Board meeting details are accurate",
                    "Related party transactions are properly disclosed",
                    "CSR compliance is addressed if applicable"
                ],
                documents_required=[
                    "Board meeting minutes",
                    "Committee meeting minutes",
                    "Related party transaction details",
                    "CSR policy and implementation report"
                ],
                common_errors=[
                    "Missing mandatory disclosures",
                    "Inadequate related party transaction details",
                    "CSR reporting non-compliance"
                ]
            ),
            TutorialStep(
                id="mca_04",
                title="Generate AOC-4 Form",
                description="Create AOC-4 form with financial statements attachment",
                category="form_generation",
                estimated_time=45,
                prerequisites=["mca_03"],
                instructions=[
                    "Use QRT platform to generate AOC-4 form",
                    "Attach audited financial statements",
                    "Include Board's Report",
                    "Add auditor's report",
                    "Verify all mandatory attachments"
                ],
                validation_criteria=[
                    "AOC-4 form data matches financial statements",
                    "All required attachments are included",
                    "Digital signatures are valid",
                    "Form passes MCA portal validation"
                ],
                documents_required=[
                    "Audited financial statements",
                    "Board's Report",
                    "Auditor's Report",
                    "MGT-7 (if filing together)"
                ],
                common_errors=[
                    "Mismatched financial figures",
                    "Missing required attachments",
                    "Invalid digital signatures"
                ]
            ),
            TutorialStep(
                id="mca_05",
                title="Submit to MCA Portal",
                description="Upload and submit forms to MCA21 portal",
                category="submission",
                estimated_time=30,
                prerequisites=["mca_04"],
                instructions=[
                    "Log in to MCA21 portal",
                    "Upload generated XML files",
                    "Pay applicable fees",
                    "Submit forms before due date",
                    "Download acknowledgment receipt"
                ],
                validation_criteria=[
                    "Forms submitted before due date",
                    "Fees payment successful",
                    "Acknowledgment receipt downloaded",
                    "SRN (Service Request Number) received"
                ],
                documents_required=[
                    "Digital signature certificate",
                    "Payment gateway access",
                    "Generated XML files"
                ],
                common_errors=[
                    "Late submission penalties",
                    "Payment failures",
                    "XML validation errors"
                ]
            )
        ]
    
    def _create_gst_compliance_workflow(self) -> List[TutorialStep]:
        """Create GST compliance workflow steps"""
        return [
            TutorialStep(
                id="gst_01",
                title="Reconcile Purchase Data",
                description="Reconcile purchase invoices with GSTR-2A",
                category="reconciliation",
                estimated_time=60,
                prerequisites=[],
                instructions=[
                    "Download GSTR-2A from GST portal",
                    "Extract purchase data from accounting system",
                    "Match invoices with GSTR-2A entries",
                    "Identify mismatches and discrepancies",
                    "Communicate with vendors for corrections"
                ],
                validation_criteria=[
                    "All purchase invoices are matched",
                    "Discrepancies are documented",
                    "Vendor communications are recorded"
                ],
                documents_required=[
                    "Purchase invoices",
                    "GSTR-2A download",
                    "Accounting system reports"
                ]
            ),
            TutorialStep(
                id="gst_02",
                title="Prepare GSTR-3B",
                description="Generate GSTR-3B return with accurate tax calculations",
                category="return_filing",
                estimated_time=45,
                prerequisites=["gst_01"],
                instructions=[
                    "Calculate outward supplies from sales data",
                    "Include inward supplies from reconciled purchases",
                    "Compute tax liability and input tax credit",
                    "Verify interest and penalty calculations",
                    "Generate GSTR-3B JSON file"
                ],
                validation_criteria=[
                    "Tax calculations are accurate",
                    "ITC claim is within limits",
                    "Return balances correctly"
                ],
                documents_required=[
                    "Sales register",
                    "Purchase register",
                    "Previous period returns"
                ]
            ),
            TutorialStep(
                id="gst_03",
                title="File GST Returns",
                description="Submit GST returns on government portal",
                category="submission",
                estimated_time=30,
                prerequisites=["gst_02"],
                instructions=[
                    "Log in to GST portal",
                    "Upload GSTR-3B JSON file",
                    "Verify data and calculations",
                    "Pay taxes if any liability",
                    "Submit return before due date"
                ],
                validation_criteria=[
                    "Return submitted successfully",
                    "Payment completed if required",
                    "Acknowledgment received"
                ],
                documents_required=[
                    "Digital signature certificate",
                    "GSTR-3B JSON file",
                    "Payment challan"
                ]
            )
        ]
    
    def _create_tds_compliance_workflow(self) -> List[TutorialStep]:
        """Create TDS compliance workflow steps"""
        return [
            TutorialStep(
                id="tds_01",
                title="Calculate TDS Liability",
                description="Compute TDS on various payment categories",
                category="calculation",
                estimated_time=45,
                prerequisites=[],
                instructions=[
                    "Identify TDS applicable payments",
                    "Apply correct TDS rates by category",
                    "Calculate TDS on gross amounts",
                    "Consider exemption limits and certificates",
                    "Prepare TDS register"
                ],
                validation_criteria=[
                    "TDS rates are correctly applied",
                    "Exemption limits are considered",
                    "Calculations are accurate"
                ],
                documents_required=[
                    "Payment vouchers",
                    "TDS certificates from deductees",
                    "TDS rate chart"
                ]
            ),
            TutorialStep(
                id="tds_02",
                title="Generate TDS Returns",
                description="Prepare quarterly TDS returns (Form 26Q/27Q)",
                category="return_preparation",
                estimated_time=60,
                prerequisites=["tds_01"],
                instructions=[
                    "Extract TDS data from accounting system",
                    "Prepare Form 26Q for salary TDS",
                    "Prepare Form 27Q for other TDS",
                    "Validate deductee details and amounts",
                    "Generate return files for upload"
                ],
                validation_criteria=[
                    "All TDS transactions are included",
                    "Deductee details are accurate",
                    "Return totals match TDS register"
                ],
                documents_required=[
                    "TDS register",
                    "Employee salary details",
                    "Vendor payment details"
                ]
            ),
            TutorialStep(
                id="tds_03",
                title="File TDS Returns",
                description="Submit TDS returns to Income Tax portal",
                category="submission",
                estimated_time=30,
                prerequisites=["tds_02"],
                instructions=[
                    "Log in to TDS portal",
                    "Upload TDS return files",
                    "Pay TDS challan amounts",
                    "Submit returns before due date",
                    "Download acknowledgment and certificates"
                ],
                validation_criteria=[
                    "Returns submitted successfully",
                    "TDS payments completed",
                    "Form 16/16A generated"
                ],
                documents_required=[
                    "TDS return files",
                    "Challan payment receipts",
                    "Digital signature certificate"
                ]
            )
        ]
    
    def _create_quarterly_closure_workflow(self) -> List[TutorialStep]:
        """Create quarterly closure workflow steps"""
        return [
            TutorialStep(
                id="qc_01",
                title="Month-End Closures",
                description="Complete all three month-end closures for the quarter",
                category="month_end",
                estimated_time=180,
                prerequisites=[],
                instructions=[
                    "Process all journal entries",
                    "Complete bank reconciliations",
                    "Verify accounts payable and receivable",
                    "Calculate depreciation and amortization",
                    "Review expense accruals and prepayments"
                ],
                validation_criteria=[
                    "All accounts are reconciled",
                    "Trial balance is prepared",
                    "Adjusting entries are posted"
                ],
                documents_required=[
                    "Bank statements",
                    "Supplier invoices",
                    "Customer invoices",
                    "Expense receipts"
                ]
            ),
            TutorialStep(
                id="qc_02",
                title="Quarterly Adjustments",
                description="Process quarter-specific adjustments and provisions",
                category="adjustments",
                estimated_time=90,
                prerequisites=["qc_01"],
                instructions=[
                    "Calculate quarterly depreciation",
                    "Review and adjust provisions",
                    "Process accrued expenses",
                    "Update inventory valuation",
                    "Record foreign exchange adjustments"
                ],
                validation_criteria=[
                    "All provisions are adequate",
                    "Depreciation is correctly calculated",
                    "Inventory is properly valued"
                ],
                documents_required=[
                    "Fixed asset register",
                    "Inventory count sheets",
                    "Foreign exchange rate records"
                ]
            )
        ]
    
    def _create_audit_preparation_workflow(self) -> List[TutorialStep]:
        """Create audit preparation workflow steps"""
        return [
            TutorialStep(
                id="audit_01",
                title="Organize Documentation",
                description="Prepare and organize all audit documentation",
                category="preparation",
                estimated_time=120,
                prerequisites=[],
                instructions=[
                    "Compile all financial records",
                    "Prepare audit trail documentation",
                    "Organize supporting vouchers",
                    "Create audit working papers",
                    "Prepare management representations"
                ],
                validation_criteria=[
                    "All documents are properly filed",
                    "Audit trail is complete",
                    "Working papers are prepared"
                ],
                documents_required=[
                    "Financial statements",
                    "General ledger",
                    "Supporting vouchers",
                    "Bank statements"
                ]
            )
        ]
    
    def _create_financial_reporting_workflow(self) -> List[TutorialStep]:
        """Create financial reporting workflow steps"""
        return [
            TutorialStep(
                id="fr_01",
                title="Prepare Trial Balance",
                description="Generate and validate trial balance",
                category="preparation",
                estimated_time=45,
                prerequisites=[],
                instructions=[
                    "Extract all account balances",
                    "Verify debit and credit totals",
                    "Investigate any imbalances",
                    "Prepare supporting schedules",
                    "Document any adjustments"
                ],
                validation_criteria=[
                    "Trial balance is balanced",
                    "All accounts are included",
                    "Adjustments are documented"
                ],
                documents_required=[
                    "General ledger",
                    "Subsidiary ledgers",
                    "Adjustment journal entries"
                ]
            ),
            TutorialStep(
                id="fr_02",
                title="Generate Financial Statements",
                description="Create comprehensive financial statements",
                category="reporting",
                estimated_time=90,
                prerequisites=["fr_01"],
                instructions=[
                    "Prepare Balance Sheet",
                    "Create Profit & Loss Statement",
                    "Generate Cash Flow Statement",
                    "Prepare Notes to Accounts",
                    "Ensure regulatory compliance"
                ],
                validation_criteria=[
                    "Statements are mathematically accurate",
                    "Disclosure requirements are met",
                    "Comparative figures are included"
                ],
                documents_required=[
                    "Trial balance",
                    "Previous year statements",
                    "Regulatory guidelines"
                ]
            )
        ]
    
    def _contextualize_step(self, step: TutorialStep, context: WorkflowContext) -> TutorialStep:
        """Customize step based on workflow context"""
        # Create a copy to avoid modifying the original
        contextualized_step = TutorialStep(**asdict(step))
        
        # Customize based on company category
        if context.company_category == "Private Company":
            self._customize_for_private_company(contextualized_step)
        elif context.company_category == "Public Company":
            self._customize_for_public_company(contextualized_step)
        
        # Add financial year specific information
        if context.financial_year:
            contextualized_step.description += f" (FY {context.financial_year})"
        
        return contextualized_step
    
    def _customize_for_private_company(self, step: TutorialStep):
        """Customize step for private companies"""
        if step.id.startswith("mca_"):
            # Remove public company specific requirements
            step.instructions = [inst for inst in step.instructions 
                               if "prospectus" not in inst.lower()]
            # Add private company specific notes
            if step.id == "mca_04":
                step.instructions.append("Note: Private companies have extended filing deadlines")
    
    def _customize_for_public_company(self, step: TutorialStep):
        """Customize step for public companies"""
        if step.id.startswith("mca_"):
            # Add public company specific requirements
            if step.id == "mca_03":
                step.instructions.append("Include disclosure of public deposits")
                step.instructions.append("Add details of compliance with listing requirements")
    
    def _generate_specific_guidance(self, step: TutorialStep, query: str, 
                                  context: WorkflowContext) -> str:
        """Generate specific guidance based on query and context"""
        if not step:
            return "Workflow completed successfully!"
        
        guidance_templates = {
            "deadline": f"For {context.company_category} companies in FY {context.financial_year}, "
                       f"the deadline for {step.title} is typically 30 days from the end of the period.",
            "documents": f"The key documents required for {step.title} are: {', '.join(step.documents_required)}",
            "validation": f"To validate {step.title}, ensure: {'; '.join(step.validation_criteria)}",
            "common_errors": f"Common errors in {step.title}: {'; '.join(step.common_errors or [])}"
        }
        
        # Simple keyword matching for guidance
        query_lower = query.lower()
        for keyword, template in guidance_templates.items():
            if keyword in query_lower:
                return template
        
        return f"For {step.title}, follow these key steps: {'; '.join(step.instructions[:3])}"
    
    def _get_relevant_documents(self, step: TutorialStep, context: WorkflowContext) -> List[str]:
        """Get relevant documents for current step"""
        if not step:
            return []
        return step.documents_required
    
    def _get_common_issues(self, step: TutorialStep, context: WorkflowContext) -> List[str]:
        """Get common issues for current step"""
        if not step:
            return []
        return step.common_errors or []
    
    def _get_ai_suggestions(self, step: TutorialStep, query: str, 
                          context: WorkflowContext) -> List[str]:
        """Get AI-powered suggestions for current step"""
        if not step or not step.ai_assistance_available:
            return []
        
        suggestions = [
            f"Use QRT's AI agents to automate {step.category} tasks",
            f"Set up automated validation for {step.title}",
            f"Create templates for recurring {step.category} activities"
        ]
        
        return suggestions
    
    def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences for tutorial customization"""
        # This would typically fetch from database
        return {
            "experience_level": "intermediate",
            "preferred_detail_level": "detailed",
            "reminder_frequency": "daily",
            "tutorial_style": "step_by_step"
        }
    
    def get_workflow_progress(self, context: WorkflowContext) -> Dict[str, Any]:
        """Get detailed workflow progress information"""
        workflow_steps = self.workflows[context.workflow_type]
        
        completed_steps = []
        pending_steps = []
        
        for i, step in enumerate(workflow_steps):
            if i < context.current_step:
                completed_steps.append({
                    "id": step.id,
                    "title": step.title,
                    "completed_at": context.last_updated
                })
            elif i >= context.current_step:
                pending_steps.append({
                    "id": step.id,
                    "title": step.title,
                    "estimated_time": step.estimated_time
                })
        
        return {
            "workflow_type": context.workflow_type.value,
            "total_steps": context.total_steps,
            "current_step": context.current_step,
            "completion_percentage": context.completion_percentage,
            "completed_steps": completed_steps,
            "pending_steps": pending_steps,
            "estimated_remaining_time": sum(step["estimated_time"] for step in pending_steps)
        }