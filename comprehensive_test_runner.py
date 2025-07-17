#!/usr/bin/env python3
"""
QRT Closure Platform - Comprehensive Test Runner
Executes all user scenarios with the generated test dataset
"""

import json
import time
import requests
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime
import os
import asyncio
import concurrent.futures
from pathlib import Path

class ComprehensiveTestRunner:
    """Run comprehensive tests for all user scenarios"""
    
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.python_api_url = "http://localhost:8000"
        self.test_results = []
        self.auth_token = None
        self.user_id = None
        
    def log_test_result(self, test_name: str, passed: bool, details: str = "", duration: float = 0):
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
    
    def setup_authentication(self):
        """Setup authentication for testing"""
        try:
            # Use the test user token
            self.auth_token = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
            self.user_id = "9e36c4db-56c4-4175-9962-7d103db2c1cd"
            
            # Verify authentication
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(f"{self.base_url}/api/auth/user", headers=headers)
            
            if response.status_code == 200:
                return True
            else:
                return False
                
        except Exception as e:
            print(f"Authentication setup failed: {e}")
            return False
    
    def test_document_upload_scenarios(self):
        """Test all document upload scenarios"""
        print("\n🚀 Testing Document Upload Scenarios...")
        
        test_files = [
            "test_data/vendor_invoices_comprehensive.xlsx",
            "test_data/sales_register_comprehensive.xlsx",
            "test_data/salary_register_comprehensive.xlsx",
            "test_data/bank_statement_comprehensive.xlsx",
            "test_data/trial_balance_comprehensive.xlsx",
            "test_data/journal_entries_comprehensive.csv",
            "test_data/purchase_register_comprehensive.csv"
        ]
        
        for file_path in test_files:
            if os.path.exists(file_path):
                start_time = time.time()
                success = self.upload_test_file(file_path)
                duration = time.time() - start_time
                
                self.log_test_result(
                    f"Upload {os.path.basename(file_path)}",
                    success,
                    f"File uploaded and processed" if success else "Upload failed",
                    duration
                )
            else:
                self.log_test_result(
                    f"Upload {os.path.basename(file_path)}",
                    False,
                    "File not found",
                    0
                )
    
    def upload_test_file(self, file_path: str) -> bool:
        """Upload a test file"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(
                    f"{self.base_url}/api/documents/upload",
                    headers=headers,
                    files=files,
                    timeout=60
                )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Upload failed: {e}")
            return False
    
    def test_ai_agent_workflows(self):
        """Test AI agent workflows"""
        print("\n🤖 Testing AI Agent Workflows...")
        
        # Test agent chat
        start_time = time.time()
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.post(
                f"{self.base_url}/api/agent-chat/start",
                headers=headers,
                json={"message": "Process all uploaded documents"},
                timeout=30
            )
            
            success = response.status_code == 200
            duration = time.time() - start_time
            
            self.log_test_result(
                "AI Agent Chat Workflow",
                success,
                "Agent chat initiated successfully" if success else "Agent chat failed",
                duration
            )
            
        except Exception as e:
            self.log_test_result(
                "AI Agent Chat Workflow",
                False,
                f"Error: {str(e)}",
                time.time() - start_time
            )
    
    def test_financial_reporting(self):
        """Test financial report generation"""
        print("\n📊 Testing Financial Reporting...")
        
        report_types = [
            ("trial_balance", "Trial Balance"),
            ("profit_loss", "Profit & Loss"),
            ("balance_sheet", "Balance Sheet"),
            ("cash_flow", "Cash Flow")
        ]
        
        for report_type, report_name in report_types:
            start_time = time.time()
            try:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                response = requests.post(
                    f"{self.base_url}/api/reports/{report_type}",
                    headers=headers,
                    json={"period": "Q3_2025"},
                    timeout=30
                )
                
                success = response.status_code == 200
                duration = time.time() - start_time
                
                self.log_test_result(
                    f"Generate {report_name}",
                    success,
                    f"{report_name} generated successfully" if success else f"{report_name} generation failed",
                    duration
                )
                
            except Exception as e:
                self.log_test_result(
                    f"Generate {report_name}",
                    False,
                    f"Error: {str(e)}",
                    time.time() - start_time
                )
    
    def test_compliance_validation(self):
        """Test compliance validation scenarios"""
        print("\n🔍 Testing Compliance Validation...")
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Test GST compliance
            start_time = time.time()
            response = requests.get(f"{self.base_url}/api/compliance-checks", headers=headers)
            
            success = response.status_code == 200
            duration = time.time() - start_time
            
            self.log_test_result(
                "GST Compliance Check",
                success,
                "Compliance checks retrieved" if success else "Compliance check failed",
                duration
            )
            
            # Test creating compliance check
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/compliance-checks",
                headers=headers,
                json={"document_id": "test-doc-id"},
                timeout=30
            )
            
            success = response.status_code in [200, 201]
            duration = time.time() - start_time
            
            self.log_test_result(
                "Create Compliance Check",
                success,
                "Compliance check created" if success else "Compliance check creation failed",
                duration
            )
            
        except Exception as e:
            self.log_test_result(
                "Compliance Validation",
                False,
                f"Error: {str(e)}",
                0
            )
    
    def test_data_extraction_scenarios(self):
        """Test data extraction for different document types"""
        print("\n🔍 Testing Data Extraction Scenarios...")
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Test extracted data retrieval
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/api/extracted-data",
                headers=headers,
                params={"period": "Q3_2025", "docType": "all"}
            )
            
            success = response.status_code == 200
            duration = time.time() - start_time
            
            if success:
                data = response.json()
                extracted_count = len(data)
                details = f"Extracted data from {extracted_count} documents"
            else:
                details = "Data extraction failed"
            
            self.log_test_result(
                "Data Extraction - All Documents",
                success,
                details,
                duration
            )
            
            # Test specific document type extraction
            doc_types = ["vendor_invoice", "sales_register", "salary_register", "bank_statement"]
            
            for doc_type in doc_types:
                start_time = time.time()
                response = requests.get(
                    f"{self.base_url}/api/extracted-data",
                    headers=headers,
                    params={"period": "Q3_2025", "docType": doc_type}
                )
                
                success = response.status_code == 200
                duration = time.time() - start_time
                
                self.log_test_result(
                    f"Data Extraction - {doc_type}",
                    success,
                    f"Extracted {doc_type} data" if success else f"Failed to extract {doc_type} data",
                    duration
                )
                
        except Exception as e:
            self.log_test_result(
                "Data Extraction Test",
                False,
                f"Error: {str(e)}",
                0
            )
    
    def test_performance_scenarios(self):
        """Test performance with different loads"""
        print("\n⚡ Testing Performance Scenarios...")
        
        # Test dashboard stats (should be fast)
        start_time = time.time()
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=headers)
            
            success = response.status_code == 200
            duration = time.time() - start_time
            
            self.log_test_result(
                "Dashboard Performance",
                success,
                f"Dashboard loaded in {duration:.2f}s" if success else "Dashboard load failed",
                duration
            )
            
        except Exception as e:
            self.log_test_result(
                "Dashboard Performance",
                False,
                f"Error: {str(e)}",
                time.time() - start_time
            )
        
        # Test document listing performance
        start_time = time.time()
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(f"{self.base_url}/api/documents", headers=headers)
            
            success = response.status_code == 200
            duration = time.time() - start_time
            
            if success:
                documents = response.json()
                doc_count = len(documents)
                details = f"Listed {doc_count} documents in {duration:.2f}s"
            else:
                details = "Document listing failed"
            
            self.log_test_result(
                "Document Listing Performance",
                success,
                details,
                duration
            )
            
        except Exception as e:
            self.log_test_result(
                "Document Listing Performance",
                False,
                f"Error: {str(e)}",
                time.time() - start_time
            )
    
    def test_error_handling_scenarios(self):
        """Test error handling scenarios"""
        print("\n🛠️ Testing Error Handling Scenarios...")
        
        # Test invalid file upload
        start_time = time.time()
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Create a small test file with invalid content
            with open("test_invalid.txt", "w") as f:
                f.write("This is not a valid financial document")
            
            with open("test_invalid.txt", "rb") as f:
                files = {'file': f}
                response = requests.post(
                    f"{self.base_url}/api/documents/upload",
                    headers=headers,
                    files=files,
                    timeout=30
                )
            
            # Should either succeed (and handle gracefully) or fail with proper error
            success = response.status_code in [200, 400]
            duration = time.time() - start_time
            
            self.log_test_result(
                "Invalid File Upload Handling",
                success,
                "Error handled gracefully" if success else "Error handling failed",
                duration
            )
            
            # Cleanup
            os.remove("test_invalid.txt")
            
        except Exception as e:
            self.log_test_result(
                "Invalid File Upload Handling",
                False,
                f"Error: {str(e)}",
                time.time() - start_time
            )
        
        # Test unauthorized access
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/api/documents")  # No auth header
            
            success = response.status_code == 401
            duration = time.time() - start_time
            
            self.log_test_result(
                "Unauthorized Access Handling",
                success,
                "Unauthorized access properly blocked" if success else "Security issue detected",
                duration
            )
            
        except Exception as e:
            self.log_test_result(
                "Unauthorized Access Handling",
                False,
                f"Error: {str(e)}",
                time.time() - start_time
            )
    
    def test_user_workflow_scenarios(self):
        """Test complete user workflow scenarios"""
        print("\n👤 Testing User Workflow Scenarios...")
        
        # Test complete quarterly closure workflow
        workflow_steps = [
            ("Document Upload", self.test_document_upload_scenarios),
            ("AI Processing", self.test_ai_agent_workflows),
            ("Data Extraction", self.test_data_extraction_scenarios),
            ("Report Generation", self.test_financial_reporting),
            ("Compliance Validation", self.test_compliance_validation)
        ]
        
        overall_start = time.time()
        workflow_success = True
        
        for step_name, step_function in workflow_steps:
            try:
                step_start = time.time()
                step_function()
                step_duration = time.time() - step_start
                
                # Check if this step had any failures
                recent_results = [r for r in self.test_results if r["timestamp"] >= datetime.now().replace(microsecond=0).isoformat()]
                step_passed = all(r["passed"] for r in recent_results[-5:])  # Check last 5 results
                
                if not step_passed:
                    workflow_success = False
                    
            except Exception as e:
                workflow_success = False
                print(f"Workflow step {step_name} failed: {e}")
        
        overall_duration = time.time() - overall_start
        
        self.log_test_result(
            "Complete Quarterly Closure Workflow",
            workflow_success,
            "Full workflow completed successfully" if workflow_success else "Workflow had failures",
            overall_duration
        )
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n📋 Generating Test Report...")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["passed"])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "test_summary": {
                "execution_date": datetime.now().isoformat(),
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": f"{success_rate:.1f}%"
            },
            "test_categories": {
                "document_upload": len([r for r in self.test_results if "Upload" in r["test_name"]]),
                "ai_workflows": len([r for r in self.test_results if "AI" in r["test_name"]]),
                "financial_reports": len([r for r in self.test_results if "Generate" in r["test_name"]]),
                "compliance_checks": len([r for r in self.test_results if "Compliance" in r["test_name"]]),
                "performance_tests": len([r for r in self.test_results if "Performance" in r["test_name"]]),
                "error_handling": len([r for r in self.test_results if "Handling" in r["test_name"]])
            },
            "detailed_results": self.test_results,
            "recommendations": self.generate_recommendations()
        }
        
        with open("test_data/comprehensive_test_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"✅ Test Report Generated")
        print(f"📊 Results: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        return report
    
    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        failed_tests = [r for r in self.test_results if not r["passed"]]
        
        if failed_tests:
            recommendations.append("Review failed test cases and implement fixes")
        
        slow_tests = [r for r in self.test_results if r["duration"] > 10]
        if slow_tests:
            recommendations.append("Optimize performance for slow operations")
        
        upload_failures = [r for r in failed_tests if "Upload" in r["test_name"]]
        if upload_failures:
            recommendations.append("Improve file upload error handling and validation")
        
        ai_failures = [r for r in failed_tests if "AI" in r["test_name"]]
        if ai_failures:
            recommendations.append("Implement better AI service error handling and fallbacks")
        
        return recommendations
    
    def run_all_tests(self):
        """Run all comprehensive tests"""
        print("🚀 Starting Comprehensive Test Suite...")
        print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Setup
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return
        
        print("✅ Authentication setup successful")
        
        # Run all test categories
        try:
            self.test_document_upload_scenarios()
            self.test_ai_agent_workflows()
            self.test_data_extraction_scenarios()
            self.test_financial_reporting()
            self.test_compliance_validation()
            self.test_performance_scenarios()
            self.test_error_handling_scenarios()
            self.test_user_workflow_scenarios()
            
        except Exception as e:
            print(f"❌ Test execution failed: {e}")
        
        # Generate report
        report = self.generate_test_report()
        
        print("\n🎯 Test Suite Complete!")
        print(f"📋 Full report saved to: test_data/comprehensive_test_report.json")
        
        return report

if __name__ == "__main__":
    runner = ComprehensiveTestRunner()
    runner.run_all_tests()