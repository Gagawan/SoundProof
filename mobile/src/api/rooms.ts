import { apiClient } from './client';
import type { Equipment, EquipmentCategory, OccupiedSlot, Room } from './types';

export async function getRooms(): Promise<Room[]> {
  const { data } = await apiClient.get<Room[]>('/rooms');
  return data;
}

export async function getRoom(id: string): Promise<Room> {
  const { data } = await apiClient.get<Room>(`/rooms/${id}`);
  return data;
}

export async function getAvailability(id: string, from: Date, to: Date): Promise<OccupiedSlot[]> {
  const { data } = await apiClient.get<OccupiedSlot[]>(`/rooms/${id}/availability`, {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data;
}

// --- Administration (rôle ADMIN) ---

export interface RoomInput {
  name: string;
  description: string;
  capacity: number;
}

export async function createRoom(input: RoomInput): Promise<Room> {
  const { data } = await apiClient.post<Room>('/rooms', input);
  return data;
}

export async function updateRoom(id: string, input: Partial<RoomInput>): Promise<Room> {
  const { data } = await apiClient.patch<Room>(`/rooms/${id}`, input);
  return data;
}

export async function deactivateRoom(id: string): Promise<void> {
  await apiClient.delete(`/rooms/${id}`);
}

export interface EquipmentInput {
  name: string;
  category: EquipmentCategory;
}

export async function createEquipment(roomId: string, input: EquipmentInput): Promise<Equipment> {
  const { data } = await apiClient.post<Equipment>(`/rooms/${roomId}/equipment`, input);
  return data;
}

export async function deactivateEquipment(roomId: string, equipmentId: string): Promise<void> {
  await apiClient.delete(`/rooms/${roomId}/equipment/${equipmentId}`);
}
