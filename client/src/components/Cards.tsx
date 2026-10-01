import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, Gift, Images, Quote } from 'lucide-react';
import clsx from 'clsx';
import type { Activity, EventItem, Promotion, ScheduleItem, Testimonial } from '@/lib/types';
import { formatDate, formatDateShort } from '@/lib/format';
import { Icon, tone } from '@/lib/icons';
import { LinkButton } from './Button';
import { MediaImage } from './Media';
import { Reveal } from './Reveal';

export function ActivityCard({ item, index }: { item: Activity; index: number }) {
  const t = tone(index);
  return (
    <Reveal delay={(index % 4) * 80} className="group card flex h-full flex-col overflow-hidden transition duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <MediaImage media={item.image} className="aspect-[4/3]" imgClassName="group-hover:scale-105 transition-transform duration-700" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
        <span className={clsx('absolute -bottom-6 left-6 grid h-12 w-12 place-items-center rounded-2xl shadow-soft ring-4 ring-white', t.bg, t.fg)}>
          <Icon name={item.icon} className="h-6 w-6" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6 pt-10">
        <h3 className="text-xl font-semibold">{item.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{item.description}</p>
      </div>
    </Reveal>
  );
}

export function EventCard({ item, index = 0 }: { item: EventItem; index?: number }) {
  const { day, month } = formatDateShort(item.date);
  const done = (item.effectiveStatus ?? item.status) === 'COMPLETED';
  return (
    <Reveal delay={(index % 3) * 90}>
      <Link to={`/events/${item.slug}`} className="group card flex h-full flex-col overflow-hidden transition duration-500 hover:-translate-y-1 hover:shadow-lift">
        <div className="relative">
          <MediaImage media={item.cover} className="aspect-[16/10]" imgClassName={clsx('group-hover:scale-105 transition-transform duration-700', done && 'saturate-[.85]')} />
          <div className="absolute top-4 left-4 flex flex-col items-center rounded-2xl bg-white/95 px-3.5 py-2 text-center shadow-soft backdrop-blur">
            <span className="font-display text-2xl leading-none font-semibold">{day}</span>
            <span className="text-xs font-bold text-ink-muted uppercase">{month}</span>
          </div>
          <span className={clsx('absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold', done ? 'bg-ink/70 text-white' : 'bg-leaf-300 text-leaf-700')}>
            {done ? 'Ավարտված' : 'Առաջիկա'}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-semibold transition group-hover:text-sun-600">{item.title}</h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatDate(item.date)}
            </span>
            {item.time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {item.time}
              </span>
            )}
            {!!item.mediaCount && (
              <span className="inline-flex items-center gap-1.5">
                <Images className="h-4 w-4" /> {item.mediaCount}
              </span>
            )}
          </div>
          <p className="mt-3 line-clamp-3 text-[15px] text-ink-soft">{item.description}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-ink">
            Մանրամասն <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export function PromotionCard({ item, index = 0, wide }: { item: Promotion; index?: number; wide?: boolean }) {
  const t = tone(index + 3);
  return (
    <Reveal delay={index * 90} className={clsx('relative overflow-hidden rounded-4xl ring-1', t.bg, t.ring, wide ? 'grid md:grid-cols-[1.1fr_1fr]' : 'flex flex-col')}>
      <div className="relative z-10 flex flex-col p-7 sm:p-10">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-ink">
          <Gift className="h-3.5 w-3.5" /> Հատուկ առաջարկ
        </span>
        <h3 className="text-2xl font-semibold sm:text-3xl">{item.title}</h3>
        {item.description && <p className="mt-3 text-ink-soft sm:text-lg">«{item.description}»</p>}
        {item.endDate && <p className="mt-4 text-sm font-bold text-ink-soft">Գործում է մինչև {formatDate(item.endDate)}</p>}
        {item.ctaLabel && (
          <div className="mt-6">
            <LinkButton to={item.ctaUrl || '/enroll'} variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
              {item.ctaLabel}
            </LinkButton>
          </div>
        )}
      </div>
      {item.image && <MediaImage media={item.image} className={clsx(wide ? 'min-h-64' : 'aspect-[16/9]')} />}
    </Reveal>
  );
}

export function Timeline({ items, compact }: { items: ScheduleItem[]; compact?: boolean }) {
  return (
    <ol className={clsx('relative', compact ? 'grid gap-x-10 md:grid-cols-2' : 'mx-auto max-w-3xl')}>
      {items.map((s, i) => {
        const t = tone(i);
        return (
          <Reveal as="li" key={s.id} delay={Math.min(i, 6) * 60} className="relative flex gap-5 pb-8 last:pb-0 sm:gap-7">
            <div className="relative flex flex-col items-center">
              <span className={clsx('z-10 grid h-14 min-w-[4.5rem] place-items-center rounded-2xl font-display text-lg font-semibold shadow-soft ring-4 ring-cream', t.bg, t.fg)}>{s.time}</span>
              {(compact ? i < items.length - 2 || (items.length % 2 === 1 && i === items.length - 2) : i < items.length - 1) && (
                <span className="absolute top-14 bottom-[-2rem] w-0.5 rounded bg-gradient-to-b from-sun-200 to-sky-100" aria-hidden />
              )}
            </div>
            <div className={clsx('flex-1 pt-1.5', !compact && 'card -mt-1 px-6 py-4')}>
              <h3 className="text-lg font-semibold sm:text-xl">{s.title}</h3>
              {s.description && <p className="mt-1 text-[15px] text-ink-soft">{s.description}</p>}
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}

export function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
  const t = tone(index + 1);
  return (
    <Reveal delay={(index % 3) * 90} as="figure" className="card relative flex h-full flex-col p-7 sm:p-8">
      <Quote className={clsx('h-9 w-9', t.fg)} strokeWidth={1.5} />
      <blockquote className="mt-4 flex-1 text-[17px] leading-relaxed text-ink">«{item.comment}»</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        {item.photo ? (
          <MediaImage media={item.photo} className="h-12 w-12 rounded-full" />
        ) : (
          <span className={clsx('grid h-12 w-12 place-items-center rounded-full font-display text-lg font-semibold', t.bg, t.fg)}>{item.parentName.charAt(0)}</span>
        )}
        <span>
          <span className="block font-bold">{item.parentName}</span>
          {item.relation && <span className="block text-sm text-ink-muted">{item.relation}</span>}
        </span>
      </figcaption>
    </Reveal>
  );
}

export function InfoPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink-soft ring-1 ring-ink/5">
      {icon}
      {children}
    </span>
  );
}

