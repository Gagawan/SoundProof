import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRoom } from '@/api/rooms';
import type { Message } from '@/api/types';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/features/auth/auth-context';
import { useRoomChat } from '@/features/chat/use-room-chat';
import { formatTime } from '@/lib/slots';
import { colors, fontSizes, MIN_TOUCH_SIZE, radii, spacing } from '@/lib/theme';

const MESSAGE_MAX_LENGTH = 1000;

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
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

export default function RoomChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');

  const roomQuery = useQuery({ queryKey: ['rooms', id], queryFn: () => getRoom(id) });
  const chat = useRoomChat(id);

  const sendDraft = () => {
    const content = draft.trim();
    if (content.length === 0 || content.length > MESSAGE_MAX_LENGTH) return;
    chat.send(content);
    setDraft('');
  };

  if (chat.accessError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Chat' }} />
        <EmptyState emoji="🔒" title="Accès réservé" description={chat.accessError} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: roomQuery.data ? `Chat — ${roomQuery.data.name}` : 'Chat',
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Indicateur de connexion temps réel */}
          <View
            style={styles.statusBar}
            accessibilityLiveRegion="polite"
            accessibilityLabel={chat.connected ? 'Chat connecté' : 'Chat en cours de reconnexion'}
          >
            <View style={[styles.statusDot, chat.connected ? styles.dotOn : styles.dotOff]} />
            <Text style={styles.statusText}>{chat.connected ? 'En ligne' : 'Reconnexion…'}</Text>
          </View>

          {chat.isLoading ? (
            <Spinner label="Chargement des messages" />
          ) : chat.messages.length === 0 ? (
            <EmptyState
              emoji="💬"
              title="Aucun message"
              description="Lancez la conversation avec les autres musiciens de la salle !"
            />
          ) : (
            <FlatList
              inverted
              data={chat.messages}
              keyExtractor={(message) => message.id}
              contentContainerStyle={styles.list}
              onEndReached={chat.loadOlder}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => (
                <MessageBubble message={item} isMine={item.user.id === user?.id} />
              )}
            />
          )}

          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Votre message"
              placeholder="Votre message…"
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={MESSAGE_MAX_LENGTH}
              style={styles.input}
              testID="chat-input"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
              accessibilityState={{ disabled: draft.trim().length === 0 }}
              disabled={draft.trim().length === 0}
              onPress={sendDraft}
              style={[styles.sendButton, draft.trim().length === 0 && styles.sendDisabled]}
              testID="chat-send"
            >
              <Text style={styles.sendIcon}>➤</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  dotOn: { backgroundColor: colors.success },
  dotOff: { backgroundColor: colors.danger },
  statusText: { fontSize: fontSizes.sm, color: colors.textMuted },
  list: { padding: spacing.md },
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
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  sendButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    marginLeft: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendIcon: { color: colors.onPrimary, fontSize: fontSizes.lg },
});
