import { createContext, PropsWithChildren, useCallback, useContext, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, spacing } from '@/lib/theme';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;

/**
 * Notifications de succès/erreur après chaque action : bandeau en haut d'écran,
 * annoncé aux lecteurs d'écran (AccessibilityInfo.announceForAccessibility).
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setToast({ message, type });
    AccessibilityInfo.announceForAccessibility(message);
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            { top: insets.top + spacing.sm },
            toast.type === 'error' ? styles.error : styles.success,
          ]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé sous <ToastProvider>.');
  }
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
  text: {
    color: colors.onPrimary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    textAlign: 'center',
  },
});
