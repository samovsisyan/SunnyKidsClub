import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSite } from '@/hooks/usePublic';
import { socialHref, telHref, whatsappHref } from '@/lib/format';
import { LinkButton } from '@/components/Button';
import { MessageForm } from '@/components/MessageForm';
import { Reveal } from '@/components/Reveal';
import { PageHero } from '@/components/SectionHeading';
import { Seo } from '@/components/Seo';

/** Only allow Google Maps embeds (also enforced by the CSP frame-src). */
const safeMap = (url: string) => (/^https:\/\/(www\.)?google\.com\/maps\/embed/.test(url) || /^https:\/\/maps\.google\.com\//.test(url) ? url : '');

export default function Contact() {
  const { data } = useSite();
  const c = data?.contact;
  const rows = c
    ? [
        c.address && { icon: MapPin, label: 'Հասցե', value: c.address, href: /^https:\/\//.test(c.mapLink) ? c.mapLink : undefined },
        c.phone && { icon: Phone, label: 'Հեռախոս', value: [c.phone, c.phone2].filter(Boolean).join(', '), href: telHref(c.phone) },
        c.email && { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}` },
        c.instagram && { icon: Instagram, label: 'Instagram', value: c.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, ''), href: socialHref(c.instagram, 'https://instagram.com/') },
        c.facebook && { icon: Facebook, label: 'Facebook', value: 'Sunny Kids Club', href: socialHref(c.facebook, 'https://facebook.com/') },
        c.whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: 'Գրել WhatsApp-ով', href: whatsappHref(c.whatsapp) },
      ].filter(Boolean)
    : [];
  const map = c ? safeMap(c.mapEmbedUrl) : '';

  return (
    <>
      <Seo title="Կապ մեզ հետ" description="Հասցե, հեռախոս, աշխատանքային ժամեր և հետադարձ կապի ձև։" />
      <PageHero tone="sky" eyebrow="Կապ մեզ հետ" title="Ուրախ կլինենք ծանոթանալ" description="Գրեք կամ զանգահարեք մեզ, և մենք կպատասխանենք Ձեր բոլոր հարցերին։">
        <LinkButton to="/enroll" size="lg" className="mt-2">
          Գրանցել երեխային
        </LinkButton>
      </PageHero>
      <section className="container-x grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className="space-y-4">
          <div className="card divide-y divide-ink/5">
            {(rows as { icon: typeof Phone; label: string; value: string; href?: string }[]).map((r) => {
              const inner = (
                <>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun-100 text-sun-700">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold tracking-wide text-ink-muted uppercase">{r.label}</span>
                    <span className="block font-bold">{r.value}</span>
                  </span>
                </>
              );
              return r.href ? (
                <a key={r.label} href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-4 p-5 transition hover:bg-sun-50/60">
                  {inner}
                </a>
              ) : (
                <div key={r.label} className="flex items-center gap-4 p-5">
                  {inner}
                </div>
              );
            })}
          </div>
          {!!c?.workingHours?.length && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
                <Clock className="h-5 w-5 text-sky-500" /> Աշխատանքային ժամեր
              </h2>
              <dl className="mt-4 space-y-2">
                {c.workingHours.map((w, i) => (
                  <div key={i} className="flex justify-between gap-4 border-b border-dashed border-ink/10 pb-2 last:border-0">
                    <dt className="text-ink-soft">{w.days}</dt>
                    <dd className="font-bold">{w.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Reveal>
        <Reveal delay={100} className="card p-6 sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">Գրեք մեզ</h2>
          <p className="mt-2 mb-8 text-ink-soft">Լրացրեք ձևը, և մենք կկապվենք Ձեզ հետ։</p>
          <MessageForm />
        </Reveal>
      </section>
      {map && (
        <section className="container-x mt-10">
          <Reveal className="overflow-hidden rounded-[2rem] shadow-card">
            <iframe src={map} title="Sunny Kids Club — քարտեզ" className="h-[420px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </Reveal>
        </section>
      )}
    </>
  );
}
