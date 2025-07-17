import OpenAI from 'openai';
import { JournalEntry, ReconciliationMatch, ReconciliationRule } from '../types/reconciliation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  
  /**
   * Analyze intercompany transaction patterns using GPT-4
   */
  async analyzeIntercompanyTransaction(entry: JournalEntry): Promise<{
    isIntercompany: boolean;
    parentEntity: string;
    counterpartyEntity: string;
    transactionType: string;
    confidence: number;
  }> {
    const prompt = `
    Analyze this journal entry to determine if it's an intercompany transaction:
    
    Account Code: ${entry.accountCode}
    Account Name: ${entry.accountName}
    Narration: ${entry.narration}
    Entity: ${entry.entity}
    Amount: ${entry.debitAmount || entry.creditAmount}
    Date: ${entry.date}
    
    Please analyze and return in JSON format:
    {
      "isIntercompany": boolean,
      "parentEntity": "string",
      "counterpartyEntity": "string", 
      "transactionType": "loan|transfer|service|allocation|other",
      "confidence": number_between_0_and_1
    }
    
    Consider these indicators:
    - Account codes containing INTER_, LOAN_, SERVICE_, ALLOCATION_
    - Narration mentioning company names, entities, or transfer terms
    - Patterns indicating movement between related entities
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        isIntercompany: result.isIntercompany,
        parentEntity: result.parentEntity || entry.entity,
        counterpartyEntity: result.counterpartyEntity || 'Unknown',
        transactionType: result.transactionType || 'other',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };
    } catch (error) {
      console.error('Error analyzing intercompany transaction:', error);
      return {
        isIntercompany: false,
        parentEntity: entry.entity,
        counterpartyEntity: 'Unknown',
        transactionType: 'other',
        confidence: 0
      };
    }
  }

  /**
   * Perform complex reconciliation analysis using GPT-4
   */
  async analyzeComplexReconciliation(params: {
    entriesA: JournalEntry[];
    entriesB: JournalEntry[];
    rule: ReconciliationRule;
    context: string;
  }): Promise<ReconciliationMatch[]> {
    const { entriesA, entriesB, rule, context } = params;
    
    const prompt = `
    Perform advanced reconciliation analysis for these intercompany transactions:
    
    Entity A Transactions:
    ${entriesA.map(e => `${e.id}: ${e.accountCode} - ${e.narration} - ${e.debitAmount || e.creditAmount} - ${e.date}`).join('\n')}
    
    Entity B Transactions:
    ${entriesB.map(e => `${e.id}: ${e.accountCode} - ${e.narration} - ${e.debitAmount || e.creditAmount} - ${e.date}`).join('\n')}
    
    Reconciliation Rule: ${rule.name}
    Account Codes: ${rule.accountCodes.join(', ')}
    Tolerance: ${rule.tolerancePercent * 100}% or ${rule.toleranceAmount}
    
    Context: ${context}
    
    Please identify potential matches considering:
    1. Complex patterns (multi-part transactions, allocations)
    2. Timing differences (month-end adjustments)
    3. Currency conversions or rate differences
    4. Partial matches that sum to complete transactions
    5. Reference number patterns
    6. Business logic relationships
    
    Return matches in JSON format:
    {
      "matches": [
        {
          "entryA_id": "string",
          "entryB_id": "string",
          "matchScore": number_between_0_and_1,
          "matchType": "exact|partial|pattern|suspected",
          "variance": number,
          "reasoning": "string_explanation",
          "confidence": number_between_0_and_1
        }
      ]
    }
    
    Only return matches with confidence > 0.7
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"matches": []}');
      const matches: ReconciliationMatch[] = [];

      for (const match of result.matches || []) {
        const entryA = entriesA.find(e => e.id === match.entryA_id);
        const entryB = entriesB.find(e => e.id === match.entryB_id);
        
        if (entryA && entryB && match.confidence > 0.7) {
          matches.push({
            id: `ai_${match.entryA_id}_${match.entryB_id}`,
            entityA: entryA.entity,
            entityB: entryB.entity,
            transactionA: entryA,
            transactionB: entryB,
            matchScore: match.matchScore,
            matchType: match.matchType,
            variance: match.variance || 0,
            variantReasons: [match.reasoning],
            reconciliationDate: new Date(),
            status: 'matched',
            ruleId: rule.id
          });
        }
      }

      return matches;
    } catch (error) {
      console.error('Error in AI reconciliation analysis:', error);
      return [];
    }
  }

  /**
   * Analyze reconciliation results and provide insights using GPT-4
   */
  async analyzeReconciliationResults(matches: ReconciliationMatch[]): Promise<{
    insights: string[];
    recommendations: string[];
    riskAreas: string[];
    dataQualityIssues: string[];
  }> {
    const summary = {
      totalMatches: matches.length,
      exactMatches: matches.filter(m => m.matchType === 'exact').length,
      partialMatches: matches.filter(m => m.matchType === 'partial').length,
      patternMatches: matches.filter(m => m.matchType === 'pattern').length,
      averageScore: matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length,
      totalVariance: matches.reduce((sum, m) => sum + m.variance, 0),
      commonVarianceReasons: this.getCommonVarianceReasons(matches)
    };

    const prompt = `
    Analyze these reconciliation results and provide business insights:
    
    Summary:
    - Total Matches: ${summary.totalMatches}
    - Exact Matches: ${summary.exactMatches}
    - Partial Matches: ${summary.partialMatches}
    - Pattern Matches: ${summary.patternMatches}
    - Average Match Score: ${summary.averageScore.toFixed(2)}
    - Total Variance: ${summary.totalVariance}
    - Common Variance Reasons: ${summary.commonVarianceReasons.join(', ')}
    
    Sample matches:
    ${matches.slice(0, 5).map(m => 
      `${m.entityA} <-> ${m.entityB}: Score ${m.matchScore}, Variance ${m.variance}, Reasons: ${m.variantReasons.join(', ')}`
    ).join('\n')}
    
    Please provide analysis in JSON format:
    {
      "insights": ["string array of key insights"],
      "recommendations": ["string array of actionable recommendations"],
      "riskAreas": ["string array of potential risk areas"],
      "dataQualityIssues": ["string array of data quality concerns"]
    }
    
    Focus on:
    - Patterns in unmatched transactions
    - Process improvement opportunities
    - Control gaps
    - Data standardization needs
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{"insights":[],"recommendations":[],"riskAreas":[],"dataQualityIssues":[]}');
    } catch (error) {
      console.error('Error analyzing reconciliation results:', error);
      return {
        insights: [],
        recommendations: [],
        riskAreas: [],
        dataQualityIssues: []
      };
    }
  }

  /**
   * Generate automated journal entries for reconciliation adjustments using GPT-4
   */
  async generateReconciliationAdjustments(matches: ReconciliationMatch[]): Promise<{
    adjustments: Array<{
      entityA: string;
      entityB: string;
      adjustmentType: string;
      amount: number;
      description: string;
      journalEntries: any[];
    }>;
  }> {
    const significantVariances = matches.filter(m => m.variance > 1000);
    
    if (significantVariances.length === 0) {
      return { adjustments: [] };
    }

    const prompt = `
    Generate reconciliation adjustments for these significant variances:
    
    ${significantVariances.map(m => `
    Match: ${m.entityA} <-> ${m.entityB}
    Variance: ${m.variance}
    Reasons: ${m.variantReasons.join(', ')}
    Transaction A: ${m.transactionA.accountCode} - ${m.transactionA.narration} - ${m.transactionA.debitAmount || m.transactionA.creditAmount}
    Transaction B: ${m.transactionB.accountCode} - ${m.transactionB.narration} - ${m.transactionB.debitAmount || m.transactionB.creditAmount}
    `).join('\n')}
    
    Generate appropriate adjusting journal entries in JSON format:
    {
      "adjustments": [
        {
          "entityA": "string",
          "entityB": "string", 
          "adjustmentType": "timing|rounding|currency|allocation|other",
          "amount": number,
          "description": "string",
          "journalEntries": [
            {
              "entity": "string",
              "accountCode": "string",
              "accountName": "string",
              "debitAmount": number,
              "creditAmount": number,
              "narration": "string"
            }
          ]
        }
      ]
    }
    
    Follow these principles:
    - Only create adjustments for material variances
    - Ensure debits = credits for each adjustment
    - Use appropriate suspense/clearing accounts
    - Include clear narration explaining the adjustment
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{"adjustments":[]}');
    } catch (error) {
      console.error('Error generating reconciliation adjustments:', error);
      return { adjustments: [] };
    }
  }

  /**
   * Document classification using GPT-4
   */
  async classifyDocument(content: string, filename: string): Promise<{
    documentType: string;
    confidence: number;
    extractedData: any;
    reasoning: string;
  }> {
    const prompt = `
    Classify this financial document and extract key information:
    
    Filename: ${filename}
    Content: ${content.substring(0, 2000)}...
    
    Please analyze and classify the document type from these categories:
    - vendor_invoice: Vendor invoices and bills
    - sales_register: Sales receipts and registers
    - salary_register: Payroll and salary documents
    - bank_statement: Bank statements and passbooks
    - purchase_register: Purchase orders and registers
    - journal_entry: Journal entries and vouchers
    - gst_return: GST returns and tax documents
    - tds_certificate: TDS certificates and deductions
    - fixed_assets: Fixed asset registers
    - other: Other financial documents
    
    Return in JSON format:
    {
      "documentType": "string",
      "confidence": number_between_0_and_1,
      "extractedData": {
        "totalAmount": number,
        "date": "YYYY-MM-DD",
        "vendor": "string",
        "gstNumber": "string",
        "invoiceNumber": "string"
      },
      "reasoning": "string_explanation"
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        documentType: result.documentType || 'other',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        extractedData: result.extractedData || {},
        reasoning: result.reasoning || 'Analysis completed'
      };
    } catch (error) {
      console.error('Error classifying document:', error);
      return {
        documentType: 'other',
        confidence: 0,
        extractedData: {},
        reasoning: 'Classification failed'
      };
    }
  }

  /**
   * Generate journal entries using GPT-4
   */
  async generateJournalEntries(documentData: any, documentType: string): Promise<any[]> {
    const prompt = `
    Generate journal entries for this ${documentType} document:
    
    Document Data: ${JSON.stringify(documentData, null, 2)}
    
    Please create appropriate double-entry journal entries following Indian accounting standards.
    Consider:
    - Proper account codes (1xxx for assets, 2xxx for liabilities, 3xxx for equity, 4xxx for revenue, 5xxx for expenses)
    - GST implications
    - TDS deductions where applicable
    - Correct debit/credit entries
    
    Return in JSON format:
    {
      "journalEntries": [
        {
          "accountCode": "string",
          "accountName": "string",
          "debitAmount": number,
          "creditAmount": number,
          "narration": "string",
          "date": "YYYY-MM-DD"
        }
      ]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"journalEntries":[]}');
      return result.journalEntries || [];
    } catch (error) {
      console.error('Error generating journal entries:', error);
      return [];
    }
  }

  private getCommonVarianceReasons(matches: ReconciliationMatch[]): string[] {
    const reasonCounts = new Map<string, number>();
    
    matches.forEach(match => {
      match.variantReasons.forEach(reason => {
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      });
    });
    
    return Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]) => reason);
  }
}

export const openaiService = new OpenAIService();