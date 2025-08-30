// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";

interface LoginData {
  identifier: string;
  code: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    role: string;
  };
}

export function useAuth() {
  return useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 0,
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (identifier: string) => {
      const response = await apiRequest('POST', '/api/auth/otp/request', { identifier });
      return response.json();
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest('POST', '/api/auth/otp/verify', data);
      const result: AuthResponse = await response.json();
      
      // Store token
      localStorage.setItem('auth_token', result.accessToken);
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      return result;
    },
  });
}

export function logout() {
  localStorage.removeItem('auth_token');
  queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}
