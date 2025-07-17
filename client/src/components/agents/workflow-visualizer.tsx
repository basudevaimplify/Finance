import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Cog, AlertCircle, Play, Pause, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowState, WorkflowNode } from "@/types";

interface WorkflowVisualizerProps {
  workflow: WorkflowState;
  onNodeAction?: (nodeId: string, action: string) => void;
}

const nodeDefinitions = {
  classifier: {
    name: "ClassifierBot",
    description: "Classifies documents using LLM analysis",
    category: "preprocessing"
  },
  extractor: {
    name: "DataExtractor", 
    description: "Extracts tabular data from documents",
    category: "preprocessing"
  },
  gst_validator: {
    name: "GSTValidator",
    description: "Validates GST compliance and calculations",
    category: "validation"
  },
  tds_validator: {
    name: "TDSValidator",
    description: "Validates TDS deductions and compliance",
    category: "validation"
  },
  journal_bot: {
    name: "JournalBot",
    description: "Generates double-entry journal entries",
    category: "processing"
  },
  conso_ai: {
    name: "ConsoAI",
    description: "Generates consolidated financial statements",
    category: "reporting"
  },
  audit_agent: {
    name: "AuditAgent",
    description: "Performs final audit checks and validation",
    category: "audit"
  }
};

export default function WorkflowVisualizer({ workflow, onNodeAction }: WorkflowVisualizerProps) {
  const getNodeIcon = (node: WorkflowNode) => {
    switch (node.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'running':
        return <Cog className="h-4 w-4 text-white animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-secondary';
      case 'running': return 'bg-accent';
      case 'failed': return 'bg-destructive';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-secondary/10 text-secondary">Completed</Badge>;
      case 'running': return <Badge className="bg-accent/10 text-accent">Running</Badge>;
      case 'failed': return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      case 'paused': return <Badge className="bg-gray-100 text-gray-600">Paused</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600">Idle</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'preprocessing': return 'border-blue-200 bg-blue-50';
      case 'validation': return 'border-orange-200 bg-orange-50';
      case 'processing': return 'border-green-200 bg-green-50';
      case 'reporting': return 'border-purple-200 bg-purple-50';
      case 'audit': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const nodeOrder = ['classifier', 'extractor', 'gst_validator', 'tds_validator', 'journal_bot', 'conso_ai', 'audit_agent'];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Workflow Execution</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Document: {workflow.documentId.slice(-8)}
            </Badge>
            {workflow.completed ? (
              <Badge className="bg-secondary/10 text-secondary">Completed</Badge>
            ) : (
              <Badge className="bg-accent/10 text-accent">Running</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {nodeOrder.map((nodeId) => {
            const node = workflow.nodes[nodeId];
            const definition = nodeDefinitions[nodeId];
            
            if (!node || !definition) return null;
            
            return (
              <div 
                key={nodeId}
                className={cn(
                  "workflow-step",
                  node.status === 'running' && "active",
                  node.status === 'completed' && "completed",
                  node.status === 'failed' && "failed"
                )}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={cn(
                    "workflow-node",
                    getNodeColor(node.status)
                  )}>
                    {getNodeIcon(node)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{definition.name}</h4>
                        <p className="text-sm text-muted-foreground">{definition.description}</p>
                      </div>
                      {getStatusBadge(node.status)}
                    </div>
                    
                    {node.status === 'running' && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="loading-spinner h-3 w-3" />
                          <span className="text-xs text-muted-foreground">Processing...</span>
                        </div>
                      </div>
                    )}
                    
                    {node.error && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        Error: {node.error}
                      </div>
                    )}
                    
                    {node.output && node.status === 'completed' && (
                      <div className="mt-2 p-2 bg-secondary/10 rounded text-xs text-secondary">
                        ✓ Output: {JSON.stringify(node.output).slice(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
                
                {onNodeAction && (
                  <div className="flex items-center space-x-2">
                    {node.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNodeAction(nodeId, 'pause')}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    )}
                    {node.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNodeAction(nodeId, 'resume')}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    {node.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNodeAction(nodeId, 'retry')}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {workflow.error && (
          <div className="mt-4 p-4 bg-destructive/10 rounded border border-destructive/20">
            <h4 className="font-medium text-destructive mb-2">Workflow Error</h4>
            <p className="text-sm text-destructive">{workflow.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
