import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { usePublic, useSite } from '@/hooks/usePublic';
import type { Faq } from '@/lib/types';
import { Icon, tone } from '@/lib/icons';
import { Reveal } from '@/components/Reveal';
import { PageHero, SectionHeading } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, ErrorState } from '@/components/States';
import { CtaBand } from './Home';

function FaqItem({ item, open, onToggle }: { item: Faq; open: boolean; onToggle: () => void }) {
  return (
    <div className={clsx('card overflow-hidden transition', open && 'ring-sun-300')}>
      <h3 className="font-sans">
        <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold sm:text-lg">
          {item.question}
          <ChevronDown className={clsx('h-5 w-5 shrink-0 text-ink-muted transition duration-300', open && 'rotate-180')} />
        </button>
      </h3>
      <div className={clsx('grid transition-all duration-500', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden">
          <p className="px-6 pb-6 whitespace-pre-line text-ink-soft">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function Parents() {
  const { data, isLoading, isError, refetch } = useSite();
  const { data: faq } = usePublic<{ items: Faq[] }>('/faq');
  const [open, setOpen] = useState<string | null>(null);
  const parents = data?.parents;

  return (
    <>
      <Seo title="Ծնողների համար" description="Օգտակար տեղեկություններ ծնողների համար և հաճախ տրվող հարցեր։" />
      <PageHero eyebrow="Ծնողների համար" title="Այն ամենը, ինչ պետք է իմանալ" description={parents?.intro} />
      <section className="container-x">
        {isLoading && <CardGridSkeleton count={4} className="grid gap-6 md:grid-cols-2" item="h-56" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {parents?.sections.map((s, i) => {
            const t = tone(i);
            return (
              <Reveal key={i} delay={(i % 3) * 80} className="card p-7">
                <span className={clsx('grid h-12 w-12 place-items-center rounded-2xl', t.bg, t.fg)}>
                  <Icon name={s.icon} className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-xl font-semibold">{s.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {s.body
                    .split('\n')
                    .filter(Boolean)
                    .map((line, j) => (
                      <li key={j} className="flex gap-2.5 text-[15px] text-ink-soft">
                        <Check className={clsx('mt-0.5 h-4 w-4 shrink-0', t.fg)} />
                        {line}
                      </li>
                    ))}
                </ul>
              </Reveal>
            );
          })}
          <Reveal className="flex flex-col justify-between rounded-4xl bg-gradient-to-br from-sky-100 to-leaf-100 p-7">
            <div>
              <h2 className="text-xl font-semibold">Օրվա ռեժիմ և սնունդ</h2>
              <p className="mt-2 text-ink-soft">Ծանոթացեք մեր օրվա ռեժիմին և այս շաբաթվա ճաշացանկին։</p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/schedule" className="inline-flex items-center gap-1.5 font-bold">
                Օրվա ռեժիմ <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/food" className="inline-flex items-center gap-1.5 font-bold">
                Սնունդ և ճաշացանկ <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {!!faq?.items.length && (
        <section className="py-20 sm:py-28">
          <div className="container-x max-w-3xl">
            <SectionHeading eyebrow="ՀՏՀ" title="Հաճախ տրվող հարցեր" />
            <div className="space-y-3">
              {faq.items.map((f) => (
                <FaqItem key={f.id} item={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
