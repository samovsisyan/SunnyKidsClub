import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Camera, Heart, Phone, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { usePublic, useSite } from '@/hooks/usePublic';
import type { Activity, DailyActivity, EventItem, Media, Promotion, ScheduleItem, Testimonial } from '@/lib/types';
import { formatDate, relativeDay, telHref } from '@/lib/format';
import { Icon, tone } from '@/lib/icons';
import { LinkButton } from '@/components/Button';
import { ActivityCard, EventCard, PromotionCard, TestimonialCard, Timeline } from '@/components/Cards';
import { CategoryChip, DailyEntry } from '@/components/DailyEntry';
import { Lightbox } from '@/components/Lightbox';
import { MediaImage, MediaTile } from '@/components/Media';
import { Reveal } from '@/components/Reveal';
import { Blob, SectionHeading } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, ErrorState, Skeleton } from '@/components/States';

interface HomeData {
  daily: DailyActivity[];
  activities: Activity[];
  schedule: ScheduleItem[];
  events: EventItem[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  gallery: Media[];
}

function HeroMedia({ media }: { media: Media[] }) {
  const [main, a, b] = media;
  const isVideo = main?.type === 'VIDEO' && main.source === 'UPLOAD' && main.url;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-sun-200/60 via-peach-100/50 to-sky-100/60 blur-2xl" />
      <div className="grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4" style={{ aspectRatio: '1 / 0.95' }}>
        <div className="col-span-4 row-span-6 overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-white/60 sm:rounded-[2.5rem]">
          {isVideo ? (
            <video
              src={main.url!}
              poster={main.thumbUrl ?? undefined}
              autoPlay={!reduced}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              aria-label={main.title}
            />
          ) : (
            <MediaImage media={main} variant="full" eager className="h-full w-full" sizes="(min-width:1024px) 40vw, 90vw" />
          )}
        </div>
        <div className="col-span-2 row-span-3 overflow-hidden rounded-[1.75rem] shadow-card">
          <MediaImage media={a} className="h-full w-full" />
        </div>
        <div className="col-span-2 row-span-3 overflow-hidden rounded-[1.75rem] shadow-card">
          <MediaImage media={b} className="h-full w-full" />
        </div>
      </div>
      <div className="absolute -bottom-5 left-4 flex animate-float items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lift backdrop-blur sm:left-[-1.5rem]">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-100 text-leaf-600">
          <Heart className="h-5 w-5" />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-bold">Ջերմ ու անվտանգ</span>
          <span className="text-ink-muted">միջավայր ամեն օր</span>
        </span>
      </div>
    </div>
  );
}

function Hero() {
  const { data } = useSite();
  const site = data?.site;
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
      <Blob className="-top-32 -left-32 h-[28rem] w-[28rem] bg-sun-200/60" />
      <Blob className="top-24 right-[-10rem] h-[30rem] w-[30rem] bg-sky-100/80" />
      <Blob className="bottom-0 left-1/3 h-72 w-72 bg-peach-100/70" />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" /> Մանկապարտեզ և զարգացման կենտրոն
          </span>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold sm:text-6xl xl:text-7xl">
            Sunny <span className="relative whitespace-nowrap text-sun-500">Kids<svg viewBox="0 0 120 12" className="absolute -bottom-2 left-0 w-full" aria-hidden><path d="M2 8c30-6 80-8 116-2" stroke="#F8D570" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span> Club
          </h1>
          {site ? (
            <>
              <p className="mt-6 font-display text-2xl leading-snug font-medium text-ink/85 sm:text-[1.75rem]">«{site.slogan}»</p>
              <p className="mt-5 max-w-xl text-lg text-ink-soft">{site.heroDescription}</p>
            </>
          ) : (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            <LinkButton to="/about" variant="secondary" size="lg">
              Ծանոթանալ մեզ հետ
            </LinkButton>
            <LinkButton to="/enroll" size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
              Գրանցվել
            </LinkButton>
          </div>
          {!!site?.highlights?.length && (
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
              {site.highlights.map((h, i) => (
                <div key={i} className={clsx('border-l-2 pl-4', ['border-sun-300', 'border-sky-300', 'border-leaf-300'][i % 3])}>
                  <dt className="sr-only">{h.label}</dt>
                  <dd className="font-display text-xl font-semibold sm:text-2xl">{h.value}</dd>
                  <dd className="mt-0.5 text-xs text-ink-muted sm:text-sm">{h.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="animate-fade-up [animation-delay:.15s]">{site ? <HeroMedia media={site.heroMedia ?? []} /> : <Skeleton className="aspect-square rounded-[2.5rem]" />}</div>
      </div>
    </section>
  );
}

function TodaySection({ daily }: { daily: DailyActivity[] }) {
  if (!daily.length) return null;
  const [latest, ...rest] = daily;
  return (
    <section className="relative py-20 sm:py-24" aria-labelledby="today-heading">
      <div className="container-x">
        <Reveal className="mb-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <Camera className="h-3.5 w-3.5" /> Մեր առօրյան
            </span>
            <h2 id="today-heading" className="mt-4 text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">
              Տեսեք, թե ինչով են զբաղվում մեր փոքրիկներն ամեն օր
            </h2>
          </div>
          <LinkButton to="/daily-life" variant="secondary" iconRight={<ArrowRight className="h-4 w-4" />}>
            Բոլոր օրերը
          </LinkButton>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <p className="mb-3 flex items-center gap-2 pl-2 text-sm font-bold text-sun-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sun-500" />
              </span>
              {relativeDay(latest.date) === 'Այսօր' ? 'Այսօրվա առօրյան' : 'Վերջին թարմացումը'}
            </p>
            <DailyEntry item={latest} featured />
          </Reveal>
          <div className="flex flex-col gap-6 lg:pt-8">
            {rest.map((d, i) => (
              <Reveal key={d.id} delay={i * 100}>
                <Link to="/daily-life" className="group card flex gap-4 p-3 transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <MediaImage media={d.media[0]} className="aspect-square w-28 shrink-0 rounded-2xl sm:w-36" />
                  <div className="flex min-w-0 flex-col justify-center py-1 pr-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(d.date)}
                    </span>
                    <h3 className="mt-1.5 text-lg leading-snug font-semibold group-hover:text-sun-600">{d.title}</h3>
                    <div className="mt-2">
                      <CategoryChip category={d.category} />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
            <Reveal delay={200} className="rounded-4xl bg-gradient-to-br from-sky-100 to-leaf-100 p-6">
              <p className="font-display text-lg font-semibold">Ամեն օր՝ նոր լուսանկարներ և տեսանյութեր</p>
              <p className="mt-1 text-sm text-ink-soft">Մեր դաստիարակները պարբերաբար կիսվում են երեխաների առօրյայով, որպեսզի դուք միշտ տեղյակ լինեք։</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutTeaser() {
  const { data } = useSite();
  const about = data?.about;
  if (!about) return null;
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="grid grid-cols-5 gap-4">
            <MediaImage media={about.imageMedia?.[0]} className="col-span-3 aspect-[3/4] rounded-[2rem] shadow-card" />
            <div className="col-span-2 flex flex-col gap-4 pt-12">
              <MediaImage media={about.imageMedia?.[1]} className="aspect-[3/4] rounded-[1.75rem] shadow-card" />
              <div className="rounded-[1.75rem] bg-sun-100 p-5">
                <Icon name="sun" className="h-7 w-7 text-sun-600" />
                <p className="mt-2 font-display font-semibold">Ամեն երեխա յուրահատուկ է</p>
              </div>
            </div>
          </div>
        </Reveal>
        <div>
          <SectionHeading align="left" eyebrow="Մեր մասին" title={about.title} description={about.lead} />
          <div className="grid gap-4 sm:grid-cols-2">
            {about.values.slice(0, 4).map((v, i) => {
              const t = tone(i);
              return (
                <Reveal key={i} delay={i * 80} className="flex gap-4 rounded-3xl bg-cream p-5">
                  <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', t.bg, t.fg)}>
                    <Icon name={v.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-bold">{v.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{v.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-8">
            <LinkButton to="/about" variant="dark" iconRight={<ArrowRight className="h-4 w-4" />}>
              Ավելին մեր մասին
            </LinkButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function GalleryPreview({ items }: { items: Media[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <section className="py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Պատկերասրահ"
          title="Պահեր, որոնք պատմում են մեր մասին"
          align="left"
          action={
            <LinkButton to="/gallery" variant="secondary" iconRight={<ArrowRight className="h-4 w-4" />}>
              Ամբողջ պատկերասրահը
            </LinkButton>
          }
        />
        <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] sm:gap-4 md:grid-cols-4">
          {items.map((m, i) => (
            <Reveal key={m.id} delay={(i % 4) * 70} className={clsx(i === 0 && 'col-span-2 row-span-2', i === 5 && 'md:col-span-2')}>
              <MediaTile media={m} aspect="h-full" onOpen={() => setIndex(i)} showCaption />
            </Reveal>
          ))}
        </div>
      </div>
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </section>
  );
}

export function CtaBand() {
  const { data } = useSite();
  const site = data?.site;
  return (
    <section className="py-12">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sun-300 via-sun-200 to-peach-200 px-6 py-14 text-center sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-white/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sky-200/50 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-5xl">{site?.ctaTitle ?? 'Եկեք ծանոթանանք'}</h2>
            <p className="mt-4 text-lg text-ink/75">{site?.ctaText}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton to="/enroll" variant="dark" size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
                Գրանցել երեխային
              </LinkButton>
              {data?.contact.phone && (
                <LinkButton to={telHref(data.contact.phone)} variant="secondary" size="lg" icon={<Phone className="h-5 w-5" />}>
                  {data.contact.phone}
                </LinkButton>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const { data, isLoading, isError, refetch } = usePublic<HomeData>('/home');

  return (
    <>
      <Seo />
      <Hero />
      {isError && (
        <div className="container-x py-10">
          <ErrorState onRetry={() => refetch()} />
        </div>
      )}
      {isLoading && (
        <div className="container-x py-16">
          <CardGridSkeleton count={3} item="h-96" />
        </div>
      )}
      {data && (
        <>
          {data.promotions[0] && (
            <section className="pt-4">
              <div className="container-x">
                <PromotionCard item={data.promotions[0]} wide />
              </div>
            </section>
          )}
          <TodaySection daily={data.daily} />
          <AboutTeaser />
          {data.activities.length > 0 && (
            <section className="py-20 sm:py-28">
              <div className="container-x">
                <SectionHeading eyebrow="Մեր զբաղմունքները" title="Խաղալով սովորում ենք ամեն ինչ" description="Բազմազան զբաղմունքներ, որոնք զարգացնում են երևակայությունը, խոսքը, շարժողական հմտությունները և ընկերությունը։" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {data.activities.slice(0, 8).map((a, i) => (
                    <ActivityCard key={a.id} item={a} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}
          {data.schedule.length > 0 && (
            <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-cream py-20 sm:py-28">
              <div className="container-x">
                <SectionHeading
                  eyebrow="Օրվա ռեժիմ"
                  title="Հանգիստ ու կանխատեսելի օր"
                  description="Հստակ ռեժիմը երեխաներին տալիս է անվտանգության զգացում և օգնում է ավելի հեշտ հարմարվել։"
                />
                <div className="card p-6 sm:p-10">
                  <Timeline items={data.schedule} compact />
                </div>
                <div className="mt-8 text-center">
                  <LinkButton to="/schedule" variant="secondary" iconRight={<ArrowRight className="h-4 w-4" />}>
                    Մանրամասն ռեժիմը
                  </LinkButton>
                </div>
              </div>
            </section>
          )}
          {data.events.length > 0 && (
            <section className="py-20 sm:py-28">
              <div className="container-x">
                <SectionHeading
                  eyebrow="Միջոցառումներ"
                  title="Առաջիկա տոներ և հանդիպումներ"
                  align="left"
                  action={
                    <LinkButton to="/events" variant="secondary" iconRight={<ArrowRight className="h-4 w-4" />}>
                      Բոլոր միջոցառումները
                    </LinkButton>
                  }
                />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.events.map((e, i) => (
                    <EventCard key={e.id} item={e} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}
          <GalleryPreview items={data.gallery} />
          {data.testimonials.length > 0 && (
            <section className="bg-white py-20 sm:py-28">
              <div className="container-x">
                <SectionHeading eyebrow="Ծնողների կարծիքներ" title="Ինչ են ասում ծնողները" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.testimonials.slice(0, 3).map((t, i) => (
                    <TestimonialCard key={t.id} item={t} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}
          <CtaBand />
        </>
      )}
    </>
  );
}
