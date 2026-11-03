'use client';

/**
 * Central API client for the FEKRA AI backend (NestJS).
 *
 * - Automatically attaches the JWT `Authorization: Bearer` header.
 * - Unwraps the standard `{ success, data, meta }` response envelope.
 * - Resolves the API base URL from `NEXT_PUBLIC_API_URL`, falling back to
 *   `http://<same-host>:4000/api/v1` so the deployed platform works on any
 *   server IP / domain without rebuilding.
 */

export const TOKEN_KEY = 'fekra_access_token';

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:4000/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Performs an authenticated JSON request and returns the unwrapped `data`.
 * Throws `ApiError` on failure (network errors get status 0).
 */
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    // Server unreachable / network failure
    throw new ApiError('تعذر الاتصال بالسيرفر — تأكد أن الـ API شغال', 0);
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response
  }

  if (!res.ok || !body?.success) {
    const message = body?.error?.message || body?.message || `خطأ من السيرفر (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body.data as T;
}
