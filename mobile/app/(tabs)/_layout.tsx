import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/features/auth/auth-context';
import { colors } from '@/lib/theme';

/**
 * Zone authentifiée : barre d'onglets en bas (zone du pouce).
 * Redirection vers /login si non authentifié ; onglet Admin réservé au rôle ADMIN
 * (le contrôle d'accès réel reste côté API dans tous les cas).
 */
export default function TabsLayout() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <Spinner label="Ouverture de votre session" />;
  }
  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Salles',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          // Onglet masqué pour les membres
          href: isAdmin ? '/(tabs)/admin' : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
