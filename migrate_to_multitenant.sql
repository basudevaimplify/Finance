-- QRT Closure Platform - Migration to Multitenant Architecture
-- This script adds tenant isolation to the existing database

-- Create tenant role enum
CREATE TYPE tenant_role AS ENUM ('admin', 'finance_manager', 'finance_exec', 'auditor', 'viewer');

-- Create subscription plan enum  
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise', 'trial');

-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR NOT NULL,
    cin VARCHAR UNIQUE,
    gstin VARCHAR,
    pan VARCHAR,
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
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create a default tenant for existing data
INSERT INTO tenants (company_name, subscription_plan, is_active)
VALUES ('Default Company', 'professional', true);

-- Get the tenant ID for updating existing records
-- Note: This will be used in the following updates

-- Add tenant_id column to users table
ALTER TABLE users ADD COLUMN tenant_id UUID;
ALTER TABLE users ADD COLUMN tenant_role tenant_role DEFAULT 'finance_exec' NOT NULL;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- Update existing users to reference the default tenant
UPDATE users SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');

-- Make tenant_id NOT NULL after updating
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to documents table
ALTER TABLE documents ADD COLUMN tenant_id UUID;
UPDATE documents SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to agent_jobs table
ALTER TABLE agent_jobs ADD COLUMN tenant_id UUID;
UPDATE agent_jobs SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE agent_jobs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE agent_jobs ADD CONSTRAINT fk_agent_jobs_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to journal_entries table
ALTER TABLE journal_entries ADD COLUMN tenant_id UUID;
UPDATE journal_entries SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE journal_entries ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_entries_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to financial_statements table
ALTER TABLE financial_statements ADD COLUMN tenant_id UUID;
UPDATE financial_statements SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE financial_statements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE financial_statements ADD CONSTRAINT fk_financial_statements_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to compliance_checks table
ALTER TABLE compliance_checks ADD COLUMN tenant_id UUID;
UPDATE compliance_checks SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE compliance_checks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE compliance_checks ADD CONSTRAINT fk_compliance_checks_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to audit_trail table
ALTER TABLE audit_trail ADD COLUMN tenant_id UUID;
UPDATE audit_trail SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE audit_trail ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE audit_trail ADD CONSTRAINT fk_audit_trail_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to reconciliation_rules table (if exists)
ALTER TABLE reconciliation_rules ADD COLUMN tenant_id UUID;
UPDATE reconciliation_rules SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE reconciliation_rules ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE reconciliation_rules ADD CONSTRAINT fk_reconciliation_rules_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to reconciliation_matches table (if exists)
ALTER TABLE reconciliation_matches ADD COLUMN tenant_id UUID;
UPDATE reconciliation_matches SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE reconciliation_matches ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE reconciliation_matches ADD CONSTRAINT fk_reconciliation_matches_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to intercompany_transactions table (if exists)
ALTER TABLE intercompany_transactions ADD COLUMN tenant_id UUID;
UPDATE intercompany_transactions SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE intercompany_transactions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE intercompany_transactions ADD CONSTRAINT fk_intercompany_transactions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to reconciliation_reports table (if exists)
ALTER TABLE reconciliation_reports ADD COLUMN tenant_id UUID;
UPDATE reconciliation_reports SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE reconciliation_reports ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE reconciliation_reports ADD CONSTRAINT fk_reconciliation_reports_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to data_sources table (if exists)
ALTER TABLE data_sources ADD COLUMN tenant_id UUID;
UPDATE data_sources SET tenant_id = (SELECT id FROM tenants WHERE company_name = 'Default Company');
ALTER TABLE data_sources ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE data_sources ADD CONSTRAINT fk_data_sources_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Create indexes for tenant-based queries
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_agent_jobs_tenant_id ON agent_jobs(tenant_id);
CREATE INDEX idx_journal_entries_tenant_id ON journal_entries(tenant_id);
CREATE INDEX idx_financial_statements_tenant_id ON financial_statements(tenant_id);
CREATE INDEX idx_compliance_checks_tenant_id ON compliance_checks(tenant_id);
CREATE INDEX idx_audit_trail_tenant_id ON audit_trail(tenant_id);

-- Success message
SELECT 'Multitenant migration completed successfully!' as message;