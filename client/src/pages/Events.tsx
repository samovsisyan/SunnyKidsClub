import { useState } from 'react';
import { usePublic } from '@/hooks/usePublic';
import type { EventItem } from '@/lib/types';
import { EventCard } from '@/components/Cards';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState, FilterChips } from '@/components/States';

export default function Events() {
  const [status, setStatus] = useState<'upcoming' | 'completed'>('upcoming');
  const { data, isLoading, isError, refetch } = usePublic<{ items: EventItem[] }>(`/events?status=${status}`);
  return (
    <>
      <Seo title="Միջոցառումներ" description="Առաջիկա և անցկացված միջոցառումներ Sunny Kids Club-ում։" />
      <PageHero tone="blush" eyebrow="Միջոցառումներ" title="Տոներ, որոնք հիշվում են" description="Տոնական ներկայացումներ, թեմատիկ օրեր և ընտանեկան հանդիպումներ՝ ամբողջ տարվա ընթացքում։" />
      <section className="container-x">
        <div className="mb-10">
          <FilterChips
            label="Միջոցառումների կարգավիճակ"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: 'upcoming', label: 'Առաջիկա' },
              { value: 'completed', label: 'Ավարտված' },
            ]}
          />
        </div>
        {isLoading && <CardGridSkeleton count={3} />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && !data.items.length && (
          <EmptyState
            title={status === 'upcoming' ? 'Առաջիկա միջոցառումներ դեռ նախատեսված չեն' : 'Ավարտված միջոցառումներ դեռ չկան'}
            text={status === 'upcoming' ? 'Հետևեք մեր էջին․ շուտով կհայտարարենք նոր տոների մասին։' : undefined}
          />
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((e, i) => (
            <EventCard key={e.id} item={e} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
