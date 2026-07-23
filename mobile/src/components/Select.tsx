import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Modal } from '@/components/Modal';
import { colors, fontSizes, MIN_TOUCH_SIZE, radii, spacing } from '@/lib/theme';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

/** Sélecteur accessible : ouvre une liste d'options dans une modale. */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choisir…',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityHint="Ouvre la liste des choix"
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <Text style={selected ? styles.value : styles.placeholder}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} title={label} onClose={() => setOpen(false)}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: option.value === value }}
            accessibilityLabel={option.label}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
            style={[styles.option, option.value === value && styles.optionSelected]}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            {option.value === value && <Text style={styles.check}>✓</Text>}
          </Pressable>
        ))}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  field: {
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  value: { fontSize: fontSizes.md, color: colors.text },
  placeholder: { fontSize: fontSizes.md, color: colors.textMuted },
  option: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  optionSelected: { backgroundColor: colors.selected },
  optionLabel: { fontSize: fontSizes.md, color: colors.text },
  check: { fontSize: fontSizes.md, color: colors.primary, fontWeight: '700' },
});
