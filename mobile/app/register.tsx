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
import { RegisterForm, registerSchema } from '@/features/auth/schemas';
import { colors, fontSizes, spacing } from '@/lib/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
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
            Créer un compte
          </Text>
          <Text style={styles.subtitle}>
            Mot de passe : 12 caractères minimum, avec minuscule, majuscule et chiffre.
          </Text>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Prénom"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                autoComplete="given-name"
                testID="register-firstname"
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Nom"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                autoComplete="family-name"
                testID="register-lastname"
              />
            )}
          />
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
                testID="register-email"
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
                autoComplete="new-password"
                testID="register-password"
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Confirmer le mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                secureTextEntry
                autoComplete="new-password"
                testID="register-confirm"
              />
            )}
          />

          {apiError != null && (
            <Text accessibilityLiveRegion="assertive" style={styles.apiError}>
              {apiError}
            </Text>
          )}

          <Button label="Créer mon compte" onPress={onSubmit} loading={submitting} />

          <Link href="/login" style={styles.link} accessibilityRole="link">
            Déjà inscrit ? Se connecter
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
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
