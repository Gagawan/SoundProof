import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, fontSizes, MIN_TOUCH_SIZE, radii, spacing } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

/** Champ de saisie avec libellé et erreur associée (annoncée aux lecteurs d'écran). */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, ...inputProps },
  ref,
) {
  return (
    <View style={styles.container}>
      <Text style={styles.label} nativeID={`${label}-label`}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${label}-label`}
        accessibilityHint={error}
        style={[styles.input, error != null && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {error != null && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  error: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
  },
});
