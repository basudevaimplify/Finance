#!/usr/bin/env node
/**
 * End-to-End Testing Suite for QRT Closure Platform
 * Tests all major functionality including authentication, document processing, AI agents, and compliance
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class E2ETestSuite {
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:8000';
  private frontendUrl = 'http://localhost:5000';
  
  constructor() {
    console.log('🧪 QRT Closure Platform - End-to-End Test Suite');
    console.log('=' * 60);
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`✓ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: false, error: error.message, duration });
      console.log(`✗ ${name} (${duration}ms): ${error.message}`);
    }
  }

  async testHealthEndpoints(): Promise<void> {
    // Test Python backend health
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (response.status !== 200) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    
    // Test frontend accessibility
    const frontendResponse = await fetch(this.frontendUrl);
    if (frontendResponse.status !== 200) {
      throw new Error(`Frontend health check failed: ${frontendResponse.status}`);
    }
  }

  async testAuthentication(): Promise<void> {
    // Test user registration
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User',
      company_name: 'Test Company'
    };

    const registerResponse = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (registerResponse.status !== 201) {
      throw new Error(`Registration failed: ${registerResponse.status}`);
    }

    // Test user login
    const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;

    // Test protected endpoint
    const userResponse = await fetch(`${this.baseUrl}/api/auth/user`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (userResponse.status !== 200) {
      throw new Error(`Protected endpoint failed: ${userResponse.status}`);
    }

    return accessToken;
  }

  async testDocumentUpload(accessToken: string): Promise<void> {
    // Create test CSV file
    const testCsvContent = `Date,Description,Amount,Account
2024-01-01,Test Transaction 1,1000.00,Cash
2024-01-02,Test Transaction 2,500.00,Bank
2024-01-03,Test Transaction 3,750.00,Revenue`;

    const formData = new FormData();
    formData.append('file', new Blob([testCsvContent], { type: 'text/csv' }), 'test_document.csv');

    const uploadResponse = await fetch(`${this.baseUrl}/api/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData
    });

    if (uploadResponse.status !== 201) {
      throw new Error(`Document upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    return uploadData.document_id;
  }

  async testAIAgents(accessToken: string, documentId: string): Promise<void> {
    // Test AI workflow execution
    const workflowResponse = await fetch(`${this.baseUrl}/api/workflows/execute`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_id: documentId,
        workflow_type: 'full_processing'
      })
    });

    if (workflowResponse.status !== 200) {
      throw new Error(`AI workflow execution failed: ${workflowResponse.status}`);
    }

    // Test individual agents
    const agents = ['classifier', 'extractor', 'validator', 'journal'];
    
    for (const agent of agents) {
      const agentResponse = await fetch(`${this.baseUrl}/api/agents/${agent}/process`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ document_id: documentId })
      });

      if (agentResponse.status !== 200) {
        throw new Error(`Agent ${agent} processing failed: ${agentResponse.status}`);
      }
    }
  }

  async testComplianceEngine(accessToken: string): Promise<void> {
    // Test GST compliance
    const gstResponse = await fetch(`${this.baseUrl}/api/compliance/gst/validate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gst_number: '29ABCDE1234F1Z5',
        transaction_data: {
          cgst: 100,
          sgst: 100,
          igst: 0,
          total: 1200
        }
      })
    });

    if (gstResponse.status !== 200) {
      throw new Error(`GST compliance check failed: ${gstResponse.status}`);
    }

    // Test TDS compliance
    const tdsResponse = await fetch(`${this.baseUrl}/api/compliance/tds/validate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_amount: 50000,
        tds_rate: 10,
        deducted_amount: 5000
      })
    });

    if (tdsResponse.status !== 200) {
      throw new Error(`TDS compliance check failed: ${tdsResponse.status}`);
    }
  }

  async testFinancialReporting(accessToken: string): Promise<void> {
    // Test trial balance generation
    const trialBalanceResponse = await fetch(`${this.baseUrl}/api/reports/trial-balance`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        period: '2024-Q1',
        format: 'json'
      })
    });

    if (trialBalanceResponse.status !== 200) {
      throw new Error(`Trial balance generation failed: ${trialBalanceResponse.status}`);
    }

    // Test P&L statement
    const plResponse = await fetch(`${this.baseUrl}/api/reports/profit-loss`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        period: '2024-Q1',
        format: 'json'
      })
    });

    if (plResponse.status !== 200) {
      throw new Error(`P&L statement generation failed: ${plResponse.status}`);
    }

    // Test balance sheet
    const balanceSheetResponse = await fetch(`${this.baseUrl}/api/reports/balance-sheet`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        period: '2024-Q1',
        format: 'json'
      })
    });

    if (balanceSheetResponse.status !== 200) {
      throw new Error(`Balance sheet generation failed: ${balanceSheetResponse.status}`);
    }
  }

  async testMCAFiling(accessToken: string): Promise<void> {
    // Test AOC-4 generation
    const aoc4Response = await fetch(`${this.baseUrl}/api/mca/aoc-4/generate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_info: {
          cin: 'U12345MH2020PTC123456',
          name: 'Test Company Pvt Ltd',
          financial_year: '2024-25'
        }
      })
    });

    if (aoc4Response.status !== 200) {
      throw new Error(`AOC-4 generation failed: ${aoc4Response.status}`);
    }

    // Test MGT-7 generation
    const mgt7Response = await fetch(`${this.baseUrl}/api/mca/mgt-7/generate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_info: {
          cin: 'U12345MH2020PTC123456',
          name: 'Test Company Pvt Ltd',
          financial_year: '2024-25'
        }
      })
    });

    if (mgt7Response.status !== 200) {
      throw new Error(`MGT-7 generation failed: ${mgt7Response.status}`);
    }
  }

  async testMLAnomalyDetection(accessToken: string): Promise<void> {
    // Test anomaly detection
    const anomalyResponse = await fetch(`${this.baseUrl}/api/ml/anomaly-detection`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [
          { amount: 1000, category: 'revenue', date: '2024-01-01' },
          { amount: 500, category: 'expense', date: '2024-01-02' },
          { amount: 1000000, category: 'revenue', date: '2024-01-03' } // Anomaly
        ]
      })
    });

    if (anomalyResponse.status !== 200) {
      throw new Error(`ML anomaly detection failed: ${anomalyResponse.status}`);
    }

    const anomalyData = await anomalyResponse.json();
    if (!anomalyData.anomalies || anomalyData.anomalies.length === 0) {
      throw new Error('ML anomaly detection did not detect expected anomaly');
    }
  }

  async testDataSourceConnections(accessToken: string): Promise<void> {
    // Test data source configuration
    const dataSourceResponse = await fetch(`${this.baseUrl}/api/data-sources/test-connection`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_type: 'database',
        connection_config: {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_pass'
        }
      })
    });

    if (dataSourceResponse.status !== 200) {
      throw new Error(`Data source connection test failed: ${dataSourceResponse.status}`);
    }
  }

  async testAuditTrail(accessToken: string): Promise<void> {
    // Test audit trail retrieval
    const auditResponse = await fetch(`${this.baseUrl}/api/audit/trail`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (auditResponse.status !== 200) {
      throw new Error(`Audit trail retrieval failed: ${auditResponse.status}`);
    }

    const auditData = await auditResponse.json();
    if (!Array.isArray(auditData.entries)) {
      throw new Error('Audit trail should return array of entries');
    }
  }

  async testUserFlow(accessToken: string): Promise<void> {
    // Test user flow tracking
    const flowResponse = await fetch(`${this.baseUrl}/api/user-flow/track`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'document_upload',
        metadata: { document_type: 'csv', size: 1024 }
      })
    });

    if (flowResponse.status !== 200) {
      throw new Error(`User flow tracking failed: ${flowResponse.status}`);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting comprehensive test suite...\n');

    // System health tests
    await this.runTest('Health Endpoints', () => this.testHealthEndpoints());

    // Authentication tests
    let accessToken: string;
    await this.runTest('Authentication System', async () => {
      accessToken = await this.testAuthentication();
    });

    if (!accessToken) {
      console.log('❌ Authentication failed - stopping tests');
      return;
    }

    // Document processing tests
    let documentId: string;
    await this.runTest('Document Upload', async () => {
      documentId = await this.testDocumentUpload(accessToken);
    });

    // AI and ML tests
    if (documentId) {
      await this.runTest('AI Agent Processing', () => this.testAIAgents(accessToken, documentId));
    }
    await this.runTest('ML Anomaly Detection', () => this.testMLAnomalyDetection(accessToken));

    // Compliance tests
    await this.runTest('Compliance Engine', () => this.testComplianceEngine(accessToken));

    // Financial reporting tests
    await this.runTest('Financial Reporting', () => this.testFinancialReporting(accessToken));

    // MCA filing tests
    await this.runTest('MCA Filing System', () => this.testMCAFiling(accessToken));

    // Data management tests
    await this.runTest('Data Source Connections', () => this.testDataSourceConnections(accessToken));
    await this.runTest('Audit Trail', () => this.testAuditTrail(accessToken));
    await this.runTest('User Flow Tracking', () => this.testUserFlow(accessToken));

    this.generateReport();
  }

  generateReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '=' * 60);
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('=' * 60);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }

    // Generate detailed report file
    const reportData = {
      summary: {
        total_tests: totalTests,
        passed: passedTests,
        failed: failedTests,
        success_rate: ((passedTests / totalTests) * 100).toFixed(1),
        total_duration: totalDuration,
        timestamp: new Date().toISOString()
      },
      results: this.results
    };

    fs.writeFileSync('E2E_Test_Report.md', this.generateMarkdownReport(reportData));
    console.log('\n📄 Detailed report saved to E2E_Test_Report.md');
  }

  generateMarkdownReport(data: any): string {
    const { summary, results } = data;
    
    let report = `# QRT Closure Platform - E2E Test Report\n\n`;
    report += `**Generated:** ${summary.timestamp}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Tests:** ${summary.total_tests}\n`;
    report += `- **Passed:** ${summary.passed}\n`;
    report += `- **Failed:** ${summary.failed}\n`;
    report += `- **Success Rate:** ${summary.success_rate}%\n`;
    report += `- **Total Duration:** ${summary.total_duration}ms\n\n`;

    report += `## Test Results\n\n`;
    results.forEach((result: TestResult) => {
      const status = result.passed ? '✅' : '❌';
      report += `### ${status} ${result.name}\n`;
      report += `- **Duration:** ${result.duration}ms\n`;
      if (!result.passed) {
        report += `- **Error:** ${result.error}\n`;
      }
      report += `\n`;
    });

    return report;
  }
}

// Run the test suite
const testSuite = new E2ETestSuite();
testSuite.runAllTests().catch(console.error);