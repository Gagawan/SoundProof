/* eslint-disable import/no-named-as-default-member --
 * axios s'utilise via son export par défaut (axios.create, axios.isAxiosError),
 * conformément à sa documentation ; l'interop CJS de Metro/Jest est plus sûre ainsi. */
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from './types';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

/** Clé du refresh token dans le stockage sécurisé natif (Keychain/Keystore). */
const REFRESH_TOKEN_KEY = 'soundproof.refreshToken';

// L'access token ne vit qu'en mémoire (jamais persisté) — A02/A07.
let accessToken: string | null = null;

/** Callback déclenché quand la session ne peut plus être rafraîchie. */
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function storeTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** Rafraîchissement « single-flight » : une seule requête refresh à la fois. */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  refreshPromise ??= (async () => {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('Aucune session enregistrée.');
    }
    // Client axios nu : ne pas repasser par les intercepteurs
    const { data } = await axios.post<AuthTokens>(`${API_URL}/api/v1/auth/refresh`, {
      refreshToken,
    });
    await storeTokens(data);
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Sur 401 : UNE seule tentative de rafraîchissement puis rejeu de la requête ;
// en cas d'échec, la session est considérée expirée (déconnexion).
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthRoute = config?.url?.startsWith('/auth/') ?? false;

    if (error.response?.status === 401 && config && !config._retry && !isAuthRoute) {
      config._retry = true;
      try {
        await refreshAccessToken();
        return await apiClient.request(config);
      } catch {
        await clearTokens();
        onSessionExpired?.();
      }
    }
    throw error;
  },
);

/** Extrait un message d'erreur exploitable par l'utilisateur. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
    }
    const data = error.response.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join('\n') : data.message;
    }
  }
  return 'Une erreur inattendue est survenue. Réessayez.';
}
