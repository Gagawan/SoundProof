import { useState } from 'react';

/**
 * Horodatage figé au montage de l'écran. Suffisant pour départager
 * réservations passées / à venir, et compatible avec l'exigence de pureté
 * du rendu (react-compiler) : pas d'appel à Date.now() pendant le rendu.
 */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
