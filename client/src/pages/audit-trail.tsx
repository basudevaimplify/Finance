import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  User,
  Bot,
  FileText,
  Settings,
  Activity,
  Calendar,
  Clock,
  Eye,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { AuditTrail } from "@shared/schema";

interface AuditTrailWithUser extends AuditTrail {
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function AuditTrailPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

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

  const { data: auditTrail, isLoading: trailLoading } = useQuery<AuditTrailWithUser[]>({
    queryKey: ["/api/audit-trail", { limit: 100 }],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    if (action.includes('Agent') || action.includes('Bot') || action.includes('AI')) {
      return <Bot className="h-4 w-4 text-secondary" />;
    } else if (action.includes('User') || action.includes('uploaded') || action.includes('deleted')) {
      return <User className="h-4 w-4 text-accent" />;
    } else if (action.includes('document') || action.includes('file')) {
      return <FileText className="h-4 w-4 text-primary" />;
    } else {
      return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('completed') || action.includes('success')) {
      return <Badge className="badge-compliant">Success</Badge>;
    } else if (action.includes('failed') || action.includes('error')) {
      return <Badge className="badge-non-compliant">Failed</Badge>;
    } else if (action.includes('started') || action.includes('processing')) {
      return <Badge className="bg-accent/10 text-accent">In Progress</Badge>;
    } else {
      return <Badge className="badge-pending">Info</Badge>;
    }
  };

  const filterAuditTrail = (trail: AuditTrailWithUser[]) => {
    return trail.filter((entry) => {
      const matchesSearch = searchTerm === "" || 
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.details && JSON.stringify(entry.details).toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAction = selectedAction === "all" || entry.action.toLowerCase().includes(selectedAction.toLowerCase());
      const matchesEntityType = selectedEntityType === "all" || entry.entityType === selectedEntityType;
      
      // Time range filter
      const entryTime = new Date(entry.timestamp);
      const now = new Date();
      let matchesTimeRange = true;
      
      switch (selectedTimeRange) {
        case "1h":
          matchesTimeRange = now.getTime() - entryTime.getTime() <= 60 * 60 * 1000;
          break;
        case "24h":
          matchesTimeRange = now.getTime() - entryTime.getTime() <= 24 * 60 * 60 * 1000;
          break;
        case "7d":
          matchesTimeRange = now.getTime() - entryTime.getTime() <= 7 * 24 * 60 * 60 * 1000;
          break;
        case "30d":
          matchesTimeRange = now.getTime() - entryTime.getTime() <= 30 * 24 * 60 * 60 * 1000;
          break;
      }
      
      return matchesSearch && matchesAction && matchesEntityType && matchesTimeRange;
    });
  };

  // Mock data for demonstration
  const mockAuditTrail: AuditTrailWithUser[] = [
    {
      id: '1',
      action: 'GSTValidator Agent completed',
      entityType: 'agent_job',
      entityId: 'job-001',
      userId: 'system',
      details: { 
        description: 'Validated GST-2A reconciliation for trial_balance_q3.xlsx',
        jobId: 'QRT-2025-001',
        duration: '45 seconds',
        validationsPassed: 12,
        validationsFailed: 0
      },
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    },
    {
      id: '2',
      action: 'JournalBot started',
      entityType: 'agent_job',
      entityId: 'job-002',
      userId: 'system',
      details: { 
        description: 'Processing journal entries generation',
        jobId: 'QRT-2025-002',
        inputRecords: 156,
        expectedOutput: 'Double-entry journal entries'
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    },
    {
      id: '3',
      action: 'User uploaded document',
      entityType: 'document',
      entityId: 'doc-001',
      userId: 'user-123',
      details: { 
        fileName: 'trial_balance_q3.xlsx',
        fileSize: '2.4 MB',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      user: { firstName: 'Priya', lastName: 'Sharma' }
    },
    {
      id: '4',
      action: 'ConsoAI completed',
      entityType: 'agent_job',
      entityId: 'job-003',
      userId: 'system',
      details: { 
        description: 'Generated consolidated financial statements',
        jobId: 'QRT-2025-003',
        statementsGenerated: ['Trial Balance', 'P&L', 'Balance Sheet'],
        processingTime: '2 minutes 15 seconds'
      },
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    },
    {
      id: '5',
      action: 'Compliance check failed',
      entityType: 'compliance_check',
      entityId: 'check-001',
      userId: 'system',
      details: { 
        checkType: 'TDS',
        reason: 'Invalid PAN format detected',
        documentId: 'doc-001',
        violations: ['PAN validation failed', 'Section code mismatch']
      },
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      user: { firstName: 'System', lastName: '' }
    }
  ];

  const trailToShow = auditTrail || mockAuditTrail;
  const filteredTrail = filterAuditTrail(trailToShow);

  const activitySummary = {
    totalActions: trailToShow.length,
    userActions: trailToShow.filter(t => t.action.includes('User')).length,
    agentActions: trailToShow.filter(t => t.action.includes('Agent') || t.action.includes('Bot')).length,
    failedActions: trailToShow.filter(t => t.action.includes('failed')).length,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Audit Trail</h1>
                <p className="text-muted-foreground">
                  Complete audit log of all system activities and user actions
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                    <p className="text-3xl font-bold text-foreground">{activitySummary.totalActions}</p>
                  </div>
                  <div className="status-icon primary">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                  <span className="text-muted-foreground">Last 24 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Actions</p>
                    <p className="text-3xl font-bold text-foreground">{activitySummary.userActions}</p>
                  </div>
                  <div className="status-icon accent">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-accent font-medium">
                    {Math.round((activitySummary.userActions / activitySummary.totalActions) * 100)}%
                  </span>
                  <span className="text-muted-foreground ml-1">of total</span>
                </div>
              </CardContent>
            </Card>

            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Agent Actions</p>
                    <p className="text-3xl font-bold text-foreground">{activitySummary.agentActions}</p>
                  </div>
                  <div className="status-icon secondary">
                    <Bot className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-secondary font-medium">
                    {Math.round((activitySummary.agentActions / activitySummary.totalActions) * 100)}%
                  </span>
                  <span className="text-muted-foreground ml-1">automated</span>
                </div>
              </CardContent>
            </Card>

            <Card className="status-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed Actions</p>
                    <p className="text-3xl font-bold text-foreground">{activitySummary.failedActions}</p>
                  </div>
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  {activitySummary.failedActions === 0 ? (
                    <span className="text-secondary">✓ All actions successful</span>
                  ) : (
                    <span className="text-destructive">Needs attention</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
              <TabsTrigger value="filtered">Filtered View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="export">Export & Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Audit Trail</CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Showing {filteredTrail.length} of {trailToShow.length} entries
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {trailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="loading-spinner h-8 w-8" />
                    </div>
                  ) : filteredTrail.length === 0 ? (
                    <div className="empty-state">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No audit trail entries found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters or check back later</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTrail.slice(0, 20).map((entry) => (
                        <div key={entry.id} className="audit-trail-entry">
                          <div className="flex items-center space-x-3">
                            {getActionIcon(entry.action)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {entry.action}
                                </p>
                                {getActionBadge(entry.action)}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {entry.details?.description || 'No description available'}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {entry.entityType}: {entry.entityId.slice(-8)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {entry.user?.firstName} {entry.user?.lastName}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="filtered" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filter & Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search actions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Action Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="agent">Agent Actions</SelectItem>
                        <SelectItem value="user">User Actions</SelectItem>
                        <SelectItem value="failed">Failed Actions</SelectItem>
                        <SelectItem value="completed">Completed Actions</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Entity Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="agent_job">Agent Jobs</SelectItem>
                        <SelectItem value="compliance_check">Compliance Checks</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">Last Hour</SelectItem>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Entity</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTrail.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getActionIcon(entry.action)}
                                <span className="font-medium">{entry.action}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{entry.entityType}</p>
                                <p className="text-xs text-muted-foreground">{entry.entityId}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {entry.user?.firstName} {entry.user?.lastName}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{format(new Date(entry.timestamp), 'MMM d, HH:mm')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getActionBadge(entry.action)}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Agent Actions</span>
                          <span className="text-sm font-medium">{activitySummary.agentActions}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(activitySummary.agentActions / activitySummary.totalActions) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">User Actions</span>
                          <span className="text-sm font-medium">{activitySummary.userActions}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(activitySummary.userActions / activitySummary.totalActions) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Failed Actions</span>
                          <span className="text-sm font-medium">{activitySummary.failedActions}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="bg-destructive h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(activitySummary.failedActions / activitySummary.totalActions) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Peak Activity</span>
                        <span className="text-sm font-medium">14:30 - 15:30</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Most Active Agent</span>
                        <span className="text-sm font-medium">GSTValidator</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Most Active User</span>
                        <span className="text-sm font-medium">Priya Sharma</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-medium text-secondary">
                          {Math.round(((activitySummary.totalActions - activitySummary.failedActions) / activitySummary.totalActions) * 100)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Complete Audit Log", format: "CSV", period: "All Time", size: "~15 MB" },
                      { name: "Recent Activity", format: "JSON", period: "Last 24 Hours", size: "~2.5 MB" },
                      { name: "Agent Activity Report", format: "PDF", period: "Last 7 Days", size: "~800 KB" },
                      { name: "User Activity Summary", format: "Excel", period: "Last 30 Days", size: "~1.2 MB" },
                      { name: "Failed Actions Report", format: "PDF", period: "Last 7 Days", size: "~400 KB" },
                      { name: "Compliance Audit Trail", format: "JSON", period: "Q3 2025", size: "~3.1 MB" },
                    ].map((export_option, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-foreground">{export_option.name}</h4>
                            <p className="text-sm text-muted-foreground">{export_option.period}</p>
                          </div>
                          <Badge variant="outline">{export_option.format}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{export_option.size}</span>
                          <Button size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Export
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
      </div>
    </div>
  );
}
