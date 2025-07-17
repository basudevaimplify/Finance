"""
ML Anomaly Detection API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import logging
from pydantic import BaseModel, Field

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Document, JournalEntry, AnomalyDetectionModel, AnomalyDetectionResult,
    ModelPerformanceMetric, DataDriftMetric, ModelAlert, FeatureImportance
)
from app.services.ml_anomaly_detector import MLAnomalyDetector, AnomalyResult
from app.services.ml_feature_engineering import FinancialFeatureEngineer
from app.services.ml_model_monitor import MLModelMonitor

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize ML services
anomaly_detector = MLAnomalyDetector()
feature_engineer = FinancialFeatureEngineer()
model_monitor = MLModelMonitor()

# Pydantic Models
class ModelTrainingRequest(BaseModel):
    model_name: str = Field(..., description="Name of the model")
    model_types: List[str] = Field(default=["isolation_forest", "one_class_svm"], description="Types of models to train")
    training_data_days: int = Field(default=90, description="Number of days of historical data to use")
    contamination_rate: float = Field(default=0.1, description="Expected contamination rate")

class AnomalyDetectionRequest(BaseModel):
    model_name: str = Field(..., description="Name of the model to use")
    document_ids: List[str] = Field(..., description="Document IDs to analyze")
    ensemble_method: str = Field(default="voting", description="Ensemble method")

class ModelReviewRequest(BaseModel):
    result_id: str = Field(..., description="Anomaly result ID")
    review_status: str = Field(..., description="Review status")
    review_notes: Optional[str] = Field(None, description="Review notes")

class AlertUpdateRequest(BaseModel):
    alert_id: str = Field(..., description="Alert ID")
    is_resolved: bool = Field(..., description="Resolution status")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")

@router.post("/ml/models/train")
async def train_anomaly_models(
    request: ModelTrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Train anomaly detection models on historical data"""
    
    try:
        # Get training data from journal entries
        cutoff_date = datetime.now() - timedelta(days=request.training_data_days)
        
        journal_entries = db.query(JournalEntry).filter(
            JournalEntry.entry_date >= cutoff_date
        ).all()
        
        if len(journal_entries) < 100:
            raise HTTPException(
                status_code=400,
                detail="Insufficient training data. At least 100 journal entries required."
            )
        
        # Convert to DataFrame
        training_data = pd.DataFrame([
            {
                'id': entry.id,
                'amount': float(entry.debit_amount or entry.credit_amount or 0),
                'debit_amount': float(entry.debit_amount or 0),
                'credit_amount': float(entry.credit_amount or 0),
                'account_code': entry.account_code,
                'entity': entry.entity,
                'entry_date': entry.entry_date,
                'transaction_type': entry.transaction_type or 'journal',
                'balance_before': 0,  # Would need to calculate
                'balance_after': 0    # Would need to calculate
            }
            for entry in journal_entries
        ])
        
        # Start background training
        background_tasks.add_task(
            train_models_background,
            training_data,
            request.model_name,
            request.model_types,
            current_user.id,
            db
        )
        
        return {
            "message": "Model training started",
            "model_name": request.model_name,
            "training_samples": len(training_data),
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Error starting model training: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

async def train_models_background(
    training_data: pd.DataFrame,
    model_name: str,
    model_types: List[str],
    user_id: str,
    db: Session
):
    """Background task for model training"""
    
    try:
        # Train models
        metrics = anomaly_detector.train_models(training_data)
        
        # Create model record
        model_record = AnomalyDetectionModel(
            model_name=model_name,
            model_type=",".join(model_types),
            version="1.0",
            parameters={"model_types": model_types},
            training_data_size=len(training_data),
            training_date=datetime.now(),
            performance_metrics=json.dumps({name: {
                "accuracy": m.accuracy,
                "precision": m.precision,
                "recall": m.recall,
                "f1_score": m.f1_score
            } for name, m in metrics.items()}),
            model_file_path=f"models/{model_name}.joblib",
            created_by=user_id
        )
        
        db.add(model_record)
        
        # Save performance metrics
        for metric_name, metric_data in metrics.items():
            perf_metric = ModelPerformanceMetric(
                model_id=model_record.id,
                metric_name=metric_name,
                metric_value=metric_data.f1_score,
                metric_type="f1_score",
                measurement_date=datetime.now(),
                samples_processed=metric_data.training_samples,
                anomalies_detected=0,
                processing_time_ms=0.0
            )
            db.add(perf_metric)
        
        # Save models to disk
        anomaly_detector.save_models(f"models/{model_name}.joblib")
        
        db.commit()
        logger.info(f"Model training completed for {model_name}")
        
    except Exception as e:
        logger.error(f"Background training failed: {str(e)}")
        db.rollback()

@router.post("/ml/anomalies/detect")
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Detect anomalies in financial data"""
    
    try:
        # Get model
        model = db.query(AnomalyDetectionModel).filter(
            AnomalyDetectionModel.model_name == request.model_name,
            AnomalyDetectionModel.is_active == True
        ).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Load model if not already loaded
        if not anomaly_detector.models:
            anomaly_detector.load_models(model.model_file_path)
        
        # Get data from documents
        documents = db.query(Document).filter(
            Document.id.in_(request.document_ids)
        ).all()
        
        if not documents:
            raise HTTPException(status_code=404, detail="No documents found")
        
        # Get journal entries for these documents
        journal_entries = []
        for doc in documents:
            entries = db.query(JournalEntry).filter(
                JournalEntry.document_id == doc.id
            ).all()
            journal_entries.extend(entries)
        
        if not journal_entries:
            raise HTTPException(status_code=400, detail="No journal entries found")
        
        # Convert to DataFrame
        analysis_data = pd.DataFrame([
            {
                'id': entry.id,
                'amount': float(entry.debit_amount or entry.credit_amount or 0),
                'debit_amount': float(entry.debit_amount or 0),
                'credit_amount': float(entry.credit_amount or 0),
                'account_code': entry.account_code,
                'entity': entry.entity,
                'entry_date': entry.entry_date,
                'transaction_type': entry.transaction_type or 'journal',
                'balance_before': 0,
                'balance_after': 0
            }
            for entry in journal_entries
        ])
        
        # Detect anomalies
        start_time = datetime.now()
        anomaly_results = anomaly_detector.detect_anomalies(
            analysis_data, 
            ensemble_method=request.ensemble_method
        )
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Save results to database
        saved_results = []
        for result in anomaly_results:
            # Find corresponding document
            entry = next((e for e in journal_entries if e.id == result.transaction_id), None)
            document_id = entry.document_id if entry else None
            
            db_result = AnomalyDetectionResult(
                model_id=model.id,
                transaction_id=result.transaction_id,
                document_id=document_id,
                anomaly_score=float(result.anomaly_score),
                is_anomaly=result.is_anomaly,
                confidence_level=float(result.confidence_level),
                anomaly_reasons=result.anomaly_reasons,
                detection_method=result.detection_method,
                model_version=model.version
            )
            
            db.add(db_result)
            saved_results.append(db_result)
        
        # Monitor performance if we have ground truth
        model_monitor.monitor_model_performance(
            model.model_name,
            np.array([-1 if r.is_anomaly else 1 for r in anomaly_results]),
            np.array([1] * len(anomaly_results)),  # Placeholder - would need actual labels
            processing_time
        )
        
        db.commit()
        
        return {
            "model_name": request.model_name,
            "total_transactions": len(analysis_data),
            "anomalies_detected": sum(1 for r in anomaly_results if r.is_anomaly),
            "anomaly_rate": sum(1 for r in anomaly_results if r.is_anomaly) / len(anomaly_results),
            "processing_time_ms": processing_time,
            "results": [
                {
                    "transaction_id": r.transaction_id,
                    "is_anomaly": r.is_anomaly,
                    "anomaly_score": r.anomaly_score,
                    "confidence_level": r.confidence_level,
                    "anomaly_reasons": r.anomaly_reasons
                }
                for r in anomaly_results
            ]
        }
        
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@router.get("/ml/models")
async def get_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all anomaly detection models"""
    
    models = db.query(AnomalyDetectionModel).filter(
        AnomalyDetectionModel.is_active == True
    ).all()
    
    return [
        {
            "id": model.id,
            "model_name": model.model_name,
            "model_type": model.model_type,
            "version": model.version,
            "training_data_size": model.training_data_size,
            "training_date": model.training_date.isoformat() if model.training_date else None,
            "performance_metrics": json.loads(model.performance_metrics) if model.performance_metrics else {},
            "is_active": model.is_active,
            "created_at": model.created_at.isoformat()
        }
        for model in models
    ]

@router.get("/ml/anomalies")
async def get_anomalies(
    limit: int = 50,
    offset: int = 0,
    model_name: Optional[str] = None,
    review_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get anomaly detection results"""
    
    query = db.query(AnomalyDetectionResult)
    
    if model_name:
        model = db.query(AnomalyDetectionModel).filter(
            AnomalyDetectionModel.model_name == model_name
        ).first()
        if model:
            query = query.filter(AnomalyDetectionResult.model_id == model.id)
    
    if review_status:
        query = query.filter(AnomalyDetectionResult.review_status == review_status)
    
    results = query.order_by(
        AnomalyDetectionResult.detected_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        {
            "id": result.id,
            "transaction_id": result.transaction_id,
            "document_id": result.document_id,
            "anomaly_score": float(result.anomaly_score),
            "is_anomaly": result.is_anomaly,
            "confidence_level": float(result.confidence_level),
            "anomaly_reasons": result.anomaly_reasons,
            "detection_method": result.detection_method,
            "model_version": result.model_version,
            "detected_at": result.detected_at.isoformat(),
            "review_status": result.review_status,
            "review_notes": result.review_notes
        }
        for result in results
    ]

@router.post("/ml/anomalies/{result_id}/review")
async def review_anomaly(
    result_id: str,
    request: ModelReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Review an anomaly detection result"""
    
    result = db.query(AnomalyDetectionResult).filter(
        AnomalyDetectionResult.id == result_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Anomaly result not found")
    
    result.review_status = request.review_status
    result.review_notes = request.review_notes
    result.reviewed_by = current_user.id
    
    db.commit()
    
    return {
        "message": "Anomaly review updated",
        "result_id": result_id,
        "review_status": request.review_status
    }

@router.get("/ml/monitoring/performance")
async def get_model_performance(
    model_name: Optional[str] = None,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model performance metrics"""
    
    cutoff_date = datetime.now() - timedelta(days=days)
    
    query = db.query(ModelPerformanceMetric).filter(
        ModelPerformanceMetric.measurement_date >= cutoff_date
    )
    
    if model_name:
        model = db.query(AnomalyDetectionModel).filter(
            AnomalyDetectionModel.model_name == model_name
        ).first()
        if model:
            query = query.filter(ModelPerformanceMetric.model_id == model.id)
    
    metrics = query.order_by(
        ModelPerformanceMetric.measurement_date.desc()
    ).all()
    
    return [
        {
            "model_name": metric.model.model_name,
            "metric_name": metric.metric_name,
            "metric_value": float(metric.metric_value),
            "metric_type": metric.metric_type,
            "measurement_date": metric.measurement_date.isoformat(),
            "samples_processed": metric.samples_processed,
            "anomalies_detected": metric.anomalies_detected,
            "processing_time_ms": float(metric.processing_time_ms)
        }
        for metric in metrics
    ]

@router.get("/ml/monitoring/alerts")
async def get_alerts(
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model alerts"""
    
    query = db.query(ModelAlert)
    
    if severity:
        query = query.filter(ModelAlert.severity == severity)
    
    if resolved is not None:
        query = query.filter(ModelAlert.is_resolved == resolved)
    
    alerts = query.order_by(ModelAlert.created_at.desc()).all()
    
    return [
        {
            "id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "model_name": alert.model.model_name if alert.model else None,
            "metric_name": alert.metric_name,
            "current_value": float(alert.current_value),
            "threshold_value": float(alert.threshold_value),
            "description": alert.description,
            "recommendation": alert.recommendation,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at.isoformat()
        }
        for alert in alerts
    ]

@router.post("/ml/monitoring/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    request: AlertUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resolve a model alert"""
    
    alert = db.query(ModelAlert).filter(ModelAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = request.is_resolved
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.now()
    
    db.commit()
    
    return {
        "message": "Alert resolved",
        "alert_id": alert_id,
        "is_resolved": request.is_resolved
    }

@router.get("/ml/features/importance")
async def get_feature_importance(
    model_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get feature importance for a model"""
    
    model = db.query(AnomalyDetectionModel).filter(
        AnomalyDetectionModel.model_name == model_name
    ).first()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    importance = db.query(FeatureImportance).filter(
        FeatureImportance.model_id == model.id
    ).order_by(FeatureImportance.rank).all()
    
    return [
        {
            "feature_name": item.feature_name,
            "importance_score": float(item.importance_score),
            "rank": item.rank,
            "category": item.category,
            "description": item.description
        }
        for item in importance
    ]

@router.get("/ml/models/{model_name}/health")
async def get_model_health(
    model_name: str,
    hours: int = 24,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive model health report"""
    
    model = db.query(AnomalyDetectionModel).filter(
        AnomalyDetectionModel.model_name == model_name
    ).first()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Get model health from monitor
    health_report = model_monitor.get_model_health_report(
        model_name,
        timedelta(hours=hours)
    )
    
    return health_report