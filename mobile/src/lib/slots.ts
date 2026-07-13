/**
 * Logique pure de calcul des créneaux de réservation (pas de 30 minutes).
 * Fonctions sans effet de bord, testées exhaustivement (voir __tests__/slots.test.ts).
 * Les règles reflètent celles de l'API : durée 30 min – 8 h, alignement 30 min.
 */

export const SLOT_STEP_MINUTES = 30;
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 8 * 60;
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 22;

export interface TimeRange {
  startsAt: Date;
  endsAt: Date;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Lundi 00:00 (heure locale) de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

/** Les 7 jours (lundi → dimanche) de la semaine contenant `anchor`. */
export function getWeekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Débuts de créneaux d'une journée (heure locale), aux heures d'ouverture. */
export function generateDaySlots(
  day: Date,
  openingHour: number = OPENING_HOUR,
  closingHour: number = CLOSING_HOUR,
): Date[] {
  const slots: Date[] = [];
  const start = new Date(day);
  start.setHours(openingHour, 0, 0, 0);
  const end = new Date(day);
  end.setHours(closingHour, 0, 0, 0);
  for (let t = start; t < end; t = addMinutes(t, SLOT_STEP_MINUTES)) {
    slots.push(new Date(t));
  }
  return slots;
}

/** Vrai si les deux périodes se chevauchent (bornes exclusives). */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Vrai si le créneau de 30 min débutant à `slotStart` est libre. */
export function isSlotFree(slotStart: Date, occupied: TimeRange[]): boolean {
  const slotEnd = addMinutes(slotStart, SLOT_STEP_MINUTES);
  return !occupied.some((range) => overlaps(slotStart, slotEnd, range.startsAt, range.endsAt));
}

/** Vrai si le créneau est dans le passé (non réservable). */
export function isSlotPast(slotStart: Date, now: Date = new Date()): boolean {
  return slotStart.getTime() <= now.getTime();
}

/**
 * Fins possibles pour une réservation débutant à `start` : heures alignées,
 * consécutivement libres, durée entre 30 min et 8 h, avant la fermeture.
 */
export function getEndOptions(
  start: Date,
  occupied: TimeRange[],
  closingHour: number = CLOSING_HOUR,
): Date[] {
  const options: Date[] = [];
  const close = new Date(start);
  close.setHours(closingHour, 0, 0, 0);

  let cursor = new Date(start);
  while (true) {
    const next = addMinutes(cursor, SLOT_STEP_MINUTES);
    const duration = (next.getTime() - start.getTime()) / (60 * 1000);
    if (next > close || duration > MAX_DURATION_MINUTES) {
      break;
    }
    // Le segment [cursor, next] doit être libre pour prolonger la réservation
    if (!isSlotFree(cursor, occupied)) {
      break;
    }
    options.push(next);
    cursor = next;
  }
  return options;
}

/** 'HH:MM' en heure locale. */
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const DAY_LABELS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTH_LABELS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** 'lun. 12 mai' en heure locale. */
export function formatDayLabel(date: Date): string {
  return `${DAY_LABELS[date.getDay()]} ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
}

/** 'lun. 12 mai, 10:00 – 12:00'. */
export function formatRange(startsAt: Date, endsAt: Date): string {
  return `${formatDayLabel(startsAt)}, ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}
