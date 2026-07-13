import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, spacing } from '@/lib/theme';

/** Indicateur de chargement plein écran, annoncé aux lecteurs d'écran. */
export function Spinner({ label = 'Chargement en cours' }: { label?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  label: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
});
