import { usePublic } from '@/hooks/usePublic';
import type { ScheduleItem } from '@/lib/types';
import { Timeline } from '@/components/Cards';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/States';
import { CtaBand } from './Home';

export default function Schedule() {
  const { data, isLoading, isError, refetch } = usePublic<{ items: ScheduleItem[] }>('/schedule');
  return (
    <>
      <Seo title="Օրվա ռեժիմ" description="Sunny Kids Club մանկապարտեզի օրվա ռեժիմը։" />
      <PageHero tone="sky" eyebrow="Օրվա ռեժիմ" title="Մեր օրը՝ ժամ առ ժամ" description="Հավասարակշռված օր՝ խաղի, ուսուցման, սնունդի և հանգստի համար։ Ռեժիմը կարող է փոքր-ինչ փոփոխվել՝ կախված եղանակից և միջոցառումներից։" />
      <section className="container-x pb-12">
        {isLoading && <CardGridSkeleton count={5} className="mx-auto grid max-w-3xl gap-6" item="h-20" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && (data.items.length ? <Timeline items={data.items} /> : <EmptyState title="Ռեժիմը շուտով կհրապարակվի" />)}
      </section>
      <CtaBand />
    </>
  );
}
