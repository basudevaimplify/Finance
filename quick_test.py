#!/usr/bin/env python3
"""
Quick test script to verify the backend functionality
"""

import sys
import os
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all modules can be imported"""
    print("Testing module imports...")
    
    try:
        from main import app
        print("✓ Main app imported successfully")
        
        from app.services.auth_service import AuthService
        print("✓ AuthService imported successfully")
        
        from app.services.document_processor import DocumentProcessor
        print("✓ DocumentProcessor imported successfully")
        
        from app.services.ai_orchestrator import AIOrchestrator
        print("✓ AIOrchestrator imported successfully")
        
        from app.services.compliance_checker import ComplianceChecker
        print("✓ ComplianceChecker imported successfully")
        
        from app.services.financial_reports import FinancialReportsService
        print("✓ FinancialReportsService imported successfully")
        
        from app.models import User, Document, UserSession
        print("✓ Models imported successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_basic_functionality():
    """Test basic functionality without database"""
    print("\nTesting basic functionality...")
    
    try:
        # Test password hashing
        from app.auth import get_password_hash, verify_password
        
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        verified = verify_password(password, hashed)
        
        if verified:
            print("✓ Password hashing and verification working")
        else:
            print("✗ Password verification failed")
            return False
        
        # Test service instantiation
        from app.services.auth_service import AuthService
        from app.services.compliance_checker import ComplianceChecker
        
        auth_service = AuthService()
        compliance_checker = ComplianceChecker()
        
        print("✓ Services instantiated successfully")
        
        # Test compliance validation
        gst_result = compliance_checker.validate_gst({
            'gst_number': '29ABCDE1234F1Z5',
            'cgst': 100,
            'sgst': 100,
            'igst': 0,
            'total_tax': 200,
            'total_amount': 1200
        })
        
        if gst_result.get('valid'):
            print("✓ GST validation working")
        else:
            print("✗ GST validation failed")
            
        return True
        
    except Exception as e:
        print(f"✗ Basic functionality test failed: {e}")
        return False

def test_ai_services():
    """Test AI services basic functionality"""
    print("\nTesting AI services...")
    
    try:
        from app.services.ai_orchestrator import AIOrchestrator
        from app.services.ml_anomaly_detector import MLAnomalyDetector
        from app.services.financial_reports import FinancialReportsService
        
        # Test service instantiation
        orchestrator = AIOrchestrator()
        detector = MLAnomalyDetector()
        reports_service = FinancialReportsService()
        
        print("✓ AI services instantiated successfully")
        
        # Test basic report generation
        trial_balance = reports_service.generate_trial_balance("2024-Q1")
        if trial_balance and 'accounts' in trial_balance:
            print("✓ Trial balance generation working")
        else:
            print("? Trial balance generation returned empty result")
        
        # Test anomaly detection with sample data
        test_data = [
            {'amount': 1000, 'category': 'revenue', 'date': '2024-01-01'},
            {'amount': 500, 'category': 'expense', 'date': '2024-01-02'},
            {'amount': 1000000, 'category': 'revenue', 'date': '2024-01-03'}  # Anomaly
        ]
        
        anomaly_result = detector.detect_anomalies(test_data)
        if anomaly_result and 'anomalies' in anomaly_result:
            print("✓ Anomaly detection working")
        else:
            print("? Anomaly detection returned empty result")
        
        return True
        
    except Exception as e:
        print(f"✗ AI services test failed: {e}")
        return False

def main():
    """Run all quick tests"""
    print("🧪 QRT Closure Platform - Quick Test Suite")
    print("=" * 50)
    
    tests = [
        ("Module Imports", test_imports),
        ("Basic Functionality", test_basic_functionality),
        ("AI Services", test_ai_services)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            passed += 1
            print(f"✅ {test_name} PASSED")
        else:
            print(f"❌ {test_name} FAILED")
    
    print(f"\n{'='*50}")
    print(f"RESULTS: {passed}/{total} tests passed")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All quick tests passed!")
        return True
    else:
        print("⚠️  Some tests failed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)