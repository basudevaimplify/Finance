import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  FileText, 
  AlertCircle, 
  BookOpen,
  Play,
  Lightbulb,
  HelpCircle,
  ChevronRight,
  Star,
  Target,
  TrendingUp
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';

interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  estimated_time: string;
  complexity: string;
  applicable_to: string[];
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_time: number;
  prerequisites: string[];
  instructions: string[];
  validation_criteria: string[];
  documents_required: string[];
  status: string;
  completion_percentage: number;
  notes?: string;
  helpful_links?: string[];
  common_errors?: string[];
  ai_assistance_available: boolean;
}

interface WorkflowContext {
  workflow_type: string;
  company_category: string;
  financial_year: string;
  total_steps: number;
  current_step: number;
}

interface WorkflowProgress {
  workflow_type: string;
  total_steps: number;
  current_step: number;
  completion_percentage: number;
  completed_steps: any[];
  pending_steps: any[];
  estimated_remaining_time: number;
}

export default function ComplianceTutorial() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowInfo[]>([]);
  const [userWorkflows, setUserWorkflows] = useState<any[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [nextSteps, setNextSteps] = useState<TutorialStep[]>([]);
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [helpQuery, setHelpQuery] = useState('');
  const [helpResponse, setHelpResponse] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // New workflow form
  const [newWorkflowType, setNewWorkflowType] = useState('');
  const [companyCategory, setCompanyCategory] = useState('');
  const [financialYear, setFinancialYear] = useState('');

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableWorkflows();
      fetchUserWorkflows();
    }
  }, [isAuthenticated]);

  const fetchAvailableWorkflows = async () => {
    try {
      const response = await apiRequest('/api/compliance-tutorial/workflows');
      setAvailableWorkflows(response.workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchUserWorkflows = async () => {
    try {
      const response = await apiRequest('/api/compliance-tutorial/my-workflows');
      setUserWorkflows(response.workflows);
    } catch (error) {
      console.error('Error fetching user workflows:', error);
    }
  };

  const startNewWorkflow = async () => {
    if (!newWorkflowType || !companyCategory || !financialYear) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/compliance-tutorial/start-workflow', {
        method: 'POST',
        body: JSON.stringify({
          workflow_type: newWorkflowType,
          company_category: companyCategory,
          financial_year: financialYear
        })
      });

      setCurrentWorkflow(response.context);
      setCurrentStep(response.current_step);
      setNextSteps(response.next_steps);
      setActiveTab('current-step');
      
      toast({
        title: "Workflow Started",
        description: response.message,
      });

      // Refresh user workflows
      fetchUserWorkflows();
    } catch (error) {
      console.error('Error starting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to start workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflow = async (workflowId: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/compliance-tutorial/current-step/${workflowId}`);
      setCurrentStep(response.current_step);
      setNextSteps(response.next_steps);
      setProgress(response.progress);
      
      // Set workflow context from user workflows
      const workflow = userWorkflows.find(w => w.workflow_id === workflowId);
      if (workflow) {
        setCurrentWorkflow({
          workflow_type: workflow.workflow_type,
          company_category: workflow.company_category,
          financial_year: workflow.financial_year,
          total_steps: workflow.progress.total_steps,
          current_step: workflow.progress.current_step
        });
      }
      
      setActiveTab('current-step');
    } catch (error) {
      console.error('Error loading workflow:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string, notes?: string) => {
    if (!currentWorkflow) return;

    setLoading(true);
    try {
      const workflowId = `${user?.id}_${currentWorkflow.workflow_type}`;
      const response = await apiRequest(`/api/compliance-tutorial/complete-step/${workflowId}`, {
        method: 'POST',
        body: JSON.stringify({
          step_id: stepId,
          notes: notes
        })
      });

      setCurrentStep(response.next_step);
      setProgress(response.progress);
      
      toast({
        title: "Step Completed",
        description: response.message,
      });

      // Refresh user workflows
      fetchUserWorkflows();
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to complete step",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getContextualHelp = async () => {
    if (!currentWorkflow || !helpQuery) return;

    setLoading(true);
    try {
      const workflowId = `${user?.id}_${currentWorkflow.workflow_type}`;
      const response = await apiRequest(`/api/compliance-tutorial/get-help/${workflowId}`, {
        method: 'POST',
        body: JSON.stringify({
          query: helpQuery
        })
      });

      setHelpResponse(response.help);
    } catch (error) {
      console.error('Error getting help:', error);
      toast({
        title: "Error",
        description: "Failed to get help",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSmartSuggestions = async () => {
    if (!currentWorkflow) return;

    try {
      const workflowId = `${user?.id}_${currentWorkflow.workflow_type}`;
      const response = await apiRequest(`/api/compliance-tutorial/smart-suggestions/${workflowId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const getComplexityBadgeColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Compliance Tutorial
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Interactive step-by-step guidance for complex compliance workflows
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Contextual Micro Tutorials
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="start-workflow">Start Workflow</TabsTrigger>
                <TabsTrigger value="current-step">Current Step</TabsTrigger>
                <TabsTrigger value="help">Get Help</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 h-full overflow-y-auto">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Workflows */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Available Workflows
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {availableWorkflows.map((workflow) => (
                          <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {workflow.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {workflow.description}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                      {workflow.estimated_time}
                                    </span>
                                  </div>
                                  <Badge className={getComplexityBadgeColor(workflow.complexity)}>
                                    {workflow.complexity}
                                  </Badge>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Workflows */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        My Active Workflows
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userWorkflows.length === 0 ? (
                          <div className="text-center py-6">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-300">
                              No active workflows. Start one to begin your compliance journey.
                            </p>
                          </div>
                        ) : (
                          userWorkflows.map((workflow) => (
                            <div key={workflow.workflow_id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {workflow.workflow_type.replace('_', ' ').toUpperCase()}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {workflow.company_category} • FY {workflow.financial_year}
                                  </p>
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-gray-600 dark:text-gray-300">Progress</span>
                                      <span className="font-medium">{workflow.progress.completion_percentage}%</span>
                                    </div>
                                    <Progress value={workflow.progress.completion_percentage} className="h-2" />
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => loadWorkflow(workflow.workflow_id)}
                                >
                                  Continue
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="start-workflow" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Start New Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workflow-type">Workflow Type</Label>
                        <Select value={newWorkflowType} onValueChange={setNewWorkflowType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select workflow type" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableWorkflows.map((workflow) => (
                              <SelectItem key={workflow.id} value={workflow.id}>
                                {workflow.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-category">Company Category</Label>
                        <Select value={companyCategory} onValueChange={setCompanyCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Private Company">Private Company</SelectItem>
                            <SelectItem value="Public Company">Public Company</SelectItem>
                            <SelectItem value="LLP">LLP</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="financial-year">Financial Year</Label>
                        <Select value={financialYear} onValueChange={setFinancialYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select financial year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024-25">2024-25</SelectItem>
                            <SelectItem value="2023-24">2023-24</SelectItem>
                            <SelectItem value="2022-23">2022-23</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={startNewWorkflow}
                      disabled={loading || !newWorkflowType || !companyCategory || !financialYear}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Starting Workflow...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Workflow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="current-step" className="space-y-6">
                {currentStep ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(currentStep.status)}
                            {currentStep.title}
                          </CardTitle>
                          <p className="text-gray-600 dark:text-gray-300">
                            {currentStep.description}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">
                              {currentStep.category.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {currentStep.estimated_time} minutes
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Instructions:</h4>
                            <ol className="space-y-2">
                              {currentStep.instructions.map((instruction, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {instruction}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Required Documents:</h4>
                            <ul className="space-y-1">
                              {currentStep.documents_required.map((doc, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button 
                            onClick={() => completeStep(currentStep.id)}
                            disabled={loading}
                            className="w-full"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Completing Step...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Step
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Smart Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              onClick={getSmartSuggestions}
                              className="w-full"
                            >
                              Get AI Suggestions
                            </Button>
                            {suggestions.length > 0 && (
                              <div className="space-y-2">
                                {suggestions.map((suggestion, index) => (
                                  <Alert key={index}>
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertDescription>
                                      {suggestion}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Next Steps</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {nextSteps.map((step, index) => (
                              <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{step.title}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Workflow Complete!</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        You have successfully completed all steps in this workflow.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="help" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Get Contextual Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="help-query">What do you need help with?</Label>
                      <Textarea
                        id="help-query"
                        placeholder="Ask about deadlines, documents, validation, or common errors..."
                        value={helpQuery}
                        onChange={(e) => setHelpQuery(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={getContextualHelp}
                      disabled={loading || !helpQuery}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Getting Help...
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Get Help
                        </>
                      )}
                    </Button>

                    {helpResponse && (
                      <div className="mt-6 space-y-4">
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Current Step:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {helpResponse.current_step}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Specific Guidance:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {helpResponse.specific_guidance}
                          </p>
                        </div>
                        {helpResponse.relevant_documents && helpResponse.relevant_documents.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Relevant Documents:</h4>
                            <ul className="space-y-1">
                              {helpResponse.relevant_documents.map((doc: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {helpResponse.ai_suggestions && helpResponse.ai_suggestions.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">AI Suggestions:</h4>
                            <div className="space-y-2">
                              {helpResponse.ai_suggestions.map((suggestion: string, index: number) => (
                                <Alert key={index}>
                                  <Lightbulb className="h-4 w-4" />
                                  <AlertDescription>
                                    {suggestion}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                {progress ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Overall Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Step {progress.current_step} of {progress.total_steps}
                          </span>
                          <span className="text-sm font-medium">
                            {progress.completion_percentage}%
                          </span>
                        </div>
                        <Progress value={progress.completion_percentage} className="h-3" />
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{progress.estimated_remaining_time} minutes remaining</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Completed Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {progress.completed_steps.map((step, index) => (
                              <div key={step.id} className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">{step.title}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Pending Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {progress.pending_steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <Circle className="h-4 w-4 text-gray-400" />
                              <div className="flex-1">
                                <span className="text-sm font-medium">{step.title}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs text-gray-600 dark:text-gray-300">
                                    {step.estimated_time} minutes
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Workflow</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Start a workflow to track your progress.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}