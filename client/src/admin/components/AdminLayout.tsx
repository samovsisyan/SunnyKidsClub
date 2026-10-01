import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Apple, BookHeart, CalendarClock, Camera, ExternalLink, Film, Gift, HelpCircle, House, Images, LayoutDashboard, LogOut, Mail, Menu,
  MessageSquareQuote, Palette, PartyPopper, Phone, Settings, Sun, X,
} from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/Logo';
import { useAdmin } from '../api';
import { useAuth } from '../store/auth';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/about', label: 'Մեր մասին', icon: BookHeart },
  { to: '/admin/daily', label: 'Մեր առօրյան', icon: Sun },
  { to: '/admin/photos', label: 'Լուսանկարներ', icon: Camera },
  { to: '/admin/videos', label: 'Տեսանյութեր', icon: Film },
  { to: '/admin/activities', label: 'Զբաղմունքներ', icon: Palette },
  { to: '/admin/schedule', label: 'Օրվա ռեժիմ', icon: CalendarClock },
  { to: '/admin/events', label: 'Միջոցառումներ', icon: PartyPopper },
  { to: '/admin/promotions', label: 'Ակցիաներ', icon: Gift },
  { to: '/admin/gallery', label: 'Պատկերասրահ', icon: Images },
  { to: '/admin/environment', label: 'Մեր միջավայրը', icon: House },
  { to: '/admin/testimonials', label: 'Ծնողների կարծիքներ', icon: MessageSquareQuote },
  { to: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/admin/food', label: 'Սնունդ', icon: Apple },
  { to: '/admin/contact', label: 'Կապ', icon: Phone },
  { to: '/admin/messages', label: 'Հաղորդագրություններ', icon: Mail, badge: true },
  { to: '/admin/settings', label: 'Կայքի կարգավորումներ', icon: Settings },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = useAdmin<{ counts: { unreadMessages: number } }>('/stats', { refetchInterval: 60_000 });
  const unread = data?.counts.unreadMessages ?? 0;
  return (
    <nav aria-label="Ադմին մենյու" className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition', isActive ? 'bg-sun-100 text-ink' : 'text-ink-soft hover:bg-ink/5 hover:text-ink')
          }
        >
          <n.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
          <span className="flex-1 truncate">{n.label}</span>
          {n.badge && unread > 0 && <span className="rounded-full bg-leaf-500 px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  useEffect(() => setOpen(false), [pathname]);

  const footer = (
    <div className="mt-auto space-y-1 border-t border-ink/5 pt-4">
      <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink">
        <ExternalLink className="h-[18px] w-[18px]" /> Դիտել կայքը
      </a>
      <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-peach-50 hover:text-peach-600">
        <LogOut className="h-[18px] w-[18px]" /> Ելք
      </button>
      {user && <p className="truncate px-3 pt-1 text-xs text-ink-muted">{user.email}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF7F0]">
      <title>Ադմին վահանակ — Sunny Kids Club</title>
      <meta name="robots" content="noindex, nofollow" />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-ink/5 bg-white px-3 py-5 lg:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <Sidebar />
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/5 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-cream-100" aria-label="Բացել մենյուն">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-white px-3 py-4 shadow-lift">
            <div className="mb-4 flex items-center justify-between px-2">
              <Logo />
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink/5" aria-label="Փակել">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
            {footer}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
