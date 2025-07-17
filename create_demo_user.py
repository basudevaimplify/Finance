#!/usr/bin/env python3
"""
Create a demo user with proper tenant assignment for testing
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import uuid
from datetime import datetime

def create_demo_user():
    """Create a demo user with tenant assignment"""
    # Connect to database
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # First, check if tenant exists
        cursor.execute("SELECT id FROM tenants WHERE company_name = 'Demo Company'")
        tenant_result = cursor.fetchone()
        
        if tenant_result:
            tenant_id = tenant_result['id']
        else:
            # Create new tenant
            tenant_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO tenants (id, company_name, subscription_plan, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                tenant_id,
                "Demo Company",
                "professional",
                True,
                datetime.now(),
                datetime.now()
            ))
        
        # Create a demo user with tenant assignment
        demo_user_id = "demo_user_" + str(uuid.uuid4())[:8]
        cursor.execute("""
            INSERT INTO users (id, email, first_name, last_name, company_name, is_active, tenant_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s::uuid, %s, %s)
            ON CONFLICT (email) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                updated_at = EXCLUDED.updated_at
        """, (
            demo_user_id,
            "demo@example.com",
            "Demo",
            "User",
            "Demo Company Ltd",
            True,
            tenant_id,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        
        # Generate JWT token for the demo user
        import base64
        import json
        
        token_payload = {
            "userId": demo_user_id,
            "email": "demo@example.com"
        }
        
        token = base64.b64encode(json.dumps(token_payload).encode()).decode()
        
        print(f"✅ Demo user created successfully!")
        print(f"User ID: {demo_user_id}")
        print(f"Tenant ID: {tenant_id}")
        print(f"Email: demo@example.com")
        print(f"JWT Token: {token}")
        print("\nYou can use this token to test document upload:")
        print(f'curl -X POST http://localhost:5000/api/documents/upload -H "Authorization: Bearer {token}" -F "file=@test_file.csv"')
        
    except Exception as e:
        print(f"❌ Error creating demo user: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_demo_user()