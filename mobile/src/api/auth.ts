import { apiClient, clearTokens, getStoredRefreshToken, storeTokens } from './client';
import type { AuthResult, AuthTokens, User } from './types';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/register', input);
  await storeTokens(data);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/login', { email, password });
  await storeTokens(data);
  return data;
}

/** Restaure la session depuis le refresh token stocké (retour null si aucune). */
export async function restoreSession(): Promise<User | null> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }
  const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
  await storeTokens(data);
  const me = await apiClient.get<User>('/users/me');
  return me.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    // La session locale est toujours purgée, même si l'API est injoignable
    await clearTokens();
  }
}

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}
