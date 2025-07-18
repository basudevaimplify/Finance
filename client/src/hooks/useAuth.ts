import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize localStorage with demo token on first render
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', 'demo-token');
    }
    return 'demo-token';
  });
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
    localStorage.setItem('access_token', accessToken);
    queryClient.setQueryData(["/api/auth/user"], userData);
  };

  const logout = async () => {
    // For demo purposes, just clear the token
    setToken(null);
    localStorage.removeItem('access_token');
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