#!/usr/bin/env python3
"""
UI Flow Test - Tests critical user interface flows and edge cases
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def test_ui_flows():
    """Test UI-specific flows and edge cases"""
    
    print("🎨 Testing UI Flows and Edge Cases...")
    print("=" * 50)
    
    # Test data pagination and filtering
    print("\n1. Testing Data Pagination and Filtering:")
    
    # Test extracted data with filters
    filter_tests = [
        {"period": "Q3_2025", "docType": "vendor_invoice"},
        {"period": "all", "docType": "sales_register"},
        {"period": "Q3_2025", "docType": "all"},
    ]
    
    for filter_params in filter_tests:
        response = requests.get(f"{BASE_URL}/api/extracted-data", 
                              headers=HEADERS, params=filter_params)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Filter {filter_params}: {len(data)} records")
        else:
            print(f"   ❌ Filter {filter_params}: HTTP {response.status_code}")
    
    # Test financial statements with different periods
    print("\n2. Testing Financial Statements with Different Periods:")
    
    periods = ["Q1_2024", "Q2_2024", "Q3_2024", "Q4_2024", "Q1_2025", "Q2_2025", "Q3_2025"]
    
    for period in periods:
        response = requests.get(f"{BASE_URL}/api/financial-statements", 
                              headers=HEADERS, params={"period": period})
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Period {period}: {len(data)} statements")
        else:
            print(f"   ❌ Period {period}: HTTP {response.status_code}")
    
    # Test edge cases
    print("\n3. Testing Edge Cases:")
    
    # Test invalid document deletion
    invalid_doc_id = "invalid-doc-id-12345"
    response = requests.delete(f"{BASE_URL}/api/documents/{invalid_doc_id}", headers=HEADERS)
    if response.status_code == 404:
        print(f"   ✅ Invalid document deletion: Properly returns 404")
    else:
        print(f"   ❌ Invalid document deletion: Expected 404, got {response.status_code}")
    
    # Test unauthorized access (with invalid token)
    invalid_headers = {"Authorization": "Bearer invalid-token", "Content-Type": "application/json"}
    response = requests.get(f"{BASE_URL}/api/documents", headers=invalid_headers)
    if response.status_code == 401:
        print(f"   ✅ Unauthorized access: Properly returns 401")
    else:
        print(f"   ❌ Unauthorized access: Expected 401, got {response.status_code}")
    
    # Test empty journal generation
    response = requests.post(f"{BASE_URL}/api/reports/generate-journal-entries", headers=HEADERS)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Journal generation: {data.get('message', 'Success')}")
    else:
        print(f"   ❌ Journal generation: HTTP {response.status_code}")
    
    # Test calculation accuracy
    print("\n4. Testing Calculation Accuracy:")
    
    # Get journal entries and verify balance
    response = requests.get(f"{BASE_URL}/api/journal-entries", headers=HEADERS)
    if response.status_code == 200:
        entries = response.json()
        debit_total = sum(float(entry.get('debitAmount', 0)) for entry in entries)
        credit_total = sum(float(entry.get('creditAmount', 0)) for entry in entries)
        balance_diff = abs(debit_total - credit_total)
        
        if balance_diff < 0.01:
            print(f"   ✅ Journal Balance: Perfectly balanced (diff: {balance_diff:.2f})")
        else:
            print(f"   ❌ Journal Balance: Imbalanced (diff: {balance_diff:.2f})")
    
    # Test trial balance calculations
    response = requests.post(f"{BASE_URL}/api/reports/trial-balance", 
                           headers=HEADERS, json={"period": "Q3_2025"})
    if response.status_code == 200:
        data = response.json()
        if data.get('isBalanced', False):
            print(f"   ✅ Trial Balance: Balanced ({data.get('totalDebits', 0):.2f} = {data.get('totalCredits', 0):.2f})")
        else:
            print(f"   ❌ Trial Balance: Imbalanced ({data.get('totalDebits', 0):.2f} ≠ {data.get('totalCredits', 0):.2f})")
    
    print("\n5. Testing Data Integrity:")
    
    # Check for duplicate journal entries
    response = requests.get(f"{BASE_URL}/api/journal-entries", headers=HEADERS)
    if response.status_code == 200:
        entries = response.json()
        
        # Group by document ID to check for duplicates
        doc_entries = {}
        for entry in entries:
            doc_id = entry.get('documentId')
            if doc_id not in doc_entries:
                doc_entries[doc_id] = []
            doc_entries[doc_id].append(entry)
        
        duplicate_docs = [doc_id for doc_id, entries in doc_entries.items() if len(entries) > 10]  # Reasonable threshold
        
        if not duplicate_docs:
            print(f"   ✅ No excessive duplicate entries detected")
        else:
            print(f"   ⚠️  Potential duplicates in {len(duplicate_docs)} documents")
    
    print("\n" + "=" * 50)
    print("✅ UI Flow Testing Complete!")

if __name__ == "__main__":
    test_ui_flows()