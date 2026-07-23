import { Redirect } from 'expo-router';

import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/features/auth/auth-context';

/** Point d'entrée : redirige selon l'état de session (restauration au démarrage). */
export default function IndexScreen() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <Spinner label="Ouverture de votre session" />;
  }
  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/rooms" />;
  }
  return <Redirect href="/login" />;
}
