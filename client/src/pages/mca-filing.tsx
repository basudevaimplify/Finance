import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Building,
  Users,
  DollarSign,
  Download,
  Upload,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Clock,
  TrendingUp
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
import { Separator } from '@/components/ui/separator';

interface MCAFiling {
  id: string;
  form_type: string;
  financial_year: string;
  status: string;
  filing_date: string | null;
  due_date: string | null;
  validation_errors: string[];
  has_errors: boolean;
  submission_reference: string | null;
  created_at: string;
}

interface MCADeadline {
  id: string;
  form_type: string;
  company_category: string;
  financial_year: string;
  due_date: string;
  description: string;
  penalty_amount: number | null;
}

interface CompanyMaster {
  id: string;
  cin: string;
  company_name: string;
  registration_number: string;
  date_of_incorporation: string | null;
  registered_address: string;
  pin_code: string;
  phone: string;
  email: string;
  website: string | null;
  authorized_capital: number | null;
  paid_up_capital: number | null;
  category: string;
  sub_category: string;
}

interface FilingFormData {
  company_info: {
    cin: string;
    company_name: string;
    registration_number: string;
    date_of_incorporation: string;
    registered_address: string;
    pin_code: string;
    phone: string;
    email: string;
    website?: string;
    authorized_capital: number;
    paid_up_capital: number;
    category: string;
    sub_category: string;
  };
  financial_data: {
    financial_year: string;
    revenue: number;
    profit_before_tax: number;
    profit_after_tax: number;
    total_assets: number;
    total_liabilities: number;
    reserves_surplus: number;
    dividend_paid: number;
    retained_earnings: number;
    borrowings: number;
    investments: number;
  };
  directors: Array<{
    din: string;
    name: string;
    designation: string;
    appointment_date: string;
    nationality: string;
    qualification: string;
    experience: string;
    pan?: string;
    is_independent: boolean;
    is_woman_director: boolean;
  }>;
  // MGT-7 specific fields
  shareholding?: Array<{
    category: string;
    no_of_shares: number;
    percentage: number;
    voting_rights: number;
    change_during_year: number;
  }>;
  board_meetings?: number;
  agm_date?: string;
  // AOC-4 specific fields
  subsidiaries?: Array<{
    name: string;
    cin: string;
    holding_percentage: number;
    country: string;
    turnover: number;
    net_worth: number;
    investment: number;
  }>;
  associates?: Array<{
    name: string;
    cin: string;
    holding_percentage: number;
    country: string;
    turnover: number;
    net_worth: number;
    investment: number;
  }>;
}

export default function MCAFiling() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFormType, setSelectedFormType] = useState<string>('AOC-4');
  const [selectedFiling, setSelectedFiling] = useState<MCAFiling | null>(null);
  const [showFilingForm, setShowFilingForm] = useState(false);
  const [formData, setFormData] = useState<FilingFormData>({
    company_info: {
      cin: '',
      company_name: '',
      registration_number: '',
      date_of_incorporation: '',
      registered_address: '',
      pin_code: '',
      phone: '',
      email: '',
      website: '',
      authorized_capital: 0,
      paid_up_capital: 0,
      category: 'Company limited by shares',
      sub_category: 'Indian Non-Government Company'
    },
    financial_data: {
      financial_year: '2024-25',
      revenue: 0,
      profit_before_tax: 0,
      profit_after_tax: 0,
      total_assets: 0,
      total_liabilities: 0,
      reserves_surplus: 0,
      dividend_paid: 0,
      retained_earnings: 0,
      borrowings: 0,
      investments: 0
    },
    directors: []
  });

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

  // Fetch MCA filings
  const { data: filings, isLoading: filingsLoading } = useQuery({
    queryKey: ['/api/mca/filings'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  // Fetch deadlines
  const { data: deadlines, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['/api/mca/deadlines'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  // Fetch company master
  const { data: companyMaster, isLoading: companyLoading } = useQuery({
    queryKey: ['/api/mca/company-master'],
    retry: false,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Generate filing mutation
  const generateFilingMutation = useMutation({
    mutationFn: async (data: { form_type: string; form_data: FilingFormData }) => {
      const endpoint = data.form_type === 'AOC-4' ? '/api/mca/filings/aoc4/generate' : '/api/mca/filings/mgt7/generate';
      return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data.form_data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Filing Generated",
        description: `${data.form_type} filing has been generated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mca/filings'] });
      setShowFilingForm(false);
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
        title: "Generation Failed",
        description: "Filing generation failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { filing_id: string; status: string; comments?: string }) => {
      return await apiRequest(`/api/mca/filings/${data.filing_id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: data.status, comments: data.comments }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Filing status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mca/filings'] });
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
        title: "Update Failed",
        description: "Status update failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateFiling = () => {
    if (!formData.company_info.cin || !formData.company_info.company_name) {
      toast({
        title: "Incomplete Data",
        description: "Please fill in all required company information.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFormType === 'MGT-7' && (!formData.shareholding || !formData.board_meetings)) {
      toast({
        title: "Incomplete Data",
        description: "Please fill in shareholding pattern and board meetings for MGT-7.",
        variant: "destructive",
      });
      return;
    }

    generateFilingMutation.mutate({
      form_type: selectedFormType,
      form_data: formData
    });
  };

  const handleUpdateStatus = (filing: MCAFiling, status: string) => {
    updateStatusMutation.mutate({
      filing_id: filing.id,
      status: status
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'submitted': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getUpcomingDeadlines = () => {
    if (!deadlines) return [];
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return deadlines.filter((deadline: MCADeadline) => {
      const dueDate = new Date(deadline.due_date);
      return dueDate >= now && dueDate <= thirtyDaysFromNow;
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MCA Filing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">MCA Filing Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Building className="h-4 w-4" />
            <span>{filings?.length || 0} Filings</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4" />
            <span>{getUpcomingDeadlines().length} Deadlines</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Filings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filings?.length || 0}</div>
                <p className="text-xs text-muted-foreground">All time filings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filings?.filter((f: MCAFiling) => f.status === 'draft').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Draft filings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filings?.filter((f: MCAFiling) => f.status === 'submitted').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deadlines</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getUpcomingDeadlines().length}</div>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Filings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filings?.slice(0, 5).map((filing: MCAFiling) => (
                    <div key={filing.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(filing.status)}
                        <div>
                          <p className="font-medium">{filing.form_type}</p>
                          <p className="text-sm text-gray-600">FY {filing.financial_year}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`${getStatusColor(filing.status)} text-white`}>
                          {filing.status}
                        </Badge>
                        {filing.has_errors && (
                          <Badge variant="destructive" className="text-xs">
                            {filing.validation_errors?.length || 0} errors
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getUpcomingDeadlines().slice(0, 5).map((deadline: MCADeadline) => (
                    <div key={deadline.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">{deadline.form_type}</p>
                          <p className="text-sm text-gray-600">{deadline.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(deadline.due_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.ceil((new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MCA Filings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filings?.map((filing: MCAFiling) => (
                  <div key={filing.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(filing.status)}
                      <div>
                        <h3 className="font-medium">{filing.form_type}</h3>
                        <p className="text-sm text-gray-600">
                          Financial Year: {filing.financial_year}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(filing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge variant="outline" className={`${getStatusColor(filing.status)} text-white`}>
                          {filing.status}
                        </Badge>
                        {filing.has_errors && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            {filing.validation_errors?.length || 0} errors
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          XML
                        </Button>
                        {filing.status === 'draft' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus(filing, 'submitted')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Filing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-type">Form Type</Label>
                <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOC-4">AOC-4 (Financial Statements)</SelectItem>
                    <SelectItem value="MGT-7">MGT-7 (Annual Return)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cin">CIN</Label>
                  <Input 
                    id="cin"
                    value={formData.company_info.cin}
                    onChange={(e) => setFormData({
                      ...formData,
                      company_info: { ...formData.company_info, cin: e.target.value }
                    })}
                    placeholder="Enter CIN"
                  />
                </div>
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name"
                    value={formData.company_info.company_name}
                    onChange={(e) => setFormData({
                      ...formData,
                      company_info: { ...formData.company_info, company_name: e.target.value }
                    })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="financial-year">Financial Year</Label>
                <Select 
                  value={formData.financial_data.financial_year} 
                  onValueChange={(value) => setFormData({
                    ...formData,
                    financial_data: { ...formData.financial_data, financial_year: value }
                  })}
                >
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

              <Button 
                onClick={handleGenerateFiling}
                disabled={generateFilingMutation.isPending}
                className="w-full"
              >
                {generateFilingMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate {selectedFormType} Filing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filing Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deadlines?.map((deadline: MCADeadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{deadline.form_type}</h3>
                        <p className="text-sm text-gray-600">{deadline.description}</p>
                        <p className="text-xs text-gray-500">
                          Category: {deadline.company_category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(deadline.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        FY {deadline.financial_year}
                      </p>
                      {deadline.penalty_amount && (
                        <p className="text-xs text-red-600">
                          Penalty: ₹{deadline.penalty_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              {companyMaster ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CIN</Label>
                    <p className="text-sm font-medium">{companyMaster.cin}</p>
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <p className="text-sm font-medium">{companyMaster.company_name}</p>
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <p className="text-sm font-medium">{companyMaster.registration_number}</p>
                  </div>
                  <div>
                    <Label>Date of Incorporation</Label>
                    <p className="text-sm font-medium">
                      {companyMaster.date_of_incorporation ? 
                        new Date(companyMaster.date_of_incorporation).toLocaleDateString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <Label>Authorized Capital</Label>
                    <p className="text-sm font-medium">
                      ₹{companyMaster.authorized_capital?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label>Paid Up Capital</Label>
                    <p className="text-sm font-medium">
                      ₹{companyMaster.paid_up_capital?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Company information not found. Please contact support to set up your company profile.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}