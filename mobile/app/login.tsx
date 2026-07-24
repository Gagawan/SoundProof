import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/features/auth/auth-context';
import { LoginForm, loginSchema } from '@/features/auth/schemas';
import { colors, fontSizes, spacing } from '@/lib/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await login(values.email, values.password);
      router.replace('/(tabs)/rooms');
    } catch (error) {
      setApiError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>
            SoundProof 🎸
          </Text>
          <Text style={styles.subtitle}>Connectez-vous pour réserver votre salle.</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                testID="login-email"
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                secureTextEntry
                autoComplete="password"
                testID="login-password"
              />
            )}
          />

          {apiError != null && (
            <Text accessibilityLiveRegion="assertive" style={styles.apiError}>
              {apiError}
            </Text>
          )}

          <Button label="Se connecter" onPress={onSubmit} loading={submitting} />

          <Link href="/register" style={styles.link} accessibilityRole="link">
            Pas de compte ? S’inscrire
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  apiError: {
    color: colors.danger,
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
    fontSize: fontSizes.md,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
