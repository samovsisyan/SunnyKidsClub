import { usePublic } from '@/hooks/usePublic';
import type { Activity } from '@/lib/types';
import { ActivityCard } from '@/components/Cards';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/States';
import { CtaBand } from './Home';

export default function Activities() {
  const { data, isLoading, isError, refetch } = usePublic<{ items: Activity[] }>('/activities');
  return (
    <>
      <Seo title="Մեր զբաղմունքները" description="Նկարչություն, երաժշտություն, զարգացնող խաղեր, նախադպրոցական պատրաստություն և ավելին։" />
      <PageHero tone="peach" eyebrow="Մեր զբաղմունքները" title="Խաղալով սովորում ենք ամեն ինչ" description="Յուրաքանչյուր զբաղմունք մտածված է այնպես, որ զարգացնի երեխայի հետաքրքրասիրությունը, ինքնավստահությունը և ստեղծագործական միտքը։" />
      <section className="container-x pb-12">
        {isLoading && <CardGridSkeleton count={8} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data &&
          (data.items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((a, i) => (
                <ActivityCard key={a.id} item={a} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState title="Զբաղմունքները շուտով կհրապարակվեն" />
          ))}
      </section>
      <CtaBand />
    </>
  );
}
