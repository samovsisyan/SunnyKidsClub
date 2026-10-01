import { usePublic } from '@/hooks/usePublic';
import type { Promotion } from '@/lib/types';
import { PromotionCard } from '@/components/Cards';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/States';
import { LinkButton } from '@/components/Button';

export default function Promotions() {
  const { data, isLoading, isError, refetch } = usePublic<{ items: Promotion[] }>('/promotions');
  return (
    <>
      <Seo title="Ակցիաներ" description="Հատուկ առաջարկներ նոր սաների համար։" />
      <PageHero tone="peach" eyebrow="Ակցիաներ" title="Հատուկ առաջարկներ" description="Գործող ակցիաներ և առաջարկներ մեր ընտանիքների համար։" />
      <section className="container-x">
        {isLoading && <CardGridSkeleton count={2} className="grid gap-6" item="h-72" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && !data.items.length && (
          <EmptyState title="Այս պահին գործող ակցիաներ չկան" text="Հետևեք մեզ՝ նոր առաջարկների մասին առաջինը իմանալու համար։" action={<LinkButton to="/contact">Կապվել մեզ հետ</LinkButton>} />
        )}
        <div className="grid gap-6">
          {data?.items.map((p, i) => (
            <PromotionCard key={p.id} item={p} index={i} wide />
          ))}
        </div>
      </section>
    </>
  );
}
