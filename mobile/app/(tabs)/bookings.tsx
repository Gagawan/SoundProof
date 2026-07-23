import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { cancelBooking, getMyBookings } from '@/api/bookings';
import { getErrorMessage } from '@/api/client';
import type { Booking } from '@/api/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useNow } from '@/hooks/use-now';
import { formatRange } from '@/lib/slots';
import { colors, fontSizes, MIN_TOUCH_SIZE, radii, spacing } from '@/lib/theme';

type Filter = 'upcoming' | 'past';

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  const cancelled = booking.status === 'CANCELLED';
  const range = formatRange(new Date(booking.startsAt), new Date(booking.endsAt));
  const equipmentNames = booking.equipments.map((e) => e.equipment.name).join(', ');

  return (
    <Card accessibilityLabel={`Réservation ${booking.room.name}, ${range}`}>
      <View style={styles.cardHeader}>
        <Text style={styles.roomName}>{booking.room.name}</Text>
        {cancelled && <Text style={styles.cancelledBadge}>Annulée</Text>}
      </View>
      <Text style={styles.range}>{range}</Text>
      {equipmentNames.length > 0 && (
        <Text style={styles.equipments}>Matériel : {equipmentNames}</Text>
      )}
      {onCancel != null && !cancelled && (
        <Button
          label="Annuler"
          variant="danger"
          onPress={onCancel}
          accessibilityHint="Ouvre une demande de confirmation"
          style={styles.cancelButton}
        />
      )}
    </Card>
  );
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState<Filter>('upcoming');
  const now = useNow();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: getMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      toast.show('Réservation annulée.');
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const confirmCancel = (booking: Booking) => {
    // Dialogue de confirmation natif (exigence écrans § 6.2)
    Alert.alert(
      'Annuler la réservation ?',
      `${booking.room.name} — ${formatRange(new Date(booking.startsAt), new Date(booking.endsAt))}`,
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler la réservation',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(booking.id),
        },
      ],
    );
  };

  if (isLoading) {
    return <Spinner label="Chargement de vos réservations" />;
  }
  if (isError) {
    return (
      <EmptyState
        emoji="📡"
        title="Impossible de charger vos réservations"
        description="Vérifiez votre connexion puis réessayez."
        actionLabel="Réessayer"
        onAction={() => void refetch()}
      />
    );
  }

  const filtered = (data ?? []).filter((b) =>
    filter === 'upcoming'
      ? new Date(b.endsAt).getTime() >= now
      : new Date(b.endsAt).getTime() < now,
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters} accessibilityRole="tablist">
        {(['upcoming', 'past'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === value }}
            accessibilityLabel={
              value === 'upcoming' ? 'Réservations à venir' : 'Réservations passées'
            }
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.filterActive]}
          >
            <Text style={[styles.filterLabel, filter === value && styles.filterLabelActive]}>
              {value === 'upcoming' ? 'À venir' : 'Passées'}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📅"
          title={filter === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
          description={
            filter === 'upcoming'
              ? 'Choisissez une salle dans l’onglet Salles pour réserver un créneau.'
              : undefined
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(booking) => booking.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancel={
                filter === 'upcoming' && new Date(item.startsAt).getTime() > now
                  ? () => confirmCancel(item)
                  : undefined
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: {
    flexDirection: 'row',
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  filter: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  filterActive: { backgroundColor: colors.background },
  filterLabel: { fontSize: fontSizes.md, color: colors.textMuted },
  filterLabelActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.text, flex: 1 },
  cancelledBadge: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  range: { marginTop: spacing.xs, fontSize: fontSizes.md, color: colors.text },
  equipments: { marginTop: spacing.xs, fontSize: fontSizes.sm, color: colors.textMuted },
  cancelButton: { marginTop: spacing.md },
});
