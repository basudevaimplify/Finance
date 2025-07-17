#!/usr/bin/env python3
"""
Create a test user for the QRT Closure platform
"""

import sys
import os
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.auth import get_password_hash
from app.database import get_db
from app.models import User
from sqlalchemy.orm import Session

def create_test_user():
    """Create a test user account"""
    
    # Test user credentials
    email = "testuser@example.com"
    password = "TestPassword123!"
    first_name = "Test"
    last_name = "User"
    company_name = "Test Company Ltd"
    
    # Hash the password
    hashed_password = get_password_hash(password)
    
    # Get database session
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"✅ Test user already exists")
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🆔 User ID: {existing_user.id}")
            return existing_user
        
        # Create new user
        new_user = User(
            email=email,
            password_hash=hashed_password,
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("🎉 Test user created successfully!")
        print(f"👤 Name: {first_name} {last_name}")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"🏢 Company: {company_name}")
        print(f"🆔 User ID: {new_user.id}")
        
        return new_user
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()