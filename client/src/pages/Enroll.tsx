import { CalendarCheck, ClipboardCheck, Phone, Smile } from 'lucide-react';
import clsx from 'clsx';
import { tone } from '@/lib/icons';
import { MessageForm } from '@/components/MessageForm';
import { Reveal } from '@/components/Reveal';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';

const STEPS = [
  { icon: ClipboardCheck, title: 'Լրացրեք հայտը', text: 'Ընդամենը մեկ րոպե' },
  { icon: Phone, title: 'Մենք կզանգահարենք', text: 'Կպատասխանենք Ձեր հարցերին' },
  { icon: CalendarCheck, title: 'Ծանոթության այց', text: 'Կտեսնեք մեր միջավայրը' },
  { icon: Smile, title: 'Բարի գալուստ', text: 'Մեղմ հարմարվողականություն' },
];

export default function Enroll() {
  return (
    <>
      <Seo title="Գրանցել երեխային" description="Լրացրեք հայտը, և մենք կկապվենք Ձեզ հետ։" />
      <PageHero eyebrow="Գրանցում" title="Գրանցել երեխային" description="Լրացրեք կարճ հայտը, և մենք կկապվենք Ձեզ հետ՝ ծանոթության այց պայմանավորվելու համար։" />
      <section className="container-x grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:self-start">
          {STEPS.map((s, i) => {
            const t = tone(i);
            return (
              <Reveal as="li" key={i} delay={i * 80} className="card flex items-center gap-4 p-5">
                <span className={clsx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', t.bg, t.fg)}>
                  <s.icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-ink-muted">Քայլ {i + 1}</span>
                  <span className="block font-bold">{s.title}</span>
                  <span className="block text-sm text-ink-soft">{s.text}</span>
                </span>
              </Reveal>
            );
          })}
        </ol>
        <Reveal delay={100} className="card p-6 sm:p-10">
          <MessageForm kind="ENROLLMENT" />
        </Reveal>
      </section>
    </>
  );
}
