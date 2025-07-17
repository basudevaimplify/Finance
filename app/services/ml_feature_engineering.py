"""
Feature Engineering Service for Financial ML Models
Advanced feature extraction and preprocessing for financial anomaly detection
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.decomposition import PCA, FastICA
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

@dataclass
class FeatureImportance:
    """Feature importance analysis result"""
    feature_name: str
    importance_score: float
    rank: int
    category: str
    description: str

class FinancialFeatureEngineer:
    """
    Advanced feature engineering for financial data
    Creates comprehensive feature sets for anomaly detection
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.feature_history = {}
        self.scalers = {}
        self.feature_selectors = {}
        self.dimensionality_reducers = {}
        
    def create_comprehensive_features(self, financial_data: pd.DataFrame) -> pd.DataFrame:
        """
        Create a comprehensive set of features for anomaly detection
        
        Args:
            financial_data: Raw financial transaction data
            
        Returns:
            DataFrame with engineered features
        """
        self.logger.info("Creating comprehensive feature set")
        
        features = pd.DataFrame(index=financial_data.index)
        
        # Basic transaction features
        features = self._add_basic_features(features, financial_data)
        
        # Temporal features
        features = self._add_temporal_features(features, financial_data)
        
        # Statistical features
        features = self._add_statistical_features(features, financial_data)
        
        # Account-based features
        features = self._add_account_features(features, financial_data)
        
        # Behavioral features
        features = self._add_behavioral_features(features, financial_data)
        
        # Network features
        features = self._add_network_features(features, financial_data)
        
        # Seasonal and cyclical features
        features = self._add_seasonal_features(features, financial_data)
        
        # Risk-based features
        features = self._add_risk_features(features, financial_data)
        
        # Clean and validate features
        features = self._clean_features(features)
        
        self.logger.info(f"Created {len(features.columns)} features")
        return features
    
    def _add_basic_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add basic transaction features"""
        
        # Amount features
        if 'amount' in data.columns:
            features['amount'] = data['amount']
            features['amount_abs'] = data['amount'].abs()
            features['amount_log'] = np.log1p(data['amount'].abs())
            features['amount_sqrt'] = np.sqrt(data['amount'].abs())
            features['amount_sign'] = np.sign(data['amount'])
            features['amount_magnitude'] = np.floor(np.log10(data['amount'].abs() + 1))
        
        # Debit/Credit features
        if 'debit_amount' in data.columns and 'credit_amount' in data.columns:
            features['debit_amount'] = data['debit_amount'].fillna(0)
            features['credit_amount'] = data['credit_amount'].fillna(0)
            features['net_amount'] = features['credit_amount'] - features['debit_amount']
            features['is_debit'] = (features['debit_amount'] > 0).astype(int)
            features['is_credit'] = (features['credit_amount'] > 0).astype(int)
        
        # Transaction type encoding
        if 'transaction_type' in data.columns:
            transaction_types = pd.get_dummies(data['transaction_type'], prefix='type')
            features = pd.concat([features, transaction_types], axis=1)
        
        # Entity features
        if 'entity' in data.columns:
            entity_encoded = pd.get_dummies(data['entity'], prefix='entity')
            features = pd.concat([features, entity_encoded], axis=1)
        
        return features
    
    def _add_temporal_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add time-based features"""
        
        if 'entry_date' in data.columns:
            dates = pd.to_datetime(data['entry_date'])
            
            # Basic time features
            features['day_of_week'] = dates.dt.dayofweek
            features['day_of_month'] = dates.dt.day
            features['month'] = dates.dt.month
            features['quarter'] = dates.dt.quarter
            features['year'] = dates.dt.year
            features['hour'] = dates.dt.hour
            features['minute'] = dates.dt.minute
            
            # Business time features
            features['is_weekend'] = (dates.dt.dayofweek >= 5).astype(int)
            features['is_business_hours'] = ((dates.dt.hour >= 9) & (dates.dt.hour <= 17)).astype(int)
            features['is_lunch_hour'] = ((dates.dt.hour >= 12) & (dates.dt.hour <= 14)).astype(int)
            features['is_end_of_month'] = (dates.dt.day >= 25).astype(int)
            features['is_month_start'] = (dates.dt.day <= 5).astype(int)
            
            # Cyclical encoding
            features['day_of_week_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
            features['day_of_week_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
            features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
            features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
            features['month_sin'] = np.sin(2 * np.pi * features['month'] / 12)
            features['month_cos'] = np.cos(2 * np.pi * features['month'] / 12)
            
            # Time since features
            features['days_since_epoch'] = (dates - pd.Timestamp('1970-01-01')).dt.days
            
        return features
    
    def _add_statistical_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add statistical features"""
        
        if 'amount' in data.columns:
            amount = data['amount']
            
            # Z-score normalization
            features['amount_zscore'] = (amount - amount.mean()) / (amount.std() + 1e-6)
            
            # Percentile features
            features['amount_percentile'] = amount.rank(pct=True)
            
            # Rolling statistics (7-day window)
            features['amount_rolling_mean_7d'] = amount.rolling(window=7, min_periods=1).mean()
            features['amount_rolling_std_7d'] = amount.rolling(window=7, min_periods=1).std()
            features['amount_rolling_min_7d'] = amount.rolling(window=7, min_periods=1).min()
            features['amount_rolling_max_7d'] = amount.rolling(window=7, min_periods=1).max()
            features['amount_rolling_skew_7d'] = amount.rolling(window=7, min_periods=1).skew()
            features['amount_rolling_kurt_7d'] = amount.rolling(window=7, min_periods=1).kurt()
            
            # Rolling statistics (30-day window)
            features['amount_rolling_mean_30d'] = amount.rolling(window=30, min_periods=1).mean()
            features['amount_rolling_std_30d'] = amount.rolling(window=30, min_periods=1).std()
            
            # Relative to rolling statistics
            features['amount_vs_rolling_mean_7d'] = amount / (features['amount_rolling_mean_7d'] + 1e-6)
            features['amount_vs_rolling_std_7d'] = amount / (features['amount_rolling_std_7d'] + 1e-6)
            features['amount_vs_rolling_mean_30d'] = amount / (features['amount_rolling_mean_30d'] + 1e-6)
            
            # Exponential moving averages
            features['amount_ema_7d'] = amount.ewm(span=7).mean()
            features['amount_ema_30d'] = amount.ewm(span=30).mean()
            features['amount_vs_ema_7d'] = amount / (features['amount_ema_7d'] + 1e-6)
            
        return features
    
    def _add_account_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add account-specific features"""
        
        if 'account_code' in data.columns:
            account_code = data['account_code']
            
            # Account frequency
            account_counts = account_code.value_counts()
            features['account_frequency'] = account_code.map(account_counts)
            features['account_frequency_log'] = np.log1p(features['account_frequency'])
            
            # Account-based statistics
            if 'amount' in data.columns:
                account_stats = data.groupby('account_code')['amount'].agg([
                    'mean', 'std', 'min', 'max', 'count', 'sum'
                ])
                
                features['account_mean_amount'] = account_code.map(account_stats['mean'])
                features['account_std_amount'] = account_code.map(account_stats['std'].fillna(0))
                features['account_min_amount'] = account_code.map(account_stats['min'])
                features['account_max_amount'] = account_code.map(account_stats['max'])
                features['account_total_amount'] = account_code.map(account_stats['sum'])
                
                # Account velocity (transactions per day)
                if 'entry_date' in data.columns:
                    account_date_range = data.groupby('account_code')['entry_date'].agg(['min', 'max'])
                    account_date_range['days'] = (pd.to_datetime(account_date_range['max']) - 
                                                pd.to_datetime(account_date_range['min'])).dt.days + 1
                    account_velocity = account_stats['count'] / account_date_range['days']
                    features['account_velocity'] = account_code.map(account_velocity.fillna(0))
        
        return features
    
    def _add_behavioral_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add behavioral pattern features"""
        
        if 'entity' in data.columns:
            entity = data['entity']
            
            # Entity frequency
            entity_counts = entity.value_counts()
            features['entity_frequency'] = entity.map(entity_counts)
            
            # Entity-based statistics
            if 'amount' in data.columns:
                entity_stats = data.groupby('entity')['amount'].agg([
                    'mean', 'std', 'min', 'max', 'count'
                ])
                
                features['entity_mean_amount'] = entity.map(entity_stats['mean'])
                features['entity_std_amount'] = entity.map(entity_stats['std'].fillna(0))
                features['entity_transaction_count'] = entity.map(entity_stats['count'])
                
                # Deviation from entity behavior
                features['amount_vs_entity_mean'] = data['amount'] / (features['entity_mean_amount'] + 1e-6)
                features['amount_entity_zscore'] = (data['amount'] - features['entity_mean_amount']) / (features['entity_std_amount'] + 1e-6)
        
        # Sequential patterns
        if 'amount' in data.columns:
            # Lag features
            features['amount_lag_1'] = data['amount'].shift(1)
            features['amount_lag_2'] = data['amount'].shift(2)
            features['amount_lag_3'] = data['amount'].shift(3)
            
            # Difference features
            features['amount_diff_1'] = data['amount'] - features['amount_lag_1']
            features['amount_diff_2'] = data['amount'] - features['amount_lag_2']
            
            # Ratio features
            features['amount_ratio_1'] = data['amount'] / (features['amount_lag_1'] + 1e-6)
            features['amount_ratio_2'] = data['amount'] / (features['amount_lag_2'] + 1e-6)
        
        return features
    
    def _add_network_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add network-based features"""
        
        # Transaction network features
        if 'account_code' in data.columns and 'entity' in data.columns:
            # Account-entity connections
            account_entity_pairs = data.groupby(['account_code', 'entity']).size()
            
            # Account connectivity
            account_connections = data.groupby('account_code')['entity'].nunique()
            features['account_entity_connections'] = data['account_code'].map(account_connections)
            
            # Entity connectivity
            entity_connections = data.groupby('entity')['account_code'].nunique()
            features['entity_account_connections'] = data['entity'].map(entity_connections)
            
            # Connection strength
            pair_strength = data.groupby(['account_code', 'entity']).size()
            features['connection_strength'] = data.set_index(['account_code', 'entity']).index.map(pair_strength)
        
        return features
    
    def _add_seasonal_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add seasonal and cyclical features"""
        
        if 'entry_date' in data.columns:
            dates = pd.to_datetime(data['entry_date'])
            
            # Seasonal indicators
            features['is_quarter_end'] = dates.dt.month.isin([3, 6, 9, 12]).astype(int)
            features['is_year_end'] = (dates.dt.month == 12).astype(int)
            features['is_financial_year_end'] = (dates.dt.month == 3).astype(int)  # For Indian companies
            
            # Holiday seasons (approximate)
            features['is_holiday_season'] = dates.dt.month.isin([10, 11, 12, 1]).astype(int)
            
            # Business cycles
            features['days_in_month'] = dates.dt.days_in_month
            features['day_of_year'] = dates.dt.dayofyear
            features['week_of_year'] = dates.dt.isocalendar().week
            
        return features
    
    def _add_risk_features(self, features: pd.DataFrame, data: pd.DataFrame) -> pd.DataFrame:
        """Add risk-based features"""
        
        if 'amount' in data.columns:
            amount = data['amount']
            
            # Risk thresholds
            features['is_large_amount'] = (amount.abs() > amount.quantile(0.95)).astype(int)
            features['is_small_amount'] = (amount.abs() < amount.quantile(0.05)).astype(int)
            
            # Round number detection
            features['is_round_number'] = (amount % 1000 == 0).astype(int)
            features['is_very_round_number'] = (amount % 10000 == 0).astype(int)
            
            # Frequency-based risk
            amount_rounded = (amount / 1000).round() * 1000
            amount_frequency = amount_rounded.value_counts()
            features['amount_frequency'] = amount_rounded.map(amount_frequency)
            features['is_common_amount'] = (features['amount_frequency'] > 5).astype(int)
        
        # Time-based risk
        if 'entry_date' in data.columns:
            dates = pd.to_datetime(data['entry_date'])
            
            # Off-hours transactions
            features['is_very_early'] = (dates.dt.hour < 6).astype(int)
            features['is_very_late'] = (dates.dt.hour > 22).astype(int)
            
            # Rapid transactions
            time_diff = dates.diff().dt.total_seconds()
            features['time_since_last_transaction'] = time_diff
            features['is_rapid_transaction'] = (time_diff < 60).astype(int)  # Less than 1 minute
        
        return features
    
    def _clean_features(self, features: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate features"""
        
        # Handle infinite values
        features = features.replace([np.inf, -np.inf], np.nan)
        
        # Fill missing values
        features = features.fillna(0)
        
        # Remove constant features
        constant_features = features.columns[features.nunique() <= 1]
        if len(constant_features) > 0:
            features = features.drop(columns=constant_features)
            self.logger.info(f"Removed {len(constant_features)} constant features")
        
        # Remove highly correlated features
        corr_matrix = features.corr().abs()
        upper_tri = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        high_corr_features = [column for column in upper_tri.columns if any(upper_tri[column] > 0.95)]
        if len(high_corr_features) > 0:
            features = features.drop(columns=high_corr_features)
            self.logger.info(f"Removed {len(high_corr_features)} highly correlated features")
        
        return features
    
    def select_features(self, features: pd.DataFrame, target: Optional[np.ndarray] = None, 
                       method: str = 'variance', k: int = 50) -> pd.DataFrame:
        """
        Select most important features using various methods
        
        Args:
            features: Feature matrix
            target: Target variable (optional)
            method: Feature selection method ('variance', 'univariate', 'mutual_info')
            k: Number of features to select
            
        Returns:
            Selected features
        """
        
        if method == 'variance':
            # Variance-based selection
            variances = features.var()
            selected_features = variances.nlargest(k).index
            
        elif method == 'univariate' and target is not None:
            # Univariate statistical tests
            selector = SelectKBest(score_func=f_classif, k=k)
            selector.fit(features, target)
            selected_features = features.columns[selector.get_support()]
            
        elif method == 'mutual_info' and target is not None:
            # Mutual information
            selector = SelectKBest(score_func=mutual_info_classif, k=k)
            selector.fit(features, target)
            selected_features = features.columns[selector.get_support()]
            
        else:
            # Default: return top k features by variance
            variances = features.var()
            selected_features = variances.nlargest(k).index
        
        self.logger.info(f"Selected {len(selected_features)} features using {method} method")
        return features[selected_features]
    
    def apply_dimensionality_reduction(self, features: pd.DataFrame, method: str = 'pca', 
                                     n_components: int = 20) -> pd.DataFrame:
        """
        Apply dimensionality reduction to features
        
        Args:
            features: Feature matrix
            method: Reduction method ('pca', 'ica', 'kmeans')
            n_components: Number of components
            
        Returns:
            Reduced features
        """
        
        if method == 'pca':
            reducer = PCA(n_components=n_components)
            reduced_features = reducer.fit_transform(features)
            column_names = [f'pca_{i}' for i in range(n_components)]
            
        elif method == 'ica':
            reducer = FastICA(n_components=n_components, random_state=42)
            reduced_features = reducer.fit_transform(features)
            column_names = [f'ica_{i}' for i in range(n_components)]
            
        elif method == 'kmeans':
            # K-means clustering as feature reduction
            kmeans = KMeans(n_clusters=n_components, random_state=42)
            cluster_labels = kmeans.fit_predict(features)
            distances = kmeans.transform(features)
            reduced_features = distances
            column_names = [f'kmeans_dist_{i}' for i in range(n_components)]
            
        else:
            raise ValueError(f"Unknown dimensionality reduction method: {method}")
        
        self.dimensionality_reducers[method] = reducer
        
        result = pd.DataFrame(reduced_features, columns=column_names, index=features.index)
        self.logger.info(f"Reduced features from {len(features.columns)} to {len(result.columns)} using {method}")
        
        return result
    
    def get_feature_importance(self, features: pd.DataFrame, target: np.ndarray) -> List[FeatureImportance]:
        """
        Calculate feature importance for anomaly detection
        
        Args:
            features: Feature matrix
            target: Target variable (1 for normal, -1 for anomaly)
            
        Returns:
            List of feature importance results
        """
        
        # Convert target to binary
        binary_target = (target == -1).astype(int)
        
        # Calculate mutual information
        mi_scores = mutual_info_classif(features, binary_target)
        
        # Calculate variance
        variances = features.var()
        
        # Combine scores
        importance_results = []
        for i, feature in enumerate(features.columns):
            # Normalize scores
            mi_score = mi_scores[i]
            variance_score = variances[feature]
            
            # Combined importance score
            combined_score = 0.7 * mi_score + 0.3 * (variance_score / variances.max())
            
            # Categorize feature
            category = self._categorize_feature(feature)
            
            importance_results.append(FeatureImportance(
                feature_name=feature,
                importance_score=combined_score,
                rank=0,  # Will be set after sorting
                category=category,
                description=self._get_feature_description(feature)
            ))
        
        # Sort by importance and assign ranks
        importance_results.sort(key=lambda x: x.importance_score, reverse=True)
        for i, result in enumerate(importance_results):
            result.rank = i + 1
        
        return importance_results
    
    def _categorize_feature(self, feature_name: str) -> str:
        """Categorize feature based on name"""
        if 'amount' in feature_name:
            return 'Amount'
        elif any(time_word in feature_name for time_word in ['day', 'hour', 'month', 'time', 'date']):
            return 'Temporal'
        elif 'account' in feature_name:
            return 'Account'
        elif 'entity' in feature_name:
            return 'Entity'
        elif 'rolling' in feature_name or 'ema' in feature_name:
            return 'Statistical'
        elif 'risk' in feature_name or 'round' in feature_name:
            return 'Risk'
        else:
            return 'Other'
    
    def _get_feature_description(self, feature_name: str) -> str:
        """Get human-readable description of feature"""
        descriptions = {
            'amount': 'Transaction amount',
            'amount_abs': 'Absolute transaction amount',
            'amount_log': 'Log-transformed amount',
            'amount_zscore': 'Z-score normalized amount',
            'is_weekend': 'Weekend transaction indicator',
            'is_business_hours': 'Business hours indicator',
            'account_frequency': 'Account transaction frequency',
            'entity_frequency': 'Entity transaction frequency',
            'amount_rolling_mean_7d': '7-day rolling mean amount',
            'amount_vs_rolling_mean_7d': 'Amount vs 7-day average',
            'is_large_amount': 'Large amount indicator',
            'is_round_number': 'Round number indicator'
        }
        return descriptions.get(feature_name, feature_name.replace('_', ' ').title())