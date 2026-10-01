import clsx from 'clsx';
import { Clock } from 'lucide-react';
import { usePublic, useSite } from '@/hooks/usePublic';
import type { Meal, MenuEntry } from '@/lib/types';
import { MEAL_TYPES } from '@/lib/constants';
import { WEEKDAYS } from '@/lib/format';
import { tone } from '@/lib/icons';
import { MediaImage } from '@/components/Media';
import { Reveal } from '@/components/Reveal';
import { PageHero, SectionHeading } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, ErrorState } from '@/components/States';

const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'] as const;

export default function Food() {
  const { data: site } = useSite();
  const { data, isLoading, isError, refetch } = usePublic<{ meals: Meal[]; menu: MenuEntry[] }>('/food');
  const food = site?.food;
  const weekdays = [...new Set(data?.menu.map((m) => m.weekday))].sort();
  const usedMeals = MEAL_ORDER.filter((t) => data?.menu.some((m) => m.mealType === t));

  return (
    <>
      <Seo title="Սնունդ" description="Առողջ և հավասարակշռված սնունդ մեր փոքրիկների համար։" />
      <PageHero tone="leaf" eyebrow="Սնունդ" title={food?.title ?? 'Առողջ ու համեղ սնունդ'} description={food?.intro} />
      <section className="container-x">
        {isLoading && <CardGridSkeleton count={4} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data?.meals.map((m, i) => {
            const t = tone(i + 2);
            return (
              <Reveal key={m.id} delay={i * 80} className="card overflow-hidden">
                <MediaImage media={m.image} className="aspect-[4/3]" />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold">{m.title}</h2>
                    {m.time && (
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', t.bg, t.fg)}>
                        <Clock className="h-3.5 w-3.5" /> {m.time}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] text-ink-soft">{m.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {!!food?.principles?.length && (
        <section className="container-x py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {food.principles.map((p, i) => (
              <Reveal key={i} delay={i * 80} className={clsx('rounded-4xl p-7', tone(i).bg)}>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-1 text-ink-soft">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {food?.showWeeklyMenu && weekdays.length > 0 && (
        <section className="container-x pb-12">
          <SectionHeading eyebrow="Ճաշացանկ" title={food.weekLabel || 'Շաբաթվա ճաշացանկ'} description={food.notes || undefined} />
          {/* Desktop table */}
          <Reveal className="card hidden overflow-hidden lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sun-50">
                  <th className="p-5 text-sm font-bold text-ink-muted" scope="col">
                    <span className="sr-only">Օր</span>
                  </th>
                  {usedMeals.map((t) => (
                    <th key={t} scope="col" className="p-5 font-display text-lg font-semibold">
                      {MEAL_TYPES[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekdays.map((w) => (
                  <tr key={w} className="border-t border-ink/5">
                    <th scope="row" className="p-5 font-bold">
                      {WEEKDAYS[w % 7]}
                    </th>
                    {usedMeals.map((t) => (
                      <td key={t} className="p-5 text-[15px] text-ink-soft">
                        {data?.menu.find((m) => m.weekday === w && m.mealType === t)?.dishes ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          {/* Mobile cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {weekdays.map((w, i) => (
              <Reveal key={w} delay={(i % 2) * 80} className="card p-6">
                <h3 className="text-lg font-semibold">{WEEKDAYS[w % 7]}</h3>
                <dl className="mt-3 space-y-2">
                  {usedMeals.map((t) => (
                    <div key={t} className="grid grid-cols-[6.5rem_1fr] gap-2 text-sm">
                      <dt className="font-bold text-ink-muted">{MEAL_TYPES[t]}</dt>
                      <dd className="text-ink-soft">{data?.menu.find((m) => m.weekday === w && m.mealType === t)?.dishes ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
