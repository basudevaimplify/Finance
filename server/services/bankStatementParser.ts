import { fileProcessorService } from './fileProcessor';

export interface BankTransaction {
  date: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface BankStatementData {
  accountHolder?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  branch?: string;
  statementPeriod?: string;
  transactions: BankTransaction[];
  openingBalance?: number;
  closingBalance?: number;
  totalCredits?: number;
  totalDebits?: number;
}

export class BankStatementParser {
  
  async parseBankStatement(filePath: string): Promise<BankStatementData> {
    try {
      // Extract text content from PDF
      const content = await fileProcessorService.extractTextContent(filePath);
      console.log('Bank statement content extracted, length:', content.length);
      
      // Parse the content to extract structured data
      return this.parseTextContent(content);
    } catch (error) {
      console.error('Error parsing bank statement:', error);
      throw new Error(`Failed to parse bank statement: ${error.message}`);
    }
  }

  private parseTextContent(content: string): BankStatementData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const result: BankStatementData = {
      transactions: [],
    };

    // Extract header information
    this.extractHeaderInfo(lines, result);
    
    // Extract transactions
    this.extractTransactions(lines, result);
    
    // Calculate totals
    this.calculateTotals(result);
    
    console.log(`Parsed ${result.transactions.length} transactions from bank statement`);
    return result;
  }

  private extractHeaderInfo(lines: string[], result: BankStatementData): void {
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];
      
      if (line.includes('Account Holder:') && i + 1 < lines.length) {
        result.accountHolder = lines[i + 1];
      } else if (line.includes('Account Number:') && i + 1 < lines.length) {
        result.accountNumber = lines[i + 1];
      } else if (line.includes('Bank Name:') && i + 1 < lines.length) {
        result.bankName = lines[i + 1];
      } else if (line.includes('IFSC Code:') && i + 1 < lines.length) {
        result.ifscCode = lines[i + 1];
      } else if (line.includes('Branch:') && i + 1 < lines.length) {
        result.branch = lines[i + 1];
      }
    }
  }

  private extractTransactions(lines: string[], result: BankStatementData): void {
    let inTransactionSection = false;
    let currentTransaction: Partial<BankTransaction> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect start of transaction section
      if (line.includes('Date') && line.includes('Description') && (line.includes('Credit') || line.includes('Debit'))) {
        inTransactionSection = true;
        continue;
      }
      
      if (!inTransactionSection) continue;
      
      // Try to parse date (DD-MM-YYYY format)
      const dateMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
      if (dateMatch) {
        // If we have a previous transaction, save it
        if (currentTransaction.date) {
          this.finalizeTransaction(currentTransaction, result);
        }
        
        // Start new transaction
        currentTransaction = {
          date: this.convertDateFormat(dateMatch[1]),
          description: '',
          debit: 0,
          credit: 0,
          balance: 0
        };
        
        // Extract description from the same line (after date)
        const afterDate = line.substring(line.indexOf(dateMatch[1]) + dateMatch[1].length).trim();
        if (afterDate) {
          currentTransaction.description = afterDate;
        }
        continue;
      }
      
      // If we have a current transaction, try to extract amounts
      if (currentTransaction.date) {
        // Look for amount patterns (Rs. followed by numbers)
        const amountMatches = line.match(/Rs\.\s*([\d,]+\.?\d*)/g);
        if (amountMatches && amountMatches.length > 0) {
          const amounts = amountMatches.map(match => {
            const numStr = match.replace(/Rs\.\s*/, '').replace(/,/g, '');
            return parseFloat(numStr) || 0;
          });
          
          // Determine if this is credit, debit, or balance based on context
          if (amounts.length === 1) {
            // Single amount - could be credit, debit, or balance
            if (line.toLowerCase().includes('credit') || currentTransaction.credit === 0) {
              currentTransaction.credit = amounts[0];
            } else if (line.toLowerCase().includes('debit') || currentTransaction.debit === 0) {
              currentTransaction.debit = amounts[0];
            } else {
              currentTransaction.balance = amounts[0];
            }
          } else if (amounts.length === 2) {
            // Two amounts - likely credit/debit and balance, or debit and balance
            if (currentTransaction.credit === 0 && currentTransaction.debit === 0) {
              // First amount is transaction amount, second is balance
              if (line.toLowerCase().includes('credit')) {
                currentTransaction.credit = amounts[0];
              } else {
                currentTransaction.debit = amounts[0];
              }
              currentTransaction.balance = amounts[1];
            } else {
              // Update balance
              currentTransaction.balance = amounts[amounts.length - 1];
            }
          }
        }
        
        // If line doesn't have amounts but has text, add to description
        if (!amountMatches && line.length > 0 && !line.match(/^\d/) && currentTransaction.description) {
          currentTransaction.description += ' ' + line;
        }
      }
    }
    
    // Don't forget the last transaction
    if (currentTransaction.date) {
      this.finalizeTransaction(currentTransaction, result);
    }
  }

  private finalizeTransaction(transaction: Partial<BankTransaction>, result: BankStatementData): void {
    if (transaction.date && transaction.description) {
      result.transactions.push({
        date: transaction.date,
        description: transaction.description.trim(),
        reference: transaction.reference || '',
        debit: transaction.debit || 0,
        credit: transaction.credit || 0,
        balance: transaction.balance || 0
      });
    }
  }

  private convertDateFormat(dateStr: string): string {
    // Convert DD-MM-YYYY to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  private calculateTotals(result: BankStatementData): void {
    result.totalCredits = result.transactions.reduce((sum, t) => sum + t.credit, 0);
    result.totalDebits = result.transactions.reduce((sum, t) => sum + t.debit, 0);
    
    if (result.transactions.length > 0) {
      result.openingBalance = result.transactions[0].balance - result.transactions[0].credit + result.transactions[0].debit;
      result.closingBalance = result.transactions[result.transactions.length - 1].balance;
    }
  }
}

export const bankStatementParser = new BankStatementParser();
