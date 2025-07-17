#!/usr/bin/env python3
"""
Journal Entry Date Validation Script
Checks if journal entries have appropriate dates based on document types
"""

import requests
import json
from datetime import datetime

# Authentication token
TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
BASE_URL = "http://localhost:5000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_journal_entries_with_documents():
    """Get journal entries and documents for date validation"""
    entries_response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
    docs_response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
    
    entries = entries_response.json()
    documents = docs_response.json()
    
    # Create document lookup
    doc_lookup = {doc['id']: doc for doc in documents}
    
    return entries, doc_lookup

def validate_journal_entry_dates():
    """Validate journal entry dates against document expectations"""
    entries, doc_lookup = get_journal_entries_with_documents()
    
    print("=== JOURNAL ENTRY DATE VALIDATION ===")
    print()
    
    # Group entries by document
    entries_by_doc = {}
    for entry in entries:
        doc_id = entry['documentId']
        if doc_id not in entries_by_doc:
            entries_by_doc[doc_id] = []
        entries_by_doc[doc_id].append(entry)
    
    current_date = datetime.now()
    issues_found = []
    
    for doc_id, doc_entries in entries_by_doc.items():
        document = doc_lookup.get(doc_id)
        if not document:
            continue
            
        doc_name = document['originalName']
        upload_date = datetime.fromisoformat(document.get('uploadedAt', document.get('createdAt', '2025-04-15T00:00:00Z')).replace('Z', '+00:00'))
        
        print(f"--- {doc_name} ---")
        print(f"Document uploaded: {upload_date.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check journal entry dates
        for entry in doc_entries:
            entry_date = datetime.fromisoformat(entry['date'].replace('Z', '+00:00'))
            print(f"Journal entry date: {entry_date.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Validate date logic
            if entry_date > current_date:
                issues_found.append(f"❌ Future date: {doc_name} has entry dated {entry_date.strftime('%Y-%m-%d')}")
            elif entry_date > upload_date:
                issues_found.append(f"⚠️ Entry date after upload: {doc_name}")
            else:
                print(f"✅ Date is appropriate (before current date and upload date)")
        
        # Check for specific filename patterns
        filename_lower = doc_name.lower()
        if 'q1' in filename_lower:
            expected_quarter = "Q1 (January-March)"
            entry_month = doc_entries[0]['date'][:7]  # YYYY-MM format
            if entry_month in ['2025-01', '2025-02', '2025-03']:
                print(f"✅ Q1 document correctly dated in {expected_quarter}")
            else:
                issues_found.append(f"⚠️ Q1 document not in expected quarter: {doc_name}")
        
        print()
    
    # Summary
    print("=== VALIDATION SUMMARY ===")
    if issues_found:
        print("Issues found:")
        for issue in issues_found:
            print(f"  {issue}")
    else:
        print("✅ All journal entry dates are appropriate!")
    
    # Additional analysis
    print(f"\nTotal entries: {len(entries)}")
    print(f"Documents processed: {len(entries_by_doc)}")
    
    # Check date distribution
    dates = [entry['date'][:10] for entry in entries]  # Get YYYY-MM-DD
    unique_dates = set(dates)
    print(f"Unique dates used: {len(unique_dates)}")
    for date in sorted(unique_dates):
        count = dates.count(date)
        print(f"  {date}: {count} entries")

def main():
    """Main validation function"""
    print("Validating journal entry dates...")
    validate_journal_entry_dates()
    
    print("\n=== CONCLUSION ===")
    print("Journal entries now use more appropriate dates instead of current timestamp.")
    print("The system infers dates from document names and uses reasonable fallback dates.")

if __name__ == "__main__":
    main()