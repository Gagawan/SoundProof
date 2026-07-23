import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import * as authApi from '@/api/auth';
import type { User } from '@/api/types';

import { AuthProvider, useAuth } from '../auth-context';

// L'API et le client (dont expo-secure-store) sont mockés : on teste la
// machine à états de session, pas le réseau.
jest.mock('@/api/auth');
jest.mock('@/api/client', () => ({
  setOnSessionExpired: jest.fn(),
}));

const authApiMock = authApi as jest.Mocked<typeof authApi>;

const marie: User = {
  id: 'user-1',
  email: 'marie@soundproof.fr',
  firstName: 'Marie',
  lastName: 'Dubois',
  role: 'MEMBER',
};

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restaure la session au démarrage (US2 — rester connecté)', async () => {
    authApiMock.restoreSession.mockResolvedValue(marie);

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toEqual(marie);
  });

  it('passe en unauthenticated sans session enregistrée', async () => {
    authApiMock.restoreSession.mockResolvedValue(null);

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.user).toBeNull();
  });

  it('passe en unauthenticated si la restauration échoue (refresh token expiré)', async () => {
    authApiMock.restoreSession.mockRejectedValue(new Error('401'));

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
  });

  it('login authentifie et expose le profil', async () => {
    authApiMock.restoreSession.mockResolvedValue(null);
    authApiMock.login.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: marie,
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(() => result.current.login('marie@soundproof.fr', 'MotDePasseFort1'));

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toEqual(marie);
    expect(authApiMock.login).toHaveBeenCalledWith('marie@soundproof.fr', 'MotDePasseFort1');
  });

  it('logout purge la session', async () => {
    authApiMock.restoreSession.mockResolvedValue(marie);
    authApiMock.logout.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(() => result.current.logout());

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.user).toBeNull();
    expect(authApiMock.logout).toHaveBeenCalled();
  });
});
