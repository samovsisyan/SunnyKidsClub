import type { ReactNode } from 'react';
import { CloudSun, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-3xl', className)} />;
}

export function CardGridSkeleton({ count = 6, className = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3', item = 'h-80' }: { count?: number; className?: string; item?: string }) {
  return (
    <div className={className} aria-busy="true" aria-label="Բեռնվում է">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={item} />
      ))}
    </div>
  );
}

export function EmptyState({ title, text, icon, action, className }: { title: string; text?: string; icon?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mx-auto flex max-w-md flex-col items-center rounded-4xl border-2 border-dashed border-sun-200 bg-white/60 px-6 py-14 text-center', className)}>
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-sun-100 text-sun-600">{icon ?? <CloudSun className="h-8 w-8" strokeWidth={1.6} />}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {text && <p className="mt-2 text-ink-soft">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center rounded-4xl bg-peach-50 px-6 py-12 text-center ring-1 ring-peach-200">
      <h3 className="text-xl font-semibold">Չհաջողվեց բեռնել տվյալները</h3>
      <p className="mt-2 text-ink-soft">{message ?? 'Խնդրում ենք փորձել մի փոքր ուշ։'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Փորձել կրկին
        </Button>
      )}
    </div>
  );
}

export function FilterChips({ options, value, onChange, label }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'shrink-0 snap-start rounded-full px-5 py-2.5 text-sm font-bold transition duration-300',
            value === o.value ? 'bg-ink text-white shadow-soft' : 'bg-white text-ink-soft ring-1 ring-ink/8 hover:text-ink hover:ring-ink/20',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Էջեր">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          aria-current={p === page ? 'page' : undefined}
          className={clsx('h-10 min-w-10 rounded-full px-3 text-sm font-bold transition', p === page ? 'bg-ink text-white' : 'bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink')}
        >
          {p}
        </button>
      ))}
    </nav>
  );
}
