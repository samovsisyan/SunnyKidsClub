import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import type { DailyActivity, Media } from '@/lib/types';
import { CATEGORY_TONE, DAILY_CATEGORIES } from '@/lib/constants';
import { formatDate, relativeDay } from '@/lib/format';
import { Lightbox } from './Lightbox';
import { MediaTile } from './Media';

/** Photo/video grid that adapts to the number of items. */
export function MediaMosaic({ media, max = 5 }: { media: Media[]; max?: number }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!media.length) return null;
  const shown = media.slice(0, max);
  const extra = media.length - shown.length;
  const n = shown.length;
  return (
    <>
      <div
        className={clsx(
          'grid gap-2.5 sm:gap-3',
          n === 1 && 'grid-cols-1',
          n === 2 && 'grid-cols-2',
          n === 3 && 'grid-cols-2 sm:grid-cols-3',
          n >= 4 && 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {shown.map((m, i) => (
          <div
            key={m.id}
            className={clsx(
              'relative',
              n === 1 && 'aspect-[16/9]',
              n === 2 && 'aspect-[4/3]',
              n === 3 && (i === 0 ? 'col-span-2 aspect-[16/10] sm:col-span-1 sm:aspect-[3/4]' : 'aspect-[4/3] sm:aspect-[3/4]'),
              n >= 4 && (i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'),
            )}
          >
            <MediaTile media={m} aspect="h-full" onOpen={() => setIndex(i)} className="!rounded-2xl" />
            {extra > 0 && i === n - 1 && (
              <button
                onClick={() => setIndex(i)}
                className="absolute inset-0 grid place-items-center rounded-2xl bg-ink/50 font-display text-2xl font-semibold text-white backdrop-blur-[2px]"
              >
                +{extra}
              </button>
            )}
          </div>
        ))}
      </div>
      <Lightbox items={media} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  );
}

export function CategoryChip({ category, labels = DAILY_CATEGORIES }: { category: string; labels?: Record<string, string> }) {
  return <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-bold', CATEGORY_TONE[category] ?? 'bg-cream-200 text-ink-soft')}>{labels[category] ?? category}</span>;
}

export function DailyEntry({ item, featured }: { item: DailyActivity; featured?: boolean }) {
  const photos = item.media.filter((m) => m.type === 'IMAGE').length;
  const videos = item.media.length - photos;
  return (
    <article className={clsx('card overflow-hidden p-4 sm:p-6', featured && 'lg:p-8')}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 px-1">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5 font-bold text-ink-soft">
              <CalendarDays className="h-4 w-4 text-sun-500" />
              <time dateTime={item.date}>{formatDate(item.date)}</time>
            </span>
            <span aria-hidden>·</span>
            <span>{relativeDay(item.date)}</span>
          </div>
          <h3 className={clsx('font-semibold', featured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl')}>{item.title}</h3>
        </div>
        <CategoryChip category={item.category} />
      </header>
      {item.description && <p className={clsx('mb-5 px-1 text-ink-soft', featured && 'text-lg')}>«{item.description}»</p>}
      <MediaMosaic media={item.media} max={featured ? 5 : 4} />
      {item.media.length > 0 && (
        <p className="mt-4 px-1 text-xs font-semibold text-ink-muted">
          {photos > 0 && `${photos} լուսանկար`}
          {photos > 0 && videos > 0 && ' · '}
          {videos > 0 && `${videos} տեսանյութ`}
        </p>
      )}
    </article>
  );
}
