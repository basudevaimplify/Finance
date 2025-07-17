"""
Authentication Service
Handles user registration, login, password management, and session handling
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import re

from app.models import User, UserSession
from app.config import settings
from app.database import get_db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def _validate_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _validate_password(self, password: str) -> Dict[str, Any]:
        """Validate password strength"""
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _generate_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Generate JWT token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
    
    def _generate_reset_token(self) -> str:
        """Generate secure random token for password reset"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    def register_user(self, 
                     email: str, 
                     password: str, 
                     first_name: str, 
                     last_name: str,
                     company_name: Optional[str] = None,
                     phone: Optional[str] = None,
                     db: Session = None) -> Dict[str, Any]:
        """Register a new user"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Validate email format
            if not self._validate_email(email):
                return {
                    "success": False,
                    "message": "Invalid email format",
                    "errors": ["Invalid email format"]
                }
            
            # Validate password strength
            password_validation = self._validate_password(password)
            if not password_validation["valid"]:
                return {
                    "success": False,
                    "message": "Password does not meet requirements",
                    "errors": password_validation["errors"]
                }
            
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return {
                    "success": False,
                    "message": "User with this email already exists",
                    "errors": ["Email already registered"]
                }
            
            # Hash password
            hashed_password = self._hash_password(password)
            
            # Create user
            user = User(
                email=email,
                password_hash=hashed_password,
                first_name=first_name,
                last_name=last_name,
                company_name=company_name,
                phone=phone,
                is_active=True,
                is_verified=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Generate verification token
            verification_token = self._generate_token(
                {"user_id": user.id, "type": "email_verification"},
                expires_delta=timedelta(hours=24)
            )
            
            # Send verification email (if email service is configured)
            # self._send_verification_email(user.email, verification_token)
            
            return {
                "success": True,
                "message": "User registered successfully",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "company_name": user.company_name,
                    "is_verified": user.is_verified
                },
                "verification_token": verification_token
            }
            
        except IntegrityError as e:
            db.rollback()
            return {
                "success": False,
                "message": "Registration failed due to database constraint",
                "errors": ["Email already exists or other constraint violation"]
            }
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Registration failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def login_user(self, email: str, password: str, db: Session = None) -> Dict[str, Any]:
        """Authenticate user and generate access token"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Find user by email
            user = db.query(User).filter(User.email == email).first()
            
            if not user:
                return {
                    "success": False,
                    "message": "Invalid email or password",
                    "errors": ["Invalid credentials"]
                }
            
            # Verify password
            if not self._verify_password(password, user.password_hash):
                return {
                    "success": False,
                    "message": "Invalid email or password",
                    "errors": ["Invalid credentials"]
                }
            
            # Check if user is active
            if not user.is_active:
                return {
                    "success": False,
                    "message": "Account is deactivated",
                    "errors": ["Account deactivated"]
                }
            
            # Generate access token
            access_token = self._generate_token(
                {"user_id": user.id, "email": user.email, "type": "access"}
            )
            
            # Generate refresh token
            refresh_token = self._generate_token(
                {"user_id": user.id, "type": "refresh"},
                expires_delta=timedelta(days=30)
            )
            
            # Create session record
            session = UserSession(
                user_id=user.id,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes),
                created_at=datetime.utcnow(),
                is_active=True
            )
            
            db.add(session)
            
            # Update user's last login
            user.last_login = datetime.utcnow()
            user.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "company_name": user.company_name,
                    "is_verified": user.is_verified,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                },
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Login failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def logout_user(self, access_token: str, db: Session = None) -> Dict[str, Any]:
        """Logout user and invalidate session"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Find and deactivate session
            session = db.query(UserSession).filter(
                UserSession.access_token == access_token,
                UserSession.is_active == True
            ).first()
            
            if session:
                session.is_active = False
                session.updated_at = datetime.utcnow()
                db.commit()
            
            return {
                "success": True,
                "message": "Logout successful"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Logout failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def refresh_token(self, refresh_token: str, db: Session = None) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Verify refresh token
            payload = self._verify_token(refresh_token)
            if not payload or payload.get("type") != "refresh":
                return {
                    "success": False,
                    "message": "Invalid refresh token",
                    "errors": ["Invalid or expired refresh token"]
                }
            
            user_id = payload.get("user_id")
            if not user_id:
                return {
                    "success": False,
                    "message": "Invalid refresh token",
                    "errors": ["Invalid token payload"]
                }
            
            # Find user and active session
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                return {
                    "success": False,
                    "message": "User not found or inactive",
                    "errors": ["User not found or inactive"]
                }
            
            session = db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.refresh_token == refresh_token,
                UserSession.is_active == True
            ).first()
            
            if not session:
                return {
                    "success": False,
                    "message": "Invalid refresh token",
                    "errors": ["Session not found or expired"]
                }
            
            # Generate new access token
            new_access_token = self._generate_token(
                {"user_id": user.id, "email": user.email, "type": "access"}
            )
            
            # Update session
            session.access_token = new_access_token
            session.expires_at = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
            session.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                "success": True,
                "message": "Token refreshed successfully",
                "access_token": new_access_token,
                "token_type": "bearer"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Token refresh failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def verify_email(self, token: str, db: Session = None) -> Dict[str, Any]:
        """Verify user email using verification token"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Verify token
            payload = self._verify_token(token)
            if not payload or payload.get("type") != "email_verification":
                return {
                    "success": False,
                    "message": "Invalid or expired verification token",
                    "errors": ["Invalid verification token"]
                }
            
            user_id = payload.get("user_id")
            if not user_id:
                return {
                    "success": False,
                    "message": "Invalid verification token",
                    "errors": ["Invalid token payload"]
                }
            
            # Find user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "success": False,
                    "message": "User not found",
                    "errors": ["User not found"]
                }
            
            # Update user verification status
            user.is_verified = True
            user.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                "success": True,
                "message": "Email verified successfully",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "is_verified": user.is_verified
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Email verification failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def request_password_reset(self, email: str, db: Session = None) -> Dict[str, Any]:
        """Request password reset for user"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Find user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # Don't reveal that email doesn't exist
                return {
                    "success": True,
                    "message": "If the email exists, a password reset link has been sent"
                }
            
            # Generate reset token
            reset_token = self._generate_token(
                {"user_id": user.id, "type": "password_reset"},
                expires_delta=timedelta(hours=1)
            )
            
            # Store reset token (in production, consider storing in database)
            # For now, we'll just return it
            
            # Send reset email (if email service is configured)
            # self._send_password_reset_email(user.email, reset_token)
            
            return {
                "success": True,
                "message": "Password reset link has been sent to your email",
                "reset_token": reset_token  # Remove this in production
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Password reset request failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def reset_password(self, token: str, new_password: str, db: Session = None) -> Dict[str, Any]:
        """Reset user password using reset token"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Verify token
            payload = self._verify_token(token)
            if not payload or payload.get("type") != "password_reset":
                return {
                    "success": False,
                    "message": "Invalid or expired reset token",
                    "errors": ["Invalid reset token"]
                }
            
            user_id = payload.get("user_id")
            if not user_id:
                return {
                    "success": False,
                    "message": "Invalid reset token",
                    "errors": ["Invalid token payload"]
                }
            
            # Validate new password
            password_validation = self._validate_password(new_password)
            if not password_validation["valid"]:
                return {
                    "success": False,
                    "message": "Password does not meet requirements",
                    "errors": password_validation["errors"]
                }
            
            # Find user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "success": False,
                    "message": "User not found",
                    "errors": ["User not found"]
                }
            
            # Update password
            user.password_hash = self._hash_password(new_password)
            user.updated_at = datetime.utcnow()
            
            # Invalidate all active sessions
            db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).update({"is_active": False, "updated_at": datetime.utcnow()})
            
            db.commit()
            
            return {
                "success": True,
                "message": "Password reset successfully"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Password reset failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def change_password(self, user_id: int, current_password: str, new_password: str, db: Session = None) -> Dict[str, Any]:
        """Change user password"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Find user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "success": False,
                    "message": "User not found",
                    "errors": ["User not found"]
                }
            
            # Verify current password
            if not self._verify_password(current_password, user.password_hash):
                return {
                    "success": False,
                    "message": "Current password is incorrect",
                    "errors": ["Current password is incorrect"]
                }
            
            # Validate new password
            password_validation = self._validate_password(new_password)
            if not password_validation["valid"]:
                return {
                    "success": False,
                    "message": "New password does not meet requirements",
                    "errors": password_validation["errors"]
                }
            
            # Update password
            user.password_hash = self._hash_password(new_password)
            user.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                "success": True,
                "message": "Password changed successfully"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Password change failed: {str(e)}",
                "errors": [str(e)]
            }
    
    def get_user_by_token(self, token: str, db: Session = None) -> Optional[User]:
        """Get user by access token"""
        
        if not db:
            db = next(get_db())
        
        try:
            # Verify token
            payload = self._verify_token(token)
            if not payload or payload.get("type") != "access":
                return None
            
            user_id = payload.get("user_id")
            if not user_id:
                return None
            
            # Check if session is active
            session = db.query(UserSession).filter(
                UserSession.access_token == token,
                UserSession.is_active == True
            ).first()
            
            if not session:
                return None
            
            # Check if session is expired
            if session.expires_at < datetime.utcnow():
                session.is_active = False
                db.commit()
                return None
            
            # Get user
            user = db.query(User).filter(User.id == user_id).first()
            return user if user and user.is_active else None
            
        except Exception as e:
            print(f"Token verification error: {e}")
            return None
    
    def get_user_sessions(self, user_id: int, db: Session = None) -> Dict[str, Any]:
        """Get all active sessions for a user"""
        
        if not db:
            db = next(get_db())
        
        try:
            sessions = db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).order_by(UserSession.created_at.desc()).all()
            
            return {
                "success": True,
                "sessions": [
                    {
                        "id": session.id,
                        "created_at": session.created_at.isoformat(),
                        "expires_at": session.expires_at.isoformat(),
                        "updated_at": session.updated_at.isoformat() if session.updated_at else None
                    }
                    for session in sessions
                ]
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to get sessions: {str(e)}",
                "errors": [str(e)]
            }
    
    def revoke_session(self, session_id: int, user_id: int, db: Session = None) -> Dict[str, Any]:
        """Revoke a specific session"""
        
        if not db:
            db = next(get_db())
        
        try:
            session = db.query(UserSession).filter(
                UserSession.id == session_id,
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).first()
            
            if not session:
                return {
                    "success": False,
                    "message": "Session not found",
                    "errors": ["Session not found"]
                }
            
            session.is_active = False
            session.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                "success": True,
                "message": "Session revoked successfully"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Failed to revoke session: {str(e)}",
                "errors": [str(e)]
            }
    
    def revoke_all_sessions(self, user_id: int, db: Session = None) -> Dict[str, Any]:
        """Revoke all sessions for a user"""
        
        if not db:
            db = next(get_db())
        
        try:
            db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).update({"is_active": False, "updated_at": datetime.utcnow()})
            
            db.commit()
            
            return {
                "success": True,
                "message": "All sessions revoked successfully"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Failed to revoke sessions: {str(e)}",
                "errors": [str(e)]
            }