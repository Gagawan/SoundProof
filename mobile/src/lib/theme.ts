/**
 * Thème centralisé de SoundProof — aucune valeur en dur dans les écrans.
 * Contrastes vérifiés ≥ 4.5:1 sur fond blanc (WCAG 2.1 AA, voir docs/06).
 */
export const colors = {
  primary: '#1D4ED8', // bleu — contraste 6.3:1 sur blanc
  primaryPressed: '#1E40AF',
  background: '#FFFFFF',
  surface: '#F4F5F7',
  border: '#D1D5DB',
  text: '#111827', // contraste 17.7:1
  textMuted: '#4B5563', // contraste 7.6:1
  danger: '#B91C1C', // contraste 6.9:1
  success: '#15803D', // contraste 5.0:1
  onPrimary: '#FFFFFF',
  occupied: '#E5E7EB',
  selected: '#DBEAFE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSizes = {
  sm: 13,
  md: 16,
  lg: 20,
  xl: 26,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

/** Taille tactile minimale (pt) — exigence ergonomie/accessibilité. */
export const MIN_TOUCH_SIZE = 44;
