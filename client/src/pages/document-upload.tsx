import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/PageLayout";
import FileDropzone from "@/components/file-upload/file-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Trash2, Eye, CheckCircle, XCircle, AlertCircle, Calendar, FileIcon, Upload, HelpCircle, Edit, Cog, Calculator, RefreshCw, ArrowRight, Database } from "lucide-react";
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
  const queryClient = useQueryClient();
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
    console.log('Document Upload - Starting generation for:', docId, docName);

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
        case 'trial_balance':
          endpoint = '/api/reports/trial-balance/generate';
          break;
        case 'bank_reconciliation':
          endpoint = '/api/reports/bank-reconciliation';
          break;
        default:
          throw new Error(`Generation not implemented for ${docName}`);
      }

      console.log('Document Upload - Using endpoint:', endpoint);

      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('Document Upload - No access token found, using demo token');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo-token'}`,
        },
        body: JSON.stringify({ period: 'Q3_2025' }),
        credentials: 'include',
      });

      console.log('Document Upload - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Document Upload - Response error:', errorText);
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      console.log('Document Upload - Response data:', data);

      toast({
        title: "Document Generated",
        description: `${docName} has been generated successfully. You can view it in the Financial Reports section.`,
      });

    } catch (error) {
      console.error('Document Upload - Generation error:', error);
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

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loadingExtractedData, setLoadingExtractedData] = useState(false);

  const handleView = async (docId: string, docName: string) => {
    try {
      setLoadingExtractedData(true);
      setViewModalOpen(true);

      // Check if this is a requirement ID or actual document ID
      const actualDocument = documents?.find(doc => doc.id === docId);
      const requirement = documentRequirements.find(req => req.id === docId);

      if (actualDocument) {
        // This is an actual uploaded document
        setViewingDocument(actualDocument);
        console.log('Viewing actual document:', actualDocument);

        // Fetch all extracted data first
        const response = await apiRequest(`/api/extracted-data?period=Q1_2025&docType=all`);
        const allData = await response.json();
        console.log('All extracted data:', allData);

        // Find the specific document's data by matching document ID
        const documentData = allData.find((item: any) => {
          console.log('Comparing:', item.documentId, 'with', docId);
          return item.documentId === docId || item.id === docId;
        });

        console.log('Found document data:', documentData);
        setExtractedData(documentData);
      } else if (requirement) {
        // This is a requirement - find uploaded documents of this type
        const matchingDocuments = documents?.filter(doc =>
          doc.documentType === requirement.id
        );

        if (matchingDocuments && matchingDocuments.length > 0) {
          // Use the first matching document
          const document = matchingDocuments[0];
          setViewingDocument(document);
          console.log('Viewing document for requirement:', document);

          // Fetch all extracted data first
          const response = await apiRequest(`/api/extracted-data?period=Q1_2025&docType=all`);
          const allData = await response.json();
          console.log('All extracted data:', allData);

          // Find the specific document's data by matching document ID
          const documentData = allData.find((item: any) => {
            console.log('Comparing:', item.documentId, 'with', document.id);
            return item.documentId === document.id || item.id === document.id;
          });

          console.log('Found document data:', documentData);
          setExtractedData(documentData);
        } else {
          toast({
            title: "No Document Found",
            description: `No uploaded document found for ${docName}`,
            variant: "destructive",
          });
          setViewModalOpen(false);
          return;
        }
      } else {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive",
        });
        setViewModalOpen(false);
        return;
      }

    } catch (error) {
      console.error('Error loading document data:', error);
      toast({
        title: "Error",
        description: "Failed to load document data",
        variant: "destructive",
      });
    } finally {
      setLoadingExtractedData(false);
    }
  };

  const handleEdit = (docId: string, docName: string) => {
    toast({
      title: "Edit Document",
      description: `Opening ${docName} for editing...`,
    });
    // TODO: Implement edit logic
  };

  // Delete mutation for actual uploaded documents
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer demo-token`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      // Force a refetch to ensure immediate UI update
      refetchDocuments();
    },
    onError: (error) => {
      console.error("Document deletion error:", error);
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: `Failed to delete document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (docId: string, docName: string) => {
    toast({
      title: "Delete Document",
      description: `Are you sure you want to delete ${docName}?`,
      variant: "destructive",
    });
    // TODO: Implement delete logic for document requirements (not actual uploaded docs)
  };

  const handleDownload = async (docId: string, docName: string) => {
    toast({
      title: "Download Document",
      description: `Downloading ${docName}...`,
    });
    
    try {
      let endpoint = '';
      switch (docId) {
        case 'journal_entries':
          endpoint = '/api/journal-entries/download?format=csv&period=2025';
          break;
        case 'trial_balance':
          endpoint = '/api/trial-balance/download?format=csv&period=2025';
          break;
        case 'gstr_2a':
          endpoint = '/api/gstr-2a/download?format=csv&period=2025';
          break;
        case 'gstr_3b':
          endpoint = '/api/gstr-3b/download?format=csv&period=2025';
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
      
      // For download endpoints, use GET request and handle file download
      if (endpoint.includes('/download')) {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to download document');
        }
        
        // Get the filename from Content-Disposition header
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${docName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // For other endpoints, use POST request and create JSON download
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ period: '2025' }),
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
      }
      
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

  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  // Fetch extracted data to check which documents are available in Data Tables
  const { data: allExtractedData } = useQuery({
    queryKey: ['/api/extracted-data?period=Q1_2025&docType=all'],
  });

  // Helper functions for display
  const getDocumentTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'vendor_invoice': 'Vendor Invoice',
      'purchase_register': 'Purchase Register',
      'sales_register': 'Sales Register',
      'tds': 'TDS Certificate',
      'bank_statement': 'Bank Statement',
      'fixed_assets': 'Fixed Assets',
      'salary_register': 'Salary Register'
    };
    return typeMap[type] || type.replace('_', ' ').toUpperCase();
  };

  const getStatusBadge = (status: string, documentId: string) => {
    // Check if document has extracted data available in Data Tables
    const hasExtractedData = allExtractedData?.some((item: any) =>
      item.documentId === documentId || item.id === documentId
    );

    const statusBadge = (() => {
      switch (status) {
        case 'classified':
          return <Badge className="bg-green-100 text-green-800">Classified</Badge>;
        case 'uploaded':
          return <Badge className="bg-blue-100 text-blue-800">Uploaded</Badge>;
        case 'processing':
          return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    })();

    return (
      <div className="flex flex-col gap-1">
        {statusBadge}
        {hasExtractedData && (
          <Badge className="bg-purple-100 text-purple-800 text-xs">
            <Database className="h-3 w-3 mr-1" />
            In Data Tables
          </Badge>
        )}
      </div>
    );
  };

  // Force refresh function to ensure consistency across all modules
  const handleRefreshDocuments = () => {
    refetchDocuments();
    toast({
      title: "Refreshing Documents",
      description: "Updating document list from all sources...",
    });
  };

  // Helper function to map document types to requirement IDs
  const mapDocumentTypeToRequirementId = (documentType: string): string => {
    const mapping: Record<string, string> = {
      'vendor_invoice': 'vendor_invoices',
      'purchase_register': 'purchase_register', 
      'sales_register': 'sales_register',
      'tds': 'tds_certificates',
      'bank_statement': 'bank_statements',
      'salary_register': 'salary_register',
      'fixed_assets': 'fixed_asset_register'
    };
    return mapping[documentType] || 'vendor_invoices';
  };

  // Define comprehensive document requirements and update with uploaded documents
  const getDocumentRequirements = (): DocumentRequirement[] => {
    const baseRequirements: DocumentRequirement[] = [
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

    // Update document requirements based on REAL-TIME uploaded documents from database
    return baseRequirements.map(req => {
      const matchingDocs = documents?.filter(doc => {
        const docType = doc.documentType?.toLowerCase();
        const docName = doc.originalName?.toLowerCase() || '';
        const reqId = req.id.toLowerCase();
        
        // Enhanced matching logic for better real-time document detection
        switch (req.id) {
          case 'vendor_invoices':
            return docType === 'vendor_invoice' || docName.includes('invoice') || docName.includes('vendor');
          case 'purchase_register':
            return docType === 'purchase_register' || docName.includes('purchase_register');
          case 'sales_register':
            return docType === 'sales_register' || docName.includes('sales_register');
          case 'tds_certificates':
            return docType === 'tds' || docName.includes('tds') || docName.includes('certificate');
          case 'bank_statements':
            return docType === 'bank_statement' || docName.includes('bank') || docName.includes('statement');
          case 'fixed_asset_register':
            return docType === 'fixed_assets' || docName.includes('asset') || docName.includes('fixed');
          case 'salary_register':
            return docType === 'salary_register' || docName.includes('salary') || docName.includes('payroll');
          case 'directors_report':
            return docType === 'directors_report' || docName.includes('director');
          case 'auditor_report':
            return docType === 'auditor_report' || docName.includes('auditor');
          default:
            return docType === reqId || docType === reqId.replace('_', '');
        }
      }) || [];

      return {
        ...req,
        isUploaded: matchingDocs.length > 0,
        uploadedFiles: matchingDocs.map(doc => `${doc.originalName} (${doc.status})`)
      };
    });
  };

  const documentRequirements = getDocumentRequirements();

  // Use the updated requirements from the function
  const updatedRequirements = documentRequirements;

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



  return (
    <PageLayout title="Document Upload">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document Upload</h1>
          <p className="text-muted-foreground">
            Upload primary source documents - the system will automatically generate journal entries, reports, and compliance documents from your uploads
          </p>
        </div>

        {/* Navigation to Data Tables */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">View Extracted Data</h3>
                  <p className="text-sm text-blue-700">
                    Documents uploaded here are automatically processed and available in Data Tables
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {allExtractedData && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-900">
                      {allExtractedData.length} documents processed
                    </div>
                    <div className="text-xs text-blue-600">
                      Ready for analysis
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.location.href = '/data-tables'}
                >
                  Go to Data Tables
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                              {(() => {
                                const hasUploadedDocument = documents?.some(uploadedDoc =>
                                  uploadedDoc.documentType === requirement.id
                                );

                                // Exclude purchase_register and sales_register from showing action buttons
                                const shouldShowActions = requirement.documentType === 'primary' &&
                                  hasUploadedDocument &&
                                  requirement.id !== 'purchase_register' &&
                                  requirement.id !== 'sales_register';

                                return shouldShowActions && (
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
                                );
                              })()}
                              
                              {/* Derived Documents - Generate Actions */}
                              {(() => {
                                const hasUploadedDocument = documents?.some(uploadedDoc =>
                                  uploadedDoc.documentType === requirement.id
                                );

                                // Only show generate actions if there's no uploaded document yet
                                return requirement.documentType === 'derived' && requirement.canGenerate && !hasUploadedDocument && (
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
                                );
                              })()}
                              
                              {/* Calculated Documents - Auto-Calculate Actions */}
                              {(() => {
                                const hasUploadedDocument = documents?.some(uploadedDoc =>
                                  uploadedDoc.documentType === requirement.id
                                );

                                return requirement.documentType === 'calculated' && (
                                  <div className="flex space-x-1">
                                    {/* Show Calculate button only if document is not yet uploaded */}
                                    {!hasUploadedDocument && (
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
                                    )}

                                    {/* Show View button only if document is uploaded */}
                                    {hasUploadedDocument && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleView(requirement.id, requirement.name)}
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })()}
                              
                              {/* View Generated/Calculated Documents */}
                              {(() => {
                                const hasUploadedDocument = documents?.some(uploadedDoc =>
                                  uploadedDoc.documentType === requirement.id
                                );

                                return (requirement.documentType === 'derived' || requirement.documentType === 'calculated') && hasUploadedDocument && (
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
                                );
                              })()}
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
                <div className="flex items-center justify-between">
                  <CardTitle>Uploaded Documents</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshDocuments}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  All uploaded documents synchronized across modules
                </p>
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
                              {getStatusBadge(doc.status, doc.id)}
                            </TableCell>
                            <TableCell className="table-cell">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </TableCell>
                            <TableCell className="table-cell">
                              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
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

      {/* View Document Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingDocument ? `View ${viewingDocument.originalName}` : 'View Document'}
            </DialogTitle>
            <DialogDescription>
              {viewingDocument ? `Document Type: ${getDocumentTypeDisplay(viewingDocument.documentType)}` : ''}
            </DialogDescription>
          </DialogHeader>

          {loadingExtractedData ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner h-8 w-8" />
              <span className="ml-2">Loading document data...</span>
            </div>
          ) : extractedData ? (
            <div className="space-y-4">
              {/* Bank Statement Data */}
              {viewingDocument?.documentType === 'bank_statement' && extractedData.data?.transactions && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Bank Statement Transactions</h3>
                  <div className="mb-4 grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="text-xl font-bold">{extractedData.data.transactions.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Credits</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalCredits?.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Debits</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalDebits?.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Closing Balance</p>
                      <p className="text-xl font-bold">₹{extractedData.data.closingBalance?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedData.data.transactions.map((transaction: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.reference}</TableCell>
                            <TableCell className="text-right">
                              {transaction.debit > 0 ? `₹${transaction.debit.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {transaction.credit > 0 ? `₹${transaction.credit.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">₹{transaction.balance.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Sales Register Data */}
              {viewingDocument?.documentType === 'sales_register' && extractedData.data?.sales && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sales Register</h3>
                  <div className="mb-4 grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Sales</p>
                      <p className="text-xl font-bold">{extractedData.data.sales.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Invoice Value</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalInvoiceValue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Taxable Value</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalTaxableValue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total GST Amount</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalGstAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Taxable Value</TableHead>
                          <TableHead className="text-right">GST Amount</TableHead>
                          <TableHead className="text-right">Invoice Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedData.data.sales.map((sale: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{sale.invoiceNumber}</TableCell>
                            <TableCell>{sale.date}</TableCell>
                            <TableCell>{sale.customerName}</TableCell>
                            <TableCell>{sale.itemDescription}</TableCell>
                            <TableCell className="text-right">{sale.quantity}</TableCell>
                            <TableCell className="text-right">₹{sale.rate.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{sale.taxableValue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{sale.gstAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{sale.invoiceTotal.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Purchase Register Data */}
              {viewingDocument?.documentType === 'purchase_register' && extractedData.data?.purchases && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Purchase Register</h3>
                  <div className="mb-4 grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Purchases</p>
                      <p className="text-xl font-bold">{extractedData.data.purchases.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Invoice Value</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalInvoiceValue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Taxable Value</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalTaxableValue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total GST Amount</p>
                      <p className="text-xl font-bold">₹{extractedData.data.totalGstAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Taxable Value</TableHead>
                          <TableHead className="text-right">GST Amount</TableHead>
                          <TableHead className="text-right">Invoice Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedData.data.purchases.map((purchase: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{purchase.invoiceNumber}</TableCell>
                            <TableCell>{purchase.date}</TableCell>
                            <TableCell>{purchase.vendorName}</TableCell>
                            <TableCell>{purchase.itemDescription}</TableCell>
                            <TableCell className="text-right">{purchase.quantity}</TableCell>
                            <TableCell className="text-right">₹{purchase.rate.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{purchase.taxableValue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{purchase.gstAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{purchase.invoiceTotal.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No extracted data available for this document.</p>

              {/* Debug information */}
              <div className="text-left bg-gray-50 p-4 rounded max-w-2xl mx-auto">
                <h4 className="font-medium mb-2">Debug Information:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Document ID:</strong> {viewingDocument?.id}</p>
                  <p><strong>Document Type:</strong> {viewingDocument?.documentType}</p>
                  <p><strong>File Name:</strong> {viewingDocument?.fileName}</p>
                  <p><strong>Original Name:</strong> {viewingDocument?.originalName}</p>
                  <p><strong>Status:</strong> {viewingDocument?.status}</p>
                  <p><strong>Extracted Data Found:</strong> {extractedData ? 'Yes' : 'No'}</p>
                  {extractedData && (
                    <>
                      <p><strong>Data Type:</strong> {typeof extractedData.data}</p>
                      <p><strong>Data Keys:</strong> {extractedData.data ? Object.keys(extractedData.data).join(', ') : 'None'}</p>
                    </>
                  )}
                </div>

                {extractedData?.data && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Raw Data:</h5>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(extractedData.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
