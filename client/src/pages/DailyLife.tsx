import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CalendarSearch, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { usePublic } from '@/hooks/usePublic';
import type { DailyActivity, Paged } from '@/lib/types';
import { DAILY_CATEGORIES } from '@/lib/constants';
import { formatDate, formatDateShort, relativeDay } from '@/lib/format';
import { Button } from '@/components/Button';
import { DailyEntry } from '@/components/DailyEntry';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState, FilterChips } from '@/components/States';

export default function DailyLife() {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const { data: dates } = usePublic<{ items: { date: string; count: number }[] }>('/daily/dates');

  const query = useInfiniteQuery({
    queryKey: ['public', 'daily', category, date],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const p = new URLSearchParams({ page: String(pageParam), limit: '6' });
      if (category) p.set('category', category);
      if (date) p.set('date', date);
      return api<Paged<DailyActivity>>(`/public/daily?${p}`, { signal });
    },
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const groups = useMemo(() => {
    const map = new Map<string, DailyActivity[]>();
    items.forEach((i) => map.set(i.date, [...(map.get(i.date) ?? []), i]));
    return [...map.entries()];
  }, [items]);

  return (
    <>
      <Seo title="Մեր առօրյան" description="Տեսեք, թե ինչով են զբաղվում մեր փոքրիկներն ամեն օր՝ լուսանկարներ և տեսանյութեր։" />
      <PageHero eyebrow="Մեր առօրյան" title="Ամեն օրը՝ նոր բացահայտում" description="Այստեղ մեր դաստիարակները կիսվում են երեխաների առօրյայով՝ խաղեր, ստեղծագործություն, զբոսանքներ և ուսուցում։" />

      <section className="container-x pb-10">
        <div className="space-y-5">
          <FilterChips
            label="Կատեգորիաներ"
            value={category}
            onChange={setCategory}
            options={[{ value: '', label: 'Բոլորը' }, ...Object.entries(DAILY_CATEGORIES).map(([value, label]) => ({ value, label }))]}
          />
          {!!dates?.items.length && (
            <div className="card flex items-center gap-3 p-2.5">
              <span className="hidden shrink-0 items-center gap-2 pl-3 text-sm font-bold text-ink-soft sm:flex">
                <CalendarSearch className="h-4 w-4 text-sun-500" /> Ըստ օրվա
              </span>
              <div className="flex flex-1 gap-2 overflow-x-auto [scrollbar-width:thin]" role="group" aria-label="Ընտրել օրը">
                {dates.items.slice(0, 30).map((d) => {
                  const s = formatDateShort(d.date);
                  const active = date === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setDate(active ? '' : d.date)}
                      aria-pressed={active}
                      title={formatDate(d.date)}
                      className={clsx(
                        'flex w-16 shrink-0 flex-col items-center rounded-2xl py-2 transition',
                        active ? 'bg-sun-400 text-ink shadow-soft' : 'hover:bg-sun-50',
                      )}
                    >
                      <span className="font-display text-lg leading-none font-semibold">{s.day}</span>
                      <span className="text-[11px] font-bold text-ink-muted uppercase">{s.month}</span>
                    </button>
                  );
                })}
              </div>
              <label className="relative shrink-0">
                <span className="sr-only">Ընտրել ամսաթիվ</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-40 rounded-2xl bg-cream-100 px-3 py-2.5 text-sm font-semibold ring-1 ring-ink/5 focus:ring-2 focus:ring-sun-400 focus:outline-none"
                />
              </label>
            </div>
          )}
          {date && (
            <div className="flex justify-center">
              <button onClick={() => setDate('')} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
                {formatDate(date)} <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="container-x">
        {query.isLoading && <CardGridSkeleton count={2} className="mx-auto grid max-w-4xl gap-8" item="h-[28rem]" />}
        {query.isError && <ErrorState onRetry={() => query.refetch()} />}
        {!query.isLoading && !query.isError && items.length === 0 && (
          <EmptyState
            title="Այս օրվա համար դեռ գրառումներ չկան"
            text="Փորձեք ընտրել այլ օր կամ կատեգորիա։ Մեր դաստիարակները պարբերաբար ավելացնում են նոր լուսանկարներ։"
            action={
              (category || date) && (
                <Button variant="secondary" onClick={() => (setCategory(''), setDate(''))}>
                  Ցույց տալ բոլորը
                </Button>
              )
            }
          />
        )}
        <div className="mx-auto max-w-4xl space-y-14">
          {groups.map(([d, list]) => (
            <div key={d}>
              <h2 className="sticky top-24 z-10 mb-5 inline-flex items-center gap-2 rounded-full bg-cream/90 py-1.5 pr-4 pl-1 font-sans text-sm font-bold text-ink-soft backdrop-blur">
                <span className="rounded-full bg-sun-200 px-3 py-1 text-ink">{relativeDay(d)}</span>
                {formatDate(d)}
              </h2>
              <div className="space-y-8">
                {list.map((item) => (
                  <DailyEntry key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {query.hasNextPage && (
          <div className="mt-12 text-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              icon={query.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              Բեռնել ավելին
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
