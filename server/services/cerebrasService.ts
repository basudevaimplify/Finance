import { Cerebras } from '@cerebras/cerebras_cloud_sdk';

export class CerebrasService {
  private client: Cerebras;

  constructor() {
    this.client = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY || 'csk-6wk2edtm3wwt3jdtth3np2w5dpdwxr2fmjpe2hwnnj984248'
    });
  }

  /**
   * Process natural language query using Cerebras Llama-4-Scout model
   */
  async processNaturalLanguageQuery(
    query: string,
    context: {
      availableDocuments: any[];
      journalEntries: any[];
      financialReports: any[];
      complianceData: any[];
      userTenant: string;
    }
  ): Promise<{
    response: string;
    suggestions: string[];
    insights: string[];
    relevantData: any[];
    confidence: number;
  }> {
    const systemPrompt = `You are an AI assistant specialized in financial analysis and quarterly closure processes for QRT Closure platform. 
You have access to the user's financial data and can provide insights, analysis, and recommendations.

Current context:
- Documents: ${context.availableDocuments.length} uploaded documents
- Journal Entries: ${context.journalEntries.length} entries
- Financial Reports: ${context.financialReports.length} reports
- Compliance Checks: ${context.complianceData.length} checks
- Tenant: ${context.userTenant}

Available document types: ${context.availableDocuments.map(d => d.documentType).join(', ')}

You can help with:
1. Financial data analysis and insights
2. Document processing and classification
3. Compliance checking and validation
4. Report generation and recommendations
5. Workflow automation and agent coordination

Provide helpful, accurate responses based on the available data. When making calculations or analysis,
use the actual data provided. If you need more information, suggest specific actions the user can take.

Format your response as JSON with these fields:
{
  "response": "Main response to user query",
  "suggestions": ["Array of actionable suggestions"],
  "insights": ["Array of key insights from the data"],
  "relevantData": ["Array of relevant data points or references"],
  "confidence": 0.95
}`;

    const userPrompt = `User Query: ${query}

Available Data Summary:
- Documents: ${context.availableDocuments.length} files (${context.availableDocuments.map(d => d.documentType).join(', ')})
- Journal Entries: ${context.journalEntries.length} entries
- Financial Reports: ${context.financialReports.length} reports
- Compliance Checks: ${context.complianceData.length} checks

Please analyze this data and provide a comprehensive response to the user's query.`;

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-4-scout-17b-16e-instruct',
        stream: false,
        max_completion_tokens: 1024,
        temperature: 0.2,
        top_p: 1
      });

      const fullResponse = response.choices[0]?.message?.content || '';

      // Try to parse as JSON, fallback to structured response
      let result;
      try {
        result = JSON.parse(fullResponse);
      } catch (parseError) {
        // If not valid JSON, create structured response
        result = {
          response: fullResponse,
          suggestions: this.extractSuggestions(fullResponse, context),
          insights: this.extractInsights(fullResponse, context),
          relevantData: this.extractRelevantData(context),
          confidence: 0.85
        };
      }

      return {
        response: result.response || fullResponse,
        suggestions: result.suggestions || ['Upload more documents for better analysis', 'Generate journal entries from uploaded documents'],
        insights: result.insights || ['Analysis completed with available data'],
        relevantData: result.relevantData || [],
        confidence: result.confidence || 0.85
      };
    } catch (error) {
      console.error('Error processing query with Cerebras:', error);
      return {
        response: 'I apologize, but I encountered an error processing your query. Please try again or rephrase your question.',
        suggestions: ['Try rephrasing your question', 'Upload more documents for analysis', 'Check system status'],
        insights: ['Unable to generate insights due to processing error'],
        relevantData: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Generate agent workflow responses using Cerebras
   */
  async generateAgentResponse(
    agentName: string,
    message: string,
    context: any
  ): Promise<{
    response: string;
    agentName: string;
    actions?: string[];
    confidence: number;
  }> {
    const agentPrompts = {
      'ClassifierBot': 'You are ClassifierBot, an expert at identifying and classifying financial documents. Analyze document content and categorize them accurately.',
      'DataExtractor': 'You are DataExtractor, specialized in extracting structured data from financial documents. Focus on accuracy and completeness.',
      'GSTValidator': 'You are GSTValidator, responsible for GST compliance validation. Check GST calculations, rates, and compliance requirements.',
      'TDSValidator': 'You are TDSValidator, focused on TDS deduction validation. Verify TDS calculations and compliance.',
      'JournalBot': 'You are JournalBot, expert in double-entry journal generation. Create accurate journal entries from financial data.',
      'ConsoAI': 'You are ConsoAI, specialized in financial statement consolidation. Prepare comprehensive financial reports.',
      'AuditAgent': 'You are AuditAgent, the final validation layer. Perform comprehensive audit checks and ensure compliance.'
    };

    const systemPrompt = agentPrompts[agentName] || 'You are a helpful financial AI assistant.';

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${message}\n\nContext: Available data for processing` }
        ],
        model: 'llama-4-scout-17b-16e-instruct',
        stream: false,
        max_completion_tokens: 512,
        temperature: 0.2,
        top_p: 1
      });

      const fullResponse = response.choices[0]?.message?.content || '';

      return {
        response: fullResponse,
        agentName,
        actions: this.extractActions(fullResponse),
        confidence: 0.9
      };
    } catch (error) {
      console.error(`Error generating response for ${agentName}:`, error);
      return {
        response: `${agentName} is currently processing your request. Please wait...`,
        agentName,
        confidence: 0.5
      };
    }
  }

  private extractSuggestions(response: string, context: any): string[] {
    const suggestions = [];
    
    if (context.availableDocuments.length === 0) {
      suggestions.push('Upload financial documents to get started');
    }
    
    if (response.toLowerCase().includes('upload')) {
      suggestions.push('Upload more documents for comprehensive analysis');
    }
    
    if (response.toLowerCase().includes('report')) {
      suggestions.push('Generate financial reports from your data');
    }
    
    if (response.toLowerCase().includes('compliance')) {
      suggestions.push('Run compliance checks on your documents');
    }

    return suggestions.length > 0 ? suggestions : ['Continue with document processing'];
  }

  private extractInsights(response: string, context: any): string[] {
    const insights = [];
    
    if (context.availableDocuments.length > 0) {
      insights.push(`${context.availableDocuments.length} documents available for analysis`);
    }
    
    if (context.journalEntries.length > 0) {
      insights.push(`${context.journalEntries.length} journal entries recorded`);
    }
    
    if (response.toLowerCase().includes('total') || response.toLowerCase().includes('amount')) {
      insights.push('Financial calculations detected in analysis');
    }

    return insights.length > 0 ? insights : ['Analysis completed with available data'];
  }

  private extractRelevantData(context: any): any[] {
    const relevantData = [];
    
    if (context.availableDocuments.length > 0) {
      relevantData.push({
        type: 'documents',
        count: context.availableDocuments.length,
        types: [...new Set(context.availableDocuments.map(d => d.documentType))]
      });
    }
    
    if (context.journalEntries.length > 0) {
      relevantData.push({
        type: 'journal_entries',
        count: context.journalEntries.length
      });
    }

    return relevantData;
  }

  private extractActions(response: string): string[] {
    const actions = [];
    
    if (response.toLowerCase().includes('classify')) {
      actions.push('Document classification');
    }
    
    if (response.toLowerCase().includes('extract')) {
      actions.push('Data extraction');
    }
    
    if (response.toLowerCase().includes('validate')) {
      actions.push('Validation check');
    }
    
    if (response.toLowerCase().includes('generate')) {
      actions.push('Report generation');
    }

    return actions;
  }
}

export const cerebrasService = new CerebrasService();
