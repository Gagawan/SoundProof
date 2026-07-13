import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';

import { getMessages } from '@/api/chat';
import { API_URL, getAccessToken } from '@/api/client';
import type { Message, MessagesPage } from '@/api/types';

interface SocketErrorPayload {
  code: string;
  message: string;
}

interface UseRoomChatResult {
  messages: Message[];
  connected: boolean;
  accessError: string | null;
  isLoading: boolean;
  hasMore: boolean;
  loadOlder: () => void;
  send: (content: string) => void;
}

/**
 * Chat temps réel d'une salle :
 * - historique paginé par cursor (REST, useInfiniteQuery) ;
 * - messages instantanés via Socket.IO (JWT dans le handshake) ;
 * - reconnexion explicite au retour au premier plan : re-join de la room
 *   et rafraîchissement de l'historique (messages manqués en arrière-plan).
 */
export function useRoomChat(roomId: string): UseRoomChatResult {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const queryKey = ['messages', roomId];

  const history = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getMessages(roomId, pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Connexion Socket.IO (namespace /chat)
  useEffect(() => {
    const socket = io(`${API_URL}/chat`, {
      auth: { token: getAccessToken() },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('room:join', { roomId });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('message:new', (message: Message) => {
      // Insertion en tête de la première page du cache (FlatList inversée)
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        queryKey,
        (data) => {
          if (!data) return data;
          const [first, ...rest] = data.pages;
          return {
            ...data,
            pages: [{ ...first, messages: [message, ...first.messages] }, ...rest],
          };
        },
      );
      AccessibilityInfo.announceForAccessibility(
        `Nouveau message de ${message.user.firstName} : ${message.content}`,
      );
    });

    socket.on('error', (payload: SocketErrorPayload) => {
      if (payload.code === 'FORBIDDEN' || payload.code === 'UNAUTHORIZED') {
        setAccessError(payload.message);
      }
    });

    // Retour au premier plan : reconnexion + récupération des messages manqués
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('room:join', { roomId });
        void queryClient.invalidateQueries({ queryKey });
      }
    });

    return () => {
      appStateSubscription.remove();
      socket.emit('room:leave', { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, queryClient]);

  const send = useCallback(
    (content: string) => {
      socketRef.current?.emit('message:send', { roomId, content });
    },
    [roomId],
  );

  const messages = history.data?.pages.flatMap((page) => page.messages) ?? [];

  return {
    messages,
    connected,
    accessError,
    isLoading: history.isLoading,
    hasMore: history.hasNextPage ?? false,
    loadOlder: () => {
      if (history.hasNextPage && !history.isFetchingNextPage) {
        void history.fetchNextPage();
      }
    },
    send,
  };
}
