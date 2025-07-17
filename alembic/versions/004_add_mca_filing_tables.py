"""Add MCA Filing tables

Revision ID: 004
Revises: 003
Create Date: 2025-01-13 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Create mca_filings table
    op.create_table('mca_filings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('company_id', sa.String(), nullable=True),
        sa.Column('form_type', sa.String(), nullable=False),
        sa.Column('financial_year', sa.String(), nullable=False),
        sa.Column('filing_date', sa.DateTime(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('form_data', sa.JSON(), nullable=True),
        sa.Column('xml_content', sa.Text(), nullable=True),
        sa.Column('validation_errors', sa.JSON(), nullable=True),
        sa.Column('submission_reference', sa.String(), nullable=True),
        sa.Column('fees_paid', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create mca_filing_documents table
    op.create_table('mca_filing_documents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('filing_id', sa.String(), nullable=True),
        sa.Column('document_type', sa.String(), nullable=False),
        sa.Column('document_name', sa.String(), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=True),
        sa.Column('upload_date', sa.DateTime(), nullable=True),
        sa.Column('uploaded_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['filing_id'], ['mca_filings.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create mca_compliance_checks table
    op.create_table('mca_compliance_checks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('filing_id', sa.String(), nullable=True),
        sa.Column('check_type', sa.String(), nullable=False),
        sa.Column('check_name', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('result_data', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('checked_at', sa.DateTime(), nullable=True),
        sa.Column('checked_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['filing_id'], ['mca_filings.id'], ),
        sa.ForeignKeyConstraint(['checked_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create company_master table
    op.create_table('company_master',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('cin', sa.String(), nullable=False),
        sa.Column('company_name', sa.String(), nullable=False),
        sa.Column('registration_number', sa.String(), nullable=True),
        sa.Column('date_of_incorporation', sa.Date(), nullable=True),
        sa.Column('registered_address', sa.Text(), nullable=True),
        sa.Column('pin_code', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('authorized_capital', sa.DECIMAL(precision=15, scale=2), nullable=True),
        sa.Column('paid_up_capital', sa.DECIMAL(precision=15, scale=2), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('sub_category', sa.String(), nullable=True),
        sa.Column('roc_code', sa.String(), nullable=True),
        sa.Column('activity_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cin')
    )

    # Create director_master table
    op.create_table('director_master',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('company_id', sa.String(), nullable=True),
        sa.Column('din', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('designation', sa.String(), nullable=True),
        sa.Column('appointment_date', sa.Date(), nullable=True),
        sa.Column('cessation_date', sa.Date(), nullable=True),
        sa.Column('nationality', sa.String(), nullable=True),
        sa.Column('qualification', sa.String(), nullable=True),
        sa.Column('experience', sa.Text(), nullable=True),
        sa.Column('pan', sa.String(), nullable=True),
        sa.Column('aadhaar_masked', sa.String(), nullable=True),
        sa.Column('is_independent', sa.Boolean(), nullable=True),
        sa.Column('is_woman_director', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company_master.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create shareholding_pattern table
    op.create_table('shareholding_pattern',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('company_id', sa.String(), nullable=True),
        sa.Column('shareholder_category', sa.String(), nullable=False),
        sa.Column('shareholder_name', sa.String(), nullable=True),
        sa.Column('no_of_shares', sa.Integer(), nullable=True),
        sa.Column('percentage', sa.DECIMAL(precision=5, scale=2), nullable=True),
        sa.Column('voting_rights', sa.DECIMAL(precision=5, scale=2), nullable=True),
        sa.Column('par_value', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('as_on_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company_master.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create mca_filing_templates table
    op.create_table('mca_filing_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('form_type', sa.String(), nullable=False),
        sa.Column('template_name', sa.String(), nullable=True),
        sa.Column('template_data', sa.JSON(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create mca_filing_history table
    op.create_table('mca_filing_history',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('filing_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('old_status', sa.String(), nullable=True),
        sa.Column('new_status', sa.String(), nullable=True),
        sa.Column('performed_by', sa.String(), nullable=True),
        sa.Column('performed_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['filing_id'], ['mca_filings.id'], ),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create mca_deadlines table
    op.create_table('mca_deadlines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('form_type', sa.String(), nullable=False),
        sa.Column('company_category', sa.String(), nullable=True),
        sa.Column('financial_year', sa.String(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('penalty_amount', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create mca_fee_master table
    op.create_table('mca_fee_master',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('form_type', sa.String(), nullable=False),
        sa.Column('company_category', sa.String(), nullable=True),
        sa.Column('authorized_capital_min', sa.DECIMAL(precision=15, scale=2), nullable=True),
        sa.Column('authorized_capital_max', sa.DECIMAL(precision=15, scale=2), nullable=True),
        sa.Column('base_fee', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('additional_fee', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('penalty_per_day', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('maximum_penalty', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for better performance
    op.create_index('idx_mca_filings_company_id', 'mca_filings', ['company_id'])
    op.create_index('idx_mca_filings_form_type', 'mca_filings', ['form_type'])
    op.create_index('idx_mca_filings_status', 'mca_filings', ['status'])
    op.create_index('idx_mca_filings_financial_year', 'mca_filings', ['financial_year'])
    op.create_index('idx_mca_filing_documents_filing_id', 'mca_filing_documents', ['filing_id'])
    op.create_index('idx_company_master_user_id', 'company_master', ['user_id'])
    op.create_index('idx_director_master_company_id', 'director_master', ['company_id'])
    op.create_index('idx_director_master_din', 'director_master', ['din'])
    op.create_index('idx_shareholding_pattern_company_id', 'shareholding_pattern', ['company_id'])
    op.create_index('idx_mca_deadlines_form_type', 'mca_deadlines', ['form_type'])
    op.create_index('idx_mca_deadlines_due_date', 'mca_deadlines', ['due_date'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_mca_deadlines_due_date', table_name='mca_deadlines')
    op.drop_index('idx_mca_deadlines_form_type', table_name='mca_deadlines')
    op.drop_index('idx_shareholding_pattern_company_id', table_name='shareholding_pattern')
    op.drop_index('idx_director_master_din', table_name='director_master')
    op.drop_index('idx_director_master_company_id', table_name='director_master')
    op.drop_index('idx_company_master_user_id', table_name='company_master')
    op.drop_index('idx_mca_filing_documents_filing_id', table_name='mca_filing_documents')
    op.drop_index('idx_mca_filings_financial_year', table_name='mca_filings')
    op.drop_index('idx_mca_filings_status', table_name='mca_filings')
    op.drop_index('idx_mca_filings_form_type', table_name='mca_filings')
    op.drop_index('idx_mca_filings_company_id', table_name='mca_filings')
    
    # Drop tables
    op.drop_table('mca_fee_master')
    op.drop_table('mca_deadlines')
    op.drop_table('mca_filing_history')
    op.drop_table('mca_filing_templates')
    op.drop_table('shareholding_pattern')
    op.drop_table('director_master')
    op.drop_table('company_master')
    op.drop_table('mca_compliance_checks')
    op.drop_table('mca_filing_documents')
    op.drop_table('mca_filings')