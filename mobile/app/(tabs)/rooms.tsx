import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { getRooms } from '@/api/rooms';
import type { Room } from '@/api/types';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { colors, fontSizes, spacing } from '@/lib/theme';

const CATEGORY_EMOJI: Record<string, string> = {
  AMPLIFIER: '🔊',
  DRUMS: '🥁',
  MICROPHONE: '🎤',
  MIXER: '🎚️',
  KEYBOARD: '🎹',
  GUITAR: '🎸',
  BASS: '🎸',
  OTHER: '🎵',
};

function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  const equipmentSummary = room.equipments
    .map((e) => `${CATEGORY_EMOJI[e.category] ?? '🎵'} ${e.name}`)
    .join(' · ');

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Salle ${room.name}, capacité ${room.capacity} personnes, ${room.equipments.length} équipements`}
      accessibilityHint="Affiche le détail et le calendrier de réservation"
    >
      <View style={styles.cardHeader}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.capacity}>👥 {room.capacity}</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {room.description}
      </Text>
      {room.equipments.length > 0 && (
        <Text style={styles.equipments} numberOfLines={2}>
          {equipmentSummary}
        </Text>
      )}
    </Card>
  );
}

export default function RoomsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  });

  if (isLoading) {
    return <Spinner label="Chargement des salles" />;
  }
  if (isError) {
    return (
      <EmptyState
        emoji="📡"
        title="Impossible de charger les salles"
        description="Vérifiez votre connexion puis réessayez."
        actionLabel="Réessayer"
        onAction={() => void refetch()}
      />
    );
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Aucune salle disponible"
        description="Les salles apparaîtront ici dès qu'elles seront ouvertes à la réservation."
      />
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(room) => room.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      renderItem={({ item }) => (
        <RoomCard room={item} onPress={() => router.push(`/rooms/${item.id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  capacity: { fontSize: fontSizes.md, color: colors.textMuted },
  description: {
    marginTop: spacing.xs,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  equipments: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
});
