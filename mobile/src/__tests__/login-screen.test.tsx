import { render, userEvent, waitFor } from '@testing-library/react-native';

import LoginScreen from '../../app/login';

const mockLogin = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ login: mockLogin, status: 'unauthenticated', user: null }),
}));

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useRouter: () => ({ replace: mockReplace }),
    Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

// NOTE : interactions via userEvent (et non fireEvent) — avec le rendu
// asynchrone de RNTL 14, fireEvent laisse des mises à jour hors act() qui
// corrompent les rendus des tests suivants du même fichier.
describe('Écran de connexion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche les erreurs de validation sans appeler l’API (champs vides)', async () => {
    const user = userEvent.setup();
    const { getByRole, findByText } = await render(<LoginScreen />);

    await user.press(getByRole('button', { name: 'Se connecter' }));

    expect(await findByText("L'adresse email est invalide.")).toBeOnTheScreen();
    expect(await findByText('Le mot de passe est requis.')).toBeOnTheScreen();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('affiche le message d’erreur de l’API en cas d’échec de connexion', async () => {
    mockLogin.mockRejectedValue(new Error('réseau'));
    const user = userEvent.setup();
    const { getByTestId, getByRole, findByText } = await render(<LoginScreen />);

    await user.type(getByTestId('login-email'), 'marie@soundproof.fr');
    await user.type(getByTestId('login-password'), 'MotDePasseFort1');
    await user.press(getByRole('button', { name: 'Se connecter' }));

    expect(await findByText('Une erreur inattendue est survenue. Réessayez.')).toBeOnTheScreen();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('soumet des identifiants valides puis redirige vers les salles', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { getByTestId, getByRole } = await render(<LoginScreen />);

    await user.type(getByTestId('login-email'), 'marie@soundproof.fr');
    await user.type(getByTestId('login-password'), 'MotDePasseFort1');
    await user.press(getByRole('button', { name: 'Se connecter' }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('marie@soundproof.fr', 'MotDePasseFort1'),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/rooms'));
  });
});
