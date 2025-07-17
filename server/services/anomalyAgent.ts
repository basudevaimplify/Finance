import OpenAI from 'openai';
import { openaiService } from './openaiService';

interface AnomalyAnalysisRequest {
  transactions: any[];
  document: any;
  historicalData?: any[];
  complianceRules?: any[];
  userContext?: string;
}

interface AnomalyResult {
  id: string;
  transactionId: string;
  documentId: string;
  anomalyScore: number;
  confidence: number;
  anomalyType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  evidence: string[];
  recommendations: string[];
  businessContext: string;
  riskFactors: string[];
  suggestedActions: Array<{
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    automatable: boolean;
  }>;
  followUpQuestions: string[];
  relatedTransactions: string[];
}

interface AnomalyAgentInsights {
  overallRiskScore: number;
  patternAnalysis: {
    detectedPatterns: string[];
    missingPatterns: string[];
    unusualPatterns: string[];
  };
  complianceIssues: Array<{
    rule: string;
    severity: string;
    description: string;
    impact: string;
  }>;
  businessLogicViolations: Array<{
    rule: string;
    description: string;
    suggestion: string;
  }>;
  recommendations: Array<{
    category: string;
    priority: string;
    description: string;
    impact: string;
  }>;
}

export class AnomalyDetectionAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async analyzeTransactionAnomalies(request: AnomalyAnalysisRequest): Promise<AnomalyResult[]> {
    const prompt = this.buildAnomalyAnalysisPrompt(request);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const analysisResult = JSON.parse(content.text);
        return this.processAnomalyResults(analysisResult, request);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error in anomaly analysis:', error);
      return [];
    }
  }

  async generateAnomalyInsights(anomalies: AnomalyResult[], context: any): Promise<AnomalyAgentInsights> {
    const prompt = `
As an expert financial anomaly detection agent, analyze these detected anomalies and provide comprehensive insights:

DETECTED ANOMALIES:
${anomalies.map(a => `
- ID: ${a.id}
- Type: ${a.anomalyType}
- Severity: ${a.severity}
- Score: ${a.anomalyScore}
- Reasoning: ${a.reasoning}
- Evidence: ${a.evidence.join(', ')}
`).join('\n')}

BUSINESS CONTEXT:
${JSON.stringify(context, null, 2)}

Provide comprehensive insights including:
1. Overall risk assessment
2. Pattern analysis
3. Compliance issues
4. Business logic violations
5. Strategic recommendations

Respond with JSON following this structure:
{
  "overallRiskScore": 0-100,
  "patternAnalysis": {
    "detectedPatterns": ["pattern1", "pattern2"],
    "missingPatterns": ["expected pattern not found"],
    "unusualPatterns": ["unusual pattern description"]
  },
  "complianceIssues": [
    {
      "rule": "GST Rule 42",
      "severity": "HIGH",
      "description": "Description of violation",
      "impact": "Potential impact"
    }
  ],
  "businessLogicViolations": [
    {
      "rule": "Rule name",
      "description": "What was violated",
      "suggestion": "How to fix"
    }
  ],
  "recommendations": [
    {
      "category": "Process Improvement",
      "priority": "HIGH",
      "description": "Recommendation description",
      "impact": "Expected impact"
    }
  ]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error generating anomaly insights:', error);
      return this.getDefaultInsights();
    }
  }

  async explainAnomalyToUser(anomaly: AnomalyResult, userQuestion: string): Promise<string> {
    const prompt = `
You are a financial AI assistant explaining anomaly detection results to a user.

ANOMALY DETAILS:
- Type: ${anomaly.anomalyType}
- Severity: ${anomaly.severity}
- Score: ${anomaly.anomalyScore}
- Reasoning: ${anomaly.reasoning}
- Evidence: ${anomaly.evidence.join(', ')}
- Business Context: ${anomaly.businessContext}

USER QUESTION: "${userQuestion}"

Provide a clear, concise explanation that:
1. Addresses the user's specific question
2. Explains the anomaly in business terms
3. Provides context about why this matters
4. Suggests next steps

Keep the explanation professional but accessible, avoiding technical jargon.`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error explaining anomaly:', error);
      return "I apologize, but I'm having trouble explaining this anomaly right now. Please try asking your question again.";
    }
  }

  async suggestRemediationActions(anomaly: AnomalyResult): Promise<Array<{
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    automatable: boolean;
    estimatedTime: string;
    requiredRole: string;
  }>> {
    const prompt = `
As a financial process automation expert, analyze this anomaly and suggest specific remediation actions:

ANOMALY:
- Type: ${anomaly.anomalyType}
- Severity: ${anomaly.severity}
- Evidence: ${anomaly.evidence.join(', ')}
- Current Recommendations: ${anomaly.recommendations.join(', ')}

Provide specific, actionable remediation steps with:
1. Action description
2. Priority level
3. Whether it can be automated
4. Estimated time to complete
5. Required role/permissions

Respond with JSON array of actions.`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error suggesting remediation:', error);
      return [];
    }
  }

  private buildAnomalyAnalysisPrompt(request: AnomalyAnalysisRequest): string {
    return `
You are an expert financial anomaly detection agent with deep knowledge of Indian accounting standards, GST regulations, TDS compliance, and financial best practices.

ANALYZE THESE TRANSACTIONS FOR ANOMALIES:

DOCUMENT CONTEXT:
- Type: ${request.document.documentType}
- Source: ${request.document.fileName}
- Date: ${request.document.uploadDate}

TRANSACTIONS TO ANALYZE:
${request.transactions.map(t => `
- ID: ${t.id}
- Amount: ${t.amount}
- Account: ${t.accountCode}
- Description: ${t.narration}
- Date: ${t.date}
- Type: ${t.type}
`).join('\n')}

${request.historicalData ? `
HISTORICAL CONTEXT:
${request.historicalData.map(h => `- ${h.type}: ${h.value}`).join('\n')}
` : ''}

${request.complianceRules ? `
COMPLIANCE RULES:
${request.complianceRules.map(r => `- ${r.name}: ${r.description}`).join('\n')}
` : ''}

DETECTION CRITERIA:
1. Amount anomalies (unusually high/low, round numbers, suspicious patterns)
2. Account code mismatches or unusual combinations
3. Timing anomalies (weekend transactions, unusual dates)
4. GST/TDS calculation errors
5. Duplicate or near-duplicate transactions
6. Business logic violations
7. Compliance violations (missing documentation, incorrect rates)
8. Pattern deviations from historical norms

For each anomaly detected, provide:
- Severity assessment (LOW/MEDIUM/HIGH/CRITICAL)
- Confidence score (0-1)
- Detailed reasoning
- Supporting evidence
- Business context explanation
- Risk factors
- Specific recommendations
- Related transactions
- Follow-up questions for investigation

Respond with JSON array of anomaly objects following this structure:
{
  "anomalies": [
    {
      "transactionId": "string",
      "anomalyType": "amount_anomaly|account_mismatch|timing_anomaly|compliance_violation|pattern_deviation",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "confidence": 0.95,
      "reasoning": "Detailed explanation of why this is anomalous",
      "evidence": ["Evidence point 1", "Evidence point 2"],
      "businessContext": "Business explanation of the issue",
      "riskFactors": ["Risk factor 1", "Risk factor 2"],
      "recommendations": ["Recommendation 1", "Recommendation 2"],
      "followUpQuestions": ["Question 1", "Question 2"],
      "relatedTransactions": ["txn_id_1", "txn_id_2"]
    }
  ]
}`;
  }

  private processAnomalyResults(analysisResult: any, request: AnomalyAnalysisRequest): AnomalyResult[] {
    const results: AnomalyResult[] = [];
    
    for (const anomaly of analysisResult.anomalies || []) {
      results.push({
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: anomaly.transactionId,
        documentId: request.document.id,
        anomalyScore: anomaly.confidence * 100,
        confidence: anomaly.confidence,
        anomalyType: anomaly.anomalyType,
        severity: anomaly.severity,
        reasoning: anomaly.reasoning,
        evidence: anomaly.evidence || [],
        recommendations: anomaly.recommendations || [],
        businessContext: anomaly.businessContext || '',
        riskFactors: anomaly.riskFactors || [],
        suggestedActions: [],
        followUpQuestions: anomaly.followUpQuestions || [],
        relatedTransactions: anomaly.relatedTransactions || [],
      });
    }
    
    return results;
  }

  private getDefaultInsights(): AnomalyAgentInsights {
    return {
      overallRiskScore: 0,
      patternAnalysis: {
        detectedPatterns: [],
        missingPatterns: [],
        unusualPatterns: []
      },
      complianceIssues: [],
      businessLogicViolations: [],
      recommendations: []
    };
  }
}

export const anomalyDetectionAgent = new AnomalyDetectionAgent();