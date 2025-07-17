#!/usr/bin/env python3
"""
QRT Closure Platform - Comprehensive Test Report
Tests all platform flows and generates a detailed report
"""

import requests
import json
import sys
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

class ComprehensiveTestRunner:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        self.passed_tests = []
        
    def log_test(self, test_name, status, details="", response_data=None):
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if status == "PASSED":
            self.passed_tests.append(result)
        else:
            self.failed_tests.append(result)
    
    def test_authentication(self):
        """Test authentication system"""
        try:
            response = requests.get(f"{BASE_URL}/api/auth/user", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Authentication", "PASSED", f"User authenticated: {data.get('user', {}).get('email', 'N/A')}")
                else:
                    self.log_test("Authentication", "FAILED", "Authentication failed")
            else:
                self.log_test("Authentication", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Authentication", "FAILED", f"Exception: {str(e)}")
    
    def test_document_management(self):
        """Test document management flows"""
        try:
            # Get documents
            response = requests.get(f"{BASE_URL}/api/documents", headers=HEADERS)
            if response.status_code == 200:
                docs = response.json()
                self.log_test("Document List", "PASSED", f"Found {len(docs)} documents")
                
                # Test document deletion if documents exist
                if docs:
                    doc_id = docs[0]['id']
                    delete_response = requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=HEADERS)
                    if delete_response.status_code == 200:
                        self.log_test("Document Deletion", "PASSED", f"Successfully deleted document {doc_id}")
                    else:
                        self.log_test("Document Deletion", "FAILED", f"HTTP {delete_response.status_code}")
                else:
                    self.log_test("Document Deletion", "SKIPPED", "No documents to delete")
            else:
                self.log_test("Document List", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Document Management", "FAILED", f"Exception: {str(e)}")
    
    def test_financial_reporting(self):
        """Test financial reporting system"""
        try:
            # Test journal entries
            response = requests.get(f"{BASE_URL}/api/journal-entries", headers=HEADERS)
            if response.status_code == 200:
                entries = response.json()
                debit_total = sum(float(entry.get('debitAmount', 0)) for entry in entries)
                credit_total = sum(float(entry.get('creditAmount', 0)) for entry in entries)
                balanced = abs(debit_total - credit_total) < 0.01
                
                self.log_test("Journal Entries", "PASSED", 
                    f"Found {len(entries)} entries. Debit: {debit_total:.2f}, Credit: {credit_total:.2f}, Balanced: {balanced}")
            else:
                self.log_test("Journal Entries", "FAILED", f"HTTP {response.status_code}")
            
            # Test financial statements
            response = requests.get(f"{BASE_URL}/api/financial-statements", headers=HEADERS)
            if response.status_code == 200:
                statements = response.json()
                self.log_test("Financial Statements", "PASSED", f"Found {len(statements)} statements")
                
                # Test trial balance generation
                tb_response = requests.post(f"{BASE_URL}/api/reports/trial-balance", 
                    headers=HEADERS, json={"period": "Q3_2025"})
                if tb_response.status_code == 200:
                    tb_data = tb_response.json()
                    self.log_test("Trial Balance Generation", "PASSED", 
                        f"Generated trial balance: {tb_data.get('totalDebits', 0):.2f} debits, {tb_data.get('totalCredits', 0):.2f} credits")
                else:
                    self.log_test("Trial Balance Generation", "FAILED", f"HTTP {tb_response.status_code}")
                
                # Test P&L generation
                pl_response = requests.post(f"{BASE_URL}/api/reports/profit-loss", 
                    headers=HEADERS, json={"period": "Q3_2025"})
                if pl_response.status_code == 200:
                    pl_data = pl_response.json()
                    self.log_test("Profit & Loss Generation", "PASSED", 
                        f"Generated P&L: Revenue {pl_data.get('totalRevenue', 0):.2f}, Expenses {pl_data.get('totalExpenses', 0):.2f}, Net Profit {pl_data.get('netProfit', 0):.2f}")
                else:
                    self.log_test("Profit & Loss Generation", "FAILED", f"HTTP {pl_response.status_code}")
                
                # Test Balance Sheet generation
                bs_response = requests.post(f"{BASE_URL}/api/reports/balance-sheet", 
                    headers=HEADERS, json={"period": "Q3_2025"})
                if bs_response.status_code == 200:
                    bs_data = bs_response.json()
                    self.log_test("Balance Sheet Generation", "PASSED", 
                        f"Generated Balance Sheet: Assets {bs_data.get('totalAssets', 0):.2f}, Liabilities {bs_data.get('totalLiabilities', 0):.2f}")
                else:
                    self.log_test("Balance Sheet Generation", "FAILED", f"HTTP {bs_response.status_code}")
            else:
                self.log_test("Financial Statements", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Financial Reporting", "FAILED", f"Exception: {str(e)}")
    
    def test_journal_generation(self):
        """Test journal entry generation with duplication check"""
        try:
            response = requests.post(f"{BASE_URL}/api/reports/generate-journal-entries", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Journal Generation", "PASSED", 
                    f"Generated {data.get('totalEntries', 0)} entries, skipped {data.get('skippedDocuments', 0)} documents")
            else:
                self.log_test("Journal Generation", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Journal Generation", "FAILED", f"Exception: {str(e)}")
    
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        try:
            response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=HEADERS)
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Dashboard Stats", "PASSED", 
                    f"Docs: {stats.get('documentsProcessed', 0)}, Agents: {stats.get('activeAgents', 0)}, Issues: {stats.get('complianceIssues', 0)}")
            else:
                self.log_test("Dashboard Stats", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Dashboard Stats", "FAILED", f"Exception: {str(e)}")
    
    def test_compliance_system(self):
        """Test compliance checking system"""
        try:
            response = requests.get(f"{BASE_URL}/api/compliance-checks", headers=HEADERS)
            if response.status_code == 200:
                checks = response.json()
                self.log_test("Compliance Checks", "PASSED", f"Found {len(checks)} compliance checks")
            else:
                self.log_test("Compliance Checks", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Compliance System", "FAILED", f"Exception: {str(e)}")
    
    def test_audit_trail(self):
        """Test audit trail system"""
        try:
            response = requests.get(f"{BASE_URL}/api/audit-trail", headers=HEADERS)
            if response.status_code == 200:
                trail = response.json()
                self.log_test("Audit Trail", "PASSED", f"Found {len(trail)} audit entries")
            else:
                self.log_test("Audit Trail", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Audit Trail", "FAILED", f"Exception: {str(e)}")
    
    def test_extracted_data(self):
        """Test extracted data system"""
        try:
            response = requests.get(f"{BASE_URL}/api/extracted-data", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Extracted Data", "PASSED", f"Found {len(data)} extracted data records")
            else:
                self.log_test("Extracted Data", "FAILED", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Extracted Data", "FAILED", f"Exception: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run all comprehensive tests"""
        print("🧪 Starting Comprehensive Platform Testing...")
        print("=" * 60)
        
        # Run all tests
        self.test_authentication()
        self.test_document_management()
        self.test_financial_reporting()
        self.test_journal_generation()
        self.test_dashboard_stats()
        self.test_compliance_system()
        self.test_audit_trail()
        self.test_extracted_data()
        
        # Generate summary report
        self.generate_summary_report()
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_count = len(self.passed_tests)
        failed_count = len(self.failed_tests)
        success_rate = (passed_count / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_count}")
        print(f"Failed: {failed_count}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Show detailed results
        print("\n" + "=" * 60)
        print("📋 DETAILED TEST RESULTS")
        print("=" * 60)
        
        for result in self.test_results:
            status_icon = "✅" if result["status"] == "PASSED" else "❌" if result["status"] == "FAILED" else "⚠️"
            print(f"{status_icon} {result['test_name']}: {result['status']}")
            if result["details"]:
                print(f"   Details: {result['details']}")
        
        # Show failed tests details
        if self.failed_tests:
            print("\n" + "=" * 60)
            print("🚨 FAILED TESTS ANALYSIS")
            print("=" * 60)
            
            for failed_test in self.failed_tests:
                print(f"❌ {failed_test['test_name']}")
                print(f"   Error: {failed_test['details']}")
                print(f"   Time: {failed_test['timestamp']}")
                print()
        
        # Generate recommendations
        print("\n" + "=" * 60)
        print("💡 RECOMMENDATIONS")
        print("=" * 60)
        
        if success_rate >= 90:
            print("🎉 Excellent! Platform is performing very well.")
        elif success_rate >= 70:
            print("👍 Good performance with some areas for improvement.")
        else:
            print("⚠️ Several issues detected that need attention.")
        
        if failed_count > 0:
            print(f"📋 Review and fix {failed_count} failed test(s)")
        
        print("\n✅ Comprehensive testing completed!")
        
        # Save detailed report
        report_data = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_count,
                "failed": failed_count,
                "success_rate": success_rate,
                "timestamp": datetime.now().isoformat()
            },
            "test_results": self.test_results,
            "failed_tests": self.failed_tests
        }
        
        with open("comprehensive_test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        print(f"📄 Detailed report saved to: comprehensive_test_report.json")

if __name__ == "__main__":
    runner = ComprehensiveTestRunner()
    runner.run_comprehensive_test()