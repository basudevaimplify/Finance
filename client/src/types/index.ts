export interface DashboardStats {
  documentsProcessed: number;
  activeAgents: number;
  validationErrors: number;
  complianceScore: number;
}

export interface WorkflowNode {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  type: 'agent' | 'condition' | 'action';
  dependencies: string[];
  output?: any;
  error?: string;
}

export interface WorkflowState {
  documentId: string;
  currentNode: string;
  nodes: Record<string, WorkflowNode>;
  completed: boolean;
  error?: string;
}

export interface FileUploadProgress {
  fileName: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}
