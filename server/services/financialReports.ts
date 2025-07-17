import type { JournalEntry, FinancialStatement } from '@shared/schema';

export interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
  entity?: string;
  narration?: string;
}

export interface ProfitLossEntry {
  accountCode: string;
  accountName: string;
  amount: number;
  type: 'revenue' | 'expense';
}

export interface BalanceSheetEntry {
  accountCode: string;
  accountName: string;
  amount: number;
  type: 'asset' | 'liability' | 'equity';
  subType: string;
}

export interface CashFlowEntry {
  description: string;
  amount: number;
  type: 'operating' | 'investing' | 'financing';
}

export class FinancialReportsService {
  async generateTrialBalance(journalEntries: JournalEntry[]): Promise<{
    entries: TrialBalanceEntry[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }> {
    // Group entries by entity/vendor/customer name for detailed subsidiary ledger
    const entityBalances = new Map<string, {
      accountCode: string;
      accountName: string;
      entity: string;
      debitTotal: number;
      creditTotal: number;
      narration: string;
    }>();

    // Process each journal entry to create detailed subsidiary accounts
    for (const entry of journalEntries) {
      // Create a unique key combining account code and entity for detailed breakdown
      const entityKey = `${entry.accountCode}-${entry.entity}`;
      
      const current = entityBalances.get(entityKey) || {
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        entity: entry.entity || 'Unknown',
        debitTotal: 0,
        creditTotal: 0,
        narration: entry.narration || '',
      };

      current.debitTotal += parseFloat(entry.debitAmount?.toString() || '0');
      current.creditTotal += parseFloat(entry.creditAmount?.toString() || '0');

      entityBalances.set(entityKey, current);
    }

    // Convert to trial balance format with detailed breakdown
    const entries: TrialBalanceEntry[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    for (const [, balance] of entityBalances) {
      const netDebit = Math.max(0, balance.debitTotal - balance.creditTotal);
      const netCredit = Math.max(0, balance.creditTotal - balance.debitTotal);

      // Only include entries with non-zero balances
      if (netDebit > 0 || netCredit > 0) {
        entries.push({
          accountCode: balance.accountCode,
          accountName: balance.entity, // Use entity name as account name for detailed view
          debitBalance: netDebit,
          creditBalance: netCredit,
          entity: balance.entity,
          narration: balance.narration,
        });

        totalDebits += netDebit;
        totalCredits += netCredit;
      }
    }

    // Sort by entity name for better readability
    entries.sort((a, b) => (a.entity || '').localeCompare(b.entity || ''));

    return {
      entries,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }

  async generateProfitLoss(journalEntries: JournalEntry[]): Promise<{
    revenue: ProfitLossEntry[];
    expenses: ProfitLossEntry[];
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }> {
    const revenue: ProfitLossEntry[] = [];
    const expenses: ProfitLossEntry[] = [];

    // Group entries by account code first to calculate net balances
    const accountBalances = new Map<string, {
      accountName: string;
      totalDebits: number;
      totalCredits: number;
    }>();

    for (const entry of journalEntries) {
      const code = entry.accountCode;
      const current = accountBalances.get(code) || {
        accountName: entry.accountName,
        totalDebits: 0,
        totalCredits: 0,
      };
      
      current.totalDebits += parseFloat(entry.debitAmount?.toString() || '0');
      current.totalCredits += parseFloat(entry.creditAmount?.toString() || '0');
      
      accountBalances.set(code, current);
    }

    let totalRevenue = 0;
    let totalExpenses = 0;

    // Process each account based on account code ranges
    for (const [code, balance] of accountBalances) {
      if (code.startsWith('4')) {
        // Revenue accounts (4xxx) - normal credit balance
        // Revenue = credit balance, so we use totalCredits for revenue accounts
        const amount = balance.totalCredits;
        if (amount > 0) {
          revenue.push({
            accountCode: code,
            accountName: balance.accountName,
            amount: amount,
            type: 'revenue'
          });
          totalRevenue += amount;
        }
      } else if (code.startsWith('5')) {
        // Expense accounts (5xxx) - ALL are expenses regardless of debit/credit balance
        // Use the higher of totalDebits or totalCredits to capture the actual expense amount
        const amount = Math.max(balance.totalDebits, balance.totalCredits);
        if (amount > 0) {
          expenses.push({
            accountCode: code,
            accountName: balance.accountName,
            amount: amount,
            type: 'expense'
          });
          totalExpenses += amount;
        }
      }
    }

    // Sort entries
    revenue.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    expenses.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }

  async generateBalanceSheet(journalEntries: JournalEntry[]): Promise<{
    assets: BalanceSheetEntry[];
    liabilities: BalanceSheetEntry[];
    equity: BalanceSheetEntry[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    isBalanced: boolean;
  }> {
    const assets: BalanceSheetEntry[] = [];
    const liabilities: BalanceSheetEntry[] = [];
    const equity: BalanceSheetEntry[] = [];

    // Group entries by account
    const accountTotals = new Map<string, {
      accountName: string;
      netAmount: number;
    }>();

    for (const entry of journalEntries) {
      const key = entry.accountCode;
      const current = accountTotals.get(key) || {
        accountName: entry.accountName,
        netAmount: 0,
      };

      const debit = parseFloat(entry.debitAmount?.toString() || '0');
      const credit = parseFloat(entry.creditAmount?.toString() || '0');
      
      // For balance sheet, assets have debit balances, liabilities and equity have credit balances
      current.netAmount += (debit - credit);

      accountTotals.set(key, current);
    }

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const [accountCode, total] of accountTotals) {
      const classification = this.classifyBalanceSheetAccount(accountCode);
      const isMiscAccount = this.isMiscAccount(accountCode);
      
      // Skip accounts that don't belong in balance sheet (revenue and expense accounts)
      if (classification === null) {
        continue;
      }
      
      if (isMiscAccount && total.netAmount === 0) {
        // For MISC accounts that balance to zero, create a balanced entry
        const accountEntries = journalEntries.filter(entry => entry.accountCode === accountCode);
        const totalDebits = accountEntries.reduce((sum, entry) => sum + parseFloat(entry.debitAmount?.toString() || '0'), 0);
        const totalCredits = accountEntries.reduce((sum, entry) => sum + parseFloat(entry.creditAmount?.toString() || '0'), 0);
        
        // Show the total amount as current assets (since debits = credits)
        if (totalDebits > 0) {
          const entry: BalanceSheetEntry = {
            accountCode,
            accountName: total.accountName,
            amount: totalDebits,
            type: 'asset',
            subType: 'current',
          };
          assets.push(entry);
          totalAssets += totalDebits;
        }
      } else if (classification.type === 'asset' && total.netAmount > 0) {
        const entry: BalanceSheetEntry = {
          accountCode,
          accountName: total.accountName,
          amount: total.netAmount,
          type: 'asset',
          subType: classification.subType,
        };
        assets.push(entry);
        totalAssets += total.netAmount;
      } else if (classification.type === 'liability' && total.netAmount < 0) {
        const entry: BalanceSheetEntry = {
          accountCode,
          accountName: total.accountName,
          amount: Math.abs(total.netAmount),
          type: 'liability',
          subType: classification.subType,
        };
        liabilities.push(entry);
        totalLiabilities += Math.abs(total.netAmount);
      } else if (classification.type === 'equity' && total.netAmount < 0) {
        const entry: BalanceSheetEntry = {
          accountCode,
          accountName: total.accountName,
          amount: Math.abs(total.netAmount),
          type: 'equity',
          subType: classification.subType,
        };
        equity.push(entry);
        totalEquity += Math.abs(total.netAmount);
      }
    }

    // Sort entries by account code
    assets.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    liabilities.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    equity.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  async generateCashFlow(journalEntries: JournalEntry[]): Promise<{
    operating: CashFlowEntry[];
    investing: CashFlowEntry[];
    financing: CashFlowEntry[];
    netCashFlow: number;
  }> {
    const operating: CashFlowEntry[] = [];
    const investing: CashFlowEntry[] = [];
    const financing: CashFlowEntry[] = [];

    // Filter cash-related entries
    const cashEntries = journalEntries.filter(entry => 
      this.isCashAccount(entry.accountCode)
    );

    for (const entry of cashEntries) {
      const debit = parseFloat(entry.debitAmount?.toString() || '0');
      const credit = parseFloat(entry.creditAmount?.toString() || '0');
      const netCashFlow = debit - credit;

      if (netCashFlow !== 0) {
        const classification = this.classifyCashFlowActivity(entry.accountCode, entry.narration);
        
        const cashFlowEntry: CashFlowEntry = {
          description: entry.narration || entry.accountName,
          amount: netCashFlow,
          type: classification,
        };

        switch (classification) {
          case 'operating':
            operating.push(cashFlowEntry);
            break;
          case 'investing':
            investing.push(cashFlowEntry);
            break;
          case 'financing':
            financing.push(cashFlowEntry);
            break;
        }
      }
    }

    const netCashFlow = [...operating, ...investing, ...financing]
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      operating,
      investing,
      financing,
      netCashFlow,
    };
  }

  private isRevenueAccount(accountCode: string): boolean {
    // Common revenue account code patterns
    const revenuePatterns = [
      /^4\d{3}/, // 4000 series
      /^5[0-4]\d{2}/, // 5000-5499 series
      /^SALES/i,
      /^REVENUE/i,
      /^INCOME/i,
    ];

    return revenuePatterns.some(pattern => pattern.test(accountCode));
  }

  private isExpenseAccount(accountCode: string): boolean {
    // Common expense account code patterns
    const expensePatterns = [
      /^6\d{3}/, // 6000 series
      /^7\d{3}/, // 7000 series
      /^EXPENSE/i,
      /^COST/i,
      /^SALARY/i,
      /^RENT/i,
    ];

    return expensePatterns.some(pattern => pattern.test(accountCode));
  }

  private isMiscAccount(accountCode: string): boolean {
    return /^MISC/i.test(accountCode);
  }

  private classifyBalanceSheetAccount(accountCode: string): { type: 'asset' | 'liability' | 'equity'; subType: string } | null {
    // Asset accounts
    if (/^1\d{3}/.test(accountCode) || /^CASH|BANK|INVENTORY|RECEIVABLE/i.test(accountCode)) {
      if (/^1[0-1]\d{2}/.test(accountCode) || /^CASH|BANK/i.test(accountCode)) {
        return { type: 'asset', subType: 'current' };
      }
      return { type: 'asset', subType: 'fixed' };
    }

    // Liability accounts
    if (/^2\d{3}/.test(accountCode) || /^PAYABLE|LOAN|CREDITOR/i.test(accountCode)) {
      if (/^2[0-1]\d{2}/.test(accountCode) || /^PAYABLE|CREDITOR/i.test(accountCode)) {
        return { type: 'liability', subType: 'current' };
      }
      return { type: 'liability', subType: 'long_term' };
    }

    // Equity accounts
    if (/^3\d{3}/.test(accountCode) || /^CAPITAL|RETAINED|EQUITY/i.test(accountCode)) {
      return { type: 'equity', subType: 'owners_equity' };
    }

    // MISC accounts default to current assets
    if (/^MISC/i.test(accountCode)) {
      return { type: 'asset', subType: 'current' };
    }

    // Revenue accounts (4xxx) and Expense accounts (5xxx) do NOT belong in balance sheet
    if (/^[45]\d{3}/.test(accountCode)) {
      return null; // Exclude these from balance sheet
    }

    // Default classification for unknown accounts
    return { type: 'asset', subType: 'other' };
  }

  private isCashAccount(accountCode: string): boolean {
    const cashPatterns = [
      /^1[0-1]\d{2}/, // Cash and bank accounts
      /^CASH/i,
      /^BANK/i,
      /^PETTY.*CASH/i,
    ];

    return cashPatterns.some(pattern => pattern.test(accountCode));
  }

  private classifyCashFlowActivity(accountCode: string, narration?: string): 'operating' | 'investing' | 'financing' {
    // Operating activities
    if (/SALES|PURCHASE|SALARY|RENT|UTILITIES|OPERATING/i.test(narration || '')) {
      return 'operating';
    }

    // Investing activities
    if (/ASSET|INVESTMENT|EQUIPMENT|PROPERTY|PURCHASE.*FIXED/i.test(narration || '')) {
      return 'investing';
    }

    // Financing activities
    if (/LOAN|CAPITAL|DIVIDEND|SHARE|BORROWING/i.test(narration || '')) {
      return 'financing';
    }

    // Default to operating
    return 'operating';
  }
}

export const financialReportsService = new FinancialReportsService();
