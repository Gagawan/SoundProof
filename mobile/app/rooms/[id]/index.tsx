import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { createBooking } from '@/api/bookings';
import { getErrorMessage } from '@/api/client';
import { getAvailability, getRoom } from '@/api/rooms';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import {
  addDays,
  formatDayLabel,
  formatRange,
  formatTime,
  generateDaySlots,
  getEndOptions,
  getWeekDays,
  isSlotFree,
  isSlotPast,
  startOfWeek,
  type TimeRange,
} from '@/lib/slots';
import { colors, fontSizes, MIN_TOUCH_SIZE, radii, spacing } from '@/lib/theme';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const weekStart = weekDays[0];
  const weekEnd = addDays(weekStart, 7);

  const roomQuery = useQuery({ queryKey: ['rooms', id], queryFn: () => getRoom(id) });
  const availabilityQuery = useQuery({
    queryKey: ['availability', id, weekStart.toISOString()],
    queryFn: () => getAvailability(id, weekStart, weekEnd),
  });

  const occupied: TimeRange[] = useMemo(
    () =>
      (availabilityQuery.data ?? []).map((slot) => ({
        startsAt: new Date(slot.startsAt),
        endsAt: new Date(slot.endsAt),
      })),
    [availabilityQuery.data],
  );

  const daySlots = useMemo(() => generateDaySlots(selectedDay), [selectedDay]);
  const endOptions = useMemo(
    () => (start ? getEndOptions(start, occupied) : []),
    [start, occupied],
  );

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: async () => {
      toast.show('Réservation confirmée ! 🎸');
      await queryClient.invalidateQueries({ queryKey: ['availability'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.push('/(tabs)/bookings');
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  if (roomQuery.isLoading) {
    return <Spinner label="Chargement de la salle" />;
  }
  if (roomQuery.isError || !roomQuery.data) {
    return (
      <EmptyState
        emoji="📡"
        title="Salle indisponible"
        description="Impossible de charger cette salle. Vérifiez votre connexion."
        actionLabel="Réessayer"
        onAction={() => void roomQuery.refetch()}
      />
    );
  }

  const room = roomQuery.data;

  const selectSlot = (slot: Date) => {
    if (start && slot.getTime() === start.getTime()) {
      // Re-taper le début le désélectionne
      setStart(null);
      setEnd(null);
      return;
    }
    setStart(slot);
    setEnd(null);
  };

  const toggleEquipment = (equipmentId: string) => {
    setEquipmentIds((current) =>
      current.includes(equipmentId)
        ? current.filter((eid) => eid !== equipmentId)
        : [...current, equipmentId],
    );
  };

  const confirm = () => {
    if (!start || !end) return;
    bookMutation.mutate({ roomId: room.id, startsAt: start, endsAt: end, equipmentIds });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: room.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.description}>{room.description}</Text>
        <Text style={styles.capacity}>👥 Jusqu’à {room.capacity} personnes</Text>

        <View style={styles.actionsRow}>
          <Button
            label="💬 Chat de la salle"
            variant="secondary"
            onPress={() => router.push(`/rooms/${room.id}/chat`)}
            accessibilityHint="Réservé aux membres ayant une réservation dans cette salle"
            style={styles.chatButton}
          />
        </View>

        {/* Navigation de semaine */}
        <View style={styles.weekNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Semaine précédente"
            onPress={() => setWeekAnchor((d) => addDays(startOfWeek(d), -7))}
            style={styles.weekArrow}
          >
            <Text style={styles.weekArrowText}>◀</Text>
          </Pressable>
          <Text style={styles.weekLabel} accessibilityRole="header">
            Semaine du {formatDayLabel(weekStart)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Semaine suivante"
            onPress={() => setWeekAnchor((d) => addDays(startOfWeek(d), 7))}
            style={styles.weekArrow}
          >
            <Text style={styles.weekArrowText}>▶</Text>
          </Pressable>
        </View>

        {/* Jours de la semaine */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
          {weekDays.map((day) => {
            const isSelected = day.toDateString() === selectedDay.toDateString();
            return (
              <Pressable
                key={day.toISOString()}
                accessibilityRole="button"
                accessibilityLabel={formatDayLabel(day)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setSelectedDay(day);
                  setStart(null);
                  setEnd(null);
                }}
                style={[styles.dayChip, isSelected && styles.dayChipSelected]}
              >
                <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                  {formatDayLabel(day)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grille des créneaux (pas de 30 min) */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Début du créneau
        </Text>
        {availabilityQuery.isLoading ? (
          <Spinner label="Chargement des disponibilités" />
        ) : (
          <View style={styles.slotGrid}>
            {daySlots.map((slot) => {
              const free = isSlotFree(slot, occupied) && !isSlotPast(slot);
              const isStart = start?.getTime() === slot.getTime();
              return (
                <Pressable
                  key={slot.toISOString()}
                  accessibilityRole="button"
                  accessibilityLabel={`Créneau de ${formatTime(slot)}`}
                  accessibilityState={{ disabled: !free, selected: isStart }}
                  disabled={!free}
                  onPress={() => selectSlot(slot)}
                  style={[
                    styles.slot,
                    !free && styles.slotOccupied,
                    isStart && styles.slotSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotText,
                      !free && styles.slotTextOccupied,
                      isStart && styles.slotTextSelected,
                    ]}
                  >
                    {formatTime(slot)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Fin du créneau */}
        {start && (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Fin du créneau
            </Text>
            {endOptions.length === 0 ? (
              <Text style={styles.hint}>
                Aucune fin possible depuis {formatTime(start)} : créneau suivant occupé.
              </Text>
            ) : (
              <View style={styles.slotGrid}>
                {endOptions.map((option) => {
                  const isEnd = end?.getTime() === option.getTime();
                  return (
                    <Pressable
                      key={option.toISOString()}
                      accessibilityRole="button"
                      accessibilityLabel={`Fin à ${formatTime(option)}`}
                      accessibilityState={{ selected: isEnd }}
                      onPress={() => setEnd(option)}
                      style={[styles.slot, isEnd && styles.slotSelected]}
                    >
                      <Text style={[styles.slotText, isEnd && styles.slotTextSelected]}>
                        {formatTime(option)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Matériel supplémentaire */}
        {start && end && room.equipments.length > 0 && (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Matériel supplémentaire
            </Text>
            {room.equipments.map((equipment) => {
              const checked = equipmentIds.includes(equipment.id);
              return (
                <Pressable
                  key={equipment.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={equipment.name}
                  onPress={() => toggleEquipment(equipment.id)}
                  style={styles.equipmentRow}
                >
                  <Text style={styles.checkbox}>{checked ? '☑' : '☐'}</Text>
                  <Text style={styles.equipmentName}>{equipment.name}</Text>
                </Pressable>
              );
            })}
          </>
        )}

        {/* Récapitulatif + confirmation */}
        {start && end && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {formatRange(start, end)}
              {equipmentIds.length > 0 ? ` · ${equipmentIds.length} matériel(s)` : ''}
            </Text>
            <Button
              label="Confirmer la réservation"
              onPress={confirm}
              loading={bookMutation.isPending}
            />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  description: { fontSize: fontSizes.md, color: colors.text },
  capacity: { marginTop: spacing.xs, fontSize: fontSizes.md, color: colors.textMuted },
  actionsRow: { marginTop: spacing.md },
  chatButton: { alignSelf: 'flex-start' },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  weekArrow: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowText: { fontSize: fontSizes.lg, color: colors.primary },
  weekLabel: { fontSize: fontSizes.md, fontWeight: '600', color: colors.text },
  daysRow: { marginTop: spacing.sm },
  dayChip: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  dayChipSelected: { backgroundColor: colors.primary },
  dayChipText: { fontSize: fontSizes.md, color: colors.text },
  dayChipTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text,
  },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    minWidth: 72,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  slotOccupied: { backgroundColor: colors.occupied, borderColor: colors.occupied },
  slotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: fontSizes.md, color: colors.text },
  slotTextOccupied: { color: colors.textMuted, textDecorationLine: 'line-through' },
  slotTextSelected: { color: colors.onPrimary, fontWeight: '700' },
  hint: { fontSize: fontSizes.md, color: colors.textMuted },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE,
  },
  checkbox: { fontSize: fontSizes.lg, color: colors.primary, marginRight: spacing.sm },
  equipmentName: { fontSize: fontSizes.md, color: colors.text },
  summary: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.selected,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  summaryText: { fontSize: fontSizes.md, fontWeight: '600', color: colors.text },
});
