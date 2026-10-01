import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Camera, Film, Gift, Images, Lock, Mail, PartyPopper, Plus, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { ContactMessage, DailyActivity, EventItem } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { MediaImage } from '@/components/Media';
import { useAdmin } from '../api';
import { useAuth } from '../store/auth';
import { Badge, EmptyBox, ErrorBox, LoadingBlock, Panel } from '../components/ui';

interface Stats {
  counts: Record<'newPhotos' | 'newVideos' | 'totalPhotos' | 'totalVideos' | 'privateMedia' | 'upcomingEvents' | 'activePromotions' | 'unreadMessages' | 'dailyPublished' | 'dailyDrafts', number>;
  recentMessages: ContactMessage[];
  recentDaily: DailyActivity[];
  nextEvents: EventItem[];
}

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const { data, isLoading, isError, refetch } = useAdmin<Stats>('/stats');
  if (isLoading) return <LoadingBlock />;
  if (isError || !data) return <ErrorBox onRetry={() => refetch()} />;
  const c = data.counts;

  const cards = [
    { label: 'Նոր լուսանկարներ', value: c.newPhotos, hint: `վերջին 7 օրում · ընդամենը ${c.totalPhotos}`, icon: Camera, tone: 'bg-sun-100 text-sun-700', to: '/admin/photos' },
    { label: 'Նոր տեսանյութեր', value: c.newVideos, hint: `վերջին 7 օրում · ընդամենը ${c.totalVideos}`, icon: Film, tone: 'bg-sky-100 text-sky-700', to: '/admin/videos' },
    { label: 'Առաջիկա միջոցառումներ', value: c.upcomingEvents, hint: 'հրապարակված և պլանավորված', icon: PartyPopper, tone: 'bg-blush-100 text-blush-500', to: '/admin/events' },
    { label: 'Ակտիվ ակցիաներ', value: c.activePromotions, hint: 'ցուցադրվում են կայքում', icon: Gift, tone: 'bg-peach-100 text-peach-600', to: '/admin/promotions' },
    { label: 'Նոր հաղորդագրություններ', value: c.unreadMessages, hint: 'չկարդացված', icon: Mail, tone: 'bg-leaf-100 text-leaf-700', to: '/admin/messages' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-sun-200 via-sun-100 to-peach-100 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Բարի օր{user?.name ? `, ${user.name}` : ''} ☀️</h1>
          <p className="mt-1 text-ink-soft">Ի՞նչ նոր բան է եղել այսօր։ Կիսվեք ծնողների հետ։</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/daily?new=1" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-ink/90">
            <Plus className="h-4 w-4" /> Այսօրվա առօրյան
          </Link>
          <Link to="/admin/photos" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold shadow-soft hover:bg-white/80">
            <Upload className="h-4 w-4" /> Վերբեռնել
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((k) => (
          <Link key={k.label} to={k.to} className="group rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-card">
            <span className={clsx('grid h-11 w-11 place-items-center rounded-2xl', k.tone)}>
              <k.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-semibold">{k.value}</p>
            <p className="mt-0.5 text-sm font-bold">{k.label}</p>
            <p className="text-xs text-ink-muted">{k.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Մեր առօրյան — վերջին գրառումները"
          description={`${c.dailyPublished} հրապարակված · ${c.dailyDrafts} սևագիր`}
          actions={
            <Link to="/admin/daily" className="inline-flex items-center gap-1 text-sm font-bold text-sky-600">
              Բոլորը <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {data.recentDaily.length ? (
            <ul className="divide-y divide-ink/5">
              {data.recentDaily.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <MediaImage media={d.media[0]} className="h-12 w-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{d.title}</p>
                    <p className="text-xs text-ink-muted">
                      {formatDate(d.date)} · <Images className="inline h-3 w-3" /> {d.media.length}
                    </p>
                  </div>
                  {d.status === 'PUBLISHED' ? <Badge tone="green">Հրապարակված</Badge> : <Badge tone="yellow">Սևագիր</Badge>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBox title="Գրառումներ դեռ չկան" />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Հաղորդագրություններ"
            actions={
              <Link to="/admin/messages" className="inline-flex items-center gap-1 text-sm font-bold text-sky-600">
                Բոլորը <ArrowRight className="h-4 w-4" />
              </Link>
            }
          >
            {data.recentMessages.length ? (
              <ul className="space-y-2">
                {data.recentMessages.map((m) => (
                  <li key={m.id} className={clsx('rounded-2xl p-3', m.read ? 'bg-cream-100/60' : 'bg-leaf-50 ring-1 ring-leaf-200')}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">{m.name}</p>
                      {m.type === 'ENROLLMENT' && <Badge tone="yellow">Գրանցում</Badge>}
                    </div>
                    <p className="truncate text-sm text-ink-soft">{m.message || m.phone}</p>
                    <p className="text-xs text-ink-muted">{formatDateTime(m.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Նոր հաղորդագրություններ չկան։</p>
            )}
          </Panel>
          <Panel title="Առաջիկա միջոցառումներ">
            {data.nextEvents.length ? (
              <ul className="space-y-2">
                {data.nextEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blush-100 text-blush-500">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-bold">{e.title}</span>
                      <span className="text-xs text-ink-muted">
                        {formatDate(e.date)} {e.time}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Առաջիկա միջոցառումներ չկան։</p>
            )}
          </Panel>
          {c.privateMedia > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft ring-1 ring-ink/5">
              <Lock className="h-4 w-4 text-ink-muted" /> {c.privateMedia} ֆայլ նշված է որպես փակ և չի երևում կայքում։
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
