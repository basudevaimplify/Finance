import { storage } from '../storage';
import { anthropicService } from './anthropic';
import type { JournalEntry, Document } from '@shared/schema';

export interface ReconciliationMatch {
  id: string;
  entityA: string;
  entityB: string;
  transactionA: JournalEntry;
  transactionB: JournalEntry;
  matchScore: number;
  matchType: 'exact' | 'partial' | 'suspected';
  variance: number;
  variantReasons: string[];
  reconciliationDate: Date;
  status: 'matched' | 'unmatched' | 'disputed';
}

export interface IntercompanyTransaction {
  id: string;
  parentEntity: string;
  childEntity: string;
  transactionType: 'transfer' | 'loan' | 'service' | 'dividend' | 'expense_allocation';
  amount: number;
  currency: string;
  transactionDate: Date;
  description: string;
  documentIds: string[];
  isReconciled: boolean;
  reconciliationId?: string;
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

export interface ReconciliationReport {
  reportId: string;
  generatedAt: Date;
  period: string;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  disputedTransactions: number;
  totalVariance: number;
  reconciliationRate: number;
  matches: ReconciliationMatch[];
  unmatchedItems: JournalEntry[];
  recommendations: string[];
}

export class ReconciliationEngine {
  private reconciliationRules: ReconciliationRule[] = [
    {
      id: 'intercompany-transfers',
      name: 'Intercompany Transfers',
      description: 'Reconcile fund transfers between group entities',
      entityPairs: ['*'],
      accountCodes: ['INTER_RECEIVABLE', 'INTER_PAYABLE', 'CASH', 'BANK'],
      tolerancePercent: 0.01,
      toleranceAmount: 100,
      autoReconcile: true,
      priority: 1,
      isActive: true,
    },
    {
      id: 'intercompany-loans',
      name: 'Intercompany Loans',
      description: 'Reconcile loans between group entities',
      entityPairs: ['*'],
      accountCodes: ['LOAN_RECEIVABLE', 'LOAN_PAYABLE', 'INTEREST_INCOME', 'INTEREST_EXPENSE'],
      tolerancePercent: 0.05,
      toleranceAmount: 500,
      autoReconcile: false,
      priority: 2,
      isActive: true,
    },
    {
      id: 'service-charges',
      name: 'Intercompany Service Charges',
      description: 'Reconcile service charges between group entities',
      entityPairs: ['*'],
      accountCodes: ['SERVICE_INCOME', 'SERVICE_EXPENSE', 'MGMT_FEE_INCOME', 'MGMT_FEE_EXPENSE'],
      tolerancePercent: 0.02,
      toleranceAmount: 200,
      autoReconcile: false,
      priority: 3,
      isActive: true,
    },
    {
      id: 'expense-allocations',
      name: 'Expense Allocations',
      description: 'Reconcile allocated expenses between group entities',
      entityPairs: ['*'],
      accountCodes: ['ALLOCATION_INCOME', 'ALLOCATION_EXPENSE', 'SHARED_COST'],
      tolerancePercent: 0.03,
      toleranceAmount: 300,
      autoReconcile: false,
      priority: 4,
      isActive: true,
    },
  ];

  async performReconciliation(period: string, entityList?: string[]): Promise<ReconciliationReport> {
    try {
      console.log(`Starting reconciliation for period: ${period}`);
      
      // Get all journal entries for the period
      const journalEntries = await storage.getJournalEntriesByPeriod(period);
      
      // Filter by entities if specified
      const filteredEntries = entityList 
        ? journalEntries.filter(entry => entityList.includes(entry.entity))
        : journalEntries;

      // Group entries by entity
      const entitiesMap = this.groupEntriesByEntity(filteredEntries);
      
      // Identify intercompany transactions
      const intercompanyTransactions = await this.identifyIntercompanyTransactions(filteredEntries);
      
      // Perform matching algorithms
      const matches = await this.performMatching(entitiesMap, intercompanyTransactions);
      
      // Generate reconciliation report
      const report = await this.generateReconciliationReport(
        period,
        filteredEntries,
        matches,
        intercompanyTransactions
      );

      console.log(`Reconciliation completed. Found ${matches.length} matches`);
      return report;
      
    } catch (error) {
      console.error('Error in reconciliation:', error);
      throw error;
    }
  }

  private groupEntriesByEntity(entries: JournalEntry[]): Map<string, JournalEntry[]> {
    const entitiesMap = new Map<string, JournalEntry[]>();
    
    entries.forEach(entry => {
      if (!entitiesMap.has(entry.entity)) {
        entitiesMap.set(entry.entity, []);
      }
      entitiesMap.get(entry.entity)!.push(entry);
    });
    
    return entitiesMap;
  }

  private async identifyIntercompanyTransactions(entries: JournalEntry[]): Promise<IntercompanyTransaction[]> {
    const intercompanyTransactions: IntercompanyTransaction[] = [];
    
    // Group entries by potential intercompany indicators
    const intercompanyAccounts = ['INTER_RECEIVABLE', 'INTER_PAYABLE', 'LOAN_RECEIVABLE', 'LOAN_PAYABLE'];
    const intercompanyEntries = entries.filter(entry => 
      intercompanyAccounts.some(account => entry.accountCode.includes(account)) ||
      entry.narration.toLowerCase().includes('intercompany') ||
      entry.narration.toLowerCase().includes('inter-company')
    );

    // Use AI to identify complex intercompany patterns
    for (const entry of intercompanyEntries) {
      try {
        const analysis = await anthropicService.analyzeIntercompanyTransaction(entry);
        
        if (analysis.isIntercompany) {
          intercompanyTransactions.push({
            id: `IC_${entry.id}`,
            parentEntity: analysis.parentEntity || entry.entity,
            childEntity: analysis.counterpartyEntity || 'Unknown',
            transactionType: analysis.transactionType as any,
            amount: parseFloat(entry.debitAmount) || parseFloat(entry.creditAmount),
            currency: 'INR',
            transactionDate: new Date(entry.date),
            description: entry.narration,
            documentIds: entry.documentId ? [entry.documentId] : [],
            isReconciled: false,
          });
        }
      } catch (error) {
        console.error(`Error analyzing entry ${entry.id}:`, error);
        // Continue with other entries
      }
    }
    
    return intercompanyTransactions;
  }

  private async performMatching(
    entitiesMap: Map<string, JournalEntry[]>,
    intercompanyTransactions: IntercompanyTransaction[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    const entities = Array.from(entitiesMap.keys());
    
    // Compare each entity pair
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        const entriesA = entitiesMap.get(entityA)!;
        const entriesB = entitiesMap.get(entityB)!;
        
        // Apply matching algorithms
        const entityMatches = await this.matchEntitiesPair(entityA, entityB, entriesA, entriesB);
        matches.push(...entityMatches);
      }
    }
    
    return matches;
  }

  private async matchEntitiesPair(
    entityA: string,
    entityB: string,
    entriesA: JournalEntry[],
    entriesB: JournalEntry[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Apply each reconciliation rule
    for (const rule of this.reconciliationRules.filter(r => r.isActive)) {
      const ruleMatches = await this.applyReconciliationRule(rule, entityA, entityB, entriesA, entriesB);
      matches.push(...ruleMatches);
    }
    
    return matches;
  }

  private async applyReconciliationRule(
    rule: ReconciliationRule,
    entityA: string,
    entityB: string,
    entriesA: JournalEntry[],
    entriesB: JournalEntry[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Filter entries based on rule criteria
    const filteredA = entriesA.filter(entry => 
      rule.accountCodes.some(code => entry.accountCode.includes(code))
    );
    const filteredB = entriesB.filter(entry => 
      rule.accountCodes.some(code => entry.accountCode.includes(code))
    );
    
    // Algorithm 1: Exact Amount Matching
    const exactMatches = this.findExactMatches(filteredA, filteredB, rule);
    matches.push(...exactMatches.map(match => ({
      id: `${rule.id}_${match.entryA.id}_${match.entryB.id}`,
      entityA,
      entityB,
      transactionA: match.entryA,
      transactionB: match.entryB,
      matchScore: 1.0,
      matchType: 'exact' as const,
      variance: 0,
      variantReasons: [],
      reconciliationDate: new Date(),
      status: 'matched' as const,
    })));
    
    // Algorithm 2: Tolerance-based Matching
    const toleranceMatches = this.findToleranceMatches(filteredA, filteredB, rule);
    matches.push(...toleranceMatches.map(match => ({
      id: `${rule.id}_${match.entryA.id}_${match.entryB.id}`,
      entityA,
      entityB,
      transactionA: match.entryA,
      transactionB: match.entryB,
      matchScore: match.score,
      matchType: 'partial' as const,
      variance: match.variance,
      variantReasons: match.reasons,
      reconciliationDate: new Date(),
      status: 'matched' as const,
    })));
    
    // Algorithm 3: Pattern-based Matching using AI
    const patternMatches = await this.findPatternMatches(filteredA, filteredB, rule);
    matches.push(...patternMatches);
    
    return matches;
  }

  private findExactMatches(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): { entryA: JournalEntry; entryB: JournalEntry }[] {
    const matches: { entryA: JournalEntry; entryB: JournalEntry }[] = [];
    const usedIndicesB = new Set<number>();
    
    for (const entryA of entriesA) {
      const amountA = parseFloat(entryA.debitAmount) || parseFloat(entryA.creditAmount);
      
      for (let i = 0; i < entriesB.length; i++) {
        if (usedIndicesB.has(i)) continue;
        
        const entryB = entriesB[i];
        const amountB = parseFloat(entryB.debitAmount) || parseFloat(entryB.creditAmount);
        
        // Check for exact amount match (considering debit/credit reversal)
        if (Math.abs(amountA - amountB) < 0.01) {
          // Additional validation: date proximity, narration similarity
          if (this.isDateProximityValid(entryA.date, entryB.date, 7) &&
              this.isNarrationSimilar(entryA.narration, entryB.narration)) {
            matches.push({ entryA, entryB });
            usedIndicesB.add(i);
            break;
          }
        }
      }
    }
    
    return matches;
  }

  private findToleranceMatches(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): { entryA: JournalEntry; entryB: JournalEntry; score: number; variance: number; reasons: string[] }[] {
    const matches: { entryA: JournalEntry; entryB: JournalEntry; score: number; variance: number; reasons: string[] }[] = [];
    const usedIndicesB = new Set<number>();
    
    for (const entryA of entriesA) {
      const amountA = parseFloat(entryA.debitAmount) || parseFloat(entryA.creditAmount);
      
      for (let i = 0; i < entriesB.length; i++) {
        if (usedIndicesB.has(i)) continue;
        
        const entryB = entriesB[i];
        const amountB = parseFloat(entryB.debitAmount) || parseFloat(entryB.creditAmount);
        
        const variance = Math.abs(amountA - amountB);
        const percentageVariance = (variance / Math.max(amountA, amountB)) * 100;
        
        // Check if within tolerance
        if (variance <= rule.toleranceAmount && percentageVariance <= rule.tolerancePercent) {
          const score = this.calculateMatchScore(entryA, entryB, variance, percentageVariance);
          const reasons = this.getVarianceReasons(entryA, entryB, variance);
          
          if (score > 0.7) { // Minimum score threshold
            matches.push({ entryA, entryB, score, variance, reasons });
            usedIndicesB.add(i);
            break;
          }
        }
      }
    }
    
    return matches;
  }

  private async findPatternMatches(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Use AI to identify complex patterns
    try {
      const patternAnalysis = await anthropicService.analyzeReconciliationPatterns(entriesA, entriesB);
      
      for (const pattern of patternAnalysis.patterns) {
        if (pattern.confidence > 0.8) {
          matches.push({
            id: `pattern_${pattern.id}`,
            entityA: pattern.entityA,
            entityB: pattern.entityB,
            transactionA: pattern.transactionA,
            transactionB: pattern.transactionB,
            matchScore: pattern.confidence,
            matchType: 'suspected',
            variance: pattern.variance,
            variantReasons: pattern.reasons,
            reconciliationDate: new Date(),
            status: 'matched',
          });
        }
      }
    } catch (error) {
      console.error('Error in pattern matching:', error);
    }
    
    return matches;
  }

  private calculateMatchScore(
    entryA: JournalEntry,
    entryB: JournalEntry,
    variance: number,
    percentageVariance: number
  ): number {
    let score = 1.0;
    
    // Reduce score based on amount variance
    score -= (percentageVariance / 100) * 0.3;
    
    // Reduce score based on date difference
    const daysDiff = Math.abs(new Date(entryA.date).getTime() - new Date(entryB.date).getTime()) / (1000 * 60 * 60 * 24);
    score -= (daysDiff / 30) * 0.2;
    
    // Increase score for narration similarity
    const narrationSimilarity = this.calculateNarrationSimilarity(entryA.narration, entryB.narration);
    score += narrationSimilarity * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  private getVarianceReasons(entryA: JournalEntry, entryB: JournalEntry, variance: number): string[] {
    const reasons: string[] = [];
    
    if (variance > 0) {
      reasons.push(`Amount variance: ${variance.toFixed(2)}`);
    }
    
    const daysDiff = Math.abs(new Date(entryA.date).getTime() - new Date(entryB.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 1) {
      reasons.push(`Date difference: ${daysDiff.toFixed(0)} days`);
    }
    
    if (!this.isNarrationSimilar(entryA.narration, entryB.narration)) {
      reasons.push('Different transaction descriptions');
    }
    
    return reasons;
  }

  private isDateProximityValid(dateA: Date, dateB: Date, toleranceDays: number): boolean {
    const daysDiff = Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= toleranceDays;
  }

  private isNarrationSimilar(narrationA: string, narrationB: string): boolean {
    const similarity = this.calculateNarrationSimilarity(narrationA, narrationB);
    return similarity > 0.6;
  }

  private calculateNarrationSimilarity(narrationA: string, narrationB: string): number {
    // Simple similarity calculation - can be enhanced with better algorithms
    const wordsA = narrationA.toLowerCase().split(/\s+/);
    const wordsB = narrationB.toLowerCase().split(/\s+/);
    
    const commonWords = wordsA.filter(word => wordsB.includes(word));
    const totalWords = new Set([...wordsA, ...wordsB]).size;
    
    return commonWords.length / totalWords;
  }

  private async generateReconciliationReport(
    period: string,
    allEntries: JournalEntry[],
    matches: ReconciliationMatch[],
    intercompanyTransactions: IntercompanyTransaction[]
  ): Promise<ReconciliationReport> {
    const matchedEntryIds = new Set([
      ...matches.map(m => m.transactionA.id),
      ...matches.map(m => m.transactionB.id),
    ]);
    
    const unmatchedEntries = allEntries.filter(entry => !matchedEntryIds.has(entry.id));
    const totalVariance = matches.reduce((sum, match) => sum + match.variance, 0);
    
    const recommendations = await this.generateRecommendations(matches, unmatchedEntries);
    
    return {
      reportId: `REC_${Date.now()}`,
      generatedAt: new Date(),
      period,
      totalTransactions: allEntries.length,
      matchedTransactions: matches.length * 2, // Each match involves 2 transactions
      unmatchedTransactions: unmatchedEntries.length,
      disputedTransactions: matches.filter(m => m.status === 'disputed').length,
      totalVariance,
      reconciliationRate: (matches.length * 2) / allEntries.length,
      matches,
      unmatchedItems: unmatchedEntries,
      recommendations,
    };
  }

  private async generateRecommendations(
    matches: ReconciliationMatch[],
    unmatchedEntries: JournalEntry[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze high-variance matches
    const highVarianceMatches = matches.filter(m => m.variance > 1000);
    if (highVarianceMatches.length > 0) {
      recommendations.push(`Review ${highVarianceMatches.length} matches with high variance (>1000)`);
    }
    
    // Analyze unmatched entries
    const unmatchedIntercompany = unmatchedEntries.filter(entry => 
      entry.narration.toLowerCase().includes('intercompany') ||
      entry.accountCode.includes('INTER_')
    );
    
    if (unmatchedIntercompany.length > 0) {
      recommendations.push(`Investigate ${unmatchedIntercompany.length} unmatched intercompany entries`);
    }
    
    // Analyze reconciliation rate
    const reconRate = (matches.length * 2) / (matches.length * 2 + unmatchedEntries.length);
    if (reconRate < 0.8) {
      recommendations.push('Low reconciliation rate - consider reviewing matching rules');
    }
    
    return recommendations;
  }

  async getReconciliationRules(): Promise<ReconciliationRule[]> {
    return this.reconciliationRules;
  }

  async updateReconciliationRule(rule: ReconciliationRule): Promise<void> {
    const index = this.reconciliationRules.findIndex(r => r.id === rule.id);
    if (index !== -1) {
      this.reconciliationRules[index] = rule;
    } else {
      this.reconciliationRules.push(rule);
    }
  }

  async deleteReconciliationRule(ruleId: string): Promise<void> {
    this.reconciliationRules = this.reconciliationRules.filter(r => r.id !== ruleId);
  }
}

export const reconciliationEngine = new ReconciliationEngine();