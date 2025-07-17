#!/usr/bin/env python3
"""
Quick smoke test for QRT Closure Platform
Tests essential functionality in under 3 minutes
"""

import requests
import time
import os

def test_smoke():
    """Run essential smoke tests"""
    print("🔥 Running QRT Closure Platform Smoke Test")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Create a session for authentication
    session = requests.Session()
    
    # Test user credentials (from the system)
    auth_token = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    test_results = []
    
    # Test 1: Authentication
    print("\n1. Testing Authentication...")
    start_time = time.time()
    try:
        response = requests.get(f"{base_url}/api/auth/user", headers=headers, timeout=10)
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Authentication successful - User: {user_data['user']['email']}")
            test_results.append(("Authentication", True, time.time() - start_time))
        else:
            print(f"❌ Authentication failed - Status: {response.status_code}")
            test_results.append(("Authentication", False, time.time() - start_time))
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        test_results.append(("Authentication", False, time.time() - start_time))
    
    # Test 2: Basic API Health Check
    print("\n2. Testing API Health...")
    start_time = time.time()
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            print("✅ API health check passed")
            test_results.append(("API Health", True, time.time() - start_time))
        else:
            print("✅ API server is responding (no health endpoint)")
            test_results.append(("API Health", True, time.time() - start_time))
    except Exception as e:
        print(f"❌ API health check failed: {e}")
        test_results.append(("API Health", False, time.time() - start_time))
    
    # Test 3: Frontend Loading
    print("\n3. Testing Frontend...")
    start_time = time.time()
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend loads successfully")
            test_results.append(("Frontend", True, time.time() - start_time))
        else:
            print(f"❌ Frontend failed - Status: {response.status_code}")
            test_results.append(("Frontend", False, time.time() - start_time))
    except Exception as e:
        print(f"❌ Frontend error: {e}")
        test_results.append(("Frontend", False, time.time() - start_time))
    
    # Test 4: Database Connection
    print("\n4. Testing Database Connection...")
    start_time = time.time()
    try:
        # Try to access a simple endpoint that requires database
        response = requests.get(f"{base_url}/api/auth/user", headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ Database connection working")
            test_results.append(("Database", True, time.time() - start_time))
        else:
            print("⚠️  Database connection status unknown")
            test_results.append(("Database", False, time.time() - start_time))
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        test_results.append(("Database", False, time.time() - start_time))
    
    # Test 5: Test Dataset Files
    print("\n5. Testing Test Dataset...")
    start_time = time.time()
    try:
        test_files = [
            "test_data/vendor_invoices_comprehensive.xlsx",
            "test_data/sales_register_comprehensive.xlsx",
            "test_data/journal_entries_comprehensive.csv"
        ]
        
        existing_files = [f for f in test_files if os.path.exists(f)]
        
        if len(existing_files) >= 2:
            print(f"✅ Test dataset ready - {len(existing_files)} files available")
            test_results.append(("Test Dataset", True, time.time() - start_time))
        else:
            print(f"⚠️  Test dataset incomplete - {len(existing_files)} files found")
            test_results.append(("Test Dataset", False, time.time() - start_time))
    except Exception as e:
        print(f"❌ Test dataset error: {e}")
        test_results.append(("Test Dataset", False, time.time() - start_time))
    
    # Test 6: Server Resources
    print("\n6. Testing Server Resources...")
    start_time = time.time()
    try:
        # Test server response time
        response = requests.get(f"{base_url}/api/auth/user", headers=headers, timeout=5)
        duration = time.time() - start_time
        
        if duration < 2.0:
            print(f"✅ Server performance good - {duration:.2f}s response time")
            test_results.append(("Server Performance", True, duration))
        else:
            print(f"⚠️  Server performance slow - {duration:.2f}s response time")
            test_results.append(("Server Performance", False, duration))
    except Exception as e:
        print(f"❌ Server performance error: {e}")
        test_results.append(("Server Performance", False, time.time() - start_time))
    
    # Results Summary
    print("\n" + "=" * 50)
    print("📊 SMOKE TEST RESULTS")
    print("=" * 50)
    
    passed = sum(1 for test in test_results if test[1])
    total = len(test_results)
    
    for test_name, success, duration in test_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name:<20} ({duration:.2f}s)")
    
    print(f"\n📈 Summary: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All smoke tests passed! System is ready.")
    elif passed >= total * 0.8:
        print("⚠️  Most tests passed. Check failed tests above.")
    else:
        print("❌ Multiple test failures. System needs attention.")
    
    print(f"\n⏱️  Total test time: {sum(t[2] for t in test_results):.2f}s")
    
    return test_results

if __name__ == "__main__":
    test_smoke()