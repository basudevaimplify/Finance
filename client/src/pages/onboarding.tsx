import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  Users, 
  Calendar, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  Plus,
  Trash2,
  UserPlus
} from "lucide-react";

interface OnboardingData {
  company: {
    name: string;
    pan: string;
    gstin: string;
    email: string;
    mobile: string;
    address: string;
    industry: string;
  };
  entities: Array<{
    id: string;
    name: string;
    type: string;
    gstin: string;
    location: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  }>;
  calendar: {
    fiscalYear: string;
    quarters: Array<{
      name: string;
      startDate: string;
      endDate: string;
      dueDate: string;
    }>;
  };
}

export default function Onboarding() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    company: {
      name: "",
      pan: "",
      gstin: "",
      email: "",
      mobile: "",
      address: "",
      industry: "",
    },
    entities: [
      {
        id: "1",
        name: "Entity A",
        type: "subsidiary",
        gstin: "",
        location: "",
      }
    ],
    users: [
      {
        id: "1",
        name: "",
        email: "",
        role: "admin",
        permissions: ["upload", "approve", "audit", "manage_users"],
      }
    ],
    calendar: {
      fiscalYear: "2024-25",
      quarters: [
        {
          name: "Q1",
          startDate: "2024-04-01",
          endDate: "2024-06-30",
          dueDate: "2024-07-15",
        },
        {
          name: "Q2",
          startDate: "2024-07-01",
          endDate: "2024-09-30",
          dueDate: "2024-10-15",
        },
        {
          name: "Q3",
          startDate: "2024-10-01",
          endDate: "2024-12-31",
          dueDate: "2025-01-15",
        },
        {
          name: "Q4",
          startDate: "2025-01-01",
          endDate: "2025-03-31",
          dueDate: "2025-04-15",
        },
      ],
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      return apiRequest("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company onboarding completed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    },
  });

  const steps = [
    {
      id: "company",
      title: "Company Setup",
      description: "Basic company information and registration details",
      icon: Building,
    },
    {
      id: "entities",
      title: "Business Units",
      description: "Configure your business entities and subsidiaries",
      icon: Building,
    },
    {
      id: "users",
      title: "User Roles",
      description: "Add team members and define their permissions",
      icon: Users,
    },
    {
      id: "calendar",
      title: "Close Calendar",
      description: "Set up quarterly closure dates and reminders",
      icon: Calendar,
    },
    {
      id: "review",
      title: "Review & Complete",
      description: "Review your configuration and complete setup",
      icon: CheckCircle,
    },
  ];

  const addEntity = () => {
    const newEntity = {
      id: (formData.entities.length + 1).toString(),
      name: `Entity ${String.fromCharCode(65 + formData.entities.length)}`,
      type: "subsidiary",
      gstin: "",
      location: "",
    };
    setFormData(prev => ({
      ...prev,
      entities: [...prev.entities, newEntity],
    }));
  };

  const removeEntity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      entities: prev.entities.filter(e => e.id !== id),
    }));
  };

  const addUser = () => {
    const newUser = {
      id: (formData.users.length + 1).toString(),
      name: "",
      email: "",
      role: "finance_exec",
      permissions: ["upload", "view"],
    };
    setFormData(prev => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
  };

  const removeUser = (id: string) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onboardingMutation.mutate(formData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.company.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, name: e.target.value }
                  }))}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN Number *</Label>
                <Input
                  id="pan"
                  value={formData.company.pan}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, pan: e.target.value.toUpperCase() }
                  }))}
                  placeholder="AAACL1234C"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN *</Label>
                <Input
                  id="gstin"
                  value={formData.company.gstin}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, gstin: e.target.value.toUpperCase() }
                  }))}
                  placeholder="27AAACL1234C1Z5"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.company.industry}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, industry: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.company.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, email: e.target.value }
                  }))}
                  placeholder="company@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={formData.company.mobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, mobile: e.target.value }
                  }))}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Registered Address</Label>
              <Textarea
                id="address"
                value={formData.company.address}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  company: { ...prev.company, address: e.target.value }
                }))}
                placeholder="Enter complete registered address"
                rows={3}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Business Entities</h3>
                <p className="text-sm text-muted-foreground">
                  Add your business units, subsidiaries, and branches
                </p>
              </div>
              <Button onClick={addEntity} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Entity
              </Button>
            </div>
            <div className="space-y-4">
              {formData.entities.map((entity, index) => (
                <Card key={entity.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Entity {index + 1}</h4>
                    {formData.entities.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntity(entity.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Entity Name</Label>
                      <Input
                        value={entity.name}
                        onChange={(e) => {
                          const newEntities = [...formData.entities];
                          newEntities[index].name = e.target.value;
                          setFormData(prev => ({ ...prev, entities: newEntities }));
                        }}
                        placeholder="Entity name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={entity.type}
                        onValueChange={(value) => {
                          const newEntities = [...formData.entities];
                          newEntities[index].type = value;
                          setFormData(prev => ({ ...prev, entities: newEntities }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head_office">Head Office</SelectItem>
                          <SelectItem value="subsidiary">Subsidiary</SelectItem>
                          <SelectItem value="branch">Branch</SelectItem>
                          <SelectItem value="division">Division</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>GSTIN</Label>
                      <Input
                        value={entity.gstin}
                        onChange={(e) => {
                          const newEntities = [...formData.entities];
                          newEntities[index].gstin = e.target.value.toUpperCase();
                          setFormData(prev => ({ ...prev, entities: newEntities }));
                        }}
                        placeholder="27AAACL1234C1Z5"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={entity.location}
                        onChange={(e) => {
                          const newEntities = [...formData.entities];
                          newEntities[index].location = e.target.value;
                          setFormData(prev => ({ ...prev, entities: newEntities }));
                        }}
                        placeholder="City, State"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Add team members and define their roles and permissions
                </p>
              </div>
              <Button onClick={addUser} size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
            <div className="space-y-4">
              {formData.users.map((user, index) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">User {index + 1}</h4>
                    {formData.users.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={user.name}
                        onChange={(e) => {
                          const newUsers = [...formData.users];
                          newUsers[index].name = e.target.value;
                          setFormData(prev => ({ ...prev, users: newUsers }));
                        }}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={user.email}
                        onChange={(e) => {
                          const newUsers = [...formData.users];
                          newUsers[index].email = e.target.value;
                          setFormData(prev => ({ ...prev, users: newUsers }));
                        }}
                        placeholder="user@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={user.role}
                        onValueChange={(value) => {
                          const newUsers = [...formData.users];
                          newUsers[index].role = value;
                          // Update permissions based on role
                          const rolePermissions = {
                            admin: ["upload", "approve", "audit", "manage_users"],
                            finance_exec: ["upload", "view", "approve"],
                            tax_manager: ["upload", "view", "tax_reports"],
                            consolidation_lead: ["view", "approve", "consolidate"],
                            auditor: ["view", "audit", "comment"],
                          };
                          newUsers[index].permissions = rolePermissions[value as keyof typeof rolePermissions] || ["view"];
                          setFormData(prev => ({ ...prev, users: newUsers }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="finance_exec">Finance Executive</SelectItem>
                          <SelectItem value="tax_manager">Tax Manager</SelectItem>
                          <SelectItem value="consolidation_lead">Consolidation Lead</SelectItem>
                          <SelectItem value="auditor">Auditor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Quarterly Close Calendar</h3>
              <p className="text-sm text-muted-foreground">
                Configure your fiscal year and quarterly closure dates
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fiscal Year</Label>
                <Select
                  value={formData.calendar.fiscalYear}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    calendar: { ...prev.calendar, fiscalYear: value }
                  }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Quarterly Dates</h4>
                {formData.calendar.quarters.map((quarter, index) => (
                  <Card key={quarter.name} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quarter</Label>
                        <Input value={quarter.name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={quarter.startDate}
                          onChange={(e) => {
                            const newQuarters = [...formData.calendar.quarters];
                            newQuarters[index].startDate = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              calendar: { ...prev.calendar, quarters: newQuarters }
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={quarter.endDate}
                          onChange={(e) => {
                            const newQuarters = [...formData.calendar.quarters];
                            newQuarters[index].endDate = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              calendar: { ...prev.calendar, quarters: newQuarters }
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={quarter.dueDate}
                          onChange={(e) => {
                            const newQuarters = [...formData.calendar.quarters];
                            newQuarters[index].dueDate = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              calendar: { ...prev.calendar, quarters: newQuarters }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Review Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Please review your setup before completing the onboarding
              </p>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Company Name</Label>
                      <p className="text-sm">{formData.company.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PAN</Label>
                      <p className="text-sm">{formData.company.pan}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">GSTIN</Label>
                      <p className="text-sm">{formData.company.gstin}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Industry</Label>
                      <p className="text-sm">{formData.company.industry}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Entities ({formData.entities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.entities.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{entity.name}</span>
                        <Badge variant="secondary">{entity.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Users ({formData.users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fiscal Year: {formData.calendar.fiscalYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.calendar.quarters.map((quarter) => (
                      <div key={quarter.name} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{quarter.name}</span>
                        <span className="text-sm">
                          {quarter.startDate} to {quarter.endDate} (Due: {quarter.dueDate})
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout title="Company Onboarding">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to QRT Closure Platform</h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your company for automated quarterly financial closure
          </p>
        </div>

        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
              {steps[currentStep].title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={onboardingMutation.isPending}
              >
                {onboardingMutation.isPending ? "Completing..." : "Complete Setup"}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}