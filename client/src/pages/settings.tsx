import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Key, 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  Globe, 
  Bell,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface SettingsConfig {
  id: string;
  apiKeys: {
    openai: string;
    anthropic: string;
    pinecone: string;
    postgres: string;
  };
  aiSettings: {
    temperature: number;
    maxTokens: number;
    model: string;
    systemPrompt: string;
    enableStreaming: boolean;
    responseFormat: string;
  };
  agentConfigs: {
    classifierBot: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
    journalBot: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
    gstValidator: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
    tdsValidator: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
    dataExtractor: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
    consoAI: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
    auditAgent: {
      temperature: number;
      maxTokens: number;
      model: string;
      systemPrompt: string;
      enabled: boolean;
    };
  };
  vectorDatabase: {
    provider: string;
    indexName: string;
    dimension: number;
    metric: string;
    namespace: string;
    topK: number;
    enableHybridSearch: boolean;
  };
  security: {
    enableRateLimit: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    enableApiKeyRotation: boolean;
    rotationInterval: number;
    enableAuditLog: boolean;
  };
  processing: {
    enableParallelProcessing: boolean;
    maxConcurrentJobs: number;
    retryAttempts: number;
    timeoutSeconds: number;
    enableAutoClassification: boolean;
    confidenceThreshold: number;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhookUrl: string;
    notifyOnCompletion: boolean;
    notifyOnError: boolean;
    notifyOnThreshold: boolean;
  };
  compliance: {
    enableDataRetention: boolean;
    retentionDays: number;
    enableEncryption: boolean;
    enablePIIDetection: boolean;
    enableComplianceReports: boolean;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("api-keys");

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

  const { data: settings, isLoading: settingsLoading } = useQuery<SettingsConfig>({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const [formData, setFormData] = useState<SettingsConfig>({
    id: "",
    apiKeys: {
      openai: "",
      anthropic: "",
      pinecone: "",
      postgres: "",
    },
    aiSettings: {
      temperature: 0.7,
      maxTokens: 4000,
      model: "claude-sonnet-4-20250514",
      systemPrompt: "You are a helpful AI assistant specialized in financial document processing and analysis.",
      enableStreaming: true,
      responseFormat: "json",
    },
    agentConfigs: {
      classifierBot: {
        temperature: 0.1,
        maxTokens: 2000,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are ClassifierBot, an expert at identifying and classifying financial documents. Your role is to analyze document content and accurately categorize them into types like vendor invoices, sales registers, bank statements, GST returns, TDS certificates, and salary registers. Focus on precision and consistency in classification.",
        enabled: true,
      },
      journalBot: {
        temperature: 0.3,
        maxTokens: 3000,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are JournalBot, specialized in creating accurate double-entry journal entries from financial documents. You understand Indian accounting standards (IndAS), GST implications, and TDS provisions. Generate precise debit/credit entries with proper account codes and ensure all transactions balance.",
        enabled: true,
      },
      gstValidator: {
        temperature: 0.2,
        maxTokens: 2500,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are GSTValidator, an expert in Indian GST compliance. Validate GST calculations, HSN codes, tax rates, input tax credit eligibility, and ensure compliance with GSTR-1, GSTR-3B requirements. Check for reverse charge mechanism and interstate vs intrastate transactions.",
        enabled: true,
      },
      tdsValidator: {
        temperature: 0.2,
        maxTokens: 2500,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are TDSValidator, focused on TDS compliance per Indian Income Tax Act. Validate TDS rates, PAN requirements, nature of payments, quarterly return compliance (Form 26Q), and ensure proper TDS deduction and deposit timelines.",
        enabled: true,
      },
      dataExtractor: {
        temperature: 0.4,
        maxTokens: 4000,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are DataExtractor, specialized in extracting structured data from financial documents. Extract key information like amounts, dates, vendor details, invoice numbers, tax components, and payment terms. Ensure data accuracy and completeness for downstream processing.",
        enabled: true,
      },
      consoAI: {
        temperature: 0.3,
        maxTokens: 3500,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are ConsoAI, responsible for consolidating financial data and generating comprehensive financial statements. Create trial balances, profit & loss statements, balance sheets, and cash flow statements. Ensure compliance with Indian accounting standards and regulatory requirements.",
        enabled: true,
      },
      auditAgent: {
        temperature: 0.1,
        maxTokens: 3000,
        model: "claude-sonnet-4-20250514",
        systemPrompt: "You are AuditAgent, the final validation layer for all financial processing. Perform comprehensive audit checks, identify discrepancies, validate calculations, ensure regulatory compliance, and provide detailed audit trails. Flag any anomalies or compliance issues.",
        enabled: true,
      },
    },
    vectorDatabase: {
      provider: "pinecone",
      indexName: "financial-documents",
      dimension: 1536,
      metric: "cosine",
      namespace: "default",
      topK: 10,
      enableHybridSearch: true,
    },
    security: {
      enableRateLimit: true,
      rateLimitRequests: 100,
      rateLimitWindow: 60,
      enableApiKeyRotation: false,
      rotationInterval: 30,
      enableAuditLog: true,
    },
    processing: {
      enableParallelProcessing: true,
      maxConcurrentJobs: 5,
      retryAttempts: 3,
      timeoutSeconds: 300,
      enableAutoClassification: true,
      confidenceThreshold: 0.8,
    },
    notifications: {
      emailEnabled: false,
      slackEnabled: false,
      webhookUrl: "",
      notifyOnCompletion: true,
      notifyOnError: true,
      notifyOnThreshold: false,
    },
    compliance: {
      enableDataRetention: true,
      retentionDays: 90,
      enableEncryption: true,
      enablePIIDetection: true,
      enableComplianceReports: true,
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsConfig) => {
      return await apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
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
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      return await apiRequest(`/api/settings/test-connection/${provider}`, {
        method: "POST",
      });
    },
    onSuccess: (data, provider) => {
      toast({
        title: "Connection successful",
        description: `${provider} connection is working properly.`,
      });
    },
    onError: (error, provider) => {
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${provider}. Please check your configuration.`,
        variant: "destructive",
      });
    },
  });

  const updateFormData = (section: keyof SettingsConfig, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
    setHasChanges(true);
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <PageLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings">
      <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Configure API keys, AI models, and system preferences
              </p>
            </div>
            <div className="flex items-center gap-4">
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved changes
                </Badge>
              )}
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending || !hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="ai-settings" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Settings
              </TabsTrigger>
              <TabsTrigger value="agent-configs" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Agent Configs
              </TabsTrigger>
              <TabsTrigger value="vector-db" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Vector DB
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Processing
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Keys Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for various services. Keys are encrypted and stored securely.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(formData.apiKeys).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()} API Key
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={key}
                            type={showApiKeys[key] ? "text" : "password"}
                            value={value}
                            onChange={(e) => updateFormData("apiKeys", key, e.target.value)}
                            placeholder={`Enter your ${key} API key`}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleApiKeyVisibility(key)}
                          >
                            {showApiKeys[key] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnectionMutation.mutate(key)}
                          disabled={testConnectionMutation.isPending || !value}
                        >
                          {testConnectionMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Test
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai-settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Global AI Model Configuration
                  </CardTitle>
                  <CardDescription>
                    Default AI model parameters that apply to all agents unless overridden individually.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="model">Default AI Model</Label>
                      <Select
                        value={formData.aiSettings.model}
                        onValueChange={(value) => updateFormData("aiSettings", "model", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responseFormat">Response Format</Label>
                      <Select
                        value={formData.aiSettings.responseFormat}
                        onValueChange={(value) => updateFormData("aiSettings", "responseFormat", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select response format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="structured">Structured</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">
                        Temperature: {formData.aiSettings.temperature}
                      </Label>
                      <Slider
                        value={[formData.aiSettings.temperature]}
                        onValueChange={(value) => updateFormData("aiSettings", "temperature", value[0])}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Precise (0.0)</span>
                        <span>Balanced (1.0)</span>
                        <span>Creative (2.0)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={formData.aiSettings.maxTokens}
                        onChange={(e) => updateFormData("aiSettings", "maxTokens", parseInt(e.target.value))}
                        placeholder="4000"
                        min="100"
                        max="8000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">Default System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        value={formData.aiSettings.systemPrompt}
                        onChange={(e) => updateFormData("aiSettings", "systemPrompt", e.target.value)}
                        placeholder="Enter system prompt for AI model"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableStreaming"
                        checked={formData.aiSettings.enableStreaming}
                        onCheckedChange={(checked) => updateFormData("aiSettings", "enableStreaming", checked)}
                      />
                      <Label htmlFor="enableStreaming">Enable Streaming Responses</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agent Configs Tab */}
            <TabsContent value="agent-configs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Individual Agent Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure AI model settings for each specialized agent in the QRT closure workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {Object.entries(formData.agentConfigs).map(([agentKey, config]) => {
                    const agentNames = {
                      classifierBot: "ClassifierBot",
                      journalBot: "JournalBot", 
                      gstValidator: "GST Validator",
                      tdsValidator: "TDS Validator",
                      dataExtractor: "Data Extractor",
                      consoAI: "ConsoAI",
                      auditAgent: "Audit Agent"
                    };
                    
                    const agentDescriptions = {
                      classifierBot: "Identifies and classifies financial documents into appropriate categories",
                      journalBot: "Creates accurate double-entry journal entries from financial data",
                      gstValidator: "Validates GST compliance and calculations per Indian regulations",
                      tdsValidator: "Ensures TDS compliance according to Income Tax Act requirements",
                      dataExtractor: "Extracts structured data from various financial document formats",
                      consoAI: "Consolidates data and generates comprehensive financial statements",
                      auditAgent: "Performs final validation and compliance checks on all processed data"
                    };

                    return (
                      <div key={agentKey} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {agentNames[agentKey as keyof typeof agentNames]}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {agentDescriptions[agentKey as keyof typeof agentDescriptions]}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${agentKey}-enabled`}
                              checked={config.enabled}
                              onCheckedChange={(checked) => {
                                const newConfig = { ...formData.agentConfigs };
                                newConfig[agentKey as keyof typeof newConfig].enabled = checked;
                                setFormData(prev => ({ ...prev, agentConfigs: newConfig }));
                                setHasChanges(true);
                              }}
                            />
                            <Label htmlFor={`${agentKey}-enabled`} className="text-sm">
                              {config.enabled ? "Enabled" : "Disabled"}
                            </Label>
                          </div>
                        </div>
                        
                        {config.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`${agentKey}-model`}>AI Model</Label>
                              <Select
                                value={config.model}
                                onValueChange={(value) => {
                                  const newConfig = { ...formData.agentConfigs };
                                  newConfig[agentKey as keyof typeof newConfig].model = value;
                                  setFormData(prev => ({ ...prev, agentConfigs: newConfig }));
                                  setHasChanges(true);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select AI model" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="claude-sonnet-4-20250514">Claude 4.0 Sonnet</SelectItem>
                                  <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</SelectItem>
                                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`${agentKey}-maxTokens`}>Max Tokens</Label>
                              <Input
                                id={`${agentKey}-maxTokens`}
                                type="number"
                                value={config.maxTokens}
                                onChange={(e) => {
                                  const newConfig = { ...formData.agentConfigs };
                                  newConfig[agentKey as keyof typeof newConfig].maxTokens = parseInt(e.target.value);
                                  setFormData(prev => ({ ...prev, agentConfigs: newConfig }));
                                  setHasChanges(true);
                                }}
                                placeholder="2000"
                                min="100"
                                max="8000"
                              />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor={`${agentKey}-temperature`}>
                                Temperature: {config.temperature}
                              </Label>
                              <Slider
                                value={[config.temperature]}
                                onValueChange={(value) => {
                                  const newConfig = { ...formData.agentConfigs };
                                  newConfig[agentKey as keyof typeof newConfig].temperature = value[0];
                                  setFormData(prev => ({ ...prev, agentConfigs: newConfig }));
                                  setHasChanges(true);
                                }}
                                max={2}
                                min={0}
                                step={0.1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Precise (0.0)</span>
                                <span>Balanced (1.0)</span>
                                <span>Creative (2.0)</span>
                              </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor={`${agentKey}-systemPrompt`}>System Prompt</Label>
                              <Textarea
                                id={`${agentKey}-systemPrompt`}
                                value={config.systemPrompt}
                                onChange={(e) => {
                                  const newConfig = { ...formData.agentConfigs };
                                  newConfig[agentKey as keyof typeof newConfig].systemPrompt = e.target.value;
                                  setFormData(prev => ({ ...prev, agentConfigs: newConfig }));
                                  setHasChanges(true);
                                }}
                                placeholder={`Enter system prompt for ${agentNames[agentKey as keyof typeof agentNames]}`}
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vector Database Tab */}
            <TabsContent value="vector-db" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Vector Database Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure vector database settings for document embeddings and similarity search.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Vector Database Provider</Label>
                      <Select
                        value={formData.vectorDatabase.provider}
                        onValueChange={(value) => updateFormData("vectorDatabase", "provider", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pinecone">Pinecone</SelectItem>
                          <SelectItem value="weaviate">Weaviate</SelectItem>
                          <SelectItem value="chroma">Chroma</SelectItem>
                          <SelectItem value="qdrant">Qdrant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="indexName">Index Name</Label>
                      <Input
                        id="indexName"
                        value={formData.vectorDatabase.indexName}
                        onChange={(e) => updateFormData("vectorDatabase", "indexName", e.target.value)}
                        placeholder="financial-documents"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dimension">Vector Dimension</Label>
                      <Input
                        id="dimension"
                        type="number"
                        value={formData.vectorDatabase.dimension}
                        onChange={(e) => updateFormData("vectorDatabase", "dimension", parseInt(e.target.value))}
                        placeholder="1536"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metric">Distance Metric</Label>
                      <Select
                        value={formData.vectorDatabase.metric}
                        onValueChange={(value) => updateFormData("vectorDatabase", "metric", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cosine">Cosine</SelectItem>
                          <SelectItem value="euclidean">Euclidean</SelectItem>
                          <SelectItem value="dotproduct">Dot Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="namespace">Namespace</Label>
                      <Input
                        id="namespace"
                        value={formData.vectorDatabase.namespace}
                        onChange={(e) => updateFormData("vectorDatabase", "namespace", e.target.value)}
                        placeholder="default"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topK">Top K Results</Label>
                      <Input
                        id="topK"
                        type="number"
                        value={formData.vectorDatabase.topK}
                        onChange={(e) => updateFormData("vectorDatabase", "topK", parseInt(e.target.value))}
                        placeholder="10"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableHybridSearch"
                      checked={formData.vectorDatabase.enableHybridSearch}
                      onCheckedChange={(checked) => updateFormData("vectorDatabase", "enableHybridSearch", checked)}
                    />
                    <Label htmlFor="enableHybridSearch">Enable Hybrid Search (Vector + Keyword)</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure security settings including rate limiting and API key management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableRateLimit"
                        checked={formData.security.enableRateLimit}
                        onCheckedChange={(checked) => updateFormData("security", "enableRateLimit", checked)}
                      />
                      <Label htmlFor="enableRateLimit">Enable Rate Limiting</Label>
                    </div>

                    {formData.security.enableRateLimit && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="rateLimitRequests">Requests per Window</Label>
                          <Input
                            id="rateLimitRequests"
                            type="number"
                            value={formData.security.rateLimitRequests}
                            onChange={(e) => updateFormData("security", "rateLimitRequests", parseInt(e.target.value))}
                            placeholder="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rateLimitWindow">Window (seconds)</Label>
                          <Input
                            id="rateLimitWindow"
                            type="number"
                            value={formData.security.rateLimitWindow}
                            onChange={(e) => updateFormData("security", "rateLimitWindow", parseInt(e.target.value))}
                            placeholder="60"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableApiKeyRotation"
                        checked={formData.security.enableApiKeyRotation}
                        onCheckedChange={(checked) => updateFormData("security", "enableApiKeyRotation", checked)}
                      />
                      <Label htmlFor="enableApiKeyRotation">Enable API Key Rotation</Label>
                    </div>

                    {formData.security.enableApiKeyRotation && (
                      <div className="ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="rotationInterval">Rotation Interval (days)</Label>
                          <Input
                            id="rotationInterval"
                            type="number"
                            value={formData.security.rotationInterval}
                            onChange={(e) => updateFormData("security", "rotationInterval", parseInt(e.target.value))}
                            placeholder="30"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableAuditLog"
                        checked={formData.security.enableAuditLog}
                        onCheckedChange={(checked) => updateFormData("security", "enableAuditLog", checked)}
                      />
                      <Label htmlFor="enableAuditLog">Enable Audit Logging</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Processing Tab */}
            <TabsContent value="processing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Processing Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure document processing parameters and performance settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxConcurrentJobs">Max Concurrent Jobs</Label>
                      <Input
                        id="maxConcurrentJobs"
                        type="number"
                        value={formData.processing.maxConcurrentJobs}
                        onChange={(e) => updateFormData("processing", "maxConcurrentJobs", parseInt(e.target.value))}
                        placeholder="5"
                        min="1"
                        max="20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={formData.processing.retryAttempts}
                        onChange={(e) => updateFormData("processing", "retryAttempts", parseInt(e.target.value))}
                        placeholder="3"
                        min="1"
                        max="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeoutSeconds">Timeout (seconds)</Label>
                      <Input
                        id="timeoutSeconds"
                        type="number"
                        value={formData.processing.timeoutSeconds}
                        onChange={(e) => updateFormData("processing", "timeoutSeconds", parseInt(e.target.value))}
                        placeholder="300"
                        min="30"
                        max="3600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confidenceThreshold">
                        Confidence Threshold: {formData.processing.confidenceThreshold}
                      </Label>
                      <Slider
                        value={[formData.processing.confidenceThreshold]}
                        onValueChange={(value) => updateFormData("processing", "confidenceThreshold", value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableParallelProcessing"
                        checked={formData.processing.enableParallelProcessing}
                        onCheckedChange={(checked) => updateFormData("processing", "enableParallelProcessing", checked)}
                      />
                      <Label htmlFor="enableParallelProcessing">Enable Parallel Processing</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableAutoClassification"
                        checked={formData.processing.enableAutoClassification}
                        onCheckedChange={(checked) => updateFormData("processing", "enableAutoClassification", checked)}
                      />
                      <Label htmlFor="enableAutoClassification">Enable Auto Classification</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure notification preferences for processing events and system alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="emailEnabled"
                        checked={formData.notifications.emailEnabled}
                        onCheckedChange={(checked) => updateFormData("notifications", "emailEnabled", checked)}
                      />
                      <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="slackEnabled"
                        checked={formData.notifications.slackEnabled}
                        onCheckedChange={(checked) => updateFormData("notifications", "slackEnabled", checked)}
                      />
                      <Label htmlFor="slackEnabled">Enable Slack Notifications</Label>
                    </div>

                    {formData.notifications.slackEnabled && (
                      <div className="ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="webhookUrl">Slack Webhook URL</Label>
                          <Input
                            id="webhookUrl"
                            type="url"
                            value={formData.notifications.webhookUrl}
                            onChange={(e) => updateFormData("notifications", "webhookUrl", e.target.value)}
                            placeholder="https://hooks.slack.com/services/..."
                          />
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Notification Triggers</Label>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnCompletion"
                          checked={formData.notifications.notifyOnCompletion}
                          onCheckedChange={(checked) => updateFormData("notifications", "notifyOnCompletion", checked)}
                        />
                        <Label htmlFor="notifyOnCompletion">Document Processing Completion</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnError"
                          checked={formData.notifications.notifyOnError}
                          onCheckedChange={(checked) => updateFormData("notifications", "notifyOnError", checked)}
                        />
                        <Label htmlFor="notifyOnError">Processing Errors</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnThreshold"
                          checked={formData.notifications.notifyOnThreshold}
                          onCheckedChange={(checked) => updateFormData("notifications", "notifyOnThreshold", checked)}
                        />
                        <Label htmlFor="notifyOnThreshold">Confidence Threshold Alerts</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Compliance & Data Governance
                  </CardTitle>
                  <CardDescription>
                    Configure data retention, encryption, and compliance reporting settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableDataRetention"
                        checked={formData.compliance.enableDataRetention}
                        onCheckedChange={(checked) => updateFormData("compliance", "enableDataRetention", checked)}
                      />
                      <Label htmlFor="enableDataRetention">Enable Data Retention Policy</Label>
                    </div>

                    {formData.compliance.enableDataRetention && (
                      <div className="ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="retentionDays">Retention Period (days)</Label>
                          <Input
                            id="retentionDays"
                            type="number"
                            value={formData.compliance.retentionDays}
                            onChange={(e) => updateFormData("compliance", "retentionDays", parseInt(e.target.value))}
                            placeholder="90"
                            min="1"
                            max="3650"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableEncryption"
                        checked={formData.compliance.enableEncryption}
                        onCheckedChange={(checked) => updateFormData("compliance", "enableEncryption", checked)}
                      />
                      <Label htmlFor="enableEncryption">Enable Data Encryption</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enablePIIDetection"
                        checked={formData.compliance.enablePIIDetection}
                        onCheckedChange={(checked) => updateFormData("compliance", "enablePIIDetection", checked)}
                      />
                      <Label htmlFor="enablePIIDetection">Enable PII Detection</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableComplianceReports"
                        checked={formData.compliance.enableComplianceReports}
                        onCheckedChange={(checked) => updateFormData("compliance", "enableComplianceReports", checked)}
                      />
                      <Label htmlFor="enableComplianceReports">Enable Compliance Reports</Label>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Compliance Information
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          These settings help ensure compliance with data protection regulations like GDPR, 
                          CCPA, and industry-specific requirements. Enable encryption and PII detection 
                          for enhanced data protection.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </PageLayout>
  );
}