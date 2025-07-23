-- QRT Closure Agent Platform Database Schema
-- PostgreSQL Database Schema for Local Deployment
-- Generated: July 18, 2025

-- Enable UUID extension (required for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS (Custom Types)
-- =============================================

-- Tenant role enum
DO $$ BEGIN
    CREATE TYPE tenant_role AS ENUM (
        'admin', 
        'finance_manager', 
        'finance_exec', 
        'auditor', 
        'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription plan enum
DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM (
        'starter', 
        'professional', 
        'enterprise', 
        'trial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document type enum
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'journal',
        'gst',
        'tds',
        'trial_balance',
        'fixed_asset_register',
        'purchase_register',
        'sales_register',
        'salary_register',
        'vendor_invoice',
        'bank_statement',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document status enum
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM (
        'uploaded',
        'processing',
        'classified',
        'extracted',
        'validated',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agent status enum
DO $$ BEGIN
    CREATE TYPE agent_status AS ENUM (
        'idle',
        'running',
        'completed',
        'failed',
        'paused'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- CORE TABLES
-- =============================================

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create index on expire column for session cleanup
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Tenants (Companies) table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR NOT NULL,
    cin VARCHAR UNIQUE, -- Company Identification Number
    gstin VARCHAR, -- GST Identification Number
    pan VARCHAR, -- PAN Number
    registered_address TEXT,
    city VARCHAR,
    state VARCHAR,
    pin_code VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    website VARCHAR,
    industry_type VARCHAR,
    subscription_plan subscription_plan DEFAULT 'trial' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role VARCHAR DEFAULT 'finance_exec' NOT NULL,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    tenant_role tenant_role DEFAULT 'finance_exec' NOT NULL,
    phone VARCHAR,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR NOT NULL,
    document_type document_type,
    status document_status DEFAULT 'uploaded' NOT NULL,
    uploaded_by VARCHAR REFERENCES users(id) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    metadata JSONB,
    extracted_data JSONB,
    validation_errors JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent jobs table
CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR UNIQUE NOT NULL,
    agent_name VARCHAR NOT NULL,
    status agent_status DEFAULT 'idle' NOT NULL,
    document_id UUID REFERENCES documents(id),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    input JSONB,
    output JSONB,
    error TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id VARCHAR UNIQUE NOT NULL,
    date TIMESTAMP NOT NULL,
    account_code VARCHAR NOT NULL,
    account_name VARCHAR NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    narration TEXT,
    entity VARCHAR,
    document_id UUID REFERENCES documents(id),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Financial statements table
CREATE TABLE IF NOT EXISTS financial_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_type VARCHAR NOT NULL, -- trial_balance, profit_loss, balance_sheet, cash_flow
    period VARCHAR NOT NULL, -- Q1_2025, Q2_2025, etc.
    entity VARCHAR,
    data JSONB NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    generated_by VARCHAR REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance checks table
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type VARCHAR NOT NULL, -- gst, tds, ind_as, companies_act
    document_id UUID REFERENCES documents(id),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    status VARCHAR DEFAULT 'pending' NOT NULL, -- pending, compliant, non_compliant
    findings JSONB,
    checked_by VARCHAR REFERENCES users(id),
    checked_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL, -- document, job, user, etc.
    entity_id VARCHAR NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- RECONCILIATION TABLES
-- =============================================

-- Reconciliation rules table
CREATE TABLE IF NOT EXISTS reconciliation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    entity_pairs TEXT[] NOT NULL,
    account_codes TEXT[] NOT NULL,
    tolerance_percent DECIMAL(5,4) NOT NULL DEFAULT 0.0100,
    tolerance_amount DECIMAL(15,2) NOT NULL DEFAULT 100.00,
    auto_reconcile BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reconciliation matches table
CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_a VARCHAR NOT NULL,
    entity_b VARCHAR NOT NULL,
    transaction_a_id UUID REFERENCES journal_entries(id) NOT NULL,
    transaction_b_id UUID REFERENCES journal_entries(id) NOT NULL,
    match_score DECIMAL(5,4) NOT NULL,
    match_type VARCHAR NOT NULL, -- exact, partial, suspected
    variance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    variance_reasons TEXT[] NOT NULL,
    reconciliation_date TIMESTAMP NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'matched', -- matched, unmatched, disputed
    rule_id UUID REFERENCES reconciliation_rules(id),
    period VARCHAR NOT NULL,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Intercompany transactions table
CREATE TABLE IF NOT EXISTS intercompany_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_entity VARCHAR NOT NULL,
    child_entity VARCHAR NOT NULL,
    transaction_type VARCHAR NOT NULL, -- transfer, loan, service, dividend, expense_allocation
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'INR',
    transaction_date TIMESTAMP NOT NULL,
    description TEXT,
    document_ids TEXT[] NOT NULL,
    is_reconciled BOOLEAN NOT NULL DEFAULT false,
    reconciliation_id UUID REFERENCES reconciliation_matches(id),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reconciliation reports table
CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period VARCHAR NOT NULL,
    total_transactions INTEGER NOT NULL,
    matched_transactions INTEGER NOT NULL,
    unmatched_transactions INTEGER NOT NULL,
    disputed_transactions INTEGER NOT NULL,
    total_variance DECIMAL(15,2) NOT NULL,
    reconciliation_rate DECIMAL(5,4) NOT NULL,
    recommendations TEXT[] NOT NULL,
    report_data JSONB,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id) NOT NULL
);

-- Data sources table
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- database, api, file_system, ftp, cloud_storage, erp, banking_api, gst_portal, mca_portal
    connection_string TEXT,
    host VARCHAR,
    port INTEGER,
    username VARCHAR,
    password VARCHAR,
    database VARCHAR,
    schema VARCHAR,
    "table" VARCHAR,
    api_key VARCHAR,
    api_secret VARCHAR,
    base_url VARCHAR,
    auth_token VARCHAR,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_sync TIMESTAMP,
    sync_frequency VARCHAR DEFAULT 'daily', -- hourly, daily, weekly, monthly, manual
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES (for performance)
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Agent jobs table indexes
CREATE INDEX IF NOT EXISTS idx_agent_jobs_tenant_id ON agent_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_document_id ON agent_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(status);

-- Journal entries table indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_id ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_document_id ON journal_entries(document_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_code ON journal_entries(account_code);

-- Financial statements table indexes
CREATE INDEX IF NOT EXISTS idx_financial_statements_tenant_id ON financial_statements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_statements_period ON financial_statements(period);
CREATE INDEX IF NOT EXISTS idx_financial_statements_statement_type ON financial_statements(statement_type);

-- Compliance checks table indexes
CREATE INDEX IF NOT EXISTS idx_compliance_checks_tenant_id ON compliance_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_document_id ON compliance_checks(document_id);

-- Audit trail table indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_tenant_id ON audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);

-- =============================================
-- INITIAL DATA (Demo Setup)
-- =============================================

-- Insert demo tenant
INSERT INTO tenants (id, company_name, subscription_plan, is_active, created_at, updated_at)
VALUES ('demo-tenant-local', 'Demo Company Local', 'enterprise', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo user
INSERT INTO users (id, email, first_name, last_name, tenant_id, tenant_role, role, is_active, created_at, updated_at)
VALUES ('demo-user', 'demo@example.com', 'Demo', 'User', 'demo-tenant-local', 'admin', 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  tenant_id = 'demo-tenant-local',
  tenant_role = 'admin',
  role = 'admin',
  updated_at = NOW();

-- =============================================
-- FUNCTIONS AND TRIGGERS (Optional)
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at updates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
        CREATE TRIGGER update_tenants_updated_at 
            BEFORE UPDATE ON tenants 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at') THEN
        CREATE TRIGGER update_documents_updated_at 
            BEFORE UPDATE ON documents 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_jobs_updated_at') THEN
        CREATE TRIGGER update_agent_jobs_updated_at 
            BEFORE UPDATE ON agent_jobs 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify schema creation
DO $$
BEGIN
    RAISE NOTICE 'Schema created successfully!';
    RAISE NOTICE 'Tables created: %', (
        SELECT count(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'sessions', 'tenants', 'users', 'documents', 'agent_jobs', 
            'journal_entries', 'financial_statements', 'compliance_checks', 
            'audit_trail', 'reconciliation_rules', 'reconciliation_matches',
            'intercompany_transactions', 'reconciliation_reports', 'data_sources'
        )
    );
    RAISE NOTICE 'Demo tenant created: %', (SELECT company_name FROM tenants WHERE id = 'demo-tenant-local');
    RAISE NOTICE 'Demo user created: %', (SELECT email FROM users WHERE id = 'demo-user');
END $$;

-- Show table information
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;