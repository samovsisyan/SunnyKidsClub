import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { usePublic } from '@/hooks/usePublic';
import type { EventItem } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { InfoPill } from '@/components/Cards';
import { MediaMosaic } from '@/components/DailyEntry';
import { MediaImage } from '@/components/Media';
import { Seo } from '@/components/Seo';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { LinkButton } from '@/components/Button';
import { ApiError } from '@/lib/api';

export default function EventDetail() {
  const { slug } = useParams();
  const { data: e, isLoading, isError, error, refetch } = usePublic<EventItem>(`/events/${slug}`, { retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2 });
  const done = e?.status === 'COMPLETED';

  return (
    <div className="pt-28 sm:pt-36">
      <div className="container-x max-w-5xl">
        <Link to="/events" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink-soft transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Բոլոր միջոցառումները
        </Link>
        {isLoading && <Skeleton className="aspect-[16/8] w-full" />}
        {isError &&
          (error instanceof ApiError && error.status === 404 ? (
            <EmptyState title="Միջոցառումը չի գտնվել" action={<LinkButton to="/events">Վերադառնալ</LinkButton>} />
          ) : (
            <ErrorState onRetry={() => refetch()} />
          ))}
        {e && (
          <article>
            <Seo title={e.title} description={e.description.slice(0, 160)} image={e.cover?.thumbUrl} />
            <MediaImage media={e.cover} variant="full" eager className="aspect-[16/9] rounded-[2rem] shadow-card sm:aspect-[16/8]" />
            <div className="mx-auto max-w-3xl py-10">
              <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-bold', done ? 'bg-ink/10 text-ink-soft' : 'bg-leaf-100 text-leaf-700')}>{done ? 'Ավարտված' : 'Առաջիկա'}</span>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{e.title}</h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <InfoPill icon={<CalendarDays className="h-4 w-4 text-sun-500" />}>{formatDate(e.date)}</InfoPill>
                {e.time && <InfoPill icon={<Clock className="h-4 w-4 text-sky-500" />}>{e.time}</InfoPill>}
                {e.location && <InfoPill icon={<MapPin className="h-4 w-4 text-leaf-500" />}>{e.location}</InfoPill>}
              </div>
              <p className="mt-8 text-lg leading-relaxed whitespace-pre-line text-ink-soft">{e.description}</p>
            </div>
            {e.media.length > 0 && (
              <section className="pb-8">
                <h2 className="mb-6 text-2xl font-semibold">Լուսանկարներ և տեսանյութեր</h2>
                <MediaMosaic media={e.media} max={12} />
              </section>
            )}
            {!done && (
              <div className="mt-6 rounded-[2rem] bg-sun-100 p-8 text-center">
                <p className="font-display text-xl font-semibold">Հարցեր ունե՞ք միջոցառման վերաբերյալ</p>
                <LinkButton to="/contact" variant="dark" className="mt-4">
                  Կապվել մեզ հետ
                </LinkButton>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
