import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageLayout from "@/components/layout/PageLayout";
import StatusCards from "@/components/dashboard/status-cards";
import FileUploadCard from "@/components/dashboard/file-upload-card";
import AgentWorkflowCard from "@/components/dashboard/agent-workflow-card";
import FinancialReportsSection from "@/components/dashboard/financial-reports-section";
import ComplianceCard from "@/components/dashboard/compliance-card";
import AuditTrailCard from "@/components/dashboard/audit-trail-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, ArrowRight, Settings, CheckCircle } from "lucide-react";
import type { DashboardStats } from "@/types";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
    retry: false,
  });

  const { data: auditTrail, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/audit-trail"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageLayout title="Dashboard">
      {/* Status Cards */}
      <StatusCards stats={stats} isLoading={statsLoading} />

      {/* Onboarding Card */}
      <Card className="mb-6 border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Company Setup & Onboarding</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Complete your company setup to unlock advanced features like multi-entity reconciliation, 
                    user management, and automated compliance workflows.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Company Details</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Business Units Setup</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>User Roles Configuration</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={() => window.location.href = "/onboarding"}
                    className="flex items-center space-x-2"
                  >
                    <span>Complete Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">5-step process</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FileUploadCard />
            <AgentWorkflowCard workflows={workflows} isLoading={workflowsLoading} />
          </div>

          {/* Financial Reports Section */}
          <FinancialReportsSection />

      {/* Compliance and Audit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceCard />
        <AuditTrailCard auditTrail={auditTrail} isLoading={auditLoading} />
      </div>
    </PageLayout>
  );
}
