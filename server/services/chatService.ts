import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ChatService {
  /**
   * Process natural language query using GPT-4
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
  }> {
    const systemPrompt = `
    You are an AI assistant specialized in financial analysis and quarterly closure processes. 
    You have access to the user's financial data and can provide insights, analysis, and recommendations.

    Current context:
    - Documents: ${context.availableDocuments.length} uploaded documents
    - Journal Entries: ${context.journalEntries.length} entries
    - Financial Reports: ${context.financialReports.length} reports
    - Compliance Checks: ${context.complianceData.length} checks
    - Tenant: ${context.userTenant}

    Available document types: ${context.availableDocuments.map(d => d.documentType).join(', ')}
    
    Provide helpful, accurate responses based on the available data. When making calculations or analysis,
    use the actual data provided. If you need more information, suggest specific actions the user can take.

    Format your response as JSON with these fields:
    {
      "response": "Main response to user query",
      "suggestions": ["Array of actionable suggestions"],
      "insights": ["Array of key insights from the data"],
      "relevantData": ["Array of relevant data points or references"]
    }
    `;

    const userPrompt = `
    User Query: ${query}
    
    Available Data Context:
    Documents: ${JSON.stringify(context.availableDocuments.slice(0, 10), null, 2)}
    Recent Journal Entries: ${JSON.stringify(context.journalEntries.slice(0, 20), null, 2)}
    Financial Reports: ${JSON.stringify(context.financialReports.slice(0, 5), null, 2)}
    Compliance Status: ${JSON.stringify(context.complianceData.slice(0, 5), null, 2)}
    
    Please analyze this data and provide a comprehensive response to the user's query.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        response: result.response || 'I apologize, but I need more information to provide a comprehensive response.',
        suggestions: result.suggestions || ['Upload more documents for better analysis', 'Generate journal entries from uploaded documents', 'Review financial reports for accuracy'],
        insights: result.insights || ['No specific insights available with current data'],
        relevantData: result.relevantData || []
      };
    } catch (error) {
      console.error('Error processing natural language query:', error);
      return {
        response: 'I apologize, but I encountered an error processing your query. Please try again or rephrase your question.',
        suggestions: ['Try rephrasing your question', 'Upload more documents for analysis', 'Check if your OpenAI API key is configured correctly'],
        insights: ['Unable to generate insights due to processing error'],
        relevantData: []
      };
    }
  }

  /**
   * Analyze financial data and provide insights
   */
  async analyzeFinancialData(data: any[]): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    keyInsights: string[];
    recommendations: string[];
  }> {
    const prompt = `
    Analyze this financial data and provide insights:
    
    ${JSON.stringify(data, null, 2)}
    
    Calculate totals and provide insights in JSON format:
    {
      "totalRevenue": number,
      "totalExpenses": number,
      "netProfit": number,
      "keyInsights": ["array of key insights"],
      "recommendations": ["array of recommendations"]
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
        totalRevenue: result.totalRevenue || 0,
        totalExpenses: result.totalExpenses || 0,
        netProfit: result.netProfit || 0,
        keyInsights: result.keyInsights || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error analyzing financial data:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        keyInsights: ['Unable to analyze data due to processing error'],
        recommendations: ['Please check your data and try again']
      };
    }
  }
}

export const chatService = new ChatService();