#!/usr/bin/env python3
"""
Platform P&L Validation Script
Validates the platform P&L calculation against manual calculations
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

def analyze_journal_entries():
    """Analyze journal entries to understand P&L calculation"""
    try:
        response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
        response.raise_for_status()
        entries = response.json()
        
        print("=== JOURNAL ENTRIES ANALYSIS FOR P&L ===")
        print(f"Total entries: {len(entries)}")
        print()
        
        # Group by account code
        account_summary = {}
        for entry in entries:
            code = entry['accountCode']
            if code not in account_summary:
                account_summary[code] = {
                    'name': entry['accountName'],
                    'total_debits': 0,
                    'total_credits': 0,
                    'entries': []
                }
            
            debit = float(entry.get('debitAmount', 0))
            credit = float(entry.get('creditAmount', 0))
            
            account_summary[code]['total_debits'] += debit
            account_summary[code]['total_credits'] += credit
            account_summary[code]['entries'].append({
                'debit': debit,
                'credit': credit,
                'narration': entry.get('narration', '')
            })
        
        print("Account Summary:")
        print(f"{'Code':<6} {'Name':<25} {'Total Debits':<12} {'Total Credits':<13} {'Net Balance':<12}")
        print("-" * 80)
        
        revenue_accounts = []
        expense_accounts = []
        
        for code, data in sorted(account_summary.items()):
            net_balance = data['total_debits'] - data['total_credits']
            print(f"{code:<6} {data['name']:<25} {data['total_debits']:>11,.2f} {data['total_credits']:>12,.2f} {net_balance:>11,.2f}")
            
            if code.startswith('4'):
                # Revenue accounts - should have credit balance (negative net)
                revenue_accounts.append({
                    'code': code,
                    'name': data['name'],
                    'amount': abs(net_balance)
                })
            elif code.startswith('5'):
                # Expense accounts - should have debit balance (positive net)
                expense_accounts.append({
                    'code': code,
                    'name': data['name'],
                    'amount': abs(net_balance)
                })
        
        print()
        print("=== EXPECTED P&L CALCULATION ===")
        print()
        
        print("REVENUE:")
        total_revenue = 0
        for acc in revenue_accounts:
            print(f"  {acc['code']} - {acc['name']}: ₹{acc['amount']:,.2f}")
            total_revenue += acc['amount']
        
        print(f"Total Revenue: ₹{total_revenue:,.2f}")
        print()
        
        print("EXPENSES:")
        total_expenses = 0
        for acc in expense_accounts:
            print(f"  {acc['code']} - {acc['name']}: ₹{acc['amount']:,.2f}")
            total_expenses += acc['amount']
        
        print(f"Total Expenses: ₹{total_expenses:,.2f}")
        print()
        
        print(f"Net Profit: ₹{total_revenue - total_expenses:,.2f}")
        print()
        
        return {
            'revenue_accounts': revenue_accounts,
            'expense_accounts': expense_accounts,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_profit': total_revenue - total_expenses
        }
        
    except Exception as e:
        print(f"Error analyzing journal entries: {e}")
        return None

def test_platform_pl():
    """Test the platform P&L endpoint"""
    try:
        response = requests.post(f"{BASE_URL}/api/reports/profit-loss", 
                                headers=headers, 
                                json={"period": "2025"})
        response.raise_for_status()
        pl_data = response.json()
        
        print("=== PLATFORM P&L RESPONSE ===")
        print(json.dumps(pl_data, indent=2))
        
        return pl_data
        
    except Exception as e:
        print(f"Error testing platform P&L: {e}")
        return None

def main():
    print("Analyzing platform P&L calculation...")
    print()
    
    # First analyze journal entries
    expected = analyze_journal_entries()
    
    if expected:
        print("=== COMPARISON WITH MANUAL CALCULATION ===")
        print(f"Expected Total Revenue: ₹{expected['total_revenue']:,.2f}")
        print(f"Expected Total Expenses: ₹{expected['total_expenses']:,.2f}")
        print(f"Expected Net Profit: ₹{expected['net_profit']:,.2f}")
        print()
        
        # Manual calculation from image
        manual_values = {
            'total_sales': 3200343,
            'total_purchase': 934910,
            'total_salary': 292051,
            'gross_profit': 2265433,
            'net_profit': 1973382
        }
        
        print("Manual Calculation from Image:")
        print(f"Total Sales: ₹{manual_values['total_sales']:,}")
        print(f"Total Purchase: ₹{manual_values['total_purchase']:,}")
        print(f"Total Salary: ₹{manual_values['total_salary']:,}")
        print(f"Net Profit: ₹{manual_values['net_profit']:,}")
        print()
        
        # Test platform
        platform_result = test_platform_pl()
        
        if platform_result:
            print("=== VALIDATION RESULTS ===")
            platform_revenue = platform_result.get('totalRevenue', 0)
            platform_expenses = platform_result.get('totalExpenses', 0)
            platform_profit = platform_result.get('netProfit', 0)
            
            print(f"Platform Revenue: ₹{platform_revenue:,.2f}")
            print(f"Platform Expenses: ₹{platform_expenses:,.2f}")
            print(f"Platform Profit: ₹{platform_profit:,.2f}")
            
            # Check accuracy
            if abs(platform_revenue - expected['total_revenue']) < 1:
                print("✅ Revenue calculation correct")
            else:
                print(f"❌ Revenue mismatch: Expected ₹{expected['total_revenue']:,.2f}, Got ₹{platform_revenue:,.2f}")
            
            if abs(platform_expenses - expected['total_expenses']) < 1:
                print("✅ Expense calculation correct")
            else:
                print(f"❌ Expense mismatch: Expected ₹{expected['total_expenses']:,.2f}, Got ₹{platform_expenses:,.2f}")

if __name__ == "__main__":
    main()