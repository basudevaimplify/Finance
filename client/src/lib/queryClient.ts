import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const isFormData = options.body instanceof FormData;
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('access_token');
  
  // Determine the full URL - use Express backend on same port
  const fullUrl = url.startsWith('http') ? url : url;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };
  
  // Always add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (!isFormData && options.body && options.method !== 'GET') {
    headers["Content-Type"] = "application/json";
  }
  
  console.log('API Request:', { 
    url, 
    method: options.method || 'GET', 
    hasToken: !!token, 
    tokenPreview: token?.substring(0, 20) + '...',
    headersPreview: Object.keys(headers),
    authHeader: headers["Authorization"]?.substring(0, 30) + '...'
  });
  
  const res = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    credentials: "include",
    mode: "cors",
    cache: "no-cache",
    ...options
  });

  console.log('API Response:', { url, status: res.status, ok: res.ok });
  
  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : url;
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('access_token');
    
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
