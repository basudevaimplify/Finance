"""
Machine Learning Anomaly Detection Service for Financial Data
Implements multiple ML algorithms for detecting anomalies in financial transactions
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import DBSCAN
from sklearn.covariance import EllipticEnvelope
import joblib
import os

@dataclass
class AnomalyResult:
    """Result of anomaly detection analysis"""
    transaction_id: str
    anomaly_score: float
    is_anomaly: bool
    detection_method: str
    confidence_level: float
    anomaly_reasons: List[str]
    timestamp: datetime

@dataclass
class ModelMetrics:
    """Performance metrics for anomaly detection models"""
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    training_samples: int
    last_updated: datetime

class MLAnomalyDetector:
    """
    Advanced ML-based anomaly detection system for financial data
    Supports multiple algorithms and ensemble methods
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.models = {}
        self.scalers = {}
        self.feature_extractors = {}
        self.model_metrics = {}
        
        # Model configurations
        self.model_configs = {
            'isolation_forest': {
                'contamination': 0.1,
                'n_estimators': 100,
                'max_samples': 'auto',
                'random_state': 42
            },
            'one_class_svm': {
                'nu': 0.05,
                'kernel': 'rbf',
                'gamma': 'scale'
            },
            'elliptic_envelope': {
                'contamination': 0.1,
                'support_fraction': None
            },
            'dbscan': {
                'eps': 0.5,
                'min_samples': 5
            }
        }
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize all ML models"""
        self.models['isolation_forest'] = IsolationForest(**self.model_configs['isolation_forest'])
        self.models['one_class_svm'] = OneClassSVM(**self.model_configs['one_class_svm'])
        self.models['elliptic_envelope'] = EllipticEnvelope(**self.model_configs['elliptic_envelope'])
        self.scalers['default'] = StandardScaler()
    
    def detect_anomalies(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detect anomalies in financial transaction data"""
        if not data:
            return {'anomalies': [], 'total_transactions': 0}
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Extract features
            features = self._extract_features(df)
            
            # Scale features
            scaled_features = self.scalers['default'].fit_transform(features)
            
            # Detect anomalies using isolation forest
            anomaly_predictions = self.models['isolation_forest'].fit_predict(scaled_features)
            
            # Get anomaly scores
            anomaly_scores = self.models['isolation_forest'].decision_function(scaled_features)
            
            # Process results
            anomalies = []
            for i, (prediction, score) in enumerate(zip(anomaly_predictions, anomaly_scores)):
                if prediction == -1:  # Anomaly detected
                    anomalies.append({
                        'transaction_index': i,
                        'anomaly_score': float(score),
                        'original_data': data[i],
                        'confidence': abs(float(score))
                    })
            
            return {
                'anomalies': anomalies,
                'total_transactions': len(data),
                'anomaly_count': len(anomalies),
                'anomaly_rate': len(anomalies) / len(data) * 100 if data else 0
            }
            
        except Exception as e:
            self.logger.error(f"Error in anomaly detection: {str(e)}")
            return {
                'anomalies': [],
                'total_transactions': len(data),
                'error': str(e)
            }
    
    def _extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract numerical features from transaction data"""
        features = []
        
        # Amount feature
        if 'amount' in df.columns:
            features.append(df['amount'].astype(float))
        
        # Add more features as needed
        if 'category' in df.columns:
            # Simple category encoding - convert to numeric
            category_mapping = {cat: i for i, cat in enumerate(df['category'].unique())}
            category_numeric = df['category'].map(category_mapping)
            features.append(category_numeric)
        
        if len(features) == 0:
            # Fallback: use all numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                for col in numeric_cols:
                    features.append(df[col].astype(float))
            else:
                # Ultimate fallback: create a dummy feature
                features.append(np.ones(len(df)))
        
        return np.column_stack(features)
    
    def _initialize_models(self):
        """Initialize all ML models for anomaly detection"""
        self.models['isolation_forest'] = IsolationForest(
            **self.model_configs['isolation_forest']
        )
        
        self.models['one_class_svm'] = OneClassSVM(
            **self.model_configs['one_class_svm']
        )
        
        self.models['elliptic_envelope'] = EllipticEnvelope(
            **self.model_configs['elliptic_envelope']
        )
        
        self.models['dbscan'] = DBSCAN(
            **self.model_configs['dbscan']
        )
        
        # Initialize scalers for each model
        for model_name in self.models.keys():
            self.scalers[model_name] = StandardScaler()
    
    def extract_features(self, financial_data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract relevant features from financial data for anomaly detection
        
        Args:
            financial_data: DataFrame with financial transaction data
            
        Returns:
            DataFrame with extracted features
        """
        features = pd.DataFrame()
        
        # Basic transaction features
        features['amount'] = financial_data['amount']
        features['abs_amount'] = financial_data['amount'].abs()
        features['log_amount'] = np.log1p(financial_data['amount'].abs())
        
        # Time-based features
        if 'transaction_date' in financial_data.columns:
            financial_data['transaction_date'] = pd.to_datetime(financial_data['transaction_date'])
            features['day_of_week'] = financial_data['transaction_date'].dt.dayofweek
            features['hour'] = financial_data['transaction_date'].dt.hour
            features['is_weekend'] = (financial_data['transaction_date'].dt.dayofweek >= 5).astype(int)
            features['is_business_hours'] = (
                (financial_data['transaction_date'].dt.hour >= 9) & 
                (financial_data['transaction_date'].dt.hour <= 17)
            ).astype(int)
        
        # Account-based features
        if 'account_code' in financial_data.columns:
            # Account activity frequency
            account_counts = financial_data['account_code'].value_counts()
            features['account_frequency'] = financial_data['account_code'].map(account_counts)
            
            # Account balance change patterns
            if 'balance_before' in financial_data.columns and 'balance_after' in financial_data.columns:
                features['balance_change'] = financial_data['balance_after'] - financial_data['balance_before']
                features['balance_change_ratio'] = features['balance_change'] / (financial_data['balance_before'] + 1e-6)
        
        # Statistical features
        features['z_score_amount'] = (features['amount'] - features['amount'].mean()) / features['amount'].std()
        
        # Rolling window features
        features['rolling_mean_7d'] = features['amount'].rolling(window=7, min_periods=1).mean()
        features['rolling_std_7d'] = features['amount'].rolling(window=7, min_periods=1).std()
        features['amount_vs_rolling_mean'] = features['amount'] / (features['rolling_mean_7d'] + 1e-6)
        
        # Categorical encoding
        if 'transaction_type' in financial_data.columns:
            transaction_type_encoded = pd.get_dummies(financial_data['transaction_type'], prefix='type')
            features = pd.concat([features, transaction_type_encoded], axis=1)
        
        # Entity-based features
        if 'entity' in financial_data.columns:
            entity_encoded = pd.get_dummies(financial_data['entity'], prefix='entity')
            features = pd.concat([features, entity_encoded], axis=1)
        
        # Fill missing values
        features = features.fillna(0)
        
        return features
    
    def train_models(self, financial_data: pd.DataFrame, labels: Optional[np.ndarray] = None) -> Dict[str, ModelMetrics]:
        """
        Train all anomaly detection models on financial data
        
        Args:
            financial_data: Training data
            labels: Optional ground truth labels for evaluation
            
        Returns:
            Dictionary of model performance metrics
        """
        self.logger.info("Starting anomaly detection model training")
        
        # Extract features
        features = self.extract_features(financial_data)
        
        metrics = {}
        
        for model_name, model in self.models.items():
            try:
                self.logger.info(f"Training {model_name} model")
                
                # Scale features
                scaled_features = self.scalers[model_name].fit_transform(features)
                
                # Train model
                if model_name == 'dbscan':
                    # DBSCAN doesn't have a fit method, it's used for clustering
                    clusters = model.fit_predict(scaled_features)
                    # Consider points in small clusters as anomalies
                    cluster_counts = pd.Series(clusters).value_counts()
                    small_clusters = cluster_counts[cluster_counts < 5].index
                    predictions = np.where(np.isin(clusters, small_clusters), -1, 1)
                else:
                    model.fit(scaled_features)
                    predictions = model.predict(scaled_features)
                
                # Calculate metrics if labels are provided
                if labels is not None:
                    metrics[model_name] = self._calculate_metrics(
                        model_name, labels, predictions, len(financial_data)
                    )
                else:
                    # Default metrics for unsupervised learning
                    anomaly_rate = np.sum(predictions == -1) / len(predictions)
                    metrics[model_name] = ModelMetrics(
                        model_name=model_name,
                        accuracy=1.0 - anomaly_rate,  # Approximation
                        precision=0.0,  # Unknown without labels
                        recall=0.0,     # Unknown without labels
                        f1_score=0.0,   # Unknown without labels
                        false_positive_rate=anomaly_rate,
                        training_samples=len(financial_data),
                        last_updated=datetime.now()
                    )
                
                self.logger.info(f"Successfully trained {model_name} model")
                
            except Exception as e:
                self.logger.error(f"Error training {model_name} model: {str(e)}")
                continue
        
        self.model_metrics = metrics
        return metrics
    
    def _calculate_metrics(self, model_name: str, true_labels: np.ndarray, 
                          predictions: np.ndarray, sample_count: int) -> ModelMetrics:
        """Calculate performance metrics for a model"""
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        # Convert predictions to binary format (1 for normal, -1 for anomaly)
        pred_binary = (predictions == -1).astype(int)
        true_binary = (true_labels == -1).astype(int)
        
        accuracy = accuracy_score(true_binary, pred_binary)
        precision = precision_score(true_binary, pred_binary, zero_division=0)
        recall = recall_score(true_binary, pred_binary, zero_division=0)
        f1 = f1_score(true_binary, pred_binary, zero_division=0)
        
        # False positive rate
        fpr = np.sum((pred_binary == 1) & (true_binary == 0)) / np.sum(true_binary == 0)
        
        return ModelMetrics(
            model_name=model_name,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            false_positive_rate=fpr,
            training_samples=sample_count,
            last_updated=datetime.now()
        )
    
    def detect_anomalies(self, financial_data: pd.DataFrame, 
                        ensemble_method: str = 'voting') -> List[AnomalyResult]:
        """
        Detect anomalies in financial data using trained models
        
        Args:
            financial_data: Data to analyze for anomalies
            ensemble_method: Method for combining model predictions ('voting', 'weighted', 'consensus')
            
        Returns:
            List of anomaly detection results
        """
        self.logger.info(f"Detecting anomalies in {len(financial_data)} transactions")
        
        # Extract features
        features = self.extract_features(financial_data)
        
        # Store predictions from all models
        all_predictions = {}
        all_scores = {}
        
        for model_name, model in self.models.items():
            try:
                # Scale features
                scaled_features = self.scalers[model_name].transform(features)
                
                if model_name == 'dbscan':
                    # DBSCAN clustering approach
                    clusters = model.fit_predict(scaled_features)
                    cluster_counts = pd.Series(clusters).value_counts()
                    small_clusters = cluster_counts[cluster_counts < 5].index
                    predictions = np.where(np.isin(clusters, small_clusters), -1, 1)
                    scores = np.abs(clusters)  # Use cluster labels as proxy for scores
                else:
                    predictions = model.predict(scaled_features)
                    
                    # Get anomaly scores if available
                    if hasattr(model, 'decision_function'):
                        scores = model.decision_function(scaled_features)
                    elif hasattr(model, 'score_samples'):
                        scores = model.score_samples(scaled_features)
                    else:
                        scores = np.random.random(len(predictions))  # Fallback
                
                all_predictions[model_name] = predictions
                all_scores[model_name] = scores
                
            except Exception as e:
                self.logger.error(f"Error in {model_name} prediction: {str(e)}")
                continue
        
        # Ensemble predictions
        final_predictions, final_scores = self._ensemble_predictions(
            all_predictions, all_scores, ensemble_method
        )
        
        # Generate results
        results = []
        for i, (_, row) in enumerate(financial_data.iterrows()):
            # Determine anomaly reasons
            anomaly_reasons = self._analyze_anomaly_reasons(row, features.iloc[i])
            
            result = AnomalyResult(
                transaction_id=row.get('id', f'transaction_{i}'),
                anomaly_score=final_scores[i],
                is_anomaly=final_predictions[i] == -1,
                detection_method=ensemble_method,
                confidence_level=min(abs(final_scores[i]), 1.0),
                anomaly_reasons=anomaly_reasons,
                timestamp=datetime.now()
            )
            results.append(result)
        
        self.logger.info(f"Detected {sum(1 for r in results if r.is_anomaly)} anomalies")
        return results
    
    def _ensemble_predictions(self, predictions: Dict[str, np.ndarray], 
                            scores: Dict[str, np.ndarray], 
                            method: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Combine predictions from multiple models using ensemble method
        """
        if not predictions:
            return np.array([]), np.array([])
        
        pred_matrix = np.column_stack(list(predictions.values()))
        score_matrix = np.column_stack(list(scores.values()))
        
        if method == 'voting':
            # Majority voting
            final_pred = np.array([
                -1 if np.sum(row == -1) > len(row) / 2 else 1 
                for row in pred_matrix
            ])
            final_scores = np.mean(score_matrix, axis=1)
            
        elif method == 'weighted':
            # Weighted by model performance
            weights = []
            for model_name in predictions.keys():
                if model_name in self.model_metrics:
                    weights.append(self.model_metrics[model_name].f1_score)
                else:
                    weights.append(0.5)  # Default weight
            
            weights = np.array(weights)
            if np.sum(weights) == 0:
                weights = np.ones(len(weights))
            weights = weights / np.sum(weights)
            
            final_scores = np.average(score_matrix, axis=1, weights=weights)
            final_pred = np.array([
                -1 if np.average(row == -1, weights=weights) > 0.5 else 1 
                for row in pred_matrix
            ])
            
        elif method == 'consensus':
            # Require consensus from all models
            final_pred = np.array([
                -1 if np.all(row == -1) else 1 
                for row in pred_matrix
            ])
            final_scores = np.mean(score_matrix, axis=1)
            
        else:
            # Default to voting
            final_pred = np.array([
                -1 if np.sum(row == -1) > len(row) / 2 else 1 
                for row in pred_matrix
            ])
            final_scores = np.mean(score_matrix, axis=1)
        
        return final_pred, final_scores
    
    def _analyze_anomaly_reasons(self, transaction: pd.Series, features: pd.Series) -> List[str]:
        """
        Analyze why a transaction was flagged as anomalous
        """
        reasons = []
        
        # Amount-based reasons
        if 'amount' in features and 'z_score_amount' in features:
            z_score = features['z_score_amount']
            if abs(z_score) > 3:
                reasons.append(f"Unusual amount (z-score: {z_score:.2f})")
        
        # Time-based reasons
        if 'is_weekend' in features and features['is_weekend']:
            reasons.append("Weekend transaction")
        
        if 'is_business_hours' in features and not features['is_business_hours']:
            reasons.append("Outside business hours")
        
        # Account activity reasons
        if 'account_frequency' in features and features['account_frequency'] < 5:
            reasons.append("Low account activity")
        
        # Balance change reasons
        if 'balance_change_ratio' in features and abs(features['balance_change_ratio']) > 0.5:
            reasons.append("Large balance change")
        
        # Statistical reasons
        if 'amount_vs_rolling_mean' in features and features['amount_vs_rolling_mean'] > 3:
            reasons.append("Amount significantly above recent average")
        
        return reasons if reasons else ["Pattern deviation detected"]
    
    def save_models(self, filepath: str):
        """Save trained models to disk"""
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'model_metrics': self.model_metrics,
            'model_configs': self.model_configs
        }
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(model_data, filepath)
        self.logger.info(f"Models saved to {filepath}")
    
    def load_models(self, filepath: str):
        """Load trained models from disk"""
        if os.path.exists(filepath):
            model_data = joblib.load(filepath)
            self.models = model_data['models']
            self.scalers = model_data['scalers']
            self.model_metrics = model_data.get('model_metrics', {})
            self.model_configs = model_data.get('model_configs', self.model_configs)
            self.logger.info(f"Models loaded from {filepath}")
        else:
            self.logger.warning(f"Model file not found: {filepath}")
    
    def get_model_performance(self) -> Dict[str, ModelMetrics]:
        """Get performance metrics for all models"""
        return self.model_metrics
    
    def retrain_model(self, model_name: str, financial_data: pd.DataFrame, 
                     labels: Optional[np.ndarray] = None) -> ModelMetrics:
        """
        Retrain a specific model with new data
        """
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        
        features = self.extract_features(financial_data)
        scaled_features = self.scalers[model_name].fit_transform(features)
        
        model = self.models[model_name]
        
        if model_name == 'dbscan':
            clusters = model.fit_predict(scaled_features)
            cluster_counts = pd.Series(clusters).value_counts()
            small_clusters = cluster_counts[cluster_counts < 5].index
            predictions = np.where(np.isin(clusters, small_clusters), -1, 1)
        else:
            model.fit(scaled_features)
            predictions = model.predict(scaled_features)
        
        # Update metrics
        if labels is not None:
            metrics = self._calculate_metrics(model_name, labels, predictions, len(financial_data))
        else:
            anomaly_rate = np.sum(predictions == -1) / len(predictions)
            metrics = ModelMetrics(
                model_name=model_name,
                accuracy=1.0 - anomaly_rate,
                precision=0.0,
                recall=0.0,
                f1_score=0.0,
                false_positive_rate=anomaly_rate,
                training_samples=len(financial_data),
                last_updated=datetime.now()
            )
        
        self.model_metrics[model_name] = metrics
        return metrics