#!/usr/bin/env python3
"""
Script to fix journal entries by regenerating them with proper account codes
"""

import requests
import json

# Authentication token
TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
BASE_URL = "http://localhost:5000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_journal_entries():
    """Get all journal entries"""
    response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
    return response.json()

def get_documents():
    """Get all documents"""
    response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
    return response.json()

def delete_journal_entry(entry_id):
    """Delete a journal entry"""
    response = requests.delete(f"{BASE_URL}/api/journal-entries/{entry_id}", headers=headers)
    return response.status_code == 200

def clear_all_journal_entries():
    """Clear all existing journal entries"""
    entries = get_journal_entries()
    deleted_count = 0
    
    for entry in entries:
        if delete_journal_entry(entry['id']):
            deleted_count += 1
            print(f"Deleted entry: {entry['accountCode']} - {entry['accountName']}")
    
    print(f"Deleted {deleted_count} journal entries")
    return deleted_count

def regenerate_journal_entries():
    """Regenerate journal entries with proper account codes"""
    response = requests.post(f"{BASE_URL}/api/reports/generate-journal-entries", headers=headers)
    return response.json()

def main():
    print("=== Journal Entry Regeneration Script ===")
    
    # Step 1: Get current state
    print("\n1. Getting current journal entries...")
    entries = get_journal_entries()
    print(f"Found {len(entries)} existing journal entries")
    
    # Step 2: Clear existing entries
    print("\n2. Clearing existing journal entries...")
    deleted_count = clear_all_journal_entries()
    
    # Step 3: Regenerate with proper account codes
    print("\n3. Regenerating journal entries with proper account codes...")
    result = regenerate_journal_entries()
    print(f"Regeneration result: {result}")
    
    # Step 4: Verify new entries
    print("\n4. Verifying new entries...")
    new_entries = get_journal_entries()
    print(f"Now have {len(new_entries)} journal entries")
    
    # Show sample of new entries
    if new_entries:
        print("\nSample of new entries:")
        for entry in new_entries[:5]:
            print(f"- {entry['accountCode']} {entry['accountName']}: Dr {entry['debitAmount']} Cr {entry['creditAmount']}")
    
    print("\n=== Script completed successfully! ===")

if __name__ == "__main__":
    main()