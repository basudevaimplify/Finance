import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { AuditTrail } from "@shared/schema";

interface AuditTrailCardProps {
  auditTrail?: AuditTrail[];
  isLoading: boolean;
}

export default function AuditTrailCard({ auditTrail, isLoading }: AuditTrailCardProps) {
  if (isLoading) {
    return (
      <Card className="status-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Audit Trail</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-2 w-2 rounded-full mt-2" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const trailToShow = auditTrail || [];

  const getActionType = (action: string) => {
    if (action.includes('Agent') || action.includes('Bot') || action.includes('AI')) {
      return 'agent';
    } else if (action.includes('User')) {
      return 'user';
    } else {
      return 'system';
    }
  };

  return (
    <Card className="status-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Audit Trail</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trailToShow.length > 0 ? (
            trailToShow.slice(0, 4).map((entry) => (
              <div key={entry.id} className="audit-trail-entry">
                <div className={`audit-trail-dot ${getActionType(entry.action)}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.details?.description || 'No description available'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })} • 
                    {entry.entityType === 'agent_job' ? ` Job ID: ${entry.entityId.slice(-3)}` : 
                     entry.entityType === 'document' ? ` File ID: ${entry.entityId.slice(-3)}` : 
                     ` ID: ${entry.entityId.slice(-3)}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No audit trail activities yet.</p>
              <p className="text-xs">Activities will appear here as you use the platform.</p>
            </div>
          )}
        </div>

        {trailToShow.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Actions Today</span>
              <span className="font-semibold text-foreground">{trailToShow.length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
