import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Function to examine Excel file structure
function examineExcelFile(filePath, fileName) {
  console.log(`\n=== Examining ${fileName} ===`);
  
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get sheet names
    console.log('Sheet names:', workbook.SheetNames);
    
    // Examine each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to see the data structure
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('Number of rows:', jsonData.length);
      
      // Show first few rows to understand structure
      console.log('First 10 rows:');
      jsonData.slice(0, 10).forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
      
      // Also show as objects to understand headers
      if (jsonData.length > 1) {
        console.log('\nAs objects (first 3 records):');
        const objectData = XLSX.utils.sheet_to_json(worksheet);
        objectData.slice(0, 3).forEach((record, index) => {
          console.log(`Record ${index + 1}:`, record);
        });
      }
    });
    
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error.message);
  }
}

// Examine both Excel files
const salesRegisterPath = 'uploads/al9xPCQYfWoW11UAEaU8-_sales_register_q1_2025.xlsx';
const purchaseRegisterPath = 'uploads/r1V1YrSFEiai5nblhVyYK_purchase_register_q1_2025 (1).xlsx';

if (fs.existsSync(salesRegisterPath)) {
  examineExcelFile(salesRegisterPath, 'Sales Register');
} else {
  console.log('Sales Register file not found');
}

if (fs.existsSync(purchaseRegisterPath)) {
  examineExcelFile(purchaseRegisterPath, 'Purchase Register');
} else {
  console.log('Purchase Register file not found');
}
