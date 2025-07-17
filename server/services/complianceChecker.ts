import { anthropicService } from './anthropic';
import type { Document, JournalEntry } from '@shared/schema';

export interface ComplianceResult {
  isCompliant: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
  details: any;
}

export interface GSTComplianceResult extends ComplianceResult {
  gstinValidation: boolean;
  taxCalculationAccuracy: number;
  invoiceFormatCompliance: boolean;
}

export interface TDSComplianceResult extends ComplianceResult {
  panValidation: boolean;
  sectionCodeValidation: boolean;
  deductionRateAccuracy: number;
}

export interface IndASComplianceResult extends ComplianceResult {
  scheduleIIICompliance: boolean;
  disclosureRequirements: boolean;
  accountingStandardsCompliance: boolean;
}

export class ComplianceCheckerService {
  async validateGSTCompliance(extractedData: any): Promise<GSTComplianceResult> {
    // Use Anthropic to validate GST compliance
    const validation = await anthropicService.validateCompliance('gst', extractedData);
    
    // Perform additional GST-specific validations
    const gstinValidation = this.validateGSTIN(extractedData);
    const taxCalculationAccuracy = this.validateGSTTaxCalculation(extractedData);
    const invoiceFormatCompliance = this.validateGSTInvoiceFormat(extractedData);
    
    return {
      isCompliant: validation.isCompliant && gstinValidation && invoiceFormatCompliance,
      score: validation.score,
      violations: validation.violations,
      recommendations: validation.recommendations,
      details: validation,
      gstinValidation,
      taxCalculationAccuracy,
      invoiceFormatCompliance,
    };
  }

  async validateTDSCompliance(extractedData: any): Promise<TDSComplianceResult> {
    // Use Anthropic to validate TDS compliance
    const validation = await anthropicService.validateCompliance('tds', extractedData);
    
    // Perform additional TDS-specific validations
    const panValidation = this.validatePAN(extractedData);
    const sectionCodeValidation = this.validateTDSSection(extractedData);
    const deductionRateAccuracy = this.validateTDSDeductionRate(extractedData);
    
    return {
      isCompliant: validation.isCompliant && panValidation && sectionCodeValidation,
      score: validation.score,
      violations: validation.violations,
      recommendations: validation.recommendations,
      details: validation,
      panValidation,
      sectionCodeValidation,
      deductionRateAccuracy,
    };
  }

  async validateIndASCompliance(document: Document, journalEntries: JournalEntry[]): Promise<IndASComplianceResult> {
    // Comprehensive Ind AS compliance check
    const complianceData = {
      document,
      journalEntries,
      documentType: document.documentType,
      extractedData: document.extractedData,
    };

    const validation = await anthropicService.validateCompliance('ind_as', complianceData);
    
    // Additional Ind AS specific checks
    const scheduleIIICompliance = this.validateScheduleIIICompliance(document, journalEntries);
    const disclosureRequirements = this.validateDisclosureRequirements(document);
    const accountingStandardsCompliance = this.validateAccountingStandardsCompliance(journalEntries);
    
    return {
      isCompliant: validation.isCompliant,
      score: validation.score,
      violations: validation.violations,
      recommendations: validation.recommendations,
      details: validation,
      scheduleIIICompliance,
      disclosureRequirements,
      accountingStandardsCompliance,
    };
  }

  async validateCompaniesActCompliance(document: Document, journalEntries: JournalEntry[]): Promise<ComplianceResult> {
    // Companies Act 2013 compliance validation
    const complianceData = {
      document,
      journalEntries,
      documentType: document.documentType,
    };

    const validation = await anthropicService.validateCompliance('companies_act', complianceData);
    
    // Additional Companies Act specific checks
    const additionalViolations = this.validateCompaniesActRequirements(document, journalEntries);
    
    return {
      isCompliant: validation.isCompliant && additionalViolations.length === 0,
      score: validation.score,
      violations: [...validation.violations, ...additionalViolations],
      recommendations: validation.recommendations,
      details: validation,
    };
  }

  async performAuditChecks(document: Document, journalEntries: JournalEntry[]): Promise<any> {
    const auditFindings = {
      documentCompliance: await this.validateDocumentCompliance(document),
      journalEntryValidation: this.validateJournalEntries(journalEntries),
      mathematicalAccuracy: this.validateMathematicalAccuracy(journalEntries),
      accountingPrinciplesCompliance: this.validateAccountingPrinciples(journalEntries),
      auditTrailCompleteness: this.validateAuditTrailCompleteness(document, journalEntries),
    };

    return auditFindings;
  }

  private validateGSTIN(extractedData: any): boolean {
    // GSTIN format validation: 15 characters, specific pattern
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (extractedData.gstin) {
      return gstinPattern.test(extractedData.gstin);
    }
    
    return false;
  }

  private validateGSTTaxCalculation(extractedData: any): number {
    // Validate GST tax calculation accuracy
    if (!extractedData.taxableAmount || !extractedData.taxAmount) {
      return 0;
    }

    const expectedTax = extractedData.taxableAmount * (extractedData.taxRate / 100);
    const actualTax = extractedData.taxAmount;
    
    return Math.abs(expectedTax - actualTax) < 0.01 ? 100 : 0;
  }

  private validateGSTInvoiceFormat(extractedData: any): boolean {
    // Check for mandatory GST invoice fields
    const mandatoryFields = ['gstin', 'invoiceNumber', 'invoiceDate', 'taxableAmount', 'taxAmount'];
    
    return mandatoryFields.every(field => extractedData[field]);
  }

  private validatePAN(extractedData: any): boolean {
    // PAN format validation: 10 characters, specific pattern
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    
    if (extractedData.pan) {
      return panPattern.test(extractedData.pan);
    }
    
    return false;
  }

  private validateTDSSection(extractedData: any): boolean {
    // Validate TDS section codes
    const validSections = [
      '194A', '194B', '194C', '194D', '194E', '194F', '194G', '194H', '194I',
      '194J', '194K', '194L', '194M', '194N', '194O', '194P', '194Q', '194R',
      '194S', '194T', '194U', '194V', '194W', '194X', '194Y', '194Z'
    ];
    
    return extractedData.sectionCode && validSections.includes(extractedData.sectionCode);
  }

  private validateTDSDeductionRate(extractedData: any): number {
    // Validate TDS deduction rate based on section
    const sectionRates = {
      '194A': 10, // Interest other than on securities
      '194C': 1,  // Payment to contractors
      '194J': 10, // Professional/technical services
      '194I': 10, // Rent
      // Add more section rates as needed
    };
    
    if (extractedData.sectionCode && sectionRates[extractedData.sectionCode]) {
      const expectedRate = sectionRates[extractedData.sectionCode];
      const actualRate = extractedData.deductionRate;
      
      return Math.abs(expectedRate - actualRate) < 0.1 ? 100 : 0;
    }
    
    return 0;
  }

  private validateScheduleIIICompliance(document: Document, journalEntries: JournalEntry[]): boolean {
    // Validate compliance with Schedule III of Companies Act 2013
    // This includes format requirements for financial statements
    
    // Check for mandatory disclosures
    const hasMandatoryDisclosures = document.metadata && 
      document.metadata.disclosures && 
      document.metadata.disclosures.length > 0;
    
    // Check journal entry structure
    const hasValidJournalStructure = journalEntries.every(entry => 
      entry.accountCode && entry.accountName && (entry.debitAmount || entry.creditAmount)
    );
    
    return hasMandatoryDisclosures && hasValidJournalStructure;
  }

  private validateDisclosureRequirements(document: Document): boolean {
    // Validate disclosure requirements based on document type
    const requiredDisclosures = {
      trial_balance: ['accountingPolicies', 'contingentLiabilities'],
      journal: ['narration', 'supportingDocuments'],
      gst: ['placeOfSupply', 'taxClassification'],
      tds: ['deducteeDetails', 'sectionCode'],
    };
    
    const required = requiredDisclosures[document.documentType] || [];
    
    return required.every(disclosure => 
      document.metadata && document.metadata[disclosure]
    );
  }

  private validateAccountingStandardsCompliance(journalEntries: JournalEntry[]): boolean {
    // Validate compliance with accounting standards
    // Check for double-entry bookkeeping
    const totalDebits = journalEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.debitAmount?.toString() || '0'), 0
    );
    
    const totalCredits = journalEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.creditAmount?.toString() || '0'), 0
    );
    
    return Math.abs(totalDebits - totalCredits) < 0.01;
  }

  private validateCompaniesActRequirements(document: Document, journalEntries: JournalEntry[]): string[] {
    const violations: string[] = [];
    
    // Check for mandatory fields
    if (!document.metadata?.entityName) {
      violations.push('Entity name is mandatory under Companies Act 2013');
    }
    
    // Check for proper authorization
    if (!document.metadata?.authorizedBy) {
      violations.push('Documents must be properly authorized');
    }
    
    // Check for date compliance
    const currentDate = new Date();
    const documentDate = new Date(document.createdAt);
    const daysDifference = Math.abs((currentDate.getTime() - documentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 30) {
      violations.push('Documents should be processed within 30 days');
    }
    
    return violations;
  }

  private async validateDocumentCompliance(document: Document): Promise<any> {
    return {
      fileFormatCompliance: this.validateFileFormat(document),
      sizeCompliance: document.fileSize <= 100 * 1024 * 1024, // 100MB limit
      metadataCompleteness: this.validateMetadataCompleteness(document),
    };
  }

  private validateFileFormat(document: Document): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf'
    ];
    
    return allowedTypes.includes(document.mimeType);
  }

  private validateMetadataCompleteness(document: Document): boolean {
    const requiredMetadata = ['uploadDate', 'fileSize', 'documentType'];
    
    return requiredMetadata.every(field => 
      document.metadata && document.metadata[field]
    );
  }

  private validateJournalEntries(journalEntries: JournalEntry[]): any {
    return {
      balanceCheck: this.validateAccountBalance(journalEntries),
      mandatoryFields: this.validateMandatoryFields(journalEntries),
      duplicateCheck: this.validateDuplicateEntries(journalEntries),
    };
  }

  private validateAccountBalance(journalEntries: JournalEntry[]): boolean {
    const totalDebits = journalEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.debitAmount?.toString() || '0'), 0
    );
    
    const totalCredits = journalEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.creditAmount?.toString() || '0'), 0
    );
    
    return Math.abs(totalDebits - totalCredits) < 0.01;
  }

  private validateMandatoryFields(journalEntries: JournalEntry[]): boolean {
    return journalEntries.every(entry => 
      entry.journalId && entry.date && entry.accountCode && entry.accountName
    );
  }

  private validateDuplicateEntries(journalEntries: JournalEntry[]): boolean {
    const journalIds = journalEntries.map(entry => entry.journalId);
    const uniqueIds = new Set(journalIds);
    
    return journalIds.length === uniqueIds.size;
  }

  private validateMathematicalAccuracy(journalEntries: JournalEntry[]): any {
    const accuracy = {
      debitCreditBalance: this.validateAccountBalance(journalEntries),
      amountValidation: this.validateAmountFields(journalEntries),
      calculationAccuracy: this.validateCalculations(journalEntries),
    };
    
    return accuracy;
  }

  private validateAmountFields(journalEntries: JournalEntry[]): boolean {
    return journalEntries.every(entry => {
      const debit = parseFloat(entry.debitAmount?.toString() || '0');
      const credit = parseFloat(entry.creditAmount?.toString() || '0');
      
      return !isNaN(debit) && !isNaN(credit) && debit >= 0 && credit >= 0;
    });
  }

  private validateCalculations(journalEntries: JournalEntry[]): boolean {
    // Validate that calculations are mathematically correct
    // This could include tax calculations, interest calculations, etc.
    return true; // Placeholder - implement specific calculation validations
  }

  private validateAccountingPrinciples(journalEntries: JournalEntry[]): any {
    return {
      doubleEntryPrinciple: this.validateAccountBalance(journalEntries),
      consistencyPrinciple: this.validateConsistency(journalEntries),
      materialityPrinciple: this.validateMateriality(journalEntries),
    };
  }

  private validateConsistency(journalEntries: JournalEntry[]): boolean {
    // Check for consistency in account codes and names
    const accountMap = new Map<string, string>();
    
    for (const entry of journalEntries) {
      if (accountMap.has(entry.accountCode)) {
        if (accountMap.get(entry.accountCode) !== entry.accountName) {
          return false; // Inconsistent account name for same code
        }
      } else {
        accountMap.set(entry.accountCode, entry.accountName);
      }
    }
    
    return true;
  }

  private validateMateriality(journalEntries: JournalEntry[]): boolean {
    // Check for materiality principle compliance
    const totalAmount = journalEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.debitAmount?.toString() || '0') + parseFloat(entry.creditAmount?.toString() || '0'), 0
    );
    
    const materialityThreshold = totalAmount * 0.05; // 5% threshold
    
    return journalEntries.every(entry => {
      const entryAmount = parseFloat(entry.debitAmount?.toString() || '0') + parseFloat(entry.creditAmount?.toString() || '0');
      return entryAmount >= materialityThreshold || entry.narration; // Immaterial entries should have narration
    });
  }

  private validateAuditTrailCompleteness(document: Document, journalEntries: JournalEntry[]): any {
    return {
      documentTraceability: !!document.id,
      journalEntryTraceability: journalEntries.every(entry => entry.documentId === document.id),
      timestampCompleteness: journalEntries.every(entry => entry.createdAt),
      userTraceability: journalEntries.every(entry => entry.createdBy),
    };
  }
}

export const complianceCheckerService = new ComplianceCheckerService();
