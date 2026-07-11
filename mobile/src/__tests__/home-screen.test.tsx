import { render } from '@testing-library/react-native';

import HomeScreen from '../../app/index';

describe('HomeScreen', () => {
  it("affiche le titre de l'application", async () => {
    const { getByRole } = await render(<HomeScreen />);

    expect(getByRole('header', { name: /SoundProof/i })).toBeOnTheScreen();
  });
});
