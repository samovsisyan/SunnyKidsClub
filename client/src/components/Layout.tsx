import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, Clock, Facebook, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import clsx from 'clsx';
import { useSite } from '@/hooks/usePublic';
import { socialHref, telHref, whatsappHref } from '@/lib/format';
import { LinkButton } from './Button';
import { Logo } from './Logo';

type NavItem = { to: string; label: string; desc?: string };
type NavGroup = { label: string; children: NavItem[] };
const NAV: (NavItem | NavGroup)[] = [
  {
    label: 'Մեր մասին',
    children: [
      { to: '/about', label: 'Մեր մասին', desc: 'Մեր պատմությունը և փիլիսոփայությունը' },
      { to: '/activities', label: 'Մեր զբաղմունքները', desc: 'Նկարչություն, երաժշտություն, խաղեր' },
      { to: '/environment', label: 'Մեր միջավայրը', desc: 'Խմբասենյակներ, բակ, խաղահրապարակ' },
    ],
  },
  { to: '/daily-life', label: 'Մեր առօրյան' },
  { to: '/schedule', label: 'Օրվա ռեժիմ' },
  { to: '/events', label: 'Միջոցառումներ' },
  { to: '/gallery', label: 'Պատկերասրահ' },
  {
    label: 'Ծնողներին',
    children: [
      { to: '/parents', label: 'Ծնողների համար', desc: 'Օգտակար տեղեկություններ և ՀՏՀ' },
      { to: '/food', label: 'Սնունդ', desc: 'Ճաշացանկ և սննդակարգ' },
      { to: '/promotions', label: 'Ակցիաներ', desc: 'Հատուկ առաջարկներ' },
    ],
  },
  { to: '/contact', label: 'Կապ' },
];

const isGroup = (n: NavItem | NavGroup): n is NavGroup => 'children' in n;

function DesktopNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Գլխավոր մենյու" className="hidden items-center gap-0.5 desk:flex">
      {NAV.map((item) =>
        isGroup(item) ? (
          <div key={item.label} className="group relative">
            <button
              className={clsx(
                'flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-semibold transition',
                item.children.some((c) => pathname.startsWith(c.to)) ? 'text-ink' : 'text-ink-soft hover:text-ink',
              )}
              aria-haspopup="true"
            >
              {item.label}
              <ChevronDown className="h-4 w-4 transition group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>
            <div className="invisible absolute top-full left-1/2 w-80 -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="card p-2">
                {item.children.map((c) => (
                  <NavLink key={c.to} to={c.to} className={({ isActive }) => clsx('block rounded-2xl px-4 py-3 transition hover:bg-sun-50', isActive && 'bg-sun-50')}>
                    <span className="block font-bold text-ink">{c.label}</span>
                    {c.desc && <span className="block text-sm text-ink-muted">{c.desc}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx('whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-semibold transition', isActive ? 'bg-sun-100 text-ink' : 'text-ink-soft hover:text-ink')}
          >
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useSite();
  const contact = data?.contact;
  return (
    <div className={clsx('fixed inset-0 z-50 desk:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
      <div className={clsx('absolute inset-0 bg-ink/30 backdrop-blur-sm transition duration-300', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Մենյու"
        className={clsx(
          'absolute top-0 right-0 flex h-full w-full max-w-sm flex-col bg-cream shadow-lift transition duration-500 ease-[cubic-bezier(.22,1,.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Logo />
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-soft" aria-label="Փակել մենյուն">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 pb-6" aria-label="Մոբայլ մենյու">
          <NavLink to="/" end className={({ isActive }) => clsx('block rounded-2xl px-4 py-3 text-lg font-bold', isActive ? 'bg-sun-100' : '')}>
            Գլխավոր
          </NavLink>
          {NAV.map((item) =>
            isGroup(item) ? (
              <div key={item.label} className="mt-3">
                <p className="px-4 pt-2 pb-1 text-xs font-bold tracking-wider text-ink-muted uppercase">{item.label}</p>
                {item.children.map((c) => (
                  <NavLink key={c.to} to={c.to} className={({ isActive }) => clsx('block rounded-2xl px-4 py-3 text-lg font-bold', isActive ? 'bg-sun-100' : '')}>
                    {c.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => clsx('block rounded-2xl px-4 py-3 text-lg font-bold', isActive ? 'bg-sun-100' : '')}>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="space-y-3 border-t border-ink/5 p-5">
          <LinkButton to="/enroll" className="w-full" size="lg">
            Գրանցել երեխային
          </LinkButton>
          {contact?.phone && (
            <a href={telHref(contact.phone)} className="flex items-center justify-center gap-2 py-2 font-bold text-ink-soft">
              <Phone className="h-4 w-4" /> {contact.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <>
      <header className={clsx('fixed inset-x-0 top-0 z-40 transition duration-500', scrolled ? 'py-2' : 'py-4')}>
        <div className="container-x">
          <div
            className={clsx(
              'flex items-center justify-between gap-4 rounded-full px-3 py-2 transition duration-500 sm:px-4',
              scrolled ? 'bg-white/80 shadow-card ring-1 ring-ink/5 backdrop-blur-xl' : 'bg-transparent',
            )}
          >
            <Link to="/" className="group rounded-full pr-2" aria-label="Sunny Kids Club — Գլխավոր">
              <Logo />
            </Link>
            <DesktopNav />
            <div className="flex items-center gap-2">
              <span className="hidden sm:block">
                <LinkButton to="/enroll">Գրանցվել</LinkButton>
              </span>
              <button
                onClick={() => setOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-soft ring-1 ring-ink/5 desk:hidden"
                aria-label="Բացել մենյուն"
                aria-expanded={open}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Footer() {
  const { data } = useSite();
  const c = data?.contact;
  const socials = [
    c?.instagram && { href: socialHref(c.instagram, 'https://instagram.com/'), icon: Instagram, label: 'Instagram' },
    c?.facebook && { href: socialHref(c.facebook, 'https://facebook.com/'), icon: Facebook, label: 'Facebook' },
    c?.whatsapp && { href: whatsappHref(c.whatsapp), icon: MessageCircle, label: 'WhatsApp' },
  ].filter(Boolean) as { href: string; icon: typeof Instagram; label: string }[];

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white/80">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-sun-400/10 blur-3xl" />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="[&_span]:!text-white [&_.text-sun-500]:!text-sun-400">
            <Logo />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">{data?.site.slogan}</p>
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-sun-400 hover:text-ink">
                  <s.icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Բաժիններ</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {[
              ['/about', 'Մեր մասին'],
              ['/daily-life', 'Մեր առօրյան'],
              ['/activities', 'Զբաղմունքներ'],
              ['/schedule', 'Օրվա ռեժիմ'],
              ['/events', 'Միջոցառումներ'],
              ['/gallery', 'Պատկերասրահ'],
              ['/food', 'Սնունդ'],
              ['/parents', 'Ծնողներին'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="transition hover:text-sun-300">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Կապ</h2>
          <ul className="space-y-3 text-sm">
            {c?.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {c.address}
              </li>
            )}
            {c?.phone && (
              <li>
                <a href={telHref(c.phone)} className="flex gap-3 transition hover:text-sun-300">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {c.phone}
                </a>
              </li>
            )}
            {c?.email && (
              <li>
                <a href={`mailto:${c.email}`} className="flex gap-3 transition hover:text-sun-300">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {c.email}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Աշխատանքային ժամեր</h2>
          <ul className="space-y-2.5 text-sm">
            {c?.workingHours?.map((w, i) => (
              <li key={i} className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" />
                <span>
                  <span className="block text-white/60">{w.days}</span>
                  <span className="font-bold text-white">{w.hours}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Sunny Kids Club. Բոլոր իրավունքները պաշտպանված են։</p>
          <p>Երեխաների լուսանկարները հրապարակվում են ծնողների համաձայնությամբ։</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-card">
        Անցնել բովանդակությանը
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
