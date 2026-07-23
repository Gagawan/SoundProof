/** Types du contrat d'API (miroir des réponses du backend NestJS). */

export type Role = 'ADMIN' | 'MEMBER';

export type EquipmentCategory =
  'AMPLIFIER' | 'DRUMS' | 'MICROPHONE' | 'MIXER' | 'KEYBOARD' | 'GUITAR' | 'BASS' | 'OTHER';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  roomId: string;
  isActive: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  isActive: boolean;
  equipments: Equipment[];
}

export interface OccupiedSlot {
  startsAt: string;
  endsAt: string;
}

export interface Booking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  createdAt: string;
  room: { id: string; name: string };
  user: { id: string; firstName: string; lastName: string };
  equipments: { equipment: { id: string; name: string; category: EquipmentCategory } }[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  roomId: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: User;
}
