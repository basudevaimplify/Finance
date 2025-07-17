"""
ML Model Monitoring Service for Anomaly Detection
Monitors model performance, drift, and provides alerts
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.utils import resample
import json
import warnings
warnings.filterwarnings('ignore')

@dataclass
class ModelPerformanceMetrics:
    """Model performance metrics"""
    timestamp: datetime
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    false_negative_rate: float
    true_positive_rate: float
    true_negative_rate: float
    roc_auc: float
    pr_auc: float
    samples_processed: int
    anomalies_detected: int
    processing_time_ms: float

@dataclass
class DataDriftMetrics:
    """Data drift detection metrics"""
    timestamp: datetime
    feature_name: str
    drift_score: float
    drift_threshold: float
    is_drift_detected: bool
    drift_type: str  # 'mean', 'variance', 'distribution'
    statistical_test: str
    p_value: float
    reference_period: str
    current_period: str

@dataclass
class ModelAlert:
    """Model monitoring alert"""
    timestamp: datetime
    alert_type: str  # 'performance', 'drift', 'error', 'anomaly_rate'
    severity: str    # 'low', 'medium', 'high', 'critical'
    model_name: str
    metric_name: str
    current_value: float
    threshold_value: float
    description: str
    recommendation: str

class MLModelMonitor:
    """
    Comprehensive ML model monitoring system
    Tracks performance, detects drift, and provides alerts
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.performance_history = []
        self.drift_history = []
        self.alerts = []
        self.model_baselines = {}
        self.alert_thresholds = {
            'accuracy': {'low': 0.7, 'medium': 0.8, 'high': 0.9},
            'precision': {'low': 0.6, 'medium': 0.7, 'high': 0.8},
            'recall': {'low': 0.6, 'medium': 0.7, 'high': 0.8},
            'f1_score': {'low': 0.6, 'medium': 0.7, 'high': 0.8},
            'false_positive_rate': {'low': 0.3, 'medium': 0.2, 'high': 0.1},
            'drift_score': {'low': 0.3, 'medium': 0.5, 'high': 0.7},
            'anomaly_rate': {'low': 0.05, 'medium': 0.1, 'high': 0.2}
        }
        
    def monitor_model_performance(self, model_name: str, predictions: np.ndarray, 
                                true_labels: np.ndarray, processing_time_ms: float) -> ModelPerformanceMetrics:
        """
        Monitor model performance and generate metrics
        
        Args:
            model_name: Name of the model
            predictions: Model predictions
            true_labels: Ground truth labels
            processing_time_ms: Processing time in milliseconds
            
        Returns:
            Performance metrics
        """
        
        # Convert to binary format
        pred_binary = (predictions == -1).astype(int)
        true_binary = (true_labels == -1).astype(int)
        
        # Calculate metrics
        accuracy = accuracy_score(true_binary, pred_binary)
        precision = precision_score(true_binary, pred_binary, zero_division=0)
        recall = recall_score(true_binary, pred_binary, zero_division=0)
        f1 = f1_score(true_binary, pred_binary, zero_division=0)
        
        # Confusion matrix components
        tp = np.sum((pred_binary == 1) & (true_binary == 1))
        tn = np.sum((pred_binary == 0) & (true_binary == 0))
        fp = np.sum((pred_binary == 1) & (true_binary == 0))
        fn = np.sum((pred_binary == 0) & (true_binary == 1))
        
        # Calculate rates
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
        tnr = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        # ROC AUC and PR AUC (simplified calculation)
        roc_auc = self._calculate_roc_auc(true_binary, pred_binary)
        pr_auc = self._calculate_pr_auc(true_binary, pred_binary)
        
        # Create metrics object
        metrics = ModelPerformanceMetrics(
            timestamp=datetime.now(),
            model_name=model_name,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            false_positive_rate=fpr,
            false_negative_rate=fnr,
            true_positive_rate=tpr,
            true_negative_rate=tnr,
            roc_auc=roc_auc,
            pr_auc=pr_auc,
            samples_processed=len(predictions),
            anomalies_detected=np.sum(pred_binary),
            processing_time_ms=processing_time_ms
        )
        
        # Store in history
        self.performance_history.append(metrics)
        
        # Check for alerts
        self._check_performance_alerts(metrics)
        
        self.logger.info(f"Performance monitoring completed for {model_name}")
        return metrics
    
    def detect_data_drift(self, reference_data: pd.DataFrame, current_data: pd.DataFrame,
                         feature_columns: List[str]) -> List[DataDriftMetrics]:
        """
        Detect data drift in features
        
        Args:
            reference_data: Reference dataset (baseline)
            current_data: Current dataset
            feature_columns: List of features to monitor
            
        Returns:
            List of drift metrics
        """
        
        drift_results = []
        
        for feature in feature_columns:
            if feature not in reference_data.columns or feature not in current_data.columns:
                continue
                
            ref_values = reference_data[feature].dropna()
            curr_values = current_data[feature].dropna()
            
            if len(ref_values) == 0 or len(curr_values) == 0:
                continue
            
            # Mean drift
            mean_drift = self._detect_mean_drift(ref_values, curr_values)
            drift_results.append(mean_drift)
            
            # Variance drift
            var_drift = self._detect_variance_drift(ref_values, curr_values)
            drift_results.append(var_drift)
            
            # Distribution drift (KS test)
            dist_drift = self._detect_distribution_drift(ref_values, curr_values)
            drift_results.append(dist_drift)
        
        # Store in history
        self.drift_history.extend(drift_results)
        
        # Check for drift alerts
        for drift_metric in drift_results:
            if drift_metric.is_drift_detected:
                self._create_drift_alert(drift_metric)
        
        return drift_results
    
    def _detect_mean_drift(self, reference: pd.Series, current: pd.Series) -> DataDriftMetrics:
        """Detect mean drift using t-test"""
        from scipy import stats
        
        # Perform t-test
        statistic, p_value = stats.ttest_ind(reference, current)
        
        # Calculate drift score
        mean_diff = abs(current.mean() - reference.mean())
        ref_std = reference.std()
        drift_score = mean_diff / (ref_std + 1e-6)
        
        threshold = 2.0  # 2 standard deviations
        is_drift = drift_score > threshold or p_value < 0.05
        
        return DataDriftMetrics(
            timestamp=datetime.now(),
            feature_name=reference.name,
            drift_score=drift_score,
            drift_threshold=threshold,
            is_drift_detected=is_drift,
            drift_type='mean',
            statistical_test='t-test',
            p_value=p_value,
            reference_period='baseline',
            current_period='current'
        )
    
    def _detect_variance_drift(self, reference: pd.Series, current: pd.Series) -> DataDriftMetrics:
        """Detect variance drift using F-test"""
        from scipy import stats
        
        # Perform F-test
        f_statistic = current.var() / (reference.var() + 1e-6)
        df1 = len(current) - 1
        df2 = len(reference) - 1
        p_value = 1 - stats.f.cdf(f_statistic, df1, df2)
        
        # Calculate drift score
        var_ratio = max(current.var(), reference.var()) / (min(current.var(), reference.var()) + 1e-6)
        drift_score = abs(np.log(var_ratio))
        
        threshold = 1.0  # log variance ratio threshold
        is_drift = drift_score > threshold or p_value < 0.05
        
        return DataDriftMetrics(
            timestamp=datetime.now(),
            feature_name=reference.name,
            drift_score=drift_score,
            drift_threshold=threshold,
            is_drift_detected=is_drift,
            drift_type='variance',
            statistical_test='f-test',
            p_value=p_value,
            reference_period='baseline',
            current_period='current'
        )
    
    def _detect_distribution_drift(self, reference: pd.Series, current: pd.Series) -> DataDriftMetrics:
        """Detect distribution drift using Kolmogorov-Smirnov test"""
        from scipy import stats
        
        # Perform KS test
        ks_statistic, p_value = stats.ks_2samp(reference, current)
        
        drift_score = ks_statistic
        threshold = 0.1  # KS statistic threshold
        is_drift = drift_score > threshold or p_value < 0.05
        
        return DataDriftMetrics(
            timestamp=datetime.now(),
            feature_name=reference.name,
            drift_score=drift_score,
            drift_threshold=threshold,
            is_drift_detected=is_drift,
            drift_type='distribution',
            statistical_test='ks-test',
            p_value=p_value,
            reference_period='baseline',
            current_period='current'
        )
    
    def _calculate_roc_auc(self, true_labels: np.ndarray, predictions: np.ndarray) -> float:
        """Calculate ROC AUC score"""
        try:
            from sklearn.metrics import roc_auc_score
            return roc_auc_score(true_labels, predictions)
        except:
            # Fallback calculation
            return 0.5 + abs(np.mean(predictions[true_labels == 1]) - np.mean(predictions[true_labels == 0])) / 4
    
    def _calculate_pr_auc(self, true_labels: np.ndarray, predictions: np.ndarray) -> float:
        """Calculate Precision-Recall AUC score"""
        try:
            from sklearn.metrics import average_precision_score
            return average_precision_score(true_labels, predictions)
        except:
            # Fallback calculation
            precision = np.sum((predictions == 1) & (true_labels == 1)) / np.sum(predictions == 1)
            recall = np.sum((predictions == 1) & (true_labels == 1)) / np.sum(true_labels == 1)
            return (precision + recall) / 2 if (precision + recall) > 0 else 0
    
    def _check_performance_alerts(self, metrics: ModelPerformanceMetrics):
        """Check for performance-based alerts"""
        
        # Check accuracy
        if metrics.accuracy < self.alert_thresholds['accuracy']['high']:
            severity = 'high' if metrics.accuracy < self.alert_thresholds['accuracy']['low'] else 'medium'
            self._create_alert(
                'performance', severity, metrics.model_name, 'accuracy',
                metrics.accuracy, self.alert_thresholds['accuracy']['high'],
                f"Model accuracy ({metrics.accuracy:.3f}) below threshold",
                "Consider retraining the model or adjusting thresholds"
            )
        
        # Check precision
        if metrics.precision < self.alert_thresholds['precision']['high']:
            severity = 'high' if metrics.precision < self.alert_thresholds['precision']['low'] else 'medium'
            self._create_alert(
                'performance', severity, metrics.model_name, 'precision',
                metrics.precision, self.alert_thresholds['precision']['high'],
                f"Model precision ({metrics.precision:.3f}) below threshold",
                "High false positive rate detected. Review model or adjust threshold"
            )
        
        # Check recall
        if metrics.recall < self.alert_thresholds['recall']['high']:
            severity = 'high' if metrics.recall < self.alert_thresholds['recall']['low'] else 'medium'
            self._create_alert(
                'performance', severity, metrics.model_name, 'recall',
                metrics.recall, self.alert_thresholds['recall']['high'],
                f"Model recall ({metrics.recall:.3f}) below threshold",
                "High false negative rate detected. Model may be missing anomalies"
            )
        
        # Check anomaly rate
        anomaly_rate = metrics.anomalies_detected / metrics.samples_processed
        if anomaly_rate > self.alert_thresholds['anomaly_rate']['high']:
            self._create_alert(
                'anomaly_rate', 'high', metrics.model_name, 'anomaly_rate',
                anomaly_rate, self.alert_thresholds['anomaly_rate']['high'],
                f"Anomaly rate ({anomaly_rate:.3f}) unusually high",
                "Investigate potential data quality issues or model drift"
            )
    
    def _create_drift_alert(self, drift_metric: DataDriftMetrics):
        """Create alert for data drift"""
        severity = 'high' if drift_metric.drift_score > 1.0 else 'medium'
        
        self._create_alert(
            'drift', severity, 'data_monitor', drift_metric.feature_name,
            drift_metric.drift_score, drift_metric.drift_threshold,
            f"Data drift detected in {drift_metric.feature_name} ({drift_metric.drift_type})",
            f"Feature distribution has changed. Consider model retraining or feature engineering"
        )
    
    def _create_alert(self, alert_type: str, severity: str, model_name: str, 
                     metric_name: str, current_value: float, threshold_value: float,
                     description: str, recommendation: str):
        """Create and store alert"""
        
        alert = ModelAlert(
            timestamp=datetime.now(),
            alert_type=alert_type,
            severity=severity,
            model_name=model_name,
            metric_name=metric_name,
            current_value=current_value,
            threshold_value=threshold_value,
            description=description,
            recommendation=recommendation
        )
        
        self.alerts.append(alert)
        self.logger.warning(f"Alert created: {description}")
    
    def get_model_health_report(self, model_name: str, 
                              time_window: timedelta = timedelta(hours=24)) -> Dict[str, Any]:
        """
        Generate comprehensive model health report
        
        Args:
            model_name: Name of the model
            time_window: Time window for analysis
            
        Returns:
            Health report dictionary
        """
        
        cutoff_time = datetime.now() - time_window
        
        # Filter recent metrics
        recent_metrics = [m for m in self.performance_history 
                         if m.model_name == model_name and m.timestamp > cutoff_time]
        
        recent_alerts = [a for a in self.alerts 
                        if a.model_name == model_name and a.timestamp > cutoff_time]
        
        if not recent_metrics:
            return {
                'model_name': model_name,
                'status': 'no_data',
                'message': 'No recent performance data available'
            }
        
        # Calculate aggregate metrics
        latest_metrics = recent_metrics[-1]
        avg_accuracy = np.mean([m.accuracy for m in recent_metrics])
        avg_precision = np.mean([m.precision for m in recent_metrics])
        avg_recall = np.mean([m.recall for m in recent_metrics])
        avg_f1 = np.mean([m.f1_score for m in recent_metrics])
        
        total_samples = sum(m.samples_processed for m in recent_metrics)
        total_anomalies = sum(m.anomalies_detected for m in recent_metrics)
        anomaly_rate = total_anomalies / total_samples if total_samples > 0 else 0
        
        # Determine overall health status
        health_status = self._determine_health_status(recent_metrics, recent_alerts)
        
        # Performance trends
        performance_trend = self._calculate_performance_trend(recent_metrics)
        
        return {
            'model_name': model_name,
            'status': health_status,
            'time_window': str(time_window),
            'latest_metrics': {
                'accuracy': latest_metrics.accuracy,
                'precision': latest_metrics.precision,
                'recall': latest_metrics.recall,
                'f1_score': latest_metrics.f1_score,
                'false_positive_rate': latest_metrics.false_positive_rate,
                'processing_time_ms': latest_metrics.processing_time_ms
            },
            'average_metrics': {
                'accuracy': avg_accuracy,
                'precision': avg_precision,
                'recall': avg_recall,
                'f1_score': avg_f1
            },
            'volume_metrics': {
                'total_samples': total_samples,
                'total_anomalies': total_anomalies,
                'anomaly_rate': anomaly_rate,
                'prediction_runs': len(recent_metrics)
            },
            'performance_trend': performance_trend,
            'recent_alerts': len(recent_alerts),
            'alert_summary': self._summarize_alerts(recent_alerts),
            'recommendations': self._generate_recommendations(recent_metrics, recent_alerts)
        }
    
    def _determine_health_status(self, metrics: List[ModelPerformanceMetrics], 
                               alerts: List[ModelAlert]) -> str:
        """Determine overall model health status"""
        
        if not metrics:
            return 'unknown'
        
        latest = metrics[-1]
        
        # Check for critical alerts
        critical_alerts = [a for a in alerts if a.severity == 'critical']
        if critical_alerts:
            return 'critical'
        
        # Check for high severity alerts
        high_alerts = [a for a in alerts if a.severity == 'high']
        if high_alerts:
            return 'poor'
        
        # Check performance thresholds
        if (latest.accuracy < 0.7 or latest.precision < 0.6 or latest.recall < 0.6):
            return 'poor'
        elif (latest.accuracy < 0.8 or latest.precision < 0.7 or latest.recall < 0.7):
            return 'fair'
        elif (latest.accuracy >= 0.9 and latest.precision >= 0.8 and latest.recall >= 0.8):
            return 'excellent'
        else:
            return 'good'
    
    def _calculate_performance_trend(self, metrics: List[ModelPerformanceMetrics]) -> str:
        """Calculate performance trend over time"""
        
        if len(metrics) < 2:
            return 'stable'
        
        # Calculate trend for accuracy
        accuracies = [m.accuracy for m in metrics]
        if len(accuracies) >= 3:
            recent_avg = np.mean(accuracies[-3:])
            older_avg = np.mean(accuracies[:-3]) if len(accuracies) > 3 else accuracies[0]
            
            if recent_avg > older_avg + 0.05:
                return 'improving'
            elif recent_avg < older_avg - 0.05:
                return 'declining'
        
        return 'stable'
    
    def _summarize_alerts(self, alerts: List[ModelAlert]) -> Dict[str, int]:
        """Summarize alerts by type and severity"""
        
        summary = {
            'total': len(alerts),
            'by_severity': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
            'by_type': {'performance': 0, 'drift': 0, 'error': 0, 'anomaly_rate': 0}
        }
        
        for alert in alerts:
            summary['by_severity'][alert.severity] += 1
            summary['by_type'][alert.alert_type] += 1
        
        return summary
    
    def _generate_recommendations(self, metrics: List[ModelPerformanceMetrics], 
                                alerts: List[ModelAlert]) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if not metrics:
            return recommendations
        
        latest = metrics[-1]
        
        # Performance-based recommendations
        if latest.accuracy < 0.8:
            recommendations.append("Model accuracy is below acceptable threshold. Consider retraining with more recent data.")
        
        if latest.precision < 0.7:
            recommendations.append("High false positive rate detected. Review model parameters or adjust decision threshold.")
        
        if latest.recall < 0.7:
            recommendations.append("High false negative rate detected. Model may be missing anomalies. Consider ensemble methods.")
        
        # Alert-based recommendations
        drift_alerts = [a for a in alerts if a.alert_type == 'drift']
        if drift_alerts:
            recommendations.append("Data drift detected. Update training data and retrain models.")
        
        # Volume-based recommendations
        anomaly_rate = latest.anomalies_detected / latest.samples_processed
        if anomaly_rate > 0.2:
            recommendations.append("Unusually high anomaly rate. Investigate data quality or model calibration.")
        
        return recommendations
    
    def export_monitoring_data(self, filepath: str):
        """Export monitoring data to JSON file"""
        
        data = {
            'performance_history': [asdict(m) for m in self.performance_history],
            'drift_history': [asdict(d) for d in self.drift_history],
            'alerts': [asdict(a) for a in self.alerts],
            'alert_thresholds': self.alert_thresholds,
            'export_timestamp': datetime.now().isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        self.logger.info(f"Monitoring data exported to {filepath}")
    
    def get_active_alerts(self, severity_filter: Optional[str] = None) -> List[ModelAlert]:
        """Get active alerts with optional severity filtering"""
        
        # Consider alerts from last 24 hours as active
        cutoff_time = datetime.now() - timedelta(hours=24)
        active_alerts = [a for a in self.alerts if a.timestamp > cutoff_time]
        
        if severity_filter:
            active_alerts = [a for a in active_alerts if a.severity == severity_filter]
        
        return active_alerts