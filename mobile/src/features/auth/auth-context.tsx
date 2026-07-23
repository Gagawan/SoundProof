import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import * as authApi from '@/api/auth';
import { setOnSessionExpired } from '@/api/client';
import type { User } from '@/api/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Fournit l'état d'authentification à toute l'app.
 * Au démarrage : restaure la session depuis le refresh token du stockage
 * sécurisé (US2 — rester connecté entre deux ouvertures de l'app).
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    // Session expirée (refresh impossible) → retour à l'écran de connexion
    setOnSessionExpired(() => {
      setUser(null);
      setStatus('unauthenticated');
    });

    authApi
      .restoreSession()
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        setStatus(restored ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      active = false;
      setOnSessionExpired(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (input: authApi.RegisterInput) => {
    const result = await authApi.register(input);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé sous <AuthProvider>.');
  }
  return context;
}
