"""
Fix journal entries with correct amounts based on actual file content
"""
import psycopg2
import os
import pandas as pd
from datetime import datetime, timedelta
import uuid

def clear_existing_entries():
    """Clear existing journal entries"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # Clear existing journal entries
    cur.execute("DELETE FROM journal_entries WHERE tenant_id = %s", ('f3db976c-1179-448d-bfec-39dc16ebcf4d',))
    conn.commit()
    
    print("Cleared existing journal entries")
    conn.close()

def create_correct_journal_entries():
    """Create journal entries with correct amounts based on actual file content"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # Set date to 3 months ago to be consistent with business logic
    entry_date = datetime.now() - timedelta(days=90)
    
    # 1. Sales Register (misnamed as Purchase Register) - Rs 32,00,343
    journal_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_1', entry_date,
        '1200', 'Accounts Receivable', '3200343', '0',
        'Sales Register - WnFzK7JkA4nwUV-gLqkB0_Purchase Register.xlsx',
        'Corporate Clients', '1ece94a1-2372-4182-8e56-8c9416d77709', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_2', entry_date,
        '4100', 'Sales Revenue', '0', '3200343',
        'Sales Register - WnFzK7JkA4nwUV-gLqkB0_Purchase Register.xlsx',
        'Corporate Clients', '1ece94a1-2372-4182-8e56-8c9416d77709', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    # 2. Purchase Register (misnamed as Salary Register) - Rs 9,34,910
    journal_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_1', entry_date,
        '5300', 'Purchase Expense', '934910', '0',
        'Purchase Register - kepdlHZsBUUV_ytx8pQx7_Salary Register.xlsx',
        'Global Suppliers', 'aea178dc-d519-483f-8c9d-643de29d6f36', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_2', entry_date,
        '2100', 'Accounts Payable', '0', '934910',
        'Purchase Register - kepdlHZsBUUV_ytx8pQx7_Salary Register.xlsx',
        'Global Suppliers', 'aea178dc-d519-483f-8c9d-643de29d6f36', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    # 3. Salary Register (misnamed as Fixed Assets) - Rs 2,11,288 (Amount Paid), Rs 21,127 (TDS)
    journal_id = str(uuid.uuid4())
    # Salary expense entry
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_1', entry_date,
        '5200', 'Salary Expense', '211288', '0',
        'Salary Register - lA3wAdpx8aA06n85jBxGN_Fixed Assets.xlsx',
        'HR Department', 'ae369035-6c07-4a13-a0ee-467588f2339a', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    # TDS receivable entry
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_2', entry_date,
        '1300', 'TDS Receivable', '21127', '0',
        'TDS Deduction - lA3wAdpx8aA06n85jBxGN_Fixed Assets.xlsx',
        'Income Tax Department', 'ae369035-6c07-4a13-a0ee-467588f2339a', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    # Cash/Bank payment (net amount after TDS)
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_3', entry_date,
        '1100', 'Cash/Bank', '0', '190161',
        'Net Salary Payment - lA3wAdpx8aA06n85jBxGN_Fixed Assets.xlsx',
        'HR Department', 'ae369035-6c07-4a13-a0ee-467588f2339a', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    # TDS expense offset
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_4', entry_date,
        '5400', 'TDS Expense', '0', '21127',
        'TDS Expense Offset - lA3wAdpx8aA06n85jBxGN_Fixed Assets.xlsx',
        'Income Tax Department', 'ae369035-6c07-4a13-a0ee-467588f2339a', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    # 4. Fixed Assets Register (misnamed as Sales Register) - Rs 4,10,224
    journal_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_1', entry_date,
        '1500', 'Fixed Assets', '410224', '0',
        'Fixed Assets Register - 95dENJhd91F_w91rHRnIE_Sales Register.xlsx',
        'Asset Suppliers', 'a3378115-5eab-405d-a7e0-72f476968a6d', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    cur.execute("""
        INSERT INTO journal_entries 
        (id, journal_id, date, account_code, account_name, debit_amount, credit_amount, narration, entity, document_id, created_by, tenant_id, created_at)
        VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        str(uuid.uuid4()), journal_id + '_2', entry_date,
        '1100', 'Cash/Bank', '0', '410224',
        'Fixed Assets Payment - 95dENJhd91F_w91rHRnIE_Sales Register.xlsx',
        'Asset Suppliers', 'a3378115-5eab-405d-a7e0-72f476968a6d', '6pMuDqq5nnPmt2IwzuVlb',
        'f3db976c-1179-448d-bfec-39dc16ebcf4d', entry_date
    ))
    
    conn.commit()
    conn.close()
    
    print("Created correct journal entries with real amounts:")
    print("- Sales Revenue: Rs 32,00,343")
    print("- Purchase Expense: Rs 9,34,910")
    print("- Salary Expense: Rs 2,11,288")
    print("- Fixed Assets: Rs 4,10,224")
    print("- TDS Receivable: Rs 21,127")

def main():
    clear_existing_entries()
    create_correct_journal_entries()
    print("\n✅ Fixed journal entries with correct amounts from actual file content")

if __name__ == "__main__":
    main()