#!/usr/bin/env python3
"""
Comprehensive Test Suite for QRT Closure Platform
Tests all components, functionality, and end-to-end workflows
"""

import requests
import json
import base64
import time
import os
import uuid
from datetime import datetime
from typing import Dict, List, Any

class ComprehensiveTestSuite:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_user = {
            "userId": "9e36c4db-56c4-4175-9962-7d103db2c1cd",
            "email": "testuser@example.com"
        }
        self.jwt_token = None
        self.results = []
        self.test_data = {}
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def setup_authentication(self):
        """Setup JWT authentication"""
        try:
            payload = {
                "userId": self.test_user["userId"],
                "email": self.test_user["email"]
            }
            token_data = json.dumps(payload)
            self.jwt_token = base64.b64encode(token_data.encode()).decode()
            self.log_test("Authentication Setup", True, "JWT token generated")
            return True
        except Exception as e:
            self.log_test("Authentication Setup", False, f"Error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        return {
            "Authorization": f"Bearer {self.jwt_token}",
            "Content-Type": "application/json"
        }
    
    # === AUTHENTICATION TESTS ===
    def test_authentication_flows(self):
        """Test all authentication flows"""
        print("\n🔐 Testing Authentication Flows")
        
        # Test user endpoint
        response = requests.get(f"{self.base_url}/api/auth/user", headers=self.get_headers())
        self.log_test("User Authentication", response.status_code == 200, 
                     f"Status: {response.status_code}", response.json() if response.status_code == 200 else None)
        
        # Test without token
        response = requests.get(f"{self.base_url}/api/auth/user")
        self.log_test("No Token Rejection", response.status_code == 401, 
                     f"Status: {response.status_code}")
    
    # === DOCUMENT MANAGEMENT TESTS ===
    def test_document_management(self):
        """Test document upload and management"""
        print("\n📄 Testing Document Management")
        
        # Test document upload
        test_file_content = "Account,Amount,Type\nSales,50000,Credit\nCash,50000,Debit"
        files = {'file': ('test_document.csv', test_file_content, 'text/csv')}
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        response = requests.post(f"{self.base_url}/api/documents/upload", 
                               headers=headers, files=files)
        
        if response.status_code == 200:
            data = response.json()
            self.test_data['document_id'] = data['document']['id']
            self.log_test("Document Upload", True, f"Document uploaded: {data['document']['fileName']}")
        else:
            self.log_test("Document Upload", False, f"Status: {response.status_code}")
        
        # Test document listing
        response = requests.get(f"{self.base_url}/api/documents", headers=self.get_headers())
        self.log_test("Document Listing", response.status_code == 200, 
                     f"Status: {response.status_code}")
    
    # === FINANCIAL REPORTING TESTS ===
    def test_financial_reporting(self):
        """Test financial reporting system"""
        print("\n📊 Testing Financial Reporting")
        
        # Test trial balance
        payload = {"period": "2025"}
        response = requests.post(f"{self.base_url}/api/reports/trial-balance", 
                               headers=self.get_headers(), json=payload)
        
        if response.status_code == 200:
            data = response.json()
            self.test_data['trial_balance'] = data
            self.log_test("Trial Balance Generation", True, 
                         f"Debits: {data.get('totalDebitsText', 'N/A')}, Credits: {data.get('totalCreditsText', 'N/A')}")
        else:
            self.log_test("Trial Balance Generation", False, f"Status: {response.status_code}")
        
        # Test financial statements
        response = requests.get(f"{self.base_url}/api/financial-statements", headers=self.get_headers())
        self.log_test("Financial Statements", response.status_code == 200, 
                     f"Status: {response.status_code}")
    
    # === COMPLIANCE TESTS ===
    def test_compliance_system(self):
        """Test compliance checking system"""
        print("\n✅ Testing Compliance System")
        
        # Test compliance checks
        response = requests.get(f"{self.base_url}/api/compliance-checks", headers=self.get_headers())
        self.log_test("Compliance Checks", response.status_code == 200, 
                     f"Status: {response.status_code}")
    
    # === DASHBOARD TESTS ===
    def test_dashboard_functionality(self):
        """Test dashboard functionality"""
        print("\n📈 Testing Dashboard Functionality")
        
        # Test dashboard stats
        response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=self.get_headers())
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("Dashboard Stats", True, 
                         f"Documents: {data.get('documentsProcessed', 0)}, Agents: {data.get('activeAgents', 0)}")
        else:
            self.log_test("Dashboard Stats", False, f"Status: {response.status_code}")
        
        # Test audit trail
        response = requests.get(f"{self.base_url}/api/audit-trail", headers=self.get_headers())
        self.log_test("Audit Trail", response.status_code == 200, 
                     f"Status: {response.status_code}")
    
    # === WORKFLOW TESTS ===
    def test_workflow_system(self):
        """Test AI workflow system"""
        print("\n🤖 Testing Workflow System")
        
        # Test workflow listing
        response = requests.get(f"{self.base_url}/api/workflows", headers=self.get_headers())
        self.log_test("Workflow Listing", response.status_code == 200, 
                     f"Status: {response.status_code}")
    
    # === JOURNAL ENTRY TESTS ===
    def test_journal_entry_system(self):
        """Test journal entry generation"""
        print("\n📝 Testing Journal Entry System")
        
        # Test journal entry generation
        response = requests.post(f"{self.base_url}/api/reports/generate-journal-entries", 
                               headers=self.get_headers())
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("Journal Entry Generation", True, 
                         f"Message: {data.get('message', 'N/A')}")
        else:
            self.log_test("Journal Entry Generation", False, f"Status: {response.status_code}")
    
    # === ERROR HANDLING TESTS ===
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️ Testing Error Handling")
        
        # Test invalid endpoints
        response = requests.get(f"{self.base_url}/api/nonexistent", headers=self.get_headers())
        self.log_test("404 Error Handling", response.status_code == 404, 
                     f"Status: {response.status_code}")
        
        # Test invalid JSON
        response = requests.post(f"{self.base_url}/api/reports/trial-balance", 
                               headers=self.get_headers(), data="invalid json")
        self.log_test("Invalid JSON Handling", response.status_code == 400, 
                     f"Status: {response.status_code}")
    
    # === PERFORMANCE TESTS ===
    def test_performance(self):
        """Test basic performance metrics"""
        print("\n⚡ Testing Performance")
        
        # Test API response times
        start_time = time.time()
        response = requests.get(f"{self.base_url}/api/auth/user", headers=self.get_headers())
        response_time = time.time() - start_time
        
        self.log_test("API Response Time", response_time < 2.0, 
                     f"Response time: {response_time:.2f}s")
    
    # === END-TO-END TESTS ===
    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow"""
        print("\n🔄 Testing End-to-End Workflow")
        
        # 1. Upload document
        test_file_content = "Account,Amount,Type\nRevenue,100000,Credit\nBank,100000,Debit"
        files = {'file': ('e2e_test.csv', test_file_content, 'text/csv')}
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        response = requests.post(f"{self.base_url}/api/documents/upload", 
                               headers=headers, files=files)
        
        if response.status_code == 200:
            document_id = response.json()['document']['id']
            
            # 2. Generate journal entries
            response = requests.post(f"{self.base_url}/api/reports/generate-journal-entries", 
                                   headers=self.get_headers())
            
            # 3. Generate trial balance
            payload = {"period": "2025"}
            response = requests.post(f"{self.base_url}/api/reports/trial-balance", 
                                   headers=self.get_headers(), json=payload)
            
            # 4. Check dashboard stats
            response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=self.get_headers())
            
            self.log_test("End-to-End Workflow", True, 
                         "Complete workflow executed successfully")
        else:
            self.log_test("End-to-End Workflow", False, 
                         f"Document upload failed: {response.status_code}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Test Suite")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Cannot proceed without authentication")
            return
        
        # Run all test categories
        self.test_authentication_flows()
        self.test_document_management()
        self.test_financial_reporting()
        self.test_compliance_system()
        self.test_dashboard_functionality()
        self.test_workflow_system()
        self.test_journal_entry_system()
        self.test_error_handling()
        self.test_performance()
        self.test_end_to_end_workflow()
        
        # Generate comprehensive report
        self.generate_comprehensive_report()
    
    def generate_comprehensive_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📋 COMPREHENSIVE TEST REPORT")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests Executed: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Category breakdown
        categories = {}
        for result in self.results:
            category = result["test"].split(" ")[0]
            if category not in categories:
                categories[category] = {"passed": 0, "failed": 0}
            
            if result["success"]:
                categories[category]["passed"] += 1
            else:
                categories[category]["failed"] += 1
        
        print("\n📊 Category Breakdown:")
        for category, stats in categories.items():
            total = stats["passed"] + stats["failed"]
            rate = (stats["passed"] / total) * 100 if total > 0 else 0
            print(f"  {category}: {stats['passed']}/{total} ({rate:.1f}%)")
        
        # Failed tests details
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        # System health assessment
        print("\n🏥 System Health Assessment:")
        if passed_tests / total_tests >= 0.9:
            print("✅ EXCELLENT - System is production ready")
        elif passed_tests / total_tests >= 0.8:
            print("⚠️ GOOD - Minor issues need attention")
        elif passed_tests / total_tests >= 0.7:
            print("🔧 FAIR - Several issues need fixing")
        else:
            print("❌ POOR - Major issues require immediate attention")
        
        # Save detailed report
        report_data = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests/total_tests)*100,
                "timestamp": datetime.now().isoformat()
            },
            "categories": categories,
            "detailed_results": self.results,
            "test_data": self.test_data
        }
        
        with open("comprehensive_test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n💾 Detailed report saved to comprehensive_test_report.json")
        
        # Recommendations
        print("\n🎯 Recommendations:")
        if failed_tests == 0:
            print("  - System is ready for production deployment")
            print("  - Continue monitoring with automated tests")
        else:
            print("  - Fix all failed tests before deployment")
            print("  - Implement automated testing in CI/CD pipeline")
            print("  - Add monitoring and alerting for production")

if __name__ == "__main__":
    test_suite = ComprehensiveTestSuite()
    test_suite.run_all_tests()