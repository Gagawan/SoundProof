import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { colors, fontSizes, spacing } from '@/lib/theme';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** État vide ou d'erreur d'une liste, avec action de reprise optionnelle. */
export function EmptyState({
  emoji = '🎵',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description != null && <Text style={styles.description}>{description}</Text>}
      {actionLabel != null && onAction != null && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
