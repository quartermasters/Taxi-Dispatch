// © 2025 Quartermasters FZC. All rights reserved.

import { getAuthToken } from './auth';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options: { requireAuth?: boolean } = { requireAuth: true }
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}
