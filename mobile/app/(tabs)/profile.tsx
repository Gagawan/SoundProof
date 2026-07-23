import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/features/auth/auth-context';
import { colors, fontSizes, spacing } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = () => {
    Alert.alert('Se déconnecter ?', 'Vous devrez vous reconnecter pour réserver.', [
      { text: 'Rester connecté', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          setLoggingOut(true);
          void logout().finally(() => {
            setLoggingOut(false);
            router.replace('/login');
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text accessibilityRole="header" style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.detail}>{user?.email}</Text>
        <Text style={styles.detail}>
          Rôle : {user?.role === 'ADMIN' ? 'Administrateur' : 'Membre'}
        </Text>
      </Card>

      <Button
        label="Se déconnecter"
        variant="danger"
        loading={loggingOut}
        onPress={confirmLogout}
        accessibilityHint="Ouvre une demande de confirmation"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  name: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.text },
  detail: { marginTop: spacing.xs, fontSize: fontSizes.md, color: colors.textMuted },
});
