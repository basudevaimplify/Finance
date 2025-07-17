"""
Create authentication tables for the QRT Closure platform
"""

import asyncio
from sqlalchemy import create_engine, text
from app.config import settings

def create_auth_tables():
    """Create authentication tables"""
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to add authentication fields to existing users table
    create_tables_sql = """
    -- Add authentication fields to existing users table
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR;
    
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS company_name VARCHAR;
    
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS phone VARCHAR;
    
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

    -- Create user sessions table
    CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        access_token VARCHAR NOT NULL,
        refresh_token VARCHAR,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_access_token ON user_sessions(access_token);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(create_tables_sql))
            conn.commit()
            print("✓ Authentication tables created successfully")
    except Exception as e:
        print(f"Error creating tables: {e}")
    finally:
        engine.dispose()

if __name__ == "__main__":
    create_auth_tables()