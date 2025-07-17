#!/usr/bin/env python3
"""
QRT Closure Platform - Comprehensive Test Dataset Generator
Generates realistic test data for all user scenarios and workflows
"""

import json
import csv
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import pandas as pd
from io import StringIO

class TestDatasetGenerator:
    """Generate comprehensive test datasets for all user scenarios"""
    
    def __init__(self):
        self.companies = [
            "TechCorp Solutions Pvt Ltd",
            "Manufacturing Industries Ltd",
            "Retail Chain Operations",
            "Consulting Services India",
            "Export Import Co Ltd"
        ]
        
        self.vendors = [
            "ABC Suppliers Ltd", "XYZ Manufacturing", "Tech Solutions Provider",
            "Office Equipment Co", "Raw Materials Supplier", "Logistics Partner Ltd",
            "IT Services Provider", "Marketing Agency", "Legal Services Firm"
        ]
        
        self.customers = [
            "Enterprise Customer Ltd", "Government Department", "SME Client Co",
            "Corporate Solutions", "Retail Chain Store", "Manufacturing Unit",
            "Service Provider", "Export Customer", "B2B Partner"
        ]
        
        self.employees = [
            "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sneha Patel",
            "Vikram Gupta", "Anita Joshi", "Rahul Verma", "Deepika Nair"
        ]
        
        self.account_codes = {
            "CASH": "Cash and Bank",
            "RECEIVABLE": "Accounts Receivable",
            "INVENTORY": "Inventory",
            "FIXED_ASSETS": "Fixed Assets",
            "PAYABLE": "Accounts Payable",
            "SALARY": "Salary Expenses",
            "RENT": "Rent Expenses",
            "UTILITIES": "Utilities Expenses",
            "SALES": "Sales Revenue",
            "INTEREST": "Interest Income"
        }

    def generate_vendor_invoices(self, count: int = 20) -> List[Dict]:
        """Generate vendor invoice test data"""
        invoices = []
        for i in range(count):
            invoice = {
                "invoiceNumber": f"VI-2025-{str(i+1).zfill(3)}",
                "vendorName": random.choice(self.vendors),
                "invoiceDate": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
                "amount": random.randint(10000, 500000),
                "gstin": f"29ABCDE{random.randint(1000, 9999)}F1Z{random.randint(1, 9)}",
                "description": random.choice([
                    "Office supplies and equipment",
                    "Raw materials purchase",
                    "IT services and maintenance",
                    "Marketing and advertising",
                    "Legal and professional services"
                ]),
                "status": random.choice(["paid", "pending", "overdue"])
            }
            invoices.append(invoice)
        return invoices

    def generate_sales_register(self, count: int = 25) -> List[Dict]:
        """Generate sales register test data"""
        sales = []
        for i in range(count):
            taxable_amount = random.randint(50000, 1000000)
            gst_rate = random.choice([0.05, 0.12, 0.18, 0.28])
            gst_amount = int(taxable_amount * gst_rate)
            
            sale = {
                "invoiceNumber": f"SR-2025-{str(i+1).zfill(3)}",
                "customerName": random.choice(self.customers),
                "saleDate": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
                "taxableAmount": taxable_amount,
                "gstAmount": gst_amount,
                "totalAmount": taxable_amount + gst_amount,
                "customerGSTIN": f"29ABCDE{random.randint(1000, 9999)}F1Z{random.randint(1, 9)}",
                "productDescription": random.choice([
                    "Software licenses and services",
                    "Manufacturing equipment",
                    "Consulting services",
                    "IT infrastructure",
                    "Professional services"
                ])
            }
            sales.append(sale)
        return sales

    def generate_salary_register(self, count: int = 15) -> List[Dict]:
        """Generate salary register test data"""
        salaries = []
        for i in range(count):
            basic_salary = random.randint(25000, 150000)
            hra = int(basic_salary * 0.4)
            da = int(basic_salary * 0.1)
            gross_salary = basic_salary + hra + da
            pf = int(gross_salary * 0.12)
            tds = int(gross_salary * 0.1) if gross_salary > 50000 else 0
            net_salary = gross_salary - pf - tds
            
            salary = {
                "employeeId": f"EMP{str(i+1).zfill(3)}",
                "employeeName": random.choice(self.employees),
                "month": random.choice(["2025-01", "2025-02", "2025-03"]),
                "basicSalary": basic_salary,
                "hra": hra,
                "da": da,
                "grossSalary": gross_salary,
                "pf": pf,
                "tds": tds,
                "netSalary": net_salary,
                "department": random.choice(["IT", "Finance", "HR", "Operations", "Sales"])
            }
            salaries.append(salary)
        return salaries

    def generate_bank_statement(self, count: int = 30) -> List[Dict]:
        """Generate bank statement test data"""
        transactions = []
        balance = 1000000  # Starting balance
        
        for i in range(count):
            transaction_type = random.choice(["credit", "debit"])
            amount = random.randint(5000, 200000)
            
            if transaction_type == "credit":
                balance += amount
            else:
                balance -= amount
                
            transaction = {
                "date": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
                "description": random.choice([
                    "Customer payment received",
                    "Vendor payment made",
                    "Salary payment",
                    "Rent payment",
                    "Utility bills",
                    "Tax payment",
                    "Interest received",
                    "Bank charges"
                ]),
                "transactionType": transaction_type,
                "amount": amount,
                "balance": balance,
                "referenceNumber": f"TXN{random.randint(100000, 999999)}"
            }
            transactions.append(transaction)
        return transactions

    def generate_gst_data(self) -> Dict:
        """Generate GST compliance test data"""
        return {
            "gstNumber": "29ABCDE1234F1Z5",
            "period": "2025-01",
            "totalSales": 5000000,
            "totalPurchases": 3000000,
            "outputGST": 900000,
            "inputGST": 540000,
            "netGST": 360000,
            "returns": {
                "gstr1_filed": True,
                "gstr3b_filed": True,
                "gstr2a_reconciled": False
            },
            "compliance_issues": [
                "Input tax credit mismatch in GSTR-2A",
                "Late filing of GSTR-3B for previous month"
            ]
        }

    def generate_tds_data(self) -> Dict:
        """Generate TDS compliance test data"""
        return {
            "tanNumber": "ABCD12345E",
            "quarter": "Q3_2025",
            "totalDeductions": 150000,
            "categories": {
                "salary": 80000,
                "professional_fees": 45000,
                "interest": 15000,
                "rent": 10000
            },
            "returns": {
                "tds_return_filed": True,
                "certificates_issued": True,
                "payment_made": True
            },
            "compliance_issues": [
                "TDS certificate pending for 2 vendors",
                "Quarterly return filing due in 5 days"
            ]
        }

    def generate_trial_balance(self) -> List[Dict]:
        """Generate trial balance test data"""
        accounts = []
        for code, name in self.account_codes.items():
            debit = random.randint(0, 1000000) if code in ["CASH", "RECEIVABLE", "INVENTORY", "FIXED_ASSETS", "SALARY", "RENT", "UTILITIES"] else 0
            credit = random.randint(0, 1000000) if code in ["PAYABLE", "SALES", "INTEREST"] else 0
            
            accounts.append({
                "accountCode": code,
                "accountName": name,
                "debitAmount": debit,
                "creditAmount": credit
            })
        return accounts

    def generate_journal_entries(self, count: int = 50) -> List[Dict]:
        """Generate journal entries test data"""
        entries = []
        for i in range(count):
            entry = {
                "journalId": f"JE-2025-{str(i+1).zfill(3)}",
                "date": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
                "accountCode": random.choice(list(self.account_codes.keys())),
                "accountName": random.choice(list(self.account_codes.values())),
                "debitAmount": random.randint(0, 100000),
                "creditAmount": random.randint(0, 100000),
                "narration": random.choice([
                    "Purchase of office supplies",
                    "Payment to vendor",
                    "Customer payment received",
                    "Salary payment",
                    "Rent payment",
                    "Utility bill payment",
                    "Interest received",
                    "Tax payment"
                ]),
                "entity": random.choice(self.companies),
                "documentRef": f"DOC-{random.randint(1000, 9999)}"
            }
            entries.append(entry)
        return entries

    def generate_user_scenarios(self) -> Dict:
        """Generate comprehensive user scenarios"""
        return {
            "new_user_onboarding": {
                "company_name": "Test Company Pvt Ltd",
                "industry": "Technology",
                "company_size": "50-100 employees",
                "annual_revenue": "5-10 crores",
                "primary_use_case": "Quarterly compliance",
                "expected_documents": ["vendor_invoices", "sales_register", "salary_register"]
            },
            "quarterly_closure_workflow": {
                "quarter": "Q3_2025",
                "documents_to_process": [
                    "vendor_invoices.xlsx",
                    "sales_register.xlsx", 
                    "salary_register.xlsx",
                    "bank_statement.xlsx",
                    "gst_documents.pdf",
                    "tds_documents.pdf"
                ],
                "expected_reports": ["trial_balance", "profit_loss", "balance_sheet"],
                "compliance_checks": ["gst_validation", "tds_validation", "audit_trail"]
            },
            "bulk_document_processing": {
                "document_count": 50,
                "file_types": ["xlsx", "pdf", "csv"],
                "processing_time_expected": "5-10 minutes",
                "ai_agents_involved": ["ClassifierBot", "DataExtractor", "JournalBot", "AuditAgent"]
            },
            "compliance_validation": {
                "gst_scenarios": ["valid_gst", "invalid_gst", "missing_gst"],
                "tds_scenarios": ["correct_tds", "incorrect_rate", "missing_deduction"],
                "audit_scenarios": ["clean_audit", "minor_issues", "major_discrepancies"]
            },
            "error_handling": {
                "file_errors": ["corrupted_file", "unsupported_format", "large_file"],
                "processing_errors": ["api_rate_limit", "network_timeout", "invalid_data"],
                "recovery_scenarios": ["auto_retry", "manual_intervention", "fallback_processing"]
            }
        }

    def create_excel_files(self):
        """Create Excel files for testing"""
        # Vendor Invoices
        vendor_data = self.generate_vendor_invoices(30)
        vendor_df = pd.DataFrame(vendor_data)
        vendor_df.to_excel("test_data/vendor_invoices_comprehensive.xlsx", index=False)
        
        # Sales Register
        sales_data = self.generate_sales_register(40)
        sales_df = pd.DataFrame(sales_data)
        sales_df.to_excel("test_data/sales_register_comprehensive.xlsx", index=False)
        
        # Salary Register
        salary_data = self.generate_salary_register(25)
        salary_df = pd.DataFrame(salary_data)
        salary_df.to_excel("test_data/salary_register_comprehensive.xlsx", index=False)
        
        # Bank Statement
        bank_data = self.generate_bank_statement(50)
        bank_df = pd.DataFrame(bank_data)
        bank_df.to_excel("test_data/bank_statement_comprehensive.xlsx", index=False)
        
        # Trial Balance
        trial_data = self.generate_trial_balance()
        trial_df = pd.DataFrame(trial_data)
        trial_df.to_excel("test_data/trial_balance_comprehensive.xlsx", index=False)

    def create_csv_files(self):
        """Create CSV files for testing"""
        # Journal Entries
        journal_data = self.generate_journal_entries(100)
        journal_df = pd.DataFrame(journal_data)
        journal_df.to_csv("test_data/journal_entries_comprehensive.csv", index=False)
        
        # Purchase Register
        purchase_data = []
        for i in range(35):
            purchase = {
                "purchaseId": f"PUR-2025-{str(i+1).zfill(3)}",
                "vendorName": random.choice(self.vendors),
                "purchaseDate": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
                "amount": random.randint(15000, 750000),
                "gstAmount": random.randint(1500, 75000),
                "description": "Raw materials and supplies"
            }
            purchase_data.append(purchase)
        
        purchase_df = pd.DataFrame(purchase_data)
        purchase_df.to_csv("test_data/purchase_register_comprehensive.csv", index=False)

    def create_test_scenarios_file(self):
        """Create comprehensive test scenarios file"""
        scenarios = {
            "user_workflows": self.generate_user_scenarios(),
            "performance_testing": {
                "concurrent_users": [1, 5, 10, 25, 50],
                "document_sizes": ["small (< 1MB)", "medium (1-10MB)", "large (10-50MB)"],
                "processing_volumes": [10, 50, 100, 500, 1000]
            },
            "edge_cases": {
                "data_quality": ["missing_values", "invalid_formats", "duplicate_entries"],
                "system_limits": ["max_file_size", "max_concurrent_processing", "rate_limiting"],
                "integration_failures": ["api_timeouts", "database_errors", "external_service_down"]
            },
            "compliance_scenarios": {
                "gst_compliance": self.generate_gst_data(),
                "tds_compliance": self.generate_tds_data(),
                "audit_requirements": {
                    "documentation": "complete",
                    "trail_completeness": "full",
                    "data_integrity": "verified"
                }
            }
        }
        
        with open("test_data/comprehensive_test_scenarios.json", "w") as f:
            json.dump(scenarios, f, indent=2)

    def generate_all_test_data(self):
        """Generate all test data files"""
        import os
        os.makedirs("test_data", exist_ok=True)
        
        print("🚀 Generating comprehensive test dataset...")
        
        # Create Excel files
        self.create_excel_files()
        print("✅ Excel files created")
        
        # Create CSV files
        self.create_csv_files()
        print("✅ CSV files created")
        
        # Create test scenarios
        self.create_test_scenarios_file()
        print("✅ Test scenarios file created")
        
        # Create summary report
        summary = {
            "generation_date": datetime.now().isoformat(),
            "files_created": [
                "vendor_invoices_comprehensive.xlsx (30 records)",
                "sales_register_comprehensive.xlsx (40 records)",
                "salary_register_comprehensive.xlsx (25 records)",
                "bank_statement_comprehensive.xlsx (50 records)",
                "trial_balance_comprehensive.xlsx (10 accounts)",
                "journal_entries_comprehensive.csv (100 records)",
                "purchase_register_comprehensive.csv (35 records)",
                "comprehensive_test_scenarios.json"
            ],
            "total_records": 290,
            "coverage": [
                "All document types supported",
                "All user workflows covered",
                "Performance testing scenarios",
                "Error handling cases",
                "Compliance validation data",
                "Edge cases and limits"
            ]
        }
        
        with open("test_data/dataset_summary.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        print("✅ Dataset summary created")
        print(f"📊 Total test records generated: {summary['total_records']}")
        print("🎯 All user scenarios covered!")

if __name__ == "__main__":
    generator = TestDatasetGenerator()
    generator.generate_all_test_data()