// © 2025 Quartermasters FZC. All rights reserved.

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown,
  options: { requireAuth?: boolean } = { requireAuth: true }
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {};
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.requireAuth) {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response;
}

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem('auth_token', token);
}

export async function removeAuthToken(): Promise<void> {
  await AsyncStorage.removeItem('auth_token');
}
