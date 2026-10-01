import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  action,
  as: H = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'center' | 'left';
  action?: ReactNode;
  as?: 'h1' | 'h2';
}) {
  return (
    <Reveal className={clsx('mb-10 flex flex-col gap-4 md:mb-14', align === 'center' ? 'items-center text-center' : 'items-start md:flex-row md:items-end md:justify-between')}>
      <div className={clsx('flex flex-col gap-4', align === 'center' ? 'max-w-2xl items-center' : 'items-start')}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <H className={clsx('font-semibold', H === 'h1' ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-3xl sm:text-4xl lg:text-[2.75rem]', 'leading-[1.12]')}>{title}</H>
        {description && <p className="max-w-2xl text-base text-ink-soft sm:text-lg">{description}</p>}
      </div>
      {action}
    </Reveal>
  );
}

/** Soft page intro used at the top of inner pages. */
export function PageHero({ eyebrow, title, description, children, tone = 'sun' }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode; tone?: 'sun' | 'sky' | 'leaf' | 'peach' | 'blush' }) {
  const tones = {
    sun: 'from-sun-100/80 via-cream to-cream',
    sky: 'from-sky-100/80 via-cream to-cream',
    leaf: 'from-leaf-100/80 via-cream to-cream',
    peach: 'from-peach-100/80 via-cream to-cream',
    blush: 'from-blush-100/80 via-cream to-cream',
  };
  return (
    <section className={clsx('relative overflow-hidden bg-gradient-to-b pt-32 pb-14 sm:pt-40 sm:pb-20', tones[tone])}>
      <Blob className="-top-24 -right-24 h-80 w-80 bg-sun-200/50" />
      <Blob className="top-40 -left-32 h-72 w-72 bg-sky-200/40" />
      <div className="container-x relative">
        <div className="mx-auto flex max-w-3xl animate-fade-up flex-col items-center gap-5 text-center">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="text-4xl leading-[1.1] font-semibold sm:text-5xl lg:text-6xl">{title}</h1>
          {description && <p className="max-w-2xl text-base text-ink-soft sm:text-lg">{description}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function Blob({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('pointer-events-none absolute rounded-full blur-3xl', className)} />;
}
