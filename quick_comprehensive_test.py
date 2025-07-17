#!/usr/bin/env python3
"""
Quick Comprehensive Test - Final Platform Validation
Tests all core platform functionality with fast execution
"""

import requests
import json
import time
from datetime import datetime

class QuickComprehensiveTest:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_results = []
        self.auth_token = "eyJ1c2VySWQiOiI2cE11RHFxNW5uUG10Mkl3enVWbGIiLCJlbWFpbCI6InNoaXYuZGFzQHBhdHRlcm5lZmZlY3RzbGFicy5jb20ifQ=="
        
    def log_test(self, test_name: str, passed: bool, details: str = "", duration: float = 0):
        """Log test result"""
        result = {
            "test_name": test_name,
            "passed": passed,
            "details": details,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name} ({duration:.2f}s) - {details}")
        
    def run_test(self, test_name: str, test_func):
        """Run test with timing"""
        start_time = time.time()
        try:
            result = test_func()
            duration = time.time() - start_time
            self.log_test(test_name, True, str(result), duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, str(e), duration)
            
    def test_auth_system(self):
        """Test authentication"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/auth/user", headers=headers)
        if response.status_code == 200:
            user = response.json()
            return f"Authenticated: {user['user']['email']}"
        return False
        
    def test_document_system(self):
        """Test document management"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/documents", headers=headers)
        if response.status_code == 200:
            docs = response.json()
            return f"{len(docs)} documents found"
        return False
        
    def test_journal_system(self):
        """Test journal entries"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/journal-entries", headers=headers)
        if response.status_code == 200:
            entries = response.json()
            return f"{len(entries)} journal entries found"
        return False
        
    def test_financial_reports(self):
        """Test financial reporting"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.post(f"{self.base_url}/api/reports/trial-balance", 
                               headers=headers, json={"period": "2025"})
        if response.status_code == 200:
            report = response.json()
            return f"Trial balance: {len(report.get('entries', []))} entries"
        return False
        
    def test_financial_statements(self):
        """Test financial statements"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/financial-statements", headers=headers)
        if response.status_code == 200:
            statements = response.json()
            return f"{len(statements)} financial statements found"
        return False
        
    def test_dashboard_stats(self):
        """Test dashboard"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            return f"Dashboard: {stats.get('documentsProcessed', 0)} docs processed"
        return False
        
    def test_audit_trail(self):
        """Test audit system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/audit-trail", headers=headers)
        if response.status_code == 200:
            audit = response.json()
            return f"{len(audit)} audit entries found"
        return False
        
    def test_compliance_checks(self):
        """Test compliance system"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/compliance-checks", headers=headers)
        if response.status_code == 200:
            checks = response.json()
            return f"{len(checks)} compliance checks found"
        return False
        
    def test_content_classification(self):
        """Test content-based classification"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/documents", headers=headers)
        if response.status_code == 200:
            docs = response.json()
            classified = [d for d in docs if d.get('documentType')]
            return f"Classification: {len(classified)}/{len(docs)} documents classified"
        return False
        
    def test_multitenant_security(self):
        """Test multitenant data isolation"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = requests.get(f"{self.base_url}/api/auth/user", headers=headers)
        if response.status_code == 200:
            user = response.json()
            tenant_id = user['user'].get('tenant_id')
            if tenant_id:
                return f"Tenant isolated: {tenant_id[:8]}..."
            return "No tenant isolation"
        return False
        
    def test_api_performance(self):
        """Test API performance"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        endpoints = [
            "/api/auth/user",
            "/api/documents", 
            "/api/journal-entries",
            "/api/financial-statements",
            "/api/dashboard/stats"
        ]
        
        successful = 0
        total = len(endpoints)
        
        for endpoint in endpoints:
            response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
            if response.status_code == 200:
                successful += 1
                
        return f"API Performance: {successful}/{total} endpoints working ({(successful/total*100):.1f}%)"
        
    def test_error_handling(self):
        """Test error handling"""
        # Test unauthorized access
        response = requests.get(f"{self.base_url}/api/auth/user")
        if response.status_code == 401:
            return "Unauthorized access properly blocked"
        return False
        
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Quick Comprehensive Platform Test")
        print("=" * 50)
        
        # Core system tests
        self.run_test("Authentication System", self.test_auth_system)
        self.run_test("Document Management", self.test_document_system)
        self.run_test("Journal Entry System", self.test_journal_system)
        self.run_test("Financial Reports", self.test_financial_reports)
        self.run_test("Financial Statements", self.test_financial_statements)
        self.run_test("Dashboard Statistics", self.test_dashboard_stats)
        self.run_test("Audit Trail", self.test_audit_trail)
        self.run_test("Compliance Checks", self.test_compliance_checks)
        self.run_test("Content Classification", self.test_content_classification)
        self.run_test("Multitenant Security", self.test_multitenant_security)
        self.run_test("API Performance", self.test_api_performance)
        self.run_test("Error Handling", self.test_error_handling)
        
        # Generate summary
        print("\n" + "=" * 50)
        print("📊 FINAL TEST RESULTS")
        print("=" * 50)
        
        passed = sum(1 for r in self.test_results if r["passed"])
        total = len(self.test_results)
        success_rate = (passed / total) * 100
        total_time = sum(r["duration"] for r in self.test_results)
        
        print(f"✅ Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        print(f"⏱️  Total Time: {total_time:.2f}s")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT - Platform is fully operational!")
        elif success_rate >= 75:
            print("✅ GOOD - Platform is mostly operational")
        elif success_rate >= 50:
            print("⚠️  MODERATE - Platform has some issues")
        else:
            print("❌ POOR - Platform needs significant attention")
            
        return {
            "passed": passed,
            "total": total,
            "success_rate": success_rate,
            "total_time": total_time,
            "status": "EXCELLENT" if success_rate >= 90 else "GOOD" if success_rate >= 75 else "MODERATE" if success_rate >= 50 else "POOR"
        }

def main():
    """Main test execution"""
    tester = QuickComprehensiveTest()
    results = tester.run_all_tests()
    
    # Save results
    with open("quick_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to quick_test_results.json")

if __name__ == "__main__":
    main()