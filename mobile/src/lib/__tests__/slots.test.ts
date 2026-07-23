import {
  addDays,
  addMinutes,
  formatDayLabel,
  formatRange,
  formatTime,
  generateDaySlots,
  getEndOptions,
  getWeekDays,
  isSlotFree,
  isSlotPast,
  overlaps,
  startOfWeek,
  type TimeRange,
} from '../slots';

/** Date locale du lundi 11 mai 2026 à l'heure donnée. */
function monday(hours: number, minutes = 0): Date {
  return new Date(2026, 4, 11, hours, minutes, 0, 0);
}

describe('startOfWeek / getWeekDays', () => {
  it('retourne le lundi 00:00 de la semaine', () => {
    const wednesday = new Date(2026, 4, 13, 15, 30);
    const result = startOfWeek(wednesday);

    expect(result.getDay()).toBe(1); // lundi
    expect(result.getDate()).toBe(11);
    expect(result.getHours()).toBe(0);
  });

  it('gère le dimanche (rattaché à la semaine précédente)', () => {
    const sunday = new Date(2026, 4, 17, 10, 0);
    expect(startOfWeek(sunday).getDate()).toBe(11);
  });

  it('retourne 7 jours consécutifs de lundi à dimanche', () => {
    const days = getWeekDays(new Date(2026, 4, 13));

    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
    expect(days[6].getDate()).toBe(17);
  });
});

describe('generateDaySlots', () => {
  it('génère des créneaux de 30 minutes entre les heures d’ouverture', () => {
    const slots = generateDaySlots(monday(0), 8, 22);

    expect(slots).toHaveLength(28); // 14 h × 2 créneaux/h
    expect(formatTime(slots[0])).toBe('08:00');
    expect(formatTime(slots[1])).toBe('08:30');
    expect(formatTime(slots[slots.length - 1])).toBe('21:30');
  });
});

describe('overlaps', () => {
  const start = monday(10);
  const end = monday(12);

  it.each([
    ['chevauchement exact', monday(10), monday(12), true],
    ['fin dans la période', monday(9), monday(11), true],
    ['début dans la période', monday(11), monday(13), true],
    ['englobant', monday(9), monday(13), true],
    ['englobé', monday(10, 30), monday(11, 30), true],
    ['juste avant (bornes exclusives)', monday(8), monday(10), false],
    ['juste après (bornes exclusives)', monday(12), monday(14), false],
    ['disjoint', monday(14), monday(16), false],
  ])('%s → %s', (_label, bStart, bEnd, expected) => {
    expect(overlaps(start, end, bStart, bEnd)).toBe(expected);
  });
});

describe('isSlotFree', () => {
  const occupied: TimeRange[] = [{ startsAt: monday(10), endsAt: monday(12) }];

  it('marque occupé un créneau dans une réservation', () => {
    expect(isSlotFree(monday(10), occupied)).toBe(false);
    expect(isSlotFree(monday(11, 30), occupied)).toBe(false);
  });

  it('marque libre un créneau hors réservation (bornes exclusives)', () => {
    expect(isSlotFree(monday(9, 30), occupied)).toBe(true);
    expect(isSlotFree(monday(12), occupied)).toBe(true);
  });

  it('tout est libre sans réservation', () => {
    expect(isSlotFree(monday(10), [])).toBe(true);
  });
});

describe('isSlotPast', () => {
  it('un créneau antérieur à maintenant est passé', () => {
    expect(isSlotPast(monday(10), monday(11))).toBe(true);
    expect(isSlotPast(monday(10), monday(10))).toBe(true);
  });

  it('un créneau futur ne l’est pas', () => {
    expect(isSlotPast(monday(12), monday(10))).toBe(false);
  });
});

describe('getEndOptions', () => {
  it('propose des fins par pas de 30 min jusqu’à la fermeture', () => {
    const options = getEndOptions(monday(20), [], 22);

    expect(options.map(formatTime)).toEqual(['20:30', '21:00', '21:30', '22:00']);
  });

  it('s’arrête au premier créneau occupé', () => {
    const occupied: TimeRange[] = [{ startsAt: monday(11), endsAt: monday(12) }];
    const options = getEndOptions(monday(9), occupied, 22);

    // 9:00 → on peut finir à 9:30, 10:00, 10:30, 11:00 mais pas au-delà
    expect(options.map(formatTime)).toEqual(['09:30', '10:00', '10:30', '11:00']);
  });

  it('plafonne la durée à 8 heures', () => {
    const options = getEndOptions(monday(8), [], 22);

    expect(options).toHaveLength(16); // 8 h × 2
    expect(formatTime(options[options.length - 1])).toBe('16:00');
  });

  it('ne propose rien si le premier créneau est occupé', () => {
    const occupied: TimeRange[] = [{ startsAt: monday(10), endsAt: monday(11) }];
    expect(getEndOptions(monday(10), occupied, 22)).toEqual([]);
  });
});

describe('formatage', () => {
  it('formatTime affiche HH:MM', () => {
    expect(formatTime(monday(9, 5))).toBe('09:05');
  });

  it('formatDayLabel affiche le jour en français', () => {
    expect(formatDayLabel(monday(0))).toBe('lun. 11 mai');
  });

  it('formatRange combine jour et horaires', () => {
    expect(formatRange(monday(10), monday(12))).toBe('lun. 11 mai, 10:00 – 12:00');
  });

  it('addMinutes et addDays décalent correctement', () => {
    expect(formatTime(addMinutes(monday(10), 30))).toBe('10:30');
    expect(addDays(monday(0), 2).getDate()).toBe(13);
  });
});
