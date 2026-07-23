import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { cancelBooking, getAllBookings } from '@/api/bookings';
import { getErrorMessage } from '@/api/client';
import {
  createEquipment,
  createRoom,
  deactivateEquipment,
  deactivateRoom,
  getRooms,
  updateRoom,
} from '@/api/rooms';
import type { Booking, EquipmentCategory, Room } from '@/api/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useNow } from '@/hooks/use-now';
import { formatRange } from '@/lib/slots';
import { colors, fontSizes, MIN_TOUCH_SIZE, radii, spacing } from '@/lib/theme';

type Section = 'rooms' | 'bookings';

const CATEGORY_OPTIONS: { value: EquipmentCategory; label: string }[] = [
  { value: 'AMPLIFIER', label: 'Amplificateur' },
  { value: 'DRUMS', label: 'Batterie' },
  { value: 'MICROPHONE', label: 'Micro' },
  { value: 'MIXER', label: 'Table de mixage' },
  { value: 'KEYBOARD', label: 'Clavier / piano' },
  { value: 'GUITAR', label: 'Guitare' },
  { value: 'BASS', label: 'Basse' },
  { value: 'OTHER', label: 'Autre' },
];

interface RoomFormState {
  id: string | null; // null = création
  name: string;
  description: string;
  capacity: string;
}

const EMPTY_ROOM_FORM: RoomFormState = { id: null, name: '', description: '', capacity: '' };

export default function AdminScreen() {
  const toast = useToast();
  const now = useNow();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>('rooms');

  // --- Formulaire salle (création/édition) ---
  const [roomForm, setRoomForm] = useState<RoomFormState | null>(null);
  // --- Gestion du matériel d'une salle ---
  const [equipmentRoom, setEquipmentRoom] = useState<Room | null>(null);
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentCategory, setNewEquipmentCategory] = useState<EquipmentCategory | null>(null);

  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: getAllBookings,
    enabled: section === 'bookings',
  });

  const invalidateRooms = async () => {
    await queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const saveRoomMutation = useMutation({
    mutationFn: (form: RoomFormState) => {
      const input = {
        name: form.name.trim(),
        description: form.description.trim(),
        capacity: Number(form.capacity),
      };
      return form.id ? updateRoom(form.id, input) : createRoom(input);
    },
    onSuccess: async (_room, form) => {
      toast.show(form.id ? 'Salle modifiée.' : 'Salle créée.');
      setRoomForm(null);
      await invalidateRooms();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const deactivateRoomMutation = useMutation({
    mutationFn: deactivateRoom,
    onSuccess: async () => {
      toast.show('Salle désactivée.');
      await invalidateRooms();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const addEquipmentMutation = useMutation({
    mutationFn: ({
      roomId,
      name,
      category,
    }: {
      roomId: string;
      name: string;
      category: EquipmentCategory;
    }) => createEquipment(roomId, { name, category }),
    onSuccess: async (equipment) => {
      toast.show('Matériel ajouté.');
      setNewEquipmentName('');
      setNewEquipmentCategory(null);
      setEquipmentRoom((room) =>
        room ? { ...room, equipments: [...room.equipments, equipment] } : room,
      );
      await invalidateRooms();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const deactivateEquipmentMutation = useMutation({
    mutationFn: ({ roomId, equipmentId }: { roomId: string; equipmentId: string }) =>
      deactivateEquipment(roomId, equipmentId),
    onSuccess: async (_data, { equipmentId }) => {
      toast.show('Matériel désactivé.');
      setEquipmentRoom((room) =>
        room ? { ...room, equipments: room.equipments.filter((e) => e.id !== equipmentId) } : room,
      );
      await invalidateRooms();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      toast.show('Réservation annulée.');
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const confirmDeactivateRoom = (room: Room) => {
    Alert.alert('Désactiver la salle ?', `${room.name} ne sera plus réservable.`, [
      { text: 'Garder', style: 'cancel' },
      {
        text: 'Désactiver',
        style: 'destructive',
        onPress: () => deactivateRoomMutation.mutate(room.id),
      },
    ]);
  };

  const confirmCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Annuler cette réservation ?',
      `${booking.user.firstName} ${booking.user.lastName} — ${booking.room.name}`,
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler la réservation',
          style: 'destructive',
          onPress: () => cancelBookingMutation.mutate(booking.id),
        },
      ],
    );
  };

  const roomFormValid =
    roomForm !== null &&
    roomForm.name.trim().length > 0 &&
    roomForm.description.trim().length > 0 &&
    Number.isInteger(Number(roomForm.capacity)) &&
    Number(roomForm.capacity) >= 1;

  return (
    <View style={styles.container}>
      {/* Sélecteur de section */}
      <View style={styles.sections} accessibilityRole="tablist">
        {(
          [
            ['rooms', 'Salles & matériel'],
            ['bookings', 'Réservations'],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === value }}
            accessibilityLabel={label}
            onPress={() => setSection(value)}
            style={[styles.section, section === value && styles.sectionActive]}
          >
            <Text style={[styles.sectionLabel, section === value && styles.sectionLabelActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {section === 'rooms' ? (
        roomsQuery.isLoading ? (
          <Spinner label="Chargement des salles" />
        ) : (
          <FlatList
            data={roomsQuery.data ?? []}
            keyExtractor={(room) => room.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={roomsQuery.isRefetching}
                onRefresh={() => void roomsQuery.refetch()}
              />
            }
            ListHeaderComponent={
              <Button
                label="＋ Nouvelle salle"
                onPress={() => setRoomForm(EMPTY_ROOM_FORM)}
                style={styles.newButton}
              />
            }
            ListEmptyComponent={
              <EmptyState title="Aucune salle" description="Créez la première salle." />
            }
            renderItem={({ item: room }) => (
              <Card accessibilityLabel={`Salle ${room.name}`}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomDetail}>
                  👥 {room.capacity} · {room.equipments.length} équipement(s)
                </Text>
                <View style={styles.roomActions}>
                  <Button
                    label="Modifier"
                    variant="secondary"
                    onPress={() =>
                      setRoomForm({
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        capacity: String(room.capacity),
                      })
                    }
                    style={styles.roomAction}
                  />
                  <Button
                    label="Matériel"
                    variant="secondary"
                    onPress={() => setEquipmentRoom(room)}
                    style={styles.roomAction}
                  />
                  <Button
                    label="Désactiver"
                    variant="danger"
                    onPress={() => confirmDeactivateRoom(room)}
                    accessibilityHint="Ouvre une demande de confirmation"
                    style={styles.roomAction}
                  />
                </View>
              </Card>
            )}
          />
        )
      ) : bookingsQuery.isLoading ? (
        <Spinner label="Chargement des réservations" />
      ) : (
        <FlatList
          data={bookingsQuery.data ?? []}
          keyExtractor={(booking) => booking.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching}
              onRefresh={() => void bookingsQuery.refetch()}
            />
          }
          ListEmptyComponent={<EmptyState title="Aucune réservation" />}
          renderItem={({ item: booking }) => {
            const cancelled = booking.status === 'CANCELLED';
            const upcoming = new Date(booking.startsAt).getTime() > now;
            return (
              <Card
                accessibilityLabel={`Réservation de ${booking.user.firstName} ${booking.user.lastName}, salle ${booking.room.name}`}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.roomName}>{booking.room.name}</Text>
                  {cancelled && <Text style={styles.cancelledBadge}>Annulée</Text>}
                </View>
                <Text style={styles.roomDetail}>
                  {booking.user.firstName} {booking.user.lastName}
                </Text>
                <Text style={styles.roomDetail}>
                  {formatRange(new Date(booking.startsAt), new Date(booking.endsAt))}
                </Text>
                {!cancelled && upcoming && (
                  <Button
                    label="Annuler"
                    variant="danger"
                    onPress={() => confirmCancelBooking(booking)}
                    accessibilityHint="Ouvre une demande de confirmation"
                    style={styles.cancelButton}
                  />
                )}
              </Card>
            );
          }}
        />
      )}

      {/* Modale création/édition de salle */}
      <Modal
        visible={roomForm !== null}
        title={roomForm?.id ? 'Modifier la salle' : 'Nouvelle salle'}
        onClose={() => setRoomForm(null)}
      >
        {roomForm && (
          <>
            <Input
              label="Nom"
              value={roomForm.name}
              onChangeText={(name) => setRoomForm({ ...roomForm, name })}
            />
            <Input
              label="Description"
              value={roomForm.description}
              onChangeText={(description) => setRoomForm({ ...roomForm, description })}
              multiline
            />
            <Input
              label="Capacité (personnes)"
              value={roomForm.capacity}
              onChangeText={(capacity) => setRoomForm({ ...roomForm, capacity })}
              keyboardType="number-pad"
            />
            <Button
              label={roomForm.id ? 'Enregistrer' : 'Créer la salle'}
              onPress={() => saveRoomMutation.mutate(roomForm)}
              loading={saveRoomMutation.isPending}
              disabled={!roomFormValid}
            />
          </>
        )}
      </Modal>

      {/* Modale gestion du matériel */}
      <Modal
        visible={equipmentRoom !== null}
        title={`Matériel — ${equipmentRoom?.name ?? ''}`}
        onClose={() => setEquipmentRoom(null)}
      >
        {equipmentRoom && (
          <>
            {equipmentRoom.equipments.length === 0 ? (
              <Text style={styles.emptyEquipment}>Aucun matériel dans cette salle.</Text>
            ) : (
              equipmentRoom.equipments.map((equipment) => (
                <View key={equipment.id} style={styles.equipmentRow}>
                  <Text style={styles.equipmentName}>{equipment.name}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Désactiver ${equipment.name}`}
                    onPress={() =>
                      deactivateEquipmentMutation.mutate({
                        roomId: equipmentRoom.id,
                        equipmentId: equipment.id,
                      })
                    }
                    style={styles.equipmentRemove}
                  >
                    <Text style={styles.equipmentRemoveText}>Désactiver</Text>
                  </Pressable>
                </View>
              ))
            )}

            <View style={styles.addEquipment}>
              <Input
                label="Nouveau matériel"
                value={newEquipmentName}
                onChangeText={setNewEquipmentName}
                placeholder="Ex. : Ampli Fender Twin"
              />
              <Select
                label="Catégorie"
                value={newEquipmentCategory}
                options={CATEGORY_OPTIONS}
                onChange={setNewEquipmentCategory}
              />
              <Button
                label="Ajouter le matériel"
                onPress={() => {
                  if (newEquipmentCategory) {
                    addEquipmentMutation.mutate({
                      roomId: equipmentRoom.id,
                      name: newEquipmentName.trim(),
                      category: newEquipmentCategory,
                    });
                  }
                }}
                loading={addEquipmentMutation.isPending}
                disabled={newEquipmentName.trim().length === 0 || !newEquipmentCategory}
              />
            </View>
          </>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sections: {
    flexDirection: 'row',
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  section: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  sectionActive: { backgroundColor: colors.background },
  sectionLabel: { fontSize: fontSizes.md, color: colors.textMuted },
  sectionLabelActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },
  newButton: { marginBottom: spacing.md },
  roomName: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.text, flex: 1 },
  roomDetail: { marginTop: spacing.xs, fontSize: fontSizes.md, color: colors.textMuted },
  roomActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  roomAction: { flexGrow: 1 },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancelledBadge: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cancelButton: { marginTop: spacing.md },
  emptyEquipment: { fontSize: fontSizes.md, color: colors.textMuted, marginBottom: spacing.md },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_SIZE,
  },
  equipmentName: { fontSize: fontSizes.md, color: colors.text, flex: 1 },
  equipmentRemove: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  equipmentRemoveText: { color: colors.danger, fontSize: fontSizes.md },
  addEquipment: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
