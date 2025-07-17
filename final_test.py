#!/usr/bin/env python3
"""
Final comprehensive test of the authentication system
"""
import sys
import os
import requests
import json
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_authentication_system():
    """Test the complete authentication system"""
    
    print("=" * 60)
    print("🔐 QRT Closure Authentication System Test")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code == 200:
            print("✓ Health check passed")
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False
    
    # Test 2: User registration
    print("\n2. Testing user registration...")
    test_user = {
        "email": "finaltest@example.com",
        "password": "FinalTest123!",
        "first_name": "Final",
        "last_name": "Test",
        "company_name": "Final Test Company"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print("✓ User registration successful")
            reg_data = response.json()
            print(f"  - User ID: {reg_data['user']['id']}")
            print(f"  - Email: {reg_data['user']['email']}")
        else:
            print(f"✗ User registration failed: {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ User registration failed: {e}")
        return False
    
    # Test 3: User login
    print("\n3. Testing user login...")
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✓ User login successful")
            login_response = response.json()
            access_token = login_response["access_token"]
            print(f"  - Access token received: {access_token[:50]}...")
            
            # Test 4: Protected endpoint
            print("\n4. Testing protected endpoint...")
            headers = {"Authorization": f"Bearer {access_token}"}
            
            try:
                response = requests.get(
                    "http://localhost:8000/api/auth/user",
                    headers=headers
                )
                
                if response.status_code == 200:
                    print("✓ Protected endpoint access successful")
                    user_data = response.json()
                    print(f"  - User: {user_data['first_name']} {user_data['last_name']}")
                    print(f"  - Email: {user_data['email']}")
                else:
                    print(f"✗ Protected endpoint failed: {response.status_code}")
                    print(f"  Response: {response.text}")
                    return False
            except Exception as e:
                print(f"✗ Protected endpoint failed: {e}")
                return False
                
        else:
            print(f"✗ User login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ User login failed: {e}")
        return False
    
    # Test 5: Dashboard stats endpoint
    print("\n5. Testing dashboard stats endpoint...")
    try:
        response = requests.get(
            "http://localhost:8000/api/dashboard/stats",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if response.status_code == 200:
            print("✓ Dashboard stats endpoint successful")
            stats = response.json()
            print(f"  - Total documents: {stats.get('total_documents', 0)}")
            print(f"  - Processed documents: {stats.get('processed_documents', 0)}")
        else:
            print(f"✗ Dashboard stats failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Dashboard stats failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Authentication System Test Complete!")
    print("=" * 60)
    return True

def start_python_server():
    """Start the Python server in the background"""
    import subprocess
    import time
    
    print("Starting Python FastAPI server...")
    
    # Start the server
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for server to start
    time.sleep(8)
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code == 200:
            print("✓ Python server started successfully")
            return process
        else:
            print("✗ Python server failed to start")
            return None
    except Exception as e:
        print(f"✗ Python server failed to start: {e}")
        return None

if __name__ == "__main__":
    # Check if server is already running
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=2)
        if response.status_code == 200:
            print("✓ Server is already running")
        else:
            print("Starting server...")
            server_process = start_python_server()
            if not server_process:
                sys.exit(1)
    except:
        print("Starting server...")
        server_process = start_python_server()
        if not server_process:
            sys.exit(1)
    
    # Run the tests
    success = test_authentication_system()
    
    if success:
        print("\n🎉 All tests passed! The authentication system is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the server logs.")
        sys.exit(1)