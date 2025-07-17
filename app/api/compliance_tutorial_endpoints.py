"""
API endpoints for Compliance Tutorial Service
Provides RESTful endpoints for contextual micro tutorials
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import json

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.compliance_tutorial_service import (
    ComplianceTutorialService, WorkflowType, WorkflowContext, TutorialStep
)

router = APIRouter(prefix="/api/compliance-tutorial", tags=["compliance-tutorial"])

# Initialize service
tutorial_service = ComplianceTutorialService()

# In-memory storage for workflow contexts (would be database in production)
active_workflows: Dict[str, WorkflowContext] = {}

@router.post("/start-workflow")
async def start_workflow(
    workflow_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new compliance workflow tutorial"""
    try:
        workflow_type = WorkflowType(workflow_data["workflow_type"])
        company_category = workflow_data["company_category"]
        financial_year = workflow_data["financial_year"]
        
        # Create new workflow context
        context = tutorial_service.start_workflow(
            user_id=current_user.id,
            workflow_type=workflow_type,
            company_category=company_category,
            financial_year=financial_year
        )
        
        # Store in memory (would be database in production)
        workflow_key = f"{current_user.id}_{workflow_type.value}"
        active_workflows[workflow_key] = context
        
        # Get first step
        first_step = tutorial_service.get_current_step(context)
        next_steps = tutorial_service.get_next_steps(context)
        
        return {
            "success": True,
            "workflow_id": workflow_key,
            "context": {
                "workflow_type": context.workflow_type.value,
                "company_category": context.company_category,
                "financial_year": context.financial_year,
                "total_steps": context.total_steps,
                "current_step": context.current_step
            },
            "current_step": first_step.__dict__ if first_step else None,
            "next_steps": [step.__dict__ for step in next_steps],
            "message": f"Started {workflow_type.value} tutorial workflow"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow type: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start workflow: {str(e)}"
        )

@router.get("/workflows")
async def get_available_workflows(
    current_user: User = Depends(get_current_user)
):
    """Get list of available compliance workflows"""
    workflows = []
    
    for workflow_type in WorkflowType:
        workflow_info = {
            "id": workflow_type.value,
            "name": workflow_type.value.replace("_", " ").title(),
            "description": _get_workflow_description(workflow_type),
            "estimated_time": _get_workflow_estimated_time(workflow_type),
            "complexity": _get_workflow_complexity(workflow_type),
            "applicable_to": _get_workflow_applicability(workflow_type)
        }
        workflows.append(workflow_info)
    
    return {
        "success": True,
        "workflows": workflows
    }

@router.get("/current-step/{workflow_id}")
async def get_current_step(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get current step in workflow"""
    if workflow_id not in active_workflows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    context = active_workflows[workflow_id]
    
    # Verify user access
    if context.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    current_step = tutorial_service.get_current_step(context)
    next_steps = tutorial_service.get_next_steps(context)
    progress = tutorial_service.get_workflow_progress(context)
    
    return {
        "success": True,
        "current_step": current_step.__dict__ if current_step else None,
        "next_steps": [step.__dict__ for step in next_steps],
        "progress": progress
    }

@router.post("/complete-step/{workflow_id}")
async def complete_step(
    workflow_id: str,
    completion_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Mark a step as completed"""
    if workflow_id not in active_workflows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    context = active_workflows[workflow_id]
    
    # Verify user access
    if context.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    step_id = completion_data["step_id"]
    notes = completion_data.get("notes")
    
    success = tutorial_service.complete_step(context, step_id, notes)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to complete step"
        )
    
    # Get next step
    next_step = tutorial_service.get_current_step(context)
    progress = tutorial_service.get_workflow_progress(context)
    
    return {
        "success": True,
        "step_completed": step_id,
        "next_step": next_step.__dict__ if next_step else None,
        "progress": progress,
        "message": "Step completed successfully"
    }

@router.post("/get-help/{workflow_id}")
async def get_contextual_help(
    workflow_id: str,
    help_request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Get contextual help for current step"""
    if workflow_id not in active_workflows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    context = active_workflows[workflow_id]
    
    # Verify user access
    if context.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    query = help_request.get("query", "")
    
    help_response = tutorial_service.get_contextual_help(context, query)
    
    return {
        "success": True,
        "help": help_response,
        "query": query
    }

@router.get("/progress/{workflow_id}")
async def get_workflow_progress(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed workflow progress"""
    if workflow_id not in active_workflows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    context = active_workflows[workflow_id]
    
    # Verify user access
    if context.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    progress = tutorial_service.get_workflow_progress(context)
    
    return {
        "success": True,
        "progress": progress
    }

@router.get("/my-workflows")
async def get_user_workflows(
    current_user: User = Depends(get_current_user)
):
    """Get all workflows for current user"""
    user_workflows = []
    
    for workflow_id, context in active_workflows.items():
        if context.user_id == current_user.id:
            progress = tutorial_service.get_workflow_progress(context)
            user_workflows.append({
                "workflow_id": workflow_id,
                "workflow_type": context.workflow_type.value,
                "company_category": context.company_category,
                "financial_year": context.financial_year,
                "progress": progress,
                "last_updated": context.last_updated.isoformat()
            })
    
    return {
        "success": True,
        "workflows": user_workflows
    }

@router.delete("/workflow/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow"""
    if workflow_id not in active_workflows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    context = active_workflows[workflow_id]
    
    # Verify user access
    if context.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    del active_workflows[workflow_id]
    
    return {
        "success": True,
        "message": "Workflow deleted successfully"
    }

@router.post("/smart-suggestions/{workflow_id}")
async def get_smart_suggestions(
    workflow_id: str,
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered smart suggestions for current step"""
    if workflow_id not in active_workflows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    context = active_workflows[workflow_id]
    
    # Verify user access
    if context.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    current_step = tutorial_service.get_current_step(context)
    
    if not current_step:
        return {
            "success": True,
            "suggestions": ["Workflow completed! Consider starting a new workflow."]
        }
    
    # Generate smart suggestions based on step and user data
    suggestions = []
    
    # Add step-specific suggestions
    if current_step.category == "preparation":
        suggestions.extend([
            "Set up document templates to speed up future preparation",
            "Create a checklist for this step to ensure nothing is missed",
            "Use QRT's document scanner to digitize paper documents"
        ])
    elif current_step.category == "form_generation":
        suggestions.extend([
            "Use QRT's AI form generator to auto-fill common fields",
            "Set up validation rules to catch errors early",
            "Create form templates for similar future filings"
        ])
    elif current_step.category == "submission":
        suggestions.extend([
            "Set up automated reminders for submission deadlines",
            "Enable auto-payment for recurring fees",
            "Create submission checklists to avoid last-minute issues"
        ])
    
    # Add context-specific suggestions
    if context.company_category == "Private Company":
        suggestions.append("Take advantage of extended deadlines for private companies")
    
    return {
        "success": True,
        "suggestions": suggestions,
        "current_step": current_step.title
    }

# Helper functions
def _get_workflow_description(workflow_type: WorkflowType) -> str:
    descriptions = {
        WorkflowType.MCA_FILING: "Complete guide for MCA annual filing including AOC-4 and MGT-7 forms",
        WorkflowType.GST_COMPLIANCE: "Step-by-step GST compliance process including returns and reconciliation",
        WorkflowType.TDS_COMPLIANCE: "Comprehensive TDS compliance workflow from calculation to filing",
        WorkflowType.QUARTERLY_CLOSURE: "Complete quarterly closure process with all necessary adjustments",
        WorkflowType.AUDIT_PREPARATION: "Prepare for statutory audit with organized documentation",
        WorkflowType.FINANCIAL_REPORTING: "Generate complete financial statements with proper disclosures"
    }
    return descriptions.get(workflow_type, "Compliance workflow")

def _get_workflow_estimated_time(workflow_type: WorkflowType) -> str:
    times = {
        WorkflowType.MCA_FILING: "4-6 hours",
        WorkflowType.GST_COMPLIANCE: "2-3 hours",
        WorkflowType.TDS_COMPLIANCE: "2-3 hours",
        WorkflowType.QUARTERLY_CLOSURE: "6-8 hours",
        WorkflowType.AUDIT_PREPARATION: "4-5 hours",
        WorkflowType.FINANCIAL_REPORTING: "3-4 hours"
    }
    return times.get(workflow_type, "2-4 hours")

def _get_workflow_complexity(workflow_type: WorkflowType) -> str:
    complexity = {
        WorkflowType.MCA_FILING: "Medium",
        WorkflowType.GST_COMPLIANCE: "Medium",
        WorkflowType.TDS_COMPLIANCE: "Low",
        WorkflowType.QUARTERLY_CLOSURE: "High",
        WorkflowType.AUDIT_PREPARATION: "High",
        WorkflowType.FINANCIAL_REPORTING: "Medium"
    }
    return complexity.get(workflow_type, "Medium")

def _get_workflow_applicability(workflow_type: WorkflowType) -> List[str]:
    applicability = {
        WorkflowType.MCA_FILING: ["All Companies", "LLPs"],
        WorkflowType.GST_COMPLIANCE: ["GST Registered Entities"],
        WorkflowType.TDS_COMPLIANCE: ["All Entities with TDS Liability"],
        WorkflowType.QUARTERLY_CLOSURE: ["All Entities"],
        WorkflowType.AUDIT_PREPARATION: ["Companies requiring Audit"],
        WorkflowType.FINANCIAL_REPORTING: ["All Entities"]
    }
    return applicability.get(workflow_type, ["All Entities"])