const TOKEN_KEY = 'bist_auth_token';
const API_KEY_KEY = 'bist_api_key';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getApiKey(): string | null {
  try {
    const fromStorage = localStorage.getItem(API_KEY_KEY);
    if (fromStorage) return fromStorage;
    return import.meta.env.VITE_API_KEY || null;
  } catch {
    return import.meta.env.VITE_API_KEY || null;
  }
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(API_KEY_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const apiKey = getApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}
