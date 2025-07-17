#!/usr/bin/env python3
"""
Manual vs Platform Trial Balance Comparison
Compares the manual trial balance with platform-generated data
"""

import requests
import json
from decimal import Decimal

# Authentication token
TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
BASE_URL = "http://localhost:5000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Manual trial balance data from the image
MANUAL_TRIAL_BALANCE = {
    "A. Sharma A/c": {"cr": 57507, "dr": 0, "net": -57507},
    "ABC Pvt Ltd A/c": {"cr": 204590.8, "dr": 0, "net": -204591},
    "B. Kumar A/c": {"cr": 57373, "dr": 0, "net": -57373},
    "Bank A/c": {"cr": 612114, "dr": 934308, "net": 322194},
    "C. Reddy A/c": {"cr": 55361, "dr": 0, "net": -55361},
    "Customer A/c": {"cr": 0, "dr": 3776405, "net": 3776405},
    "D. Singh A/c": {"cr": 43262, "dr": 0, "net": -43262},
    "E. Mehta A/c": {"cr": 49346, "dr": 0, "net": -49346},
    "FastParts Inc. A/c": {"cr": 325753.2, "dr": 0, "net": -325753},
    "Input GST A/c": {"cr": 0, "dr": 168283.8, "net": 168283.8},
    "Laptop A/c": {"cr": 391770, "dr": 0, "net": -391770},
    "MNO Corp A/c": {"cr": 610508.4, "dr": 0, "net": 610508},
    "Office Chair A/c": {"cr": 1145718, "dr": 0, "net": -1145718},
    "Output GST A/c": {"cr": 576061.7, "dr": 0, "net": -576062},
    "Printer A/c": {"cr": 552887, "dr": 0, "net": -552887},
    "Purchase A/c": {"cr": 260633, "dr": 1066263, "net": 805630},
    "Rent A/c": {"cr": 94736, "dr": 161429, "net": 66693},
    "Router A/c": {"cr": 347520, "dr": 0, "net": -347520},
    "Salaries A/c": {"cr": 935831, "dr": 93687, "net": 842144},
    "Salary Expense A/c": {"cr": 0, "dr": 292051, "net": 292051},
    "Sales A/c": {"cr": 0, "dr": 68653, "net": 68653},
    "Software License A/c": {"cr": 762448, "dr": 0, "net": -762448},
    "SupplyCo A/c": {"cr": 140933.3, "dr": 0, "net": -140933},
    "TDS Payable A/c": {"cr": 29202, "dr": 0, "net": -29202},
    "Utilities A/c": {"cr": 320358, "dr": 156992, "net": -163366},
    "XYZ Traders A/c": {"cr": 370865.7, "dr": 0, "net": -370866}
}

def fetch_platform_trial_balance():
    """Fetch trial balance from platform"""
    try:
        response = requests.get(f"{BASE_URL}/api/reports/trial-balance", headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching platform trial balance: {e}")
        return None

def fetch_journal_entries():
    """Fetch journal entries to analyze platform data"""
    try:
        response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching journal entries: {e}")
        return None

def analyze_platform_data():
    """Analyze platform data and create trial balance"""
    entries = fetch_journal_entries()
    if not entries:
        return None
    
    # Group by account
    account_balances = {}
    
    for entry in entries:
        account_name = entry.get('accountName', 'Unknown')
        account_code = entry.get('accountCode', 'Unknown')
        debit = float(entry.get('debitAmount', 0))
        credit = float(entry.get('creditAmount', 0))
        
        key = f"{account_name} ({account_code})"
        if key not in account_balances:
            account_balances[key] = {"dr": 0, "cr": 0}
        
        account_balances[key]["dr"] += debit
        account_balances[key]["cr"] += credit
    
    # Calculate net balances
    for account in account_balances:
        dr = account_balances[account]["dr"]
        cr = account_balances[account]["cr"]
        account_balances[account]["net"] = dr - cr
    
    return account_balances

def compare_trial_balances():
    """Compare manual vs platform trial balances"""
    print("=== TRIAL BALANCE VALIDATION ===")
    print()
    
    # Get platform data
    platform_data = analyze_platform_data()
    if not platform_data:
        print("❌ Could not fetch platform data")
        return
    
    print("Platform Trial Balance:")
    total_dr = 0
    total_cr = 0
    
    for account, balance in sorted(platform_data.items()):
        dr = balance["dr"]
        cr = balance["cr"]
        net = balance["net"]
        total_dr += dr
        total_cr += cr
        
        print(f"{account:30} | Dr: {dr:>10,.2f} | Cr: {cr:>10,.2f} | Net: {net:>10,.2f}")
    
    print(f"\nPlatform Totals: Dr: {total_dr:,.2f} | Cr: {total_cr:,.2f}")
    print(f"Balance Check: {total_dr - total_cr:,.2f} (should be 0)")
    
    # Calculate manual totals
    manual_total_dr = sum(acc["dr"] for acc in MANUAL_TRIAL_BALANCE.values())
    manual_total_cr = sum(acc["cr"] for acc in MANUAL_TRIAL_BALANCE.values())
    
    print(f"\nManual Totals: Dr: {manual_total_dr:,.2f} | Cr: {manual_total_cr:,.2f}")
    print(f"Manual Balance Check: {manual_total_dr - manual_total_cr:,.2f}")
    
    # Validation results
    print("\n=== VALIDATION RESULTS ===")
    
    if abs(total_dr - total_cr) < 0.01:
        print("✅ Platform trial balance is balanced")
    else:
        print("❌ Platform trial balance is not balanced")
    
    if abs(manual_total_dr - manual_total_cr) < 0.01:
        print("✅ Manual trial balance is balanced")
    else:
        print("❌ Manual trial balance is not balanced")
    
    # Compare totals
    dr_diff = abs(total_dr - manual_total_dr)
    cr_diff = abs(total_cr - manual_total_cr)
    
    if dr_diff < 100 and cr_diff < 100:  # Allow small rounding differences
        print("✅ Platform and manual totals are very close")
    else:
        print(f"⚠️ Differences found - Dr: {dr_diff:,.2f}, Cr: {cr_diff:,.2f}")
    
    print(f"\nTotal Entries in Platform: {len(platform_data)}")
    print(f"Total Entries in Manual: {len(MANUAL_TRIAL_BALANCE)}")

def main():
    """Main comparison function"""
    print("Validating trial balance against manual calculations...")
    compare_trial_balances()

if __name__ == "__main__":
    main()