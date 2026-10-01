import { useState } from 'react';
import { Images } from 'lucide-react';
import clsx from 'clsx';
import { usePublic } from '@/hooks/usePublic';
import type { Media, Space } from '@/lib/types';
import { Lightbox } from '@/components/Lightbox';
import { MediaImage } from '@/components/Media';
import { Reveal } from '@/components/Reveal';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/States';

export default function Environment() {
  const { data, isLoading, isError, refetch } = usePublic<{ items: Space[] }>('/spaces');
  const [box, setBox] = useState<{ items: Media[]; index: number } | null>(null);

  return (
    <>
      <Seo title="Մեր միջավայրը" description="Խմբասենյակներ, խաղասենյակներ, բակ և խաղահրապարակ։" />
      <PageHero tone="leaf" eyebrow="Մեր միջավայրը" title="Տարածք, որտեղ երեխաները իրենց զգում են տանը" description="Լուսավոր, մաքուր և անվտանգ տարածքներ՝ նախագծված հատուկ փոքրիկների համար։" />
      <section className="container-x pb-12">
        {isLoading && <CardGridSkeleton count={6} />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && !data.items.length && <EmptyState title="Լուսանկարները շուտով կավելացվեն" />}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((s, i) => {
            const all = [s.cover, ...s.media].filter(Boolean) as Media[];
            return (
              <Reveal key={s.id} delay={(i % 3) * 90} className={clsx(i % 5 === 0 && 'lg:col-span-2')}>
                <button
                  className="group card relative block h-full w-full overflow-hidden text-left"
                  onClick={() => all.length && setBox({ items: all, index: 0 })}
                  aria-label={`${s.title} — դիտել լուսանկարները`}
                >
                  <MediaImage media={all[0]} variant={i % 5 === 0 ? 'full' : 'thumb'} className="aspect-[4/3] w-full lg:aspect-auto lg:h-80" imgClassName="group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h2 className="text-2xl font-semibold text-white">{s.title}</h2>
                    <p className="mt-1 max-w-md text-sm text-white/85">{s.description}</p>
                    {all.length > 1 && (
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                        <Images className="h-3.5 w-3.5" /> {all.length} լուսանկար
                      </span>
                    )}
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>
      <Lightbox items={box?.items ?? []} index={box?.index ?? null} onClose={() => setBox(null)} onIndex={(index) => setBox((b) => (b ? { ...b, index } : b))} />
    </>
  );
}
