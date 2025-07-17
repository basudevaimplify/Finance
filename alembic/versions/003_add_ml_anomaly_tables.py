"""Add ML Anomaly Detection tables

Revision ID: 003
Revises: 002
Create Date: 2025-01-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Create anomaly_detection_models table
    op.create_table('anomaly_detection_models',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('model_type', sa.String(), nullable=True),
        sa.Column('version', sa.String(), nullable=True),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('training_data_size', sa.Integer(), nullable=True),
        sa.Column('training_date', sa.DateTime(), nullable=True),
        sa.Column('performance_metrics', sa.JSON(), nullable=True),
        sa.Column('model_file_path', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create anomaly_detection_results table
    op.create_table('anomaly_detection_results',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('model_id', sa.String(), nullable=True),
        sa.Column('transaction_id', sa.String(), nullable=True),
        sa.Column('document_id', sa.String(), nullable=True),
        sa.Column('anomaly_score', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=True),
        sa.Column('confidence_level', sa.DECIMAL(precision=5, scale=4), nullable=True),
        sa.Column('anomaly_reasons', sa.JSON(), nullable=True),
        sa.Column('detection_method', sa.String(), nullable=True),
        sa.Column('features_used', sa.JSON(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('detected_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.String(), nullable=True),
        sa.Column('review_status', sa.String(), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.ForeignKeyConstraint(['model_id'], ['anomaly_detection_models.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create model_performance_metrics table
    op.create_table('model_performance_metrics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('model_id', sa.String(), nullable=True),
        sa.Column('metric_name', sa.String(), nullable=True),
        sa.Column('metric_value', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('metric_type', sa.String(), nullable=True),
        sa.Column('measurement_date', sa.DateTime(), nullable=True),
        sa.Column('samples_processed', sa.Integer(), nullable=True),
        sa.Column('anomalies_detected', sa.Integer(), nullable=True),
        sa.Column('processing_time_ms', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('data_window', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['anomaly_detection_models.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create data_drift_metrics table
    op.create_table('data_drift_metrics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('feature_name', sa.String(), nullable=True),
        sa.Column('drift_score', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('drift_threshold', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('is_drift_detected', sa.Boolean(), nullable=True),
        sa.Column('drift_type', sa.String(), nullable=True),
        sa.Column('statistical_test', sa.String(), nullable=True),
        sa.Column('p_value', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('reference_period', sa.String(), nullable=True),
        sa.Column('current_period', sa.String(), nullable=True),
        sa.Column('detection_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create model_alerts table
    op.create_table('model_alerts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('model_id', sa.String(), nullable=True),
        sa.Column('metric_name', sa.String(), nullable=True),
        sa.Column('current_value', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('threshold_value', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=True),
        sa.Column('resolved_by', sa.String(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['anomaly_detection_models.id'], ),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create feature_importance table
    op.create_table('feature_importance',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('model_id', sa.String(), nullable=True),
        sa.Column('feature_name', sa.String(), nullable=True),
        sa.Column('importance_score', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('calculation_method', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['anomaly_detection_models.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for better performance
    op.create_index('idx_anomaly_results_model_id', 'anomaly_detection_results', ['model_id'])
    op.create_index('idx_anomaly_results_document_id', 'anomaly_detection_results', ['document_id'])
    op.create_index('idx_anomaly_results_detected_at', 'anomaly_detection_results', ['detected_at'])
    op.create_index('idx_anomaly_results_is_anomaly', 'anomaly_detection_results', ['is_anomaly'])
    op.create_index('idx_performance_metrics_model_id', 'model_performance_metrics', ['model_id'])
    op.create_index('idx_performance_metrics_date', 'model_performance_metrics', ['measurement_date'])
    op.create_index('idx_model_alerts_model_id', 'model_alerts', ['model_id'])
    op.create_index('idx_model_alerts_severity', 'model_alerts', ['severity'])
    op.create_index('idx_model_alerts_resolved', 'model_alerts', ['is_resolved'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_model_alerts_resolved', table_name='model_alerts')
    op.drop_index('idx_model_alerts_severity', table_name='model_alerts')
    op.drop_index('idx_model_alerts_model_id', table_name='model_alerts')
    op.drop_index('idx_performance_metrics_date', table_name='model_performance_metrics')
    op.drop_index('idx_performance_metrics_model_id', table_name='model_performance_metrics')
    op.drop_index('idx_anomaly_results_is_anomaly', table_name='anomaly_detection_results')
    op.drop_index('idx_anomaly_results_detected_at', table_name='anomaly_detection_results')
    op.drop_index('idx_anomaly_results_document_id', table_name='anomaly_detection_results')
    op.drop_index('idx_anomaly_results_model_id', table_name='anomaly_detection_results')
    
    # Drop tables
    op.drop_table('feature_importance')
    op.drop_table('model_alerts')
    op.drop_table('data_drift_metrics')
    op.drop_table('model_performance_metrics')
    op.drop_table('anomaly_detection_results')
    op.drop_table('anomaly_detection_models')