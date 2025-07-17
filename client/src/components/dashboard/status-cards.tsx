import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bot, AlertTriangle, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

interface StatusCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatusCards({ stats, isLoading }: StatusCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="status-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="error-state">
          <p>Unable to load dashboard statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents Processed</p>
              <p className="text-3xl font-bold text-foreground">{stats.documentsProcessed}</p>
            </div>
            <div className="status-icon primary">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-secondary mr-1" />
            <span className="text-secondary font-medium">12%</span>
            <span className="text-muted-foreground ml-1">vs last quarter</span>
          </div>
        </CardContent>
      </Card>

      <Card className="status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
              <p className="text-3xl font-bold text-foreground">{stats.activeAgents}</p>
            </div>
            <div className="status-icon secondary">
              <Bot className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="agent-status-dot agent-status-running mr-2" />
            <span className="text-muted-foreground">All systems operational</span>
          </div>
        </CardContent>
      </Card>

      <Card className="status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validation Errors</p>
              <p className="text-3xl font-bold text-foreground">{stats.validationErrors}</p>
            </div>
            <div className="status-icon accent">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-secondary mr-1" />
            <span className="text-secondary font-medium">67%</span>
            <span className="text-muted-foreground ml-1">vs last run</span>
          </div>
        </CardContent>
      </Card>

      <Card className="status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
              <p className="text-3xl font-bold text-foreground">{stats.complianceScore}%</p>
            </div>
            <div className="status-icon secondary">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="agent-status-dot agent-status-running mr-2" />
            <span className="text-muted-foreground">Ind AS compliant</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
