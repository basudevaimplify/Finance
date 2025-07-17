#!/usr/bin/env python3
"""
Analyze document data to find missing transactions
"""

import pandas as pd
import os
from pathlib import Path

def analyze_sales_register():
    """Analyze Sales Register data"""
    print("=== ANALYZING SALES REGISTER ===")
    
    # Find Sales Register files
    uploads_dir = Path("uploads")
    sales_files = []
    for file in uploads_dir.glob("*Sales*"):
        if file.is_file():
            sales_files.append(file)
    
    print(f"Found {len(sales_files)} Sales Register files:")
    for file in sales_files:
        print(f"  - {file.name}")
    
    # Try to read the first one
    if sales_files:
        try:
            file_path = sales_files[0]
            print(f"\nAnalyzing: {file_path.name}")
            
            # Read Excel file
            df = pd.read_excel(file_path)
            print(f"Columns: {list(df.columns)}")
            print(f"Rows: {len(df)}")
            
            # Look for amount columns
            amount_columns = [col for col in df.columns if any(word in col.lower() for word in ['amount', 'value', 'total', 'price', 'revenue', 'sales'])]
            print(f"Amount columns found: {amount_columns}")
            
            if amount_columns:
                for col in amount_columns:
                    total = df[col].sum()
                    print(f"  {col}: ₹{total:,.0f}")
                    
            # Show first few rows
            print(f"\nFirst 3 rows:")
            print(df.head(3).to_string())
            
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

def analyze_purchase_register():
    """Analyze Purchase Register data"""
    print("\n=== ANALYZING PURCHASE REGISTER ===")
    
    # Find Purchase Register files
    uploads_dir = Path("uploads")
    purchase_files = []
    for file in uploads_dir.glob("*Purchase*"):
        if file.is_file():
            purchase_files.append(file)
    
    print(f"Found {len(purchase_files)} Purchase Register files:")
    for file in purchase_files:
        print(f"  - {file.name}")
    
    # Try to read the first one
    if purchase_files:
        try:
            file_path = purchase_files[0]
            print(f"\nAnalyzing: {file_path.name}")
            
            # Read Excel file
            df = pd.read_excel(file_path)
            print(f"Columns: {list(df.columns)}")
            print(f"Rows: {len(df)}")
            
            # Look for amount columns
            amount_columns = [col for col in df.columns if any(word in col.lower() for word in ['amount', 'value', 'total', 'price', 'purchase', 'cost'])]
            print(f"Amount columns found: {amount_columns}")
            
            if amount_columns:
                for col in amount_columns:
                    total = df[col].sum()
                    print(f"  {col}: ₹{total:,.0f}")
                    
            # Show first few rows
            print(f"\nFirst 3 rows:")
            print(df.head(3).to_string())
            
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

def analyze_all_files():
    """Analyze all uploaded files"""
    print("\n=== ALL UPLOADED FILES ===")
    
    uploads_dir = Path("uploads")
    if not uploads_dir.exists():
        print("Uploads directory not found!")
        return
    
    files = list(uploads_dir.glob("*"))
    print(f"Total files in uploads: {len(files)}")
    
    for file in files:
        if file.is_file():
            print(f"  - {file.name} ({file.stat().st_size:,} bytes)")

if __name__ == "__main__":
    analyze_sales_register()
    analyze_purchase_register()
    analyze_all_files()