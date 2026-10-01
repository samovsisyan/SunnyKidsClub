import clsx from 'clsx';

export function SunMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <g stroke="#F2B51F" strokeWidth="3.2" strokeLinecap="round">
        <path d="M24 4v5M24 39v5M4 24h5M39 24h5M9.9 9.9l3.5 3.5M34.6 34.6l3.5 3.5M9.9 38.1l3.5-3.5M34.6 13.4l3.5-3.5" />
      </g>
      <circle cx="24" cy="24" r="10" fill="#F6C445" />
      <path d="M19.5 25.5c1.2 1.8 2.7 2.7 4.5 2.7s3.3-.9 4.5-2.7" stroke="#8F6409" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <SunMark className="h-10 w-10 shrink-0 transition-transform duration-700 group-hover:rotate-45" />
      {!compact && (
        <span className="flex flex-col leading-none whitespace-nowrap">
          <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
            Sunny <span className="text-sun-500">Kids</span> Club
          </span>
          <span className="mt-1 text-xs font-semibold tracking-wide text-ink-muted">Մանկապարտեզ</span>
        </span>
      )}
    </span>
  );
}
