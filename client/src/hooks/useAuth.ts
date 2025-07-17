import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    console.log('Stored token on mount:', storedToken);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) {
        throw new Error("No token found");
      }
      
      const result = await apiRequest('/api/auth/user', { method: 'GET' });
      
      if (result.success) {
        return result.user;
      } else {
        throw new Error(result.message || 'Failed to get user');
      }
    },
    enabled: !!token || !!localStorage.getItem('access_token'),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = (userData: any, accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setToken(accessToken);
    queryClient.setQueryData(["/api/auth/user"], userData);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    }
  };

  console.log('useAuth state:', { user, isLoading, token, hasStoredToken: !!localStorage.getItem('access_token') });
  
  return {
    user,
    isLoading: isLoading && (!!token || !!localStorage.getItem('access_token')),
    isAuthenticated: !!user && (!!token || !!localStorage.getItem('access_token')),
    login,
    logout,
    token,
    error
  };
}