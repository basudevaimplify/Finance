import { ReconciliationEngine } from './reconciliationEngine';
import { JournalEntry, ReconciliationMatch, ReconciliationRule, IntercompanyTransaction } from '../types/reconciliation';
import { storage } from '../storage';
import { openaiService } from './openaiService';

/**
 * Advanced Reconciliation Engine with sophisticated algorithms
 * for complex intercompany transactions
 */
export class AdvancedReconciliationEngine extends ReconciliationEngine {
  
  /**
   * Advanced fuzzy matching algorithm using multiple criteria
   * Scores matches based on amount, date, narration, and entity relationships
   */
  async performFuzzyMatching(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    const scoredMatches: Array<{
      entryA: JournalEntry;
      entryB: JournalEntry;
      score: number;
      components: FuzzyMatchComponents;
    }> = [];

    // Calculate fuzzy scores for all possible pairs
    for (const entryA of entriesA) {
      for (const entryB of entriesB) {
        const matchComponents = this.calculateFuzzyScore(entryA, entryB, rule);
        
        if (matchComponents.totalScore >= 0.7) { // Minimum threshold for fuzzy match
          scoredMatches.push({
            entryA,
            entryB,
            score: matchComponents.totalScore,
            components: matchComponents
          });
        }
      }
    }

    // Sort by score and resolve conflicts (one-to-one matching)
    scoredMatches.sort((a, b) => b.score - a.score);
    const usedA = new Set<string>();
    const usedB = new Set<string>();

    for (const match of scoredMatches) {
      if (!usedA.has(match.entryA.id) && !usedB.has(match.entryB.id)) {
        matches.push({
          id: `fuzzy_${match.entryA.id}_${match.entryB.id}`,
          entityA: match.entryA.entity,
          entityB: match.entryB.entity,
          transactionA: match.entryA,
          transactionB: match.entryB,
          matchScore: match.score,
          matchType: match.score >= 0.95 ? 'exact' : 'partial',
          variance: Math.abs(
            (parseFloat(match.entryA.debitAmount) || parseFloat(match.entryA.creditAmount)) -
            (parseFloat(match.entryB.debitAmount) || parseFloat(match.entryB.creditAmount))
          ),
          variantReasons: this.generateVarianceReasons(match.components),
          reconciliationDate: new Date(),
          status: 'matched',
          ruleId: rule.id
        });
        
        usedA.add(match.entryA.id);
        usedB.add(match.entryB.id);
      }
    }

    return matches;
  }

  /**
   * Multi-criteria scoring for fuzzy matching
   */
  private calculateFuzzyScore(
    entryA: JournalEntry,
    entryB: JournalEntry,
    rule: ReconciliationRule
  ): FuzzyMatchComponents {
    const amountA = parseFloat(entryA.debitAmount) || parseFloat(entryA.creditAmount);
    const amountB = parseFloat(entryB.debitAmount) || parseFloat(entryB.creditAmount);
    
    // Amount similarity (40% weight)
    const amountScore = this.calculateAmountSimilarity(amountA, amountB, rule);
    
    // Date proximity (25% weight)
    const dateScore = this.calculateDateSimilarity(entryA.date, entryB.date);
    
    // Narration similarity (20% weight)
    const narrationScore = this.calculateNarrationSimilarity(entryA.narration, entryB.narration);
    
    // Account relationship (10% weight)
    const accountScore = this.calculateAccountRelationship(entryA.accountCode, entryB.accountCode);
    
    // Entity relationship (5% weight)
    const entityScore = this.calculateEntityRelationship(entryA.entity, entryB.entity);
    
    const totalScore = (
      amountScore * 0.4 +
      dateScore * 0.25 +
      narrationScore * 0.2 +
      accountScore * 0.1 +
      entityScore * 0.05
    );

    return {
      amountScore,
      dateScore,
      narrationScore,
      accountScore,
      entityScore,
      totalScore
    };
  }

  /**
   * Advanced pattern recognition using machine learning concepts
   */
  async performMLPatternMatching(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Extract features for pattern analysis
    const featuresA = entriesA.map(entry => this.extractFeatures(entry));
    const featuresB = entriesB.map(entry => this.extractFeatures(entry));
    
    // Clustering similar transactions
    const clustersA = this.clusterTransactions(featuresA, entriesA);
    const clustersB = this.clusterTransactions(featuresB, entriesB);
    
    // Match clusters using centroid comparison
    for (const clusterA of clustersA) {
      for (const clusterB of clustersB) {
        const clusterMatch = this.matchClusters(clusterA, clusterB, rule);
        if (clusterMatch.score >= 0.8) {
          // Generate individual matches within clusters
          const clusterMatches = await this.generateClusterMatches(
            clusterA, clusterB, rule, clusterMatch.score
          );
          matches.push(...clusterMatches);
        }
      }
    }
    
    return matches;
  }

  /**
   * Temporal analysis for recurring transaction patterns
   */
  async performTemporalAnalysis(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Group transactions by recurring patterns
    const patternsA = this.identifyRecurringPatterns(entriesA);
    const patternsB = this.identifyRecurringPatterns(entriesB);
    
    // Match patterns across entities
    for (const patternA of patternsA) {
      for (const patternB of patternsB) {
        if (this.isPatternsMatching(patternA, patternB, rule)) {
          const patternMatches = this.matchPatternTransactions(patternA, patternB, rule);
          matches.push(...patternMatches);
        }
      }
    }
    
    return matches;
  }

  /**
   * Multi-leg transaction matching for complex intercompany flows
   */
  async performMultiLegMatching(
    allEntries: JournalEntry[],
    rule: ReconciliationRule
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Identify potential multi-leg transactions
    const multiLegGroups = this.identifyMultiLegGroups(allEntries);
    
    for (const group of multiLegGroups) {
      const multiLegMatches = await this.analyzeMultiLegGroup(group, rule);
      matches.push(...multiLegMatches);
    }
    
    return matches;
  }

  /**
   * AI-powered complex pattern recognition
   */
  async performAIPatternRecognition(
    entriesA: JournalEntry[],
    entriesB: JournalEntry[],
    rule: ReconciliationRule
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Batch process entries through AI for pattern recognition
    const batchSize = 50;
    for (let i = 0; i < entriesA.length; i += batchSize) {
      const batchA = entriesA.slice(i, i + batchSize);
      for (let j = 0; j < entriesB.length; j += batchSize) {
        const batchB = entriesB.slice(j, j + batchSize);
        
        try {
          const aiMatches = await openaiService.analyzeComplexReconciliation({
            entriesA: batchA,
            entriesB: batchB,
            rule: rule,
            context: 'advanced_intercompany_matching'
          });
          
          matches.push(...aiMatches);
        } catch (error) {
          console.error('AI pattern recognition error:', error);
          // Continue with other batches
        }
      }
    }
    
    return matches;
  }

  // Helper methods for fuzzy matching
  private calculateAmountSimilarity(amountA: number, amountB: number, rule: ReconciliationRule): number {
    const difference = Math.abs(amountA - amountB);
    const average = (amountA + amountB) / 2;
    
    if (difference <= rule.toleranceAmount) {
      return 1.0;
    }
    
    const percentDifference = difference / average;
    if (percentDifference <= rule.tolerancePercent) {
      return 1.0 - (percentDifference / rule.tolerancePercent) * 0.3;
    }
    
    return Math.max(0, 1.0 - percentDifference);
  }

  private calculateDateSimilarity(dateA: string, dateB: string): number {
    const date1 = new Date(dateA);
    const date2 = new Date(dateB);
    const daysDifference = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDifference <= 1) return 1.0;
    if (daysDifference <= 7) return 0.8;
    if (daysDifference <= 30) return 0.5;
    return Math.max(0, 1.0 - daysDifference / 365);
  }

  private calculateNarrationSimilarity(narrationA: string, narrationB: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(narrationA.toLowerCase(), narrationB.toLowerCase());
    const maxLength = Math.max(narrationA.length, narrationB.length);
    return maxLength === 0 ? 1.0 : 1.0 - (distance / maxLength);
  }

  private calculateAccountRelationship(accountA: string, accountB: string): number {
    // Define intercompany account relationships
    const relationships = {
      'INTER_RECEIVABLE': ['INTER_PAYABLE'],
      'INTER_PAYABLE': ['INTER_RECEIVABLE'],
      'LOAN_RECEIVABLE': ['LOAN_PAYABLE'],
      'LOAN_PAYABLE': ['LOAN_RECEIVABLE'],
      'SERVICE_INCOME': ['SERVICE_EXPENSE'],
      'SERVICE_EXPENSE': ['SERVICE_INCOME']
    };
    
    if (accountA === accountB) return 1.0;
    
    const relatedAccounts = relationships[accountA] || [];
    return relatedAccounts.some(acc => accountB.includes(acc)) ? 0.9 : 0.3;
  }

  private calculateEntityRelationship(entityA: string, entityB: string): number {
    // In a real implementation, this would check entity hierarchy
    return entityA !== entityB ? 1.0 : 0.0;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // Helper methods for ML pattern matching
  private extractFeatures(entry: JournalEntry): TransactionFeatures {
    const amount = parseFloat(entry.debitAmount) || parseFloat(entry.creditAmount);
    const date = new Date(entry.date);
    
    return {
      amount,
      dayOfWeek: date.getDay(),
      dayOfMonth: date.getDate(),
      month: date.getMonth(),
      accountCodeHash: this.hashString(entry.accountCode),
      narrationLength: entry.narration.length,
      narrationWords: entry.narration.split(' ').length,
      entityHash: this.hashString(entry.entity),
      isDebit: !!parseFloat(entry.debitAmount),
      amountDecimalPlaces: this.getDecimalPlaces(amount)
    };
  }

  private clusterTransactions(features: TransactionFeatures[], entries: JournalEntry[]): TransactionCluster[] {
    // Simple k-means clustering implementation
    const k = Math.min(5, Math.ceil(features.length / 10));
    const clusters: TransactionCluster[] = [];
    
    // Initialize centroids randomly
    const centroids = this.initializeCentroids(features, k);
    
    // Assign transactions to clusters
    for (let i = 0; i < entries.length; i++) {
      const feature = features[i];
      let closestCluster = 0;
      let minDistance = Infinity;
      
      for (let j = 0; j < centroids.length; j++) {
        const distance = this.calculateFeatureDistance(feature, centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = j;
        }
      }
      
      if (!clusters[closestCluster]) {
        clusters[closestCluster] = {
          centroid: centroids[closestCluster],
          transactions: [],
          features: []
        };
      }
      
      clusters[closestCluster].transactions.push(entries[i]);
      clusters[closestCluster].features.push(feature);
    }
    
    return clusters.filter(cluster => cluster.transactions.length > 0);
  }

  private generateVarianceReasons(components: FuzzyMatchComponents): string[] {
    const reasons = [];
    
    if (components.amountScore < 0.9) {
      reasons.push('Amount variance detected');
    }
    if (components.dateScore < 0.8) {
      reasons.push('Date discrepancy');
    }
    if (components.narrationScore < 0.7) {
      reasons.push('Narration differences');
    }
    if (components.accountScore < 0.8) {
      reasons.push('Account relationship mismatch');
    }
    
    return reasons;
  }

  // Additional helper methods would be implemented here...
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private getDecimalPlaces(num: number): number {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    return decimalIndex >= 0 ? str.length - decimalIndex - 1 : 0;
  }

  private initializeCentroids(features: TransactionFeatures[], k: number): TransactionFeatures[] {
    const centroids: TransactionFeatures[] = [];
    
    for (let i = 0; i < k; i++) {
      const randomFeature = features[Math.floor(Math.random() * features.length)];
      centroids.push({ ...randomFeature });
    }
    
    return centroids;
  }

  private calculateFeatureDistance(feature1: TransactionFeatures, feature2: TransactionFeatures): number {
    // Euclidean distance calculation with weighted features
    const weights = {
      amount: 0.3,
      dayOfWeek: 0.1,
      dayOfMonth: 0.1,
      month: 0.1,
      accountCodeHash: 0.2,
      narrationLength: 0.05,
      narrationWords: 0.05,
      entityHash: 0.1
    };
    
    let distance = 0;
    distance += weights.amount * Math.pow((feature1.amount - feature2.amount) / 10000, 2);
    distance += weights.dayOfWeek * Math.pow(feature1.dayOfWeek - feature2.dayOfWeek, 2);
    distance += weights.dayOfMonth * Math.pow(feature1.dayOfMonth - feature2.dayOfMonth, 2);
    distance += weights.month * Math.pow(feature1.month - feature2.month, 2);
    distance += weights.accountCodeHash * Math.pow((feature1.accountCodeHash - feature2.accountCodeHash) / 1000000, 2);
    distance += weights.narrationLength * Math.pow((feature1.narrationLength - feature2.narrationLength) / 100, 2);
    distance += weights.narrationWords * Math.pow(feature1.narrationWords - feature2.narrationWords, 2);
    distance += weights.entityHash * Math.pow((feature1.entityHash - feature2.entityHash) / 1000000, 2);
    
    return Math.sqrt(distance);
  }

  private matchClusters(clusterA: TransactionCluster, clusterB: TransactionCluster, rule: ReconciliationRule): { score: number } {
    const centroidDistance = this.calculateFeatureDistance(clusterA.centroid, clusterB.centroid);
    const score = Math.max(0, 1.0 - centroidDistance);
    return { score };
  }

  private async generateClusterMatches(
    clusterA: TransactionCluster,
    clusterB: TransactionCluster,
    rule: ReconciliationRule,
    clusterScore: number
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Match transactions within clusters using fuzzy matching
    for (const entryA of clusterA.transactions) {
      for (const entryB of clusterB.transactions) {
        const fuzzyScore = this.calculateFuzzyScore(entryA, entryB, rule);
        if (fuzzyScore.totalScore >= 0.7) {
          matches.push({
            id: `cluster_${entryA.id}_${entryB.id}`,
            entityA: entryA.entity,
            entityB: entryB.entity,
            transactionA: entryA,
            transactionB: entryB,
            matchScore: fuzzyScore.totalScore * clusterScore,
            matchType: 'pattern',
            variance: Math.abs(
              (parseFloat(entryA.debitAmount) || parseFloat(entryA.creditAmount)) -
              (parseFloat(entryB.debitAmount) || parseFloat(entryB.creditAmount))
            ),
            variantReasons: this.generateVarianceReasons(fuzzyScore),
            reconciliationDate: new Date(),
            status: 'matched',
            ruleId: rule.id
          });
        }
      }
    }
    
    return matches;
  }

  private identifyRecurringPatterns(entries: JournalEntry[]): RecurringPattern[] {
    const patterns: RecurringPattern[] = [];
    
    // Group by similar amounts and accounts
    const groups = new Map<string, JournalEntry[]>();
    
    for (const entry of entries) {
      const amount = parseFloat(entry.debitAmount) || parseFloat(entry.creditAmount);
      const roundedAmount = Math.round(amount / 100) * 100; // Round to nearest 100
      const key = `${entry.accountCode}_${roundedAmount}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }
    
    // Identify recurring patterns
    for (const [key, groupEntries] of groups) {
      if (groupEntries.length >= 2) {
        // Analyze frequency
        const dates = groupEntries.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
        const intervals = [];
        
        for (let i = 1; i < dates.length; i++) {
          const daysDiff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }
        
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        patterns.push({
          key,
          transactions: groupEntries,
          frequency: avgInterval,
          variance: this.calculateVariance(intervals)
        });
      }
    }
    
    return patterns;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private isPatternsMatching(patternA: RecurringPattern, patternB: RecurringPattern, rule: ReconciliationRule): boolean {
    // Check if patterns are compatible for matching
    const frequencyDiff = Math.abs(patternA.frequency - patternB.frequency);
    const maxVariance = Math.max(patternA.variance, patternB.variance);
    
    return frequencyDiff <= 5 && maxVariance <= 10; // Tolerances for pattern matching
  }

  private matchPatternTransactions(patternA: RecurringPattern, patternB: RecurringPattern, rule: ReconciliationRule): ReconciliationMatch[] {
    const matches: ReconciliationMatch[] = [];
    
    // Sort transactions by date
    const sortedA = patternA.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedB = patternB.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Match transactions sequentially
    const minLength = Math.min(sortedA.length, sortedB.length);
    for (let i = 0; i < minLength; i++) {
      const entryA = sortedA[i];
      const entryB = sortedB[i];
      
      matches.push({
        id: `pattern_${entryA.id}_${entryB.id}`,
        entityA: entryA.entity,
        entityB: entryB.entity,
        transactionA: entryA,
        transactionB: entryB,
        matchScore: 0.85, // Pattern-based matches get high confidence
        matchType: 'pattern',
        variance: Math.abs(
          (parseFloat(entryA.debitAmount) || parseFloat(entryA.creditAmount)) -
          (parseFloat(entryB.debitAmount) || parseFloat(entryB.creditAmount))
        ),
        variantReasons: ['Pattern-based match'],
        reconciliationDate: new Date(),
        status: 'matched',
        ruleId: rule.id
      });
    }
    
    return matches;
  }

  private identifyMultiLegGroups(entries: JournalEntry[]): MultiLegGroup[] {
    const groups: MultiLegGroup[] = [];
    
    // Group by reference numbers or similar identifiers in narration
    const refGroups = new Map<string, JournalEntry[]>();
    
    for (const entry of entries) {
      const refNumber = this.extractReferenceNumber(entry.narration);
      if (refNumber) {
        if (!refGroups.has(refNumber)) {
          refGroups.set(refNumber, []);
        }
        refGroups.get(refNumber)!.push(entry);
      }
    }
    
    // Filter groups that have multiple entities (potential multi-leg)
    for (const [ref, groupEntries] of refGroups) {
      const entities = new Set(groupEntries.map(e => e.entity));
      if (entities.size >= 2 && groupEntries.length >= 2) {
        groups.push({
          referenceNumber: ref,
          transactions: groupEntries,
          entities: Array.from(entities)
        });
      }
    }
    
    return groups;
  }

  private extractReferenceNumber(narration: string): string | null {
    // Extract reference numbers from narration using regex
    const refPatterns = [
      /REF[\s:]+([A-Z0-9]+)/i,
      /TXN[\s:]+([A-Z0-9]+)/i,
      /BATCH[\s:]+([A-Z0-9]+)/i,
      /([A-Z]{2,3}[0-9]{6,})/
    ];
    
    for (const pattern of refPatterns) {
      const match = narration.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return null;
  }

  private async analyzeMultiLegGroup(group: MultiLegGroup, rule: ReconciliationRule): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    
    // Analyze if the group balances (total debits = total credits)
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const entry of group.transactions) {
      totalDebits += parseFloat(entry.debitAmount) || 0;
      totalCredits += parseFloat(entry.creditAmount) || 0;
    }
    
    const balanceDiff = Math.abs(totalDebits - totalCredits);
    
    if (balanceDiff <= rule.toleranceAmount) {
      // Generate matches for all pairs within the group
      for (let i = 0; i < group.transactions.length; i++) {
        for (let j = i + 1; j < group.transactions.length; j++) {
          const entryA = group.transactions[i];
          const entryB = group.transactions[j];
          
          if (entryA.entity !== entryB.entity) {
            matches.push({
              id: `multileg_${entryA.id}_${entryB.id}`,
              entityA: entryA.entity,
              entityB: entryB.entity,
              transactionA: entryA,
              transactionB: entryB,
              matchScore: 0.9,
              matchType: 'multi-leg',
              variance: balanceDiff,
              variantReasons: ['Multi-leg transaction group'],
              reconciliationDate: new Date(),
              status: 'matched',
              ruleId: rule.id
            });
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Main method to run all advanced reconciliation algorithms
   */
  async performAdvancedReconciliation(
    period: string,
    entityList?: string[]
  ): Promise<ReconciliationMatch[]> {
    const allMatches: ReconciliationMatch[] = [];
    
    // Get journal entries
    const journalEntries = await storage.getJournalEntriesByPeriod(period);
    const filteredEntries = entityList 
      ? journalEntries.filter(entry => entityList.includes(entry.entity))
      : journalEntries;
    
    // Group entries by entity
    const entitiesMap = this.groupEntriesByEntity(filteredEntries);
    const entities = Array.from(entitiesMap.keys());
    
    // Get reconciliation rules
    const rules = this.reconciliationRules.filter(r => r.isActive);
    
    // Apply advanced algorithms for each entity pair
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        const entriesA = entitiesMap.get(entityA)!;
        const entriesB = entitiesMap.get(entityB)!;
        
        for (const rule of rules) {
          // Filter entries for this rule
          const filteredA = entriesA.filter(entry => 
            rule.accountCodes.some(code => entry.accountCode.includes(code))
          );
          const filteredB = entriesB.filter(entry => 
            rule.accountCodes.some(code => entry.accountCode.includes(code))
          );
          
          if (filteredA.length > 0 && filteredB.length > 0) {
            // Apply all advanced algorithms
            const fuzzyMatches = await this.performFuzzyMatching(filteredA, filteredB, rule);
            const mlMatches = await this.performMLPatternMatching(filteredA, filteredB, rule);
            const temporalMatches = await this.performTemporalAnalysis(filteredA, filteredB, rule);
            const aiMatches = await this.performAIPatternRecognition(filteredA, filteredB, rule);
            
            allMatches.push(...fuzzyMatches, ...mlMatches, ...temporalMatches, ...aiMatches);
          }
        }
      }
    }
    
    // Apply multi-leg analysis to all entries
    for (const rule of rules) {
      const multiLegMatches = await this.performMultiLegMatching(filteredEntries, rule);
      allMatches.push(...multiLegMatches);
    }
    
    // Deduplicate matches
    const uniqueMatches = this.deduplicateMatches(allMatches);
    
    console.log(`Advanced reconciliation found ${uniqueMatches.length} matches`);
    return uniqueMatches;
  }

  private deduplicateMatches(matches: ReconciliationMatch[]): ReconciliationMatch[] {
    const seen = new Set<string>();
    const unique: ReconciliationMatch[] = [];
    
    for (const match of matches) {
      const key = `${match.transactionA.id}_${match.transactionB.id}`;
      const reverseKey = `${match.transactionB.id}_${match.transactionA.id}`;
      
      if (!seen.has(key) && !seen.has(reverseKey)) {
        seen.add(key);
        unique.push(match);
      }
    }
    
    return unique;
  }
}

// Type definitions
interface FuzzyMatchComponents {
  amountScore: number;
  dateScore: number;
  narrationScore: number;
  accountScore: number;
  entityScore: number;
  totalScore: number;
}

interface TransactionFeatures {
  amount: number;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  accountCodeHash: number;
  narrationLength: number;
  narrationWords: number;
  entityHash: number;
  isDebit: boolean;
  amountDecimalPlaces: number;
}

interface TransactionCluster {
  centroid: TransactionFeatures;
  transactions: JournalEntry[];
  features: TransactionFeatures[];
}

interface RecurringPattern {
  key: string;
  transactions: JournalEntry[];
  frequency: number;
  variance: number;
}

interface MultiLegGroup {
  referenceNumber: string;
  transactions: JournalEntry[];
  entities: string[];
}

// Export the advanced reconciliation engine
export const advancedReconciliationEngine = new AdvancedReconciliationEngine();