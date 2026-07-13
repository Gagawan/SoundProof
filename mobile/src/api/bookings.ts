import { apiClient } from './client';
import type { Booking } from './types';

export interface CreateBookingInput {
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  equipmentIds: string[];
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const { data } = await apiClient.post<Booking>('/bookings', {
    ...input,
    startsAt: input.startsAt.toISOString(),
    endsAt: input.endsAt.toISOString(),
  });
  return data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings/me');
  return data;
}

/** Toutes les réservations (rôle ADMIN). */
export async function getAllBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings');
  return data;
}

export async function cancelBooking(id: string): Promise<void> {
  await apiClient.delete(`/bookings/${id}`);
}
