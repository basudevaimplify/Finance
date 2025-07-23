import XLSX from 'xlsx';
import fs from 'fs';

export interface SalesRecord {
  invoiceNumber: string;
  date: string;
  customerName: string;
  gstin: string;
  itemDescription: string;
  quantity: number;
  rate: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  invoiceTotal: number;
}

export interface PurchaseRecord {
  invoiceNumber: string;
  date: string;
  vendorName: string;
  gstin: string;
  itemDescription: string;
  quantity: number;
  rate: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  invoiceTotal: number;
}

export interface SalesRegisterData {
  sales: SalesRecord[];
  totalSales: number;
  totalTaxableValue: number;
  totalGstAmount: number;
  totalInvoiceValue: number;
  recordCount: number;
}

export interface PurchaseRegisterData {
  purchases: PurchaseRecord[];
  totalPurchases: number;
  totalTaxableValue: number;
  totalGstAmount: number;
  totalInvoiceValue: number;
  recordCount: number;
}

export class SalesRegisterParser {
  static parseSalesRegister(filePath: string): SalesRegisterData {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Sales register file not found: ${filePath}`);
      }

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON objects
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      const sales: SalesRecord[] = rawData.map((row: any) => ({
        invoiceNumber: row['Invoice No'] || '',
        date: row['Date'] || '',
        customerName: row['Customer Name'] || '',
        gstin: row['GSTIN'] || '',
        itemDescription: row['Item Description'] || '',
        quantity: Number(row['Quantity']) || 0,
        rate: Number(row['Rate']) || 0,
        taxableValue: Number(row['Taxable Value']) || 0,
        gstRate: Number(row['GST Rate (%)']) || 0,
        gstAmount: Number(row['GST Amount']) || 0,
        invoiceTotal: Number(row['Invoice Total']) || 0
      }));

      // Calculate totals
      const totalTaxableValue = sales.reduce((sum, sale) => sum + sale.taxableValue, 0);
      const totalGstAmount = sales.reduce((sum, sale) => sum + sale.gstAmount, 0);
      const totalInvoiceValue = sales.reduce((sum, sale) => sum + sale.invoiceTotal, 0);

      return {
        sales,
        totalSales: sales.length,
        totalTaxableValue,
        totalGstAmount,
        totalInvoiceValue,
        recordCount: sales.length
      };
    } catch (error) {
      console.error('Error parsing sales register:', error);
      throw error;
    }
  }
}

export class PurchaseRegisterParser {
  static parsePurchaseRegister(filePath: string): PurchaseRegisterData {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Purchase register file not found: ${filePath}`);
      }

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON objects
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      const purchases: PurchaseRecord[] = rawData.map((row: any) => ({
        invoiceNumber: row['Invoice No'] || '',
        date: row['Date'] || '',
        vendorName: row['Vendor Name'] || '',
        gstin: row['GSTIN'] || '',
        itemDescription: row['Item Description'] || '',
        quantity: Number(row['Quantity']) || 0,
        rate: Number(row['Rate']) || 0,
        taxableValue: Number(row['Taxable Value']) || 0,
        gstRate: Number(row['GST Rate (%)']) || 0,
        gstAmount: Number(row['GST Amount']) || 0,
        invoiceTotal: Number(row['Invoice Total']) || 0
      }));

      // Calculate totals
      const totalTaxableValue = purchases.reduce((sum, purchase) => sum + purchase.taxableValue, 0);
      const totalGstAmount = purchases.reduce((sum, purchase) => sum + purchase.gstAmount, 0);
      const totalInvoiceValue = purchases.reduce((sum, purchase) => sum + purchase.invoiceTotal, 0);

      return {
        purchases,
        totalPurchases: purchases.length,
        totalTaxableValue,
        totalGstAmount,
        totalInvoiceValue,
        recordCount: purchases.length
      };
    } catch (error) {
      console.error('Error parsing purchase register:', error);
      throw error;
    }
  }
}
