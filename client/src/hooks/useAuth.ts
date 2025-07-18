import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>('demo-token');
  const queryClient = useQueryClient();

  // Mock user data for demo - no authentication required
  const mockUser = {
    id: 'demo-user',
    email: 'demo@example.com',
    first_name: 'Demo',
    last_name: 'User',
    company_name: 'Demo Company',
    is_active: true
  };

  const login = (userData: any, accessToken: string, refreshToken?: string) => {
    // For demo purposes, just set the token
    setToken(accessToken);
    queryClient.setQueryData(["/api/auth/user"], userData);
  };

  const logout = async () => {
    // For demo purposes, just clear the token
    setToken(null);
    queryClient.setQueryData(["/api/auth/user"], null);
  };

  console.log('useAuth state:', { isLoading: false, token, hasStoredToken: true });
  
  return {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true, // Always authenticated for demo
    login,
    logout,
    token,
    error: null
  };
}