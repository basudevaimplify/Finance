import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, FileText, Calendar, DollarSign, Building, Users, Database, Upload, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ExtractedData {
  id: string;
  documentId: string;
  documentType: string;
  fileName: string;
  data: any;
  extractedAt: string;
  confidence: number;
}

export default function DataTables() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("Q1_2025");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("all");

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

  const { data: extractedData, isLoading: dataLoading, error } = useQuery<ExtractedData[]>({
    queryKey: [`/api/extracted-data?period=${selectedPeriod}&docType=${selectedDocType}`],
  });

  // Fetch journal entries separately - only those generated from documents
  const { data: journalEntries, isLoading: journalLoading } = useQuery<any[]>({
    queryKey: [`/api/journal-entries?period=${selectedPeriod}&generated=true`],
    enabled: selectedDocType === "all" || selectedDocType === "journal",
  });

  const queryClient = useQueryClient();

  // Generate journal entries from uploaded documents
  const generateJournalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/reports/generate-journal-entries', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Journal entries generated successfully",
      });
      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries?period=${selectedPeriod}&generated=true`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate journal entries",
        variant: "destructive",
      });
    },
  });

  const generateJournalFromDocuments = () => {
    generateJournalMutation.mutate();
  };

  // Delete individual journal entry
  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiRequest(`/api/journal-entries/${entryId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entry deleted successfully",
      });
      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries?period=${selectedPeriod}&generated=true`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete journal entry",
        variant: "destructive",
      });
    },
  });

  // Delete all journal entries
  const deleteAllJournalEntriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/journal-entries', {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "All journal entries deleted successfully",
      });
      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries?period=${selectedPeriod}&generated=true`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete journal entries",
        variant: "destructive",
      });
    },
  });

  const deleteAllJournalEntries = () => {
    deleteAllJournalEntriesMutation.mutate();
  };

  const seedDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/seed-vendor-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to seed data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh the data after seeding
      queryClient.invalidateQueries({ queryKey: ['/api/extracted-data'] });
      toast({
        title: "Success",
        description: `Successfully seeded ${data.count} vendor invoice documents`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to seed data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  console.log('Data Tables Query:', { extractedData, isLoading, error });
  console.log('Extracted data length:', extractedData?.length || 0);
  console.log('Journal entries length:', journalEntries?.length || 0);
  console.log('Selected period:', selectedPeriod, 'Selected doc type:', selectedDocType);

  // Combine extracted data with journal entries
  const allData = React.useMemo(() => {
    try {
      const data = [...(extractedData || [])];

      // Add journal entries as a special data type if we're showing journal entries
      if ((selectedDocType === "all" || selectedDocType === "journal") && journalEntries?.length) {
        // Create a virtual document for journal entries
        const totalDebits = journalEntries.reduce((sum: number, entry: any) => {
          const debit = parseFloat(entry?.debitAmount || '0');
          return sum + (isNaN(debit) ? 0 : debit);
        }, 0);

        const totalCredits = journalEntries.reduce((sum: number, entry: any) => {
          const credit = parseFloat(entry?.creditAmount || '0');
          return sum + (isNaN(credit) ? 0 : credit);
        }, 0);

        const uniqueAccounts = [...new Set(journalEntries.map((entry: any) => entry?.accountCode).filter(Boolean))].length;

        data.push({
          id: 'journal-entries-virtual',
          fileName: `Journal Entries (${journalEntries.length} entries)`,
          documentType: 'journal',
          data: {
            documentType: 'journal',
            totalEntries: journalEntries.length,
            entries: journalEntries || [],
            summary: {
              totalDebits,
              totalCredits,
              uniqueAccounts,
            }
          },
          uploadedAt: new Date().toISOString(),
          status: 'extracted'
        });
      }

      return data;
    } catch (error) {
      console.error('Error processing data:', error);
      return extractedData || [];
    }
  }, [extractedData, journalEntries, selectedDocType]);

  const filteredData = React.useMemo(() => {
    try {
      return allData?.filter(item => {
        if (!item) return false;

        const matchesSearch = searchTerm === "" ||
          (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.data && JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = selectedDocType === "all" || item.documentType === selectedDocType;

        return matchesSearch && matchesType;
      }) || [];
    } catch (error) {
      console.error('Error filtering data:', error);
      return [];
    }
  }, [allData, searchTerm, selectedDocType]);

  const documentTypes = [
    { value: "vendor_invoice", label: "Vendor Invoices", icon: FileText, color: "bg-blue-500" },
    { value: "sales_register", label: "Sales Register", icon: DollarSign, color: "bg-green-500" },
    { value: "salary_register", label: "Salary Register", icon: Users, color: "bg-purple-500" },
    { value: "bank_statement", label: "Bank Statement", icon: Building, color: "bg-orange-500" },
    { value: "purchase_register", label: "Purchase Register", icon: Calendar, color: "bg-red-500" },
    { value: "journal", label: "Journal Entries", icon: Database, color: "bg-indigo-500" },
    { value: "trial_balance", label: "Trial Balance", icon: FileText, color: "bg-teal-500" },
  ];

  const getDocumentTypeData = (docType: string) => {
    return filteredData.filter(item => item.documentType === docType);
  };

  const renderVendorInvoiceData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.invoices?.map((invoice: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{invoice.invoiceNumber || "N/A"}</TableCell>
                    <TableCell>{invoice.vendorName || "N/A"}</TableCell>
                    <TableCell>{invoice.invoiceDate || "N/A"}</TableCell>
                    <TableCell className="font-mono">₹{invoice.amount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono text-sm">{invoice.gstin || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                        {invoice.status || "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSalesRegisterData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-xl font-bold">{item.data.sales?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Invoice Value</p>
                <p className="text-xl font-bold">₹{item.data.totalInvoiceValue?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Taxable Value</p>
                <p className="text-xl font-bold">₹{item.data.totalTaxableValue?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total GST Amount</p>
                <p className="text-xl font-bold">₹{item.data.totalGstAmount?.toLocaleString() || "0"}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Taxable Value</TableHead>
                  <TableHead>GST Amount</TableHead>
                  <TableHead>Invoice Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.sales?.map((sale: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{sale.invoiceNumber || "N/A"}</TableCell>
                    <TableCell>{sale.customerName || "N/A"}</TableCell>
                    <TableCell>{sale.date || "N/A"}</TableCell>
                    <TableCell>{sale.itemDescription || "N/A"}</TableCell>
                    <TableCell className="font-mono">{sale.quantity || "0"}</TableCell>
                    <TableCell className="font-mono">₹{sale.rate?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{sale.taxableValue?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{sale.gstAmount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono font-semibold">₹{sale.invoiceTotal?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSalaryRegisterData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>TDS Deducted</TableHead>
                  <TableHead>Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.employees?.map((employee: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{employee.employeeId || "N/A"}</TableCell>
                    <TableCell>{employee.employeeName || "N/A"}</TableCell>
                    <TableCell>{employee.department || "N/A"}</TableCell>
                    <TableCell className="font-mono">₹{employee.basicSalary?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{employee.tdsDeducted?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono font-semibold">₹{employee.netSalary?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderBankStatementData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Bank Account Information */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Account Holder</p>
                  <p className="font-semibold">{item.data.accountHolder || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Account Number</p>
                  <p className="font-mono">{item.data.accountNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Bank</p>
                  <p className="font-semibold">{item.data.bankName || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Period</p>
                  <p className="font-semibold">{item.data.statementPeriod || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold">{item.data.transactions?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-xl font-bold">₹{item.data.totalCredits?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-xl font-bold">₹{item.data.totalDebits?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-gray-600">Closing Balance</p>
                <p className="text-xl font-bold">₹{item.data.closingBalance?.toLocaleString() || "0"}</p>
              </div>
            </div>

            {/* Transactions Table */}
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
                {item.data.transactions?.map((transaction: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{transaction.date || "N/A"}</TableCell>
                    <TableCell>{transaction.description || "N/A"}</TableCell>
                    <TableCell className="font-mono text-sm">{transaction.reference || "N/A"}</TableCell>
                    <TableCell className="font-mono text-red-600 text-right">
                      {transaction.debit && transaction.debit > 0 ? `₹${transaction.debit.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-green-600 text-right">
                      {transaction.credit && transaction.credit > 0 ? `₹${transaction.credit.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-right">₹{transaction.balance?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPurchaseRegisterData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-xl font-bold">{item.data.purchases?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Invoice Value</p>
                <p className="text-xl font-bold">₹{item.data.totalInvoiceValue?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Taxable Value</p>
                <p className="text-xl font-bold">₹{item.data.totalTaxableValue?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total GST Amount</p>
                <p className="text-xl font-bold">₹{item.data.totalGstAmount?.toLocaleString() || "0"}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Taxable Value</TableHead>
                  <TableHead>GST Amount</TableHead>
                  <TableHead>Invoice Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.purchases?.map((purchase: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{purchase.invoiceNumber || "N/A"}</TableCell>
                    <TableCell>{purchase.vendorName || "N/A"}</TableCell>
                    <TableCell>{purchase.date || "N/A"}</TableCell>
                    <TableCell>{purchase.itemDescription || "N/A"}</TableCell>
                    <TableCell className="font-mono">{purchase.quantity || "0"}</TableCell>
                    <TableCell className="font-mono">₹{purchase.rate?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{purchase.taxableValue?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{purchase.gstAmount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono font-semibold">₹{purchase.invoiceTotal?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderJournalEntriesData = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="mb-4">
            <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-muted-foreground mb-4">No journal entries generated yet.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Generate journal entries from your uploaded documents to see them here.
            </p>
            <Button
              onClick={() => generateJournalFromDocuments()}
              disabled={generateJournalMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {generateJournalMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Journal Entries
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Delete All Button */}
        <div className="flex justify-end mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                disabled={deleteAllJournalEntriesMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Journal Entries
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Journal Entries</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all generated journal entries? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAllJournalEntries}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {data.map((item) => {
          if (!item || !item.data) {
            return null;
          }

          return (
            <Card key={item.id || Math.random()} className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.fileName || 'Journal Entries'}</CardTitle>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                    {item.data?.totalEntries || 0} entries
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generated: {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Total Debits</p>
                    <p className="text-lg font-bold text-green-900">
                      ₹{(item.data?.summary?.totalDebits || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Total Credits</p>
                    <p className="text-lg font-bold text-red-900">
                      ₹{(item.data?.summary?.totalCredits || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Unique Accounts</p>
                    <p className="text-lg font-bold text-blue-900">
                      {item.data?.summary?.uniqueAccounts || 0}
                    </p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Journal ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Debit Amount</TableHead>
                      <TableHead>Credit Amount</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(item.data?.entries || []).map((entry: any, index: number) => {
                      if (!entry) return null;

                      const debitAmount = parseFloat(entry.debitAmount || '0');
                      const creditAmount = parseFloat(entry.creditAmount || '0');

                      return (
                        <TableRow key={entry.id || index} className="hover:bg-muted/50">
                          <TableCell className="font-mono">{entry.journalId || '-'}</TableCell>
                          <TableCell>
                            {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="font-mono">{entry.accountCode || '-'}</TableCell>
                          <TableCell>{entry.accountName || '-'}</TableCell>
                          <TableCell className="font-mono text-green-600">
                            {debitAmount > 0 ? `₹${debitAmount.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-red-600">
                            {creditAmount > 0 ? `₹${creditAmount.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={entry.narration || ''}>
                            {entry.narration || '-'}
                          </TableCell>
                          <TableCell>{entry.entity || '-'}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={deleteJournalEntryMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this journal entry? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteJournalEntryMutation.mutate(entry.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (dataLoading || journalLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <main className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Data Tables</h1>
                <p className="text-muted-foreground">View extracted data from financial documents</p>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Data Tables</h1>
              <p className="text-muted-foreground">View extracted data from financial documents</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => seedDataMutation.mutate()}
                disabled={seedDataMutation.isPending}
              >
                <Database className="h-4 w-4" />
                {seedDataMutation.isPending ? 'Seeding...' : 'Seed Sample Data'}
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Navigation to Document Upload */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Upload className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Upload More Documents</h3>
                    <p className="text-sm text-green-700">
                      Upload new documents in Document Management to see more extracted data here
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {extractedData && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-900">
                        {extractedData.length} documents available
                      </div>
                      <div className="text-xs text-green-600">
                        {filteredData.length} matching filters
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => window.location.href = '/document-upload'}
                  >
                    Go to Document Upload
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1_2025">Q1 2025</SelectItem>
                  <SelectItem value="Q2_2025">Q2 2025</SelectItem>
                  <SelectItem value="Q3_2025">Q3 2025</SelectItem>
                  <SelectItem value="Q4_2025">Q4 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctype">Document Type</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="vendor_invoice" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {documentTypes.map((type) => {
            const Icon = type.icon;
            const count = getDocumentTypeData(type.value).length;
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {type.label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="vendor_invoice" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vendor Invoices Data</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {getDocumentTypeData("vendor_invoice").length} documents
            </Badge>
          </div>
          {renderVendorInvoiceData(getDocumentTypeData("vendor_invoice"))}
        </TabsContent>

        <TabsContent value="sales_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sales Register Data</h2>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {getDocumentTypeData("sales_register").length} documents
            </Badge>
          </div>
          {renderSalesRegisterData(getDocumentTypeData("sales_register"))}
        </TabsContent>

        <TabsContent value="salary_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Salary Register Data</h2>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {getDocumentTypeData("salary_register").length} documents
            </Badge>
          </div>
          {renderSalaryRegisterData(getDocumentTypeData("salary_register"))}
        </TabsContent>

        <TabsContent value="bank_statement" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bank Statement Data</h2>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {getDocumentTypeData("bank_statement").length} documents
            </Badge>
          </div>
          {renderBankStatementData(getDocumentTypeData("bank_statement"))}
        </TabsContent>

        <TabsContent value="purchase_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Purchase Register Data</h2>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {getDocumentTypeData("purchase_register").length} documents
            </Badge>
          </div>
          {renderPurchaseRegisterData(getDocumentTypeData("purchase_register"))}
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Journal Entries Data</h2>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
              {getDocumentTypeData("journal").length} documents
            </Badge>
          </div>
          {renderJournalEntriesData(getDocumentTypeData("journal"))}
        </TabsContent>

        <TabsContent value="trial_balance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Trial Balance Data</h2>
            <Badge variant="outline" className="bg-teal-50 text-teal-700">
              {getDocumentTypeData("trial_balance").length} documents
            </Badge>
          </div>
          {/* Trial balance renderer would go here */}
        </TabsContent>
      </Tabs>

      {filteredData.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No data found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedDocType !== "all" 
                  ? "No documents match your current filters. Try adjusting your search or filters."
                  : "No extracted data available for the selected period. Upload and process documents to see data here."
                }
              </p>
            </div>
          </div>
        </Card>
      )}
        </main>
      </div>
    </div>
  );
}