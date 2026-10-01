export const MONTHS = ['Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս', 'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր'];
export const MONTHS_SHORT = ['Հնվ', 'Փտր', 'Մրտ', 'Ապր', 'Մյս', 'Հնս', 'Հլս', 'Օգս', 'Սեպ', 'Հոկ', 'Նոյ', 'Դեկ'];
export const WEEKDAYS = ['Կիրակի', 'Երկուշաբթի', 'Երեքշաբթի', 'Չորեքշաբթի', 'Հինգշաբթի', 'Ուրբաթ', 'Շաբաթ'];

const parts = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
};

/** "01 Հոկտեմբեր, 2026" */
export function formatDate(iso?: string | null) {
  if (!iso) return '';
  const { y, m, d } = parts(iso);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]}, ${y}`;
}

export function formatDateShort(iso?: string | null) {
  if (!iso) return { day: '', month: '' };
  const { m, d } = parts(iso);
  return { day: String(d).padStart(2, '0'), month: MONTHS_SHORT[m - 1] };
}

export function weekdayName(iso: string) {
  const { y, m, d } = parts(iso);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function todayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function relativeDay(iso: string) {
  const t = todayIso();
  if (iso === t) return 'Այսօր';
  const y = new Date(`${t}T00:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  if (iso === y.toISOString().slice(0, 10)) return 'Երեկ';
  return weekdayName(iso);
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yerevan', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  return `${formatDate(day)}, ${d.toLocaleTimeString('hy-AM', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Yerevan' })}`;
}

export function formatBytes(n?: number | null) {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} ԿԲ`;
  return `${(n / 1024 / 1024).toFixed(1)} ՄԲ`;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
export const whatsappHref = (v: string) => (v.startsWith('http') ? v : `https://wa.me/${v.replace(/\D/g, '')}`);
export const socialHref = (v: string, base: string) => (v.startsWith('http') ? v : `${base}${v.replace(/^@/, '')}`);
