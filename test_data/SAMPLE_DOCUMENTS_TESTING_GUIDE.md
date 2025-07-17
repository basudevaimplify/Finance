# Sample Primary Documents Testing Guide

## Overview
This guide provides authentic sample primary documents for testing the QRT Closure Agent Platform document upload and processing workflows.

## Available Sample Documents

### 1. Vendor Invoices (`sample_vendor_invoices.csv`)
**Purpose**: Test vendor invoice processing and accounts payable workflows
**Contents**: 
- 10 realistic vendor invoices with GST details
- Various categories: Office supplies, IT services, utilities, professional services
- Indian GST numbers and compliance data
- Payment terms and due dates

**Testing Scenarios**:
- Upload and classify vendor invoices
- Test GST validation workflows
- Generate journal entries from invoice data
- Validate accounts payable processing

### 2. Sales Register (`sample_sales_register.csv`)
**Purpose**: Test sales transaction processing and accounts receivable workflows
**Contents**:
- 10 sales transactions with customer details
- GST calculations (CGST, SGST, IGST)
- Various GST rates (5%, 12%, 18%)
- Payment status tracking
- Different industries: Manufacturing, retail, services

**Testing Scenarios**:
- Process sales transactions
- Validate GST calculations
- Test revenue recognition
- Generate customer statements

### 3. Bank Statements (`sample_bank_statements.csv`)
**Purpose**: Test bank reconciliation and cash flow analysis
**Contents**:
- 18 bank transactions from December 2024
- Debits and credits with running balance
- Transaction references matching invoices
- Bank charges and interest income
- ICICI Bank format simulation

**Testing Scenarios**:
- Bank reconciliation workflows
- Cash flow statement generation
- Transaction matching with invoices
- Balance verification

### 4. Salary Register (`sample_salary_register.csv`)
**Purpose**: Test payroll processing and employee cost analysis
**Contents**:
- 15 employee salary records
- Complete salary structure: Basic, HRA, allowances
- Statutory deductions: PF, ESI, TDS
- Various departments and designations
- December 2024 payroll data

**Testing Scenarios**:
- Payroll processing workflows
- TDS calculations for salaries
- Employee cost analysis
- Statutory compliance reporting

### 5. Fixed Asset Register (`sample_fixed_asset_register.csv`)
**Purpose**: Test fixed asset management and depreciation calculations
**Contents**:
- 10 fixed assets across categories
- Buildings, machinery, IT equipment, vehicles
- Purchase dates, costs, depreciation methods
- Accumulated depreciation and net book values
- Asset locations and vendors

**Testing Scenarios**:
- Asset depreciation calculations
- Asset tracking and management
- Depreciation schedule generation
- Asset disposal workflows

### 6. TDS Certificates (`sample_tds_certificates.csv`)
**Purpose**: Test TDS compliance and certificate management
**Contents**:
- 10 TDS certificates for different sections
- Professional services TDS (194C)
- Salary TDS (192)
- Legal and transport services TDS
- Quarter-wise TDS data
- PAN and certificate details

**Testing Scenarios**:
- TDS compliance validation
- Form 26Q generation
- TDS reconciliation
- Certificate tracking

## Testing Workflows

### Primary Document Upload Flow
1. **Navigate to Document Upload**: Go to `/document-upload` page
2. **Select Document Type**: Choose from the requirements table
3. **Upload Sample File**: Use the provided CSV files
4. **Verify Classification**: Check if AI correctly identifies document type
5. **Review Processing**: Monitor document status changes
6. **Test Actions**: Use action buttons (View, Edit, Generate, etc.)

### Derived Document Generation Flow
1. **Upload Prerequisites**: Ensure required primary documents are uploaded
2. **Generate Journal Entries**: Click "Generate" for journal entries
3. **Create Trial Balance**: Generate from journal entries
4. **Compliance Documents**: Generate GSTR-2A, GSTR-3B, Form 26Q
5. **Bank Reconciliation**: Generate from bank statements + journal entries

### Calculated Document Flow
1. **Prerequisites**: Ensure all derived documents are generated
2. **Generate Reports**: Click "Calculate" for financial statements
3. **P&L Statement**: Auto-calculated from trial balance
4. **Balance Sheet**: Generated from asset and liability data
5. **Cash Flow Statement**: Calculated from bank and transaction data
6. **Depreciation Schedule**: Generated from fixed asset register

## Data Authenticity Features

### Indian Compliance Standards
- **GST Numbers**: Valid format GST identification numbers
- **TDS Sections**: Correct TDS section codes (192, 194C, 194J)
- **PAN Numbers**: Valid PAN format for individuals and entities
- **Banking**: Realistic Indian bank transaction formats

### Business Logic Accuracy
- **Accounting Entries**: Proper debit/credit relationships
- **Tax Calculations**: Accurate GST and TDS computations
- **Payroll Structure**: Standard Indian salary components
- **Asset Depreciation**: Correct depreciation methods and rates

## Testing Best Practices

### 1. Sequential Testing
- Start with primary documents in dependency order
- Test derived document generation after primary uploads
- Verify calculated documents last

### 2. Error Scenario Testing
- Try uploading invalid file formats
- Test with missing required fields
- Verify validation error messages

### 3. Integration Testing
- Test complete end-to-end workflows
- Verify data consistency across documents
- Check audit trail functionality

### 4. Compliance Testing
- Validate GST calculations and formats
- Test TDS compliance workflows
- Verify statutory reporting accuracy

## File Download Instructions

1. **Access Files**: All sample files are in the `test_data/` directory
2. **Download Format**: Files are in CSV format for easy testing
3. **File Size**: Each file is optimized for quick upload and processing
4. **Backup**: Keep original files for repeated testing

## Expected System Behavior

### Upload Processing
- Files should be classified automatically
- Processing status should update in real-time
- Error messages should be clear and actionable

### Document Generation
- Derived documents should generate when dependencies are met
- Generated files should be downloadable
- Audit trail should track all generation activities

### Data Validation
- GST numbers should be validated
- TDS calculations should be verified
- Balance sheet should balance
- Cash flow should reconcile

## Support and Troubleshooting

### Common Issues
- **Upload Failures**: Check file format and size limits
- **Classification Errors**: Verify file content matches expected format
- **Generation Failures**: Ensure all prerequisite documents are uploaded

### Success Indicators
- Documents show "Complete" status
- Generated files are downloadable
- Financial statements balance correctly
- Audit trail shows all activities

This comprehensive testing suite ensures the QRT Closure Agent Platform handles real-world Indian financial document processing scenarios effectively.