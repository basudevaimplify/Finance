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
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Play, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Eye,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ComplianceCheck, Document } from "@shared/schema";

interface ComplianceCheckWithDocument extends ComplianceCheck {
  document?: Document;
}

export default function Compliance() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("all");
  const [selectedCheckType, setSelectedCheckType] = useState<string>("all");

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

  const { data: complianceChecks, isLoading: checksLoading } = useQuery<ComplianceCheckWithDocument[]>({
    queryKey: ["/api/compliance-checks", selectedDocumentId !== "all" ? selectedDocumentId : undefined],
    retry: false,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const runComplianceCheckMutation = useMutation({
    mutationFn: async (data: { documentId: string; checkType: string }) => {
      const response = await apiRequest('POST', '/api/compliance-checks/run', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compliance Check Started",
        description: "Compliance check has been initiated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-checks"] });
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
        title: "Check Failed",
        description: error.message || "Failed to run compliance check",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="badge-compliant">Compliant</Badge>;
      case 'non_compliant':
        return <Badge className="badge-non-compliant">Non-Compliant</Badge>;
      default:
        return <Badge className="badge-pending">Pending</Badge>;
    }
  };

  const getCheckTypeDisplay = (type: string) => {
    switch (type) {
      case 'gst': return 'GST Compliance';
      case 'tds': return 'TDS Compliance';
      case 'ind_as': return 'Ind AS 2025';
      case 'companies_act': return 'Companies Act 2013';
      default: return type;
    }
  };

  const getComplianceScore = () => {
    if (!complianceChecks || complianceChecks.length === 0) return 0;
    const compliantCount = complianceChecks.filter(check => check.status === 'compliant').length;
    return Math.round((compliantCount / complianceChecks.length) * 100);
  };

  const complianceOverview = [
    {
      title: "GST Returns Filing",
      status: "compliant",
      lastCheck: "2 hours ago",
      description: "All GST returns filed correctly with proper validations"
    },
    {
      title: "TDS Compliance",
      status: "compliant", 
      lastCheck: "4 hours ago",
      description: "TDS deductions and certificates validated successfully"
    },
    {
      title: "Companies Act 2013",
      status: "review_required",
      lastCheck: "1 day ago",
      description: "Schedule III format compliance needs review"
    },
    {
      title: "Ind AS 2025",
      status: "compliant",
      lastCheck: "6 hours ago",
      description: "Financial statements comply with Ind AS 2025 requirements"
    }
  ];

  const score = getComplianceScore();

  return (
    <PageLayout title="Compliance">
      <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Compliance Dashboard</h1>
                <p className="text-muted-foreground">
                  Monitor and manage regulatory compliance across all financial processes
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/compliance-checks"] })}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Compliance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                    <p className="text-3xl font-bold text-foreground">{score}%</p>
                  </div>
                  <div className="status-icon secondary">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="compliance-score-bar">
                    <div 
                      className="compliance-score-fill" 
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Checks</p>
                    <p className="text-3xl font-bold text-foreground">
                      {complianceChecks?.filter(c => c.status === 'pending').length || 0}
                    </p>
                  </div>
                  <div className="status-icon accent">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-secondary mr-1" />
                  <span className="text-muted-foreground">Processing...</span>
                </div>
              </CardContent>
            </Card>

            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Violations</p>
                    <p className="text-3xl font-bold text-foreground">
                      {complianceChecks?.filter(c => c.status === 'non_compliant').length || 0}
                    </p>
                  </div>
                  <div className="status-icon accent">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 text-accent mr-1" />
                  <span className="text-muted-foreground">Needs attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-bold text-foreground">2m ago</p>
                  </div>
                  <div className="status-icon primary">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <div className="agent-status-dot agent-status-running mr-2" />
                  <span className="text-muted-foreground">Auto-refresh enabled</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checks">Compliance Checks</TabsTrigger>
              <TabsTrigger value="regulations">Regulations</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceOverview.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            item.status === 'compliant' ? 'bg-secondary' : 'bg-accent'
                          }`} />
                          <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(item.status)}
                          <p className="text-sm text-muted-foreground mt-1">{item.lastCheck}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checks" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Compliance Checks</CardTitle>
                    <div className="flex items-center space-x-4">
                      <Select value={selectedCheckType} onValueChange={setSelectedCheckType}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Check Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="gst">GST</SelectItem>
                          <SelectItem value="tds">TDS</SelectItem>
                          <SelectItem value="ind_as">Ind AS</SelectItem>
                          <SelectItem value="companies_act">Companies Act</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (selectedDocumentId !== "all") {
                            runComplianceCheckMutation.mutate({
                              documentId: selectedDocumentId,
                              checkType: selectedCheckType !== "all" ? selectedCheckType : "gst"
                            });
                          } else {
                            toast({
                              title: "Select Document",
                              description: "Please select a document to run compliance check",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={runComplianceCheckMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Check
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {checksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="loading-spinner h-8 w-8" />
                    </div>
                  ) : !complianceChecks || complianceChecks.length === 0 ? (
                    <div className="empty-state">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No compliance checks found</p>
                      <p className="text-sm text-gray-400">Run your first compliance check to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Check Type</TableHead>
                            <TableHead>Document</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Checked</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {complianceChecks
                            .filter(check => selectedCheckType === "all" || check.checkType === selectedCheckType)
                            .map((check) => (
                            <TableRow key={check.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{getCheckTypeDisplay(check.checkType)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {check.document?.originalName || 'Unknown Document'}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(check.status)}
                              </TableCell>
                              <TableCell>
                                {check.findings?.score ? `${check.findings.score}%` : '-'}
                              </TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(check.checkedAt), { addSuffix: true })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
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

            <TabsContent value="regulations" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Indian Accounting Standards (Ind AS) 2025</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ind AS 21 (Foreign Exchange)</span>
                        <Badge className="badge-compliant">Updated</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Schedule III Compliance</span>
                        <Badge className="badge-compliant">Compliant</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Disclosure Requirements</span>
                        <Badge className="badge-compliant">Met</Badge>
                      </div>
                      <div className="mt-4 p-3 bg-secondary/10 rounded text-sm text-secondary">
                        ✓ All Ind AS 2025 requirements are being met
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Companies Act 2013</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Section 129 (Financial Statements)</span>
                        <Badge className="badge-compliant">Compliant</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Schedule III Format</span>
                        <Badge className="bg-accent/10 text-accent">Review Required</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Board Resolution</span>
                        <Badge className="badge-pending">Pending</Badge>
                      </div>
                      <div className="mt-4 p-3 bg-accent/10 rounded text-sm text-accent">
                        ⚠ Some requirements need attention
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>GST Regulations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">GSTR-1 Filing</span>
                        <Badge className="badge-compliant">Filed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">GSTR-3B Filing</span>
                        <Badge className="badge-compliant">Filed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">ITC Reconciliation</span>
                        <Badge className="badge-compliant">Matched</Badge>
                      </div>
                      <div className="mt-4 p-3 bg-secondary/10 rounded text-sm text-secondary">
                        ✓ All GST obligations are current
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>TDS Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Form 26Q Filing</span>
                        <Badge className="badge-compliant">Filed</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">TDS Certificates</span>
                        <Badge className="badge-compliant">Issued</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Challan Matching</span>
                        <Badge className="badge-compliant">Matched</Badge>
                      </div>
                      <div className="mt-4 p-3 bg-secondary/10 rounded text-sm text-secondary">
                        ✓ TDS compliance is up to date
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Quarterly Compliance Report", period: "Q3 2025", status: "ready" },
                      { name: "GST Compliance Summary", period: "December 2024", status: "ready" },
                      { name: "TDS Compliance Report", period: "Q3 2025", status: "generating" },
                      { name: "Ind AS Compliance Check", period: "Q3 2025", status: "ready" },
                      { name: "Companies Act Compliance", period: "Q3 2025", status: "pending" },
                      { name: "Annual Compliance Report", period: "FY 2024-25", status: "pending" },
                    ].map((report, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{report.name}</h4>
                            <p className="text-sm text-muted-foreground">{report.period}</p>
                          </div>
                          {report.status === 'ready' && (
                            <Badge className="badge-compliant">Ready</Badge>
                          )}
                          {report.status === 'generating' && (
                            <Badge className="bg-accent/10 text-accent">Generating</Badge>
                          )}
                          {report.status === 'pending' && (
                            <Badge className="badge-pending">Pending</Badge>
                          )}
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" variant="outline" disabled={report.status !== 'ready'}>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </PageLayout>
  );
}
