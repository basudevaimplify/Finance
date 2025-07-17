import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  Bot, 
  User, 
  Play, 
  Pause, 
  Square, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Database,
  Shield,
  Calculator,
  BarChart3,
  Search,
  MessageSquare,
  Settings,
  Info,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageLayout from "@/components/layout/PageLayout";

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
}

interface AgentAction {
  id: string;
  agentName: string;
  action: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number;
  details?: string;
}

interface AgentOutput {
  id: string;
  agentName: string;
  outputType: 'data' | 'report' | 'validation' | 'error';
  content: any;
  timestamp: Date;
  confidence?: number;
}

interface WorkflowStatus {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentAgent?: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  startTime?: Date;
  endTime?: Date;
}

const agentDefinitions = [
  { 
    name: 'ClassifierBot', 
    icon: Search, 
    description: 'Document type classification',
    color: 'bg-blue-500'
  },
  { 
    name: 'DataExtractor', 
    icon: FileText, 
    description: 'Tabular data extraction',
    color: 'bg-green-500'
  },
  { 
    name: 'GSTValidator', 
    icon: Shield, 
    description: 'GST compliance validation',
    color: 'bg-yellow-500'
  },
  { 
    name: 'TDSValidator', 
    icon: Calculator, 
    description: 'TDS deduction validation',
    color: 'bg-purple-500'
  },
  { 
    name: 'JournalBot', 
    icon: Database, 
    description: 'Double-entry journal generation',
    color: 'bg-orange-500'
  },
  { 
    name: 'ConsoAI', 
    icon: BarChart3, 
    description: 'Financial statement consolidation',
    color: 'bg-red-500'
  },
  { 
    name: 'AuditAgent', 
    icon: CheckCircle, 
    description: 'Final audit checks',
    color: 'bg-indigo-500'
  }
];

export default function AgentChat() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to the QRT Closure Agent Chat! I can answer questions about your financial data, generate reports, and help with platform actions. Ask me anything about your documents, compliance status, or financial insights.',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow' | 'actions'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

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

  // Mock workflow status - in real implementation this would come from WebSocket
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    id: 'workflow-1',
    status: 'idle',
    progress: 0,
    totalSteps: 7,
    completedSteps: 0
  });

  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);

  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentActions, agentOutputs]);

  const startWorkflowMutation = useMutation({
    mutationFn: async (data: { message: string; documentId?: string }) => {
      // Debug: Check token before making request
      const token = localStorage.getItem('access_token');
      console.log('StartWorkflow - Token check:', { hasToken: !!token, tokenLength: token?.length });
      
      // Try direct fetch approach to ensure headers are sent
      const response = await fetch('/api/agent-chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsRunning(true);
      setWorkflowStatus(prev => ({
        ...prev,
        status: 'running',
        startTime: new Date()
      }));
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Starting workflow for document: ${data.documentName}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      
      // Simulate agent workflow
      simulateAgentWorkflow(data.workflowId);
    },
    onError: (error) => {
      console.error("Workflow start error:", error);
      toast({
        title: "Error",
        description: `Failed to start workflow: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const stopWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/agent-chat/stop', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: () => {
      setIsRunning(false);
      setWorkflowStatus(prev => ({
        ...prev,
        status: 'idle',
        endTime: new Date()
      }));
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/agent-chat/message', {
        method: 'POST',
        body: JSON.stringify({ message }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data) => {
      const agentResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'agent',
        content: data.response,
        timestamp: new Date(),
        agentName: data.agentName
      };
      setMessages(prev => [...prev, agentResponse]);
    }
  });

  // New natural language chat mutation
  const naturalLanguageChatMutation = useMutation({
    mutationFn: async (query: string) => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ query }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      const agentResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'agent',
        content: data.result.response,
        timestamp: new Date(),
        agentName: 'AI Assistant'
      };
      setMessages(prev => [...prev, agentResponse]);
      
      // Add suggested actions if available
      if (data.result.suggestedActions && data.result.suggestedActions.length > 0) {
        const actionsMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'system',
          content: `💡 Suggested actions:\n${data.result.suggestedActions.map((action: string, index: number) => `${index + 1}. ${action}`).join('\n')}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, actionsMessage]);
      }
      
      // Show confidence level if low
      if (data.result.confidence < 0.7) {
        const confidenceMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'system',
          content: `⚠️ I'm ${Math.round(data.result.confidence * 100)}% confident in this response. You may want to verify or provide more specific information.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confidenceMessage]);
      }
    },
    onError: (error) => {
      console.error("Natural language chat error:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const simulateAgentWorkflow = (workflowId: string) => {
    const agents = agentDefinitions.slice();
    let currentStep = 0;

    const processNextAgent = () => {
      if (currentStep >= agents.length) {
        setWorkflowStatus(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          completedSteps: agents.length,
          endTime: new Date()
        }));
        setIsRunning(false);
        return;
      }

      const agent = agents[currentStep];
      const actionId = `action-${Date.now()}-${currentStep}`;
      
      // Add agent action
      const action: AgentAction = {
        id: actionId,
        agentName: agent.name,
        action: `Processing with ${agent.description}`,
        status: 'running',
        timestamp: new Date()
      };
      
      setAgentActions(prev => [...prev, action]);
      
      // Update workflow status
      setWorkflowStatus(prev => ({
        ...prev,
        currentAgent: agent.name,
        progress: ((currentStep + 1) / agents.length) * 100,
        completedSteps: currentStep + 1
      }));

      // Simulate processing time
      setTimeout(() => {
        // Complete the action
        setAgentActions(prev => prev.map(a => 
          a.id === actionId 
            ? { ...a, status: 'completed', duration: Math.random() * 3000 + 1000 }
            : a
        ));

        // Add output
        const output: AgentOutput = {
          id: `output-${Date.now()}-${currentStep}`,
          agentName: agent.name,
          outputType: currentStep === agents.length - 1 ? 'report' : 'data',
          content: generateMockOutput(agent.name),
          timestamp: new Date(),
          confidence: Math.random() * 0.3 + 0.7
        };
        
        setAgentOutputs(prev => [...prev, output]);

        // Add chat message
        const chatMessage: ChatMessage = {
          id: `msg-${Date.now()}-${currentStep}`,
          type: 'agent',
          content: `${agent.name}: ${action.action} completed successfully`,
          timestamp: new Date(),
          agentName: agent.name
        };
        
        setMessages(prev => [...prev, chatMessage]);

        currentStep++;
        setTimeout(processNextAgent, 1000);
      }, Math.random() * 2000 + 1000);
    };

    processNextAgent();
  };

  const generateMockOutput = (agentName: string) => {
    switch (agentName) {
      case 'ClassifierBot':
        return {
          documentType: 'vendor_invoice',
          confidence: 0.95,
          fields: ['invoiceNumber', 'vendorName', 'amount', 'date']
        };
      case 'DataExtractor':
        return {
          extractedRows: 15,
          fields: ['Invoice #', 'Vendor', 'Amount', 'GST', 'Date'],
          totalAmount: 125000
        };
      case 'GSTValidator':
        return {
          gstCompliance: true,
          validGSTIN: true,
          taxCalculation: 'correct',
          issues: []
        };
      case 'TDSValidator':
        return {
          tdsCompliance: true,
          deductionRate: '10%',
          panValidation: true,
          issues: []
        };
      case 'JournalBot':
        return {
          journalEntries: 8,
          totalDebit: 125000,
          totalCredit: 125000,
          balanced: true
        };
      case 'ConsoAI':
        return {
          statements: ['P&L', 'Balance Sheet', 'Cash Flow'],
          totalAssets: 2500000,
          totalLiabilities: 1800000
        };
      case 'AuditAgent':
        return {
          auditScore: 98,
          issues: 0,
          recommendations: 2,
          status: 'passed'
        };
      default:
        return { status: 'processed' };
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Use natural language chat for all messages
    naturalLanguageChatMutation.mutate(newMessage);

    setNewMessage("");
  };

  const getAgentIcon = (agentName: string) => {
    const agent = agentDefinitions.find(a => a.name === agentName);
    return agent ? agent.icon : Bot;
  };

  const getAgentColor = (agentName: string) => {
    const agent = agentDefinitions.find(a => a.name === agentName);
    return agent ? agent.color : 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4" />;
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
    <PageLayout title="Agent Chat">
      <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Agent Chat</h2>
                <p className="text-muted-foreground">
                  Chat with AI agents to automate your quarterly closure process
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={workflowStatus.status === 'running' ? 'default' : 'secondary'}>
                  <Activity className="w-3 h-3 mr-1" />
                  {workflowStatus.status}
                </Badge>
                {isRunning && (
                  <Button onClick={() => stopWorkflowMutation.mutate()} variant="destructive" size="sm">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Workflow
                  </Button>
                )}
              </div>
            </div>

      {/* Quick Start Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Zap className="w-5 h-5 mr-2" />
            Quick Start
          </CardTitle>
          <CardDescription className="text-blue-600">
            Ask natural language questions about your data or try these examples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Example Questions:</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("How much sales revenue do I have this quarter?")}
                  className="w-full text-left justify-start"
                >
                  How much sales revenue do I have this quarter?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("What's my current TDS liability?")}
                  className="w-full text-left justify-start"
                >
                  What's my current TDS liability?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("Show me my top 5 expenses")}
                  className="w-full text-left justify-start"
                >
                  Show me my top 5 expenses
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("Generate a compliance report")}
                  className="w-full text-left justify-start"
                >
                  Generate a compliance report
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Quick Actions:</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => startWorkflowMutation.mutate({ 
                    message: "Start processing documents", 
                    documentId: selectedDocument === "all" ? undefined : selectedDocument 
                  })}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Workflow
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNewMessage("help")}
                  className="w-full"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('chat')}
          className="flex-1"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat
        </Button>
        <Button
          variant={activeTab === 'workflow' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('workflow')}
          className="flex-1"
        >
          <Activity className="w-4 h-4 mr-2" />
          Workflow
        </Button>
        <Button
          variant={activeTab === 'actions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('actions')}
          className="flex-1"
        >
          <Bot className="w-4 h-4 mr-2" />
          Agent Actions
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat with AI Agents
            </CardTitle>
            <CardDescription>
              Send commands and receive updates from AI agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-xs lg:max-w-md px-4 py-3 rounded-lg
                        ${message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : message.type === 'system'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }
                      `}
                    >
                      {message.agentName && (
                        <div className="text-xs font-medium mb-1 flex items-center">
                          <Bot className="w-3 h-3 mr-1" />
                          {message.agentName}
                        </div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Ask me anything about your financial data..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || naturalLanguageChatMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'workflow' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Workflow Status
            </CardTitle>
            <CardDescription>
              Real-time agent workflow monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {workflowStatus.completedSteps} / {workflowStatus.totalSteps} steps
                </span>
              </div>
              <Progress value={workflowStatus.progress} className="w-full" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {agentDefinitions.map((agent, index) => {
                  const Icon = agent.icon;
                  const isActive = workflowStatus.currentAgent === agent.name;
                  const isCompleted = workflowStatus.completedSteps > index;
                  
                  return (
                    <div
                      key={agent.name}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-200
                        ${isActive ? 'border-blue-500 bg-blue-50' : ''}
                        ${isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}
                      `}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-3 rounded-full ${agent.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-center">{agent.name}</span>
                        <span className="text-xs text-muted-foreground text-center">{agent.description}</span>
                      </div>
                      {isActive && (
                        <div className="absolute -top-1 -right-1">
                          <Activity className="w-4 h-4 text-blue-500 animate-spin" />
                        </div>
                      )}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Agent Actions
              </CardTitle>
              <CardDescription>
                Real-time agent activity and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {agentActions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No agent actions yet</p>
                      <p className="text-sm">Start a workflow to see agent activity</p>
                    </div>
                  ) : (
                    agentActions.map((action) => {
                      const Icon = getAgentIcon(action.agentName);
                      return (
                        <div
                          key={action.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                        >
                          <div className={`p-2 rounded-full ${getAgentColor(action.agentName)} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{action.agentName}</p>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(action.status)}
                                <span className="text-xs text-muted-foreground">
                                  {action.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{action.action}</p>
                            {action.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed in {(action.duration / 1000).toFixed(1)}s
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Agent Outputs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Agent Outputs
              </CardTitle>
              <CardDescription>
                Results and data from agent processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {agentOutputs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No agent outputs yet</p>
                      <p className="text-sm">Process documents to see results</p>
                    </div>
                  ) : (
                    agentOutputs.map((output) => {
                      const Icon = getAgentIcon(output.agentName);
                      return (
                        <div
                          key={output.id}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded-full ${getAgentColor(output.agentName)} text-white`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="font-medium">{output.agentName}</span>
                              <Badge variant="outline" className="text-xs">
                                {output.outputType}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {output.confidence && (
                                <Badge variant="secondary" className="text-xs">
                                  {(output.confidence * 100).toFixed(1)}%
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {output.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm">
                            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                              {JSON.stringify(output.content, null, 2)}
                            </pre>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </PageLayout>
  );
}