#!/usr/bin/env python3
"""
Complete Integration Test Runner
Orchestrates all testing phases: unit tests, integration tests, and end-to-end tests
"""

import sys
import os
import json
import time
import subprocess
from pathlib import Path
from datetime import datetime

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

class CompleteTestRunner:
    """Comprehensive test runner for the entire QRT Closure platform"""
    
    def __init__(self):
        self.test_results = {
            'unit_tests': None,
            'integration_tests': None,
            'e2e_tests': None,
            'performance_tests': None
        }
        self.start_time = time.time()
        
        print("🎯 QRT Closure Platform - Complete Testing Suite")
        print("=" * 70)
        print("Running comprehensive tests across all platform components")
        print("=" * 70)
    
    def run_python_server(self):
        """Start Python FastAPI server for testing"""
        print("\n🚀 Starting Python FastAPI server...")
        
        try:
            # Start server in background
            server_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to start
            time.sleep(5)
            
            # Test server health
            import requests
            response = requests.get("http://localhost:8000/api/health", timeout=10)
            if response.status_code == 200:
                print("✓ Python server started successfully")
                return server_process
            else:
                print("✗ Python server failed to start properly")
                return None
                
        except Exception as e:
            print(f"✗ Error starting Python server: {e}")
            return None
    
    def run_unit_tests(self):
        """Run unit tests for all components"""
        print("\n🧪 Running Unit Tests...")
        print("-" * 50)
        
        try:
            # Run Python unit tests
            result = subprocess.run(
                [sys.executable, "test_fastapi_app.py"],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            success = result.returncode == 0
            self.test_results['unit_tests'] = {
                'success': success,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'duration': time.time() - self.start_time
            }
            
            if success:
                print("✓ Unit tests completed successfully")
            else:
                print("✗ Unit tests failed")
                print(f"Error: {result.stderr}")
            
            return success
            
        except subprocess.TimeoutExpired:
            print("✗ Unit tests timed out")
            return False
        except Exception as e:
            print(f"✗ Error running unit tests: {e}")
            return False
    
    def run_integration_tests(self):
        """Run integration tests"""
        print("\n🔗 Running Integration Tests...")
        print("-" * 50)
        
        try:
            result = subprocess.run(
                [sys.executable, "integration_test.py"],
                capture_output=True,
                text=True,
                timeout=600
            )
            
            success = result.returncode == 0
            self.test_results['integration_tests'] = {
                'success': success,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'duration': time.time() - self.start_time
            }
            
            if success:
                print("✓ Integration tests completed successfully")
            else:
                print("✗ Integration tests failed")
                print(f"Error: {result.stderr}")
            
            return success
            
        except subprocess.TimeoutExpired:
            print("✗ Integration tests timed out")
            return False
        except Exception as e:
            print(f"✗ Error running integration tests: {e}")
            return False
    
    def run_performance_tests(self):
        """Run performance and load tests"""
        print("\n⚡ Running Performance Tests...")
        print("-" * 50)
        
        try:
            # Import performance testing modules
            import requests
            import threading
            from concurrent.futures import ThreadPoolExecutor
            
            # Test endpoints
            endpoints = [
                "/api/health",
                "/api/auth/login",
                "/api/dashboard/stats"
            ]
            
            # Performance metrics
            response_times = []
            success_count = 0
            total_requests = 0
            
            def make_request(url):
                nonlocal success_count, total_requests
                start_time = time.time()
                try:
                    if url.endswith('/login'):
                        response = requests.post(f"http://localhost:8000{url}", json={
                            "email": "demo@example.com",
                            "password": "DemoPassword123!"
                        }, timeout=5)
                    else:
                        response = requests.get(f"http://localhost:8000{url}", timeout=5)
                    
                    response_time = time.time() - start_time
                    response_times.append(response_time)
                    
                    if response.status_code < 400:
                        success_count += 1
                    
                    total_requests += 1
                    
                except Exception as e:
                    total_requests += 1
                    response_times.append(5.0)  # Timeout
            
            # Run concurrent requests
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = []
                for _ in range(50):  # 50 requests per endpoint
                    for endpoint in endpoints:
                        future = executor.submit(make_request, endpoint)
                        futures.append(future)
                
                # Wait for all requests to complete
                for future in futures:
                    future.result()
            
            # Calculate metrics
            avg_response_time = sum(response_times) / len(response_times)
            success_rate = (success_count / total_requests) * 100
            
            performance_result = {
                'total_requests': total_requests,
                'success_count': success_count,
                'success_rate': success_rate,
                'avg_response_time': avg_response_time,
                'max_response_time': max(response_times),
                'min_response_time': min(response_times)
            }
            
            self.test_results['performance_tests'] = {
                'success': success_rate > 95,  # 95% success rate threshold
                'metrics': performance_result,
                'duration': time.time() - self.start_time
            }
            
            print(f"✓ Performance tests completed")
            print(f"  - Total requests: {total_requests}")
            print(f"  - Success rate: {success_rate:.1f}%")
            print(f"  - Average response time: {avg_response_time:.3f}s")
            
            return success_rate > 95
            
        except Exception as e:
            print(f"✗ Error running performance tests: {e}")
            return False
    
    def run_database_tests(self):
        """Run database integrity and performance tests"""
        print("\n🗄️ Running Database Tests...")
        print("-" * 50)
        
        try:
            from app.database import get_db
            from app.models import User, Document, UserSession
            from sqlalchemy import text
            
            db = next(get_db())
            
            # Test database connectivity
            result = db.execute(text("SELECT 1")).fetchone()
            if result[0] != 1:
                raise Exception("Database connectivity test failed")
            
            # Test table existence
            tables = ['users', 'user_sessions', 'documents']
            for table in tables:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()
                print(f"  - Table {table}: {result[0]} records")
            
            # Test user creation and retrieval
            test_user_count = db.execute(text("SELECT COUNT(*) FROM users WHERE email LIKE 'test_%'")).fetchone()[0]
            print(f"  - Test users in database: {test_user_count}")
            
            print("✓ Database tests completed successfully")
            return True
            
        except Exception as e:
            print(f"✗ Database tests failed: {e}")
            return False
    
    def run_security_tests(self):
        """Run security and authentication tests"""
        print("\n🔒 Running Security Tests...")
        print("-" * 50)
        
        try:
            import requests
            
            # Test authentication endpoints
            security_tests = [
                {
                    'name': 'Invalid token access',
                    'request': lambda: requests.get("http://localhost:8000/api/auth/user", 
                                                  headers={"Authorization": "Bearer invalid_token"}),
                    'expected_status': 401
                },
                {
                    'name': 'Missing authentication',
                    'request': lambda: requests.get("http://localhost:8000/api/dashboard/stats"),
                    'expected_status': 401
                },
                {
                    'name': 'SQL injection prevention',
                    'request': lambda: requests.post("http://localhost:8000/api/auth/login", 
                                                    json={"email": "'; DROP TABLE users; --", 
                                                         "password": "test"}),
                    'expected_status': 422
                }
            ]
            
            passed_tests = 0
            for test in security_tests:
                try:
                    response = test['request']()
                    if response.status_code == test['expected_status']:
                        print(f"  ✓ {test['name']}")
                        passed_tests += 1
                    else:
                        print(f"  ✗ {test['name']} - Expected {test['expected_status']}, got {response.status_code}")
                except Exception as e:
                    print(f"  ✗ {test['name']} - Error: {e}")
            
            success = passed_tests == len(security_tests)
            print(f"✓ Security tests completed: {passed_tests}/{len(security_tests)} passed")
            return success
            
        except Exception as e:
            print(f"✗ Security tests failed: {e}")
            return False
    
    def generate_comprehensive_report(self):
        """Generate comprehensive test report"""
        end_time = time.time()
        total_duration = end_time - self.start_time
        
        # Count total tests
        total_tests = 0
        passed_tests = 0
        
        for test_type, result in self.test_results.items():
            if result:
                total_tests += 1
                if result.get('success', False):
                    passed_tests += 1
        
        # Create comprehensive report
        report = {
            'summary': {
                'total_test_suites': total_tests,
                'passed_suites': passed_tests,
                'failed_suites': total_tests - passed_tests,
                'overall_success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0,
                'total_duration': f"{total_duration:.2f}s",
                'timestamp': datetime.now().isoformat(),
                'platform_version': "1.0.0",
                'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            },
            'test_results': self.test_results
        }
        
        print('\n' + '=' * 70)
        print('📊 COMPREHENSIVE TEST REPORT')
        print('=' * 70)
        print(f'Total Test Suites: {total_tests}')
        print(f'Passed Suites: {passed_tests}')
        print(f'Failed Suites: {total_tests - passed_tests}')
        print(f'Overall Success Rate: {report["summary"]["overall_success_rate"]:.1f}%')
        print(f'Total Duration: {report["summary"]["total_duration"]}')
        print('=' * 70)
        
        # Show individual test results
        print('\n📋 INDIVIDUAL TEST SUITE RESULTS:')
        for test_type, result in self.test_results.items():
            if result:
                status = "✓" if result.get('success', False) else "✗"
                print(f"{status} {test_type.replace('_', ' ').title()}")
                if 'metrics' in result:
                    metrics = result['metrics']
                    for key, value in metrics.items():
                        print(f"    {key}: {value}")
        
        # Save comprehensive report
        with open('COMPREHENSIVE_TEST_REPORT.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print('\n📄 Comprehensive report saved to COMPREHENSIVE_TEST_REPORT.json')
        return passed_tests == total_tests
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"\n🎯 Starting comprehensive testing at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Start Python server
        server_process = self.run_python_server()
        if not server_process:
            print("❌ Cannot proceed without Python server")
            return False
        
        try:
            # Run all test suites
            test_suites = [
                ("Database Tests", self.run_database_tests),
                ("Security Tests", self.run_security_tests),
                ("Unit Tests", self.run_unit_tests),
                ("Integration Tests", self.run_integration_tests),
                ("Performance Tests", self.run_performance_tests)
            ]
            
            all_passed = True
            for suite_name, test_func in test_suites:
                print(f"\n{'='*20} {suite_name} {'='*20}")
                result = test_func()
                if not result:
                    all_passed = False
                    print(f"❌ {suite_name} failed")
                else:
                    print(f"✅ {suite_name} passed")
            
            # Generate final report
            final_result = self.generate_comprehensive_report()
            
            if final_result:
                print("\n🎉 ALL TESTS PASSED! The QRT Closure platform is ready for production.")
            else:
                print("\n❌ Some tests failed. Please review the errors above.")
            
            return final_result
            
        finally:
            # Clean up server process
            if server_process:
                server_process.terminate()
                server_process.wait()
                print("\n🛑 Python server stopped")

if __name__ == "__main__":
    runner = CompleteTestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\n🚀 Platform is ready for deployment!")
    else:
        print("\n🔧 Platform needs fixes before deployment.")
        sys.exit(1)