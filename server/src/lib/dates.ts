import { config } from '../config.js';

/** Today's date in the kindergarten's timezone, as a UTC-midnight Date (matches @db.Date columns). */
export function today(): Date {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return new Date(`${s}T00:00:00.000Z`);
}

export const toDateString = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

export function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 3600 * 1000);
}
