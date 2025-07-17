import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Cog, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkflowState } from "@/types";

interface AgentWorkflowCardProps {
  workflows?: WorkflowState[];
  isLoading: boolean;
}

const workflowSteps = [
  { id: 'classifier', name: 'ClassifierBot', description: 'Document classification complete' },
  { id: 'extractor', name: 'DataExtractor', description: 'Tabular data extraction complete' },
  { id: 'gst_validator', name: 'GSTValidator', description: 'Validating GST compliance...' },
  { id: 'journal_bot', name: 'JournalBot', description: 'Waiting for GST validation' },
  { id: 'conso_ai', name: 'ConsoAI', description: 'Financial statement generation' },
];

export default function AgentWorkflowCard({ workflows, isLoading }: AgentWorkflowCardProps) {
  if (isLoading) {
    return (
      <Card className="status-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">LangGraph Agent Workflow</CardTitle>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeWorkflow = workflows?.[0];
  const isRunning = activeWorkflow && !activeWorkflow.completed;

  return (
    <Card className="status-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">LangGraph Agent Workflow</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "agent-status-dot",
              isRunning ? "agent-status-running" : "agent-status-completed"
            )} />
            <span className="text-sm text-muted-foreground">
              {isRunning ? "Running" : "Idle"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!activeWorkflow ? (
          <div className="empty-state">
            <p>No active workflows</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const node = activeWorkflow.nodes[step.id];
              const status = node?.status || 'idle';
              
              return (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={cn(
                    "workflow-node",
                    status === 'completed' ? "completed" : 
                    status === 'running' ? "running" : 
                    status === 'failed' ? "failed" : "queued"
                  )}>
                    {status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                    {status === 'running' && (
                      <Cog className="h-4 w-4 text-white animate-spin" />
                    )}
                    {status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-white" />
                    )}
                    {(status === 'idle' || status === 'paused') && (
                      <Clock className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      status === 'completed' || status === 'running' ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs",
                    status === 'completed' ? "text-secondary" : 
                    status === 'running' ? "text-accent" : 
                    status === 'failed' ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {status === 'completed' && '✓ Done'}
                    {status === 'running' && '⚠ Processing'}
                    {status === 'failed' && '✗ Failed'}
                    {(status === 'idle' || status === 'paused') && '⏳ Queued'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
