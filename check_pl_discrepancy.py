#!/usr/bin/env python3
"""
Check P&L discrepancy between manual calculation and platform
"""

import requests
import json
from collections import defaultdict

# API configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def get_journal_entries():
    """Get all journal entries"""
    response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching journal entries: {response.status_code}")
        return []

def analyze_account_balances():
    """Analyze account balances from journal entries"""
    entries = get_journal_entries()
    
    # Group by account code
    account_balances = defaultdict(lambda: {
        'name': '',
        'total_debits': 0,
        'total_credits': 0,
        'net_balance': 0
    })
    
    for entry in entries:
        account_code = entry['accountCode']
        account_name = entry['accountName']
        debit_amount = float(entry.get('debitAmount', 0) or 0)
        credit_amount = float(entry.get('creditAmount', 0) or 0)
        
        account_balances[account_code]['name'] = account_name
        account_balances[account_code]['total_debits'] += debit_amount
        account_balances[account_code]['total_credits'] += credit_amount
        account_balances[account_code]['net_balance'] = (
            account_balances[account_code]['total_debits'] - 
            account_balances[account_code]['total_credits']
        )
    
    return account_balances

def calculate_manual_pl():
    """Calculate P&L manually using proper accounting logic"""
    balances = analyze_account_balances()
    
    revenue_accounts = {}
    expense_accounts = {}
    
    total_revenue = 0
    total_expenses = 0
    
    print("=== ACCOUNT ANALYSIS ===")
    print(f"{'Account':<8} {'Name':<25} {'Debits':<12} {'Credits':<12} {'Net Balance':<12}")
    print("-" * 80)
    
    for code, data in sorted(balances.items()):
        print(f"{code:<8} {data['name'][:25]:<25} {data['total_debits']:<12,.0f} {data['total_credits']:<12,.0f} {data['net_balance']:<12,.0f}")
        
        if code.startswith('4'):  # Revenue accounts
            # For revenue accounts, credit balance is revenue
            amount = data['total_credits']
            if amount > 0:
                revenue_accounts[code] = {
                    'name': data['name'],
                    'amount': amount
                }
                total_revenue += amount
                
        elif code.startswith('5'):  # Expense accounts
            # For expense accounts, use debit balance (normal) or credit balance (reversals)
            amount = data['total_debits'] if data['total_debits'] > 0 else data['total_credits']
            if amount > 0:
                expense_accounts[code] = {
                    'name': data['name'],
                    'amount': amount
                }
                total_expenses += amount
    
    print(f"\n=== REVENUE ACCOUNTS ===")
    for code, data in revenue_accounts.items():
        print(f"{code}: {data['name']} - ₹{data['amount']:,.0f}")
    
    print(f"\n=== EXPENSE ACCOUNTS ===")
    for code, data in expense_accounts.items():
        print(f"{code}: {data['name']} - ₹{data['amount']:,.0f}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Total Revenue: ₹{total_revenue:,.0f}")
    print(f"Total Expenses: ₹{total_expenses:,.0f}")
    print(f"Net Profit/Loss: ₹{total_revenue - total_expenses:,.0f}")
    
    # Compare with manual calculation
    print(f"\n=== COMPARISON WITH MANUAL CALCULATION ===")
    print(f"Manual Total Sales: ₹3,200,343")
    print(f"Platform Revenue: ₹{total_revenue:,.0f}")
    print(f"Difference: ₹{3200343 - total_revenue:,.0f}")
    
    print(f"\nManual Total Purchase: ₹934,910")
    purchase_amount = expense_accounts.get('5300', {}).get('amount', 0)
    print(f"Platform Purchase: ₹{purchase_amount:,.0f}")
    print(f"Difference: ₹{934910 - purchase_amount:,.0f}")

if __name__ == "__main__":
    calculate_manual_pl()