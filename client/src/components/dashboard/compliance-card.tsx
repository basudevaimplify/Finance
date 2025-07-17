import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ComplianceCheck {
  id: string;
  checkType: string;
  status: 'compliant' | 'non_compliant' | 'pending';
  findings: any;
}

export default function ComplianceCard() {
  const { data: checks, isLoading } = useQuery<ComplianceCheck[]>({
    queryKey: ['/api/compliance-checks'],
    retry: false,
  });

  // Use actual compliance checks from API or show empty state
  const complianceItems = checks && checks.length > 0 ? 
    checks.map(check => ({
      name: check.checkType,
      status: check.status === 'compliant' ? 'compliant' : 'review_required'
    })) : [];

  const getComplianceScore = () => {
    if (complianceItems.length === 0) return 100; // Default to 100% when no checks exist
    const compliantCount = complianceItems.filter(item => item.status === 'compliant').length;
    return Math.round((compliantCount / complianceItems.length) * 100);
  };

  if (isLoading) {
    return (
      <Card className="status-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Compliance Dashboard</CardTitle>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-8" />
            </div>
            <Skeleton className="h-2 w-full mt-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = getComplianceScore();

  return (
    <Card className="status-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Compliance Dashboard</CardTitle>
          <Badge className="bg-secondary/10 text-secondary">
            Ind AS 2025
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {complianceItems.length > 0 ? (
            complianceItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    item.status === 'compliant' ? 'bg-secondary' : 'bg-accent'
                  }`} />
                  <span className="text-sm text-foreground">{item.name}</span>
                </div>
                <span className={`text-xs ${
                  item.status === 'compliant' ? 'text-secondary' : 'text-accent'
                }`}>
                  {item.status === 'compliant' ? '✓ Compliant' : '⚠ Review Required'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No compliance checks available.</p>
              <p className="text-xs">Upload documents to generate compliance reports.</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Overall Compliance</span>
            <span className="text-lg font-bold text-secondary">{score}%</span>
          </div>
          <div className="compliance-score-bar mt-2">
            <div 
              className="compliance-score-fill" 
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
