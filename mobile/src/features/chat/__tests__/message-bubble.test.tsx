import { render } from '@testing-library/react-native';

import type { Message } from '@/api/types';

import { MessageBubble } from '../MessageBubble';

const message: Message = {
  id: 'msg-1',
  content: 'Quelqu’un a un câble XLR ?',
  createdAt: new Date(2026, 4, 11, 14, 2).toISOString(),
  roomId: 'room-1',
  user: { id: 'user-2', firstName: 'Marie', lastName: 'Dubois' },
};

describe('MessageBubble', () => {
  it('affiche auteur, contenu et horodatage pour un message reçu', async () => {
    const { getByText } = await render(<MessageBubble message={message} isMine={false} />);

    expect(getByText('Marie Dubois')).toBeOnTheScreen();
    expect(getByText('Quelqu’un a un câble XLR ?')).toBeOnTheScreen();
    expect(getByText('14:02')).toBeOnTheScreen();
  });

  it('masque le nom de l’auteur pour mes propres messages', async () => {
    const { queryByText, getByText } = await render(
      <MessageBubble message={message} isMine={true} />,
    );

    expect(queryByText('Marie Dubois')).toBeNull();
    expect(getByText('Quelqu’un a un câble XLR ?')).toBeOnTheScreen();
  });

  it('porte un label d’accessibilité complet (auteur, heure, contenu)', async () => {
    const { getByLabelText } = await render(<MessageBubble message={message} isMine={false} />);

    expect(getByLabelText('Marie à 14:02 : Quelqu’un a un câble XLR ?')).toBeOnTheScreen();
  });
});
