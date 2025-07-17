import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";

export default function TopBar() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'User'}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-foreground">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/api/logout'}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}