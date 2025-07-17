export interface JournalEntry {
  id: string;
  journalId: string;
  date: string;
  accountCode: string;
  accountName: string;
  debitAmount: string;
  creditAmount: string;
  narration: string;
  entity: string;
  documentId?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  entityPairs: string[];
  accountCodes: string[];
  tolerancePercent: number;
  toleranceAmount: number;
  autoReconcile: boolean;
  priority: number;
  isActive: boolean;
}

export interface ReconciliationMatch {
  id: string;
  entityA: string;
  entityB: string;
  transactionA: JournalEntry;
  transactionB: JournalEntry;
  matchScore: number;
  matchType: 'exact' | 'partial' | 'pattern' | 'suspected' | 'multi-leg';
  variance: number;
  variantReasons: string[];
  reconciliationDate: Date;
  status: 'matched' | 'disputed' | 'unmatched';
  ruleId?: string;
}

export interface IntercompanyTransaction {
  id: string;
  parentEntity: string;
  childEntity: string;
  transactionType: 'loan' | 'transfer' | 'service' | 'allocation' | 'other';
  amount: number;
  currency: string;
  transactionDate: Date;
  description: string;
  documentIds: string[];
  isReconciled: boolean;
  reconciliationId?: string;
}

export interface ReconciliationReport {
  id?: string;
  period: string;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  disputedTransactions: number;
  totalVariance: number;
  reconciliationRate: number;
  recommendations: string[];
  matches?: ReconciliationMatch[];
  insights?: string[];
  riskAreas?: string[];
  dataQualityIssues?: string[];
  adjustments?: ReconciliationAdjustment[];
  algorithmType?: 'standard' | 'advanced';
  timestamp?: Date;
  createdBy?: string;
  createdAt?: Date;
}

export interface ReconciliationAdjustment {
  entityA: string;
  entityB: string;
  adjustmentType: 'timing' | 'rounding' | 'currency' | 'allocation' | 'other';
  amount: number;
  description: string;
  journalEntries: {
    entity: string;
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
    narration: string;
  }[];
}

export interface ReconciliationDashboard {
  totalRules: number;
  activeRules: number;
  lastRunDate: string;
  reconciliationRate: number;
  totalVariance: number;
  riskTransactions: number;
  recentMatches: ReconciliationMatch[];
  trendData: {
    period: string;
    rate: number;
    variance: number;
  }[];
}