import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageLayout from "@/components/layout/PageLayout";
import FileDropzone from "@/components/file-upload/file-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Trash2, Eye, CheckCircle, XCircle, AlertCircle, Calendar, FileIcon, Upload, HelpCircle, Edit, Cog, Calculator, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document } from "@shared/schema";

interface DocumentRequirement {
  id: string;
  category: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'as-needed';
  dueDate?: string;
  fileTypes: string[];
  isRequired: boolean;
  isUploaded: boolean;
  uploadedFiles: string[];
  compliance: string[];
  documentType: 'primary' | 'derived' | 'calculated';
  derivedFrom?: string[];
  canGenerate?: boolean;
}

export default function DocumentUpload() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('requirements');

  // Action handlers for document operations
  const handleUpload = (docId: string) => {
    setActiveTab('upload');
    toast({
      title: "Upload Document",
      description: "Switched to upload tab. Select files to upload.",
    });
  };

  const handleGenerate = async (docId: string, docName: string) => {
    toast({
      title: "Generating Document",
      description: `Processing ${docName}... This may take a few moments.`,
    });
    
    try {
      let endpoint = '';
      switch (docId) {
        case 'gstr_2a':
          endpoint = '/api/reports/gstr-2a';
          break;
        case 'gstr_3b':
          endpoint = '/api/reports/gstr-3b';
          break;
        case 'form_26q':
          endpoint = '/api/reports/form-26q';
          break;
        case 'depreciation_schedule':
          endpoint = '/api/reports/depreciation-schedule';
          break;
        case 'journal_entries':
          endpoint = '/api/journal-entries/generate';
          break;
        case 'bank_reconciliation':
          endpoint = '/api/reports/bank-reconciliation';
          break;
        default:
          throw new Error(`Generation not implemented for ${docName}`);
      }
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ period: 'Q3_2025' }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate document');
      }
      
      const data = await response.json();
      
      toast({
        title: "Document Generated",
        description: `${docName} has been generated successfully. You can view it in the Financial Reports section.`,
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${docName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCalculate = async (docId: string, docName: string) => {
    toast({
      title: "Calculating Report",
      description: `Generating ${docName}... This may take a few moments.`,
    });
    
    try {
      let endpoint = '';
      switch (docId) {
        case 'profit_loss_statement':
          endpoint = '/api/reports/profit-loss';
          break;
        case 'balance_sheet':
          endpoint = '/api/reports/balance-sheet';
          break;
        case 'cash_flow_statement':
          endpoint = '/api/reports/cash-flow';
          break;
        case 'depreciation_schedule':
          endpoint = '/api/reports/depreciation-schedule';
          break;
        default:
          throw new Error(`Calculation not implemented for ${docName}`);
      }
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ period: 'Q3_2025' }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate document');
      }
      
      const data = await response.json();
      
      toast({
        title: "Calculation Complete",
        description: `${docName} has been calculated successfully. You can view it in the Financial Reports section.`,
      });
      
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: `Failed to calculate ${docName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleView = (docId: string, docName: string) => {
    toast({
      title: "View Document",
      description: `Opening ${docName}...`,
    });
    // TODO: Implement view logic
  };

  const handleEdit = (docId: string, docName: string) => {
    toast({
      title: "Edit Document",
      description: `Opening ${docName} for editing...`,
    });
    // TODO: Implement edit logic
  };

  const handleDelete = (docId: string, docName: string) => {
    toast({
      title: "Delete Document",
      description: `Are you sure you want to delete ${docName}?`,
      variant: "destructive",
    });
    // TODO: Implement delete logic
  };

  const handleDownload = async (docId: string, docName: string) => {
    toast({
      title: "Download Document",
      description: `Downloading ${docName}...`,
    });
    
    try {
      let endpoint = '';
      switch (docId) {
        case 'gstr_2a':
          endpoint = '/api/reports/gstr-2a';
          break;
        case 'gstr_3b':
          endpoint = '/api/reports/gstr-3b';
          break;
        case 'form_26q':
          endpoint = '/api/reports/form-26q';
          break;
        case 'depreciation_schedule':
          endpoint = '/api/reports/depreciation-schedule';
          break;
        case 'trial_balance':
          endpoint = '/api/reports/trial-balance';
          break;
        case 'profit_loss_statement':
          endpoint = '/api/reports/profit-loss';
          break;
        case 'balance_sheet':
          endpoint = '/api/reports/balance-sheet';
          break;
        case 'cash_flow_statement':
          endpoint = '/api/reports/cash-flow';
          break;
        default:
          throw new Error(`Download not implemented for ${docName}`);
      }
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ period: 'Q3_2025' }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const data = await response.json();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `${docName} has been downloaded successfully.`,
      });
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${docName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleHelp = (docId: string, docName: string) => {
    toast({
      title: "Help",
      description: `Need help with ${docName}? Check the documentation or contact support.`,
    });
    // TODO: Implement help logic
  };

  const handleRefresh = (docId: string, docName: string) => {
    toast({
      title: "Refresh Document",
      description: `Refreshing ${docName}...`,
    });
    // TODO: Implement refresh logic
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  // Define comprehensive document requirements
  const documentRequirements: DocumentRequirement[] = [
    // PRIMARY DOCUMENTS - Must be uploaded
    {
      id: 'vendor_invoices',
      category: 'Primary Documents',
      name: 'Vendor Invoices',
      description: 'All vendor invoices and purchase documents',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV', 'PDF'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'GST Act'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'fixed_asset_register',
      category: 'Primary Documents',
      name: 'Fixed Asset Register',
      description: 'Complete fixed asset register with depreciation calculations',
      priority: 'high',
      frequency: 'quarterly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS 16'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'purchase_register',
      category: 'Primary Documents',
      name: 'Purchase Register',
      description: 'Complete purchase register with GST details',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'Companies Act 2013'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'sales_register',
      category: 'Primary Documents',
      name: 'Sales Register',
      description: 'Complete sales register with GST details',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'Companies Act 2013'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'tds_certificates',
      category: 'Primary Documents',
      name: 'TDS Certificates',
      description: 'Form 16A and other TDS certificates',
      priority: 'high',
      frequency: 'quarterly',
      dueDate: '2025-01-31',
      fileTypes: ['PDF', 'Excel'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Income Tax Act', 'TDS Rules'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'bank_statements',
      category: 'Primary Documents',
      name: 'Bank Statements',
      description: 'Monthly bank statements for all accounts',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['PDF', 'Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'Banking Regulation Act'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'director_report',
      category: 'Primary Documents',
      name: 'Directors Report',
      description: 'Annual directors report and board resolutions',
      priority: 'medium',
      frequency: 'yearly',
      dueDate: '2025-03-31',
      fileTypes: ['PDF', 'Word'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'MCA Rules'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'auditor_report',
      category: 'Primary Documents',
      name: 'Auditor Report',
      description: 'Independent auditor report and management letter',
      priority: 'medium',
      frequency: 'yearly',
      dueDate: '2025-03-31',
      fileTypes: ['PDF'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'Auditing Standards'],
      documentType: 'primary',
      canGenerate: false
    },
    {
      id: 'salary_register',
      category: 'Primary Documents',
      name: 'Salary Register',
      description: 'Monthly salary register with employee details and deductions',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'Labour Laws'],
      documentType: 'primary',
      canGenerate: false
    },

    // DERIVED DOCUMENTS - Generated from primary documents
    {
      id: 'journal_entries',
      category: 'Derived Documents',
      name: 'Journal Entries',
      description: 'Generated automatically from vendor invoices, sales data, and bank transactions',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS'],
      documentType: 'derived',
      derivedFrom: ['vendor_invoices', 'sales_register', 'bank_statements'],
      canGenerate: true
    },
    {
      id: 'trial_balance',
      category: 'Derived Documents',
      name: 'Trial Balance',
      description: 'Generated from journal entries and GL postings',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS'],
      documentType: 'derived',
      derivedFrom: ['journal_entries'],
      canGenerate: true
    },
    {
      id: 'gstr_2a',
      category: 'Derived Documents',
      name: 'GSTR-2A',
      description: 'Generated from purchase register and vendor invoices',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-20',
      fileTypes: ['Excel', 'CSV', 'JSON'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'CGST Rules'],
      documentType: 'derived',
      derivedFrom: ['purchase_register'],
      canGenerate: true
    },
    {
      id: 'gstr_3b',
      category: 'Derived Documents',
      name: 'GSTR-3B',
      description: 'Generated from sales and purchase registers',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-20',
      fileTypes: ['Excel', 'CSV', 'JSON'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'CGST Rules'],
      documentType: 'derived',
      derivedFrom: ['sales_register', 'purchase_register'],
      canGenerate: true
    },
    {
      id: 'form_26q',
      category: 'Derived Documents',
      name: 'Form 26Q',
      description: 'Generated from TDS certificates and deduction records',
      priority: 'high',
      frequency: 'quarterly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV', 'TXT'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Income Tax Act', 'TDS Rules'],
      documentType: 'derived',
      derivedFrom: ['tds_certificates'],
      canGenerate: true
    },
    {
      id: 'bank_reconciliation',
      category: 'Derived Documents',
      name: 'Bank Reconciliation',
      description: 'Generated from bank statements and journal entries',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS'],
      documentType: 'derived',
      derivedFrom: ['bank_statements', 'journal_entries'],
      canGenerate: true
    },

    // CALCULATED DOCUMENTS - System calculations and reports
    {
      id: 'profit_loss_statement',
      category: 'Calculated Documents',
      name: 'Profit & Loss Statement',
      description: 'Calculated from trial balance and journal entries',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'PDF'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS'],
      documentType: 'calculated',
      derivedFrom: ['trial_balance', 'journal_entries'],
      canGenerate: true
    },
    {
      id: 'balance_sheet',
      category: 'Calculated Documents',
      name: 'Balance Sheet',
      description: 'Calculated from trial balance and fixed assets',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'PDF'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS'],
      documentType: 'calculated',
      derivedFrom: ['trial_balance', 'fixed_asset_register'],
      canGenerate: true
    },
    {
      id: 'cash_flow_statement',
      category: 'Calculated Documents',
      name: 'Cash Flow Statement',
      description: 'Calculated from P&L, balance sheet, and bank statements',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'PDF'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS'],
      documentType: 'calculated',
      derivedFrom: ['profit_loss_statement', 'balance_sheet', 'bank_statements'],
      canGenerate: true
    },
    {
      id: 'depreciation_schedule',
      category: 'Calculated Documents',
      name: 'Depreciation Schedule',
      description: 'Calculated from fixed asset register',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'PDF'],
      isRequired: false,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS 16'],
      documentType: 'calculated',
      derivedFrom: ['fixed_asset_register'],
      canGenerate: true
    }
  ];

  // Update document requirements based on uploaded documents
  const updatedRequirements = documentRequirements.map(req => {
    const matchingDocs = documents?.filter(doc => {
      const docType = doc.documentType?.toLowerCase();
      const reqId = req.id.toLowerCase();
      return docType === reqId || docType === reqId.replace('_', '') || 
             (docType === 'gst' && reqId.includes('gstr')) ||
             (docType === 'tds' && reqId.includes('tds')) ||
             (docType === 'journal' && reqId.includes('journal')) ||
             (docType === 'bank_statement' && reqId.includes('bank'));
    }) || [];

    return {
      ...req,
      isUploaded: matchingDocs.length > 0,
      uploadedFiles: matchingDocs.map(doc => doc.originalName)
    };
  });

  // Calculate completion statistics (only for primary documents that must be uploaded)
  const totalRequired = updatedRequirements.filter(req => req.documentType === 'primary' && req.isRequired).length;
  const completedRequired = updatedRequirements.filter(req => req.documentType === 'primary' && req.isRequired && req.isUploaded).length;
  const completionPercentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  // Filter by category
  const categories = ['all', ...Array.from(new Set(updatedRequirements.map(req => req.category)))];
  const filteredRequirements = selectedCategory === 'all' 
    ? updatedRequirements 
    : updatedRequirements.filter(req => req.category === selectedCategory);

  // Get status icon
  const getStatusIcon = (requirement: DocumentRequirement) => {
    if (requirement.isUploaded) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (requirement.isRequired) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get document type badge
  const getDocumentTypeBadge = (documentType: string) => {
    switch (documentType) {
      case 'primary':
        return <Badge className="bg-blue-100 text-blue-800">Must Upload</Badge>;
      case 'derived':
        return <Badge className="bg-green-100 text-green-800">System Generated</Badge>;
      case 'calculated':
        return <Badge className="bg-purple-100 text-purple-800">Auto Calculated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="badge-compliant">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-accent/10 text-accent">Processing</Badge>;
      case 'failed':
        return <Badge className="badge-non-compliant">Failed</Badge>;
      default:
        return <Badge className="badge-pending">Uploaded</Badge>;
    }
  };

  const getDocumentTypeDisplay = (type: string) => {
    switch (type) {
      case 'journal': return 'Journal';
      case 'gst': return 'GST Returns';
      case 'tds': return 'TDS Certificate';
      case 'trial_balance': return 'Trial Balance';
      case 'fixed_asset_register': return 'Fixed Asset Register';
      case 'purchase_register': return 'Purchase Register';
      case 'sales_register': return 'Sales Register';
      case 'bank_statement': return 'Bank Statement';
      default: return 'Other';
    }
  };

  return (
    <PageLayout title="Document Upload">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document Upload</h1>
          <p className="text-muted-foreground">
            Upload primary source documents - the system will automatically generate journal entries, reports, and compliance documents from your uploads
          </p>
        </div>

        {/* Completion Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Document Completion Status</span>
              <Badge variant="outline">
                {completedRequired}/{totalRequired} Complete
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completionPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{completedRequired} Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{totalRequired - completedRequired} Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>{updatedRequirements.filter(req => req.documentType === 'primary' && req.priority === 'high' && !req.isUploaded).length} High Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{updatedRequirements.filter(req => req.documentType === 'primary' && req.dueDate && new Date(req.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length} Due Soon</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requirements">Document Requirements</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="uploaded">Uploaded Files</TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="space-y-4">
            {/* Category Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Filter by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All Categories' : category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Requirements Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCategory === 'all' ? 'All Document Requirements' : `${selectedCategory} Requirements`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Document Name</TableHead>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead className="w-[100px]">Priority</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[120px]">Frequency</TableHead>
                        <TableHead className="w-[120px]">Due Date</TableHead>
                        <TableHead className="w-[150px]">File Types</TableHead>
                        <TableHead className="w-[200px]">Generated From</TableHead>
                        <TableHead className="w-[200px]">Compliance</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequirements.map((requirement) => (
                        <TableRow key={requirement.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(requirement)}
                              <span>{requirement.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {requirement.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getDocumentTypeBadge(requirement.documentType)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(requirement.priority)}
                          </TableCell>
                          <TableCell>
                            {requirement.isUploaded ? (
                              <Badge className="bg-green-100 text-green-800">
                                Complete
                              </Badge>
                            ) : requirement.documentType === 'primary' ? (
                              <Badge variant="destructive">
                                Must Upload
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {requirement.canGenerate ? 'Can Generate' : 'Pending'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-sm">{requirement.frequency}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {requirement.dueDate ? (
                              <span className="text-sm">
                                {new Date(requirement.dueDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {requirement.fileTypes.map((type, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {requirement.derivedFrom && requirement.derivedFrom.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {requirement.derivedFrom.map((source, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {documentRequirements.find(req => req.id === source)?.name || source}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {requirement.compliance.map((comp, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {/* Primary Documents - Upload Actions */}
                              {requirement.documentType === 'primary' && !requirement.isUploaded && (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleUpload(requirement.id)}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleHelp(requirement.id, requirement.name)}
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Primary Documents - View/Edit Actions */}
                              {requirement.documentType === 'primary' && requirement.isUploaded && (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleView(requirement.id, requirement.name)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleEdit(requirement.id, requirement.name)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs text-destructive"
                                    onClick={() => handleDelete(requirement.id, requirement.name)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Derived Documents - Generate Actions */}
                              {requirement.documentType === 'derived' && requirement.canGenerate && (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    disabled={false}
                                    onClick={() => handleGenerate(requirement.id, requirement.name)}
                                  >
                                    <Cog className="h-3 w-3 mr-1" />
                                    Generate
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleDownload(requirement.id, requirement.name)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Calculated Documents - Auto-Calculate Actions */}
                              {requirement.documentType === 'calculated' && (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="text-xs"
                                    disabled={!documentRequirements.filter(req => req.documentType === 'derived').every(req => req.isUploaded)}
                                    onClick={() => handleCalculate(requirement.id, requirement.name)}
                                  >
                                    <Calculator className="h-3 w-3 mr-1" />
                                    Calculate
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleView(requirement.id, requirement.name)}
                                  >
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* View Generated/Calculated Documents */}
                              {(requirement.documentType === 'derived' || requirement.documentType === 'calculated') && requirement.isUploaded && (
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleView(requirement.id, requirement.name)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleDownload(requirement.id, requirement.name)}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleRefresh(requirement.id, requirement.name)}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload your financial documents. The system will automatically classify and process them.
                </p>
              </CardHeader>
              <CardContent>
                <FileDropzone />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploaded" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner h-8 w-8" />
                  </div>
                ) : !documents || documents.length === 0 ? (
                  <div className="empty-state">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                    <p className="text-sm text-gray-400">Upload your first document to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="table-header">Document</TableHead>
                          <TableHead className="table-header">Type</TableHead>
                          <TableHead className="table-header">Status</TableHead>
                          <TableHead className="table-header">Size</TableHead>
                          <TableHead className="table-header">Uploaded</TableHead>
                          <TableHead className="table-header">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="table-cell">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{doc.originalName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="table-cell">
                              {doc.documentType ? getDocumentTypeDisplay(doc.documentType) : 'Unknown'}
                            </TableCell>
                            <TableCell className="table-cell">
                              {getStatusBadge(doc.status)}
                            </TableCell>
                            <TableCell className="table-cell">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </TableCell>
                            <TableCell className="table-cell">
                              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="table-cell">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
