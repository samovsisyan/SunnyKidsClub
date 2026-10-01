import clsx from 'clsx';
import { usePublic, useSite } from '@/hooks/usePublic';
import type { Testimonial } from '@/lib/types';
import { Icon, tone } from '@/lib/icons';
import { TestimonialCard } from '@/components/Cards';
import { MediaImage } from '@/components/Media';
import { Reveal } from '@/components/Reveal';
import { PageHero, SectionHeading } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';
import { CardGridSkeleton, ErrorState } from '@/components/States';
import { CtaBand } from './Home';

export default function About() {
  const { data, isLoading, isError, refetch } = useSite();
  const { data: testimonials } = usePublic<{ items: Testimonial[] }>('/testimonials');
  const about = data?.about;

  return (
    <>
      <Seo title="Մեր մասին" description="Ծանոթացեք Sunny Kids Club մանկապարտեզին՝ մեր փիլիսոփայությանը, մոտեցմանը և թիմին։" />
      <PageHero eyebrow="Մեր մասին" title={about?.title ?? 'Մեր մասին'} description={about?.lead} />
      {isLoading && (
        <div className="container-x">
          <CardGridSkeleton count={2} className="grid gap-8 lg:grid-cols-2" item="h-96" />
        </div>
      )}
      {isError && (
        <div className="container-x">
          <ErrorState onRetry={() => refetch()} />
        </div>
      )}
      {about && (
        <>
          <section className="container-x grid items-center gap-12 pb-20 lg:grid-cols-2 lg:gap-20">
            <Reveal className="grid grid-cols-2 gap-4">
              <MediaImage media={about.imageMedia?.[0]} variant="full" className="col-span-2 aspect-[16/10] rounded-[2rem] shadow-card" />
              {about.imageMedia?.slice(1, 3).map((m) => (
                <MediaImage key={m.id} media={m} className="aspect-square rounded-[1.75rem] shadow-card" />
              ))}
            </Reveal>
            <Reveal className="space-y-6">
              <h2 className="text-3xl font-semibold sm:text-4xl">Ով ենք մենք</h2>
              <p className="text-lg leading-relaxed text-ink-soft whitespace-pre-line">{about.story}</p>
            </Reveal>
          </section>

          <section className="bg-white py-20 sm:py-28">
            <div className="container-x grid gap-6 md:grid-cols-2">
              {[
                { title: about.philosophyTitle, text: about.philosophy, cls: 'from-sun-100 to-peach-50', icon: 'heart' },
                { title: about.approachTitle, text: about.approach, cls: 'from-sky-100 to-leaf-50', icon: 'puzzle' },
              ].map((b, i) => (
                <Reveal key={i} delay={i * 100} className={clsx('rounded-[2rem] bg-gradient-to-br p-8 sm:p-12', b.cls)}>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/80 text-ink shadow-soft">
                    <Icon name={b.icon} className="h-7 w-7" />
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold sm:text-3xl">{b.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-ink-soft whitespace-pre-line">{b.text}</p>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="py-20 sm:py-28">
            <div className="container-x">
              <SectionHeading eyebrow="Ինչու՞ մենք" title="Այն, ինչ մեզ համար կարևոր է" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {about.values.map((v, i) => {
                  const t = tone(i);
                  return (
                    <Reveal key={i} delay={(i % 3) * 90} className="card p-7 transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                      <span className={clsx('grid h-14 w-14 place-items-center rounded-2xl', t.bg, t.fg)}>
                        <Icon name={v.icon} className="h-7 w-7" />
                      </span>
                      <h3 className="mt-5 text-xl font-semibold">{v.title}</h3>
                      <p className="mt-2 text-ink-soft">{v.text}</p>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {!!testimonials?.items.length && (
            <section className="bg-white py-20 sm:py-28">
              <div className="container-x">
                <SectionHeading eyebrow="Ծնողների կարծիքներ" title="Ինչ են ասում ծնողները" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.items.map((t, i) => (
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
