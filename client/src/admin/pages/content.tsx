import { CalendarDays, Clock, Images } from 'lucide-react';
import type { Media } from '@/lib/types';
import { DAILY_CATEGORIES } from '@/lib/constants';
import { formatDate, todayIso } from '@/lib/format';
import { CrudPage, publishedBadge, type CrudConfig } from '../components/CrudPage';
import { Badge } from '../components/ui';

/** Gallery category for media uploaded from a daily-life entry. */
const DAILY_TO_MEDIA: Record<string, string> = { GAMES: 'GAMES', CREATIVE: 'DAILY', WALKS: 'WALKS', LEARNING: 'DAILY', EVENTS: 'EVENTS' };
const mediaCount = (list: unknown) => {
  const m = (list as Media[]) ?? [];
  const v = m.filter((x) => x.type === 'VIDEO').length;
  return `${m.length - v} լուսանկար${v ? ` · ${v} տեսանյութ` : ''}`;
};
const privacyHint = 'Մի՛ նշեք երեխաների անուն-ազգանունները նկարագրություններում։';

export function DailyAdmin() {
  const config: CrudConfig = {
    endpoint: '/daily',
    title: 'Մեր առօրյան',
    description: 'Կիսվեք երեխաների ամենօրյա զբաղմունքներով։ Հրապարակված գրառումներն անմիջապես երևում են կայքի «Մեր առօրյան» բաժնում։',
    singular: 'գրառում',
    addLabel: 'Նոր գրառում',
    modalSize: 'lg',
    defaults: () => ({ date: todayIso(), category: 'CREATIVE', status: 'PUBLISHED', media: [] }),
    fields: [
      { name: 'title', label: 'Վերնագիր', type: 'text', required: true, placeholder: 'Օր.՝ Աշնանային ստեղծագործություն' },
      { name: 'date', label: 'Ամսաթիվ', type: 'date', required: true, half: true },
      { name: 'category', label: 'Կատեգորիա', type: 'select', options: DAILY_CATEGORIES, half: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 3, placeholder: 'Այսօր մեր փոքրիկները…', help: privacyHint },
      {
        name: 'media',
        label: 'Լուսանկարներ և տեսանյութեր',
        type: 'mediaList',
        help: 'Կարող եք քաշել նկարները՝ հերթականությունը փոխելու համար։',
        uploadDefaults: (f) => ({ category: DAILY_TO_MEDIA[f.category as string] ?? 'DAILY', takenAt: f.date as string }),
      },
      { name: 'status', label: 'Կարգավիճակ', type: 'select', options: { PUBLISHED: 'Հրապարակված', DRAFT: 'Սևագիր' }, half: true },
    ],
    filters: [
      { label: 'Հրապարակված', value: 'pub', test: (i) => i.status === 'PUBLISHED' },
      { label: 'Սևագրեր', value: 'draft', test: (i) => i.status === 'DRAFT' },
    ],
    row: (i) => ({
      title: i.title as string,
      media: (i.media as Media[])[0] ?? null,
      subtitle: (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(i.date as string)} · {mediaCount(i.media)}
        </span>
      ),
      badges: (
        <>
          {i.status === 'PUBLISHED' ? <Badge tone="green">Հրապարակված</Badge> : <Badge tone="yellow">Սևագիր</Badge>}
          <Badge tone="blue">{DAILY_CATEGORIES[i.category as string]}</Badge>
        </>
      ),
    }),
    emptyTitle: 'Դեռ գրառումներ չկան',
    emptyText: 'Ստեղծեք առաջին գրառումը և ավելացրեք օրվա լուսանկարներն ու տեսանյութերը։',
  };
  return <CrudPage config={config} />;
}

export function EventsAdmin() {
  const config: CrudConfig = {
    endpoint: '/events',
    title: 'Միջոցառումներ',
    description: 'Առաջիկա և ավարտված միջոցառումներ։ Անցած ամսաթվով միջոցառումները ավտոմատ ցուցադրվում են որպես «Ավարտված»։',
    singular: 'միջոցառում',
    addLabel: 'Նոր միջոցառում',
    modalSize: 'lg',
    defaults: () => ({ date: todayIso(), status: 'UPCOMING', published: true, time: '11:00', location: 'Sunny Kids Club', media: [] }),
    fields: [
      { name: 'title', label: 'Անվանում', type: 'text', required: true },
      { name: 'date', label: 'Ամսաթիվ', type: 'date', required: true, half: true },
      { name: 'time', label: 'Ժամ', type: 'time', half: true },
      { name: 'location', label: 'Վայր', type: 'text', half: true },
      { name: 'status', label: 'Կարգավիճակ', type: 'select', options: { UPCOMING: 'Առաջիկա', COMPLETED: 'Ավարտված' }, half: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 5 },
      { name: 'cover', label: 'Շապիկի նկար', type: 'media', uploadDefaults: (f) => ({ category: 'EVENTS', takenAt: f.date as string, inGallery: false }) },
      { name: 'media', label: 'Պատկերասրահ և տեսանյութեր', type: 'mediaList', uploadDefaults: (f) => ({ category: 'EVENTS', takenAt: f.date as string }) },
      { name: 'published', label: 'Ցուցադրել կայքում', type: 'toggle' },
    ],
    toggleField: 'published',
    filters: [
      { label: 'Առաջիկա', value: 'up', test: (i) => i.effectiveStatus === 'UPCOMING' },
      { label: 'Ավարտված', value: 'done', test: (i) => i.effectiveStatus === 'COMPLETED' },
    ],
    row: (i) => ({
      title: i.title as string,
      media: (i.cover as Media) ?? null,
      subtitle: (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(i.date as string)} {i.time ? `· ${i.time}` : ''}
        </span>
      ),
      badges: (
        <>
          {i.effectiveStatus === 'UPCOMING' ? <Badge tone="blue">Առաջիկա</Badge> : <Badge tone="gray">Ավարտված</Badge>}
          {publishedBadge(i.published)}
          {!!(i.media as Media[]).length && <Badge icon={<Images className="h-3 w-3" />}>{(i.media as Media[]).length}</Badge>}
        </>
      ),
    }),
  };
  return <CrudPage config={config} />;
}

export function PromotionsAdmin() {
  const config: CrudConfig = {
    endpoint: '/promotions',
    title: 'Ակցիաներ',
    description: 'Կայքում ցուցադրվում են միայն ակտիվ ակցիաները՝ սկզբի և ավարտի ամսաթվերի միջակայքում։ Ժամկետանց ակցիաները ավտոմատ թաքցվում են։',
    singular: 'ակցիա',
    addLabel: 'Նոր ակցիա',
    reorderable: true,
    toggleField: 'active',
    defaults: () => ({ active: true, ctaLabel: 'Գրանցվել', ctaUrl: '/enroll', startDate: todayIso() }),
    fields: [
      { name: 'title', label: 'Վերնագիր', type: 'text', required: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 3 },
      { name: 'startDate', label: 'Սկիզբ', type: 'date', half: true },
      { name: 'endDate', label: 'Ավարտ', type: 'date', half: true, help: 'Դատարկ թողնելու դեպքում ակցիան անժամկետ է։' },
      { name: 'ctaLabel', label: 'Կոճակի տեքստ', type: 'text', half: true },
      { name: 'ctaUrl', label: 'Կոճակի հղում', type: 'url', half: true, help: 'Օր.՝ /enroll, /contact կամ https://…' },
      { name: 'image', label: 'Նկար', type: 'media', uploadDefaults: () => ({ category: 'OTHER', inGallery: false }) },
      { name: 'active', label: 'Ակտիվ', type: 'toggle' },
    ],
    row: (i) => ({
      title: i.title as string,
      media: (i.image as Media) ?? null,
      subtitle: [i.startDate && `${formatDate(i.startDate as string)}`, i.endDate && `մինչև ${formatDate(i.endDate as string)}`].filter(Boolean).join(' — ') || 'Անժամկետ',
      badges: i.live ? (
        <Badge tone="green">Ցուցադրվում է</Badge>
      ) : i.expired ? (
        <Badge tone="red">Ժամկետանց</Badge>
      ) : i.scheduled ? (
        <Badge tone="yellow">Դեռ չի սկսվել</Badge>
      ) : (
        <Badge>Ապաակտիվացված</Badge>
      ),
    }),
  };
  return <CrudPage config={config} />;
}

export function ActivitiesAdmin() {
  const config: CrudConfig = {
    endpoint: '/activities',
    title: 'Զբաղմունքներ',
    description: '«Մեր զբաղմունքները» բաժնի քարտերը։ Հերթականությունը փոխելու համար օգտագործեք սլաքները։',
    singular: 'զբաղմունք',
    reorderable: true,
    toggleField: 'published',
    defaults: () => ({ published: true, icon: 'palette' }),
    fields: [
      { name: 'title', label: 'Անվանում', type: 'text', required: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 3 },
      { name: 'icon', label: 'Պատկերակ', type: 'icon' },
      { name: 'image', label: 'Նկար', type: 'media', uploadDefaults: () => ({ category: 'DAILY', inGallery: false }) },
      { name: 'published', label: 'Ցուցադրել կայքում', type: 'toggle' },
    ],
    row: (i) => ({ title: i.title as string, subtitle: i.description as string, media: (i.image as Media) ?? null, badges: publishedBadge(i.published) }),
  };
  return <CrudPage config={config} />;
}

export function ScheduleAdmin() {
  const config: CrudConfig = {
    endpoint: '/schedule',
    title: 'Օրվա ռեժիմ',
    description: 'Ավելացրեք, խմբագրեք կամ փոխեք կետերի հերթականությունը։ Թաքցված կետերը չեն երևում կայքում։',
    singular: 'կետ',
    addLabel: 'Ավելացնել կետ',
    reorderable: true,
    toggleField: 'published',
    defaults: () => ({ published: true, time: '09:00' }),
    fields: [
      { name: 'time', label: 'Ժամ', type: 'time', required: true, half: true },
      { name: 'title', label: 'Անվանում', type: 'text', required: true, half: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 2 },
      { name: 'published', label: 'Ցուցադրել կայքում', type: 'toggle' },
    ],
    row: (i) => ({
      title: i.title as string,
      subtitle: i.description as string,
      extra: (
        <span className="inline-flex h-11 min-w-16 items-center justify-center gap-1 rounded-xl bg-sky-100 px-2 font-display font-semibold text-sky-700">
          <Clock className="h-3.5 w-3.5" />
          {i.time as string}
        </span>
      ),
      badges: publishedBadge(i.published),
    }),
  };
  return <CrudPage config={config} />;
}

export function TestimonialsAdmin() {
  const config: CrudConfig = {
    endpoint: '/testimonials',
    title: 'Ծնողների կարծիքներ',
    description: 'Հրապարակեք միայն իրական ծնողների կարծիքները՝ նրանց համաձայնությամբ։ «Օրինակ» նշված կարծիքները ցուցադրվում են միայն մշակման ռեժիմում և երբեք՝ իրական կայքում։',
    singular: 'կարծիք',
    reorderable: true,
    toggleField: 'published',
    defaults: () => ({ published: false }),
    fields: [
      { name: 'parentName', label: 'Ծնողի անունը', type: 'text', required: true, half: true, help: 'Օր.՝ Անի Մ. — խորհուրդ է տրվում չնշել լրիվ ազգանունը' },
      { name: 'relation', label: 'Լրացուցիչ', type: 'text', half: true, placeholder: 'Օր.՝ Ավագ խումբ' },
      { name: 'comment', label: 'Կարծիք', type: 'textarea', required: true, rows: 4 },
      { name: 'photo', label: 'Լուսանկար (ոչ պարտադիր)', type: 'media', uploadDefaults: () => ({ category: 'OTHER', inGallery: false }) },
      { name: 'published', label: 'Հրապարակել', type: 'toggle' },
    ],
    row: (i) => ({
      title: i.parentName as string,
      subtitle: `«${i.comment as string}»`,
      media: (i.photo as Media) ?? null,
      badges: (
        <>
          {publishedBadge(i.published)}
          {!!i.isPlaceholder && <Badge tone="pink">Օրինակ (մշակման համար)</Badge>}
        </>
      ),
    }),
  };
  return <CrudPage config={config} />;
}

export function FaqAdmin() {
  const config: CrudConfig = {
    endpoint: '/faq',
    title: 'Հաճախ տրվող հարցեր',
    description: 'Հարցերը ցուցադրվում են «Ծնողների համար» էջում։',
    singular: 'հարց',
    addLabel: 'Նոր հարց',
    reorderable: true,
    toggleField: 'published',
    defaults: () => ({ published: true }),
    fields: [
      { name: 'question', label: 'Հարց', type: 'text', required: true },
      { name: 'answer', label: 'Պատասխան', type: 'textarea', required: true, rows: 5 },
      { name: 'published', label: 'Ցուցադրել կայքում', type: 'toggle' },
    ],
    row: (i) => ({ title: i.question as string, subtitle: i.answer as string, badges: publishedBadge(i.published) }),
  };
  return <CrudPage config={config} />;
}

export function SpacesAdmin() {
  const config: CrudConfig = {
    endpoint: '/spaces',
    title: 'Մեր միջավայրը',
    description: 'Խմբասենյակներ, խաղասենյակներ, բակ և այլ տարածքներ։ Յուրաքանչյուր տարածքի համար կարող եք ավելացնել մի քանի լուսանկար։',
    singular: 'տարածք',
    reorderable: true,
    toggleField: 'published',
    modalSize: 'lg',
    defaults: () => ({ published: true, media: [] }),
    fields: [
      { name: 'title', label: 'Անվանում', type: 'text', required: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 2 },
      { name: 'cover', label: 'Գլխավոր նկար', type: 'media', uploadDefaults: () => ({ category: 'ROOMS' }) },
      { name: 'media', label: 'Լրացուցիչ լուսանկարներ', type: 'mediaList', uploadDefaults: () => ({ category: 'ROOMS' }) },
      { name: 'published', label: 'Ցուցադրել կայքում', type: 'toggle' },
    ],
    row: (i) => ({ title: i.title as string, subtitle: i.description as string, media: (i.cover as Media) ?? null, badges: <>{publishedBadge(i.published)}<Badge icon={<Images className="h-3 w-3" />}>{(i.media as Media[]).length + (i.cover ? 1 : 0)}</Badge></> }),
  };
  return <CrudPage config={config} />;
}

export function MealsCrud() {
  const config: CrudConfig = {
    endpoint: '/meals',
    title: 'Սնունդ',
    description: 'Սննդի քարտերը (նախաճաշ, ճաշ, խորտիկ, ընթրիք), շաբաթվա ճաշացանկը և բաժնի տեքստերը։',
    singular: 'սննդի քարտ',
    reorderable: true,
    toggleField: 'published',
    defaults: () => ({ published: true, type: 'BREAKFAST' }),
    fields: [
      { name: 'type', label: 'Տեսակ', type: 'select', options: { BREAKFAST: 'Նախաճաշ', LUNCH: 'Ճաշ', SNACK: 'Խորտիկ', DINNER: 'Ընթրիք' }, half: true },
      { name: 'time', label: 'Ժամ', type: 'time', half: true },
      { name: 'title', label: 'Անվանում', type: 'text', required: true },
      { name: 'description', label: 'Նկարագրություն', type: 'textarea', rows: 3 },
      { name: 'image', label: 'Նկար', type: 'media', uploadDefaults: () => ({ category: 'FOOD', inGallery: false }) },
      { name: 'published', label: 'Ցուցադրել կայքում', type: 'toggle' },
    ],
    row: (i) => ({ title: i.title as string, subtitle: `${i.time ?? ''} ${i.description ?? ''}`, media: (i.image as Media) ?? null, badges: publishedBadge(i.published) }),
  };
  return <CrudPage config={config} />;
}

