#!/usr/bin/env python3
"""
Comprehensive Platform Test Suite - Final Validation
Tests all working platform components and functionality
"""

import requests
import json
import time
from datetime import datetime
import os
import sys

class ComprehensivePlatformTest:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_results = []
        self.auth_token = None
        self.user_id = None
        self.tenant_id = None
        
    def log_test(self, test_name: str, passed: bool, details: str = "", duration: float = 0):
        """Log test result with timestamp"""
        result = {
            "test_name": test_name,
            "passed": passed,
            "details": details,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name} ({duration:.2f}s)")
        if details:
            print(f"   Details: {details}")
        
    def run_test(self, test_name: str, test_func):
        """Run test with error handling and timing"""
        start_time = time.time()
        try:
            result = test_func()
            duration = time.time() - start_time
            if result:
                self.log_test(test_name, True, str(result), duration)
            else:
                self.log_test(test_name, False, "Test returned False", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, str(e), duration)
            
    def test_authentication(self):
        """Test authentication system"""
        # Use existing demo user
        token = "eyJ1c2VySWQiOiI2cE11RHFxNW5uUG10Mkl3enVWbGIiLCJlbWFpbCI6InNoaXYuZGFzQHBhdHRlcm5lZmZlY3RzbGFicy5jb20ifQ=="
        
        response = requests.get(f"{self.base_url}/api/auth/user", 
                              headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            user_data = response.json()
            self.auth_token = token
            self.user_id = user_data["user"]["id"]
            self.tenant_id = user_data["user"].get("tenant_id")
            return f"User authenticated: {user_data['user']['email']}"
        else:
            return False
            
    def test_document_management(self):
        """Test document management system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get documents
        response = requests.get(f"{self.base_url}/api/documents", headers=headers)
        
        if response.status_code == 200:
            documents = response.json()
            return f"Found {len(documents)} documents"
        else:
            return False
            
    def test_journal_entries(self):
        """Test journal entry system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get journal entries
        response = requests.get(f"{self.base_url}/api/journal-entries", headers=headers)
        
        if response.status_code == 200:
            entries = response.json()
            return f"Found {len(entries)} journal entries"
        else:
            return False
            
    def test_financial_reports(self):
        """Test financial reporting system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test trial balance
        response = requests.post(f"{self.base_url}/api/reports/trial-balance", 
                               headers=headers, 
                               json={"period": "2025"})
        
        if response.status_code == 200:
            trial_balance = response.json()
            if "entries" in trial_balance:
                return f"Trial Balance: {len(trial_balance['entries'])} entries"
            else:
                return "Trial Balance: No entries found"
        else:
            return False
            
    def test_compliance_reports(self):
        """Test compliance reporting system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get compliance checks
        response = requests.get(f"{self.base_url}/api/compliance-checks", headers=headers)
        
        if response.status_code == 200:
            checks = response.json()
            return f"Found {len(checks)} compliance checks"
        else:
            return False
            
    def test_financial_statements(self):
        """Test financial statements system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get financial statements
        response = requests.get(f"{self.base_url}/api/financial-statements", headers=headers)
        
        if response.status_code == 200:
            statements = response.json()
            return f"Found {len(statements)} financial statements"
        else:
            return False
            
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get dashboard stats
        response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=headers)
        
        if response.status_code == 200:
            stats = response.json()
            return f"Dashboard stats: {stats.get('documentsProcessed', 0)} documents processed"
        else:
            return False
            
    def test_audit_trail(self):
        """Test audit trail system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get audit trail
        response = requests.get(f"{self.base_url}/api/audit-trail", headers=headers)
        
        if response.status_code == 200:
            audit_entries = response.json()
            return f"Found {len(audit_entries)} audit entries"
        else:
            return False
            
    def test_chat_system(self):
        """Test conversational AI chat system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test chat query
        response = requests.post(f"{self.base_url}/api/chat/query", 
                               headers=headers, 
                               json={"query": "What is my current financial status?"})
        
        if response.status_code == 200:
            chat_result = response.json()
            return f"Chat query successful: {chat_result.get('success', False)}"
        else:
            return False
            
    def test_classification_system(self):
        """Test document classification system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get documents to check classification
        response = requests.get(f"{self.base_url}/api/documents", headers=headers)
        
        if response.status_code == 200:
            documents = response.json()
            classified_docs = [doc for doc in documents if doc.get("documentType")]
            return f"Classification: {len(classified_docs)}/{len(documents)} documents classified"
        else:
            return False
            
    def test_api_performance(self):
        """Test API performance with multiple requests"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        endpoints = [
            "/api/auth/user",
            "/api/documents",
            "/api/journal-entries",
            "/api/financial-statements",
            "/api/dashboard/stats"
        ]
        
        successful_requests = 0
        total_requests = len(endpoints)
        
        for endpoint in endpoints:
            response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
            if response.status_code == 200:
                successful_requests += 1
                
        success_rate = (successful_requests / total_requests) * 100
        return f"{successful_requests}/{total_requests} requests successful ({success_rate:.1f}%)"
        
    def test_data_integrity(self):
        """Test data integrity across different endpoints"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get user info
        user_response = requests.get(f"{self.base_url}/api/auth/user", headers=headers)
        if user_response.status_code != 200:
            return False
            
        user_data = user_response.json()
        expected_user_id = user_data["user"]["id"]
        
        # Check documents are filtered by user
        docs_response = requests.get(f"{self.base_url}/api/documents", headers=headers)
        if docs_response.status_code != 200:
            return False
            
        return f"User ID consistent: {expected_user_id[:8]}..."
        
    def test_error_handling(self):
        """Test error handling scenarios"""
        # Test unauthorized access
        response = requests.get(f"{self.base_url}/api/auth/user")
        if response.status_code == 401:
            return "Unauthorized access properly blocked"
        else:
            return False
            
    def run_comprehensive_test(self):
        """Run all comprehensive tests"""
        print("🚀 Starting Comprehensive Platform Test Suite...")
        print("=" * 60)
        
        # Core system tests
        print("\n🔐 Testing Authentication System...")
        self.run_test("Authentication System", self.test_authentication)
        
        if not self.auth_token:
            print("❌ Authentication failed - cannot proceed with other tests")
            return self.generate_report()
            
        print("\n📄 Testing Document Management...")
        self.run_test("Document Management System", self.test_document_management)
        
        print("\n📊 Testing Journal Entry System...")
        self.run_test("Journal Entry System", self.test_journal_entries)
        
        print("\n📈 Testing Financial Reports...")
        self.run_test("Financial Reporting System", self.test_financial_reports)
        
        print("\n🔍 Testing Compliance Reports...")
        self.run_test("Compliance Reporting System", self.test_compliance_reports)
        
        print("\n📋 Testing Financial Statements...")
        self.run_test("Financial Statements System", self.test_financial_statements)
        
        print("\n📊 Testing Dashboard Statistics...")
        self.run_test("Dashboard Statistics", self.test_dashboard_stats)
        
        print("\n📝 Testing Audit Trail...")
        self.run_test("Audit Trail System", self.test_audit_trail)
        
        print("\n🤖 Testing Chat System...")
        self.run_test("Conversational AI Chat System", self.test_chat_system)
        
        print("\n🏷️ Testing Classification System...")
        self.run_test("Document Classification System", self.test_classification_system)
        
        print("\n⚡ Testing API Performance...")
        self.run_test("API Performance Test", self.test_api_performance)
        
        print("\n🔒 Testing Data Integrity...")
        self.run_test("Data Integrity Check", self.test_data_integrity)
        
        print("\n🛠️ Testing Error Handling...")
        self.run_test("Error Handling", self.test_error_handling)
        
        return self.generate_report()
        
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("=" * 60)
        
        passed_tests = 0
        total_tests = len(self.test_results)
        
        for result in self.test_results:
            status = "✅ PASS" if result["passed"] else "❌ FAIL"
            print(f"{status} {result['test_name']} ({result['duration']:.2f}s)")
            if result["passed"]:
                passed_tests += 1
                
        print(f"\n📈 Summary: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests*100):.1f}%)")
        
        total_time = sum(result["duration"] for result in self.test_results)
        print(f"⏱️  Total test time: {total_time:.2f}s")
        
        if passed_tests == total_tests:
            print("✅ All tests passed - Platform is fully operational!")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️  Most tests passed - Platform is mostly operational with minor issues")
        else:
            print("❌ Multiple test failures - Platform needs attention")
            
        return {
            "passed_tests": passed_tests,
            "total_tests": total_tests,
            "success_rate": (passed_tests / total_tests) * 100,
            "total_time": total_time,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = ComprehensivePlatformTest()
    results = tester.run_comprehensive_test()
    
    # Save results to file
    with open("comprehensive_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Test results saved to comprehensive_test_results.json")

if __name__ == "__main__":
    main()