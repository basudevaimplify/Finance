import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import WorkflowVisualizer from "@/components/agents/workflow-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Clock, CheckCircle, AlertCircle, Play, Pause, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { WorkflowState, WorkflowNode } from "@/types";

export default function AgentWorkflows() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

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

  const { data: workflows, isLoading: workflowsLoading } = useQuery<WorkflowState[]>({
    queryKey: ["/api/workflows"],
    retry: false,
  });

  const { data: agentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/agent-jobs"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleNodeAction = (nodeId: string, action: string) => {
    toast({
      title: "Action Initiated",
      description: `${action} action initiated for ${nodeId}`,
    });
  };

  const getWorkflowStatus = (workflow: WorkflowState) => {
    if (workflow.completed) return 'completed';
    if (workflow.error) return 'failed';
    return 'running';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-secondary/10 text-secondary">Completed</Badge>;
      case 'running':
        return <Badge className="bg-accent/10 text-accent">Running</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">Idle</Badge>;
    }
  };

  const mockWorkflows: WorkflowState[] = [
    {
      documentId: "doc-123",
      currentNode: "gst_validator",
      completed: false,
      nodes: {
        classifier: { id: "classifier", name: "ClassifierBot", type: "agent", status: "completed", dependencies: [] },
        extractor: { id: "extractor", name: "DataExtractor", type: "agent", status: "completed", dependencies: ["classifier"] },
        gst_validator: { id: "gst_validator", name: "GSTValidator", type: "agent", status: "running", dependencies: ["extractor"] },
        journal_bot: { id: "journal_bot", name: "JournalBot", type: "agent", status: "idle", dependencies: ["gst_validator"] },
        conso_ai: { id: "conso_ai", name: "ConsoAI", type: "agent", status: "idle", dependencies: ["journal_bot"] },
        audit_agent: { id: "audit_agent", name: "AuditAgent", type: "agent", status: "idle", dependencies: ["conso_ai"] },
      }
    }
  ];

  const workflowsToShow = workflows || mockWorkflows;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Agent Workflows</h1>
            <p className="text-muted-foreground">
              Monitor and manage LangGraph agent execution workflows
            </p>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Workflows</TabsTrigger>
              <TabsTrigger value="history">Workflow History</TabsTrigger>
              <TabsTrigger value="agents">Agent Status</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6">
              {workflowsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="loading-spinner h-8 w-8" />
                </div>
              ) : !workflowsToShow || workflowsToShow.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="empty-state">
                      <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No active workflows</p>
                      <p className="text-sm text-gray-400">Upload a document to start a new workflow</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {workflowsToShow.map((workflow, index) => (
                    <WorkflowVisualizer
                      key={index}
                      workflow={workflow}
                      onNodeAction={handleNodeAction}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Workflow Executions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">Document Processing Workflow</p>
                            <p className="text-sm text-muted-foreground">
                              Document: trial_balance_q3.xlsx
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-secondary/10 text-secondary">Completed</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {i} hours ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "ClassifierBot", status: "running", lastRun: "2 minutes ago" },
                  { name: "DataExtractor", status: "idle", lastRun: "5 minutes ago" },
                  { name: "GSTValidator", status: "running", lastRun: "1 minute ago" },
                  { name: "JournalBot", status: "idle", lastRun: "10 minutes ago" },
                  { name: "ConsoAI", status: "idle", lastRun: "15 minutes ago" },
                  { name: "AuditAgent", status: "idle", lastRun: "20 minutes ago" },
                ].map((agent) => (
                  <Card key={agent.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <div className={`w-3 h-3 rounded-full ${
                          agent.status === 'running' ? 'bg-secondary' : 'bg-gray-300'
                        }`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={agent.status === 'running' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Run</span>
                          <span className="text-sm">{agent.lastRun}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
