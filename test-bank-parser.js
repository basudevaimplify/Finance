// Test script to debug bank statement parser
import { bankStatementParser } from './server/services/bankStatementParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBankStatementParser() {
  try {
    const filePath = path.join(process.cwd(), 'uploads', 'd2GwSTD7fz5CakIBIsewL_bank_statement_q1_2025.pdf');
    console.log('Testing bank statement parser with file:', filePath);
    
    const result = await bankStatementParser.parseBankStatement(filePath);
    console.log('Parsing result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log(`Extracted ${result.transactions.length} transactions`);
    
    // Print the first few transactions
    if (result.transactions.length > 0) {
      console.log('Sample transactions:');
      result.transactions.slice(0, 5).forEach((tx, i) => {
        console.log(`Transaction ${i+1}:`, JSON.stringify(tx, null, 2));
      });
    }
  } catch (error) {
    console.error('Error testing bank statement parser:', error);
  }
}

testBankStatementParser();
