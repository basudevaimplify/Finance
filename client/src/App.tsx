import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DocumentUpload from "@/pages/document-upload";
import DocumentManagement from "@/pages/document-management";
import AgentWorkflows from "@/pages/agent-workflows";
import FinancialReports from "@/pages/financial-reports";
import Compliance from "@/pages/compliance";
import AuditTrail from "@/pages/audit-trail";
import Reconciliation from "@/pages/reconciliation";
import DataTables from "@/pages/data-tables";
import AgentChat from "@/pages/agent-chat";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Settings from "@/pages/settings";
import MLAnomalyDetection from "@/pages/ml-anomaly-detection";
import MCAFiling from "@/pages/mca-filing";
import ComplianceTutorial from "@/pages/compliance-tutorial";
import DataSourceConfig from "@/pages/data-source-config";
import AdminPanel from "@/pages/admin";

function Router() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  console.log('Router render:', { isAuthenticated, isLoading, user });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/logout" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/documents" component={DocumentUpload} />
          <Route path="/document-upload" component={DocumentUpload} />
          <Route path="/document-management" component={DocumentManagement} />
          <Route path="/workflows" component={AgentWorkflows} />
          <Route path="/reports" component={FinancialReports} />
          <Route path="/financial-reports" component={FinancialReports} />
          <Route path="/compliance" component={Compliance} />
          <Route path="/audit" component={AuditTrail} />
          <Route path="/reconciliation" component={Reconciliation} />
          <Route path="/data-tables" component={DataTables} />
          <Route path="/agent-chat" component={AgentChat} />
          <Route path="/ml-anomaly-detection" component={MLAnomalyDetection} />
          <Route path="/mca-filing" component={MCAFiling} />
          <Route path="/compliance-tutorial" component={ComplianceTutorial} />
          <Route path="/data-source-config" component={DataSourceConfig} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminPanel} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
