#!/usr/bin/env python3
"""
Direct authentication test to verify login functionality
"""

import sys
import os
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.auth import verify_password, get_password_hash, create_access_token
from app.database import get_db
from app.models import User
from sqlalchemy.orm import Session

def test_login():
    """Test login functionality directly"""
    
    # Test credentials
    email = "testuser@example.com"
    password = "TestPassword123!"
    
    print("🔐 Testing Authentication System")
    print("=" * 40)
    
    # Get database session
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("❌ User not found")
            return False
        
        print(f"✅ User found: {user.first_name} {user.last_name}")
        print(f"📧 Email: {user.email}")
        print(f"🆔 ID: {user.id}")
        
        # Verify password
        if verify_password(password, user.password_hash):
            print("✅ Password verification successful")
            
            # Create access token
            access_token = create_access_token(data={"sub": user.id})
            print("✅ Access token created")
            
            # Test response format
            response_data = {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "company_name": user.company_name,
                    "is_active": user.is_active
                }
            }
            
            print("✅ Authentication successful!")
            print(f"🎯 Token preview: {access_token[:50]}...")
            
            return response_data
            
        else:
            print("❌ Password verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    result = test_login()
    if result:
        print("\n🎉 Login test passed!")
        print("Authentication system is working correctly")
    else:
        print("\n❌ Login test failed!")
        sys.exit(1)