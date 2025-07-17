import { anthropicService } from './anthropic';
import { fileProcessorService } from './fileProcessor';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';

export interface ContentAnalysis {
  documentType: string;
  confidence: number;
  reasoning: string;
  keyIndicators: string[];
  contentSummary: string;
  potentialMisclassification: boolean;
}

export class ContentBasedClassifier {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly CONTENT_ANALYSIS_SAMPLE_SIZE = 3000; // First 3000 characters for analysis

  /**
   * Analyze document content to determine the true document type
   * This prevents filename-based classification errors
   */
  async analyzeDocumentContent(filePath: string, fileName: string): Promise<ContentAnalysis> {
    try {
      // Extract content from the file
      const content = await this.extractFileContent(filePath, fileName);
      
      // Analyze content using AI
      const analysis = await this.performContentAnalysis(content, fileName);
      
      // Cross-validate with pattern matching
      const patternMatch = this.patternBasedClassification(content);
      
      // Combine results for final classification
      const finalAnalysis = this.combineAnalyses(analysis, patternMatch, fileName);
      
      return finalAnalysis;
    } catch (error) {
      console.error('Content analysis failed:', error);
      // Fallback to filename-based classification with low confidence
      return {
        documentType: this.inferFromFilename(fileName),
        confidence: 0.3,
        reasoning: 'Content analysis failed, using filename fallback',
        keyIndicators: ['filename_fallback'],
        contentSummary: 'Unable to analyze content',
        potentialMisclassification: true
      };
    }
  }

  /**
   * Extract content from various file types
   */
  private async extractFileContent(filePath: string, fileName: string): Promise<string> {
    const extension = path.extname(fileName).toLowerCase();
    
    try {
      switch (extension) {
        case '.xlsx':
        case '.xls':
          return await this.extractExcelContent(filePath);
        case '.csv':
          return await this.extractCsvContent(filePath);
        case '.pdf':
          return await this.extractPdfContent(filePath);
        default:
          return fs.readFileSync(filePath, 'utf8');
      }
    } catch (error) {
      console.error(`Failed to extract content from ${fileName}:`, error);
      return '';
    }
  }

  /**
   * Extract meaningful content from Excel files
   */
  private async extractExcelContent(filePath: string): Promise<string> {
    try {
      const workbook = xlsx.readFile(filePath);
      
      let content = '';
      const sheetNames = workbook.SheetNames;
      
      for (const sheetName of sheetNames.slice(0, 3)) { // First 3 sheets only
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        content += `Sheet: ${sheetName}\n`;
        
        if (jsonData.length > 0) {
          // Get headers from first row
          const headers = jsonData[0] as string[];
          content += `Headers: ${headers.join(', ')}\n`;
          
          // Get sample data from first 5 rows
          const sampleData = jsonData.slice(1, 6).map(row => {
            const rowData: any = {};
            headers.forEach((header, index) => {
              rowData[header] = (row as any[])[index] || '';
            });
            return rowData;
          });
          
          content += `Sample Data:\n${JSON.stringify(sampleData, null, 2)}\n\n`;
        }
      }
      
      return content;
    } catch (error) {
      console.error('Excel content extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract content from CSV files
   */
  private async extractCsvContent(filePath: string): Promise<string> {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse CSV content to understand structure
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';
      
      // Get headers from first line
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Get sample data from first 10 rows
      const sampleRows = lines.slice(1, 11).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      return `Headers: ${headers.join(', ')}\nSample Data:\n${JSON.stringify(sampleRows, null, 2)}`;
    } catch (error) {
      console.error('CSV content extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract content from PDF files
   */
  private async extractPdfContent(filePath: string): Promise<string> {
    try {
      const result = await fileProcessorService.processPdfFile(filePath);
      return result.text || '';
    } catch (error) {
      console.error('PDF content extraction failed:', error);
      return '';
    }
  }

  /**
   * Use AI to analyze content and classify document type
   */
  private async performContentAnalysis(content: string, fileName: string): Promise<Partial<ContentAnalysis>> {
    if (!content.trim()) {
      return {
        documentType: 'unknown',
        confidence: 0.1,
        reasoning: 'No content available for analysis'
      };
    }

    const prompt = `
    Analyze this financial document content and classify it accurately. IGNORE THE FILENAME completely - focus only on the actual content.
    
    CRITICAL INSTRUCTION: Base your classification ONLY on the content structure and data, NOT on the filename.
    
    Content to analyze:
    ${content.substring(0, this.CONTENT_ANALYSIS_SAMPLE_SIZE)}
    
    Classification options:
    - sales_register: Contains customer names, sales amounts, invoice numbers, revenue data
    - purchase_register: Contains vendor names, purchase amounts, supplier invoices, procurement data
    - salary_register: Contains employee names, salary amounts, TDS deductions, payroll data
    - fixed_assets: Contains asset names, asset values, depreciation, equipment/machinery data
    - bank_statement: Contains transaction dates, amounts, account balances, bank details
    - vendor_invoice: Contains vendor details, invoice amounts, tax information, purchase invoices
    - tds_certificate: Contains TDS amounts, employee details, tax deduction information
    - gst_return: Contains GST amounts, tax calculations, GSTR forms
    - journal_entry: Contains account codes, debit/credit entries, journal vouchers
    - other: Any other financial document type

    Content Analysis Indicators:
    - Look for column headers, data patterns, amounts, names, dates
    - Identify if data represents income/sales, expenses/purchases, assets, payroll, etc.
    - Check for specific accounting terms, tax codes, employee vs vendor names
    - Analyze numerical patterns (salary ranges vs purchase amounts vs asset values)

    Respond in JSON format:
    {
      "documentType": "classification_result",
      "confidence": 0.95,
      "reasoning": "Detailed explanation of why this classification was chosen",
      "keyIndicators": ["indicator1", "indicator2", "indicator3"],
      "contentSummary": "Brief summary of what the content contains",
      "potentialMisclassification": false
    }
    `;

    try {
      const response = await anthropicService.analyzeDocument(content, fileName, prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI content analysis failed:', error);
      return {
        documentType: 'unknown',
        confidence: 0.2,
        reasoning: 'AI analysis failed'
      };
    }
  }

  /**
   * Pattern-based classification as a backup/validation method
   */
  private patternBasedClassification(content: string): Partial<ContentAnalysis> {
    const patterns = {
      sales_register: [
        /customer|client|buyer|purchaser/i,
        /sales|revenue|income|receipt/i,
        /invoice|bill|receipt/i,
        /total.*amount|total.*value/i
      ],
      purchase_register: [
        /vendor|supplier|seller|provider/i,
        /purchase|procurement|buy|acquire/i,
        /invoice|bill|po|purchase.*order/i,
        /amount.*paid|payment|expense/i
      ],
      salary_register: [
        /employee|staff|worker|personnel/i,
        /salary|wage|pay|compensation/i,
        /tds|tax.*deducted|withholding/i,
        /basic.*pay|gross.*salary|net.*pay/i
      ],
      fixed_asset_register: [
        /asset|equipment|machinery|property/i,
        /cost|value|depreciation/i,
        /purchase.*date|acquisition/i,
        /furniture|computer|vehicle|building/i
      ],
      bank_statement: [
        /account.*number|balance|transaction/i,
        /debit|credit|deposit|withdrawal/i,
        /date.*transaction|transaction.*date/i,
        /opening.*balance|closing.*balance/i
      ],
      tds: [
        /tds|tax.*deducted|withholding/i,
        /certificate|form.*16|deductee/i,
        /pan|section.*194|quarterly/i,
        /employee|salary|compensation/i
      ]
    };

    let bestMatch = 'unknown';
    let bestScore = 0;
    let matchedIndicators: string[] = [];

    for (const [docType, patternList] of Object.entries(patterns)) {
      const matches = patternList.filter(pattern => pattern.test(content));
      const score = matches.length / patternList.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = docType;
        matchedIndicators = matches.map(m => m.source);
      }
    }

    return {
      documentType: bestMatch,
      confidence: bestScore,
      reasoning: `Pattern matching found ${matchedIndicators.length} indicators`,
      keyIndicators: matchedIndicators
    };
  }

  /**
   * Combine AI analysis and pattern matching for final classification
   */
  private combineAnalyses(
    aiAnalysis: Partial<ContentAnalysis>,
    patternAnalysis: Partial<ContentAnalysis>,
    fileName: string
  ): ContentAnalysis {
    // Prioritize AI analysis if confidence is high
    if (aiAnalysis.confidence && aiAnalysis.confidence > this.CONFIDENCE_THRESHOLD) {
      return {
        documentType: aiAnalysis.documentType || 'unknown',
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning || 'AI-based classification',
        keyIndicators: aiAnalysis.keyIndicators || [],
        contentSummary: aiAnalysis.contentSummary || 'AI analysis completed',
        potentialMisclassification: false
      };
    }

    // Use pattern analysis as backup
    if (patternAnalysis.confidence && patternAnalysis.confidence > 0.5) {
      return {
        documentType: patternAnalysis.documentType || 'unknown',
        confidence: patternAnalysis.confidence,
        reasoning: patternAnalysis.reasoning || 'Pattern-based classification',
        keyIndicators: patternAnalysis.keyIndicators || [],
        contentSummary: 'Pattern analysis completed',
        potentialMisclassification: true // Flag for review
      };
    }

    // Final fallback to filename with warning
    return {
      documentType: this.inferFromFilename(fileName),
      confidence: 0.3,
      reasoning: 'Both AI and pattern analysis failed, using filename fallback',
      keyIndicators: ['filename_fallback'],
      contentSummary: 'Classification uncertain',
      potentialMisclassification: true
    };
  }

  /**
   * Filename-based classification (fallback only)
   */
  private inferFromFilename(fileName: string): string {
    const name = fileName.toLowerCase();
    
    if (name.includes('sales') || name.includes('revenue')) return 'sales_register';
    if (name.includes('purchase') || name.includes('procurement')) return 'purchase_register';
    if (name.includes('salary') || name.includes('payroll')) return 'salary_register';
    if (name.includes('asset') || name.includes('equipment')) return 'fixed_asset_register';
    if (name.includes('bank') || name.includes('statement')) return 'bank_statement';
    if (name.includes('vendor') || name.includes('invoice')) return 'vendor_invoice';
    if (name.includes('tds') || name.includes('certificate')) return 'tds';
    
    return 'unknown';
  }

  /**
   * Validate classification against known patterns
   */
  async validateClassification(
    filePath: string,
    fileName: string,
    proposedType: string
  ): Promise<{ isValid: boolean; reason: string; suggestedType?: string }> {
    try {
      const analysis = await this.analyzeDocumentContent(filePath, fileName);
      
      if (analysis.documentType === proposedType && analysis.confidence > this.CONFIDENCE_THRESHOLD) {
        return {
          isValid: true,
          reason: `Classification confirmed with ${Math.round(analysis.confidence * 100)}% confidence`
        };
      }
      
      return {
        isValid: false,
        reason: `Content analysis suggests ${analysis.documentType} (${Math.round(analysis.confidence * 100)}% confidence) instead of ${proposedType}`,
        suggestedType: analysis.documentType
      };
    } catch (error) {
      return {
        isValid: false,
        reason: 'Validation failed due to content analysis error'
      };
    }
  }
}

export const contentBasedClassifier = new ContentBasedClassifier();