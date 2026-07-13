import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as bookingsApi from '@/api/bookings';
import * as roomsApi from '@/api/rooms';
import type { Booking, Room } from '@/api/types';
import { ToastProvider } from '@/components/Toast';
import { addDays, formatDayLabel, startOfWeek } from '@/lib/slots';

import RoomDetailScreen from '../../app/rooms/[id]/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'room-1' }),
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

jest.mock('@/api/rooms');
jest.mock('@/api/bookings');

const roomsApiMock = roomsApi as jest.Mocked<typeof roomsApi>;
const bookingsApiMock = bookingsApi as jest.Mocked<typeof bookingsApi>;

const room: Room = {
  id: 'room-1',
  name: 'Studio A',
  description: 'Grande salle de répétition',
  capacity: 6,
  isActive: true,
  equipments: [
    {
      id: 'eq-1',
      name: 'Ampli Marshall',
      category: 'AMPLIFIER',
      roomId: 'room-1',
      isActive: true,
    },
  ],
};

/** Lundi de la semaine PROCHAINE (toujours dans le futur) à l'heure donnée. */
function nextMonday(hours: number, minutes = 0): Date {
  const monday = addDays(startOfWeek(new Date()), 7);
  monday.setHours(hours, minutes, 0, 0);
  return monday;
}

function Providers({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

describe('Écran de réservation (détail salle)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    roomsApiMock.getRoom.mockResolvedValue(room);
    // La salle est occupée lundi prochain de 10:00 à 12:00
    roomsApiMock.getAvailability.mockResolvedValue([
      {
        startsAt: nextMonday(10).toISOString(),
        endsAt: nextMonday(12).toISOString(),
      },
    ]);
  });

  async function openNextMonday(user: ReturnType<typeof userEvent.setup>) {
    const view = await render(<RoomDetailScreen />, { wrapper: Providers });
    await view.findByText('Grande salle de répétition');

    await user.press(view.getByLabelText('Semaine suivante'));
    await user.press(view.getByLabelText(formatDayLabel(nextMonday(0))));
    return view;
  }

  it('grise les créneaux occupés et laisse les créneaux libres sélectionnables', async () => {
    const user = userEvent.setup();
    const view = await openNextMonday(user);

    await waitFor(() => expect(view.getByLabelText('Créneau de 10:30')).toBeDisabled());
    expect(view.getByLabelText('Créneau de 12:00')).toBeEnabled();
    expect(view.getByLabelText('Créneau de 14:00')).toBeEnabled();
  });

  it('parcours complet : créneau + matériel + confirmation → création de la réservation', async () => {
    const booking = { id: 'booking-1' } as Booking;
    bookingsApiMock.createBooking.mockResolvedValue(booking);
    const user = userEvent.setup();
    const view = await openNextMonday(user);

    // Sélection du début puis de la fin (options générées par pas de 30 min)
    await user.press(await view.findByLabelText('Créneau de 14:00'));
    await user.press(await view.findByLabelText('Fin à 15:00'));

    // Le matériel de la salle est proposé en case à cocher
    const checkbox = await view.findByRole('checkbox', { name: 'Ampli Marshall' });
    await user.press(checkbox);

    await user.press(view.getByRole('button', { name: 'Confirmer la réservation' }));

    await waitFor(() => expect(bookingsApiMock.createBooking).toHaveBeenCalled());
    // TanStack Query ajoute un 2e argument (contexte) à mutationFn :
    // on vérifie uniquement le payload métier.
    expect(bookingsApiMock.createBooking.mock.calls[0][0]).toEqual({
      roomId: 'room-1',
      startsAt: nextMonday(14),
      endsAt: nextMonday(15),
      equipmentIds: ['eq-1'],
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/(tabs)/bookings'));
  });
});
