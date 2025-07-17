import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import PageLayout from '@/components/layout/PageLayout';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Activity,
  Settings,
  Play,
  Pause,
  BarChart3,
  Shield,
  Target,
  Zap,
  Lightbulb,
  MessageCircle,
  Wrench,
  Eye,
  BarChart2,
  Bot
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AnomalyModel {
  id: string;
  model_name: string;
  model_type: string;
  version: string;
  training_data_size: number;
  training_date: string;
  performance_metrics: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

interface AnomalyResult {
  id: string;
  transaction_id: string;
  document_id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  confidence_level: number;
  anomaly_reasons: string[];
  detection_method: string;
  detected_at: string;
  review_status: string;
  review_notes?: string;
}

interface ModelAlert {
  id: string;
  alert_type: string;
  severity: string;
  model_name: string;
  metric_name: string;
  current_value: number;
  threshold_value: number;
  description: string;
  recommendation: string;
  is_resolved: boolean;
  created_at: string;
}

interface PerformanceMetric {
  model_name: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  measurement_date: string;
  samples_processed: number;
  anomalies_detected: number;
  processing_time_ms: number;
}

export default function MLAnomalyDetection() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnomalyResult | null>(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [anomalyAnalysis, setAnomalyAnalysis] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [selectedAnomalyForExplanation, setSelectedAnomalyForExplanation] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState('');

  // Redirect if not authenticated
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

  // Fetch ML models
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/ml/models'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch anomaly results
  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ['/api/ml/anomalies'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/ml/monitoring/alerts'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch performance metrics
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/ml/monitoring/performance'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Train model mutation
  const trainModelMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/ml/models/train', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Training Started",
        description: "Model training has been initiated in the background.",
      });
      setIsTraining(true);
      queryClient.invalidateQueries({ queryKey: ['/api/ml/models'] });
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
        title: "Training Failed",
        description: "Model training could not be started. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Detect anomalies mutation
  const detectAnomaliesMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/ml/anomalies/detect', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Anomaly Detection Complete",
        description: `Detected ${data.anomalies_detected} anomalies in ${data.total_transactions} transactions.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ml/anomalies'] });
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
        title: "Detection Failed",
        description: "Anomaly detection failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Agentic Anomaly Analysis mutation
  const analyzeAnomaliesMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/ml/anomalies/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "AI Analysis Complete",
        description: `Analyzed ${data.anomalies.length} anomalies with AI insights.`,
      });
      setAnomalyAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ['/api/ml/anomalies'] });
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
        title: "AI Analysis Failed",
        description: "AI-powered anomaly analysis failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Explain anomaly mutation
  const explainAnomalyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/ml/anomalies/explain', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setExplanation(data.explanation);
    },
    onError: (error) => {
      toast({
        title: "Explanation Failed",
        description: "Failed to get AI explanation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Review anomaly mutation
  const reviewAnomalyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/ml/anomalies/${data.result_id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          review_status: data.review_status,
          review_notes: data.review_notes
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Anomaly review has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ml/anomalies'] });
      setSelectedResult(null);
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
        title: "Review Failed",
        description: "Could not submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTrainModel = () => {
    if (!selectedModel) {
      toast({
        title: "Model Name Required",
        description: "Please enter a model name.",
        variant: "destructive",
      });
      return;
    }

    trainModelMutation.mutate({
      model_name: selectedModel,
      model_types: ['isolation_forest', 'one_class_svm', 'elliptic_envelope'],
      training_data_days: 90,
      contamination_rate: 0.1
    });
  };

  const handleDetectAnomalies = () => {
    if (!selectedModel || selectedDocuments.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a model and documents to analyze.",
        variant: "destructive",
      });
      return;
    }

    detectAnomaliesMutation.mutate({
      model_name: selectedModel,
      document_ids: selectedDocuments,
      ensemble_method: 'voting'
    });
  };

  const handleReviewAnomaly = () => {
    if (!selectedResult || !reviewStatus) {
      return;
    }

    reviewAnomalyMutation.mutate({
      result_id: selectedResult.id,
      review_status: reviewStatus,
      review_notes: reviewNotes
    });
  };

  const handleAnalyzeAnomalies = () => {
    if (!selectedDocuments.length) {
      toast({
        title: "No Documents Selected",
        description: "Please select documents to analyze.",
        variant: "destructive",
      });
      return;
    }

    analyzeAnomaliesMutation.mutate({
      documents: selectedDocuments,
      includeHistoricalData: true,
      analysisType: 'comprehensive'
    });
  };

  const handleExplainAnomaly = (anomaly: any, question: string) => {
    explainAnomalyMutation.mutate({
      anomaly_id: anomaly.id,
      question: question || 'Why is this flagged as an anomaly?'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-red-500';
      case 'false_positive': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ML Anomaly Detection...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="ML Anomaly Detection">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">ML Anomaly Detection</h1>
            <p className="text-gray-600">AI-powered financial anomaly detection and analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="ai-mode"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
            <Label htmlFor="ai-mode" className="text-sm font-medium">
              AI-Powered Analysis
            </Label>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-4 w-4" />
            <span>{models?.length || 0} Models</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4" />
            <span>{alerts?.filter((a: ModelAlert) => !a.is_resolved).length || 0} Alerts</span>
          </Badge>
        </div>
      </div>

      {/* AI Mode Information */}
      {useAI && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Agentic AI Analysis Mode
            </CardTitle>
            <p className="text-sm text-gray-600">
              Advanced LLM-powered anomaly detection with intelligent pattern recognition and explanations
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Intelligent Pattern Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Natural Language Explanations</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Automated Remediation Suggestions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{models?.filter((m: AnomalyModel) => m.is_active).length || 0}</div>
                <p className="text-xs text-muted-foreground">Trained and ready</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anomalies Found</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{anomalies?.filter((a: AnomalyResult) => a.is_anomaly).length || 0}</div>
                <p className="text-xs text-muted-foreground">Requires review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {anomalies?.length ? 
                    `${((anomalies.filter((a: AnomalyResult) => a.is_anomaly).length / anomalies.length) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Anomaly detection rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts?.filter((a: ModelAlert) => !a.is_resolved).length || 0}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anomalies?.slice(0, 5).map((anomaly: AnomalyResult) => (
                    <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${anomaly.is_anomaly ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div>
                          <p className="font-medium">Transaction {(anomaly.transaction_id || anomaly.transactionId || 'Unknown').slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">Score: {anomaly.anomaly_score ? anomaly.anomaly_score.toFixed(4) : 'N/A'}</p>
                        </div>
                      </div>
                      <Badge variant={anomaly.is_anomaly ? "destructive" : "secondary"}>
                        {anomaly.is_anomaly ? "Anomaly" : "Normal"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts?.filter((alert: ModelAlert) => !alert.is_resolved).slice(0, 5).map((alert: ModelAlert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                        <div>
                          <p className="font-medium">{alert.description}</p>
                          <p className="text-sm text-gray-600">{alert.model_name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${getSeverityColor(alert.severity)} text-white`}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ML Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models && models.length > 0 ? models.map((model: AnomalyModel) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`h-3 w-3 rounded-full ${model.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <div>
                        <h3 className="font-medium">{model.model_name}</h3>
                        <p className="text-sm text-gray-600">{model.modelType || model.model_type || 'Unknown'} - v{model.version}</p>
                        <p className="text-xs text-gray-500">
                          Trained: {model.lastTrained ? new Date(model.lastTrained).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {(model.training_data_size && typeof model.training_data_size === 'number') ? model.training_data_size.toLocaleString() : 'Unknown'} samples
                        </p>
                        <Badge variant={model.is_active ? "secondary" : "outline"}>
                          {model.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedModel(model.model_name)}
                        variant={selectedModel === model.model_name ? "default" : "outline"}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No models available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies?.map((anomaly: AnomalyResult) => (
                  <div key={anomaly.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`h-4 w-4 rounded-full ${anomaly.is_anomaly ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <div>
                        <h3 className="font-medium">Transaction {(anomaly.transaction_id || anomaly.transactionId || 'Unknown').slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">
                          Score: {anomaly.anomaly_score ? anomaly.anomaly_score.toFixed(4) : 'N/A'} | 
                          Confidence: {anomaly.confidence_level ? (anomaly.confidence_level * 100).toFixed(1) : 'N/A'}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {anomaly.anomaly_reasons?.join(", ") || 'No reasons provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className={`${getStatusColor(anomaly.review_status)} text-white`}>
                        {anomaly.review_status}
                      </Badge>
                      {useAI && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedAnomalyForExplanation(anomaly);
                            handleExplainAnomaly(anomaly, 'Why is this flagged as an anomaly?');
                          }}
                          className="flex items-center space-x-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>AI Explain</span>
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedResult(anomaly)}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Anomaly</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="review-status">Status</Label>
                              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Confirmed Anomaly</SelectItem>
                                  <SelectItem value="false_positive">False Positive</SelectItem>
                                  <SelectItem value="pending">Pending Review</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="review-notes">Notes</Label>
                              <Textarea 
                                id="review-notes"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add review notes..."
                              />
                            </div>
                            <Button onClick={handleReviewAnomaly} className="w-full">
                              Submit Review
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Results */}
          {useAI && anomalyAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  AI Analysis Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Risk Assessment</h4>
                      <div className="text-2xl font-bold text-red-600">
                        {anomalyAnalysis.insights?.overallRiskScore?.toFixed(1) || 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600">Overall Risk Score</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Patterns Detected</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {anomalyAnalysis.insights?.patternAnalysis?.detectedPatterns?.length || 0}
                      </div>
                      <p className="text-sm text-gray-600">Unique Patterns</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">AI Recommendations</h4>
                    {anomalyAnalysis.insights?.recommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`${rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' : rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm font-medium">{rec.category}</span>
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Impact: {rec.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Explanation Dialog */}
          {explanation && selectedAnomalyForExplanation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  AI Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Transaction: {selectedAnomalyForExplanation.transaction_id}</p>
                    <p className="text-xs text-gray-600">Score: {selectedAnomalyForExplanation.anomaly_score?.toFixed(4)}</p>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-sm">{explanation}</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a follow-up question..."
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleExplainAnomaly(selectedAnomalyForExplanation, userQuestion)}
                      disabled={explainAnomalyMutation.isPending}
                      size="sm"
                    >
                      {explainAnomalyMutation.isPending ? 'Asking...' : 'Ask'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance && Array.isArray(performance) ? performance.slice(0, 10).map((metric: PerformanceMetric, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{metric.model_name || 'Unknown Model'}</p>
                        <p className="text-sm text-gray-600">{metric.metric_type || 'metric'}: {metric.metric_value ? metric.metric_value.toFixed(4) : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{metric.samples_processed || 0} samples</p>
                        <p className="text-xs text-gray-500">{metric.processing_time_ms ? metric.processing_time_ms.toFixed(0) : 'N/A'}ms</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No performance metrics available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts?.slice(0, 10).map((alert: ModelAlert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                        <div>
                          <p className="font-medium">{alert.description}</p>
                          <p className="text-sm text-gray-600">{alert.recommendation}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${getSeverityColor(alert.severity)} text-white`}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model-name">Model Name</Label>
                <Input 
                  id="model-name"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="Enter model name"
                />
              </div>
              
              <div>
                <Label htmlFor="documents">Documents to Analyze</Label>
                <Select value={selectedDocuments.join(',')} onValueChange={(value) => setSelectedDocuments(value.split(','))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select documents" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents?.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.filename || doc.file_name || doc.name || `Document ${doc.id ? doc.id.slice(0, 8) : 'Unknown'}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {documents && documents.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {documents.length} document(s) available
                  </p>
                )}
                {(!documents || documents.length === 0) && (
                  <p className="text-xs text-red-500 mt-1">
                    No documents available. Please upload documents first.
                  </p>
                )}
                {process.env.NODE_ENV === 'development' && documents && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Debug: Documents Data</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(documents, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleTrainModel}
                  disabled={trainModelMutation.isPending || isTraining}
                  className="flex items-center space-x-2"
                >
                  {trainModelMutation.isPending ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Training...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Train Model</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleDetectAnomalies}
                  disabled={detectAnomaliesMutation.isPending}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {detectAnomaliesMutation.isPending ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Detect Anomalies</span>
                    </>
                  )}
                </Button>
                
                {useAI && (
                  <Button 
                    onClick={() => handleAnalyzeAnomalies()}
                    disabled={analyzeAnomaliesMutation.isPending}
                    variant="secondary"
                    className="flex items-center space-x-2"
                  >
                    {analyzeAnomaliesMutation.isPending ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        <span>AI Analysis</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isTraining && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Training Progress</span>
                    <span className="text-sm text-gray-600">{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}