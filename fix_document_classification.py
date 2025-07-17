#!/usr/bin/env python3
"""
Fix document classification issue by analyzing actual content vs. filename
"""

import pandas as pd
from pathlib import Path
import json

def analyze_content_vs_filename():
    """Analyze each file's actual content vs its filename classification"""
    
    uploads_dir = Path("uploads")
    
    files_to_check = [
        "Unu7zVyms4tltpk57Bjrl_Sales Register.xlsx",
        "cPro6h67KZQMzCHE_NIIU_Purchase Register.xlsx"
    ]
    
    for filename in files_to_check:
        file_path = uploads_dir / filename
        if file_path.exists():
            print(f"\n=== ANALYZING: {filename} ===")
            
            # Read the file
            try:
                df = pd.read_excel(file_path)
                print(f"Columns: {list(df.columns)}")
                print(f"Rows: {len(df)}")
                
                # Analyze content type
                columns_lower = [col.lower() for col in df.columns]
                
                is_sales = any(word in ' '.join(columns_lower) for word in ['sales', 'revenue', 'income', 'customer', 'invoice'])
                is_purchase = any(word in ' '.join(columns_lower) for word in ['purchase', 'vendor', 'supplier', 'cost', 'expense'])
                is_assets = any(word in ' '.join(columns_lower) for word in ['asset', 'depreciation', 'useful life'])
                
                print(f"Content Analysis:")
                print(f"  - Looks like Sales: {is_sales}")
                print(f"  - Looks like Purchase: {is_purchase}")
                print(f"  - Looks like Assets: {is_assets}")
                
                # Filename classification
                name_lower = filename.lower()
                filename_type = "unknown"
                if "sales" in name_lower:
                    filename_type = "sales_register"
                elif "purchase" in name_lower:
                    filename_type = "purchase_register"
                
                print(f"Filename suggests: {filename_type}")
                
                # Check for amount totals
                amount_columns = [col for col in df.columns if any(word in col.lower() for word in ['amount', 'total', 'value', 'cost', 'price'])]
                if amount_columns:
                    print(f"Amount columns: {amount_columns}")
                    for col in amount_columns:
                        total = df[col].sum()
                        print(f"  {col}: ₹{total:,.0f}")
                
                # Show sample data
                print(f"\nSample data:")
                print(df.head(2).to_string())
                
            except Exception as e:
                print(f"Error reading {filename}: {e}")

def check_actual_sales_data():
    """Check which file contains the actual sales data matching manual calculation"""
    
    uploads_dir = Path("uploads")
    manual_sales_total = 3200343
    
    print(f"\n=== SEARCHING FOR SALES DATA MATCHING ₹{manual_sales_total:,} ===")
    
    for file_path in uploads_dir.glob("*.xlsx"):
        try:
            df = pd.read_excel(file_path)
            
            # Look for amount columns
            amount_columns = [col for col in df.columns if any(word in col.lower() for word in ['amount', 'total', 'value', 'cost', 'price'])]
            
            for col in amount_columns:
                total = df[col].sum()
                if abs(total - manual_sales_total) < 1000:  # Within 1000 difference
                    print(f"*** MATCH FOUND ***")
                    print(f"File: {file_path.name}")
                    print(f"Column: {col}")
                    print(f"Total: ₹{total:,.0f}")
                    print(f"Expected: ₹{manual_sales_total:,.0f}")
                    print(f"Difference: ₹{total - manual_sales_total:,.0f}")
                    
                    # Show what this file was classified as
                    name_lower = file_path.name.lower()
                    if "sales" in name_lower:
                        print(f"Current classification: sales_register")
                    elif "purchase" in name_lower:
                        print(f"Current classification: purchase_register")
                        print(f"*** PROBLEM: This file is classified as PURCHASE but contains SALES data! ***")
                    
        except Exception as e:
            continue

if __name__ == "__main__":
    analyze_content_vs_filename()
    check_actual_sales_data()