"""
Authentication API endpoints
Handles user registration, login, logout, and related authentication operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.services.auth_service import AuthService
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer()
auth_service = AuthService()

# Pydantic models for request/response
class UserRegistration(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    company_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class EmailVerification(BaseModel):
    token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    company_name: Optional[str]
    is_verified: bool
    last_login: Optional[str]

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse]
    access_token: Optional[str]
    refresh_token: Optional[str]
    token_type: Optional[str]

@router.post("/register", response_model=dict)
async def register(
    user_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    
    result = auth_service.register_user(
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        company_name=user_data.company_name,
        phone=user_data.phone,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result
        )
    
    return result

@router.post("/login", response_model=dict)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user and return access token"""
    
    result = auth_service.login_user(
        email=user_data.email,
        password=user_data.password,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result
        )
    
    return result

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout user and invalidate session"""
    
    result = auth_service.logout_user(
        access_token=credentials.credentials,
        db=db
    )
    
    return result

@router.post("/refresh")
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    result = auth_service.refresh_token(
        refresh_token=token_data.refresh_token,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result
        )
    
    return result

@router.get("/user")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "company_name": user.company_name,
            "phone": user.phone,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }
    }

@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerification,
    db: Session = Depends(get_db)
):
    """Verify user email address"""
    
    result = auth_service.verify_email(
        token=verification_data.token,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result
        )
    
    return result

@router.post("/request-password-reset")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    
    result = auth_service.request_password_reset(
        email=reset_data.email,
        db=db
    )
    
    return result

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password using reset token"""
    
    result = auth_service.reset_password(
        token=reset_data.token,
        new_password=reset_data.new_password,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result
        )
    
    return result

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    # Get current user
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    result = auth_service.change_password(
        user_id=user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result
        )
    
    return result

@router.get("/sessions")
async def get_user_sessions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get all active sessions for current user"""
    
    # Get current user
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    result = auth_service.get_user_sessions(
        user_id=user.id,
        db=db
    )
    
    return result

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Revoke a specific session"""
    
    # Get current user
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    result = auth_service.revoke_session(
        session_id=session_id,
        user_id=user.id,
        db=db
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result
        )
    
    return result

@router.delete("/sessions")
async def revoke_all_sessions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Revoke all sessions for current user"""
    
    # Get current user
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    result = auth_service.revoke_all_sessions(
        user_id=user.id,
        db=db
    )
    
    return result

@router.get("/validate-token")
async def validate_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Validate if token is still valid"""
    
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return {
        "success": True,
        "message": "Token is valid",
        "user_id": user.id,
        "email": user.email
    }

# Dependency for protected routes
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user"""
    
    user = auth_service.get_user_by_token(
        token=credentials.credentials,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user