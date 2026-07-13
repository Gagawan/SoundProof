import { StyleSheet, Text, View } from 'react-native';

import type { Message } from '@/api/types';
import { formatTime } from '@/lib/slots';
import { colors, fontSizes, radii, spacing } from '@/lib/theme';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

/** Bulle de message du chat : auteur (pour les autres), contenu, horodatage. */
export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = formatTime(new Date(message.createdAt));
  return (
    <View
      accessibilityLabel={`${message.user.firstName} à ${time} : ${message.content}`}
      style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
    >
      {!isMine && (
        <Text style={styles.author}>
          {message.user.firstName} {message.user.lastName}
        </Text>
      )}
      <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{message.content}</Text>
      <Text style={[styles.time, isMine && styles.timeMine]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  author: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: { fontSize: fontSizes.md, color: colors.text },
  messageTextMine: { color: colors.onPrimary },
  time: { fontSize: 11, color: colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  timeMine: { color: colors.selected },
});
