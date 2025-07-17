#!/usr/bin/env python3
"""
Authentication Debug Test Script
Tests all authentication flows and identifies issues
"""

import requests
import json
import base64
import time
from datetime import datetime

class AuthenticationTester:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_user = {
            "userId": "9e36c4db-56c4-4175-9962-7d103db2c1cd",
            "email": "testuser@example.com"
        }
        self.jwt_token = None
        self.results = []
    
    def log_test(self, test_name, success, details="", response_data=None):
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
    
    def generate_jwt_token(self):
        """Generate JWT token for testing"""
        try:
            # Create JWT payload
            payload = {
                "userId": self.test_user["userId"],
                "email": self.test_user["email"]
            }
            
            # Encode as base64 (matching the current implementation)
            token_data = json.dumps(payload)
            self.jwt_token = base64.b64encode(token_data.encode()).decode()
            
            self.log_test("JWT Token Generation", True, f"Generated token: {self.jwt_token[:50]}...")
            return True
            
        except Exception as e:
            self.log_test("JWT Token Generation", False, f"Error: {str(e)}")
            return False
    
    def test_auth_user_endpoint(self):
        """Test /api/auth/user endpoint"""
        if not self.jwt_token:
            self.log_test("Auth User Endpoint", False, "No JWT token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{self.base_url}/api/auth/user", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user"):
                    self.log_test("Auth User Endpoint", True, "User data retrieved successfully", data)
                    return True
                else:
                    self.log_test("Auth User Endpoint", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Auth User Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Auth User Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_trial_balance_endpoint(self):
        """Test /api/reports/trial-balance endpoint"""
        if not self.jwt_token:
            self.log_test("Trial Balance Endpoint", False, "No JWT token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            payload = {"period": "2025"}
            response = requests.post(f"{self.base_url}/api/reports/trial-balance", 
                                   headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "entries" in data and "totalDebits" in data and "totalCredits" in data:
                    self.log_test("Trial Balance Endpoint", True, "Trial balance generated successfully", data)
                    return True
                else:
                    self.log_test("Trial Balance Endpoint", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Trial Balance Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Trial Balance Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_dashboard_stats_endpoint(self):
        """Test /api/dashboard/stats endpoint"""
        if not self.jwt_token:
            self.log_test("Dashboard Stats Endpoint", False, "No JWT token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Dashboard Stats Endpoint", True, "Dashboard stats retrieved successfully", data)
                return True
            else:
                self.log_test("Dashboard Stats Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Stats Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_document_upload_endpoint(self):
        """Test /api/documents/upload endpoint"""
        if not self.jwt_token:
            self.log_test("Document Upload Endpoint", False, "No JWT token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.jwt_token}"
            }
            
            # Create a test file
            test_file_content = "Account,Amount,Type\nSales,10000,Credit\nCash,10000,Debit"
            files = {
                'file': ('test_auth.csv', test_file_content, 'text/csv')
            }
            
            response = requests.post(f"{self.base_url}/api/documents/upload", 
                                   headers=headers, files=files)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("document") and data.get("message"):
                    self.log_test("Document Upload Endpoint", True, "Document uploaded successfully", data)
                    return True
                else:
                    self.log_test("Document Upload Endpoint", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Document Upload Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Document Upload Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_without_auth_token(self):
        """Test endpoints without authentication token"""
        endpoints = [
            ("GET", "/api/auth/user"),
            ("POST", "/api/reports/trial-balance"),
            ("GET", "/api/dashboard/stats"),
            ("POST", "/api/documents/upload")
        ]
        
        for method, endpoint in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}")
                else:
                    response = requests.post(f"{self.base_url}{endpoint}")
                
                if response.status_code == 401:
                    self.log_test(f"No Auth Test - {endpoint}", True, "Correctly rejected unauthorized request")
                else:
                    self.log_test(f"No Auth Test - {endpoint}", False, f"Expected 401, got {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"No Auth Test - {endpoint}", False, f"Error: {str(e)}")
    
    def test_invalid_token(self):
        """Test with invalid JWT token"""
        try:
            headers = {
                "Authorization": "Bearer invalid_token_here",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{self.base_url}/api/auth/user", headers=headers)
            
            if response.status_code == 401:
                self.log_test("Invalid Token Test", True, "Correctly rejected invalid token")
            else:
                self.log_test("Invalid Token Test", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Token Test", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Starting Authentication Debug Tests")
        print("=" * 50)
        
        # Test JWT token generation
        if not self.generate_jwt_token():
            print("❌ Cannot proceed without JWT token")
            return
        
        # Test valid authentication
        print("\n📝 Testing Valid Authentication:")
        self.test_auth_user_endpoint()
        self.test_trial_balance_endpoint()
        self.test_dashboard_stats_endpoint()
        self.test_document_upload_endpoint()
        
        # Test invalid authentication
        print("\n🔒 Testing Invalid Authentication:")
        self.test_without_auth_token()
        self.test_invalid_token()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        # Save detailed results
        with open("auth_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Detailed results saved to auth_test_results.json")

if __name__ == "__main__":
    tester = AuthenticationTester()
    tester.run_all_tests()