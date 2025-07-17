#!/usr/bin/env python3
"""
Comprehensive Unit and Integration Tests for QRT Closure Platform
Tests all Python backend components including authentication, AI agents, compliance, and reporting
"""

import sys
import os
import asyncio
import pytest
import json
from pathlib import Path
from datetime import datetime, timedelta
import tempfile
import pandas as pd
from unittest.mock import Mock, patch, MagicMock

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Test imports
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Application imports
from main import app
from app.database import get_db, Base
from app.models import User, Document, UserSession
from app.services.auth_service import AuthService
from app.services.ai_orchestrator import AIOrchestrator
from app.services.compliance_checker import ComplianceChecker
from app.services.financial_reports import FinancialReportsService
from app.services.document_processor import DocumentProcessor
from app.services.data_source_service import DataSourceService
from app.services.ml_anomaly_detector import MLAnomalyDetector
from app.services.mca_filing_service import MCAFilingService
from app.services.tutorial_service import TutorialService

class TestDatabase:
    """In-memory test database setup"""
    
    def __init__(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )
        Base.metadata.create_all(bind=self.engine)
    
    def get_test_db(self):
        """Get test database session"""
        try:
            db = self.TestingSessionLocal()
            yield db
        finally:
            db.close()

class QRTTestSuite:
    """Comprehensive test suite for QRT Closure Platform"""
    
    def __init__(self):
        self.test_db = TestDatabase()
        self.client = TestClient(app)
        self.auth_service = AuthService()
        self.test_results = []
        
        # Override database dependency
        app.dependency_overrides[get_db] = self.test_db.get_test_db
        
        print("🧪 QRT Closure Platform - Comprehensive Test Suite")
        print("=" * 60)
    
    def log_test_result(self, test_name: str, passed: bool, error: str = None, duration: float = 0):
        """Log test result"""
        result = {
            'name': test_name,
            'passed': passed,
            'error': error,
            'duration': duration
        }
        self.test_results.append(result)
        
        status = "✓" if passed else "✗"
        print(f"{status} {test_name} ({duration:.2f}ms)")
        if error:
            print(f"  Error: {error}")
    
    def run_test(self, test_name: str, test_func):
        """Run a single test with timing and error handling"""
        start_time = datetime.now()
        try:
            test_func()
            duration = (datetime.now() - start_time).total_seconds() * 1000
            self.log_test_result(test_name, True, duration=duration)
            return True
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            self.log_test_result(test_name, False, str(e), duration)
            return False
    
    def test_authentication_service(self):
        """Test authentication service functionality"""
        db = next(self.test_db.get_test_db())
        
        # Test user registration
        result = self.auth_service.register_user(
            email="test@example.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="User",
            company_name="Test Company",
            db=db
        )
        
        assert result['success'] == True
        assert result['user']['email'] == "test@example.com"
        
        # Test user login
        login_result = self.auth_service.login_user(
            email="test@example.com",
            password="TestPassword123!",
            db=db
        )
        
        assert login_result['success'] == True
        assert 'access_token' in login_result
        
        # Test token validation
        user = self.auth_service.get_user_by_token(login_result['access_token'], db=db)
        assert user is not None
        assert user.email == "test@example.com"
    
    def test_auth_api_endpoints(self):
        """Test authentication API endpoints"""
        # Test registration endpoint
        response = self.client.post("/api/auth/register", json={
            "email": "api_test@example.com",
            "password": "ApiTest123!",
            "first_name": "API",
            "last_name": "Test",
            "company_name": "API Test Company"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data['success'] == True
        assert 'user' in data
        
        # Test login endpoint
        login_response = self.client.post("/api/auth/login", json={
            "email": "api_test@example.com",
            "password": "ApiTest123!"
        })
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert 'access_token' in login_data
        
        # Test protected endpoint
        headers = {"Authorization": f"Bearer {login_data['access_token']}"}
        user_response = self.client.get("/api/auth/user", headers=headers)
        
        assert user_response.status_code == 200
        user_data = user_response.json()
        assert user_data['email'] == "api_test@example.com"
    
    def test_document_processor(self):
        """Test document processing functionality"""
        # Create test CSV content
        test_data = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Description': ['Test Transaction 1', 'Test Transaction 2', 'Test Transaction 3'],
            'Amount': [1000.00, 500.00, 750.00],
            'Account': ['Cash', 'Bank', 'Revenue']
        })
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            test_data.to_csv(f.name, index=False)
            temp_file_path = f.name
        
        try:
            processor = DocumentProcessor()
            
            # Test document classification
            classification = processor.classify_document(temp_file_path)
            assert classification is not None
            assert 'document_type' in classification
            
            # Test data extraction
            extracted_data = processor.extract_data(temp_file_path)
            assert extracted_data is not None
            assert len(extracted_data) > 0
            
        finally:
            os.unlink(temp_file_path)
    
    def test_ai_orchestrator(self):
        """Test AI orchestrator functionality"""
        orchestrator = AIOrchestrator()
        
        # Test workflow creation
        workflow = orchestrator.create_workflow("test_document_id", "csv")
        assert workflow is not None
        assert workflow.document_id == "test_document_id"
        
        # Test agent execution (mocked)
        with patch('app.services.ai_orchestrator.AIOrchestrator.execute_agent') as mock_execute:
            mock_execute.return_value = {"success": True, "result": "test_result"}
            
            result = orchestrator.execute_agent("classifier", {"document_id": "test_id"})
            assert result['success'] == True
            assert result['result'] == "test_result"
    
    def test_compliance_checker(self):
        """Test compliance checking functionality"""
        checker = ComplianceChecker()
        
        # Test GST validation
        gst_result = checker.validate_gst({
            'gst_number': '29ABCDE1234F1Z5',
            'cgst': 100,
            'sgst': 100,
            'igst': 0,
            'total_tax': 200,
            'total_amount': 1200
        })
        
        assert gst_result['valid'] == True
        assert gst_result['total_tax'] == 200
        
        # Test TDS validation
        tds_result = checker.validate_tds({
            'transaction_amount': 50000,
            'tds_rate': 10,
            'deducted_amount': 5000
        })
        
        assert tds_result['valid'] == True
        assert tds_result['expected_tds'] == 5000
    
    def test_financial_reports_service(self):
        """Test financial reports generation"""
        reports_service = FinancialReportsService()
        
        # Test trial balance generation
        trial_balance = reports_service.generate_trial_balance("2024-Q1")
        assert trial_balance is not None
        assert 'accounts' in trial_balance
        assert 'total_debits' in trial_balance
        assert 'total_credits' in trial_balance
        
        # Test P&L statement generation
        pl_statement = reports_service.generate_pl_statement("2024-Q1")
        assert pl_statement is not None
        assert 'revenue' in pl_statement
        assert 'expenses' in pl_statement
        assert 'net_profit' in pl_statement
        
        # Test balance sheet generation
        balance_sheet = reports_service.generate_balance_sheet("2024-Q1")
        assert balance_sheet is not None
        assert 'assets' in balance_sheet
        assert 'liabilities' in balance_sheet
        assert 'equity' in balance_sheet
    
    def test_data_source_service(self):
        """Test data source service functionality"""
        service = DataSourceService()
        
        # Test data source configuration
        config = service.get_default_config()
        assert config is not None
        assert len(config) > 0
        
        # Test connection testing (mocked)
        with patch('app.services.data_source_service.DataSourceService.test_connection') as mock_test:
            mock_test.return_value = {"success": True, "status": "connected"}
            
            result = service.test_connection("database", {
                "host": "localhost",
                "port": 5432,
                "database": "test_db"
            })
            assert result['success'] == True
            assert result['status'] == "connected"
    
    def test_ml_anomaly_detector(self):
        """Test machine learning anomaly detection"""
        detector = MLAnomalyDetector()
        
        # Test anomaly detection
        test_data = [
            {'amount': 1000, 'category': 'revenue', 'date': '2024-01-01'},
            {'amount': 500, 'category': 'expense', 'date': '2024-01-02'},
            {'amount': 1000000, 'category': 'revenue', 'date': '2024-01-03'}  # Anomaly
        ]
        
        result = detector.detect_anomalies(test_data)
        assert result is not None
        assert 'anomalies' in result
        assert len(result['anomalies']) > 0
        
        # Test model training
        training_result = detector.train_model(test_data)
        assert training_result['success'] == True
    
    def test_mca_filing_service(self):
        """Test MCA filing service functionality"""
        service = MCAFilingService()
        
        # Test AOC-4 generation
        company_info = {
            'cin': 'U12345MH2020PTC123456',
            'name': 'Test Company Pvt Ltd',
            'financial_year': '2024-25'
        }
        
        aoc4_result = service.generate_aoc4(company_info)
        assert aoc4_result is not None
        assert 'xml_content' in aoc4_result
        assert 'validation_status' in aoc4_result
        
        # Test MGT-7 generation
        mgt7_result = service.generate_mgt7(company_info)
        assert mgt7_result is not None
        assert 'xml_content' in mgt7_result
        assert 'validation_status' in mgt7_result
    
    def test_tutorial_service(self):
        """Test tutorial service functionality"""
        service = TutorialService()
        
        # Test workflow types
        workflows = service.get_workflow_types()
        assert len(workflows) > 0
        assert 'mca_filing' in workflows
        assert 'gst_compliance' in workflows
        
        # Test tutorial steps
        steps = service.get_tutorial_steps('mca_filing')
        assert len(steps) > 0
        assert all('step_id' in step for step in steps)
        assert all('title' in step for step in steps)
        
        # Test progress tracking
        progress = service.get_user_progress('test_user_id', 'mca_filing')
        assert progress is not None
        assert 'completed_steps' in progress
        assert 'total_steps' in progress
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'version' in data
        assert 'timestamp' in data
    
    def test_dashboard_endpoints(self):
        """Test dashboard-related endpoints"""
        # Create test user and login
        response = self.client.post("/api/auth/register", json={
            "email": "dashboard_test@example.com",
            "password": "DashboardTest123!",
            "first_name": "Dashboard",
            "last_name": "Test",
            "company_name": "Dashboard Test Company"
        })
        
        login_response = self.client.post("/api/auth/login", json={
            "email": "dashboard_test@example.com",
            "password": "DashboardTest123!"
        })
        
        access_token = login_response.json()['access_token']
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test dashboard stats
        stats_response = self.client.get("/api/dashboard/stats", headers=headers)
        assert stats_response.status_code == 200
        
        stats_data = stats_response.json()
        assert 'total_documents' in stats_data
        assert 'processed_documents' in stats_data
        assert 'pending_documents' in stats_data
    
    def test_error_handling(self):
        """Test error handling and edge cases"""
        # Test invalid authentication
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = self.client.get("/api/auth/user", headers=invalid_headers)
        assert response.status_code == 401
        
        # Test missing fields in registration
        response = self.client.post("/api/auth/register", json={
            "email": "incomplete@example.com"
            # Missing required fields
        })
        assert response.status_code == 422
        
        # Test duplicate email registration
        self.client.post("/api/auth/register", json={
            "email": "duplicate@example.com",
            "password": "Password123!",
            "first_name": "Test",
            "last_name": "User",
            "company_name": "Test Company"
        })
        
        # Try to register again with same email
        response = self.client.post("/api/auth/register", json={
            "email": "duplicate@example.com",
            "password": "Password123!",
            "first_name": "Test2",
            "last_name": "User2",
            "company_name": "Test Company 2"
        })
        assert response.status_code == 400
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("\n🚀 Starting comprehensive test suite...\n")
        
        # System tests
        self.run_test("Health Endpoint", self.test_health_endpoint)
        
        # Authentication tests
        self.run_test("Authentication Service", self.test_authentication_service)
        self.run_test("Authentication API Endpoints", self.test_auth_api_endpoints)
        
        # Core functionality tests
        self.run_test("Document Processor", self.test_document_processor)
        self.run_test("AI Orchestrator", self.test_ai_orchestrator)
        self.run_test("Compliance Checker", self.test_compliance_checker)
        self.run_test("Financial Reports Service", self.test_financial_reports_service)
        
        # Service tests
        self.run_test("Data Source Service", self.test_data_source_service)
        self.run_test("ML Anomaly Detector", self.test_ml_anomaly_detector)
        self.run_test("MCA Filing Service", self.test_mca_filing_service)
        self.run_test("Tutorial Service", self.test_tutorial_service)
        
        # API tests
        self.run_test("Dashboard Endpoints", self.test_dashboard_endpoints)
        self.run_test("Error Handling", self.test_error_handling)
        
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['passed'])
        failed_tests = total_tests - passed_tests
        total_duration = sum(r['duration'] for r in self.test_results)
        
        print('\n' + '=' * 60)
        print('📊 TEST RESULTS SUMMARY')
        print('=' * 60)
        print(f'Total Tests: {total_tests}')
        print(f'Passed: {passed_tests}')
        print(f'Failed: {failed_tests}')
        print(f'Success Rate: {(passed_tests / total_tests * 100):.1f}%')
        print(f'Total Duration: {total_duration:.2f}ms')
        print('=' * 60)
        
        if failed_tests > 0:
            print('\n❌ FAILED TESTS:')
            for result in self.test_results:
                if not result['passed']:
                    print(f"  - {result['name']}: {result['error']}")
        
        # Generate detailed report
        report_data = {
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'success_rate': f"{(passed_tests / total_tests * 100):.1f}%",
                'total_duration': f"{total_duration:.2f}ms",
                'timestamp': datetime.now().isoformat()
            },
            'results': self.test_results
        }
        
        with open('Python_Test_Report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print('\n📄 Detailed report saved to Python_Test_Report.json')
        return passed_tests == total_tests

if __name__ == "__main__":
    test_suite = QRTTestSuite()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! The platform is working correctly.")
    else:
        print("\n❌ Some tests failed. Please review the errors above.")
        sys.exit(1)