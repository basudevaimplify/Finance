import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, RefreshCw, TrendingUp, Calendar, BarChart3, Trash2, AlertCircle, Grid, List } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FinancialStatement } from "@shared/schema";

export default function FinancialReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("Q3_2025");
  const [displayFormat, setDisplayFormat] = useState<'detailed' | 'compact'>('detailed');
  const [viewReportModal, setViewReportModal] = useState<{
    isOpen: boolean;
    statement: FinancialStatement | null;
  }>({
    isOpen: false,
    statement: null,
  });

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

  const { data: statements, isLoading: statementsLoading } = useQuery<FinancialStatement[]>({
    queryKey: ["/api/financial-statements", selectedPeriod],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/financial-statements?period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    retry: false,
  });

  const { data: journalEntries, isLoading: journalEntriesLoading, refetch: refetchJournalEntries } = useQuery({
    queryKey: ["/api/journal-entries"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/journal-entries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch(`/api/reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          period: selectedPeriod,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data, reportType) => {
      toast({
        title: "Report Generated",
        description: `${reportType} report generated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] });
    },
    onError: (error) => {
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
        title: "Generation Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch(`/api/financial-statements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "Financial report deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] });
    },
    onError: (error) => {
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
        title: "Deletion Failed",
        description: error.message || "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  const generateJournalEntriesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch('/api/reports/generate-journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      const title = data.totalEntries > 0 ? "Journal Entries Generated" : "Journal Entries Already Exist";
      const description = data.totalEntries > 0 
        ? `Generated ${data.totalEntries} journal entries from ${data.documentsProcessed} documents`
        : data.skippedDocuments > 0 
          ? `${data.skippedDocuments} documents already have journal entries. No new entries created.`
          : "No documents found to process";
      
      toast({
        title,
        description,
        variant: data.totalEntries > 0 ? "default" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] });
    },
    onError: (error) => {
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
        title: "Generation Failed",
        description: error.message || "Failed to generate journal entries",
        variant: "destructive",
      });
    },
  });

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal Entry Deleted",
        description: "Journal entry deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
    },
    onError: (error) => {
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
        title: "Deletion Failed",
        description: error.message || "Failed to delete journal entry",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatementTitle = (type: string) => {
    switch (type) {
      case 'trial_balance': return 'Trial Balance';
      case 'profit_loss': return 'Profit & Loss Statement';
      case 'balance_sheet': return 'Balance Sheet';
      case 'cash_flow': return 'Cash Flow Statement';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render compact account format
  const renderCompactPLFormat = (plData: any) => {
    const allAccounts = [
      ...(plData.revenue || []).map((item: any) => ({
        ...item,
        section: 'Revenue',
        isTotal: false
      })),
      {
        accountCode: '',
        accountName: 'Total Revenue',
        amount: plData.totalRevenue || 0,
        section: 'Revenue',
        isTotal: true
      },
      ...(plData.expenses || []).map((item: any) => ({
        ...item,
        section: 'Expenses',
        isTotal: false
      })),
      {
        accountCode: '',
        accountName: 'Total Expenses',
        amount: plData.totalExpenses || 0,
        section: 'Expenses',
        isTotal: true
      },
      {
        accountCode: '',
        accountName: 'Net Profit',
        amount: plData.netProfit || 0,
        section: 'Net Result',
        isTotal: true
      }
    ];

    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Account</TableHead>
                <TableHead className="text-right font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAccounts.map((account, index) => (
                <TableRow 
                  key={index} 
                  className={account.isTotal ? 'font-semibold border-t' : ''}
                >
                  <TableCell className={account.isTotal ? 'font-semibold' : ''}>
                    {account.section === 'Revenue' && !account.isTotal && (
                      <span className="text-green-600 mr-2">●</span>
                    )}
                    {account.section === 'Expenses' && !account.isTotal && (
                      <span className="text-red-600 mr-2">●</span>
                    )}
                    {account.accountCode && (
                      <span className="font-mono text-sm text-muted-foreground mr-2">
                        {account.accountCode}
                      </span>
                    )}
                    {account.accountName}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${account.isTotal ? 'font-semibold' : ''} ${
                    account.section === 'Net Result' 
                      ? account.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      : ''
                  }`}>
                    {formatCurrencyCompact(account.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Calculate real trial balance from journal entries
  const calculateTrialBalance = () => {
    if (!journalEntries || journalEntries.length === 0) {
      return { totalDebits: 0, totalCredits: 0, isBalanced: true };
    }
    
    const totalDebits = journalEntries.reduce((sum, entry) => {
      const debitAmount = typeof entry.debitAmount === 'string' ? parseFloat(entry.debitAmount) : entry.debitAmount;
      return sum + (debitAmount || 0);
    }, 0);
    
    const totalCredits = journalEntries.reduce((sum, entry) => {
      const creditAmount = typeof entry.creditAmount === 'string' ? parseFloat(entry.creditAmount) : entry.creditAmount;
      return sum + (creditAmount || 0);
    }, 0);
    
    return {
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for small rounding differences
    };
  };

  const trialBalance = calculateTrialBalance();



  return (
    <PageLayout title="Financial Reports">
      <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
                <p className="text-muted-foreground">
                  Generate and manage financial statements and reports
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1_2025">Q1 2025</SelectItem>
                    <SelectItem value="Q2_2025">Q2 2025</SelectItem>
                    <SelectItem value="Q3_2025">Q3 2025</SelectItem>
                    <SelectItem value="Q4_2025">Q4 2025</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => generateJournalEntriesMutation.mutate()}
                  disabled={generateJournalEntriesMutation.isPending}
                  variant="default"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Journal Entries
                </Button>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] });
                    refetchJournalEntries();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports-management">Reports Management</TabsTrigger>
              <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
              <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
              <TabsTrigger value="profit-loss">P&L Statement</TabsTrigger>
              <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Trial Balance</CardTitle>
                      <TrendingUp className="h-5 w-5 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Debits</span>
                        <span className="font-semibold">{formatCurrency(trialBalance.totalDebits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Credits</span>
                        <span className="font-semibold">{formatCurrency(trialBalance.totalCredits)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Balance</span>
                        <span className="font-semibold text-secondary">
                          {formatCurrency(trialBalance.totalDebits - trialBalance.totalCredits)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => generateReportMutation.mutate('trial-balance')}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Profit & Loss</CardTitle>
                      <BarChart3 className="h-5 w-5 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const plStatement = statements?.find(s => s.statementType === 'profit_loss');
                      const plData = plStatement?.data || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="font-semibold">{formatCurrency(plData.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Expenses</span>
                            <span className="font-semibold">{formatCurrency(plData.totalExpenses)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Net Profit</span>
                            <span className="font-semibold text-secondary">
                              {formatCurrency(plData.netProfit)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <Button 
                      className="w-full mt-4"
                      onClick={() => generateReportMutation.mutate('profit-loss')}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Balance Sheet</CardTitle>
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const bsStatement = statements?.find(s => s.statementType === 'balance_sheet');
                      const bsData = bsStatement?.data || { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Assets</span>
                            <span className="font-semibold">{formatCurrency(bsData.totalAssets)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Liabilities</span>
                            <span className="font-semibold">{formatCurrency(bsData.totalLiabilities)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Total Equity</span>
                            <span className="font-semibold text-secondary">
                              {formatCurrency(bsData.totalEquity)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <Button 
                      className="w-full mt-4"
                      onClick={() => generateReportMutation.mutate('balance-sheet')}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports-management" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Reports</CardTitle>
                    <Badge variant="outline">
                      {statements ? statements.length : 0} reports
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {statementsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : statements && statements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Generated At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statements.map((statement) => (
                            <TableRow key={statement.id}>
                              <TableCell className="font-medium">
                                {getStatementTitle(statement.statementType)}
                              </TableCell>
                              <TableCell>{statement.period}</TableCell>
                              <TableCell>{new Date(statement.generatedAt).toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={statement.isValid ? "default" : "destructive"}>
                                  {statement.isValid ? "Valid" : "Invalid"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setViewReportModal({
                                        isOpen: true,
                                        statement: statement,
                                      });
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteReportMutation.mutate(statement.id)}
                                    disabled={deleteReportMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No financial reports found</p>
                      <p className="text-sm text-muted-foreground">
                        Generate reports from the Overview tab to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {deleteReportMutation.isPending && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting report... Please wait.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="journal-entries" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Journal Entries - {selectedPeriod}</CardTitle>
                    <Badge variant="outline">
                      {journalEntries ? journalEntries.length : 0} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {journalEntriesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : journalEntries && journalEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Journal ID</TableHead>
                            <TableHead>Account Code</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Vendor/Party</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead>Narration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {journalEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                              <TableCell className="font-mono">{entry.journalId}</TableCell>
                              <TableCell className="font-mono">{entry.accountCode}</TableCell>
                              <TableCell>{entry.accountName}</TableCell>
                              <TableCell className="text-sm">
                                {entry.entity || '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {entry.narration}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteJournalEntryMutation.mutate(entry.id)}
                                  disabled={deleteJournalEntryMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No journal entries found</p>
                      <p className="text-sm text-muted-foreground">
                        Upload documents to automatically generate journal entries
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trial-balance" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Trial Balance - {selectedPeriod}</CardTitle>
                    <Badge className={trialBalance.isBalanced ? "badge-compliant" : "badge-non-compliant"}>
                      {trialBalance.isBalanced ? "Balanced" : "Unbalanced"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account Code</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead className="text-right">Debit Balance</TableHead>
                          <TableHead className="text-right">Credit Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {journalEntries && journalEntries.length > 0 ? (
                          (() => {
                            // Group entries by account code and calculate net balances
                            const accountBalances = {};
                            
                            journalEntries.forEach(entry => {
                              const debitAmount = typeof entry.debitAmount === 'string' ? parseFloat(entry.debitAmount) : entry.debitAmount;
                              const creditAmount = typeof entry.creditAmount === 'string' ? parseFloat(entry.creditAmount) : entry.creditAmount;
                              
                              if (!accountBalances[entry.accountCode]) {
                                accountBalances[entry.accountCode] = {
                                  accountCode: entry.accountCode,
                                  accountName: entry.accountName,
                                  totalDebits: 0,
                                  totalCredits: 0
                                };
                              }
                              
                              accountBalances[entry.accountCode].totalDebits += debitAmount || 0;
                              accountBalances[entry.accountCode].totalCredits += creditAmount || 0;
                            });
                            
                            return Object.values(accountBalances).map((account) => (
                              <TableRow key={account.accountCode}>
                                <TableCell className="font-mono">{account.accountCode}</TableCell>
                                <TableCell>{account.accountName}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {account.totalDebits > 0 ? formatCurrency(account.totalDebits) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {account.totalCredits > 0 ? formatCurrency(account.totalCredits) : '-'}
                                </TableCell>
                              </TableRow>
                            ));
                          })()
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No journal entries found
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="border-t-2 font-semibold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(trialBalance.totalDebits)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(trialBalance.totalCredits)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profit-loss" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Profit & Loss Statement - {selectedPeriod}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                        <Button
                          onClick={() => setDisplayFormat('detailed')}
                          variant={displayFormat === 'detailed' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 px-2"
                        >
                          <List className="h-3 w-3 mr-1" />
                          Detailed
                        </Button>
                        <Button
                          onClick={() => setDisplayFormat('compact')}
                          variant={displayFormat === 'compact' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 px-2"
                        >
                          <Grid className="h-3 w-3 mr-1" />
                          Compact
                        </Button>
                      </div>
                      <Button
                        onClick={() => generateReportMutation.mutate('profit-loss')}
                        disabled={generateReportMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const profitLossStatement = statements?.find(s => s.statementType === 'profit_loss');
                    if (!profitLossStatement) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium">No P&L statement found</p>
                          <p className="text-sm text-muted-foreground">
                            Click "Generate Report" to create a profit & loss statement
                          </p>
                        </div>
                      );
                    }

                    const plData = profitLossStatement.data;
                    return displayFormat === 'compact' ? renderCompactPLFormat(plData) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Revenue</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Account Code</TableHead>
                                  <TableHead>Account Name</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {plData.revenue && plData.revenue.length > 0 ? (
                                  plData.revenue.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-mono">{item.accountCode}</TableCell>
                                      <TableCell>{item.accountName}</TableCell>
                                      <TableCell className="text-right font-mono">
                                        {formatCurrency(item.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                      No revenue entries found
                                    </TableCell>
                                  </TableRow>
                                )}
                                <TableRow className="border-t font-semibold">
                                  <TableCell colSpan={2}>Total Revenue</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(plData.totalRevenue || 0)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Account Code</TableHead>
                                  <TableHead>Account Name</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {plData.expenses && plData.expenses.length > 0 ? (
                                  plData.expenses.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-mono">{item.accountCode}</TableCell>
                                      <TableCell>{item.accountName}</TableCell>
                                      <TableCell className="text-right font-mono">
                                        {formatCurrency(item.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                      No expense entries found
                                    </TableCell>
                                  </TableRow>
                                )}
                                <TableRow className="border-t font-semibold">
                                  <TableCell colSpan={2}>Total Expenses</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(plData.totalExpenses || 0)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div className="border-t-2 pt-4">
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>Net Profit</span>
                            <span className={plData.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(plData.netProfit || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance-sheet" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance Sheet - {selectedPeriod}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => generateReportMutation.mutate('balance-sheet')}
                        disabled={generateReportMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const balanceSheetStatement = statements?.find(s => s.statementType === 'balance_sheet');
                    if (!balanceSheetStatement) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium">No balance sheet found</p>
                          <p className="text-sm text-muted-foreground">
                            Click "Generate Report" to create a balance sheet
                          </p>
                        </div>
                      );
                    }

                    const bsData = balanceSheetStatement.data;
                    const isBalanced = Math.abs(bsData.totalAssets - (bsData.totalLiabilities + bsData.totalEquity)) < 0.01;
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Badge className={isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {isBalanced ? "Balanced" : "Unbalanced"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Assets</h3>
                            <div className="space-y-3">
                              {bsData.assets && bsData.assets.length > 0 ? (
                                bsData.assets.map((asset, index) => (
                                  <div key={index} className="flex justify-between py-2 border-b">
                                    <div>
                                      <p className="font-medium">{asset.accountName}</p>
                                      <p className="text-xs text-muted-foreground">{asset.accountCode}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{asset.subType}</p>
                                    </div>
                                    <p className="font-mono">{formatCurrency(asset.amount)}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="flex justify-center py-8 text-muted-foreground">
                                  No asset entries found
                                </div>
                              )}
                              <div className="flex justify-between py-2 border-t-2 font-semibold">
                                <span>Total Assets</span>
                                <span>{formatCurrency(bsData.totalAssets || 0)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-3">Liabilities & Equity</h3>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-muted-foreground mb-2">Liabilities</h4>
                                {bsData.liabilities && bsData.liabilities.length > 0 ? (
                                  bsData.liabilities.map((liability, index) => (
                                    <div key={index} className="flex justify-between py-2 border-b">
                                      <div>
                                        <p className="font-medium">{liability.accountName}</p>
                                        <p className="text-xs text-muted-foreground">{liability.accountCode}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{liability.subType}</p>
                                      </div>
                                      <p className="font-mono">{formatCurrency(liability.amount)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-center py-4 text-muted-foreground">
                                    No liability entries found
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-muted-foreground mb-2">Equity</h4>
                                {bsData.equity && bsData.equity.length > 0 ? (
                                  bsData.equity.map((equity, index) => (
                                    <div key={index} className="flex justify-between py-2 border-b">
                                      <div>
                                        <p className="font-medium">{equity.accountName}</p>
                                        <p className="text-xs text-muted-foreground">{equity.accountCode}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{equity.subType}</p>
                                      </div>
                                      <p className="font-mono">{formatCurrency(equity.amount)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-center py-4 text-muted-foreground">
                                    No equity entries found
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between py-2 border-t-2 font-semibold">
                                <span>Total Liabilities & Equity</span>
                                <span>{formatCurrency((bsData.totalLiabilities || 0) + (bsData.totalEquity || 0))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      {/* Report View Modal */}
      <Dialog open={viewReportModal.isOpen} onOpenChange={(open) => setViewReportModal({ isOpen: open, statement: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewReportModal.statement ? getStatementTitle(viewReportModal.statement.statementType) : 'Report View'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewReportModal.statement && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Period:</span> {viewReportModal.statement.period}
                  </div>
                  <div>
                    <span className="font-medium">Generated:</span> {new Date(viewReportModal.statement.generatedAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge variant={viewReportModal.statement.isValid ? "default" : "destructive"} className="ml-2">
                      {viewReportModal.statement.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            {viewReportModal.statement && (
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Report Data</h3>
                {(() => {
                  const data = viewReportModal.statement.data;
                  
                  // Special formatting for Form 26Q
                  if (viewReportModal.statement.statementType === 'form_26q') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded">
                          <h4 className="font-medium mb-2">Summary</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>Total Deductions: <span className="font-semibold">{data.summary?.totalDeductions || 0}</span></div>
                            <div>Total Deductees: <span className="font-semibold">{data.summary?.totalDeductees || 0}</span></div>
                            <div>Total TDS: <span className="font-semibold">₹{data.summary?.totalTDS?.toLocaleString('en-IN') || 0}</span></div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Deductor Details</h4>
                          <div className="bg-muted p-3 rounded text-sm">
                            <div>TAN: {data.deductorDetails?.tan}</div>
                            <div>Name: {data.deductorDetails?.name}</div>
                            <div>Address: {data.deductorDetails?.address}</div>
                          </div>
                        </div>
                        
                        {data.deductions && data.deductions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">TDS Deductions</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border border-gray-300 px-2 py-1 text-left">Deductee Name</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left">PAN</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left">Section</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">Total Amount</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">TDS Amount</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left">Challan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.deductions.map((deduction, index) => (
                                    <tr key={index}>
                                      <td className="border border-gray-300 px-2 py-1">{deduction.deducteeName}</td>
                                      <td className="border border-gray-300 px-2 py-1">{deduction.deducteePAN}</td>
                                      <td className="border border-gray-300 px-2 py-1">{deduction.sectionCode}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{deduction.totalAmount?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{deduction.tdsAmount?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1">{deduction.challanNumber}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Special formatting for GSTR-3B
                  if (viewReportModal.statement.statementType === 'gstr_3b') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded">
                          <h4 className="font-medium mb-2">GSTIN: {data.gstin}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Outward Supplies (Sales)</h4>
                            <div className="bg-muted p-3 rounded text-sm space-y-1">
                              <div>Taxable Value: <span className="font-semibold">₹{data.outwardSupplies?.totalTaxableValue?.toLocaleString('en-IN') || 0}</span></div>
                              <div>IGST: <span className="font-semibold">₹{data.outwardSupplies?.totalIGST?.toLocaleString('en-IN') || 0}</span></div>
                              <div>CGST: <span className="font-semibold">₹{data.outwardSupplies?.totalCGST?.toLocaleString('en-IN') || 0}</span></div>
                              <div>SGST: <span className="font-semibold">₹{data.outwardSupplies?.totalSGST?.toLocaleString('en-IN') || 0}</span></div>
                              <div className="border-t pt-1">Total Tax: <span className="font-semibold">₹{data.outwardSupplies?.totalTax?.toLocaleString('en-IN') || 0}</span></div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Inward Supplies (Purchases)</h4>
                            <div className="bg-muted p-3 rounded text-sm space-y-1">
                              <div>Taxable Value: <span className="font-semibold">₹{data.inwardSupplies?.totalTaxableValue?.toLocaleString('en-IN') || 0}</span></div>
                              <div>IGST: <span className="font-semibold">₹{data.inwardSupplies?.totalIGST?.toLocaleString('en-IN') || 0}</span></div>
                              <div>CGST: <span className="font-semibold">₹{data.inwardSupplies?.totalCGST?.toLocaleString('en-IN') || 0}</span></div>
                              <div>SGST: <span className="font-semibold">₹{data.inwardSupplies?.totalSGST?.toLocaleString('en-IN') || 0}</span></div>
                              <div className="border-t pt-1">Total Tax: <span className="font-semibold">₹{data.inwardSupplies?.totalTax?.toLocaleString('en-IN') || 0}</span></div>
                            </div>
                          </div>
                        </div>
                        
                        {data.inwardSupplies?.itemDetails && data.inwardSupplies.itemDetails.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Purchase Item Details</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">Taxable Value</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">CGST</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">SGST</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">Total GST</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.inwardSupplies.itemDetails.map((item, index) => (
                                    <tr key={index}>
                                      <td className="border border-gray-300 px-2 py-1">{item.item}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{item.taxableValue?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{item.cgst?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{item.sgst?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{item.totalGST?.toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium mb-2">Net Tax Liability</h4>
                          <div className="bg-muted p-3 rounded text-sm space-y-1">
                            <div>IGST: <span className="font-semibold">₹{data.netTaxLiability?.igst?.toLocaleString('en-IN') || 0}</span></div>
                            <div>CGST: <span className="font-semibold">₹{data.netTaxLiability?.cgst?.toLocaleString('en-IN') || 0}</span></div>
                            <div>SGST: <span className="font-semibold">₹{data.netTaxLiability?.sgst?.toLocaleString('en-IN') || 0}</span></div>
                            <div className="border-t pt-1">Total Tax Liability: <span className="font-semibold">₹{data.netTaxLiability?.totalTax?.toLocaleString('en-IN') || 0}</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Special formatting for GSTR-2A
                  if (viewReportModal.statement.statementType === 'gstr_2a') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded">
                          <h4 className="font-medium mb-2">GSTIN: {data.gstin}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>Total Inward Supplies: <span className="font-semibold">₹{data.totalInwardSupplies?.toLocaleString('en-IN') || 0}</span></div>
                            <div>Total Tax Credit: <span className="font-semibold">₹{data.totalTaxCredit?.toLocaleString('en-IN') || 0}</span></div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Summary</h4>
                          <div className="bg-muted p-3 rounded text-sm space-y-1">
                            <div>Total Invoices: <span className="font-semibold">{data.summary?.totalInvoices || 0}</span></div>
                            <div>Total Taxable Value: <span className="font-semibold">₹{data.summary?.totalTaxableValue?.toLocaleString('en-IN') || 0}</span></div>
                            <div>Total IGST: <span className="font-semibold">₹{data.summary?.totalIGST?.toLocaleString('en-IN') || 0}</span></div>
                            <div>Total CGST: <span className="font-semibold">₹{data.summary?.totalCGST?.toLocaleString('en-IN') || 0}</span></div>
                            <div>Total SGST: <span className="font-semibold">₹{data.summary?.totalSGST?.toLocaleString('en-IN') || 0}</span></div>
                            <div className="border-t pt-1">Total Tax: <span className="font-semibold">₹{data.summary?.totalTax?.toLocaleString('en-IN') || 0}</span></div>
                          </div>
                        </div>
                        
                        {data.invoices && data.invoices.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Supplier Invoice Details</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border border-gray-300 px-2 py-1 text-left">Vendor</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left">GSTIN</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left">Invoice No</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">Taxable Value</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">CGST</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">SGST</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">Total Tax</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.invoices.map((invoice, index) => (
                                    <tr key={index}>
                                      <td className="border border-gray-300 px-2 py-1">{invoice.tradeName}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-xs">{invoice.gstin}</td>
                                      <td className="border border-gray-300 px-2 py-1">{invoice.invoiceNumber}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{invoice.taxableValue?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{invoice.cgst?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{invoice.sgst?.toLocaleString('en-IN')}</td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{invoice.totalTax?.toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Special formatting for Bank Reconciliation
                  if (viewReportModal.statement.statementType === 'bank_reconciliation') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded">
                          <h4 className="font-medium mb-2">Bank Reconciliation Statement - {data.period}</h4>
                          <div className="text-sm text-muted-foreground">
                            Status: <span className="font-semibold text-green-600">{data.summary?.status || 'Reconciled'}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Bank Statement</h4>
                            <div className="bg-muted p-3 rounded text-sm space-y-1">
                              <div>Opening Balance: <span className="font-semibold">₹{data.bankStatement?.openingBalance?.toLocaleString('en-IN') || 0}</span></div>
                              <div>Total Deposits: <span className="font-semibold">₹{data.bankStatement?.totalDeposits?.toLocaleString('en-IN') || 0}</span></div>
                              <div>Total Withdrawals: <span className="font-semibold">₹{data.bankStatement?.totalWithdrawals?.toLocaleString('en-IN') || 0}</span></div>
                              <div>Bank Charges: <span className="font-semibold">₹{data.bankStatement?.bankCharges?.toLocaleString('en-IN') || 0}</span></div>
                              <div className="border-t pt-1">Closing Balance: <span className="font-semibold">₹{data.bankStatement?.closingBalance?.toLocaleString('en-IN') || 0}</span></div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Book Balance</h4>
                            <div className="bg-muted p-3 rounded text-sm space-y-1">
                              <div>Opening Balance: <span className="font-semibold">₹{data.bookBalance?.openingBalance?.toLocaleString('en-IN') || 0}</span></div>
                              <div>Total Receipts: <span className="font-semibold">₹{data.bookBalance?.totalReceipts?.toLocaleString('en-IN') || 0}</span></div>
                              <div>Total Payments: <span className="font-semibold">₹{data.bookBalance?.totalPayments?.toLocaleString('en-IN') || 0}</span></div>
                              <div className="border-t pt-1">Closing Balance: <span className="font-semibold">₹{data.bookBalance?.closingBalance?.toLocaleString('en-IN') || 0}</span></div>
                            </div>
                          </div>
                        </div>
                        
                        {data.reconciliationItems && data.reconciliationItems.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Reconciliation Items</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.reconciliationItems.map((item, index) => (
                                    <tr key={index}>
                                      <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                                      <td className="border border-gray-300 px-2 py-1">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          item.type.includes('add') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {item.type.replace('_', ' ').toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="border border-gray-300 px-2 py-1 text-right">₹{item.amount?.toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium mb-2">Reconciliation Summary</h4>
                          <div className="bg-muted p-3 rounded text-sm space-y-1">
                            <div>Total Items: <span className="font-semibold">{data.summary?.totalItems || 0}</span></div>
                            <div>Total Adjustments: <span className="font-semibold">₹{data.summary?.totalAdjustments?.toLocaleString('en-IN') || 0}</span></div>
                            <div>Reconciled Balance: <span className="font-semibold">₹{data.reconciledBalance?.toLocaleString('en-IN') || 0}</span></div>
                            <div>Variance: <span className="font-semibold">₹{data.totalVariance?.toLocaleString('en-IN') || 0}</span></div>
                            <div className="border-t pt-1">Status: <span className="font-semibold text-green-600">{data.summary?.status || 'Reconciled'}</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Default JSON display for other reports
                  return (
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  );
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
