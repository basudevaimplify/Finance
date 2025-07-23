import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    // Check if there's a stored token on initialization
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      return storedToken; // Return stored token or null
    }
    return null;
  });
  const queryClient = useQueryClient();

  // Mock user data for demo - only used when authenticated
  const mockUser = {
    id: 'demo-user',
    email: 'demo@example.com',
    first_name: 'Demo',
    last_name: 'User',
    company_name: 'Demo Company',
    is_active: true
  };

  const login = (userData: any = mockUser, accessToken: string = 'demo-token', refreshToken?: string) => {
    // For demo purposes, just set the token
    setToken(accessToken);
    localStorage.setItem('access_token', accessToken);
    queryClient.setQueryData(["/api/auth/user"], userData);
    // Redirect to dashboard after login
    window.location.href = '/';
  };

  const logout = async () => {
    // For demo purposes, clear the token and state
    setToken(null);
    localStorage.removeItem('access_token');
    queryClient.setQueryData(["/api/auth/user"], null);
    queryClient.clear(); // Clear all cached data
  };

  // User is authenticated if they have a token
  const isAuthenticated = !!token;

  console.log('useAuth state:', { isLoading: false, token, isAuthenticated });

  return {
    user: isAuthenticated ? mockUser : null,
    isLoading: false,
    isAuthenticated,
    login,
    logout,
    token,
    error: null
  };
}