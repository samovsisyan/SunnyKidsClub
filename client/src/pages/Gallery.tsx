import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Media, Paged } from '@/lib/types';
import { GALLERY_FILTERS, MEDIA_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/Button';
import { Lightbox } from '@/components/Lightbox';
import { MediaTile } from '@/components/Media';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState, FilterChips } from '@/components/States';

/** Height variation for a natural masonry rhythm (uses real aspect ratio when known). */
const aspectFor = (m: Media, i: number) => {
  if (m.width && m.height && m.type === 'IMAGE') return `${m.width} / ${m.height}`;
  return ['4 / 5', '4 / 3', '1 / 1', '3 / 4', '16 / 10'][i % 5];
};

export default function Gallery() {
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [index, setIndex] = useState<number | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['public', 'gallery', category, type],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const p = new URLSearchParams({ page: String(pageParam), limit: '24' });
      if (category) p.set('category', category);
      if (type) p.set('type', type);
      return api<Paged<Media>>(`/public/gallery?${p}`, { signal });
    },
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  return (
    <>
      <Seo title="Պատկերասրահ" description="Լուսանկարներ և տեսանյութեր մեր մանկապարտեզի կյանքից։" />
      <PageHero tone="sky" eyebrow="Պատկերասրահ" title="Մեր ջերմ պահերը" description="Լուսանկարներ և տեսանյութեր՝ առօրյայից, տոներից, զբոսանքներից և մեր խմբասենյակներից։" />
      <section className="container-x">
        <div className="mb-10 space-y-4">
          <FilterChips
            label="Կատեգորիաներ"
            value={category}
            onChange={setCategory}
            options={[{ value: '', label: 'Բոլորը' }, ...GALLERY_FILTERS.map((c) => ({ value: c, label: MEDIA_CATEGORIES[c] }))]}
          />
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-ink/8" role="group" aria-label="Տեսակ">
              {[
                ['', 'Բոլորը'],
                ['IMAGE', 'Լուսանկարներ'],
                ['VIDEO', 'Տեսանյութեր'],
              ].map(([v, l]) => (
                <button key={v} onClick={() => setType(v)} aria-pressed={type === v} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${type === v ? 'bg-sun-300 text-ink' : 'text-ink-soft hover:text-ink'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        {query.isLoading && <CardGridSkeleton count={8} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" item="h-60" />}
        {query.isError && <ErrorState onRetry={() => query.refetch()} />}
        {!query.isLoading && !query.isError && items.length === 0 && <EmptyState title="Այստեղ դեռ նյութեր չկան" text="Շուտով կավելացնենք նոր լուսանկարներ և տեսանյութեր։" />}
        <div className="columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
          {items.map((m, i) => (
            <div key={m.id} className="mb-3 break-inside-avoid sm:mb-4">
              <MediaTile media={m} aspect="" style={{ aspectRatio: aspectFor(m, i) }} onOpen={() => setIndex(i)} showCaption />
            </div>
          ))}
        </div>
        {query.hasNextPage && (
          <div className="mt-12 text-center">
            <Button variant="secondary" size="lg" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} icon={query.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
              Բեռնել ավելին
            </Button>
          </div>
        )}
      </section>
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  );
}
