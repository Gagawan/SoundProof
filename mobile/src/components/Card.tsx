import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/lib/theme';

interface CardProps extends PropsWithChildren {
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

/** Carte de liste ; tactile (≥ 44 pt) quand onPress est fourni. */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  pressed: { opacity: 0.8 },
});
