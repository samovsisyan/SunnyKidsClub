import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import { useUi } from '../store/ui';

export const inputCls =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] text-ink ring-1 ring-ink/12 transition placeholder:text-ink-muted/70 focus:ring-2 focus:ring-sun-400 focus:outline-none disabled:bg-cream-100 aria-[invalid=true]:ring-peach-400';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-soft sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, className, actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={clsx('rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink/5 sm:p-6', className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-sans text-lg font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, help, error, children, required, className }: { label: string; help?: ReactNode; error?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={clsx('block', className)}>
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">
        {label}
        {required && <span className="text-peach-500"> *</span>}
      </span>
      {children}
      {help && !error && <span className="mt-1 block text-xs text-ink-muted">{help}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-peach-600">{error}</span>}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <label htmlFor={id} className={clsx('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-leaf-500' : 'bg-ink/15')}
      >
        <span className={clsx('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-bold">{label}</span>}
          {description && <span className="block text-xs text-ink-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

type BadgeTone = 'green' | 'gray' | 'yellow' | 'blue' | 'red' | 'pink';
const badgeTones: Record<BadgeTone, string> = {
  green: 'bg-leaf-100 text-leaf-700',
  gray: 'bg-ink/8 text-ink-soft',
  yellow: 'bg-sun-100 text-sun-700',
  blue: 'bg-sky-100 text-sky-700',
  red: 'bg-peach-100 text-peach-600',
  pink: 'bg-blush-100 text-blush-500',
};
export function Badge({ tone = 'gray', children, icon }: { tone?: BadgeTone; children: ReactNode; icon?: ReactNode }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', badgeTones[tone])}>{icon}{children}</span>;
}

export function IconBtn({ label, onClick, children, danger, disabled, className }: { label: string; onClick?: () => void; children: ReactNode; danger?: boolean; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition disabled:opacity-30',
        danger ? 'text-peach-600 hover:bg-peach-50' : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-5 w-5 animate-spin text-sun-500', className)} />;
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="Բեռնվում է">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-2xl', lg: 'sm:max-w-4xl', xl: 'sm:max-w-6xl' };
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={clsx('relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-cream shadow-lift sm:rounded-3xl', widths[size])}>
        <div className="flex items-center justify-between gap-4 border-b border-ink/5 bg-white px-5 py-4 sm:px-6">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <IconBtn label="Փակել" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconBtn>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink/5 bg-white px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmHost() {
  const req = useUi((s) => s.confirmReq);
  const set = useUi((s) => s.setConfirm);
  const close = (ok: boolean) => {
    req?.resolve(ok);
    set(null);
  };
  return (
    <Modal
      open={!!req}
      onClose={() => close(false)}
      title={req?.title ?? ''}
      size="sm"
      footer={
        <>
          <button type="button" onClick={() => close(false)} className="rounded-full px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
            Չեղարկել
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={clsx('rounded-full px-5 py-2.5 text-sm font-bold', req?.danger ? 'bg-peach-500 text-white hover:bg-peach-600' : 'bg-sun-400 text-ink hover:bg-sun-300')}
          >
            {req?.confirmLabel ?? 'Հաստատել'}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', req?.danger ? 'bg-peach-100 text-peach-600' : 'bg-sun-100 text-sun-700')}>
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="pt-2 text-ink-soft">{req?.message ?? 'Համոզվա՞ծ եք։'}</p>
      </div>
    </Modal>
  );
}

export function ToastHost() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return createPortal(
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[90] flex flex-col items-end gap-2 sm:left-auto" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift ring-1 [animation-duration:.35s]',
            t.kind === 'success' && 'bg-white text-ink ring-leaf-200',
            t.kind === 'error' && 'bg-peach-50 text-peach-600 ring-peach-200',
            t.kind === 'info' && 'bg-white text-ink ring-sky-200',
          )}
        >
          {t.kind === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf-500" />}
          {t.kind === 'error' && <AlertTriangle className="h-5 w-5 shrink-0" />}
          {t.kind === 'info' && <Info className="h-5 w-5 shrink-0 text-sky-500" />}
          <span className="flex-1 pt-0.5">{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Փակել" className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function EmptyBox({ title, text, action, icon }: { title: string; text?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-ink/10 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sun-100 text-sun-600">{icon}</div>}
      <h3 className="font-sans text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-3xl bg-peach-50 px-6 py-10 text-center ring-1 ring-peach-200">
      <AlertTriangle className="h-8 w-8 text-peach-500" />
      <p className="mt-3 font-bold">Չհաջողվեց բեռնել տվյալները</p>
      {message && <p className="mt-1 text-sm text-ink-soft">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-ink/10 hover:ring-ink/20">
          Փորձել կրկին
        </button>
      )}
    </div>
  );
}
